// src/pages/Teacher/Classes/AddStudentsModal.tsx
import React, { useState, useMemo } from 'react'
import { addStudentsToClass } from '../../../api/class-api'

interface AddStudentsModalProps {
  classId: number
  onClose: (success?: boolean) => void
}

const AddStudentsModal: React.FC<AddStudentsModalProps> = ({ classId, onClose }) => {
  const [studentEmailsText, setStudentEmailsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Parse và validate emails real-time
  const parsedData = useMemo(() => {
    if (!studentEmailsText.trim()) {
      return { emails: [], validEmails: [], invalidEmails: [], duplicates: [] }
    }

    // Tách bởi dấu phẩy, xuống dòng, tab, space
    const rawEmails = studentEmailsText.split(/[,\n\t ]+/).filter((email) => email.trim() !== '')

    const validEmails: string[] = []
    const invalidEmails: string[] = []
    const seenEmails = new Set<string>()
    const duplicates: string[] = []

    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (const email of rawEmails) {
      const trimmed = email.trim().toLowerCase()

      if (!emailRegex.test(trimmed)) {
        invalidEmails.push(trimmed)
      } else if (seenEmails.has(trimmed)) {
        if (!duplicates.includes(trimmed)) {
          duplicates.push(trimmed)
        }
      } else {
        seenEmails.add(trimmed)
        validEmails.push(trimmed)
      }
    }

    return { emails: rawEmails, validEmails, invalidEmails, duplicates }
  }, [studentEmailsText])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (parsedData.validEmails.length === 0) {
      setError('Vui lòng nhập ít nhất một email học sinh hợp lệ')
      return
    }

    if (parsedData.invalidEmails.length > 0) {
      setError(`Email không hợp lệ: ${parsedData.invalidEmails.join(', ')}`)
      return
    }

    try {
      setLoading(true)
      await addStudentsToClass(classId, { studentEmails: parsedData.validEmails })
      onClose(true)
    } catch (err: unknown) {
      let errorMessage = 'Có lỗi xảy ra khi thêm học sinh'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error('Error adding students:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasteExample = (type: 'comma' | 'newline') => {
    if (type === 'comma') {
      setStudentEmailsText('student1@example.com, student2@example.com, student3@example.com')
    } else {
      setStudentEmailsText('student1@example.com\nstudent2@example.com\nstudent3@example.com')
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>
                <span className='text-2xl'>👥</span>
              </div>
              <div>
                <h2 className='text-2xl font-bold'>Thêm học sinh vào lớp</h2>
                <p className='text-green-100 text-sm'>Nhập danh sách email học sinh cần thêm</p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className='w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition'
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          {error && (
            <div className='bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-3'>
              <span className='text-xl'>⚠️</span>
              <div className='flex-1'>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Input Section */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Nhập danh sách Email <span className='text-red-500'>*</span>
                </label>
                <textarea
                  value={studentEmailsText}
                  onChange={(e) => setStudentEmailsText(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition'
                  placeholder='Nhập email học sinh...'
                  rows={12}
                  required
                />

                {/* Quick examples */}
                <div className='mt-3 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => handlePasteExample('comma')}
                    className='text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition'
                  >
                    📋 Ví dụ: email1, email2
                  </button>
                  <button
                    type='button'
                    onClick={() => handlePasteExample('newline')}
                    className='text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition'
                  >
                    📋 Ví dụ: xuống dòng
                  </button>
                  <button
                    type='button'
                    onClick={() => setStudentEmailsText('')}
                    className='text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition'
                  >
                    🗑️ Xóa tất cả
                  </button>
                </div>

                {/* Instructions */}
                <div className='mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-sm font-semibold text-blue-900 mb-2'>💡 Hướng dẫn:</p>
                  <ul className='text-xs text-blue-800 space-y-1.5'>
                    <li>
                      • Nhập ID học sinh, cách nhau bằng <strong>dấu phẩy</strong> hoặc <strong>xuống dòng</strong>
                    </li>
                    <li>• Có thể paste từ Excel/CSV (tự động tách)</li>
                    <li>• Hệ thống sẽ tự động loại bỏ ID trùng lặp</li>
                    <li>• Chỉ chấp nhận số nguyên dương</li>
                  </ul>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Xem trước kết quả</label>
                <div className='border-2 border-gray-200 rounded-xl p-4 bg-gray-50 h-[380px] overflow-y-auto'>
                  {parsedData.emails.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                      <span className='text-4xl mb-2'>📝</span>
                      <p className='text-sm'>Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {/* Valid Emails */}
                      {parsedData.validEmails.length > 0 && (
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-green-600 font-semibold text-sm'>✓ Hợp lệ</span>
                            <span className='bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.validEmails.length} học sinh
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.validEmails.map((email) => (
                              <span
                                key={email}
                                className='bg-green-100 text-green-800 px-2.5 py-1 rounded-lg text-xs font-semibold'
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invalid Emails */}
                      {parsedData.invalidEmails.length > 0 && (
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-red-600 font-semibold text-sm'>✗ Không hợp lệ</span>
                            <span className='bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.invalidEmails.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.invalidEmails.map((email) => (
                              <span
                                key={`invalid-${email}`}
                                className='bg-red-100 text-red-800 px-2.5 py-1 rounded-lg text-xs line-through'
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Duplicates */}
                      {parsedData.duplicates.length > 0 && (
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-yellow-600 font-semibold text-sm'>⚠ Trùng lặp (đã loại bỏ)</span>
                            <span className='bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.duplicates.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.duplicates.map((email) => (
                              <span
                                key={email}
                                className='bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-lg text-xs'
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {parsedData.validEmails.length > 0 && (
                  <div className='mt-4 bg-green-50 border border-green-200 rounded-lg p-3'>
                    <p className='text-sm text-green-900'>
                      <strong>Tổng cộng:</strong> Sẽ thêm{' '}
                      <span className='font-bold text-green-600'>{parsedData.validEmails.length}</span> học sinh vào lớp
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className='flex gap-3 justify-end mt-6 pt-4 border-t'>
              <button
                type='button'
                onClick={() => onClose()}
                className='px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition font-medium'
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type='submit'
                className='px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30'
                disabled={loading || parsedData.validEmails.length === 0 || parsedData.invalidEmails.length > 0}
              >
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <span className='animate-spin'>⏳</span> Đang thêm...
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <span>✓</span> Thêm {parsedData.validEmails.length} học sinh
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddStudentsModal
