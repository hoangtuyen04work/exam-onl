/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
// react-query is available in the project; this page uses direct API calls for clarity
import { Clock, CheckCircle, AlertCircle, Maximize2 } from 'lucide-react'
import studentApi from '../../../api/student-api'
import { useFullScreen } from '../../../hooks/useFullScreen'
import type { ExamSessionContent } from '../../../types/examSession'

export default function ExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.auth.user)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(3600) // seconds
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [examSessionStudentId, setExamSessionStudentId] = useState<number | null>(null)
  const autoSaveRef = useRef<number | null>(null)

  const parsedId = Number(examId)
  const [isLoading, setIsLoading] = useState(false)
  const [exam, setExam] = useState<ExamSessionContent | undefined>(undefined)
  const [examStatus, setExamStatus] = useState<'not-started' | 'expired' | 'available' | null>(null)

  useEffect(() => {
    if (!parsedId) return
    let cancelled = false
    setIsLoading(true)
    studentApi
      .doExam(parsedId)
      .then((res: any) => {
        if (cancelled) return
        if (res?.success) {
          const examData = res.data

          // Check if exam was already submitted
          if (examData.submitted) {
            navigate(`/exam/${parsedId}/result`, {
              state: { result: examData.result },
              replace: true
            })
            return
          }

          // Check exam status
          const now = new Date()
          const startTime = new Date(examData.startTime)
          const endTime = new Date(examData.endTime)

          if (now < startTime) {
            setExamStatus('not-started')
            return
          }

          if (now > endTime) {
            setExamStatus('expired')
            return
          }

          setExamStatus('available')
          setExam(examData)
        } else {
          throw new Error(res?.message || 'Không thể tải đề thi')
        }
      })
      .catch(() => {
        setExam(undefined)
        setExamStatus(null)
      })
      .finally(() => setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [parsedId, navigate])

  // Fullscreen logic
  const handleEndExamForced = useCallback(() => {
    if (isExamStarted) {
      setIsExamStarted(false)
      toast.error('Bạn đã thoát chế độ toàn màn hình — bài thi kết thúc!')
      // record exit event if possible
      if (examSessionStudentId) {
        studentApi.exitEvent({ examSessionStudentId, eventTime: new Date().toISOString() }).catch(() => {})
      }
      setTimeout(() => navigate('/student'), 1500)
    }
  }, [isExamStarted, navigate, examSessionStudentId])

  const { requestFullscreen, exitFullscreen } = useFullScreen({
    onExit: handleEndExamForced,
    enabled: true,
    requiredFullscreen: true
  })

  const handleSubmitExam = useCallback(
    async (isAutoSubmit = false) => {
      if (!exam) return false

      const totalQuestions = exam.questions?.length || 0
      const answeredQuestions = Object.keys(answers).length
      const unansweredQuestions = totalQuestions - answeredQuestions

      if (!isAutoSubmit && unansweredQuestions > 0) {
        const confirmSubmit = window.confirm(
          `Bạn còn ${unansweredQuestions} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`
        )
        if (!confirmSubmit) return false
      }

      try {
        const payload = {
          examSessionId: parsedId,
          questions: Object.entries(answers).map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId })),
          isAutoSubmit
        }
        const res = await studentApi.submitExam('FINAL', payload)
        if (res?.success) {
          setIsExamStarted(false)
          await exitFullscreen()
          const resultData = res.data
          if (resultData?.examSessionStudentId) setExamSessionStudentId(resultData.examSessionStudentId)

          // Clear intervals
          if (autoSaveRef.current) {
            clearInterval(autoSaveRef.current)
            autoSaveRef.current = null
          }

          // Show submission message
          if (isAutoSubmit) {
            toast.warning('Hết thời gian làm bài - Bài thi đã được nộp tự động!')
          } else {
            toast.success('Nộp bài thành công!')
          }

          // Navigate to result page with time spent
          const timeSpent = exam.durationMinutes * 60 - timeLeft
          navigate(`/exam/${parsedId}/result`, {
            state: {
              result: {
                ...resultData,
                timeSpent
              }
            },
            replace: true // Replace current route to prevent going back
          })
          return true
        } else {
          throw new Error(res?.message || 'Không thể nộp bài')
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Lỗi khi nộp bài'
        toast.error(msg)
        return false
      }
    },
    [exam, answers, exitFullscreen, navigate, parsedId, timeLeft, autoSaveRef]
  )

  useEffect(() => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập trước!')
      navigate('/login')
      return
    }

    if (!exam) {
      // doExam query will handle errors
      return
    }

    // Timer countdown - on start we'll set timeLeft based on duration
    let timer: number | null = null

    if (isExamStarted) {
      const durationSec = (exam.durationMinutes || 0) * 60
      setTimeLeft((prev) => (prev > 0 ? prev : durationSec))

      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam(true) // Auto submit when time runs out
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // auto-save draft every 30s
      autoSaveRef.current = window.setInterval(async () => {
        try {
          const payload = {
            examSessionId: parsedId,
            questions: Object.entries(answers).map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
          }
          if (payload.questions.length > 0) {
            await studentApi.submitExam('DRAFT', payload)
            toast.info('Đã tự động lưu tạm (draft)')
          }
        } catch {
          // ignore auto-save errors
        }
      }, 30_000)
    }

    return () => {
      if (timer) clearInterval(timer)
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
        autoSaveRef.current = null
      }
    }
  }, [user, exam, navigate, isExamStarted, handleSubmitExam, answers, parsedId])

  // send exit event if user leaves page
  useEffect(() => {
    const onBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (examSessionStudentId) {
        try {
          await studentApi.exitEvent({ examSessionStudentId, eventTime: new Date().toISOString() })
        } catch {
          // ignore
        }
      }
      delete e.returnValue
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [examSessionStudentId])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: number, answerId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId
    }))
  }

  const handleStartExam = async () => {
    const success = await requestFullscreen()
    if (success) {
      setIsExamStarted(true)
      toast.success('Bắt đầu làm bài thi!')
    } else {
      toast.error('Trình duyệt chặn chế độ toàn màn hình. Hãy cho phép fullscreen thủ công hoặc thử lại.')
    }
  }

  const handleExitExam = async () => {
    setIsExamStarted(false)
    await exitFullscreen()
    try {
      if (examSessionStudentId) {
        await studentApi.exitEvent({ examSessionStudentId, eventTime: new Date().toISOString() })
      }
    } catch {
      // ignore
    }
    navigate('/student')
    toast.info('Bạn đã chủ động kết thúc/thoát khỏi bài thi.')
  }

  const handleNextQuestion = () => {
    if (currentQuestion < (exam?.questions?.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

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
          <p className='text-gray-600 mb-4'>
            {examStatus === null
              ? 'Có lỗi xảy ra khi tải bài thi. Vui lòng thử lại sau.'
              : 'Bài thi không tồn tại hoặc đã bị xóa.'}
          </p>
          <button
            onClick={() => navigate('/student')}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  // Màn hình hiển thị trạng thái và bắt đầu thi
  if (!isExamStarted) {
    const now = new Date()
    const startTime = new Date(exam.startTime)
    const endTime = new Date(exam.endTime)

    const getStatusInfo = () => {
      if (now < startTime) {
        const timeToStart = Math.floor((startTime.getTime() - now.getTime()) / (60 * 1000))
        return {
          color: 'yellow',
          icon: '⏳',
          title: 'Bài thi chưa bắt đầu',
          message: `Bài thi sẽ bắt đầu sau ${timeToStart} phút nữa`,
          canStart: false
        }
      }
      if (now > endTime) {
        return {
          color: 'red',
          icon: '⚠️',
          title: 'Bài thi đã kết thúc',
          message: 'Bài thi không còn khả dụng',
          canStart: false
        }
      }
      return {
        color: 'green',
        icon: '✅',
        title: 'Bài thi đang diễn ra',
        message: 'Bạn có thể bắt đầu làm bài',
        canStart: true
      }
    }

    const status = getStatusInfo()
    const statusColorClass = {
      green: 'bg-green-50 border-green-200 text-green-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800'
    }[status.color]

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-800 mb-4'>{exam.examName}</h1>

            {/* Status Banner */}
            <div className={`border rounded-lg p-4 mb-6 ${statusColorClass}`}>
              <div className='text-2xl mb-2'>{status.icon}</div>
              <h2 className='text-lg font-semibold mb-1'>{status.title}</h2>
              <p>{status.message}</p>
            </div>

            {/* Exam Info */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
              <h2 className='text-lg font-semibold text-blue-800 mb-2'>Thông tin bài thi</h2>
              <div className='grid grid-cols-2 gap-4 text-sm text-blue-700'>
                <div>
                  <span className='font-medium'>Thời gian:</span> {exam.durationMinutes} phút
                </div>
                <div>
                  <span className='font-medium'>Số câu hỏi:</span> {exam.questions?.length || 0}
                </div>
                <div>
                  <span className='font-medium'>Thí sinh:</span> {user?.name}
                </div>
                <div>
                  <span className='font-medium'>Mã thí sinh:</span> {user?.studentId}
                </div>
                <div>
                  <span className='font-medium'>Bắt đầu:</span> {new Date(exam.startTime).toLocaleString('vi-VN')}
                </div>
                <div>
                  <span className='font-medium'>Kết thúc:</span> {new Date(exam.endTime).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Notes */}
            {status.canStart && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
                <h3 className='font-semibold text-yellow-800 mb-2'>⚠️ Lưu ý quan trọng</h3>
                <ul className='text-sm text-yellow-700 text-left space-y-1'>
                  <li>• Bài thi sẽ chạy ở chế độ toàn màn hình</li>
                  <li>• Không được thoát khỏi chế độ toàn màn hình trong quá trình thi</li>
                  <li>• Thời gian thi sẽ được tính từ khi bắt đầu</li>
                  <li>• Hãy đảm bảo kết nối internet ổn định</li>
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex justify-center space-x-4'>
            <button
              onClick={() => navigate('/student')}
              className='bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition'
            >
              Quay lại
            </button>
            {status.canStart && (
              <button
                onClick={handleStartExam}
                className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2'
              >
                <Maximize2 className='w-4 h-4' />
                <span>Bắt đầu thi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = exam.questions?.[currentQuestion]
  const totalQuestions = exam.questions?.length || 0

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='max-w-6xl mx-auto flex justify-between items-center'>
          <div>
            <h1 className='text-xl font-semibold text-gray-800'>{exam.examName}</h1>
            <p className='text-sm text-gray-600'>
              Thí sinh: {user?.name} - {user?.studentId}
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2 text-red-600'>
              <Clock className='w-5 h-5' />
              <span className='font-mono text-lg font-semibold'>{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={handleExitExam}
              className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 mr-2'
            >
              <span>Thoát thi</span>
            </button>
            <button
              onClick={() => handleSubmitExam(false)}
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2'
            >
              <CheckCircle className='w-4 h-4' />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Question Navigation */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-md p-4 sticky top-8'>
              <h3 className='font-semibold text-gray-800 mb-4'>Danh sách câu hỏi</h3>
              <div className='grid grid-cols-5 gap-2'>
                {Array.from({ length: totalQuestions }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                      index === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : answers[exam.questions?.[index]?.questionId || 0]
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className='mt-4 text-xs text-gray-600'>
                <div className='flex items-center space-x-2 mb-1'>
                  <div className='w-3 h-3 bg-blue-600 rounded'></div>
                  <span>Đang làm</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-green-100 border border-green-300 rounded'></div>
                  <span>Đã trả lời</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className='lg:col-span-3'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-lg font-semibold text-gray-800'>
                  Câu {currentQuestion + 1} / {totalQuestions}
                </h2>
                <span className='text-sm text-gray-500'>{currentQ?.difficulty || ''}</span>
              </div>

              {currentQ && (
                <div className='space-y-6'>
                  <div className='prose max-w-none'>
                    <p className='text-gray-800 leading-relaxed'>{currentQ.content}</p>
                  </div>

                  {currentQ.answers && (
                    <div className='space-y-3'>
                      {currentQ.answers.map((option) => (
                        <label
                          key={option.answerId}
                          className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer'
                        >
                          <input
                            type='radio'
                            name={`question-${currentQ.questionId}`}
                            value={option.answerId}
                            checked={answers[currentQ.questionId] === option.answerId}
                            onChange={() => handleAnswerChange(currentQ.questionId, option.answerId)}
                            className='w-4 h-4 text-blue-600'
                          />
                          <span className='text-gray-700'>{option.content}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className='flex justify-between mt-8 pt-6 border-t border-gray-200'>
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Câu trước
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === totalQuestions - 1}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Câu tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {examStatus === 'not-started' && (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Bài thi chưa bắt đầu</h2>
            <p className='text-gray-600 mb-4'>Vui lòng quay lại sau khi bài thi bắt đầu.</p>
            <div className='flex justify-center'>
              <button
                onClick={() => navigate('/student')}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
              >
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {examStatus === 'expired' && (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Bài thi đã kết thúc</h2>
            <p className='text-gray-600 mb-4'>Bài thi không còn khả dụng.</p>
            <div className='flex justify-center'>
              <button
                onClick={() => navigate('/student')}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
              >
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
