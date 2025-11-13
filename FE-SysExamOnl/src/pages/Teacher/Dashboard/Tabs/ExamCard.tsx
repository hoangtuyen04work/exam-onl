// src/pages/Teacher/ExamCard.tsx
import React from 'react'

interface ExamItem {
  examId: number
  name: string
  description: string
  numberQuestions: number
}

interface ExamCardProps {
  exam: ExamItem
  onEdit: () => void
  onViewSessions: () => void
  onCreateSession: () => void
}

export default function ExamCard({ exam, onEdit, onViewSessions, onCreateSession }: ExamCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-indigo-700 mb-2 line-clamp-2">{exam.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{exam.description || 'Không có mô tả'}</p>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Số câu hỏi:</span> {exam.numberQuestions}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <button onClick={onEdit} className="text-blue-600 hover:underline">
          Sửa
        </button>
        <button onClick={onViewSessions} className="text-purple-600 hover:underline">
          Xem phiên
        </button>
        <button onClick={onCreateSession} className="text-green-600 hover:underline">
          Giao đề
        </button>
      </div>
    </div>
  )
}