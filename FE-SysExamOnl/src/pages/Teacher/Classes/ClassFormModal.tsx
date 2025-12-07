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
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
            <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
              />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-800'>{classData ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}</h2>
        </div>

        {error && (
          <div className='bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2'>
            <svg className='w-5 h-5 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
            <span className='text-sm'>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className='mb-5'>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Tên lớp học <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
              placeholder='VD: Lớp Toán 12A1'
              required
            />
          </div>

          <div className='mb-7'>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none'
              placeholder='Mô tả về lớp học...'
              rows={4}
            />
          </div>

          <div className='flex gap-3 justify-end pt-2'>
            <button
              type='button'
              onClick={() => onClose()}
              className='px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium'
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type='submit'
              className='px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
              disabled={loading}
            >
              {loading ? (
                <span className='flex items-center gap-2'>
                  <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Đang lưu...
                </span>
              ) : classData ? (
                '✓ Cập nhật'
              ) : (
                '+ Tạo mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClassFormModal
