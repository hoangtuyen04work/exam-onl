import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, X, Save } from 'lucide-react'
import api from '../../../../api/axiosClient.ts'
import { toast } from 'react-toastify'

interface Answer {
  content: string
  correct: boolean
}

interface Question {
  id?: number
  content: string
  subject: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  answers: Answer[]
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Question>({
    content: '',
    subject: '',
    difficulty: 'EASY',
    answers: [
      { content: '', correct: true },
      { content: '', correct: false },
      { content: '', correct: false },
      { content: '', correct: false },
    ],
  })

  // ✅ Load danh sách câu hỏi
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/teacher/questions')
        setQuestions(res.data?.data || [])
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Không tải được danh sách câu hỏi!')
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const subjects = [...new Set(questions.map(q => q.subject))]

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = !selectedSubject || q.subject === selectedSubject
    const matchesDifficulty = !selectedDifficulty || q.difficulty === selectedDifficulty
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  // ✅ Xóa câu hỏi
  const handleDelete = async (questionId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
    try {
      await api.delete(`/teacher/questions/${questionId}`)
      setQuestions(questions.filter(q => q.id !== questionId))
      toast.success('Đã xóa câu hỏi!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại!')
    }
  }

  // ✅ Thêm câu hỏi
  const handleAddQuestion = async () => {
    if (!newQuestion.content.trim()) return toast.error('Vui lòng nhập nội dung câu hỏi!')
    if (!newQuestion.subject.trim()) return toast.error('Vui lòng chọn môn học!')
    if (newQuestion.answers.some(a => !a.content.trim())) return toast.error('Vui lòng nhập đầy đủ đáp án!')

    try {
      const res = await api.post('/teacher/questions', newQuestion)
      setQuestions(prev => [...prev, res.data?.data || newQuestion])
      toast.success('Thêm câu hỏi thành công!')
      setIsModalOpen(false)
      setNewQuestion({
        content: '',
        subject: '',
        difficulty: 'EASY',
        answers: [
          { content: '', correct: true },
          { content: '', correct: false },
          { content: '', correct: false },
          { content: '', correct: false },
        ],
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm câu hỏi!')
    }
  }

  const setCorrectAnswer = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      answers: prev.answers.map((a, i) => ({ ...a, correct: i === index })),
    }))
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Dễ'
      case 'MEDIUM': return 'Trung bình'
      case 'HARD': return 'Khó'
      default: return difficulty
    }
  }

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Đang tải dữ liệu...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Ngân hàng câu hỏi</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả môn học</option>
              {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSubject('')
                setSelectedDifficulty('')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="grid gap-4">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{q.content}</h3>
                  <p className="text-sm text-gray-600 mb-2">Môn học: {q.subject}</p>
                  <p className="text-sm text-gray-600 mb-2">Độ khó: {getDifficultyText(q.difficulty)}</p>
                  <ul className="ml-4 space-y-1">
                    {q.answers.map((a, i) => (
                      <li key={i} className={a.correct ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                        {String.fromCharCode(65 + i)}. {a.content}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleDelete(q.id!)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <p className="text-center py-12 text-gray-500">Không có câu hỏi nào</p>
          )}
        </div>
      </div>

      {/* Modal Thêm câu hỏi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-[600px] p-6 rounded-xl shadow-lg relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4">Thêm câu hỏi</h2>

            <input
              type="text"
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
              value={newQuestion.content}
              onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
            />

            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
              value={newQuestion.subject}
              onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
            >
              <option value="">Chọn môn học</option>
              <option value="Toán">Toán</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Hóa học">Hóa học</option>
            </select>

            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              value={newQuestion.difficulty}
              onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
            >
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>

            <p className="font-medium mb-2">Đáp án:</p>
            {newQuestion.answers.map((a, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={a.content}
                  onChange={(e) => {
                    const copy = [...newQuestion.answers]
                    copy[i].content = e.target.value
                    setNewQuestion({ ...newQuestion, answers: copy })
                  }}
                  placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={a.correct}
                  onChange={() => setCorrectAnswer(i)}
                />
              </div>
            ))}

            <button
              onClick={handleAddQuestion}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Lưu câu hỏi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
