/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { exportExams } from '../../Dashboard/import_export/exportExams'

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

const DURATIONS = [
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút' },
  { value: 90, label: '90 phút' },
  { value: 120, label: '120 phút' }
]

export default function ExamsTab() {
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
      setLoading(true)
      try {
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
        setList(items)
      } catch {
        toast.error('Không tải được danh sách đề thi')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [navigate])

  // Xử lý chọn checkbox
  const toggleSelect = (examId: number | string) => {
    setSelectedExams(prev => {
      const newMap = new Map(prev)
      newMap.set(examId, !newMap.get(examId))
      return newMap
    })
  }

  const selectAll = () => {
    const allSelected = list.every(exam => selectedExams.get(exam.id))
    const newMap = new Map()
    if (!allSelected) {
      list.forEach(exam => newMap.set(exam.id, true))
    }
    setSelectedExams(newMap)
  }

  // Export các đề đã chọn
  const handleExportSelected = () => {
    const selectedIds: number[] = []
    const selectedNames: string[] = []

    list.forEach(exam => {
      if (selectedExams.get(exam.id)) {
        selectedIds.push(Number(exam.id))
        selectedNames.push(exam.name)
      }
    })

    if (selectedIds.length === 0) {
      toast.warn('Vui lòng chọn ít nhất 1 đề để export!')
      return
    }

    exportExams(selectedIds, selectedNames)
  }

  const openTimeModal = (examId: number | string) => {
    setSelectedExamId(examId)
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    const start = now.toISOString().slice(0, 16)
    const end = new Date(now.getTime() + 3600 * 1000).toISOString().slice(0, 16)
    setStartAt(start)
    setExpiredAt(end)
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

    if (end <= start) return toast.error('Thời gian kết thúc phải sau thời gian bắt đầu!')

    const availableMinutes = Math.floor((end.getTime() - start.getTime()) / 60000)
    if (durationMin > availableMinutes)
      return toast.error(
        `Thời gian làm bài (${durationMin} phút) không vượt quá thời gian mở phiên (${availableMinutes} phút)!`
      )

    setCreating(true)
    try {
      const payload = {
        examId: Number(selectedExamId),
        name: 'Phiên thi tùy chỉnh',
        description: 'Tạo từ giao diện giáo viên',
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
        toast.error(res.data?.message || 'Không nhận được dữ liệu từ server!')
      }
    } catch {
      toast.error('Không thể tạo phiên thi!')
    } finally {
      setCreating(false)
    }
  }

  const formatDateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Danh sách đề thi</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/teacher/exams/create')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition"
          >
            + Tạo đề thi
          </button>
          <button
            onClick={() => navigate('/teacher/questions')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition"
          >
            + Tạo từ ngân hàng
          </button>
        </div>
      </div>

      {/* Nút Export nhiều đề */}
      {selectedExams.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            Đã chọn {Array.from(selectedExams.values()).filter(Boolean).length} đề thi
          </span>
          <button
            onClick={handleExportSelected}
            className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            Export các đề đã chọn
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic">Chưa có đề thi nào.</div>
      ) : (
        <div className="space-y-4">
          {/* Header với checkbox chọn tất cả */}
          <div className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={list.length > 0 && list.every(exam => selectedExams.get(exam.id))}
              onChange={selectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Chọn tất cả</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map((exam) => (
              <div
                key={exam.id}
                className="relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all p-4 flex flex-col justify-between"
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={!!selectedExams.get(exam.id)}
                    onChange={() => toggleSelect(exam.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-blue-700 line-clamp-2">{exam.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {exam.description || 'Không có mô tả.'}
                    </p>
                    <div className="text-[11px] text-gray-500 mt-1">
                      {exam.numberQuestions} câu — {exam.durationMinutes} phút
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 text-xs">
                  <button
                    onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sửa
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => navigate('/teacher/exam-sessions/list', { state: { examId: exam.id } })}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Đã giao
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => openTimeModal(exam.id)}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Giao đề
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal chọn thời gian */}
      {showTimeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thiết lập phiên thi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  min={startAt || new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Thời gian làm bài (phút)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTimeModal(false)} className="px-4 py-2 text-gray-600">
                Hủy
              </button>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className={`px-5 py-2 rounded-lg font-medium transition ${
                  creating
                    ? 'bg-gray-400 text-white'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {creating ? 'Đang tạo...' : 'Tạo phiên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal kết quả */}
      {modalData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm">
          <div className="bg-white border rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4 text-center">Phiên thi được tạo thành công!</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Link tham gia:</p>
                <a
                  href={modalData.inviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline break-all text-xs"
                >
                  {modalData.inviteLink}
                </a>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Mã tham gia:</p>
                <p className="font-mono text-lg text-green-700 bg-green-100 px-3 py-1 rounded inline-block">
                  {modalData.code}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-purple-50 p-2 rounded">
                  <p className="font-medium text-gray-600">Mở lúc:</p>
                  <p className="text-purple-800">{formatDateTime(modalData.startAt)}</p>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <p className="font-medium text-gray-600">Đóng lúc:</p>
                  <p className="text-orange-800">{formatDateTime(modalData.expiredAt)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalData.inviteLink)
                  toast.success('Đã copy link!')
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalData.code)
                  toast.success('Đã copy mã!')
                }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
              >
                Copy Mã
              </button>
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}