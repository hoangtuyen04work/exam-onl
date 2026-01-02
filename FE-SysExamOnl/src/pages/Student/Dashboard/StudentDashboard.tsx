/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  User,
  Landmark,
  Clock,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  KeyRound,
  BookOpen
} from 'lucide-react'
import { toLocalStringISO } from '../../../utils/utils'
import { fetchCompletedExams, studentApi } from '../../../api/student-api'
import type { CompletedExam, UserData } from '../../../types/user.type'

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

  const handleViewResult = (examSessionId: number) => {
    navigate(`exam/${examSessionId}/result`)
  }

  const {
    data: completedExamsResponse = { items: [], page: 0, size: pageSize, total: 0, totalPages: 0 },
    isLoading: isLoadingCompletedExams,
    isError: isErrorCompletedExams,
    error
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

  const completedExams: CompletedExam[] = completedExamsResponse.items

  if (isLoadingCompletedExams) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
        <span className='ml-3 text-gray-600'>Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className='p-12 max-w-4xl mx-auto'>
      {/* Nhập mã phòng thi */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-black text-slate-800 mb-4'>Nhập mã phòng thi</h1>
        <p className='text-slate-500 text-lg font-medium'>Mã phòng thi được giáo viên cung cấp để bắt đầu bài làm.</p>
      </div>
      <div className='bg-blue-600 p-1 rounded-[40px] shadow-2xl shadow-blue-200'>
        <div className='bg-white p-10 rounded-[38px] flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4'>
          <input
            type='text'
            placeholder='VÍ DỤ: TOAN102'
            value={examCode}
            onChange={(e) => setExamCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinExamByCode()}
            disabled={loadingJoin}
            className='flex-1 w-full px-8 py-5 bg-slate-100 rounded-3xl text-2xl font-mono font-bold text-center focus:ring-4 focus:ring-blue-100 outline-none transition uppercase tracking-widest border-2 border-transparent focus:border-blue-500'
          />
          <button
            onClick={handleJoinExamByCode}
            disabled={loadingJoin || !examCode.trim()}
            className='w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-lg hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loadingJoin ? (
              <>
                <Loader2 className='w-5 h-5 animate-spin mr-2' />
                Đang tham gia...
              </>
            ) : (
              <>
                Vào thi <i className='fas fa-bolt ml-2'></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
