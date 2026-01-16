/* eslint-disable @typescript-eslint/no-explicit-any */
// cspell:disable-next-line
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { AlertCircle, Maximize2, PlayCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { studentApi, type SubmitPayload } from '../../../api/student-api'
import { useFullScreen } from '../../../hooks/useFullScreen'
import { getBaseUrl, loadFromLocalStorage, saveToLocalStorage, useDebounce } from '../../../utils/utils'
import { useStudentMonitoringWebSocket } from '../../../hooks/useStudentMonitoringWebSocket' // Thêm import từ file 2

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.auth.user)

  const examSessionId = examId ? Number(examId) : null
  const token = localStorage.getItem('authToken') || '' // Thêm từ file 2
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [examSessionStudentId, setExamSessionStudentId] = useState<number | null>(null)
  const [expiredAt, setExpiredAt] = useState<Date | null>(null)
  const [examName, setExamName] = useState<string>('')
  const [isTimeExpired, setIsTimeExpired] = useState(false)

  // === REFS (QUAN TRỌNG: Dùng để truy cập state mới nhất trong Interval/Event) ===
  const autoSaveRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const hasSubmitted = useRef(false)
  const submitExamRef = useRef<((state: 'DRAFT' | 'FINAL') => void) | null>(null)

  const answersRef = useRef<Record<number, number>>({})
  const isExamStartedRef = useRef(false)
  const examSessionStudentIdRef = useRef<number | null>(null)
  const lastExitEventTimeRef = useRef<number>(0) // Để debounce EXIT events

  // Luôn cập nhật Ref mỗi khi state thay đổi để các hàm chạy ngầm đọc được
  useEffect(() => {
    answersRef.current = answers
    isExamStartedRef.current = isExamStarted
    examSessionStudentIdRef.current = examSessionStudentId
  }, [answers, isExamStarted, examSessionStudentId])

  const debouncedAnswers = useDebounce(answers, 500)
  const { sendEvent } = useStudentMonitoringWebSocket(examSessionId, token, isExamStarted)

  const {
    data: examData,
    isLoading: isExamLoading,
    isError: isExamError,
    refetch: refetchExam
  } = useQuery({
    queryKey: ['doExam', examSessionId],
    queryFn: () => studentApi.doExam(examSessionId!),
    enabled: !!examSessionId,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })

  const exam = examData?.data

  // === LOAD LOGIC (Restore from API/Local) ===
  useEffect(() => {
    if (!exam) {
      if (examSessionId && isExamError) {
        const savedInfo = loadFromLocalStorage(examSessionId)
        if (savedInfo) {
          if (savedInfo.savedAnswers) setAnswers(savedInfo.savedAnswers)
          if (savedInfo.expiredAt) setExpiredAt(new Date(savedInfo.expiredAt))
          if (savedInfo.examSessionStudentId) setExamSessionStudentId(savedInfo.examSessionStudentId)
          if (savedInfo.examName) setExamName(savedInfo.examName)
        }
      }
      return
    }

    setExamName(exam.name)

    if (exam.examSessionStudentId) {
      setExamSessionStudentId(exam.examSessionStudentId)
      saveToLocalStorage(examSessionId!, { examSessionStudentId: exam.examSessionStudentId })
    }

    if (exam.expiredAt) {
      const expiredDate = new Date(exam.expiredAt)
      setExpiredAt(expiredDate)
      saveToLocalStorage(examSessionId!, { expiredAt: exam.expiredAt })
    }

    // Restore answers
    const restoredAnswers: Record<number, number> = {}
    exam.questions?.forEach((q) => {
      const selectedAnswer = q.answers.find((a) => a.selected)
      if (selectedAnswer) {
        restoredAnswers[q.questionId] = selectedAnswer.answerId
      }
    })

    if (Object.keys(restoredAnswers).length > 0) {
      setAnswers(restoredAnswers)
    } else {
      const savedInfo = loadFromLocalStorage(examSessionId!)
      if (savedInfo?.savedAnswers && Object.keys(savedInfo.savedAnswers).length > 0) {
        setAnswers(savedInfo.savedAnswers)
      }
    }

    if (exam.status === 'COMPLETED') {
      toast.info('Bạn đã hoàn thành bài thi này. Đang chuyển đến trang kết quả...')
      setTimeout(() => {
        navigate(`/student/exam/${examSessionId}/result`, { replace: true })
      }, 1500)
      return
    }
  }, [exam, examSessionId, navigate, isExamError])

  const submitMutation = useMutation({
    mutationFn: ({ state, payload }: { state: 'DRAFT' | 'FINAL'; payload: SubmitPayload }) =>
      studentApi.submitExam(state, payload),
    onSuccess: (_, { state }) => {
      if (state === 'FINAL') {
        toast.success('Nộp bài thành công!')
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Lỗi lưu bài'
      toast.error(message)
    }
  })

  // Lấy timer trực tiếp từ API expireAt sau đó tính
  const calculateTimeLeft = useCallback((): number => {
    if (!expiredAt) return 0
    const now = new Date()
    const remaining = Math.max(0, Math.floor((expiredAt.getTime() - now.getTime()) / 1000))
    return remaining
  }, [expiredAt])

  const checkTimeExpired = useCallback((): boolean => {
    if (!expiredAt) return false
    const now = new Date()
    return now.getTime() >= expiredAt.getTime()
  }, [expiredAt])

  useEffect(() => {
    if (!isExamStarted || !expiredAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (expiredAt && !isExamStarted) {
        const remaining = calculateTimeLeft()
        setTimeLeft(remaining)
        if (remaining <= 0) setIsTimeExpired(true)
      }
      return
    }

    const initialTimeLeft = calculateTimeLeft()
    setTimeLeft(initialTimeLeft)

    if (initialTimeLeft <= 0 || checkTimeExpired()) {
      setIsTimeExpired(true)
      if (!hasSubmitted.current && submitExamRef.current) {
        submitExamRef.current('FINAL')
      }
      return
    }

    setIsTimeExpired(false)

    timerRef.current = window.setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 0 || checkTimeExpired()) {
        setIsTimeExpired(true)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        if (!hasSubmitted.current && submitExamRef.current) {
          submitExamRef.current('FINAL')
        }
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isExamStarted, expiredAt, calculateTimeLeft, checkTimeExpired])

  // Auto draft lại bài thi 30s call 1 lần
  useEffect(() => {
    if (!isExamStarted || !examSessionId) {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
        autoSaveRef.current = null
      }
      return
    }

    const performAutoSave = () => {
      const currentAnswers = answersRef.current
      if (Object.keys(currentAnswers).length === 0) return

      const payload: SubmitPayload = {
        examSessionId,
        questions: Object.entries(currentAnswers)
          .filter(([, aId]) => aId != null)
          .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
      }

      studentApi
        .submitExam('DRAFT', payload)
        .then(() => {
          console.log('Auto-save draft success')
          saveToLocalStorage(examSessionId, { savedAnswers: currentAnswers })
        })
        .catch((err) => {
          console.error('Auto-save draft failed:', err)
        })
    }

    // Chạy mỗi 30 giây
    autoSaveRef.current = window.setInterval(performAutoSave, 30_000)

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
        autoSaveRef.current = null
      }
    }
  }, [isExamStarted, examSessionId]) // Chỉ re-run khi bắt đầu/kết thúc thi

  useEffect(() => {
    if (!examSessionId || Object.keys(debouncedAnswers).length === 0) return
    saveToLocalStorage(examSessionId, { savedAnswers: debouncedAnswers })
  }, [debouncedAnswers, examSessionId])

  // Gửi logs exit tab, chuyển tab, cheets
  const sendEventLog = useCallback(
    (type: 'EXIT' | 'SUBMIT_DRAFT') => {
      const sId = examSessionStudentIdRef.current
      const baseURL = getBaseUrl()

      if (!baseURL) {
        console.error('[DEBUG] sendEventLog: baseURL is empty, cannot send event')
        return
      }

      // 1. Gửi sự kiện thoát màn hình/tab
      if (type === 'EXIT' && sId) {
        // Debounce: Tránh gửi EXIT event quá nhiều lần trong 2 giây
        const now = Date.now()
        const timeSinceLastExit = now - lastExitEventTimeRef.current
        if (timeSinceLastExit < 2000 && lastExitEventTimeRef.current > 0) {
          console.log(`[DEBUG] EXIT event debounced (${timeSinceLastExit}ms since last), skipping`)
          return
        }
        lastExitEventTimeRef.current = now
        const url = `${baseURL}/student/exam/exit`
        const body = JSON.stringify({
          examSessionStudentId: sId,
          eventTime: new Date().toISOString()
        })

        // Lấy token từ localStorage để thêm vào header
        const token =
          localStorage.getItem('authToken') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('access_token')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        console.log(`[DEBUG] Sending EXIT event to: ${url}`, { examSessionStudentId: sId, body, hasToken: !!token })

        fetch(url, {
          method: 'POST',
          headers,
          body: body,
          keepalive: true // Quan trọng: Giữ request sống khi tab chết
        })
          .then((response) => {
            console.log(`[DEBUG] EXIT event response status: ${response.status}`, response)
            if (!response.ok) {
              console.error(`[DEBUG] EXIT event failed with status: ${response.status}`)
            }
            return response.json().catch(() => ({}))
          })
          .then((data) => {
            console.log(`[DEBUG] EXIT event success:`, data)
          })
          .catch((e) => {
            console.error('[DEBUG] Send exit event error:', e)
          })
      } else if (type === 'EXIT' && !sId) {
        console.warn('[DEBUG] sendEventLog EXIT: examSessionStudentId is null, cannot send event')
      }

      // 2. Gửi Draft cuối cùng
      if (type === 'SUBMIT_DRAFT' && examSessionId) {
        const currentAnswers = answersRef.current
        if (Object.keys(currentAnswers).length === 0) {
          console.log('[DEBUG] sendEventLog SUBMIT_DRAFT: No answers to submit')
          return
        }

        const payload = {
          state: 'DRAFT',
          examSessionId: examSessionId,
          questions: Object.entries(currentAnswers).map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
        }

        const token =
          localStorage.getItem('authToken') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('access_token')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        console.log(`[DEBUG] Sending SUBMIT_DRAFT to: ${baseURL}/student/exam/submit?state=DRAFT`, payload)

        fetch(`${baseURL}/student/exam/submit?state=DRAFT`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          keepalive: true
        })
          .then((response) => {
            console.log(`[DEBUG] SUBMIT_DRAFT response status: ${response.status}`)
            if (!response.ok) {
              console.error(`[DEBUG] SUBMIT_DRAFT failed with status: ${response.status}`)
            }
            return response.json().catch(() => ({}))
          })
          .then((data) => {
            console.log(`[DEBUG] SUBMIT_DRAFT success:`, data)
          })
          .catch((e) => {
            console.error('[DEBUG] Send draft on close error:', e)
          })
      }
    },
    [examSessionId]
  )

  // === VISIBILITY CHANGE (Tab Hidden) ===
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isExamStartedRef.current) {
        console.log('[DEBUG] Tab hidden detected - sending EXIT event')
        sendEventLog('EXIT')
      } else if (!document.hidden && isExamStartedRef.current) {
        console.log('[DEBUG] Tab visible again')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sendEventLog])

  // === BEFORE UNLOAD (Close/Reload Tab) ===
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isExamStartedRef.current) {
        sendEventLog('SUBMIT_DRAFT')
        sendEventLog('EXIT')

        // Lưu local storage lần cuối
        if (examSessionId) {
          saveToLocalStorage(examSessionId, {
            savedAnswers: answersRef.current,
            isStarted: false
          })
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examSessionId, sendEventLog])

  // === FULLSCREEN LOGIC ===
  const handleEndExamForced = useCallback(() => {
    if (examSessionStudentIdRef.current) {
      console.log('[DEBUG] Fullscreen exit detected - sending EXIT event')
      sendEventLog('EXIT')
      toast.error('Thoát toàn màn hình — bài thi kết thúc!')
      setTimeout(() => navigate('/student'), 1500)
    }
  }, [navigate, sendEventLog])

  // === FULLSCREEN CHANGE LISTENER (Additional to hook) ===
  // Thêm listener riêng để đảm bảo gọi sendEventLog khi thoát fullscreen
  // Note: handleEndExamForced từ hook cũng sẽ gọi sendEventLog, nhưng listener này đảm bảo không bị miss
  useEffect(() => {
    if (!isExamStarted) return

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      console.log(`[DEBUG] Fullscreen change detected - isFullscreen: ${isFullscreen}`)

      if (!isFullscreen && isExamStartedRef.current) {
        console.log('[DEBUG] Exited fullscreen (from listener) - sending EXIT event')
        sendEventLog('EXIT')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [isExamStarted, sendEventLog])

  // === WINDOW RESIZE LISTENER ===
  // Gửi event khi resize window (có thể là dấu hiệu thoát fullscreen hoặc minimize)
  useEffect(() => {
    if (!isExamStarted) return

    let resizeTimer: number | null = null
    const handleResize = () => {
      // Debounce resize để tránh gọi quá nhiều
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }

      resizeTimer = window.setTimeout(() => {
        const isFullscreen = !!document.fullscreenElement
        console.log(
          `[DEBUG] Window resize detected - isFullscreen: ${isFullscreen}, window size: ${window.innerWidth}x${window.innerHeight}`
        )

        // Nếu đang trong fullscreen nhưng window size nhỏ hơn màn hình => có thể đã minimize
        if (isFullscreen && isExamStartedRef.current) {
          const screenWidth = window.screen.width
          const screenHeight = window.screen.height
          const windowWidth = window.innerWidth
          const windowHeight = window.innerHeight

          // Nếu window nhỏ hơn đáng kể so với screen => có thể đã minimize
          if (windowWidth < screenWidth * 0.8 || windowHeight < screenHeight * 0.8) {
            console.log('[DEBUG] Window appears minimized while in fullscreen - sending EXIT event')
            sendEventLog('EXIT')
          }
        }
      }, 500)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
    }
  }, [isExamStarted, sendEventLog])

  const handleExit = () => {
    handleEndExamForced()
    sendEvent('LEAVE')
  }

  const { requestFullscreen, exitFullscreen } = useFullScreen({
    onExit: handleExit,
    enabled: true,
    requiredFullscreen: true
  })

  // === SUBMIT EXAM ACTION ===
  const submitExam = useCallback(
    (state: 'DRAFT' | 'FINAL') => {
      if (!examSessionId || (hasSubmitted.current && state === 'FINAL')) return
      if (state === 'FINAL') hasSubmitted.current = true

      const payload: SubmitPayload = {
        examSessionId,
        questions: Object.entries(answersRef.current)
          .filter(([, aId]) => aId != null)
          .map(([qId, aId]) => ({ questionId: Number(qId), answerId: aId }))
      }

      submitMutation.mutate(
        { state, payload },
        {
          onSuccess: () => {
            if (state === 'DRAFT') {
              saveToLocalStorage(examSessionId, { savedAnswers: answersRef.current })
            }
          }
        }
      )

      if (state === 'FINAL') {
        setIsExamStarted(false)
        setIsTimeExpired(true)
        // Remove fullscreen-mode class from body
        document.body.classList.remove('fullscreen-mode')
        exitFullscreen()
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current)
          autoSaveRef.current = null
        }
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        localStorage.removeItem(`exam_${examSessionId}`)
        navigate(`/student/exam/${examSessionId}/result`, { replace: true })
      }
    },
    [examSessionId, navigate, submitMutation, exitFullscreen, sendEvent]
  )

  useEffect(() => {
    submitExamRef.current = submitExam
  }, [submitExam])

  // === HANDLERS ===
  const formatTime = useCallback((s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }, [])

  const handleAnswerChange = useCallback(
    (qId: number, aId: number) => {
      if (isTimeExpired) {
        toast.warning('Thời gian làm bài đã hết!')
        return
      }
      setAnswers((prev) => ({ ...prev, [qId]: aId }))
    },
    [isTimeExpired]
  )

  const handleStartExam = useCallback(async () => {
    if (!exam || !expiredAt) return

    const remaining = calculateTimeLeft()
    if (remaining <= 0 || checkTimeExpired()) {
      toast.error('Thời gian làm bài đã hết!')
      setIsTimeExpired(true)
      if (!hasSubmitted.current) {
        submitExam('FINAL')
      }
      return
    }

    const success = await requestFullscreen()
    if (success) {
      setIsExamStarted(true)
      setIsTimeExpired(false)
      // Add fullscreen-mode class to body for iOS support
      document.body.classList.add('fullscreen-mode')
      toast.success('Bắt đầu làm bài!')
    }
  }, [exam, expiredAt, requestFullscreen, calculateTimeLeft, checkTimeExpired, submitExam])

  const handleExitExam = useCallback(async () => {
    sendEvent('LEAVE') // Thêm từ file 2
    sendEventLog('EXIT')
    sendEventLog('SUBMIT_DRAFT')

    if (examSessionId) {
      saveToLocalStorage(examSessionId, {
        savedAnswers: answers,
        isStarted: false
      })
    }

    setIsExamStarted(false)
    // Remove fullscreen-mode class from body
    document.body.classList.remove('fullscreen-mode')
    await exitFullscreen()
    navigate('/student')
  }, [examSessionId, answers, exitFullscreen, navigate, sendEvent, sendEventLog]) // Thêm sendEvent vào dependencies

  const handleNext = useCallback(() => {
    setCurrentQuestion((prev) => Math.min(prev + 1, (exam?.questions.length || 1) - 1))
  }, [exam?.questions?.length])

  const handlePrev = useCallback(() => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0))
  }, [])

  // === MEMOIZED VALUES ===
  const durationMinutes = useMemo(() => {
    return exam?.durationMinutes || 0
  }, [exam?.durationMinutes])

  // === NẾU NỘP BÀI THÌ XEM RESULT ===
  useEffect(() => {
    if (exam?.status === 'COMPLETED' && examSessionId) {
      navigate(`/student/exam/${examSessionId}/result`, { replace: true })
    }
  }, [exam?.status, examSessionId, navigate])

  // Giao diện nhé hết logic rồiif
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

  if (exam?.status === 'COMPLETED') return null

  if ((timeLeft === 0 && isExamStarted) || isTimeExpired) {
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
            Thời gian làm bài đã hết. Bài thi đã được tự động nộp.
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

  if (!isExamStarted) {
    const hasSavedAnswers = Object.keys(answers).length > 0
    const canStart = timeLeft > 0 && !isTimeExpired

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-xl shadow-lg p-4 md:p-8 max-w-2xl w-full'>
          <div className='text-center mb-4 md:mb-6'>
            <PlayCircle className='w-12 h-12 md:w-16 md:h-16 text-blue-600 mx-auto mb-3 md:mb-4' />
            <h1 className='text-xl md:text-3xl font-bold text-gray-800'>{examName || exam.name}</h1>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6'>
            <p className='text-blue-800 text-center font-medium text-sm md:text-base'>
              {hasSavedAnswers
                ? 'Bạn đã làm bài trước đó. Câu trả lời đã lưu sẽ được khôi phục.'
                : 'Sẵn sàng bắt đầu làm bài!'}
            </p>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6 text-xs md:text-sm space-y-2 md:space-y-3'>
            {durationMinutes > 0 && (
              <div className='flex justify-between items-center'>
                <span className='font-medium'>Thời gian làm bài:</span>
                <span className='text-blue-700 font-semibold'>{durationMinutes} phút</span>
              </div>
            )}
            {timeLeft > 0 && (
              <div className='flex justify-between items-center'>
                <span className='font-medium'>Thời gian còn lại:</span>
                <span className='text-blue-700 font-semibold'>{formatTime(timeLeft)}</span>
              </div>
            )}
            {!canStart && (
              <div className='flex justify-between items-center text-red-600'>
                <span className='font-medium'>Trạng thái:</span>
                <span className='font-semibold'>Đã hết thời gian làm bài</span>
              </div>
            )}
            <div className='flex justify-between items-center'>
              <span className='font-medium'>Thí sinh:</span>
              <span className='text-blue-700 truncate ml-2'>{user?.name}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='font-medium'>Số câu hỏi:</span>
              <span className='text-blue-700 font-semibold'>{exam.questions.length} câu</span>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4'>
            <button
              onClick={() => navigate('/student')}
              className='w-full sm:w-auto bg-gray-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:bg-gray-600 transition text-sm md:text-base'
            >
              Quay lại
            </button>
            <button
              onClick={handleStartExam}
              disabled={!canStart}
              className='w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center space-x-2 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'
            >
              <Maximize2 className='w-4 h-4 md:w-5 md:h-5' />
              <span className='font-medium'>{hasSavedAnswers ? 'Tiếp tục làm bài' : 'Bắt đầu thi'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = exam.questions[currentQuestion]
  const total = exam.questions.length

  return (
    <div className='min-h-screen bg-white'>
      <header className='sticky top-0 z-50 bg-white shadow-lg border-b border-blue-200'>
        <div className='max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 md:px-6 py-3 md:py-4 gap-3 sm:gap-0'>
          <div className='flex flex-col gap-1 md:gap-3 w-full sm:w-auto'>
            <h1 className='text-base md:text-xl font-semibold text-blue-700 truncate'>{examName || exam.name}</h1>
            <p className='text-xs md:text-sm text-gray-500'>
              Thí sinh: <span className='font-medium text-gray-800'>{user?.name}</span>
            </p>
          </div>

          <div className='flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-end'>
            <div
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border shadow-sm text-xs md:text-sm ${
                timeLeft < 300
                  ? 'bg-red-50 border-red-200'
                  : timeLeft < 600
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              <span
                className={`${timeLeft < 300 ? 'text-red-600' : timeLeft < 600 ? 'text-yellow-600' : 'text-blue-600'} hidden sm:inline`}
              >
                Thời gian:
              </span>
              <span
                className={`font-mono text-sm md:text-lg font-bold ${
                  timeLeft < 300 ? 'text-red-800' : timeLeft < 600 ? 'text-yellow-800' : 'text-blue-800'
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={handleExitExam}
              className='hidden md:block bg-white border border-gray-400 text-gray-700 px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-gray-100 transition font-normal text-xs md:text-sm shadow-sm'
            >
              Thoát
            </button>

            <button
              onClick={() => submitExam('FINAL')}
              disabled={isTimeExpired}
              className='bg-blue-600 text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2 font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base'
            >
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-10 pb-20 md:pb-10'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8'>
          {/* Sidebar - Hide on mobile when doing exam, show as bottom sheet */}
          <aside className='hidden lg:block lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-lg p-4 md:p-6 sticky top-20 border border-blue-100'>
              <h3 className='font-semibold mb-3 md:mb-5 text-gray-700 text-sm md:text-base border-b pb-2 md:pb-3 border-gray-200'>
                Danh sách câu hỏi ({exam.questions.length})
              </h3>

              <div className='grid grid-cols-5 gap-2 md:gap-3'>
                {exam.questions.map((q, i) => (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-md text-xs md:text-sm font-medium transition shadow-sm
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

          <section className='lg:col-span-3'>
            <div className='bg-white rounded-xl shadow-lg p-4 md:p-8 border border-blue-100'>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 border-b pb-3 md:pb-4 border-gray-200 gap-2'>
                <h2 className='text-base md:text-lg font-bold text-gray-800'>
                  Câu hỏi <span className='text-blue-600'>{currentQuestion + 1}</span> / {total}
                </h2>
                <span className='text-xs md:text-sm text-gray-500 italic'>Vui lòng đọc kỹ câu hỏi</span>
              </div>

              <div className='mb-6 md:mb-8'>
                <p className='text-gray-800 leading-relaxed text-sm md:text-base border-l-4 border-blue-500 pl-3 md:pl-4 py-2 md:py-3 bg-blue-50/70 rounded-r-md'>
                  {currentQ.content}
                </p>
              </div>

              <div className='space-y-2 md:space-y-3'>
                {currentQ.answers.map((opt, index) => (
                  <label
                    key={opt.answerId}
                    className={`flex items-center space-x-2 md:space-x-3 p-2.5 md:p-3 border rounded-lg cursor-pointer transition shadow-sm ${
                      isTimeExpired ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
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
                      disabled={isTimeExpired}
                      className='w-4 h-4 text-blue-600 focus:ring-blue-500 flex-shrink-0'
                    />

                    <span className='font-medium text-gray-700 text-sm md:text-base'>
                      <span className='font-bold mr-1 md:mr-2 text-blue-500'>{String.fromCharCode(65 + index)}.</span>
                      {opt.content}
                    </span>
                  </label>
                ))}
              </div>

              <div className='flex justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 gap-2'>
                <button
                  onClick={handlePrev}
                  disabled={currentQuestion === 0}
                  className='px-4 md:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 transition shadow-sm font-medium text-xs md:text-sm'
                >
                  ← Câu trước
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentQuestion === total - 1}
                  className='px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm font-medium text-xs md:text-sm'
                >
                  Câu tiếp →
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40'>
        {/* Mobile Question Navigator */}
        <div className='px-3 py-2 border-b border-gray-200 max-h-24 overflow-y-auto'>
          <div className='flex items-center gap-1.5 flex-wrap'>
            <span className='text-xs text-gray-600 mr-1'>Câu:</span>
            {exam.questions.map((q, i) => (
              <button
                key={q.questionId}
                onClick={() => setCurrentQuestion(i)}
                className={`w-7 h-7 rounded text-xs font-medium transition flex-shrink-0
                  ${
                    i === currentQuestion
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : answers[q.questionId]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className='p-3'>
          <button
            onClick={() => submitExam('FINAL')}
            disabled={isTimeExpired}
            className='w-full bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm'
          >
            <span>Nộp bài kết thúc</span>
          </button>
        </div>
      </div>
    </div>
  )
}
