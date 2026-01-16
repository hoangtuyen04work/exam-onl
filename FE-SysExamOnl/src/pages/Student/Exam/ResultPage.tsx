import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
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
  const hasPassed = result.isPassed ?? percentage >= 50
  const statusColor = hasPassed ? 'text-emerald-500' : 'text-rose-500'

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* SIMPLE HEADER - Mobile Style like in image */}
      <header className='sticky top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between shadow-sm'>
        <button
          onClick={() => navigate('/student')}
          className='flex items-center gap-2 text-gray-700 hover:text-gray-900'
        >
          <i className='fas fa-arrow-left text-lg'></i>
        </button>
        
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center'>
            <i className='fas fa-graduation-cap text-white text-sm'></i>
          </div>
          <span className='text-base font-semibold text-gray-900'>ExamOnlineSystem</span>
        </div>

        <button
          onClick={handleLogout}
          className='w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600'
          title='Đăng xuất'
        >
          <i className='fas fa-sign-out-alt text-sm'></i>
        </button>
      </header>

      {/* MAIN CONTENT - Card Style */}
      <div className='px-4 py-4'>
        {/* Title Section */}
        <div className='mb-4'>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>Kết quả bài thi</h1>
          <p className='text-sm text-gray-600'>{result.examSessionName}</p>
        </div>

        {/* Score Card - Clean white card */}
        <div className='bg-white rounded-lg border border-gray-200 p-4 mb-3'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <div className='w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center'>
                <FileText className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <h3 className='text-sm font-semibold text-gray-900'>Điểm số</h3>
                <p className='text-xs text-gray-500'>
                  {toLocalStringISO(result.submittedAt)}
                </p>
              </div>
            </div>
            <div className='text-right'>
              <div className={`text-2xl font-bold ${statusColor}`}>{score}</div>
              <div className='text-xs text-gray-500'>/10</div>
            </div>
          </div>

          {/* Stats Row */}
          <div className='grid grid-cols-3 gap-2 pt-3 border-t border-gray-100'>
            <div className='text-center'>
              <div className='text-base font-semibold text-emerald-600'>{correctCount}</div>
              <div className='text-xs text-gray-500'>Đúng</div>
            </div>
            <div className='text-center border-x border-gray-100'>
              <div className='text-base font-semibold text-rose-600'>{wrongCount}</div>
              <div className='text-xs text-gray-500'>Sai</div>
            </div>
            <div className='text-center'>
              <div className='text-base font-semibold text-amber-600'>{unansweredCount}</div>
              <div className='text-xs text-gray-500'>Bỏ qua</div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {result.isPassed !== null && (
          <div className={`rounded-lg border p-3 mb-3 ${result.isPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className='flex items-center gap-2'>
              {result.isPassed ? (
                <CheckCircle className='w-5 h-5 text-emerald-600' />
              ) : (
                <XCircle className='w-5 h-5 text-rose-600' />
              )}
              <div>
                <div className={`text-sm font-semibold ${result.isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {result.isPassed ? 'Đạt yêu cầu' : 'Chưa đạt'}
                </div>
                {result.passingScore !== null && (
                  <div className='text-xs text-gray-600'>
                    Điểm sàn: {result.passingScore.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teacher Feedback */}
        {result.teacherOverallFeedback && (
          <div className='bg-blue-50 rounded-lg border border-blue-200 p-3 mb-3'>
            <div className='flex items-start gap-2'>
              <MessageSquare className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
              <div>
                <div className='text-xs font-semibold text-blue-700 mb-1'>Nhận xét chung:</div>
                <div className='text-sm text-gray-700 leading-relaxed'>{result.teacherOverallFeedback}</div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className='mb-4'>
          <h2 className='text-base font-semibold text-gray-900 mb-3'>Chi tiết câu hỏi</h2>
          
          <div className='space-y-2'>
            {result.questions.map((q, idx) => {
              const hasSelected = q.answers.some((a) => a.selected)
              const isCorrect = q.answers.some((a) => a.correct && a.selected)
              const isWrong = hasSelected && !isCorrect
              const isExpanded = openExplanationId === q.questionId

              // Determine badge label text
              let badgeLabel = 'Chưa làm'
              if (isCorrect) {
                badgeLabel = 'Đúng'
              } else if (isWrong) {
                badgeLabel = 'Sai'
              }

              let cardBg, badgeBg, badgeText, iconComponent

              if (isCorrect) {
                cardBg = 'bg-white border-emerald-200'
                badgeBg = 'bg-emerald-500'
                badgeText = 'text-white'
                iconComponent = <CheckCircle className='w-4 h-4 text-emerald-600' />
              } else if (isWrong) {
                cardBg = 'bg-white border-rose-200'
                badgeBg = 'bg-rose-500'
                badgeText = 'text-white'
                iconComponent = <XCircle className='w-4 h-4 text-rose-600' />
              } else {
                cardBg = 'bg-white border-gray-200'
                badgeBg = 'bg-amber-500'
                badgeText = 'text-white'
                iconComponent = <Clock className='w-4 h-4 text-amber-600' />
              }

              return (
                <div key={q.questionId} className={`${cardBg} rounded-lg border overflow-hidden`}>
                  <button
                    onClick={() => toggleQuestion(q.questionId)}
                    className='w-full p-3 text-left hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start gap-2'>
                      <div className='mt-0.5'>{iconComponent}</div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-xs font-medium text-gray-600'>Câu {idx + 1}</span>
                          <span className={`${badgeBg} ${badgeText} text-[10px] font-medium px-2 py-0.5 rounded`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <p className='text-sm text-gray-800 leading-relaxed'>{q.content}</p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='border-t border-gray-100 bg-gray-50'
                      >
                        <div className='p-3 space-y-2'>
                          {/* Answers */}
                          {q.answers.map((a) => {
                            let answerClass = 'bg-white border-gray-200 text-gray-700'
                            let badge = null

                            if (a.correct) {
                              answerClass = 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              badge = (
                                <span className='text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium'>
                                  Đáp án đúng
                                </span>
                              )
                            } else if (a.selected) {
                              answerClass = 'bg-rose-50 border-rose-300 text-rose-900'
                              badge = (
                                <span className='text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-medium'>
                                  Bạn chọn
                                </span>
                              )
                            }

                            return (
                              <div
                                key={a.answerId}
                                className={`${answerClass} border rounded-md p-2 flex items-start gap-2 text-xs`}
                              >
                                <span className='flex-1'>{a.content}</span>
                                {badge}
                              </div>
                            )
                          })}

                          {/* Explanation */}
                          {q.explanation && (
                            <div className='bg-blue-50 border border-blue-200 rounded-md p-2 mt-2'>
                              <div className='flex items-start gap-1.5'>
                                <BookOpen className='w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0' />
                                <div>
                                  <div className='text-[10px] font-semibold text-blue-700 mb-0.5'>
                                    Giải thích:
                                  </div>
                                  <div className='text-xs text-gray-700 leading-relaxed'>{q.explanation}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Teacher Feedback */}
                          {q.teacherFeedback && (
                            <div className='bg-purple-50 border border-purple-200 rounded-md p-2 mt-2'>
                              <div className='flex items-start gap-1.5'>
                                <MessageSquare className='w-3.5 h-3.5 text-purple-600 mt-0.5 flex-shrink-0' />
                                <div>
                                  <div className='text-[10px] font-semibold text-purple-700 mb-0.5'>
                                    Nhận xét GV:
                                  </div>
                                  <div className='text-xs text-gray-700 leading-relaxed'>{q.teacherFeedback}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/student')}
          className='w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2'
        >
          <span>Quay lại trang chủ</span>
          <ChevronRight className='w-4 h-4' />
        </button>
      </div>
    </div>
  )
}