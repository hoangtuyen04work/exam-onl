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
      {/* FIXED HEADER - Optimized for 320px+ screens */}
      <header className='fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-slate-200 z-50 px-3 md:px-6 flex justify-between items-center shadow-sm'>
        <div
          className='flex items-center space-x-2 md:space-x-3 cursor-pointer hover:opacity-80 transition'
          onClick={() => navigate('/student')}
        >
          <div className='bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-blue-200 shadow-lg'>
            <i className='fas fa-graduation-cap text-white text-sm md:text-lg'></i>
          </div>
          <span className='text-sm md:text-xl font-bold tracking-tight text-slate-800 truncate max-w-[120px] sm:max-w-none'>
            ExamOnlineSystem
          </span>
        </div>

        <div className='flex items-center space-x-2 md:space-x-4'>
          <div className='flex items-center space-x-1.5 md:space-x-3 border-r pr-2 md:pr-4 border-slate-200'>
            <div className='text-right hidden lg:block'>
              <p className='text-sm font-bold text-slate-700'>{user?.name || 'Học sinh'}</p>
              <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>Học sinh</p>
            </div>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Student')}&background=0D8ABC&color=fff`}
              className='w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-white shadow-sm'
              alt='Avatar'
            />
          </div>
          <button
            onClick={handleLogout}
            className='flex items-center justify-center md:justify-start space-x-0 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-bold text-xs md:text-sm min-w-[36px] md:min-w-0'
            title='Đăng xuất'
          >
            <i className='fas fa-sign-out-alt text-sm md:text-base'></i>
            <span className='hidden md:inline'>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT - Mobile-first: 320px+ */}
      <div className='pt-16 md:pt-20 pb-4 md:pb-10 px-3 md:px-4'>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='bg-white rounded-lg md:rounded-xl shadow-xl md:shadow-2xl overflow-hidden border border-gray-100/80'
          >
            {/* HEADER SECTION */}
            <div className='bg-white border-b border-gray-100 px-3 md:px-6 pt-4 md:pt-10 pb-3 md:pb-8 text-center relative'>
              <div className='relative z-10'>
                <BookOpen className='w-5 h-5 md:w-8 md:h-8 text-indigo-500 mx-auto mb-1.5 md:mb-3' />
                <h1 className='text-lg md:text-3xl font-bold text-gray-900 mb-0.5 md:mb-1 tracking-wide'>
                  KẾT QUẢ BÀI THI
                </h1>
                <p className='text-gray-500 text-xs md:text-lg font-normal line-clamp-2 px-2'>{result.examSessionName}</p>
              </div>
            </div>

            {/* SCORE & STATS SECTION - Stacked on mobile, side-by-side on tablet+ */}
            <div className='px-3 md:px-6 py-4 md:py-8 flex flex-col items-center space-y-4 md:space-y-6 border-b border-gray-100'>
              {/* Score Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className='relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36'
              >
                {/* Mobile Circle (320px - 767px) */}
                <svg className='w-24 h-24 md:hidden transform -rotate-90'>
                  <circle
                    cx='48'
                    cy='48'
                    r='42'
                    stroke='currentColor'
                    strokeWidth='7'
                    fill='none'
                    className='text-gray-200'
                  />
                  <motion.circle
                    cx='48'
                    cy='48'
                    r='42'
                    stroke={statusGradient}
                    strokeWidth='7'
                    fill='none'
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`drop-shadow-sm ${statusColor}`}
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                
                {/* Tablet Circle (768px - 1023px) */}
                <svg className='w-32 h-32 hidden md:block lg:hidden transform -rotate-90'>
                  <circle
                    cx='64'
                    cy='64'
                    r='56'
                    stroke='currentColor'
                    strokeWidth='9'
                    fill='none'
                    className='text-gray-200'
                  />
                  <motion.circle
                    cx='64'
                    cy='64'
                    r='56'
                    stroke={statusGradient}
                    strokeWidth='9'
                    fill='none'
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`drop-shadow-sm ${statusColor}`}
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                
                {/* Desktop Circle (1024px+) */}
                <svg className='w-36 h-36 hidden lg:block transform -rotate-90'>
                  <circle
                    cx='72'
                    cy='72'
                    r='65'
                    stroke='currentColor'
                    strokeWidth='10'
                    fill='none'
                    className='text-gray-200'
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
                    className={`drop-shadow-sm ${statusColor}`}
                    style={{ strokeLinecap: 'round' }}
                  />
                </svg>
                
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: 'spring' }}
                    className={`text-2xl md:text-3xl lg:text-4xl font-semibold ${statusColor}`}
                  >
                    {score}
                  </motion.span>
                  <span className='text-xs md:text-sm text-gray-400 -mt-0.5 md:-mt-1 font-light'>/10</span>
                </div>
              </motion.div>

              {/* Stats Grid - 2x2 on mobile, 4 columns on tablet+ */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4 w-full max-w-2xl'>
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
                    className={`${stat.bg} rounded-md md:rounded-lg p-2 md:p-3 text-center border ${stat.borderColor}`}
                  >
                    <stat.icon className={`w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ${stat.color} mx-auto mb-0.5 md:mb-1`} />
                    <p className='text-[10px] md:text-xs lg:text-sm text-gray-500 font-light'>{stat.label}</p>
                    <p className={`text-base md:text-lg lg:text-xl font-medium ${stat.color} mt-0.5`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* METADATA SECTION */}
            <div className='px-3 md:px-6 py-2.5 md:py-4 bg-gray-50/50 border-b border-gray-100 space-y-1.5 md:space-y-2'>
              <div className='flex items-center justify-between text-[11px] md:text-sm text-gray-500 font-light'>
                <div className='flex items-center gap-1 md:gap-2'>
                  <Clock className='w-3 h-3 md:w-4 md:h-4 flex-shrink-0' />
                  <span>Thời gian nộp:</span>
                </div>
                <span className='text-gray-700 font-normal text-[11px] md:text-sm text-right'>
                  {toLocalStringISO(result.submittedAt)}
                </span>
              </div>

              {result.passingScore !== null && (
                <div className='flex items-center justify-between text-[11px] md:text-sm'>
                  <span className='text-gray-500 font-light'>Điểm sàn:</span>
                  <span className='text-purple-600 font-semibold'>{result.passingScore.toFixed(2)}</span>
                </div>
              )}

              {result.isPassed !== null && (
                <div className='flex items-center justify-between text-[11px] md:text-sm'>
                  <span className='text-gray-500 font-light'>Kết quả:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${result.isPassed ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {result.isPassed ? (
                      <>
                        <CheckCircle className='w-3 h-3 md:w-4 md:h-4' />
                        <span>Đạt yêu cầu</span>
                      </>
                    ) : (
                      <>
                        <XCircle className='w-3 h-3 md:w-4 md:h-4' />
                        <span>Chưa đạt</span>
                      </>
                    )}
                  </span>
                </div>
              )}

              {result.exitCount > 0 && (
                <div className='flex items-center justify-between text-[11px] md:text-sm'>
                  <span className='text-gray-500 font-light'>Số lần thoát:</span>
                  <span className='text-orange-600 font-semibold'>{result.exitCount}</span>
                </div>
              )}
            </div>

            {/* TEACHER FEEDBACK */}
            <AnimatePresence>
              {result.teacherOverallFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className='px-3 md:px-6 py-3 md:py-5 bg-indigo-50 border-l-4 border-indigo-400 text-gray-800'
                >
                  <div className='flex items-start gap-2 md:gap-3'>
                    <MessageSquare className='w-4 h-4 md:w-5 md:h-5 text-indigo-500 flex-shrink-0 mt-0.5' />
                    <div className='flex-1 min-w-0'>
                      <p className='font-normal text-indigo-700 mb-1 text-[11px] md:text-sm'>
                        Phản hồi chung từ Giáo viên:
                      </p>
                      <p className='text-[11px] md:text-sm font-light leading-relaxed break-words'>
                        {result.teacherOverallFeedback}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QUESTIONS LIST */}
            <div className='px-3 md:px-6 py-4 md:py-8'>
              <div className='space-y-2.5 md:space-y-4'>
                {result.questions.map((q, idx) => {
                  const hasSelected = q.answers.some((a) => a.selected)
                  const isCorrect = q.answers.some((a) => a.correct && a.selected)
                  const isWrong = hasSelected && !isCorrect
                  const isExpanded = openExplanationId === q.questionId

                  let questionBorder, questionBg, iconColor, statusIcon, statusBadge, statusBadgeBg, statusBadgeText

                  if (isCorrect) {
                    questionBorder = 'border-l-4 border-l-emerald-500 border border-gray-200'
                    questionBg = 'bg-emerald-50'
                    iconColor = 'text-emerald-600'
                    statusIcon = <CheckCircle className='w-4 h-4 md:w-5 md:h-5' />
                    statusBadge = 'Đúng'
                    statusBadgeBg = 'bg-emerald-500'
                    statusBadgeText = 'text-white'
                  } else if (isWrong) {
                    questionBorder = 'border-l-4 border-l-rose-500 border border-gray-200'
                    questionBg = 'bg-rose-50'
                    iconColor = 'text-rose-600'
                    statusIcon = <XCircle className='w-4 h-4 md:w-5 md:h-5' />
                    statusBadge = 'Sai'
                    statusBadgeBg = 'bg-rose-500'
                    statusBadgeText = 'text-white'
                  } else {
                    questionBorder = 'border-l-4 border-l-amber-500 border border-gray-200'
                    questionBg = 'bg-amber-50'
                    iconColor = 'text-amber-600'
                    statusIcon = <Clock className='w-4 h-4 md:w-5 md:h-5' />
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
                      className={`rounded-md md:rounded-lg transition-all ${questionBorder}`}
                    >
                      <button
                        className={`w-full flex items-start justify-between p-2.5 md:p-4 text-left transition-colors ${isExpanded ? questionBg : 'bg-white hover:bg-gray-50'}`}
                        onClick={() => toggleQuestion(q.questionId)}
                      >
                        <div className='flex items-start gap-2 md:gap-3 flex-grow min-w-0'>
                          <span className={`text-base font-normal ${iconColor} flex-shrink-0 pt-0.5`}>
                            {statusIcon}
                          </span>
                          <div className='flex-grow min-w-0'>
                            <div className='flex items-center gap-1 md:gap-2 mb-1 md:mb-2 flex-wrap'>
                              <span className='bg-gray-200 text-gray-700 text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded whitespace-nowrap'>
                                Câu {idx + 1}
                              </span>
                              <span
                                className={`${statusBadgeBg} ${statusBadgeText} text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded whitespace-nowrap`}
                              >
                                {statusBadge}
                              </span>
                              {q.teacherFeedback && (
                                <span className='bg-purple-100 text-purple-700 text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 md:gap-1 whitespace-nowrap'>
                                  <MessageSquare className='w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0' />
                                  <span className='hidden sm:inline'>Nhận xét GV</span>
                                  <span className='sm:hidden'>GV</span>
                                </span>
                              )}
                            </div>
                            <p className='text-xs md:text-base font-light text-gray-800 leading-relaxed break-words'>
                              {q.content}
                            </p>
                          </div>
                        </div>

                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className='flex-shrink-0 ml-1.5 md:ml-2 pt-1'
                        >
                          <ChevronDown className='w-4 h-4 md:w-5 md:h-5 text-gray-500' />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`p-2.5 md:p-4 border-t ${questionBorder} space-y-2 md:space-y-3 ${questionBg}`}
                          >
                            <div className='space-y-1.5 md:space-y-2'>
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
                                    className={`flex items-start md:items-center gap-2 p-2 md:p-3 rounded-md md:rounded-lg text-[11px] md:text-sm font-light border transition-all ${answerStyle}`}
                                  >
                                    <span className='flex-grow break-words'>{a.content}</span>
                                    {a.correct && (
                                      <span className='ml-1 text-[9px] md:text-xs bg-emerald-600 text-white px-1.5 md:px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0'>
                                        Đáp án đúng
                                      </span>
                                    )}
                                    {a.selected && !a.correct && (
                                      <span className='ml-1 text-[9px] md:text-xs bg-rose-600 text-white px-1.5 md:px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0'>
                                        Bạn chọn
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {q.explanation && (
                              <div className='mt-2 md:mt-3 p-2.5 md:p-4 bg-blue-50/80 rounded-md md:rounded-lg shadow-inner text-gray-700 border border-blue-200'>
                                <div className='flex items-start gap-1.5 md:gap-2'>
                                  <BookOpen className='w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0 mt-0.5' />
                                  <div className='flex-1 min-w-0'>
                                    <p className='text-[10px] md:text-xs font-semibold text-blue-700 mb-0.5 md:mb-1'>
                                      Giải thích đáp án:
                                    </p>
                                    <p className='text-[11px] md:text-sm font-light leading-relaxed break-words'>
                                      {q.explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.teacherFeedback && (
                              <div className='mt-2 md:mt-3 p-2.5 md:p-4 bg-amber-50/80 rounded-md md:rounded-lg shadow-inner text-gray-700 border border-amber-200'>
                                <div className='flex items-start gap-1.5 md:gap-2'>
                                  <MessageSquare className='w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0 mt-0.5' />
                                  <div className='flex-1 min-w-0'>
                                    <p className='text-[10px] md:text-xs font-semibold text-amber-700 mb-0.5 md:mb-1'>
                                      Phản hồi của Giáo viên:
                                    </p>
                                    <p className='text-[11px] md:text-sm font-light leading-relaxed break-words'>
                                      {q.teacherFeedback}
                                    </p>
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

            {/* FOOTER BUTTON */}
            <div className='p-3 md:p-6 pt-0'>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className='text-center border-t pt-3 md:pt-6 border-gray-100'
              >
                <button
                  onClick={() => navigate('/student')}
                  className='group inline-flex items-center justify-center gap-1.5 md:gap-2 bg-gray-800 text-white px-4 md:px-7 py-2 md:py-3 rounded-full font-normal text-xs md:text-base hover:bg-gray-700 transition-all duration-300 shadow-lg w-full sm:w-auto'
                >
                  <span className='font-light'>Quay lại trang chủ</span>
                  <ChevronRight className='w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform' />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
