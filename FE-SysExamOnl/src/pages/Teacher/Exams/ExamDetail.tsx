import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getExamById, updateExam, ExamDetail } from '../../../../api/examApi'
import { toast } from 'react-toastify'

export default function ExamDetailPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!id) return
    ;(async () => {
      setLoading(true)
      try {
        const data = await getExamById(id)
        if (mounted) setExam(data)
      } catch {
        toast.error('Không lấy được chi tiết đề')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  async function save() {
    if (!id || !exam) return
    setSaving(true)
    try {
      await updateExam(id, exam)
      toast.success('Cập nhật đề thành công')
      setEditing(false)
    } catch {
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Đang tải...</div>
  if (!exam) return <div className="p-6">Không có dữ liệu</div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Chi tiết đề: {exam.name}</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate('/teacher/exams')} className="text-gray-600">Quay lại</button>
          <button onClick={() => setEditing(v => !v)} className="bg-blue-600 text-white px-3 py-1 rounded">{editing ? 'Hủy' : 'Sửa'}</button>
        </div>
      </div>

      <div className="bg-white p-4 border rounded">
        <div className="mb-3">
          <label className="block text-sm text-gray-600">Tên</label>
          <input
            value={exam.name ?? ''}
            onChange={e => setExam({ ...exam, name: e.target.value })}
            disabled={!editing}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm text-gray-600">Mô tả</label>
          <textarea
            value={exam.description ?? ''}
            onChange={e => setExam({ ...exam, description: e.target.value })}
            disabled={!editing}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex gap-2">
          {editing && <button onClick={save} disabled={saving} className="bg-green-600 text-white px-3 py-1 rounded">{saving ? 'Đang lưu...' : 'Lưu'}</button>}
          <button onClick={() => toast.info('Sửa câu hỏi (chưa có UI)')} className="border px-3 py-1 rounded">Sửa câu hỏi</button>
          <button onClick={() => toast.info('Giao đề (sử dụng API)')} className="border px-3 py-1 rounded">Giao đề</button>
        </div>
      </div>
    </div>
  )
}