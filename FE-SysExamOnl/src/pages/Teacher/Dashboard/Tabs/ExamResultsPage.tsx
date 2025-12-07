// src/pages/Teacher/Dashboard/Tabs/ExamResultsPage.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { notification } from 'antd'
import { getExamSessionStatistics, getStudentResults, updatePassingScore } from '../../../../api/teacher-api'
import type { ExamSessionStatistics, StudentResult } from '../../../../types/exam'

type SortField = 'studentName' | 'score' | 'submittedAt'
type SortOrder = 'asc' | 'desc'
type FilterStatus = 'all' | 'passed' | 'failed' | 'submitted' | 'not-submitted'

export default function ExamResultsPage() {
  const { examSessionId } = useParams<{ examSessionId: string }>()
  const [statistics, setStatistics] = useState<ExamSessionStatistics | null>(null)
  const [students, setStudents] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showPassingScoreModal, setShowPassingScoreModal] = useState(false)
  const [newPassingScore, setNewPassingScore] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (examSessionId) {
      loadData()
    }
  }, [examSessionId])

  const loadData = async () => {
    if (!examSessionId) return

    try {
      setLoading(true)
      const [stats, results] = await Promise.all([
        getExamSessionStatistics(Number(examSessionId)),
        getStudentResults(Number(examSessionId), { page: 0, size: 1000 })
      ])

      setStatistics(stats)
      setStudents(results.items)
    } catch (error: any) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể tải dữ liệu'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassingScore = async () => {
    if (!examSessionId || !newPassingScore) return

    const score = parseFloat(newPassingScore)
    if (isNaN(score) || score < 0) {
      notification.warning({
        message: 'Cảnh báo',
        description: 'Điểm sàn phải là số không âm'
      })
      return
    }

    try {
      await updatePassingScore(Number(examSessionId), score)
      notification.success({
        message: 'Thành công',
        description: 'Cập nhật điểm sàn thành công'
      })
      setShowPassingScoreModal(false)
      loadData()
    } catch (error: any) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể cập nhật điểm sàn'
      })
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredAndSortedStudents = students
    .filter((student) => {
      // Filter by status
      if (filterStatus === 'passed' && (!student.isPassed || !student.submittedAt)) return false
      if (filterStatus === 'failed' && (student.isPassed || !student.submittedAt)) return false
      if (filterStatus === 'submitted' && !student.submittedAt) return false
      if (filterStatus === 'not-submitted' && student.submittedAt) return false

      // Filter by search term
      if (searchTerm && !student.studentName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortField === 'studentName') {
        comparison = a.studentName.localeCompare(b.studentName, 'vi')
      } else if (sortField === 'score') {
        comparison = (a.score || 0) - (b.score || 0)
      } else if (sortField === 'submittedAt') {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        comparison = dateA - dateB
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>Không tìm thấy dữ liệu</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white rounded-lg shadow p-4 border-l-4 border-blue-500'>
          <div className='text-sm text-gray-600 mb-1'>Tổng số học sinh</div>
          <div className='text-2xl font-bold text-gray-900'>{statistics.totalStudents}</div>
        </div>

        <div className='bg-white rounded-lg shadow p-4 border-l-4 border-green-500'>
          <div className='text-sm text-gray-600 mb-1'>Đã nộp bài</div>
          <div className='text-2xl font-bold text-gray-900'>
            {statistics.submittedCount}
            <span className='text-sm text-gray-500 ml-2'>
              ({((statistics.submittedCount / statistics.totalStudents) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500'>
          <div className='text-sm text-gray-600 mb-1'>Đạt yêu cầu</div>
          <div className='text-2xl font-bold text-green-600'>
            {statistics.passedCount}
            <span className='text-sm text-gray-500 ml-2'>({statistics.passRate.toFixed(1)}%)</span>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-4 border-l-4 border-red-500'>
          <div className='text-sm text-gray-600 mb-1'>Không đạt</div>
          <div className='text-2xl font-bold text-red-600'>{statistics.failedCount}</div>
        </div>
      </div>

      {/* Score Statistics */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>Thống kê điểm số</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div>
            <div className='text-sm text-gray-600 mb-1'>Điểm trung bình</div>
            <div className='text-xl font-bold text-blue-600'>{statistics.averageScore.toFixed(2)}</div>
          </div>

          <div>
            <div className='text-sm text-gray-600 mb-1'>Điểm cao nhất</div>
            <div className='text-xl font-bold text-green-600'>{statistics.highestScore?.toFixed(2) || 'N/A'}</div>
          </div>

          <div>
            <div className='text-sm text-gray-600 mb-1'>Điểm thấp nhất</div>
            <div className='text-xl font-bold text-red-600'>{statistics.lowestScore?.toFixed(2) || 'N/A'}</div>
          </div>

          <div>
            <div className='text-sm text-gray-600 mb-1 flex items-center gap-2'>
              Điểm sàn
              <button
                onClick={() => {
                  setNewPassingScore(statistics.passingScore?.toString() || '')
                  setShowPassingScoreModal(true)
                }}
                className='text-blue-600 hover:text-blue-700'
                title='Chỉnh sửa điểm sàn'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </button>
            </div>
            <div className='text-xl font-bold text-purple-600'>{statistics.passingScore?.toFixed(2) || 'Chưa đặt'}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='bg-white rounded-lg shadow p-4'>
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[200px]'>
            <input
              type='text'
              placeholder='Tìm kiếm học sinh...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='all'>Tất cả ({students.length})</option>
            <option value='submitted'>Đã nộp ({statistics.submittedCount})</option>
            <option value='not-submitted'>Chưa nộp ({statistics.totalStudents - statistics.submittedCount})</option>
            <option value='passed'>Đạt ({statistics.passedCount})</option>
            <option value='failed'>Không đạt ({statistics.failedCount})</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>STT</th>
                <th
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                  onClick={() => handleSort('studentName')}
                >
                  <div className='flex items-center gap-1'>
                    Học sinh
                    {sortField === 'studentName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                  onClick={() => handleSort('score')}
                >
                  <div className='flex items-center gap-1'>
                    Điểm
                    {sortField === 'score' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Trạng thái
                </th>
                <th
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                  onClick={() => handleSort('submittedAt')}
                >
                  <div className='flex items-center gap-1'>
                    Thời gian nộp
                    {sortField === 'submittedAt' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Số lần thoát
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredAndSortedStudents.map((student, index) => (
                <tr key={student.examSessionStudentId} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{index + 1}</td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>{student.studentName}</div>
                    <div className='text-sm text-gray-500'>ID: {student.studentId}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-bold text-gray-900'>
                      {student.submittedAt ? student.score.toFixed(2) : 'N/A'}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {!student.submittedAt ? (
                      <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'>
                        Chưa nộp
                      </span>
                    ) : student.isPassed ? (
                      <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                        ✓ Đạt
                      </span>
                    ) : (
                      <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'>
                        ✗ Không đạt
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {student.submittedAt ? new Date(student.submittedAt).toLocaleString('vi-VN') : 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{student.exitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedStudents.length === 0 && (
          <div className='text-center py-12 text-gray-500'>Không tìm thấy học sinh nào</div>
        )}
      </div>

      {/* Passing Score Modal */}
      {showPassingScoreModal && (
        <div className='fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden'>
            <div className='px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-bold text-white'>Cập nhật điểm sàn</h2>
                <button
                  onClick={() => setShowPassingScoreModal(false)}
                  className='text-white hover:bg-white/20 rounded-lg p-1 transition-colors'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>

            <div className='p-6'>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Điểm sàn (0-100)</label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  max='100'
                  value={newPassingScore}
                  onChange={(e) => setNewPassingScore(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassingScore()}
                  placeholder='Nhập điểm sàn'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-semibold'
                />
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                <p className='text-sm text-blue-800'>
                  <strong>Lưu ý:</strong> Điểm sàn được dùng để phân loại học sinh đạt/không đạt yêu cầu.
                </p>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={() => setShowPassingScoreModal(false)}
                  className='flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors'
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdatePassingScore}
                  className='flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all'
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
