// src/pages/Teacher/ExamSessionsList.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { ArrowLeft, Calendar, Clock, Copy, Link, User as UserIcon } from 'lucide-react'

interface ExamSession {
  examSessionId: number
  code: string
  inviteLink: string
  name: string
  ownerName: string
  startAt: string
  expiredAt: string
}

export default function ExamSessionsList() {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const examId = location.state?.examId

  useEffect(() => {
    if (!examId) {
      toast.error('Không có ID đề thi!')
      navigate('/teacher/exams')
      return
    }

    const fetchSessions = async () => {
      setLoading(true)
      try {
        const res = await axiosClient.get('/teacher/exam-sessions/search', {
          params: { examId }
        })

        const items = Array.isArray(res.data.items)
          ? res.data.items.map((item: any) => ({
              examSessionId: item.examSessionId ?? 0,
              code: item.code ?? '—',
              inviteLink: item.inviteLink ?? item.invitelink ?? '—',
              name: item.name ?? 'Phiên không tên',
              ownerName: item.ownerName ?? '—',
              startAt: item.startAt ?? '',
              expiredAt: item.expiredAt ?? ''
            }))
          : []

        setSessions(items)
      } catch (err: any) {
        toast.error('Không tải được danh sách phiên thi')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [examId, navigate])

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatus = (start: string, end: string) => {
    const now = new Date()
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (now < startDate) return { label: 'Sắp bắt đầu', color: 'bg-yellow-100 text-yellow-700' }
    if (now >= startDate && now <= endDate) return { label: 'Đang mở', color: 'bg-green-100 text-green-700' }
    return { label: 'Đã đóng', color: 'bg-red-100 text-red-700' }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/teacher/exams')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Các phiên thi đã giao (Đề #{examId})
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số phiên: <strong>{sessions.length}</strong>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải danh sách phiên thi...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có phiên thi nào</h2>
          <p className="text-gray-500 text-center max-w-md">
            Đề thi này chưa được giao cho bất kỳ phiên nào. Hãy quay lại và tạo một phiên mới.
          </p>
          <button
            onClick={() => navigate('/teacher/exams')}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Quay về danh sách đề thi
          </button>
        </div>
      ) : (
        /* Grid of Sessions */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const status = getStatus(session.startAt, session.expiredAt)
            return (
              <div
                key={session.examSessionId}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate('/teacher/exam-sessions/detail', { state: { examSessionId: session.examSessionId } })}
              >
                {/* Header with Name and Code */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-indigo-700 line-clamp-1 pr-2">
                      {session.name}
                    </h3>
                    <span className="text-sm font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {session.code}
                    </span>
                  </div>
                  <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Body with Details */}
                <div className="p-5 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Chủ sở hữu:</span>
                    <span className="truncate">{session.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Bắt đầu:</span>
                    <span>{formatDateTime(session.startAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Kết thúc:</span>
                    <span>{formatDateTime(session.expiredAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Link mời:</span>
                    <a
                      href={session.inviteLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {session.inviteLink}
                    </a>
                  </div>
                </div>

                {/* Footer with Actions */}
                <div className="p-5 bg-gray-50 flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(session.inviteLink)
                      toast.success('Đã copy link mời!')
                    }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(session.code)
                      toast.success('Đã copy mã tham gia!')
                    }}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Mã
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}