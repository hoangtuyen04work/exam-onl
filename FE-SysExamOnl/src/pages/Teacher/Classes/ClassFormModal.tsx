// src/pages/Teacher/Classes/ClassFormModal.tsx
import React, { useState, useEffect } from 'react'
import { createClass, updateClass } from '../../../api/class-api'
import type { ClassResponse, ClassCreationRequest } from '../../../types/class.type'

interface ClassFormModalProps {
  classData?: ClassResponse | null
  onClose: (success?: boolean) => void
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ classData, onClose }) => {
  const [formData, setFormData] = useState<ClassCreationRequest>({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        description: classData.description || ''
      })
    }
  }, [classData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Tên lớp học không được để trống')
      return
    }

    try {
      setLoading(true)
      if (classData) {
        await updateClass(classData.id, formData)
      } else {
        await createClass(formData)
      }
      onClose(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      setError(errorMessage)
      console.error('Error saving class:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
        <h2 className='text-2xl font-bold mb-4'>{classData ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}</h2>

        {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Tên lớp học <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='VD: Lớp Toán 12A1'
              required
            />
          </div>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Mô tả về lớp học...'
              rows={4}
            />
          </div>

          <div className='flex gap-3 justify-end'>
            <button
              type='button'
              onClick={() => onClose()}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition'
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50'
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : classData ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClassFormModal
