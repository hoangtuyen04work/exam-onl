// src/pages/Teacher/CreateSessionModal.tsx
import React, { useState, useEffect } from 'react'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'

const DURATIONS = [
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút' },
  { value: 90, label: '90 phút' },
  { value: 120, label: '120 phút' }
]

interface CreateSessionModalProps {
  isOpen: boolean
  examId: number | null
  onClose: () => void
  onSuccess: (data: any) => void
}

export default function CreateSessionModal({ isOpen, examId, onClose, onSuccess }: CreateSessionModalProps) {
  const [startAt, setStartAt] = useState('')
  const [expiredAt, setExpiredAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen && (!startAt || !expiredAt)) {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false
      })
      const startStr = formatter.format(now).replace(' ', 'T')
      const end = new Date(now.getTime() + 3600000)
      const endStr = formatter.format(end).replace(' ', 'T')
      setStartAt(startStr)
      setExpiredAt(endStr)
    }
  }, [isOpen, startAt, expiredAt])

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!examId) return
    const startDate = new Date(startAt)
    const endDate = new Date(expiredAt)
    if (endDate <= startDate) {
      toast.error('Thời gian kết thúc phải sau bắt đầu')
      return
    }
    const availableMin = Math.floor((endDate.getTime() - startDate.getTime()) / 60000)
    if (duration > availableMin) {
      toast.error('Thời gian làm bài không được vượt quá thời gian mở phiên')
      return
    }

    setCreating(true)
    try {
      const payload = {
        examId,
        name: 'Phiên thi mới',
        description: 'Tạo từ dashboard',
        durationMinutes: duration,
        startAt: `${startAt}:00+07:00`,
        expiredAt: `${expiredAt}:00+07:00`
      }
      const res = await axiosClient.post('/teacher/exam-sessions', payload)
      onSuccess(res.data.data)
      toast.success('Tạo phiên thành công')
    } catch {
      toast.error('Tạo phiên thất bại')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Tạo phiên thi</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bắt đầu</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kết thúc</label>
            <input
              type="datetime-local"
              value={expiredAt}
              onChange={(e) => setExpiredAt(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thời gian làm bài (phút)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {creating ? 'Đang tạo...' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  )
}