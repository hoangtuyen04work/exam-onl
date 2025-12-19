// src/pages/Teacher/Classes/ClassEditPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getClassById, updateClass } from '../../../api/class-api'
import type { ClassUpdateRequest } from '../../../types/class.type'

const ClassEditPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<ClassUpdateRequest>({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return

      try {
        setLoading(true)
        const data = await getClassById(Number(classId))
        setFormData({
          name: data.name,
          description: data.description || ''
        })
        setError('')
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải thông tin lớp học'
        setError(errorMessage)
        console.error('Error fetching class:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClass()
  }, [classId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name?.trim()) {
      setError('Tên lớp học không được để trống')
      return
    }

    try {
      setSaving(true)
      await updateClass(Number(classId), formData)
      navigate(`/teacher/classes/${classId}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật lớp học'
      setError(errorMessage)
      console.error('Error updating class:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>Đang tải...</div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-2xl mx-auto'>
        <Link to={`/teacher/classes/${classId}`} className='text-blue-600 hover:underline mb-4 inline-block'>
          ← Quay lại chi tiết lớp
        </Link>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <h1 className='text-2xl font-bold mb-6'>Chỉnh sửa lớp học</h1>

          {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Tên lớp học <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='VD: Lớp Toán 12A1'
                required
              />
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Mô tả</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Mô tả về lớp học...'
                rows={4}
              />
            </div>

            <div className='flex gap-3 justify-end'>
              <Link
                to={`/teacher/classes/${classId}`}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition'
              >
                Hủy
              </Link>
              <button
                type='submit'
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50'
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ClassEditPage
