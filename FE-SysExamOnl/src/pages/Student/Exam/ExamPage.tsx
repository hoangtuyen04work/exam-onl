/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Clock, CheckCircle, AlertCircle, Maximize2 } from 'lucide-react'
import studentApi from '../../../api/student-api'
import { useFullScreen } from '../../../hooks/useFullScreen'
import { getStompClient } from '../../../utils/websocket' // ← Thêm dòng này
import type { ExamSessionContent } from '../../../types/examSession'

type StudentEventType = 'ENTER' | 'LEAVE' | 'FOCUS_LOST' | 'FOCUS_GAINED' | 'SUBMIT'

export default function ExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.auth.user)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(3600)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [examSessionStudentId, setExamSessionStudentId] = useState<number | null>(null)
  const [examSessionId, setExamSessionId] = useState<number | null>(null) // ← Để gửi event

  const autoSaveRef = useRef<number | null>(null)
  const hasStarted = useRef(false)
  const hasSubmitted = useRef(false)
  const examDataRef = useRef<ExamSessionContent | null>(null)

  const parsedId = Number(examId)
  const [isLoading, setIsLoading] = useState(false)
  const [exam, setExam] = useState<ExamSessionContent | undefined>(undefined)
  const [examStatus, setExamStatus] = useState<'not-started' | 'expired' | 'available' | null>(null)

  // ==================== WEBSOCKET SEND EVENT ====================
  const sendStudentEvent = useCallback((type: StudentEventType) => {
    if (!examSessionId) return

    const client = getStompClient()
    if (client.connected) {
      client.publish({
        destination: '/app/student/event',
        body: JSON.stringify({
          examSessionId: examSessionId,
          type,
        }),
      })
    } else {
      // Nếu chưa kết nối, thử lại sau 1s (đảm bảo event không bị mất)
      setTimeout(() => sendStudentEvent(type), 1000)
    }
  }, [examSessionId])

  // ==================== DO EXAM ====================
  useEffect(() => {
    if (!parsedId || hasStarted.current) return
    hasStarted.current = true
    setIsLoading(true)

    studentApi
      .doExam(parsedId)
      .then((res: any) => {
        if (res?.success) {
          const examData = res.data
          examDataRef.current = examData

          if (examData.submitted) {
            navigate(`/exam/${parsedId}/result`, { replace: true })
            return
          }

          setExam(examData)
          setExamSessionId(examData.examSessionId) // ← Lưu để gửi event
          setExamStatus('available')
        } else {
          toast.error(res?.message || 'Không thể tải đề thi')
        }
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Lỗi tải bài thi')
      })
      .finally(() => setIsLoading(false))
  }, [parsedId, navigate])

  // ==================== FULLSCREEN ====================
  const handleEndExamForced = useCallback(() => {
    if (isExamStarted) {
      sendStudentEvent('LEAVE')
      setIsExamStarted(false)
      toast.error('Bạn đã thoát chế độ toàn màn hình — bài thi kết thúc!')
      if (examSessionStudentId) {
        studentApi.exitEvent({ examSessionStudentId, eventTime: new Date().toISOString() }).catch(() => {})
      }
      setTimeout(() => navigate('/student'), 1500)
    }
  }, [isExamStarted, navigate, examSessionStudentId, sendStudentEvent])

  const { requestFullscreen, exitFullscreen } = useFullScreen({
    onExit: handleEndExamForced,
    enabled: true,
    requiredFullscreen: true,
  })

  // ==================== SUBMIT EXAM ====================
  const handleSubmitExam = useCallback(
    async (isAutoSubmit = false) => {
      if (!exam || hasSubmitted.current) return false
      hasSubmitted.current = true

      const totalQuestions = exam.questions?.length || 0
      const answeredQuestions = Object.keys(answers).length
      const unansweredQuestions = totalQuestions - answeredQuestions

      if (!isAutoSubmit && unansweredQuestions > 0) {
        const confirmSubmit = window.confirm(`Bạn còn ${unansweredQuestions} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`)
        if (!confirmSubmit) {
          hasSubmitted.current = false
          return false
        }
      }

      const payload: any = {
        examSessionId: parsedId,
        questions: Object.entries(answers)
          .filter(([_, aId]) => aId != null)
          .map(([qId, aId]) => ({
            questionId: Number(qId),
            answerId: aId,
          })),
      }

      if (isAutoSubmit) payload.isAutoSubmit = true

      try {
        const res = await studentApi.submitExam(isAutoSubmit ? 'FINAL' : 'FINAL', payload)

        if (res?.success) {
          // Gửi event SUBMIT realtime cho giáo viên
          sendStudentEvent('SUBMIT')

          setIsExamStarted(false)
          await exitFullscreen()

          if (res.data?.examSessionStudentId) {
            setExamSessionStudentId(res.data.examSessionStudentId)
          }

          if (autoSaveRef.current) {
            clearInterval(autoSaveRef.current)
            autoSaveRef.current = null
          }

          if (isAutoSubmit) {
            toast.warning('Hết thời gian — bài thi đã nộp tự động!')
          } else {
            toast.success('Nộp bài thành công!')
          }

          const timeSpent = exam.durationMinutes * 60 - timeLeft
          navigate(`/exam/${parsedId}/result`, {
            state: { result: { ...res.data, timeSpent } },
            replace: true,
          })
          return true
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Lỗi nộp bài')
        hasSubmitted.current = false
      }
      return false
    },
    [exam, answers, parsedId, timeLeft, exitFullscreen, navigate, sendStudentEvent]
  )

  // ==================== TIMER + AUTO SAVE ====================
  useEffect(() => {
    if (!user || !exam || !isExamStarted) return

    const durationSec = (exam.durationMinutes || 0) * 60
    setTimeLeft((prev) => (prev > 0 ? prev : durationSec))

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    autoSaveRef.current = window.setInterval(async () => {
      try {
        const payload = {
          examSessionId: parsedId,
          questions: Object.entries(answers)
            .filter(([_, aId]) => aId != null)
            .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId })),
        }
        if (payload.questions.length > 0) {
          await studentApi.submitExam('DRAFT', payload)
          toast.info('Đã lưu tạm')
        }
      } catch {}
    }, 30_000)

    return () => {
      clearInterval(timer)
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [user, exam, isExamStarted, answers, parsedId, handleSubmitExam])

  // ==================== FOCUS LOST / GAINED ====================
  useEffect(() => {
    if (!isExamStarted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendStudentEvent('FOCUS_LOST')
      } else {
        sendStudentEvent('FOCUS_GAINED')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isExamStarted, sendStudentEvent])

  // ==================== EXIT EVENT (beforeunload) ====================
  useEffect(() => {
    const onBeforeUnload = () => {
      if (examSessionStudentId) {
        studentApi.exitEvent({ examSessionStudentId, eventTime: new Date().toISOString() }).catch(() => {})
      }
      if (isExamStarted) {
        sendStudentEvent('LEAVE')
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [examSessionStudentId, isExamStarted, sendStudentEvent])

  // ==================== CLEANUP KHI RỜI COMPONENT ====================
  useEffect(() => {
    return () => {
      if (isExamStarted && examSessionId) {
        sendStudentEvent('LEAVE')
      }
    }
  }, [])

  // ==================== HELPER ====================
  const formatTime = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const handleAnswerChange = (qId: number, aId: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: aId }))
  }

  const handleStartExam = async () => {
    const success = await requestFullscreen()
    if (success) {
      setIsExamStarted(true)
      sendStudentEvent('ENTER') // ← Gửi ENTER ngay khi bắt đầu
      toast.success('Bắt đầu làm bài!')
    } else {
      toast.error('Vui lòng cho phép toàn màn hình.')
    }
  }

  const handleExitExam = async () => {
    sendStudentEvent('LEAVE')
    setIsExamStarted(false)
    await exitFullscreen()
    if (examSessionStudentId) {
      await studentApi.exitEvent({ examSessionStudentId, eventTime: new Date().toISOString() }).catch(() => {})
    }
    navigate('/student')
    toast.info('Đã thoát bài thi.')
  }

  const handleNext = () => {
    if (currentQuestion < (exam?.questions?.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải bài thi...</p>
        </div>
      </div>
    )
  }

  if (!exam || !examStatus) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>Không thể tải bài thi</h2>
          <button onClick={() => navigate('/student')} className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'>
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  // Trước khi bắt đầu
  if (!isExamStarted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full'>
          <h1 className='text-3xl font-bold text-center mb-6'>{exam.examName}</h1>

          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
            <p className='text-green-800 text-center'>Bài thi đã sẵn sàng!</p>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm'>
            <div><strong>Thời gian:</strong> {exam.durationMinutes} phút</div>
            <div><strong>Số câu:</strong> {exam.questions?.length || 0}</div>
            <div><strong>Thí sinh:</strong> {user?.name}</div>
          </div>

          <div className='flex justify-center space-x-4'>
            <button onClick={() => navigate('/student')} className='bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600'>
              Quay lại
            </button>
            <button onClick={handleStartExam} className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2'>
              <Maximize2 className='w-4 h-4' />
              <span>Bắt đầu thi</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Giao diện làm bài
  const currentQ = exam.questions?.[currentQuestion]
  const total = exam.questions?.length || 0

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-white border-b px-6 py-4'>
        <div className='max-w-6xl mx-auto flex justify-between items-center'>
          <div>
            <h1 className='text-xl font-semibold'>{exam.examName}</h1>
            <p className='text-sm text-gray-600'>Thí sinh: {user?.name}</p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2 text-red-600'>
              <Clock className='w-5 h-5' />
              <span className='font-mono text-lg font-semibold'>{formatTime(timeLeft)}</span>
            </div>
            <button onClick={handleExitExam} className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700'>
              Thoát
            </button>
            <button onClick={() => handleSubmitExam(false)} className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2'>
              <CheckCircle className='w-4 h-4' />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow p-4 sticky top-8'>
              <h3 className='font-semibold mb-4'>Câu hỏi</h3>
              <div className='grid grid-cols-5 gap-2'>
                {Array.from({ length: total }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-10 h-10 rounded text-sm font-medium transition ${
                      i === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : answers[exam.questions?.[i]?.questionId || 0]
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='lg:col-span-3'>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-lg font-semibold'>
                  Câu {currentQuestion + 1} / {total}
                </h2>
                <span className='text-sm text-gray-500'>{currentQ?.difficulty}</span>
              </div>

              {currentQ && (
                <>
                  <p className='text-gray-800 mb-6 leading-relaxed'>{currentQ.content}</p>
                  <div className='space-y-3'>
                    {currentQ.answers.map((opt) => (
                      <label
                        key={opt.answerId}
                        className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'
                      >
                        <input
                          type='radio'
                          name={`q-${currentQ.questionId}`}
                          checked={answers[currentQ.questionId] === opt.answerId}
                          onChange={() => handleAnswerChange(currentQ.questionId, opt.answerId)}
                          className='w-4 h-4 text-blue-600'
                        />
                        <span className='text-gray-700'>{opt.content}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className='flex justify-between mt-8 pt-6 border-t'>
                <button
                  onClick={handlePrev}
                  disabled={currentQuestion === 0}
                  className='px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                >
                  Câu trước
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentQuestion === total - 1}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
                >
                  Câu tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}