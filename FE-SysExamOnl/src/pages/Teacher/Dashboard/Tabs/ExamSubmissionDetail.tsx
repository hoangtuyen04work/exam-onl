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
    if (!feedback.trim()) {
      toast.error('Vui lòng nhập nhận xét!')
      return
    }

    setSending(true)
    try {
      const res = await axiosClient.post(
        `/teacher/exam-sessions/${examSessionStudentId}`,
        { teacherOverallFeedBack: feedback.trim() }
      )

      if (res.data.success) {
        toast.success('Đã gửi nhận xét thành công!')
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
    if (selected && correct) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (selected && !correct) return <XCircle className="w-4 h-4 text-red-600" />
    if (!selected && correct) return <CheckCircle className="w-4 h-4 text-green-400" />
    return <HelpCircle className="w-4 h-4 text-gray-400" />
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải bài làm...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Không có dữ liệu bài làm
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bài làm – Phiên: {data.examSessionName}
          </h1>
          <p className="text-sm text-gray-500">
            ID: {examSessionStudentId} • Tổng điểm: <strong className="text-green-700">{data.totalScore}</strong>
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Trạng thái:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              data.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              data.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.status === 'COMPLETED' ? 'Đã nộp' : data.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chưa làm'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Nộp lúc:</span>
            <span className="ml-2 text-gray-800">{formatTime(data.submittedAt)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Tổng câu:</span>
            <span className="ml-2 text-gray-800">{data.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Feedback tổng quát (hiển thị nếu có) */}
      {data.teacherOverallFeedback && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-yellow-700 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Nhận xét hiện tại:</p>
            <p className="text-yellow-800 mt-1 whitespace-pre-wrap">{data.teacherOverallFeedback}</p>
          </div>
        </div>
      )}

      {/* Ô nhập feedback mới */}
      <div className="bg-white border rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Gửi nhận xét cho học sinh
        </h3>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Nhập nhận xét chung cho bài làm này..."
          className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          rows={4}
        />

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setFeedback(data.teacherOverallFeedback || '')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : (
              'Gửi nhận xét'
            )}
          </button>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-6">
        {data.questions.map((q, qIndex) => {
          const correctAnswers = q.answers.filter(a => a.correct).length
          const selectedCorrect = q.answers.filter(a => a.selected && a.correct).length
          const hasWrong = q.answers.some(a => a.selected && !a.correct)
          const isPerfect = selectedCorrect === correctAnswers && !hasWrong

          return (
            <div key={q.questionId} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  Câu {qIndex + 1}: <span dangerouslySetInnerHTML={{ __html: q.content }} />
                </h3>
                {isPerfect && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>

              <div className="space-y-2 ml-6">
                {q.answers.map((ans) => (
                  <div
                    key={ans.answerId}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                      ans.selected && ans.correct
                        ? 'bg-green-50 border-green-300'
                        : ans.selected && !ans.correct
                        ? 'bg-red-50 border-red-300'
                        : ans.correct
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {getAnswerIcon(ans.correct, ans.selected)}
                    <span
                      className={ans.correct ? 'font-medium' : ''}
                      dangerouslySetInnerHTML={{ __html: ans.content }}
                    />
                    {ans.correct && <span className="text-xs text-green-600 ml-auto">(Đáp án đúng)</span>}
                  </div>
                ))}
              </div>

              {/* Giải thích */}
              {q.explanation && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                  <strong>Giải thích:</strong> {q.explanation}
                </div>
              )}

              {/* Feedback riêng cho câu */}
              {q.teacherFeedback && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
                  <strong>Nhận xét câu này:</strong> {q.teacherFeedback}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}