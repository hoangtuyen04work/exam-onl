// src/pages/Teacher/QuestionPaperBank.tsx
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import axiosClient from "../../../../api/axiosClient"
import QuestionPaperList from './QuestionPaperList'
import QuestionPaperDetail from './QuestionPaperDetail'
import AddQuestionPaperModal from './AddQuestionPaperModal'
import ImportExportButtons from './ImportExportButtons'

interface QuestionPaperListItem {
  bankQuestionId: number
  name: string
  description: string
  createdAt: string
}

interface QuestionPaper {
  bankQuestionId: number
  name: string
  description: string
  createdAt: string
  questions: any[] // Adjust based on actual type
}

export default function QuestionPaperBank() {
  const [papers, setPapers] = useState<QuestionPaperListItem[]>([])
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null)
  const [loadingPapers, setLoadingPapers] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const size = 10

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPapers = async (pageNum: number = 0) => {
    setLoadingPapers(true)
    try {
      const res = await axiosClient.get('/bank-questions', { params: { page: pageNum, size } })
      const data = res.data
      const items = Array.isArray(data.items) ? data.items : []
      setPapers(items)
      const total = data.total || 0
      setTotalPages(Math.ceil(total / size))
      setPage(pageNum)
    } catch {
      toast.error('Không tải được danh sách đề thi!')
    } finally {
      setLoadingPapers(false)
    }
  }

  const fetchPaperDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const res = await axiosClient.get(`/bank-questions/${id}`)
      const paperData = res.data.data
      if (!paperData) throw new Error('Không có dữ liệu')
      setSelectedPaper(paperData)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không tải được chi tiết!')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDeletePaper = async (paperId: number) => {
    if (!confirm('Bạn có chắc muốn xóa đề này không?')) return
    try {
      await axiosClient.delete(`/bank-questions/${paperId}`)
      toast.success('Xóa đề thành công!')
      if (selectedPaper?.bankQuestionId === paperId) setSelectedPaper(null)
      setPapers(prev => prev.filter(p => p.bankQuestionId !== paperId))
      if (papers.length === 1 && page > 0) await fetchPapers(page - 1)
      else await fetchPapers(page)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa đề thất bại!')
      fetchPapers(page)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axiosClient.post('/bank-questions/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const imported = res.data?.imported ?? 0
      toast.success(`Import thành công ${imported} câu hỏi`)
      await fetchPapers(0)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import thất bại')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    try {
      const res = await axiosClient.get('/bank-questions/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bank_questions.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Export thất bại')
    }
  }

  useEffect(() => { fetchPapers() }, [])

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Ngân hàng đề thi</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Tạo đề thi mới
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuestionPaperList
            papers={papers}
            loading={loadingPapers}
            selectedId={selectedPaper?.bankQuestionId}
            onSelect={fetchPaperDetail}
            onDelete={handleDeletePaper}
            page={page}
            totalPages={totalPages}
            onPageChange={fetchPapers}
          />
          <QuestionPaperDetail
            paper={selectedPaper}
            loading={loadingDetail}
            onClose={() => setSelectedPaper(null)}
          />
        </div>
      </div>

      <AddQuestionPaperModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchPapers(0)
          setShowAddModal(false)
        }}
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