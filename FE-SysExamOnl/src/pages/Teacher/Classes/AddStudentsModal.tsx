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
    <div className='fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-xl font-bold'>Thêm học sinh vào lớp</h2>
                <p className='text-green-100 text-sm'>Nhập danh sách email học sinh cần thêm</p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className='w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center transition-all duration-200'
              disabled={loading}
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          {error && (
            <div className='bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-5 flex items-start gap-3'>
              <svg className='w-5 h-5 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='flex-1 text-sm'>{error}</div>
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
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all duration-200 resize-none'
                  placeholder='Nhập email học sinh...'
                  rows={11}
                  required
                />

                {/* Quick examples */}
                <div className='mt-3 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => handlePasteExample('comma')}
                    className='text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-all duration-150 font-medium'
                  >
                    📋 Ví dụ: email1, email2
                  </button>
                  <button
                    type='button'
                    onClick={() => handlePasteExample('newline')}
                    className='text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-all duration-150 font-medium'
                  >
                    📋 Ví dụ: xuống dòng
                  </button>
                  <button
                    type='button'
                    onClick={() => setStudentEmailsText('')}
                    className='text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md transition-all duration-150 font-medium'
                  >
                    🗑️ Xóa tất cả
                  </button>
                </div>

                {/* Instructions */}
                <div className='mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3'>
                  <p className='text-xs font-semibold text-blue-900 mb-2'>💡 Hướng dẫn:</p>
                  <ul className='text-xs text-blue-800 space-y-1'>
                    <li>
                      • Nhập email học sinh, cách nhau bằng <strong>dấu phẩy</strong> hoặc <strong>xuống dòng</strong>
                    </li>
                    <li>• Có thể paste từ Excel/CSV (tự động tách)</li>
                    <li>• Hệ thống sẽ tự động loại bỏ email trùng lặp</li>
                    <li>• Chỉ chấp nhận email hợp lệ</li>
                  </ul>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Xem trước kết quả</label>
                <div className='border-2 border-gray-200 rounded-lg p-4 bg-gray-50 h-[360px] overflow-y-auto'>
                  {parsedData.emails.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                      <svg className='w-16 h-16 mb-2 opacity-30' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
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
                              {parsedData.validEmails.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.validEmails.map((email) => (
                              <span
                                key={email}
                                className='bg-green-100 text-green-800 px-2.5 py-1 rounded-md text-xs font-medium'
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
                                className='bg-red-100 text-red-800 px-2.5 py-1 rounded-md text-xs line-through font-medium'
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
                            <span className='text-yellow-600 font-semibold text-sm'>⚠ Trùng lặp</span>
                            <span className='bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.duplicates.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.duplicates.map((email) => (
                              <span
                                key={email}
                                className='bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-md text-xs font-medium'
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
                  <div className='mt-3 bg-green-50 border border-green-200 rounded-lg p-3'>
                    <p className='text-sm text-green-900'>
                      <strong>Tổng cộng:</strong> Sẽ thêm{' '}
                      <span className='font-bold text-green-600'>{parsedData.validEmails.length}</span> học sinh vào lớp
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className='flex gap-3 justify-end mt-6 pt-5 border-t border-gray-200'>
              <button
                type='button'
                onClick={() => onClose()}
                className='px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium text-gray-700'
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type='submit'
                className='px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 flex items-center gap-2'
                disabled={loading || parsedData.validEmails.length === 0 || parsedData.invalidEmails.length > 0}
              >
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    Đang thêm...
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
