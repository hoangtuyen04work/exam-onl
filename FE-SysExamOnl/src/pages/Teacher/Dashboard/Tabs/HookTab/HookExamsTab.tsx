// src/hooks/useExamsTab.ts
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

interface ExamItem {
  id: string | number
  name: string
  description: string
  totalPoint: string
  numberQuestions: number   
  startTime: string
  endTime: string
  durationMinutes: number
}

interface SessionResult {
  examSessionId: number
  code: string
  inviteLink: string
  name: string
  description: string
  expiredAt: string
  startAt: string
  ownerName: string
}

export const DURATIONS = [
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút' },
  { value: 90, label: '90 phút' },
  { value: 120, label: '120 phút' }
]

export const useExamsTab = () => {
  const [list, setList] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExams, setSelectedExams] = useState<Map<number | string, boolean>>(new Map())
  const [modalData, setModalData] = useState<SessionResult | null>(null)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<number | string | null>(null)
  const [startAt, setStartAt] = useState('')
  const [expiredAt, setExpiredAt] = useState('')
  const [duration, setDuration] = useState('60')
  const [creating, setCreating] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Vui lòng đăng nhập.')
      navigate('/role-select')
      return
    }

    const fetchExams = async () => {
      try {
        setLoading(true)
        const res = await axiosClient.get('/teacher/exams', { params: { page: 0, size: 50 } })
        const items = Array.isArray(res.data.items)
          ? res.data.items.map((item: any) => ({
              id: item.id ?? item.examId ?? '',
              name: item.name ?? '',
              description: item.description ?? '',
              totalPoint: item.totalPoint ?? '',
              numberQuestions: item.numberQuestions ?? 0,
              startTime: item.startTime ?? '',
              endTime: item.endTime ?? '',
              durationMinutes: item.durationMinutes ?? 0
            }))
          : []
          console.log('Fetched exams:', items);
        setList(items)
      } catch (err) {
        console.error(err)
        toast.error('Không tải được danh sách đề thi')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [navigate]) // dependency đúng

  const toggleSelect = (examId: number | string) => {
    setSelectedExams(prev => {
      const copy = new Map(prev)
      copy.set(examId, !copy.get(examId))
      return copy
    })
  }

  const selectAll = () => {
    const allSelected = list.length > 0 && list.every(exam => selectedExams.get(exam.id))
    setSelectedExams(allSelected ? new Map() : new Map(list.map(exam => [exam.id, true] as [number | string, boolean])))
  }

  const openTimeModal = (examId: number | string) => {
    setSelectedExamId(examId)
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setStartAt(now.toISOString().slice(0, 16))
    setExpiredAt(new Date(now.getTime() + 3600000).toISOString().slice(0, 16))
    setDuration('60')
    setShowTimeModal(true)
  }

  const handleCreateSession = async () => {
    if (!selectedExamId || !startAt || !expiredAt) {
      toast.error('Vui lòng chọn đầy đủ thời gian!')
      return
    }

    const start = new Date(startAt)
    const end = new Date(expiredAt)
    const durationMin = Number(duration)

    if (end <= start) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu!')
      return
    }

    const availableMinutes = Math.floor((end.getTime() - start.getTime()) / 60000)
    if (durationMin > availableMinutes) {
      toast.error(`Thời gian làm bài (${durationMin} phút) không được vượt quá thời gian mở phiên (${availableMinutes} phút)!`)
      return
    }

    setCreating(true)
    try {
      const payload = {
        examId: Number(selectedExamId),
        name: 'Phiên thi tùy chỉnh',
        description: '/ện giáo viên',
        durationMinutes: durationMin,
        startAt: start.toISOString(),
        expiredAt: end.toISOString()
      }

      const res = await axiosClient.post('/teacher/exam-sessions', payload)
      if (res.data?.success && res.data?.data) {
        setModalData(res.data.data)
        toast.success('Tạo phiên thi thành công!')
        setShowTimeModal(false)
      } else {
        toast.error(res.data?.message || 'Lỗi server')
      }
    } catch (err) {
      toast.error('Không thể tạo phiên thi!')
    } finally {
      setCreating(false)
    }
  }

  const formatDateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm')

  return {
    list,
    loading,
    selectedExams,
    modalData,
    showTimeModal,
    selectedExamId,
    startAt,
    expiredAt,
    duration,
    creating,
    DURATIONS,

    toggleSelect,
    selectAll,
    openTimeModal,
    handleCreateSession,
    formatDateTime,
    setModalData,
    setShowTimeModal,
    setStartAt,
    setExpiredAt,
    setDuration,
    navigate
  }
}