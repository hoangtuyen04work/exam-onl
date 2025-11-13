// src/pages/Teacher/ExamsTab.tsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import CreateSessionModal from './CreateSessionModal'
import SessionResultModal from './SessionResultModal'
import ExamCard from './ExamCard'
import ImportExportButtons from './ImportExportButtons'

interface ExamItem {
  examId: number
  name: string
  description: string
  numberQuestions: number
}

export default function ExamsTab() {
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [sessionResult, setSessionResult] = useState<any | null>(null) // Adjust type based on SessionResult

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      try {
        const res = await axiosClient.get('/teacher/exams', { params: { page: 0, size: 20 } })
        const items = Array.isArray(res.data.items)
          ? res.data.items.map((item: any) => ({
              examId: item.examId ?? 0,
              name: item.name ?? 'Không tên',
              description: item.description ?? '',
              numberQuestions: item.numberQuestions ?? 0
            }))
          : []
        setExams(items)
      } catch {
        toast.error('Không tải được danh sách đề thi')
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axiosClient.post('/teacher/exams/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`Import thành công ${res.data?.imported ?? 0} câu hỏi`)
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import thất bại')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    try {
      const res = await axiosClient.get('/teacher/exams/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'exams.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Export thất bại')
    }
  }

  const openCreateModal = (examId: number) => {
    setSelectedExamId(examId)
    setShowCreateModal(true)
  }

  const handleCreateSuccess = (data: any) => {
    setSessionResult(data)
    setShowCreateModal(false)
  }

  return (
    <div className="p-6 min-h-[calc(100vh-12rem)] bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Danh sách đề thi</h2>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/teacher/exams/create')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Tạo đề thi mới
          </button>
          <button
            onClick={() => navigate('/teacher/questions')}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
          >
            + Tạo từ ngân hàng
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Đang tải...</div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Chưa có đề thi nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exams.map((exam) => (
            <ExamCard
              key={exam.examId}
              exam={exam}
              onEdit={() => navigate(`/teacher/exams/${exam.examId}/edit`)}
              onViewSessions={() => navigate('/teacher/exam-sessions/list', { state: { examId: exam.examId } })}
              onCreateSession={() => openCreateModal(exam.examId)}
            />
          ))}
        </div>
      )}

      <CreateSessionModal
        isOpen={showCreateModal}
        examId={selectedExamId}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <SessionResultModal
        isOpen={!!sessionResult}
        data={sessionResult}
        onClose={() => setSessionResult(null)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImport}
      />

      <ImportExportButtons
        onImport={() => fileInputRef.current?.click()}
        onExport={handleExport}
      />
    </div>
  )
}