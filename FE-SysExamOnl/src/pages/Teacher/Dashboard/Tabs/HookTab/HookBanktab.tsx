// app/(admin)/bank-questions/hooks/useBankQuestion.ts
import { useState, useEffect, useRef } from 'react'
import axiosClient from "../../../../../api/axiosClient"
import { toast } from 'react-toastify'
import { format } from 'date-fns'

export interface Answer {
  answerId?: number
  content: string
  correct: boolean
}

export interface Question {
  questionId?: number
  content: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation?: string
  point: number
  orderColumn: number
  shuffleAnswers: boolean
  shuffleQuestions: boolean
  answers: Answer[]
}

export interface QuestionPaper {
  bankQuestionId: number
  name: string
  description: string
  createdAt: string
  questions: Question[]
}

export interface QuestionPaperListItem {
  bankQuestionId: number
  name: string
  description: string
  createdAt: string
}

export const useBankQuestion = () => {
  const [papers, setPapers] = useState<QuestionPaperListItem[]>([])
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null)
  const [loadingPapers, setLoadingPapers] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const size = 10

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newQuestions, setNewQuestions] = useState<Omit<Question, 'questionId'>[]>([
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
        { content: '', correct: false },
      ],
    },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==================== IMPORT / EXPORT ====================
  const triggerImport = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axiosClient.post('/bank-questions/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`Import thành công ${res.data?.imported ?? 0} câu hỏi`)
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

  // ==================== FETCH DATA ====================
  const fetchPapers = async (pageNum: number = 0) => {
    setLoadingPapers(true)
    try {
      const res = await axiosClient.get('/bank-questions', { params: { page: pageNum, size } })
      const data = res.data
      setPapers(Array.isArray(data.items) ? data.items : [])
      setTotalPages(Math.ceil((data.total || 0) / size))
      setPage(pageNum)
    } catch (err) {
      toast.error('Không tải được danh sách đề thi!')
    } finally {
      setLoadingPapers(false)
    }
  }

  const fetchPaperDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const res = await axiosClient.get(`/bank-questions/${id}`)
      setSelectedPaper(res.data.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không tải được chi tiết!')
    } finally {
      setLoadingDetail(false)
    }
  }

  // ==================== CREATE PAPER ====================
  const resetAddForm = () => {
    setNewName('')
    setNewDesc('')
    setNewQuestions([{
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
        { content: '', correct: false },
      ],
    }])
  }

  const handleAddPaper = async () => {
    if (!newName.trim()) return toast.error('Vui lòng nhập tên đề thi!')
    const validQuestions = newQuestions.filter(q => q.content.trim())
    if (validQuestions.length === 0) return toast.error('Cần ít nhất 1 câu hỏi!')

    try {
      const payload = {
        name: newName.trim(),
        description: newDesc.trim(),
        questions: validQuestions.map((q, i) => ({
          content: q.content.trim(),
          difficulty: q.difficulty,
          explanation: q.explanation?.trim() || '',
          point: Math.max(0.1, q.point || 1),
          orderColumn: i,
          shuffleAnswers: q.shuffleAnswers,
          shuffleQuestions: q.shuffleQuestions,
          answers: q.answers
            .filter(a => a.content.trim())
            .map(a => ({ content: a.content.trim(), correct: a.correct }))
        }))
      }

      await axiosClient.post('/bank-questions', payload)
      toast.success('Tạo đề thi thành công!')
      setShowAddModal(false)
      resetAddForm()
      await fetchPapers(0)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo đề thi thất bại!')
    }
  }

  const handleDeletePaper = async (paperId: number) => {
    if (!confirm('Xóa đề này thật nhé?')) return
    try {
      await axiosClient.delete(`/bank-questions/${paperId}`)
      toast.success('Xóa thành công!')
      if (selectedPaper?.bankQuestionId === paperId) setSelectedPaper(null)
      setPapers(prev => prev.filter(p => p.bankQuestionId !== paperId))
      if (papers.length <= 1 && page > 0) fetchPapers(page - 1)
      else fetchPapers(page)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại!')
    }
  }

  useEffect(() => {
    fetchPapers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDate = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm')
  const difficultyText = (d: string) => d === 'EASY' ? 'Dễ' : d === 'MEDIUM' ? 'Trung bình' : 'Khó'

  // Expose hàm fetchPapers ra ngoài để pagination dùng
  return {
    // state
    papers, selectedPaper, loadingPapers, loadingDetail,
    page, totalPages, showAddModal,
    newName, setNewName, newDesc, setNewDesc,
    newQuestions, setNewQuestions,
    fileInputRef,

    // actions
    setShowAddModal, setSelectedPaper,
    fetchPapers, fetchPaperDetail,
    handleAddPaper, handleDeletePaper, resetAddForm,
    triggerImport, handleImportFile, handleExport,

    // utils
    formatDate, difficultyText
  }
}