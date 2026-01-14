/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  ChevronRight,
  KeyRound
} from 'lucide-react'
import { fetchCompletedExams, studentApi } from '../../../api/student-api'
import type { UserData } from '../../../types/user.type'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user: UserData | null = useSelector((state: any) => state.auth.user)
  const [currentPage] = useState(0)
  const pageSize = 10000
  const [examCode, setExamCode] = useState('')
  const [loadingJoin, setLoadingJoin] = useState(false)
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập trước!')
      navigate('/login')
    }
    return () => {
      hasSubmitted.current = false
    }
  }, [user, navigate])

  const handleJoinExamByCode = async () => {
    if (loadingJoin || hasSubmitted.current) return
    if (!examCode.trim()) {
      toast.warn('Vui lòng nhập mã kỳ thi')
      return
    }

    hasSubmitted.current = true
    setLoadingJoin(true)

    try {
      const res = await studentApi.joinExam(examCode.trim())
      if (res?.success && res.data?.examSessionId) {
        // Lưu thông tin join vào localStorage để ExamPage có thể sử dụng
        localStorage.setItem(
          `exam_${res.data.examSessionId}`,
          JSON.stringify({
            examSessionId: res.data.examSessionId,
            durationMinutes: res.data.durationMinutes,
            name: res.data.name,
            description: res.data.description,
            state: res.data.state
          })
        )

        // Kiểm tra state và điều hướng phù hợp
        switch (res.data.state) {
          case 'JOINED':
            toast.error('Bạn đã làm bài thi này trước đó')
            navigate(`exam/join/${res.data.examSessionId}`)
            break
          case 'OPENING':
            toast.info('Kỳ thi đang mở. Đang chuyển hướng...')
            navigate(`exam/join/${res.data.examSessionId}`)
            break
          case 'NOT_OPEN':
            toast.warning('Kỳ thi chưa mở. Vui lòng quay lại sau.')
            break
          case 'CLOSED':
            toast.error('Kỳ thi đã đóng.')
            break
          default:
            toast.error('Trạng thái kỳ thi không xác định')
        }
      } else {
        toast.error(res?.message || 'Không thể tham gia kỳ thi')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tham gia kỳ thi. Vui lòng thử lại.'
      toast.error(msg)
      console.error('Join exam error:', err)
    } finally {
      setLoadingJoin(false)
      hasSubmitted.current = false
    }
  }

  const {
    data: _completedExamsResponse = { items: [], page: 0, size: pageSize, total: 0, totalPages: 0 },
    isLoading: isLoadingCompletedExams
  } = useQuery({
    queryKey: ['completedExams', currentPage],
    queryFn: () => fetchCompletedExams(currentPage, pageSize),
    staleTime: 1000 * 60 * 5,
    select: (data) => ({
      ...data,
      // Trả về đúng type CompletedExam[]
      items: Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            examSessionId: item.examSessionId,
            examSessionName: item.examSessionName || 'N/A',
            submittedAt: item.submittedAt,
            totalScore: item.totalScore ?? 0,
            status: 'COMPLETED' as const // ép kiểu literal
          }))
        : []
    })
  })

  if (isLoadingCompletedExams) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
        <span className='ml-3 text-gray-600'>Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className='min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8'>
      <div className='max-w-3xl mx-auto'>
        {/* Welcome Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>Xin chào, {user?.name || 'Học sinh'}!</h1>
          <p className='text-gray-600'>Chào mừng bạn đến với hệ thống thi trực tuyến</p>
        </div>

        {/* Main Section - Join Exam */}
        <div className='bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-lg text-white'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-white/20 p-2 rounded-lg backdrop-blur-sm'>
              <KeyRound className='w-6 h-6' />
            </div>
            <h2 className='text-2xl font-bold'>Tham gia kỳ thi</h2>
          </div>
          <p className='text-blue-100 mb-6'>Nhập mã phòng thi do giáo viên cung cấp để bắt đầu làm bài</p>

          <div className='flex flex-col sm:flex-row gap-3'>
            <input
              type='text'
              placeholder='VÍ DỤ: TOAN102'
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinExamByCode()}
              disabled={loadingJoin}
              className='flex-1 px-5 py-4 bg-white rounded-xl text-gray-800 font-mono font-semibold text-center text-lg focus:ring-4 focus:ring-blue-300 outline-none transition uppercase tracking-wider disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400'
            />
            <button
              onClick={handleJoinExamByCode}
              disabled={loadingJoin || !examCode.trim()}
              className='px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl active:scale-95'
            >
              {loadingJoin ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Vào thi
                  <ChevronRight className='w-5 h-5' />
                </>
              )}
            </button>
          </div>

          {/* Helper text */}
          <div className='mt-6 pt-6 border-t border-white/20'>
            <p className='text-sm text-blue-100 flex items-center gap-2'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span>Mã phòng thi được giáo viên cung cấp qua email hoặc thông báo lớp học</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
