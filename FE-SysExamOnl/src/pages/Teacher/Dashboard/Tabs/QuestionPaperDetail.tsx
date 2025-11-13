// src/pages/Teacher/QuestionPaperDetail.tsx
import { Loader2, X } from 'lucide-react'

interface QuestionPaper {
  bankQuestionId: number
  name: string
  description: string
  questions: Array<{
    content: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    explanation?: string
    point: number
    answers: Array<{ content: string; correct: boolean }>
  }>
}

interface QuestionPaperDetailProps {
  paper: QuestionPaper | null
  loading: boolean
  onClose: () => void
}

export default function QuestionPaperDetail({ paper, loading, onClose }: QuestionPaperDetailProps) {
  const difficultyText = (d: string) => d === 'EASY' ? 'Dễ' : d === 'MEDIUM' ? 'Trung bình' : 'Khó'

  if (!paper) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
        Chọn một đề thi để xem chi tiết
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{paper.name}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-gray-600 mb-6">{paper.description || 'Không có mô tả'}</p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {paper.questions.map((q, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">Câu {i + 1}: {q.content}</h3>
                <span className="text-blue-600">{q.point} điểm</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Độ khó: {difficultyText(q.difficulty)}</p>
              <ul className="space-y-1">
                {q.answers.map((a, j) => (
                  <li key={j} className={`text-sm ${a.correct ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                    {String.fromCharCode(65 + j)}. {a.content}
                  </li>
                ))}
              </ul>
              {q.explanation && <p className="mt-2 text-sm text-gray-500">Giải thích: {q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}