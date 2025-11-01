import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import api from '../../../api/axiosClient'

interface Answer {
  content: string
  correct: boolean
}

interface Question {
  content: string
  point: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation: string
  shuffleAnswers: boolean
  answers: Answer[]
}

export default function CreateEditExam() {
  const { examId } = useParams<{ examId?: string }>()
  console.log("Exam ID:", examId)
  const navigate = useNavigate()
  const isEdit = Boolean(examId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ✅ Khi tạo mới đề thi — tự thêm 1 câu hỏi với 4 đáp án (chỉ 1 đúng)
  useEffect(() => {
    if (!isEdit) {
      setQuestions([
        {
          content: '',
          point: 1.0,
          difficulty: 'EASY',
          explanation: '',
          shuffleAnswers: true,
          answers: [
            { content: '', correct: true }, // chỉ 1 đúng
            { content: '', correct: false },
            { content: '', correct: false },
            { content: '', correct: false }
          ]
        }
      ])
      setIsLoading(false)
    }
  }, [isEdit])

  // ✅ Khi chỉnh sửa đề thi
  useEffect(() => {
    const fetch = async () => {
      if (!isEdit) return
      setIsLoading(true)
      try {
        const res = await api.get(`/teacher/exams/${examId}`)
        const data = res.data?.data ?? res.data
        setName(data?.name ?? '')
        setDescription(data?.description ?? '')
        setQuestions(Array.isArray(data?.questions) ? data.questions : [])
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Không tải được đề thi')
        navigate('/teacher/exams')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [examId, isEdit, navigate])

  // ✅ Thêm / sửa / xóa câu hỏi, đáp án
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        content: '',
        point: 1.0,
        difficulty: 'EASY',
        explanation: '',
        shuffleAnswers: true,
        answers: [
          { content: '', correct: true },
          { content: '', correct: false },
          { content: '', correct: false },
          { content: '', correct: false }
        ]
      }
    ])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const copy = [...questions]
    copy[index] = { ...copy[index], [field]: value }
    setQuestions(copy)
  }

  const updateAnswer = (qIndex: number, aIndex: number, content: string) => {
    const copy = [...questions]
    copy[qIndex].answers[aIndex].content = content
    setQuestions(copy)
  }

  // ✅ Chỉ 1 đáp án đúng
 const setCorrectAnswer = (qIndex: number, aIndex: number) => {
  setQuestions(prev => {
    const copy = [...prev];
    copy[qIndex] = {
      ...copy[qIndex],
      answers: copy[qIndex].answers.map((ans, i) => ({
        ...ans,
        correct: i === aIndex, 
      })),
    };
    return copy;
  });
};


  const addAnswer = (qIndex: number) => {
    const copy = [...questions]
    copy[qIndex].answers.push({ content: '', correct: false })
    setQuestions(copy)
  }

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const copy = [...questions]
    copy[qIndex].answers = copy[qIndex].answers.filter((_, i) => i !== aIndex)
    setQuestions(copy)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const validateBeforeSave = () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên đề thi!')
      return false
    }
    if (questions.some(q => !q.content.trim())) {
      toast.error('Vui lòng nhập nội dung cho tất cả câu hỏi!')
      return false
    }
    return true
  }

  // ✅ Lưu đề thi
  const handleSubmit = async () => {
    if (!validateBeforeSave()) return
    setIsSaving(true)

    const payload = {
      name: name.trim(),
      description: description.trim(),
      questions: questions.map((q, index) => ({
        ...q,
        orderColumn: index,
        shuffleQuestions: true
      }))
    }

    try {
      if (isEdit) {
        await api.put(`/teacher/exams/${examId}`, payload)
        toast.success('Lưu đề thi thành công!')
      } else {
        await api.post('/teacher/exams', payload)
        toast.success('Tạo đề thi thành công!')
      }
      setTimeout(() => navigate('/teacher/exams'), 800)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Thao tác thất bại!')
    } finally {
      setIsSaving(false)
    }
  }

  // ✅ Xóa bài kiểm tra
  const handleDelete = async () => {
    if (!examId) return toast.error('Không xác định được ID đề thi!')
    if (!window.confirm('Bạn có chắc muốn xóa bài kiểm tra này không?')) return

    setIsDeleting(true)
    try {
      await api.delete(`/teacher/exams/${examId}`)
      toast.success('Xóa bài kiểm tra thành công!')
      setTimeout(() => navigate('/teacher/exams'), 800)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xóa thất bại!')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải đề thi...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex justify-center">
      <div className="bg-white shadow-lg rounded-2xl w-[800px] min-h-[1100px] px-10 py-8 border border-gray-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/exams')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">{isEdit ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h1>
              {isEdit && <p className="text-sm text-gray-500">ID: {examId}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Đang xóa...' : 'Xóa bài kiểm tra'}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu đề thi'}
            </button>
          </div>
        </div>

        {/* Exam Info */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đề thi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên đề thi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về đề thi"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="mb-8 border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Câu {qIndex + 1}</h3>
              <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={q.content}
                onChange={(e) => updateQuestion(qIndex, 'content', e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Điểm</label>
                  <input
                    type="number"
                    step="0.1"
                    value={q.point}
                    onChange={(e) =>
                      updateQuestion(qIndex, 'point', parseFloat(e.target.value || '0'))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Độ khó</label>
                  <select
                    value={q.difficulty}
                    onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Các đáp án</label>
                <div className="space-y-2">
                  {q.answers.map((a, aIndex) => (
                    <div key={aIndex} className="flex items-center gap-2">
                      <span className="w-6 font-semibold">{String.fromCharCode(65 + aIndex)}.</span>
                      <input
                        type="text"
                        value={a.content}
                        onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={a.correct}
                          onChange={() => setCorrectAnswer(qIndex, aIndex)}
                        />
                        <span className="text-sm">✔</span>
                      </label>
                      {q.answers.length > 2 && (
                        <button
                          onClick={() => removeAnswer(qIndex, aIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addAnswer(qIndex)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Thêm đáp án
                </button>
              </div>

              <textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                placeholder="Giải thích (tùy chọn)"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-3"
              />
            </div>
          </div>
        ))}

        <div className="flex justify-center">
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" /> Thêm câu hỏi
          </button>
        </div>
      </div>
    </div>
  )
}
