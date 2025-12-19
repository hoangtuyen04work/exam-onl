// src/hooks/useCreateEditExam.ts
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../../../api/axiosClient'

interface Answer {
  id?: number | string
  answerId?: number | string
  content: string
  correct: boolean
}

interface AnswerDTO {
  id?: number | string
  answerId?: number | string
  content?: string
  correct?: boolean
}

interface Question {
  id?: number | string
  questionId?: number | string
  content: string
  point: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation: string
  shuffleAnswers: boolean
  answers: Answer[]
}

interface QuestionDTO {
  id?: number | string
  questionId?: number | string
  content?: string
  point?: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  explanation?: string
  shuffleAnswers?: boolean
  answers?: AnswerDTO[]
}

interface ExamDTO {
  id?: number | string
  name?: string
  description?: string
  durationMinutes?: number
  questions?: QuestionDTO[]
}

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string
    }
  }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as ApiErrorShape
    const message = maybe.response?.data?.message
    if (typeof message === 'string' && message.trim().length > 0) return message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const useCreateEditExam = () => {
  const { examId } = useParams<{ examId?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(examId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60) 
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
            { content: '', correct: true },
            { content: '', correct: false },
            { content: '', correct: false },
            { content: '', correct: false }
          ]
        }
      ])
      setIsLoading(false)
      return
    }

    const fetchExam = async () => {
      setIsLoading(true)
      try {
        const res = await api.get(`/teacher/exams/${examId}`)
        const data: ExamDTO = (res.data?.data ?? res.data) as ExamDTO
        setName(data?.name ?? '')
        setDescription(data?.description ?? '')
        setDurationMinutes(data?.durationMinutes ?? 60) // ← Load thời gian cũ
        setQuestions(
          Array.isArray(data?.questions)
            ? data.questions.map((q: QuestionDTO) => ({
                id: q.id ?? q.questionId,
                questionId: q.questionId ?? q.id,
                content: q.content ?? '',
                point: q.point ?? 1.0,
                difficulty: q.difficulty ?? 'EASY',
                explanation: q.explanation ?? '',
                shuffleAnswers: q.shuffleAnswers ?? true,
                answers: (q.answers ?? []).map((a: AnswerDTO) => ({
                  id: a.id ?? a.answerId,
                  answerId: a.answerId ?? a.id,
                  content: a.content ?? '',
                  correct: Boolean(a.correct)
                }))
              }))
            : []
        )
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Không tải được đề thi'))
        navigate('/teacher/exams')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExam()
  }, [examId, isEdit, navigate])

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
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

  const updateQuestion = (index: number, field: keyof Question, value: string | number | boolean | 'EASY' | 'MEDIUM' | 'HARD' | Answer[]) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const updateAnswer = (qIndex: number, aIndex: number, content: string) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[qIndex].answers[aIndex].content = content
      return copy
    })
  }

  const setCorrectAnswer = (qIndex: number, aIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[qIndex].answers = copy[qIndex].answers.map((a, i) => ({
        ...a,
        correct: i === aIndex
      }))
      return copy
    })
  }

  const addAnswer = (qIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[qIndex].answers.push({ content: '', correct: false })
      return copy
    })
  }

  const removeAnswer = (qIndex: number, aIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev]
      if (copy[qIndex].answers.length <= 2) return prev
      copy[qIndex].answers = copy[qIndex].answers.filter((_, i) => i !== aIndex)
      return copy
    })
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.warn('Phải có ít nhất 1 câu hỏi!')
      return
    }
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const validateBeforeSave = () => {
    if (!name.trim()) return toast.error('Vui lòng nhập tên đề thi!'), false
    if (questions.length === 0) return toast.error('Phải có ít nhất 1 câu hỏi!'), false
    if (questions.some(q => !q.content.trim())) return toast.error('Tất cả câu hỏi phải có nội dung!'), false
    if (questions.some(q => !q.answers.some(a => a.correct))) return toast.error('Mỗi câu phải có ít nhất 1 đáp án đúng!'), false
    return true
  }

  const handleSubmit = async () => {
    if (!validateBeforeSave()) return
    setIsSaving(true)

    const commonPayload = {
      name: name.trim(),
      description: description.trim(),
      durationMinutes, // ← ĐÃ THÊM VÀO PAYLOAD
      questions: questions.map((q, index) => ({
        questionId: isEdit ? (q.id ?? q.questionId) : undefined,
        content: q.content,
        point: q.point,
        difficulty: q.difficulty,
        explanation: q.explanation,
        orderColumn: index,
        shuffleAnswers: q.shuffleAnswers,
        shuffleQuestions: true,
        answers: q.answers.map(a => ({
          answerId: isEdit ? (a.id ?? a.answerId) : undefined,
          content: a.content,
          correct: a.correct
        }))
      }))
    }

    try {
      if (isEdit) {
        await api.put(`/teacher/exams/bulk-update/${examId}`, commonPayload)
        toast.success('Cập nhật đề thi thành công!')
      } else {
        await api.post('/teacher/exams', commonPayload)
        toast.success('Tạo đề thi thành công!')
      }
      setTimeout(() => navigate('/teacher/exams'), 800)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Lưu đề thi thất bại!'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!examId || !window.confirm('Xóa vĩnh viễn đề thi này? Không thể khôi phục!')) return
    setIsDeleting(true)
    try {
      await api.delete(`/teacher/exams/${examId}`)
      toast.success('Xóa thành công!')
      setTimeout(() => navigate('/teacher/exams'), 800)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Xóa thất bại!'))
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isEdit,
    examId,
    name,
    setName,
    description,
    setDescription,
    durationMinutes,
    setDurationMinutes,
    questions,
    isLoading,
    isSaving,
    isDeleting,
    addQuestion,
    updateQuestion,
    updateAnswer,
    setCorrectAnswer,
    addAnswer,
    removeAnswer,
    removeQuestion,
    handleSubmit,
    handleDelete,
    navigate
  }
}