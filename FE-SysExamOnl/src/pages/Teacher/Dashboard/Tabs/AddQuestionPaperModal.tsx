// src/pages/Teacher/AddQuestionPaperModal.tsx
import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import axiosClient from "../../../../api/axiosClient"
import { toast } from 'react-toastify'

interface Answer {
  content: string
  correct: boolean
}

interface Question {
  content: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation?: string
  point: number
  orderColumn: number
  shuffleAnswers: boolean
  shuffleQuestions: boolean
  answers: Answer[]
}

interface AddQuestionPaperModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddQuestionPaperModal({ isOpen, onClose, onSuccess }: AddQuestionPaperModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    {
      content: '',
      difficulty: 'EASY',
      explanation: '',
      point: 1,
      orderColumn: 0,
      shuffleAnswers: true,
      shuffleQuestions: true,
      answers: [
        { content: '', correct: true },
        { content: '', correct: false },
        { content: '', correct: false },
        { content: '', correct: false }
      ]
    }
  ])

  if (!isOpen) return null

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        content: '',
        difficulty: 'EASY',
        explanation: '',
        point: 1,
        orderColumn: prev.length,
        shuffleAnswers: true,
        shuffleQuestions: true,
        answers: [
          { content: '', correct: true },
          { content: '', correct: false },
          { content: '', correct: false },
          { content: '', correct: false }
        ]
      }
    ])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  const handleAddAnswer = (qIndex: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? {
      ...q,
      answers: [...q.answers, { content: '', correct: false }]
    } : q))
  }

  const handleRemoveAnswer = (qIndex: number, aIndex: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? {
      ...q,
      answers: q.answers.filter((_, j) => j !== aIndex)
    } : q))
  }

  const handleUpdateAnswer = (qIndex: number, aIndex: number, field: 'content' | 'correct', value: any) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? {
      ...q,
      answers: q.answers.map((a, j) => j === aIndex ? { ...a, [field]: value } : a)
    } : q))
  }

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Vui lòng nhập tên đề thi!')
    const validQuestions = questions.filter(q => q.content.trim())
    if (validQuestions.length === 0) return toast.error('Vui lòng nhập ít nhất 1 câu hỏi!')

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        questions: validQuestions.map((q, index) => ({
          ...q,
          orderColumn: index,
          explanation: q.explanation?.trim() || '',
          point: Math.max(0.1, q.point || 1),
          answers: q.answers.filter(a => a.content.trim())
        }))
      }
      await axiosClient.post('/bank-questions', payload)
      toast.success('Tạo đề thi thành công!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo đề thi thất bại!')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Tạo đề thi mới</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          className="w-full p-3 border rounded-lg mb-4"
          placeholder="Tên đề thi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full p-3 border rounded-lg mb-4"
          placeholder="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">Câu hỏi</h3>
            <button onClick={handleAddQuestion} className="text-blue-600 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm câu hỏi
            </button>
          </div>
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="border p-4 rounded-lg bg-gray-50 space-y-2">
              <div className="flex justify-between">
                <span>Câu {qIdx + 1}</span>
                <button onClick={() => handleRemoveQuestion(qIdx)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Nội dung câu hỏi"
                value={q.content}
                onChange={(e) => handleUpdateQuestion(qIdx, 'content', e.target.value)}
              />
              <select
                className="p-2 border rounded"
                value={q.difficulty}
                onChange={(e) => handleUpdateQuestion(qIdx, 'difficulty', e.target.value)}
              >
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
              <input
                type="number"
                className="p-2 border rounded"
                placeholder="Điểm"
                value={q.point}
                onChange={(e) => handleUpdateQuestion(qIdx, 'point', parseFloat(e.target.value))}
              />
              <input
                className="p-2 border rounded"
                placeholder="Giải thích"
                value={q.explanation}
                onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
              />
              <div>
                {q.answers.map((a, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2 mt-2">
                    <input
                      type="radio"
                      checked={a.correct}
                      onChange={() => q.answers.forEach((_, j) => handleUpdateAnswer(qIdx, j, 'correct', j === aIdx))}
                    />
                    <input
                      className="flex-1 p-2 border rounded"
                      placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                      value={a.content}
                      onChange={(e) => handleUpdateAnswer(qIdx, aIdx, 'content', e.target.value)}
                    />
                    {q.answers.length > 2 && (
                      <button onClick={() => handleRemoveAnswer(qIdx, aIdx)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {q.answers.length < 6 && (
                  <button onClick={() => handleAddAnswer(qIdx)} className="text-blue-600 mt-2">
                    + Thêm đáp án
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded text-gray-700">
            Hủy
          </button>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">
            Tạo
          </button>
        </div>
      </div>
    </div>
  )
}