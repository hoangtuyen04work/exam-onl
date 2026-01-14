import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, MessageSquare } from 'lucide-react'

interface Answer {
  answerId: number
  content: string
  correct: boolean
  selected: boolean
}

interface Question {
  questionId: number
  content: string
  explanation?: string
  teacherFeedback?: string
  answers: Answer[]
}

interface SubmissionData {
  examSessionId: number
  examSessionName: string
  totalScore: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED'
  submittedAt?: string
  teacherOverallFeedback?: string
  questions: Question[]
}

export default function ExamSubmissionDetail() {
  const [data, setData] = useState<SubmissionData | null>(null)
  const [feedback, setFeedback] = useState('')
  const [questionFeedbacks, setQuestionFeedbacks] = useState<Record<number, string>>({})
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { state } = useLocation()
  const examSessionStudentId = state?.examSessionStudentId

  useEffect(() => {
    if (!examSessionStudentId) {
      toast.error('Không có ID bài làm!')
      navigate(-1)
      return
    }

    const fetchSubmission = async () => {
      setLoading(true)
      try {
        const res = await axiosClient.get(`/teacher/exam-sessions/result/${examSessionStudentId}`)

        if (res.data.success && res.data.data) {
          const submission = res.data.data
          setData(submission)
          console.log('Dữ liệu bài làm:', submission)
          setFeedback(submission.teacherOverallFeedback || '')

          // Khởi tạo feedback từng câu
          const initialFeedbacks: Record<number, string> = {}
          submission.questions.forEach((q: Question) => {
            initialFeedbacks[q.questionId] = q.teacherFeedback || ''
          })
          setQuestionFeedbacks(initialFeedbacks)
        } else {
          toast.error(res.data.message || 'Không lấy được dữ liệu')
        }
      } catch (err: any) {
        toast.error('Lỗi khi tải bài làm')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [examSessionStudentId, navigate])

  const handleSendFeedback = async () => {
    if (!feedback.trim() && Object.values(questionFeedbacks).every((f) => !f.trim())) {
      toast.error('Vui lòng nhập ít nhất một nhận xét!')
      return
    }

    setSending(true)
    try {
      // Tạo payload với feedback tổng quát và feedback từng câu
      const payload: any = {
        teacherOverallFeedBack: feedback.trim() || null
      }

      // Thêm feedback cho từng câu nếu có - PHẢI KHỚP VỚI BACKEND DTO
      const teacherFeedBackRequests = Object.entries(questionFeedbacks)
        .filter(([_, feedbackText]) => feedbackText.trim())
        .map(([questionId, feedbackText]) => ({
          questionId: Number(questionId),
          teacherFeedBack: feedbackText.trim() // Chú ý: teacherFeedBack không phải teacherFeedback
        }))

      if (teacherFeedBackRequests.length > 0) {
        payload.teacherFeedBackRequests = teacherFeedBackRequests // Chú ý: teacherFeedBackRequests không phải questionFeedbacks
      }

      console.log('=== DEBUG PAYLOAD ===')
      console.log('Payload gửi lên:', JSON.stringify(payload, null, 2))
      console.log('Question Feedbacks:', questionFeedbacks)
      console.log('Filtered List:', teacherFeedBackRequests)

      const res = await axiosClient.post(`/teacher/exam-sessions/${examSessionStudentId}`, payload)

      if (res.data.success) {
        toast.success('Đã gửi nhận xét thành công!')
        // Reload dữ liệu để cập nhật
        window.location.reload()
      } else {
        toast.error(res.data.message || 'Gửi thất bại')
      }
    } catch (err: any) {
      toast.error('Lỗi khi gửi nhận xét')
      console.error(err)
    } finally {
      setSending(false)
    }
  }
  //hello

  const getAnswerIcon = (correct: boolean, selected: boolean) => {
    if (selected && correct) return <CheckCircle className='w-4 h-4 text-green-600' />
    if (selected && !correct) return <XCircle className='w-4 h-4 text-red-600' />
    if (!selected && correct) return <CheckCircle className='w-4 h-4 text-green-400' />
    return <HelpCircle className='w-4 h-4 text-gray-400' />
  }

  const formatTime = (iso?: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600'></div>
        <span className='ml-3 text-gray-600'>Đang tải bài làm...</span>
      </div>
    )
  }

  if (!data) {
    return <div className='text-center py-20 text-gray-500'>Không có dữ liệu bài làm</div>
  }

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
        <button onClick={() => navigate(-1)} className='p-2 hover:bg-gray-100 rounded-lg transition'>
          <ArrowLeft className='w-5 h-5' />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Bài làm – Phiên: {data.examSessionName}</h1>
          <p className='text-sm text-gray-500'>
            ID: {examSessionStudentId} • Tổng điểm: <strong className='text-green-700'>{data.totalScore}</strong>
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div>
            <span className='font-medium text-gray-600'>Trạng thái:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                data.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : data.status === 'IN_PROGRESS'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {data.status === 'COMPLETED' ? 'Đã nộp' : data.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chưa làm'}
            </span>
          </div>
          <div>
            <span className='font-medium text-gray-600'>Nộp lúc:</span>
            <span className='ml-2 text-gray-800'>{formatTime(data.submittedAt)}</span>
          </div>
          <div>
            <span className='font-medium text-gray-600'>Tổng câu:</span>
            <span className='ml-2 text-gray-800'>{data.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Feedback tổng quát (hiển thị nếu có) */}
      {data.teacherOverallFeedback && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3'>
          <MessageSquare className='w-5 h-5 text-yellow-700 mt-0.5' />
          <div>
            <p className='font-medium text-yellow-900'>Nhận xét hiện tại:</p>
            <p className='text-yellow-800 mt-1 whitespace-pre-wrap'>{data.teacherOverallFeedback}</p>
          </div>
        </div>
      )}

      {/* Ô nhập feedback mới */}
      <div className='bg-white border rounded-xl p-5 shadow-sm mb-6'>
        <h3 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
          <MessageSquare className='w-5 h-5 text-indigo-600' />
          Gửi nhận xét cho học sinh
        </h3>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder='Nhập nhận xét chung cho bài làm này...'
          className='w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition'
          rows={4}
        />

        <div className='mt-3 flex justify-end gap-2'>
          <button
            onClick={() => setFeedback(data.teacherOverallFeedback || '')}
            className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline'
          >
            Hủy
          </button>
          <button
            onClick={handleSendFeedback}
            disabled={sending || !feedback.trim()}
            className={`px-5 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              sending || !feedback.trim()
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {sending ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                Đang gửi...
              </>
            ) : (
              'Gửi nhận xét'
            )}
          </button>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className='space-y-6'>
        {data.questions.map((q, qIndex) => {
          const hasSelected = q.answers.some((a) => a.selected)
          const correctAnswers = q.answers.filter((a) => a.correct).length
          const selectedCorrect = q.answers.filter((a) => a.selected && a.correct).length
          const hasWrong = q.answers.some((a) => a.selected && !a.correct)
          const isPerfect = selectedCorrect === correctAnswers && !hasWrong && hasSelected
          const isUnanswered = !hasSelected

          // Xác định màu sắc theo trạng thái
          let questionBorder, questionBg, statusBadge, statusBadgeBg, statusIcon

          if (isPerfect) {
            questionBorder = 'border-l-4 border-l-emerald-500 border border-gray-200'
            questionBg = 'bg-emerald-50'
            statusBadge = 'Đúng'
            statusBadgeBg = 'bg-emerald-500'
            statusIcon = <CheckCircle className='w-5 h-5 text-emerald-600' />
          } else if (hasWrong || (hasSelected && !isPerfect)) {
            questionBorder = 'border-l-4 border-l-rose-500 border border-gray-200'
            questionBg = 'bg-rose-50'
            statusBadge = 'Sai'
            statusBadgeBg = 'bg-rose-500'
            statusIcon = <XCircle className='w-5 h-5 text-rose-600' />
          } else {
            questionBorder = 'border-l-4 border-l-amber-500 border border-gray-200'
            questionBg = 'bg-amber-50'
            statusBadge = 'Chưa làm'
            statusBadgeBg = 'bg-amber-500'
            statusIcon = <HelpCircle className='w-5 h-5 text-amber-600' />
          }

          return (
            <div key={q.questionId} className={`bg-white rounded-lg p-5 transition-all ${questionBorder}`}>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-start gap-3 flex-1'>
                  {statusIcon}
                  <div>
                    <div className='flex items-center gap-2 mb-2 flex-wrap'>
                      <span className='bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded'>
                        Câu {qIndex + 1}
                      </span>
                      <span className={`${statusBadgeBg} text-white text-xs font-medium px-2.5 py-0.5 rounded`}>
                        {statusBadge}
                      </span>
                      {q.teacherFeedback && (
                        <span className='bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1'>
                          <MessageSquare className='w-3 h-3' />
                          Đã nhận xét
                        </span>
                      )}
                    </div>
                    <h3 className='font-semibold text-gray-800 text-base'>
                      <span dangerouslySetInnerHTML={{ __html: q.content }} />
                    </h3>
                  </div>
                </div>
              </div>

              <div className='space-y-2 ml-8'>
                {q.answers.map((ans) => {
                  const answerStyle =
                    ans.correct && ans.selected
                      ? 'bg-emerald-100 border-l-4 border-l-emerald-500 border border-emerald-200'
                      : ans.selected && !ans.correct
                        ? 'bg-rose-100 border-l-4 border-l-rose-500 border border-rose-200'
                        : ans.correct
                          ? 'bg-emerald-50 border-l-4 border-l-emerald-400 border border-emerald-200'
                          : 'bg-white border border-gray-200'

                  return (
                    <div key={ans.answerId} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${answerStyle}`}>
                      {getAnswerIcon(ans.correct, ans.selected)}
                      <span
                        className={ans.correct ? 'font-medium text-gray-900' : 'text-gray-700'}
                        dangerouslySetInnerHTML={{ __html: ans.content }}
                      />
                      {ans.correct && ans.selected && (
                        <span className='text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-medium ml-auto'>
                          Chọn đúng
                        </span>
                      )}
                      {!ans.selected && ans.correct && (
                        <span className='text-xs bg-emerald-500 text-white px-2 py-0.5 rounded font-medium ml-auto'>
                          Đáp án đúng
                        </span>
                      )}
                      {ans.selected && !ans.correct && (
                        <span className='text-xs bg-rose-600 text-white px-2 py-0.5 rounded font-medium ml-auto'>
                          Chọn sai
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Giải thích */}
              {q.explanation && (
                <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900'>
                  <strong>Giải thích:</strong> {q.explanation}
                </div>
              )}

              {/* Feedback riêng cho câu (hiển thị nếu đã có) */}
              {q.teacherFeedback && (
                <div className='mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900'>
                  <strong>Nhận xét hiện tại:</strong> {q.teacherFeedback}
                </div>
              )}

              {/* Ô nhập feedback cho câu này */}
              <div className='mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between'>
                  <span>Nhận xét cho câu này:</span>
                  {questionFeedbacks[q.questionId] && (
                    <span className='text-xs text-gray-500'>{questionFeedbacks[q.questionId].length} ký tự</span>
                  )}
                </label>
                <textarea
                  value={questionFeedbacks[q.questionId] || ''}
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log(`Updating feedback for question ${q.questionId}:`, newValue)
                    setQuestionFeedbacks((prev) => ({
                      ...prev,
                      [q.questionId]: newValue
                    }))
                  }}
                  placeholder='Nhập nhận xét riêng cho câu hỏi này...'
                  className='w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm'
                  rows={2}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Nút gửi tất cả feedback ở cuối */}
      <div className='mt-6 flex justify-end'>
        <button
          onClick={handleSendFeedback}
          disabled={sending}
          className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
            sending
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}
        >
          {sending ? (
            <>
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              Đang gửi tất cả nhận xét...
            </>
          ) : (
            <>
              <MessageSquare className='w-4 h-4' />
              Gửi tất cả nhận xét
            </>
          )}
        </button>
      </div>
    </div>
  )
}
