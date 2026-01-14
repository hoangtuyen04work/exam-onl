// src/pages/Teacher/Classes/AddStudentsModal.tsx
import React, { useState, useMemo, useRef } from 'react'
import { addStudentsToClass } from '../../../api/class-api'
import * as XLSX from 'xlsx'

interface AddStudentsModalProps {
  classId: number
  onClose: (success?: boolean) => void
}

const AddStudentsModal: React.FC<AddStudentsModalProps> = ({ classId, onClose }) => {
  const [studentEmailsText, setStudentEmailsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][]

        // Lấy tất cả các email từ file Excel
        const emails: string[] = []
        jsonData.forEach((row) => {
          row.forEach((cell) => {
            if (cell && typeof cell === 'string' && cell.includes('@')) {
              emails.push(cell.trim())
            }
          })
        })

        if (emails.length > 0) {
          setStudentEmailsText(emails.join('\n'))
          setError('')
        } else {
          setError('Không tìm thấy email nào trong file Excel')
        }
      } catch (err) {
        setError('Không thể đọc file Excel. Vui lòng kiểm tra lại file.')
        console.error('Error reading Excel file:', err)
      }
    }
    reader.readAsArrayBuffer(file)
    // Reset input để có thể upload lại cùng file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn'
      onClick={() => onClose()}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        className='bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-scaleIn'
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-emerald-500/90 to-green-600/90 backdrop-blur-sm text-white px-6 py-4 border-b border-white/10'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-lg font-bold'>Thêm học sinh vào lớp</h2>
                <p className='text-green-100 text-xs'>Nhập email hoặc import từ Excel</p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className='w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-all duration-200'
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
            <div className='bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-3'>
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

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Import Section */}
            <div className='bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100/50'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                    />
                  </svg>
                  <h3 className='font-semibold text-gray-800 text-sm'>Import từ Excel</h3>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls,.csv'
                onChange={handleFileUpload}
                className='hidden'
                id='excel-upload'
              />

              <label
                htmlFor='excel-upload'
                className='flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-dashed border-blue-300 rounded-xl hover:bg-blue-50/80 hover:border-blue-400 transition-all duration-200 cursor-pointer group'
              >
                <svg
                  className='w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <span className='text-sm font-medium text-gray-700'>Chọn file Excel (.xlsx, .xls, .csv)</span>
              </label>

              <p className='text-xs text-blue-600 mt-2 flex items-start gap-1'>
                <svg className='w-4 h-4 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>
                  File Excel cần chứa email học sinh. Hệ thống sẽ tự động quét và lấy tất cả email trong file.
                </span>
              </p>
            </div>

            {/* Manual Input Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
              {/* Input */}
              <div className='flex flex-col'>
                <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    />
                  </svg>
                  Nhập thủ công
                </label>
                <textarea
                  value={studentEmailsText}
                  onChange={(e) => setStudentEmailsText(e.target.value)}
                  className='flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all duration-200 resize-none bg-white/80 backdrop-blur-sm h-[280px]'
                  placeholder='student1@example.com&#10;student2@example.com&#10;student3@example.com'
                />

                <div className='mt-3 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => handlePasteExample('newline')}
                    className='text-xs bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-lg transition-all duration-150 font-medium'
                  >
                    📋 Ví dụ
                  </button>
                  <button
                    type='button'
                    onClick={() => setStudentEmailsText('')}
                    className='text-xs bg-red-50/80 hover:bg-red-100/80 backdrop-blur-sm text-red-600 px-3 py-1.5 rounded-lg transition-all duration-150 font-medium'
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  Xem trước
                </label>
                <div className='border-2 border-gray-200 rounded-xl p-4 bg-gray-50/80 backdrop-blur-sm h-[280px] overflow-y-auto'>
                  {parsedData.emails.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                      <svg className='w-14 h-14 mb-2 opacity-30' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
                    <div className='space-y-3'>
                      {/* Valid Emails */}
                      {parsedData.validEmails.length > 0 && (
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-green-600 font-semibold text-xs flex items-center gap-1'>
                              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                  fillRule='evenodd'
                                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                  clipRule='evenodd'
                                />
                              </svg>
                              Hợp lệ
                            </span>
                            <span className='bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.validEmails.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.validEmails.map((email) => (
                              <span
                                key={email}
                                className='bg-green-100/80 backdrop-blur-sm text-green-800 px-2.5 py-1 rounded-lg text-xs font-medium'
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
                            <span className='text-red-600 font-semibold text-xs flex items-center gap-1'>
                              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                  fillRule='evenodd'
                                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                                  clipRule='evenodd'
                                />
                              </svg>
                              Không hợp lệ
                            </span>
                            <span className='bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.invalidEmails.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.invalidEmails.map((email) => (
                              <span
                                key={`invalid-${email}`}
                                className='bg-red-100/80 backdrop-blur-sm text-red-800 px-2.5 py-1 rounded-lg text-xs line-through font-medium'
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
                            <span className='text-yellow-600 font-semibold text-xs flex items-center gap-1'>
                              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                  fillRule='evenodd'
                                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                                  clipRule='evenodd'
                                />
                              </svg>
                              Trùng lặp
                            </span>
                            <span className='bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.duplicates.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.duplicates.map((email) => (
                              <span
                                key={email}
                                className='bg-yellow-100/80 backdrop-blur-sm text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-medium'
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
                  <div className='mt-3 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-lg p-3'>
                    <p className='text-xs text-green-900 flex items-center gap-2'>
                      <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                        <path
                          fillRule='evenodd'
                          d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
                          clipRule='evenodd'
                        />
                      </svg>
                      Sẽ thêm <span className='font-bold text-green-600'>{parsedData.validEmails.length}</span> học sinh
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className='flex gap-3 justify-end pt-4 border-t border-gray-200/50'>
              <button
                type='button'
                onClick={() => onClose()}
                className='px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-100/80 backdrop-blur-sm transition-all duration-200 font-medium text-gray-700'
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type='submit'
                className='px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 flex items-center gap-2'
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
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Thêm {parsedData.validEmails.length} học sinh
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default AddStudentsModal
