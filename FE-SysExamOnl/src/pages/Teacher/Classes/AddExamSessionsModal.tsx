// src/pages/Teacher/Classes/AddExamSessionsModal.tsx
import React, { useState, useMemo } from 'react'
import { addExamSessionsToClass } from '../../../api/class-api'

interface AddExamSessionsModalProps {
  classId: number
  onClose: (success?: boolean) => void
}

const AddExamSessionsModal: React.FC<AddExamSessionsModalProps> = ({ classId, onClose }) => {
  const [examSessionIdsText, setExamSessionIdsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Parse và validate IDs real-time
  const parsedData = useMemo(() => {
    if (!examSessionIdsText.trim()) {
      return { ids: [], validIds: [], invalidIds: [], duplicates: [] }
    }

    // Tách bởi dấu phẩy, xuống dòng, tab, space
    const rawIds = examSessionIdsText.split(/[,\n\t ]+/).filter((id) => id.trim() !== '')

    const validIds: number[] = []
    const invalidIds: string[] = []
    const seenIds = new Set<number>()
    const duplicates: number[] = []

    for (const id of rawIds) {
      const trimmed = id.trim()
      const parsed = Number.parseInt(trimmed, 10)

      if (Number.isNaN(parsed) || parsed <= 0) {
        invalidIds.push(trimmed)
      } else if (seenIds.has(parsed)) {
        if (!duplicates.includes(parsed)) {
          duplicates.push(parsed)
        }
      } else {
        seenIds.add(parsed)
        validIds.push(parsed)
      }
    }

    return { ids: rawIds, validIds, invalidIds, duplicates }
  }, [examSessionIdsText])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (parsedData.validIds.length === 0) {
      setError('Vui lòng nhập ít nhất một ID bài thi hợp lệ')
      return
    }

    if (parsedData.invalidIds.length > 0) {
      setError(`ID không hợp lệ: ${parsedData.invalidIds.join(', ')}`)
      return
    }

    try {
      setLoading(true)
      await addExamSessionsToClass(classId, { examSessionIds: parsedData.validIds })
      onClose(true)
    } catch (err: unknown) {
      let errorMessage = 'Có lỗi xảy ra khi thêm bài thi'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error('Error adding exam sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasteExample = (type: 'comma' | 'newline') => {
    if (type === 'comma') {
      setExamSessionIdsText('10, 11, 12, 13, 14')
    } else {
      setExamSessionIdsText('10\n11\n12\n13\n14')
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>
                <span className='text-2xl'>📝</span>
              </div>
              <div>
                <h2 className='text-2xl font-bold'>Thêm bài thi vào lớp</h2>
                <p className='text-blue-100 text-sm'>Nhập danh sách ID bài thi (exam session) cần gán</p>
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
                  Nhập danh sách ID bài thi <span className='text-red-500'>*</span>
                </label>
                <textarea
                  value={examSessionIdsText}
                  onChange={(e) => setExamSessionIdsText(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm transition'
                  placeholder='Nhập ID bài thi...'
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
                    📋 Ví dụ: 10, 11, 12
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
                    onClick={() => setExamSessionIdsText('')}
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
                      • Nhập ID exam session, cách nhau bằng <strong>dấu phẩy</strong> hoặc <strong>xuống dòng</strong>
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
                  {parsedData.ids.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                      <span className='text-4xl mb-2'>📝</span>
                      <p className='text-sm'>Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {/* Valid IDs */}
                      {parsedData.validIds.length > 0 && (
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-blue-600 font-semibold text-sm'>✓ Hợp lệ</span>
                            <span className='bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.validIds.length} bài thi
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.validIds.map((id) => (
                              <span
                                key={id}
                                className='bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold'
                              >
                                #{id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invalid IDs */}
                      {parsedData.invalidIds.length > 0 && (
                        <div>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-red-600 font-semibold text-sm'>✗ Không hợp lệ</span>
                            <span className='bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                              {parsedData.invalidIds.length}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1.5'>
                            {parsedData.invalidIds.map((id) => (
                              <span
                                key={`invalid-${id}`}
                                className='bg-red-100 text-red-800 px-2.5 py-1 rounded-lg text-xs font-mono line-through'
                              >
                                {id}
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
                            {parsedData.duplicates.map((id) => (
                              <span
                                key={id}
                                className='bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-mono'
                              >
                                #{id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {parsedData.validIds.length > 0 && (
                  <div className='mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3'>
                    <p className='text-sm text-blue-900'>
                      <strong>Tổng cộng:</strong> Sẽ thêm{' '}
                      <span className='font-bold text-blue-600'>{parsedData.validIds.length}</span> bài thi vào lớp
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
                className='px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30'
                disabled={loading || parsedData.validIds.length === 0 || parsedData.invalidIds.length > 0}
              >
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <span className='animate-spin'>⏳</span> Đang thêm...
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <span>✓</span> Thêm {parsedData.validIds.length} bài thi
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

export default AddExamSessionsModal
