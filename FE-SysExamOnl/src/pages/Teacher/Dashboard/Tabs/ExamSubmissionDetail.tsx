import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, MessageSquare, Send } from 'lucide-react'

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
  exitCount: number
  teacherOverallFeedback?: string
  questions: Question[]
}

export default function ExamSubmissionDetail() {
  const [data, setData] = useState<SubmissionData | null>(null)
  const [overallFeedback, setOverallFeedback] = useState('')
  const [questionFeedbacks, setQuestionFeedbacks] = useState<{ [key: number]: string }>({})
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
          setOverallFeedback(submission.teacherOverallFeedback || '')

          const qFeedbacks: { [key: number]: string } = {}
          submission.questions.forEach((q: Question) => {
            if (q.questionId && q.teacherFeedback) {
              qFeedbacks[q.questionId] = q.teacherFeedback
            }
          })
          setQuestionFeedbacks(qFeedbacks)
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

  const handleUpdateQuestionFeedback = (questionId: number, value: string) => {
    setQuestionFeedbacks((prev) => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSendFeedback = async () => {
    setSending(true)
    try {
      const teacherFeedBackRequests = Object.entries(questionFeedbacks)
        .filter(([_, fb]) => fb.trim())
        .map(([qId, fb]) => ({
          questionId: Number(qId),
          teacherFeedBack: fb.trim()
        }))

      const payload = {
        teacherOverallFeedBack: overallFeedback.trim() || undefined,
        teacherFeedBackRequests: teacherFeedBackRequests.length > 0 ? teacherFeedBackRequests : undefined
      }

      const res = await axiosClient.post(
        `/teacher/exam-sessions/${examSessionStudentId}`,
        payload
      )

      if (res.data.success) {
        toast.success('Đã gửi nhận xét thành công!')
        // Optional: reload data to confirm
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
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Đang tải bài làm...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500 font-medium">
        Không có dữ liệu bài làm
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bài làm – Phiên: {data.examSessionName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ID: {examSessionStudentId} • Tổng điểm: <strong className="text-green-700">{data.totalScore}</strong> • Số lần thoát: {data.exitCount}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin bài làm</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex flex-col">
            <span className="font-medium text-gray-600 mb-1">Trạng thái:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              data.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              data.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.status === 'COMPLETED' ? 'Đã nộp' : data.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chưa làm'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-600 mb-1">Nộp lúc:</span>
            <span className="text-gray-800">{formatTime(data.submittedAt)}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-600 mb-1">Tổng câu hỏi:</span>
            <span className="text-gray-800">{data.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Overall Feedback */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Nhận xét tổng quát
        </h3>
        <textarea
          value={overallFeedback}
          onChange={(e) => setOverallFeedback(e.target.value)}
          placeholder="Nhập nhận xét chung cho toàn bộ bài làm..."
          className="w-full p-3 border border-gray-200 rounded-lg resize-y focus:ring-2 focus:ring-indigo-500 outline-none transition min-h-[100px]"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {data.questions.map((q, qIndex) => {
          const correctAnswers = q.answers.filter(a => a.correct).length
          const selectedCorrect = q.answers.filter(a => a.selected && a.correct).length
          const hasWrong = q.answers.some(a => a.selected && !a.correct)
          const isPerfect = selectedCorrect === correctAnswers && !hasWrong

          return (
            <div key={q.questionId} className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Câu {qIndex + 1}: <span dangerouslySetInnerHTML={{ __html: q.content }} />
                </h4>
                {isPerfect ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>

              <div className="space-y-3 mb-6">
                {q.answers.map((ans) => (
                  <div
                    key={ans.answerId}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                      ans.selected && ans.correct
                        ? 'bg-green-50 border-green-200'
                        : ans.selected && !ans.correct
                        ? 'bg-red-50 border-red-200'
                        : ans.correct
                        ? 'bg-blue-50 border-blue-200'
                        : 'border-gray-200'
                    }`}
                  >
                    {getAnswerIcon(ans.correct, ans.selected)}
                    <span dangerouslySetInnerHTML={{ __html: ans.content }} className={ans.correct ? 'font-medium text-gray-900' : 'text-gray-700'} />
                  </div>
                ))}
              </div>

              {q.explanation && (
                <div className="p-4 bg-blue-50 rounded-lg mb-4 text-sm">
                  <strong className="text-blue-800">Giải thích:</strong>
                  <p className="text-blue-700 mt-1">{q.explanation}</p>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Nhận xét cho câu này
                </label>
                <textarea
                  value={questionFeedbacks[q.questionId] || ''}
                  onChange={(e) => handleUpdateQuestionFeedback(q.questionId, e.target.value)}
                  placeholder="Nhập nhận xét riêng cho câu hỏi này (tùy chọn)..."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-y focus:ring-2 focus:ring-indigo-500 outline-none transition min-h-[80px]"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg md:static md:shadow-none md:border-0 md:p-0 md:mt-8">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button
            onClick={handleSendFeedback}
            disabled={sending}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              sending ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Send className="w-5 h-5" />
            {sending ? 'Đang gửi...' : 'Gửi tất cả nhận xét'}
          </button>
        </div>
      </div>
    </div>
  )
}