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
    <div className='min-h-screen bg-gray-50 py-10'>
      <div className='container mx-auto px-6 max-w-6xl'>
        {/* Thông tin thí sinh & kỳ thi */}
        <div className='grid gap-6 lg:grid-cols-2 mb-8'>
          <div className='bg-white border border-gray-100 rounded-xl shadow-lg'>
            <div className='flex items-center gap-3 bg-indigo-50/70 border-b border-indigo-100 px-6 py-4 rounded-t-xl'>
              <User className='w-5 h-5 text-indigo-600' />
              <p className='font-normal text-indigo-700 tracking-wider'>THÔNG TIN THÍ SINH</p>
            </div>
            <div className='p-6 space-y-4 text-sm'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-gray-500 font-light'>Họ và tên:</p>
                  <p className='font-medium text-gray-800'>{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-gray-500 font-light'>Mã thí sinh:</p>
                  <p className='font-medium text-gray-800'>{user?.studentId || 'N/A'}</p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-gray-500 font-light'>Ngày sinh:</p>
                  <p className='font-medium text-gray-800'>{user?.dob || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-gray-500 font-light'>Giới tính:</p>
                  <p className='font-medium text-gray-800'>{user?.gender || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white border border-gray-100 rounded-xl shadow-lg'>
            <div className='flex items-center gap-3 bg-indigo-50/70 border-b border-indigo-100 px-6 py-4 rounded-t-xl'>
              <Landmark className='w-5 h-5 text-indigo-600' />
              <p className='font-normal text-indigo-700 tracking-wider'>THÔNG TIN KỲ THI</p>
            </div>
            <div className='p-6 grid grid-cols-3 gap-4 text-sm'>
              <div>
                <p className='text-gray-500 font-light'>Kỳ thi:</p>
                <p className='font-medium text-gray-800'>{user?.examSession || 'N/A'}</p>
              </div>
              <div>
                <p className='text-gray-500 font-light'>Hội đồng:</p>
                <p className='font-medium text-gray-800'>{user?.examCenter || 'N/A'}</p>
              </div>
              <div>
                <p className='text-gray-500 font-light'>Phòng thi:</p>
                <p className='font-medium text-gray-800'>{user?.room || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid gap-6 lg:grid-cols-2 mb-8'>
          {/* My Classes Card */}
          <div
            onClick={() => navigate('/student/classes')}
            className='bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'
          >
            <div className='p-8 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                    <BookOpen className='w-6 h-6' />
                  </div>
                  <div>
                    <h3 className='text-2xl font-bold'>Lớp học của tôi</h3>
                    <p className='text-blue-100 text-sm'>Xem các lớp học đã tham gia</p>
                  </div>
                </div>
                <ChevronRight className='w-8 h-8 opacity-70' />
              </div>
              <p className='text-blue-50 text-sm leading-relaxed'>
                Xem danh sách các lớp học, bài thi được giao và thông tin chi tiết từng lớp học.
              </p>
            </div>
          </div>

          {/* Join by Code Card */}
          <div className='bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg overflow-hidden'>
            <div className='p-8 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                  <KeyRound className='w-6 h-6' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold'>Tham gia kỳ thi</h3>
                  <p className='text-purple-100 text-sm'>Nhập mã để vào phòng thi</p>
                </div>
              </div>
              <p className='text-purple-50 text-sm leading-relaxed mb-4'>
                Nhập mã kỳ thi được cung cấp bởi giảng viên để bắt đầu làm bài ngay.
              </p>
            </div>
          </div>
        </div>

        {/* Banner & Join Exam */}
        <div className='w-full max-w-6xl mx-auto bg-gradient-to-r from-indigo-50 via-white to-blue-50 rounded-3xl shadow-xl overflow-hidden mb-10 transition-all duration-300 hover:shadow-2xl'>
          <div className='grid grid-cols-1 md:grid-cols-2'>
            <div className='bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center relative'>
              <div className="absolute inset-0 opacity-25 bg-[url('https://www.toptal.com/designers/subtlepatterns/patterns/double-bubble-outline.png')]" />
              <div className='relative z-10 text-center p-10'>
                <img
                  src='https://ktdbcl.actvn.edu.vn/images/Logo_710x125-removebg-preview.png'
                  alt='Join Exam Illustration'
                  className='w-44 mx-auto drop-shadow-lg mb-5'
                />
                <h3 className='text-2xl font-semibold mb-2 tracking-tight'>Sẵn sàng cho thử thách?</h3>
                <p className='text-sm opacity-90 leading-relaxed'>
                  Mỗi bài thi là cơ hội để bạn thể hiện khả năng và bản lĩnh của mình. <br />
                  Chúc bạn thật bình tĩnh và tự tin nhé!
                </p>
              </div>
            </div>

            <div className='p-10 flex flex-col justify-center bg-white/70 backdrop-blur-sm'>
              <div className='flex items-center gap-3 mb-5'>
                <div className='w-11 h-11 bg-blue-100 text-blue-600 flex items-center justify-center rounded-2xl shadow-inner'>
                  <KeyRound className='w-6 h-6' />
                </div>
                <h2 className='text-2xl font-semibold text-gray-800 tracking-tight'>Tham gia kỳ thi</h2>
              </div>

              <p className='text-gray-600 text-sm mb-6 leading-relaxed'>
                Nhập <span className='font-medium text-gray-800'>mã kỳ thi</span> được cung cấp bởi giảng viên để bắt
                đầu làm bài. Đảm bảo rằng bạn đã đăng nhập đúng tài khoản sinh viên.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 items-center'>
                <input
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinExamByCode()}
                  placeholder='Ví dụ: ABC123'
                  className='flex-1 px-5 py-3 text-base border border-gray-300 rounded-xl text-center font-medium text-gray-700 shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition-all duration-200 w-full'
                  disabled={loadingJoin}
                />

                <button
                  onClick={handleJoinExamByCode}
                  disabled={loadingJoin || !examCode.trim()}
                  className='flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md transition-all disabled:opacity-50 w-full sm:w-auto'
                >
                  {loadingJoin ? (
                    <>
                      <Loader2 className='w-5 h-5 animate-spin' />
                      <span>Đang tham gia...</span>
                    </>
                  ) : (
                    'Tham gia ngay'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Exams */}
        <div className='bg-white border border-gray-100 rounded-xl shadow-lg'>
          <div className='flex items-center gap-3 bg-emerald-50/70 border-b border-emerald-100 px-6 py-4 rounded-t-xl'>
            <BarChart3 className='w-5 h-5 text-emerald-600' />
            <p className='font-normal text-emerald-700 tracking-wider'>KẾT QUẢ BÀI THI ĐÃ HOÀN THÀNH</p>
          </div>

          <div className='p-6'>
            {isErrorCompletedExams && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                <p className='font-medium'>Lỗi khi tải kết quả</p>
                <p className='text-sm mt-1'>{(error as Error)?.message || 'Vui lòng thử lại sau.'}</p>
              </div>
            )}

            {completedExams.length > 0 ? (
              <div className='space-y-4'>
                {completedExams.map((exam) => (
                  <div
                    key={exam.examSessionId}
                    className='p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3'
                  >
                    <div className='flex-grow space-y-1'>
                      <h3 className='font-medium text-gray-800 text-base'>{exam.examSessionName}</h3>
                      <div className='flex flex-wrap items-center text-sm text-gray-500 gap-4'>
                        <div className='flex items-center gap-1'>
                          <Clock className='w-4 h-4' />
                          <span>
                            Nộp: <span className='font-normal'>{toLocalStringISO(exam.submittedAt)}</span>
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          {exam.totalScore >= 5 ? (
                            <TrendingUp className='w-4 h-4 text-emerald-600' />
                          ) : (
                            <TrendingDown className='w-4 h-4 text-red-500' />
                          )}
                          <span>
                            Điểm:{' '}
                            <span
                              className={`font-semibold ${exam.totalScore >= 5 ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {exam.totalScore.toFixed(2)}
                            </span>{' '}
                            / 10.00
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewResult(exam.examSessionId)}
                      className='group inline-flex items-center gap-1 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm'
                    >
                      Xem kết quả
                      <ChevronRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <p className='text-gray-500 font-light'>Chưa có bài thi nào được hoàn thành.</p>
                {import.meta.env.DEV && (
                  <details className='mt-4 text-left'>
                    <summary className='cursor-pointer text-xs text-gray-500'>Debug API Response</summary>
                    <pre className='mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60'>
                      {JSON.stringify(completedExamsResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
