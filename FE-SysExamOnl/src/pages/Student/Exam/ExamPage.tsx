/* eslint-disable @typescript-eslint/no-explicit-any */
// cspell:disable-next-line
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { AlertCircle, Maximize2, PlayCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { studentApi, type SubmitPayload } from '../../../api/student-api'
import { useFullScreen } from '../../../hooks/useFullScreen'

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.auth.user)

  const examSessionId = examId ? Number(examId) : null

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [examSessionStudentId] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [examName, setExamName] = useState<string>('')

  const autoSaveRef = useRef<number | null>(null)
  const hasSubmitted = useRef(false)
  const answersRef = useRef<Record<number, number>>({})

  // Cập nhật ref mỗi khi answers thay đổi
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // === 1. LOAD EXAM DATA ===
  const {
    data: examData,
    isLoading: isExamLoading,
    isError: isExamError,
    refetch: refetchExam
  } = useQuery({
    queryKey: ['doExam', examSessionId],
    queryFn: () => studentApi.doExam(examSessionId!),
    enabled: !!examSessionId,
    retry: false
  })

  const exam = examData?.data

  // === LOAD JOIN EXAM INFO FROM LOCALSTORAGE ===
  useEffect(() => {
    if (examSessionId) {
      const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
      if (savedInfo) {
        try {
          const info = JSON.parse(savedInfo)
          setDurationMinutes(info.durationMinutes || 0)
          setExamName(info.name || '')

          // Restore startedAt nếu đã bắt đầu làm bài trước đó
          if (info.startedAt) {
            const savedStartedAt = new Date(info.startedAt)
            setStartedAt(savedStartedAt)
            // Tính toán timeLeft dựa trên startedAt đã lưu
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - savedStartedAt.getTime()) / 1000)
            const totalSeconds = (info.durationMinutes || 0) * 60
            const remaining = Math.max(0, totalSeconds - elapsed)
            setTimeLeft(remaining)
          }
        } catch (e) {
          console.error('Error parsing saved exam info:', e)
        }
      }
    }
  }, [examSessionId])

  // === MUTATIONS ===
  const submitMutation = useMutation({
    mutationFn: ({ state, payload }: { state: 'DRAFT' | 'FINAL'; payload: SubmitPayload }) =>
      studentApi.submitExam(state, payload),
    onSuccess: (_, { state }) => {
      if (state === 'DRAFT') {
        // Không hiển thị toast cho DRAFT để tránh spam
      } else {
        toast.success('Nộp bài thành công!')
      }
    },
    onError: () => toast.error('Lỗi lưu bài')
  })

  const exitMutation = useMutation({
    mutationFn: studentApi.exitEvent
  })

  // === FULLSCREEN ===
  const handleEndExamForced = useCallback(() => {
    if (examSessionStudentId) {
      exitMutation.mutate({ examSessionStudentId, eventTime: new Date().toISOString() })
      toast.error('Thoát toàn màn hình — bài thi kết thúc!')
      setTimeout(() => navigate('/student'), 1500)
    }
  }, [examSessionStudentId, exitMutation, navigate])

  const { requestFullscreen, exitFullscreen } = useFullScreen({
    onExit: handleEndExamForced,
    enabled: true,
    requiredFullscreen: true
  })

  const submitExam = useCallback(
    (state: 'DRAFT' | 'FINAL') => {
      if (!examSessionId || (hasSubmitted.current && state === 'FINAL')) return
      if (state === 'FINAL') hasSubmitted.current = true

      const payload: SubmitPayload = {
        examSessionId,
        questions: Object.entries(answers)
          .filter(([, aId]) => aId != null)
          .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
      }

      submitMutation.mutate(
        { state, payload },
        {
          onSuccess: () => {
            // Lưu answers vào localStorage sau khi save thành công
            if (state === 'DRAFT') {
              const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
              if (savedInfo) {
                try {
                  const info = JSON.parse(savedInfo)
                  localStorage.setItem(
                    `exam_${examSessionId}`,
                    JSON.stringify({
                      ...info,
                      savedAnswers: answers,
                      lastSavedAt: new Date().toISOString()
                    })
                  )
                } catch (e) {
                  console.error('Error saving answers to localStorage:', e)
                }
              }
            }
          }
        }
      )

      if (state === 'FINAL') {
        setIsExamStarted(false)
        exitFullscreen()
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current)
          autoSaveRef.current = null
        }
        // Xóa thông tin đã lưu
        localStorage.removeItem(`exam_${examSessionId}`)
        navigate(`/student/exam/${examSessionId}/result`, { replace: true })
      }
    },
    [examSessionId, answers, navigate, submitMutation, exitFullscreen]
  )

  useEffect(() => {
    if (exam && exam.questions) {
      setExamName(exam.name)

      const restoredAnswers: Record<number, number> = {}
      exam.questions.forEach((q) => {
        const selectedAnswer = q.answers.find((a) => a.selected)
        if (selectedAnswer) {
          restoredAnswers[q.questionId] = selectedAnswer.answerId
        }
      })

      let finalAnswers = { ...restoredAnswers }

      // Nếu API không có answers hoặc ít hơn, thử restore từ localStorage
      if (Object.keys(restoredAnswers).length === 0) {
        const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
        if (savedInfo) {
          try {
            const info = JSON.parse(savedInfo)
            if (info.savedAnswers && Object.keys(info.savedAnswers).length > 0) {
              finalAnswers = { ...info.savedAnswers }
            }
          } catch (e) {
            console.error('Error restoring answers from localStorage:', e)
          }
        }
      }

      if (Object.keys(finalAnswers).length > 0) {
        setAnswers(finalAnswers)
      }

      if (exam.status === 'COMPLETED') {
        navigate(`/student/exam/${examSessionId}/result`, { replace: true })
        return
      }
    }
  }, [exam, examSessionId, navigate])

  useEffect(() => {
    if (!isExamStarted || !durationMinutes || !startedAt) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
      const totalSeconds = durationMinutes * 60
      const remaining = Math.max(0, totalSeconds - elapsed)
      return remaining
    }

    const initialTimeLeft = calculateTimeLeft()
    setTimeLeft(initialTimeLeft)

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) {
        submitExam('FINAL')
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isExamStarted, durationMinutes, startedAt, submitExam])

  useEffect(() => {
    if (startedAt && durationMinutes > 0 && !isExamStarted) {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
      const totalSeconds = durationMinutes * 60
      const remaining = Math.max(0, totalSeconds - elapsed)
      setTimeLeft(remaining)
    }
  }, [startedAt, durationMinutes, isExamStarted])

  useEffect(() => {
    if (!isExamStarted || !exam) {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
        autoSaveRef.current = null
      }
      return
    }

    // Auto-save mỗi 30 giây với DRAFT state
    autoSaveRef.current = window.setInterval(() => {
      if (examSessionId && Object.keys(answersRef.current).length > 0) {
        // Gọi submitExam với DRAFT - sử dụng answersRef để lấy giá trị mới nhất
        const payload: SubmitPayload = {
          examSessionId,
          questions: Object.entries(answersRef.current)
            .filter(([, aId]) => aId != null)
            .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
        }

        submitMutation.mutate(
          { state: 'DRAFT', payload },
          {
            onSuccess: () => {
              // Lưu vào localStorage sau khi save thành công
              const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
              if (savedInfo) {
                try {
                  const info = JSON.parse(savedInfo)
                  localStorage.setItem(
                    `exam_${examSessionId}`,
                    JSON.stringify({
                      ...info,
                      savedAnswers: answersRef.current,
                      lastSavedAt: new Date().toISOString()
                    })
                  )
                } catch (e) {
                  console.error('Error saving to localStorage:', e)
                }
              }
            }
          }
        )
      }
    }, 30_000)

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
        autoSaveRef.current = null
      }
    }
  }, [isExamStarted, exam, examSessionId, answers, submitMutation])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (isExamStarted && examSessionId && Object.keys(answers).length > 0) {
        const payload: SubmitPayload = {
          examSessionId,
          questions: Object.entries(answers)
            .filter(([, aId]) => aId != null)
            .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
        }

        // Sử dụng sendBeacon để gửi request ngay cả khi trang đang đóng
        const blob = new Blob([JSON.stringify({ state: 'DRAFT', ...payload })], { type: 'application/json' })
        const baseURL = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || ''
        navigator.sendBeacon?.(`${baseURL}/student/exam/submit?state=DRAFT`, blob)

        const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
        if (savedInfo) {
          try {
            const info = JSON.parse(savedInfo)
            localStorage.setItem(
              `exam_${examSessionId}`,
              JSON.stringify({
                ...info,
                savedAnswers: answers,
                lastSavedAt: new Date().toISOString(),
                isStarted: false
              })
            )
          } catch (e) {
            console.error('Error saving on beforeunload:', e)
          }
        }
      }

      if (examSessionStudentId && isExamStarted) {
        const exitData = {
          examSessionStudentId,
          eventTime: new Date().toISOString()
        }
        const blob = new Blob([JSON.stringify(exitData)], { type: 'application/json' })
        const baseURL = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || ''
        navigator.sendBeacon?.(`${baseURL}/student/exam/exit`, blob)
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [examSessionStudentId, isExamStarted, examSessionId, answers])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examSessionStudentId && isExamStarted) {
        exitMutation.mutate({
          examSessionStudentId,
          eventTime: new Date().toISOString()
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [examSessionStudentId, isExamStarted, exitMutation])

  // === HELPER ===
  const formatTime = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const handleAnswerChange = (qId: number, aId: number) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [qId]: aId }
      // Lưu vào localStorage ngay khi thay đổi để tránh mất dữ liệu
      if (examSessionId) {
        const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
        if (savedInfo) {
          try {
            const info = JSON.parse(savedInfo)
            localStorage.setItem(
              `exam_${examSessionId}`,
              JSON.stringify({
                ...info,
                savedAnswers: newAnswers
              })
            )
          } catch (e) {
            console.error('Error saving answer to localStorage:', e)
          }
        }
      }
      return newAnswers
    })
  }

  const handleStartExam = async () => {
    if (!exam) return

    if (durationMinutes === 0) {
      toast.error('Không tìm thấy thông tin kỳ thi. Vui lòng tham gia lại.')
      navigate('/student')
      return
    }

    const success = await requestFullscreen()
    if (success) {
      const now = new Date()
      let actualStartedAt = startedAt

      // Nếu chưa có startedAt (lần đầu bắt đầu), lưu vào localStorage
      if (!actualStartedAt) {
        actualStartedAt = now
        setStartedAt(actualStartedAt)
        // Lưu startedAt vào localStorage
        const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
        if (savedInfo) {
          try {
            const info = JSON.parse(savedInfo)
            localStorage.setItem(
              `exam_${examSessionId}`,
              JSON.stringify({
                ...info,
                startedAt: actualStartedAt.toISOString(),
                isStarted: true
              })
            )
          } catch (e) {
            console.error('Error saving startedAt:', e)
          }
        }
      }

      setIsExamStarted(true)

      // Tính timeLeft dựa trên startedAt (có thể là từ localStorage nếu vào lại)
      const elapsed = Math.floor((now.getTime() - actualStartedAt.getTime()) / 1000)
      const totalSeconds = durationMinutes * 60
      const remaining = Math.max(0, totalSeconds - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        toast.error('Thời gian làm bài đã hết!')
        submitExam('FINAL')
        return
      }

      toast.success(startedAt ? 'Tiếp tục làm bài!' : 'Bắt đầu làm bài!')
    }
  }

  const handleExitExam = async () => {
    // Lưu DRAFT trước khi thoát
    if (examSessionId && Object.keys(answers).length > 0) {
      const payload: SubmitPayload = {
        examSessionId,
        questions: Object.entries(answers)
          .filter(([, aId]) => aId != null)
          .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
      }

      try {
        await submitMutation.mutateAsync({ state: 'DRAFT', payload })
        // Lưu vào localStorage
        const savedInfo = localStorage.getItem(`exam_${examSessionId}`)
        if (savedInfo) {
          try {
            const info = JSON.parse(savedInfo)
            localStorage.setItem(
              `exam_${examSessionId}`,
              JSON.stringify({
                ...info,
                savedAnswers: answers,
                lastSavedAt: new Date().toISOString(),
                isStarted: false
              })
            )
          } catch (e) {
            console.error('Error saving on exit:', e)
          }
        }
      } catch (error) {
        console.error('Error saving draft on exit:', error)
      }
    }

    setIsExamStarted(false)
    await exitFullscreen()
    if (examSessionStudentId) {
      await exitMutation
        .mutateAsync({
          examSessionStudentId,
          eventTime: new Date().toISOString()
        })
        .catch(() => {})
    }
    navigate('/student')
  }

  const handleNext = () => setCurrentQuestion((prev) => Math.min(prev + 1, (exam?.questions.length || 1) - 1))
  const handlePrev = () => setCurrentQuestion((prev) => Math.max(prev - 1, 0))

  // === RENDER: LOADING ===
  if (isExamLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải đề thi...</p>
        </div>
      </div>
    )
  }

  // === RENDER: ERROR ===
  if (isExamError || !exam) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2'>Không thể tải đề</h2>
          <p className='text-gray-600 mb-4'>{isExamError ? 'Có lỗi xảy ra khi tải đề thi' : 'Không tìm thấy đề thi'}</p>
          <button
            onClick={() => refetchExam()}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-2'
          >
            Thử lại
          </button>
          <button
            onClick={() => navigate('/student')}
            className='bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600'
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  // === RENDER: ĐÃ HOÀN THÀNH ===
  if (exam.status === 'COMPLETED') {
    navigate(`/student/exam/${examSessionId}/result`, { replace: true })
    return null
  }

  // === RENDER: HẾT THỜI GIAN ===
  if (timeLeft === 0 && isExamStarted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center'>
          <XCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-red-700 mb-2'>Hết thời gian làm bài</h2>
          <p className='text-gray-600 mb-4'>
            <strong>{exam.name}</strong>
          </p>
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 mb-6'>
            <AlertCircle className='w-4 h-4 inline mr-1' />
            Thời gian làm bài đã hết.
          </div>
          <button
            onClick={() => navigate('/student')}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  // === RENDER: CHƯA BẮT ĐẦU LÀM BÀI ===
  if (!isExamStarted) {
    const hasSavedAnswers = Object.keys(answers).length > 0

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full'>
          <div className='text-center mb-6'>
            <PlayCircle className='w-16 h-16 text-blue-600 mx-auto mb-4' />
            <h1 className='text-3xl font-bold text-gray-800'>{examName || exam.name}</h1>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <p className='text-blue-800 text-center font-medium'>
              {hasSavedAnswers
                ? 'Bạn đã làm bài trước đó. Câu trả lời đã lưu sẽ được khôi phục.'
                : 'Sẵn sàng bắt đầu làm bài!'}
            </p>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm space-y-3'>
            {durationMinutes > 0 && (
              <div className='flex justify-between'>
                <span className='font-medium'>Thời gian làm bài:</span>
                <span className='text-blue-700 font-semibold'>{durationMinutes} phút</span>
              </div>
            )}
            {timeLeft > 0 && (
              <div className='flex justify-between'>
                <span className='font-medium'>Thời gian còn lại:</span>
                <span className='text-blue-700 font-semibold'>{formatTime(timeLeft)}</span>
              </div>
            )}
            <div className='flex justify-between'>
              <span className='font-medium'>Thí sinh:</span>
              <span className='text-blue-700'>{user?.name}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Số câu hỏi:</span>
              <span className='text-blue-700 font-semibold'>{exam.questions.length} câu</span>
            </div>
          </div>

          <div className='flex justify-center space-x-4'>
            <button
              onClick={() => navigate('/student')}
              className='bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition'
            >
              Quay lại
            </button>
            <button
              onClick={handleStartExam}
              className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center space-x-2 shadow-lg transition'
            >
              <Maximize2 className='w-5 h-5' />
              <span className='font-medium'>{hasSavedAnswers ? 'Tiếp tục làm bài' : 'Bắt đầu thi'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === GIAO DIỆN LÀM BÀI ===
  const currentQ = exam.questions[currentQuestion]
  const total = exam.questions.length

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='sticky top-0 z-50 bg-white shadow-lg border-b border-blue-200'>
        <div className='max-w-7xl mx-auto flex justify-between items-center px-6 py-4'>
          {/* Title and User Info */}
          <div className='flex flex-col sm:flex-row sm:items-baseline gap-3'>
            <h1 className='text-xl font-semibold text-blue-700'>{examName || exam.name}</h1>
            <p className='text-sm text-gray-500 sm:border-l sm:pl-3'>
              Thí sinh: <span className='font-medium text-gray-800'>{user?.name}</span>
            </p>
          </div>

          {/* Time and Buttons */}
          <div className='flex items-center gap-4'>
            {/* Time Left */}
            <div className='flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 shadow-sm'>
              <span className='text-sm text-blue-600'>Thời gian còn:</span>
              <span className='font-mono text-lg font-bold text-blue-800'>{formatTime(timeLeft)}</span>
            </div>

            {/* Exit Button */}
            <button
              onClick={handleExitExam}
              className='hidden md:block bg-white border border-gray-400 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-normal text-sm shadow-sm'
            >
              Thoát
            </button>

            {/* Submit Button */}
            <button
              onClick={() => submitExam('FINAL')}
              className='bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md transition'
            >
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-6 py-10'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Sidebar: Danh sách câu hỏi */}
          <aside className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-lg p-6 sticky top-20 border border-blue-100'>
              <h3 className='font-semibold mb-5 text-gray-700 text-base border-b pb-3 border-gray-200'>
                Danh sách câu hỏi ({exam.questions.length})
              </h3>

              <div className='grid grid-cols-5 gap-3'>
                {exam.questions.map((q, i) => (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-10 h-10 rounded-md text-sm font-medium transition shadow-sm
                    ${
                      i === currentQuestion
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : answers[q.questionId]
                          ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    title={answers[q.questionId] ? 'Đã trả lời' : 'Chưa trả lời'}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Content: Hiển thị câu hỏi */}
          <section className='lg:col-span-3'>
            <div className='bg-white rounded-xl shadow-lg p-8 border border-blue-100'>
              {/* Question Info Header */}
              <div className='flex justify-between items-center mb-6 border-b pb-4 border-gray-200'>
                <h2 className='text-lg font-bold text-gray-800'>
                  Câu hỏi <span className='text-blue-600'>{currentQuestion + 1}</span> / {total}
                </h2>
                <span className='text-sm text-gray-500 italic'>Vui lòng đọc kỹ câu hỏi</span>
              </div>

              {/* Question Content */}
              <div className='mb-8'>
                <p className='text-gray-800 leading-relaxed text-base border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/70 rounded-r-md'>
                  {currentQ.content}
                </p>
              </div>

              {/* Answers/Options */}
              <div className='space-y-3'>
                {currentQ.answers.map((opt, index) => (
                  <label
                    key={opt.answerId}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition shadow-sm
                    ${
                      answers[currentQ.questionId] === opt.answerId
                        ? 'bg-blue-100 border-blue-400'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type='radio'
                      name={`q-${currentQ.questionId}`}
                      checked={answers[currentQ.questionId] === opt.answerId}
                      onChange={() => handleAnswerChange(currentQ.questionId, opt.answerId)}
                      className='w-4 h-4 text-blue-600 focus:ring-blue-500'
                    />

                    <span className='font-medium text-gray-700'>
                      <span className='font-bold mr-2 text-blue-500'>{String.fromCharCode(65 + index)}.</span>
                      {opt.content}
                    </span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className='flex justify-between mt-8 pt-6 border-t border-gray-200'>
                <button
                  onClick={handlePrev}
                  disabled={currentQuestion === 0}
                  className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 transition shadow-sm font-medium text-sm'
                >
                  ← Câu trước
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentQuestion === total - 1}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm font-medium text-sm'
                >
                  Câu tiếp →
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile/Sticky Nộp bài */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-40'>
        <button
          onClick={() => submitExam('FINAL')}
          className='w-full bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium shadow-lg transition'
        >
          <span>Nộp bài kết thúc</span>
        </button>
      </div>
    </div>
  )
}
