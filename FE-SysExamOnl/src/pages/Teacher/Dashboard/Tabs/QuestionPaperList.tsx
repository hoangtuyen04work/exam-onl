// src/pages/Teacher/QuestionPaperList.tsx
import { Calendar, ChevronLeft, ChevronRight, FileText, Loader2, Trash2 } from 'lucide-react'

interface QuestionPaperListItem {
  bankQuestionId: number
  name: string
  description: string
  createdAt: string
}

interface QuestionPaperListProps {
  papers: QuestionPaperListItem[]
  loading: boolean
  selectedId?: number
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function QuestionPaperList({
  papers,
  loading,
  selectedId,
  onSelect,
  onDelete,
  page,
  totalPages,
  onPageChange
}: QuestionPaperListProps) {
  const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Danh sách đề thi
      </h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
          </div>
        ) : papers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có đề thi nào</p>
        ) : (
          papers.map(p => (
            <div
              key={p.bankQuestionId}
              onClick={() => onSelect(p.bankQuestionId)}
              className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition ${
                selectedId === p.bankQuestionId ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
              }`}
            >
              <div className="font-semibold text-gray-800">{p.name}</div>
              <div className="text-sm text-gray-600 truncate">{p.description}</div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(p.createdAt)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(p.bankQuestionId) }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm">Trang {page + 1} / {totalPages}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}