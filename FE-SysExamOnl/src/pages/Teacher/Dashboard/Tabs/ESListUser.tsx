// src/pages/Teacher/ExamSessionDetail.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { ArrowLeft, Clock, PlayCircle, CheckCircle, XCircle } from 'lucide-react'

interface Student {
  examSessionStudentId: number
  studentId: number
  studentName: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  submittedAt?: string
  score?: number
}

export default function ExamSessionDetail() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { state } = useLocation()
  const examSessionId = state?.examSessionId

  useEffect(() => {
    if (!examSessionId) {
      toast.error('Không có ID phiên thi!')
      navigate(-1)
      return
    }

    const fetchStudents = async () => {
      setLoading(true)
      try {
        const res = await axiosClient.get(`/teacher/exam-sessions/${examSessionId}`)
        
        // Chuẩn Spring Pageable
        const items = Array.isArray(res.data.items) ? res.data.items : []

        const mapped: Student[] = items.map((it: any) => ({
          examSessionStudentId: it.examSessionStudentId ?? 0,
          studentId: it.studentId ?? 0,
          studentName: it.studentName ?? 'Không tên',
          status: it.status ?? 'NOT_STARTED',
          submittedAt: it.submittedAt,
          score: it.score
        }))

        setStudents(mapped)
      } catch (err: any) {
        toast.error('Không tải được danh sách sinh viên')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [examSessionId, navigate])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { icon: <CheckCircle className="w-5 h-5 text-green-600" />, label: 'Đã nộp', color: 'text-green-700' }
      case 'IN_PROGRESS':
        return { icon: <PlayCircle className="w-5 h-5 text-yellow-600" />, label: 'Đang thi', color: 'text-yellow-700' }
      case 'NOT_STARTED':
        return { icon: <Clock className="w-5 h-5 text-gray-500" />, label: 'Chưa thi', color: 'text-gray-600' }
      default:
        return { icon: <XCircle className="w-5 h-5 text-red-600" />, label: 'Lỗi', color: 'text-red-700' }
    }
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
            Danh sách sinh viên – Phiên #{examSessionId}
          </h1>
          <p className="text-sm text-gray-500">
            Tổng: <strong>{students.length}</strong> học sinh
          </p>
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Đang tải...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Chưa có sinh viên nào tham gia phiên này.</p>
        </div>
      ) : (
        /* Bảng danh sách */
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã SV
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian nộp
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((s) => {
                const status = getStatusConfig(s.status)
                return (
                  <tr key={s.examSessionStudentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {s.studentId}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {s.studentName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {status.icon}
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {formatTime(s.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-green-700">
                      {s.score !== undefined ? s.score.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
  <button
    onClick={(e) => {
      e.stopPropagation() // Ngăn click row
      navigate('/teacher/exam-sessions/submission', {
        state: { examSessionStudentId: s.examSessionStudentId }
      })
    }}
    className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
  >
    Xem bài
  </button>
</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}