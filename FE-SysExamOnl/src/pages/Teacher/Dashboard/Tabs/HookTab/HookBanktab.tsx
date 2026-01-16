// app/(admin)/bank-questions/hooks/useBankQuestion.ts
import { useState, useEffect, useRef } from 'react'
import axiosClient from '../../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPaper, setEditingPaper] = useState<QuestionPaper | null>(null)
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
        { content: '', correct: false }
      ]
    }
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==================== IMPORT / EXPORT ====================
  const triggerImport = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      toast.info('Đang đọc file Excel...')

      // Đọc file Excel
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      if (rows.length < 5) {
        toast.error('File không đúng định dạng!')
        return
      }

      // Parse tên và mô tả từ header
      const nameRow = rows[0]?.[0]?.toString() || ''
      const descRow = rows[1]?.[0]?.toString() || ''

      const name = nameRow.replace('NGÂN HÀNG ĐỀ:', '').trim() || file.name.replace('.xlsx', '')
      const description = descRow.replace('Mô tả:', '').trim() || ''

      const questions: Omit<Question, 'questionId'>[] = []

      // Đọc từ dòng 5 trở đi (sau header)
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length < 2) continue

        const questionContent = row[1]?.toString().trim()
        if (!questionContent) continue

        // Đọc tất cả các đáp án (từ cột 2 trở đi cho đến khi gặp cột "Đáp án đúng")
        const answers: Answer[] = []
        let correctAnswerCol = -1

        // Tìm vị trí cột "Đáp án đúng" bằng cách đọc header
        const headerRow = rows[3]
        for (let j = 2; j < headerRow.length; j++) {
          const cellValue = headerRow[j]?.toString().trim()
          if (cellValue === 'Đáp án đúng') {
            correctAnswerCol = j
            break
          }
        }

        // Đọc các đáp án (từ cột 2 cho đến trước cột "Đáp án đúng")
        if (correctAnswerCol > 2) {
          for (let j = 2; j < correctAnswerCol; j++) {
            const answerContent = row[j]?.toString().trim()
            if (answerContent) {
              answers.push({
                content: answerContent,
                correct: false // Sẽ cập nhật sau
              })
            }
          }
        }

        if (answers.length === 0) continue

        // Đọc đáp án đúng
        const correctAnswer = row[correctAnswerCol]?.toString().trim().toUpperCase()

        // Xác định đáp án đúng theo ký tự A, B, C, D... hoặc theo số 0, 1, 2, 3...
        if (correctAnswer) {
          const correctIndex = correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0)
          if (correctIndex >= 0 && correctIndex < answers.length) {
            answers[correctIndex].correct = true
          } else {
            // Thử parse số
            const numIndex = parseInt(correctAnswer) - 1
            if (numIndex >= 0 && numIndex < answers.length) {
              answers[numIndex].correct = true
            }
          }
        }

        // Nếu không có đáp án nào đúng, set đáp án đầu tiên là đúng
        if (!answers.some((a) => a.correct) && answers.length > 0) {
          answers[0].correct = true
        }

        // Đọc các trường còn lại
        const difficultyCol = correctAnswerCol + 1
        const explanationCol = correctAnswerCol + 2
        const pointCol = correctAnswerCol + 3

        const difficultyText = row[difficultyCol]?.toString().trim() || 'Dễ'
        let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY'
        if (difficultyText.includes('Khó') || difficultyText === 'HARD') {
          difficulty = 'HARD'
        } else if (difficultyText.includes('Trung bình') || difficultyText === 'MEDIUM') {
          difficulty = 'MEDIUM'
        }

        const explanation = row[explanationCol]?.toString().trim() || ''
        const point = parseFloat(row[pointCol]?.toString() || '1') || 1

        questions.push({
          content: questionContent,
          difficulty,
          explanation,
          point,
          orderColumn: questions.length,
          shuffleAnswers: true,
          shuffleQuestions: true,
          answers
        })
      }

      if (questions.length === 0) {
        toast.error('Không tìm thấy câu hỏi hợp lệ trong file!')
        return
      }

      // Tạo payload và gửi lên server
      const payload = {
        name,
        description,
        questions
      }

      toast.info(`Đang tạo ngân hàng với ${questions.length} câu hỏi...`)

      await axiosClient.post('/bank-questions', payload)
      toast.success(`Import thành công ${questions.length} câu hỏi!`)
      await fetchPapers(0)
    } catch (err: any) {
      console.error('Import error:', err)
      toast.error(err?.response?.data?.message || 'Import thất bại')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async (bankQuestionId?: number) => {
    if (!bankQuestionId) {
      toast.warning('Vui lòng chọn ngân hàng cần export!')
      return
    }

    try {
      toast.info('Đang tải dữ liệu...')

      // Call API lấy data JSON
      const res = await axiosClient.get(`/bank-questions/${bankQuestionId}`)
      const bankData = res.data.data

      if (!bankData || !bankData.questions || bankData.questions.length === 0) {
        toast.error('Ngân hàng không có câu hỏi!')
        return
      }

      toast.info('Đang tạo file Excel...')

      // Tìm số đáp án tối đa
      const maxAnswers = Math.max(...bankData.questions.map((q: Question) => q.answers.length))

      // Tạo dữ liệu Excel
      const excelData: any[] = []

      // Header - Tên ngân hàng
      excelData.push({ STT: `NGÂN HÀNG ĐỀ: ${bankData.name}` })
      excelData.push({ STT: `Mô tả: ${bankData.description || ''}` })
      excelData.push({})

      // Header columns - động theo số đáp án
      const headerRow: any = {
        STT: 'STT',
        'Câu hỏi': 'Câu hỏi'
      }

      // Thêm các cột đáp án
      const answerLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      for (let i = 0; i < maxAnswers; i++) {
        headerRow[answerLetters[i]] = answerLetters[i]
      }

      headerRow['Đáp án đúng'] = 'Đáp án đúng'
      headerRow['Độ khó'] = 'Độ khó'
      headerRow['Giải thích'] = 'Giải thích'
      headerRow['Điểm số'] = 'Điểm số'

      excelData.push(headerRow)

      // Data rows
      bankData.questions.forEach((q: Question, idx: number) => {
        const answers = q.answers || []

        // Tìm đáp án đúng
        const correctIndex = answers.findIndex((a: Answer) => a.correct)
        const correctLetter = correctIndex >= 0 ? answerLetters[correctIndex] : ''

        const dataRow: any = {
          STT: idx + 1,
          'Câu hỏi': q.content || ''
        }

        // Thêm các đáp án
        for (let i = 0; i < maxAnswers; i++) {
          dataRow[answerLetters[i]] = answers[i]?.content || ''
        }

        dataRow['Đáp án đúng'] = correctLetter
        dataRow['Độ khó'] = difficultyText(q.difficulty || 'EASY')
        dataRow['Giải thích'] = q.explanation || ''
        dataRow['Điểm số'] = q.point || 1

        excelData.push(dataRow)
      })

      // Tạo worksheet
      const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true })

      // Set column widths động
      const colWidths = [
        { wch: 5 }, // STT
        { wch: 50 } // Câu hỏi
      ]

      // Thêm width cho các cột đáp án
      for (let i = 0; i < maxAnswers; i++) {
        colWidths.push({ wch: 20 })
      }

      // Các cột cuối
      colWidths.push({ wch: 12 }) // Đáp án đúng
      colWidths.push({ wch: 12 }) // Độ khó
      colWidths.push({ wch: 35 }) // Giải thích
      colWidths.push({ wch: 10 }) // Điểm số

      ws['!cols'] = colWidths

      // Tạo workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Ngân hàng đề')

      // Export file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const safeName =
        bankData.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '_') || `bank_question_${bankQuestionId}`

      saveAs(blob, `${safeName}.xlsx`)
      toast.success('Export thành công!')
    } catch (err: any) {
      console.error('Export error:', err)
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
    setNewQuestions([
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
  }

  const handleAddPaper = async () => {
    if (!newName.trim()) return toast.error('Vui lòng nhập tên đề thi!')
    const validQuestions = newQuestions.filter((q) => q.content.trim())
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
            .filter((a) => a.content.trim())
            .map((a) => ({ content: a.content.trim(), correct: a.correct }))
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
      setPapers((prev) => prev.filter((p) => p.bankQuestionId !== paperId))
      if (papers.length <= 1 && page > 0) fetchPapers(page - 1)
      else fetchPapers(page)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Xóa thất bại!')
    }
  }

  // ==================== EDIT PAPER ====================
  const openEditModal = (paper: QuestionPaper) => {
    setEditingPaper(paper)
    setNewName(paper.name)
    setNewDesc(paper.description || '')
    setNewQuestions(
      paper.questions.map((q) => ({
        content: q.content,
        difficulty: q.difficulty,
        explanation: q.explanation || '',
        point: q.point,
        orderColumn: q.orderColumn,
        shuffleAnswers: q.shuffleAnswers,
        shuffleQuestions: q.shuffleQuestions,
        answers: q.answers.map((a) => ({
          content: a.content,
          correct: a.correct
        }))
      }))
    )
    setShowEditModal(true)
  }

  const handleUpdatePaper = async () => {
    if (!editingPaper) return toast.error('Không tìm thấy ngân hàng để cập nhật!')
    if (!newName.trim()) return toast.error('Vui lòng nhập tên đề thi!')
    const validQuestions = newQuestions.filter((q) => q.content.trim())
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
            .filter((a) => a.content.trim())
            .map((a) => ({ content: a.content.trim(), correct: a.correct }))
        }))
      }

      await axiosClient.put(`/bank-questions/${editingPaper.bankQuestionId}`, payload)
      toast.success('Cập nhật ngân hàng đề thành công!')
      setShowEditModal(false)
      setEditingPaper(null)
      resetAddForm()

      // Refresh data
      await fetchPapers(page)
      if (selectedPaper?.bankQuestionId === editingPaper.bankQuestionId) {
        await fetchPaperDetail(editingPaper.bankQuestionId)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Cập nhật thất bại!')
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingPaper(null)
    resetAddForm()
  }

  useEffect(() => {
    fetchPapers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDate = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm')
  const difficultyText = (d: string) => (d === 'EASY' ? 'Dễ' : d === 'MEDIUM' ? 'Trung bình' : 'Khó')

  // Expose hàm fetchPapers ra ngoài để pagination dùng
  return {
    // state
    papers,
    selectedPaper,
    loadingPapers,
    loadingDetail,
    page,
    totalPages,
    showAddModal,
    showEditModal,
    editingPaper,
    newName,
    setNewName,
    newDesc,
    setNewDesc,
    newQuestions,
    setNewQuestions,
    fileInputRef,

    // actions
    setShowAddModal,
    setShowEditModal,
    setSelectedPaper,
    fetchPapers,
    fetchPaperDetail,
    handleAddPaper,
    handleDeletePaper,
    handleUpdatePaper,
    openEditModal,
    closeEditModal,
    resetAddForm,
    triggerImport,
    handleImportFile,
    handleExport,

    // utils
    formatDate,
    difficultyText
  }
}
