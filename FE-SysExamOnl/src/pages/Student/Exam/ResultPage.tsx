import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../../store/slices/authSlice'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  ChevronRight,
  MessageSquare,
  BookOpen,
  ChevronDown
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axiosClient from '../../../api/axiosClient'
import { toLocalStringISO } from '../../../utils/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { ExamResult } from '../../../types/exam.type'

export default function ResultPage() {
  const { examSessionId } = useParams<{ examSessionId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state: any) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    localStorage.clear()
    navigate('/login', { replace: true })
  }

  const {
    data: result,
    isLoading,
    isError
  } = useQuery<ExamResult>({
    queryKey: ['examResult', examSessionId],
    queryFn: async (): Promise<ExamResult> => {
      if (!examSessionId) throw new Error('Exam session ID không hợp lệ')
      const { data } = await axiosClient.get(`/student/exam/result/${examSessionId}`)
      console.log('Kết quả bài thi:', data)

      if (!data.success) throw new Error(data.message || 'Không lấy được kết quả')
      return data.data as ExamResult
    },
    enabled: !!examSessionId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000
  })

  const [openExplanationId, setOpenExplanationId] = useState<number | null>(null)

  const toggleQuestion = (questionId: number) => {
    setOpenExplanationId(openExplanationId === questionId ? null : questionId)
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className='text-indigo-500'
        >
          <Loader2 className='w-10 h-10 animate-spin' />
        </motion.div>
      </div>
    )
  }

  if (isError || !result) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center max-w-md bg-white p-10 rounded-xl shadow-lg border border-gray-100'
        >
          <XCircle className='w-16 h-16 text-rose-500 mx-auto mb-4' />
          <h2 className='text-2xl font-light text-gray-800 mb-2'>Không tìm thấy kết quả</h2>
          <p className='text-gray-500 mb-6 font-light'>Vui lòng đảm bảo bạn có quyền truy cập hoặc ID phiên hợp lệ.</p>
          <button
            onClick={() => navigate('/student')}
            className='bg-gray-800 text-white px-6 py-2 rounded-lg font-normal hover:bg-gray-700 transition-colors shadow-md'
          >
            Quay lại trang chủ
          </button>
        </motion.div>
      </div>
    )
  }

  const totalQuestions = result.questions.length
  const correctCount = result.questions.filter((q) => q.answers.some((a) => a.correct && a.selected)).length
  const unansweredCount = result.questions.filter((q) => !q.answers.some((a) => a.selected)).length
  const wrongCount = totalQuestions - correctCount - unansweredCount
  const score = result.totalScore?.toFixed(2) || '0.00'
  const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

  // Determine status based on isPassed if passingScore exists, otherwise use percentage
  const hasPassed = result.isPassed !== null ? result.isPassed : percentage >= 50
  const statusColor = hasPassed ? 'text-emerald-500' : 'text-rose-500'
  const statusGradient = hasPassed ? '#10b981' : '#f43f5e'

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* FIXED HEADER */}
      <header className='fixed top-0 left-0 right-0 h-14 sm:h-16 bg-white border-b border-slate-200 z-50 px-3 sm:px-6 flex justify-between items-center shadow-sm'>
        <div
          className='flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition'
          onClick={() => navigate('/student')}
        >
          <div className='bg-blue-600 p-1.5 sm:p-2 rounded-lg shadow-blue-200 shadow-lg'>
            <i className='fas fa-graduation-cap text-white text-base sm:text-lg'></i>
          </div>
          <span className='text-base sm:text-xl font-bold tracking-tight text-slate-800 hidden xs:block'>ExamOnlineSystem</span>
          <span className='text-base sm:text-xl font-bold tracking-tight text-slate-800 xs:hidden'>Exam</span>
        </div>

        <div className='flex items-center space-x-2 sm:space-x-6'>
          <div className='flex items-center space-x-2 sm:space-x-3 border-r pr-2 sm:pr-6 border-slate-200'>
            <div className='text-right hidden md:block'>
              <p className='text-sm font-bold text-slate-700'>{user?.name || 'Học sinh'}</p>
              <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>Học sinh</p>
            </div>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Student')}&background=0D8ABC&color=fff`}
              className='w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white shadow-sm'
              alt='Avatar'
            />
          </div>
          <button
            onClick={handleLogout}
            className='flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-bold text-xs sm:text-sm'
          >
            <i className='fas fa-sign-out-alt'></i>
            <span className='hidden sm:inline'>Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className='pt-16 sm:pt-20 pb-6 sm:pb-10 px-3 sm:px-4'>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100/80'
          >
            <div className='bg-white border-b border-gray-100 px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-8 text-center relative'>
              <div className='relative z-10'>
                <BookOpen className='w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 mx-auto mb-2 sm:mb-3' />
                <h1 className='text-xl sm:text-3xl font-bold text-gray-900 mb-1 tracking-wide'>KẾT QUẢ BÀI THI</h1>
                <p className='text-gray-500 text-sm sm:text-lg font-normal'>{result.examSessionName}</p>
              </div>
            </div>

            <div className='px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center space-y-6 border-b border-gray-100'>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className='relative w-28 h-28 sm:w-36 sm:h-36'
              >
                <svg className='w-28 h-28 sm:w-36 sm:h-36 transform -rotate-90'>
                  <circle
                    cx='56'
                    cy='56'
                    r='50'
                    stroke='currentColor'
                    strokeWidth='8'
                    fill='none'
                    className='text-gray-200 sm:hidden'
                  />
                  <circle
                    cx='72'
                    cy='72'
                    r='65'
                    stroke='currentColor'
                    strokeWidth='10'
                    fill='none'
                    className='text-gray-200 hidden sm:block'
                  />
                  <motion.circle
                    cx='56'
                    cy='56'
                    r='50'
                    stroke={statusGradient}
                    strokeWidth='8'
                    fill='none'
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`drop-shadow-sm ${statusColor} sm:hidden`}
                    style={{ strokeLinecap: 'round' }}
                  />
                  <motion.circle
                    cx='72'
                    cy='72'
                    r='65'
                    stroke={statusGradient}
                    strokeWidth='10'
                    fill='none'
                    strokeDasharray={`${2 * Math.PI * 65}`}
                    strokeDashoffset={`${2 * Math.PI * 65 * (1 - percentage / 100)}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 65 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 65 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`drop-shadow-sm ${statusColor} hidden sm:block`}
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: 'spring' }}
                    className={`text-2xl sm:text-4xl font-semibold ${statusColor}`}
                  >
                    {score}
                  </motion.span>
                  <span className='text-xs sm:text-sm text-gray-400 -mt-0.5 sm:-mt-1 font-light'>/10</span>
                </div>
              </motion.div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full max-w-2xl'>
                {[
                  {
                    icon: CheckCircle,
                    label: 'Đúng',
                    value: correctCount,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    borderColor: 'border-emerald-200'
                  },
                  {
                    icon: XCircle,
                    label: 'Sai',
                    value: wrongCount,
                    color: 'text-rose-600',
                    bg: 'bg-rose-50',
                    borderColor: 'border-rose-200'
                  },
                  {
                    icon: Clock,
                    label: 'Chưa làm',
                    value: unansweredCount,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    borderColor: 'border-amber-200'
                  },
                  {
                    icon: FileText,
                    label: 'Tổng',
                    value: totalQuestions,
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    borderColor: 'border-gray-200'
                  }
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`${stat.bg} rounded-lg p-2 sm:p-3 text-center border ${stat.borderColor}`}
                  >
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} mx-auto mb-1`} />
                    <p className='text-xs sm:text-sm text-gray-500 font-light'>{stat.label}</p>
                    <p className={`text-lg sm:text-xl font-medium ${stat.color} mt-0.5`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className='px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-b border-gray-100 space-y-2'>
              <div className='flex items-center justify-between text-xs sm:text-sm text-gray-500 font-light'>
                <div className='flex items-center gap-1 sm:gap-2'>
                  <Clock className='w-3 h-3 sm:w-4 sm:h-4' />
                  <span>Thời gian nộp:</span>
                </div>
                <span className='text-gray-700 font-normal text-xs sm:text-sm'>{toLocalStringISO(result.submittedAt)}</span>
              </div>

              {result.passingScore !== null && (
                <div className='flex items-center justify-between text-xs sm:text-sm'>
                  <span className='text-gray-500 font-light'>Điểm sàn:</span>
                  <span className='text-purple-600 font-semibold'>{result.passingScore.toFixed(2)}</span>
                </div>
              )}

              {result.isPassed !== null && (
                <div className='flex items-center justify-between text-xs sm:text-sm'>
                  <span className='text-gray-500 font-light'>Kết quả:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${result.isPassed ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {result.isPassed ? (
                      <>
                        <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4' />
                        Đạt yêu cầu
                      </>
                    ) : (
                      <>
                        <XCircle className='w-3 h-3 sm:w-4 sm:h-4' />
                        Chưa đạt
                      </>
                    )}
                  </span>
                </div>
              )}

              {result.exitCount > 0 && (
                <div className='flex items-center justify-between text-xs sm:text-sm'>
                  <span className='text-gray-500 font-light'>Số lần thoát:</span>
                  <span className='text-orange-600 font-semibold'>{result.exitCount}</span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {result.teacherOverallFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className='px-4 sm:px-6 py-4 sm:py-5 bg-indigo-50 border-l-4 border-indigo-400 text-gray-800'
                >
                  <div className='flex items-start gap-2 sm:gap-3'>
                    <MessageSquare className='w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-normal text-indigo-700 mb-1 text-xs sm:text-sm'>Phản hồi chung từ Giáo viên:</p>
                      <p className='text-xs sm:text-sm font-light leading-relaxed'>{result.teacherOverallFeedback}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className='px-4 sm:px-6 py-6 sm:py-8'>
              <div className='space-y-3 sm:space-y-4'>
                {result.questions.map((q, idx) => {
                  // Phân loại trạng thái câu hỏi
                  const hasSelected = q.answers.some((a) => a.selected)
                  const isCorrect = q.answers.some((a) => a.correct && a.selected)
                  const isWrong = hasSelected && !isCorrect
                  const isExpanded = openExplanationId === q.questionId

                  // Màu sắc theo trạng thái
                  let questionBorder, questionBg, iconColor, statusIcon, statusBadge, statusBadgeBg, statusBadgeText

                  if (isCorrect) {
                    questionBorder = 'border-l-4 border-l-emerald-500 border border-gray-200'
                    questionBg = 'bg-emerald-50'
                    iconColor = 'text-emerald-600'
                    statusIcon = <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5' />
                    statusBadge = 'Đúng'
                    statusBadgeBg = 'bg-emerald-500'
                    statusBadgeText = 'text-white'
                  } else if (isWrong) {
                    questionBorder = 'border-l-4 border-l-rose-500 border border-gray-200'
                    questionBg = 'bg-rose-50'
                    iconColor = 'text-rose-600'
                    statusIcon = <XCircle className='w-4 h-4 sm:w-5 sm:h-5' />
                    statusBadge = 'Sai'
                    statusBadgeBg = 'bg-rose-500'
                    statusBadgeText = 'text-white'
                  } else {
                    questionBorder = 'border-l-4 border-l-amber-500 border border-gray-200'
                    questionBg = 'bg-amber-50'
                    iconColor = 'text-amber-600'
                    statusIcon = <Clock className='w-4 h-4 sm:w-5 sm:h-5' />
                    statusBadge = 'Chưa làm'
                    statusBadgeBg = 'bg-amber-500'
                    statusBadgeText = 'text-white'
                  }

                  return (
                    <motion.div
                      key={q.questionId}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`rounded-lg transition-all ${questionBorder}`}
                    >
                      <button
                        className={`w-full flex items-start justify-between p-3 sm:p-4 text-left transition-colors ${isExpanded ? questionBg : 'bg-white hover:bg-gray-50'}`}
                        onClick={() => toggleQuestion(q.questionId)}
                      >
                        <div className='flex items-start gap-2 sm:gap-3 flex-grow'>
                          <span className={`text-base font-normal ${iconColor} flex-shrink-0 pt-0.5`}>
                            {statusIcon}
                          </span>
                          <div className='flex-grow'>
                            <div className='flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap'>
                              <span className='bg-gray-200 text-gray-700 text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 rounded'>
                                Câu {idx + 1}
                              </span>
                              <span
                                className={`${statusBadgeBg} ${statusBadgeText} text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 rounded`}
                              >
                                {statusBadge}
                              </span>
                              {q.teacherFeedback && (
                                <span className='bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full inline-flex items-center gap-1'>
                                  <MessageSquare className='w-2.5 h-2.5 sm:w-3 sm:h-3' />
                                  <span className='hidden sm:inline'>Nhận xét GV</span>
                                  <span className='sm:hidden'>GV</span>
                                </span>
                              )}
                            </div>
                            <p className='text-sm sm:text-base font-light text-gray-800 leading-relaxed'>{q.content}</p>
                          </div>
                        </div>

                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className='flex-shrink-0 ml-2 pt-1'
                        >
                          <ChevronDown className='w-4 h-4 sm:w-5 sm:h-5 text-gray-500' />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`p-3 sm:p-4 border-t ${questionBorder} space-y-2 sm:space-y-3 ${questionBg}`}
                          >
                            <div className='space-y-1.5 sm:space-y-2'>
                              {q.answers.map((a) => {
                                let answerStyle = ''
                                if (a.correct) {
                                  answerStyle = 'bg-emerald-100 border-l-4 border-l-emerald-500 border border-emerald-200 text-emerald-900'
                                } else if (a.selected) {
                                  answerStyle = 'bg-rose-100 border-l-4 border-l-rose-500 border border-rose-200 text-rose-900'
                                } else {
                                  answerStyle = 'bg-white border border-gray-200 text-gray-700'
                                }

                                return (
                                  <div
                                    key={a.answerId}
                                    className={`flex items-center p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-light border transition-all ${answerStyle}`}
                                  >
                                    <span className='flex-grow'>{a.content}</span>
                                    {a.correct && (
                                      <span className='ml-2 text-[10px] sm:text-xs bg-emerald-600 text-white px-1.5 sm:px-2 py-0.5 rounded font-medium whitespace-nowrap'>
                                        Đáp án đúng
                                      </span>
                                    )}
                                    {a.selected && !a.correct && (
                                      <span className='ml-2 text-[10px] sm:text-xs bg-rose-600 text-white px-1.5 sm:px-2 py-0.5 rounded font-medium whitespace-nowrap'>
                                        Bạn chọn
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {q.explanation && (
                              <div className='mt-2 sm:mt-3 p-3 sm:p-4 bg-blue-50/80 rounded-lg shadow-inner text-gray-700 border border-blue-200'>
                                <div className='flex items-start gap-2'>
                                  <BookOpen className='w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0 mt-0.5' />
                                  <div>
                                    <p className='text-[10px] sm:text-xs font-semibold text-blue-700 mb-1'>Giải thích đáp án:</p>
                                    <p className='text-xs sm:text-sm font-light leading-relaxed'>{q.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.teacherFeedback && (
                              <div className='mt-2 sm:mt-3 p-3 sm:p-4 bg-amber-50/80 rounded-lg shadow-inner text-gray-700 border border-amber-200'>
                                <div className='flex items-start gap-2'>
                                  <MessageSquare className='w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0 mt-0.5' />
                                  <div>
                                    <p className='text-[10px] sm:text-xs font-semibold text-amber-700 mb-1'>Phản hồi của Giáo viên:</p>
                                    <p className='text-xs sm:text-sm font-light leading-relaxed'>{q.teacherFeedback}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className='p-4 sm:p-6 pt-0'>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className='text-center border-t pt-4 sm:pt-6 border-gray-100'
              >
                <button
                  onClick={() => navigate('/student')}
                  className='group inline-flex items-center gap-2 bg-gray-800 text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-normal text-sm sm:text-base hover:bg-gray-700 transition-all duration-300 shadow-lg'
                >
                  <span className='font-light'>Quay lại trang chủ</span>
                  <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform' />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
