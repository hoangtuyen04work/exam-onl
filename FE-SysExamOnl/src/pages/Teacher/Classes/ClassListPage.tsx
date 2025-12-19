// src/pages/Teacher/Classes/ClassListPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllClasses,
  deleteClass,
  getClassDetail,
  removeStudentFromClass,
  removeExamSessionFromClass,
  addExamSessionsToClass
} from '../../../api/class-api'
import type { ClassResponse, ClassDetailResponse } from '../../../types/class.type'
import ClassFormModal from './ClassFormModal'
import AddStudentsModal from './AddStudentsModal'
import AssignExamsModal from './AssignExamsModal'
import { ChatBox } from '../../../components/Chat'
import { classChatApi } from '../../../api/class-chat-api'
import ReactPaginate from 'react-paginate'

// Decode JWT to get userId
const getUserIdFromToken = (): number => {
  const token = localStorage.getItem('authToken')
  if (!token) return 0
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.userId || 0
  } catch {
    return 0
  }
}

const ClassListPage: React.FC = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassResponse | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Selected class and tab for detail view
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState<'students' | 'exams' | 'chat'>('students')
  const [classDetail, setClassDetail] = useState<ClassDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Modals for students and exams
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false)
  const [showAssignExamsModal, setShowAssignExamsModal] = useState(false)

  // Chat settings
  const [allowStudentChat, setAllowStudentChat] = useState(true)

  // Exam pagination
  const [examPage, setExamPage] = useState(0)
  const examsPerPage = 10

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAllClasses(page, 10, 'createdAt,desc')
      setClasses(response.items)
      setTotalPages(response.totalPages)
      setError('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách lớp học'
      setError(errorMessage)
      console.error('Error fetching classes:', err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleDelete = async (classId: number, className: string) => {
    if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"?`)) {
      return
    }

    try {
      await deleteClass(classId)
      fetchClasses()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa lớp học'
      alert(errorMessage)
      console.error('Error deleting class:', err)
    }
  }

  const handleCreateNew = () => {
    setEditingClass(null)
    setIsModalOpen(true)
  }

  const handleEdit = (cls: ClassResponse) => {
    setEditingClass(cls)
    setIsModalOpen(true)
  }

  const handleModalClose = (success?: boolean) => {
    setIsModalOpen(false)
    setEditingClass(null)
    if (success) {
      fetchClasses()
    }
  }

  const handleSelectClass = async (classId: number, tab: 'students' | 'exams' | 'chat') => {
    setSelectedClassId(classId)
    setSelectedTab(tab)
    setDetailLoading(true)

    try {
      const data = await getClassDetail(classId)
      setClassDetail(data)

      // Load chat settings if selecting chat tab
      if (tab === 'chat') {
        try {
          const response = await classChatApi.getChatSettings(classId)
          if (response.success) {
            setAllowStudentChat(response.data)
          }
        } catch (error) {
          console.error('Failed to load chat settings:', error)
        }
      }
    } catch (err) {
      console.error('Error fetching class detail:', err)
      setClassDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!selectedClassId || !globalThis.confirm(`Xóa học sinh "${studentName}" khỏi lớp?`)) {
      return
    }

    try {
      await removeStudentFromClass(selectedClassId, studentId)
      // Refresh class detail
      const data = await getClassDetail(selectedClassId)
      setClassDetail(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa học sinh'
      alert(errorMessage)
      console.error('Error removing student:', err)
    }
  }

  const handleRemoveExamSession = async (classExamSessionId: number, examName: string) => {
    if (!selectedClassId || !globalThis.confirm(`Xóa bài thi "${examName}" khỏi lớp?`)) {
      return
    }

    try {
      await removeExamSessionFromClass(selectedClassId, classExamSessionId)
      // Refresh class detail
      const data = await getClassDetail(selectedClassId)
      setClassDetail(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa bài thi'
      alert(errorMessage)
      console.error('Error removing exam session:', err)
    }
  }

  const handleAssignExams = async (examSessionIds: number[]) => {
    if (!selectedClassId) return

    try {
      await addExamSessionsToClass(selectedClassId, { examSessionIds })
      setShowAssignExamsModal(false)
      // Refresh class detail
      const data = await getClassDetail(selectedClassId)
      setClassDetail(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể giao bài thi'
      alert(errorMessage)
      throw err
    }
  }

  const handleAddStudentsClose = async (success?: boolean) => {
    setShowAddStudentsModal(false)
    if (success && selectedClassId) {
      // Refresh class detail
      const data = await getClassDetail(selectedClassId)
      setClassDetail(data)
    }
  }

  const filteredClasses = searchTerm
    ? classes.filter((cls) => cls.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : classes

  if (loading && classes.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>Đang tải...</div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

      {/* Layout with sidebar */}
      <div className='flex gap-5 h-[calc(100vh-180px)]'>
        {/* Left Sidebar - Class List */}
        <div className='w-80 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden'>
          {/* Sidebar Header */}
          <div className='px-4 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-bold text-gray-800 mb-2.5'>Danh sách lớp học</h2>

            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='Tìm kiếm lớp học...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs'
              />
              <button
                onClick={handleCreateNew}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg transition text-xs font-medium shadow-md hover:shadow-lg flex items-center gap-1 whitespace-nowrap'
                title='Tạo lớp mới'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
                Tạo
              </button>
            </div>
          </div>

          {/* Class List */}
          <div className='flex-1 overflow-y-auto'>
            {filteredClasses.map((cls) => (
              <div key={cls.classId} className='border-b border-gray-100 group'>
                <div className='px-3 py-3 hover:bg-gray-50 transition cursor-pointer'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0'>
                      <span className='text-white font-semibold text-sm'>{cls.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-1.5'>
                        <h3 className='font-semibold text-gray-900 text-sm truncate'>{cls.name}</h3>
                        <div className='flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                          <button
                            onClick={() => handleEdit(cls)}
                            className='text-blue-600 hover:text-blue-800 text-xs px-1'
                            title='Chỉnh sửa'
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(cls.classId, cls.name)}
                            className='text-red-600 hover:text-red-800 text-xs px-1'
                            title='Xóa'
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className='text-[10px] text-gray-500 truncate'>{cls.classCode}</p>
                      <div className='flex items-center gap-2 text-[10px] text-gray-500 mt-0.5'>
                        <span>👥 {cls.studentCount || 0}</span>
                        <span>📝 {cls.examSessionCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className='max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-300'>
                    <div className='flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200'>
                      <button
                        onClick={() => handleSelectClass(cls.classId, 'students')}
                        className='flex items-center gap-2 px-2.5 py-1.5 hover:bg-purple-50 rounded-lg transition text-xs'
                      >
                        <div className='w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0'>
                          <svg
                            className='w-4 h-4 text-purple-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                            />
                          </svg>
                        </div>
                        <span className='font-medium text-gray-900'>Học sinh</span>
                      </button>

                      <button
                        onClick={() => handleSelectClass(cls.classId, 'exams')}
                        className='flex items-center gap-2 px-2.5 py-1.5 hover:bg-blue-50 rounded-lg transition text-xs'
                      >
                        <div className='w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0'>
                          <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
                        </div>
                        <span className='font-medium text-gray-900'>Bài thi</span>
                      </button>

                      <button
                        onClick={() => handleSelectClass(cls.classId, 'chat')}
                        className='flex items-center gap-2 px-2.5 py-1.5 hover:bg-green-50 rounded-lg transition text-xs'
                      >
                        <div className='w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0'>
                          <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                            />
                          </svg>
                        </div>
                        <span className='font-medium text-gray-900'>Chat lớp học</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredClasses.length === 0 && !loading && (
              <div className='text-center text-gray-500 py-8 px-3 text-xs'>
                {searchTerm ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
              </div>
            )}
          </div>

          {/* Pagination in sidebar */}
          {totalPages > 1 && (
            <div className='border-t border-gray-200 px-3 py-2.5 flex items-center justify-between text-xs'>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className='px-2.5 py-1.5 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-xs'
              >
                ← Trước
              </button>
              <span className='text-[10px] text-gray-600'>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className='px-2.5 py-1.5 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-xs'
              >
                Sau →
              </button>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className='flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
          {detailLoading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
                <p className='text-gray-600'>Đang tải...</p>
              </div>
            </div>
          ) : !selectedClassId || !classDetail ? (
            <div className='flex items-center justify-center h-full p-6'>
              <div className='text-center py-12'>
                <div className='text-6xl mb-4'>📚</div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>Quản lý lớp học</h3>
                <p className='text-gray-600 text-sm'>Chọn một lớp học từ danh sách bên trái để xem chi tiết</p>
                <p className='text-gray-500 text-xs mt-2'>
                  Hover vào lớp học để xem các tùy chọn: Học sinh, Bài thi, Chat
                </p>
              </div>
            </div>
          ) : (
            <div className='h-full flex flex-col'>
              {/* Class Header - Compact */}
              <div className='bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white px-5 py-3 flex-shrink-0'>
                <div className='flex items-center gap-2.5'>
                  <div className='w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0'>
                    <span className='text-base font-bold'>{classDetail.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h2 className='text-base font-bold truncate'>{classDetail.name}</h2>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(classDetail.classCode)
                          alert('Đã copy mã lớp: ' + classDetail.classCode)
                        }}
                        className='px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] hover:bg-white/30 transition-colors flex items-center gap-1 group'
                        title='Click để copy mã lớp'
                      >
                        <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                          />
                        </svg>
                        <span className='font-semibold'>{classDetail.classCode}</span>
                      </button>
                      <span className='text-[10px] text-white/80'>
                        {classDetail.students.length} học sinh • {classDetail.examSessions.length} bài thi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area - Full height */}
              <div className='flex-1 overflow-y-auto p-4'>
                {selectedTab === 'students' && (
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold'>Danh sách học sinh</h3>
                      <button
                        onClick={() => setShowAddStudentsModal(true)}
                        className='px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm flex items-center gap-2'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                        </svg>
                        Thêm học sinh
                      </button>
                    </div>
                    {classDetail.students.length === 0 ? (
                      <div className='text-center py-12'>
                        <div className='text-5xl mb-3'>👥</div>
                        <p className='text-gray-500 text-sm mb-4'>Chưa có học sinh nào trong lớp</p>
                        <button
                          onClick={() => setShowAddStudentsModal(true)}
                          className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm'
                        >
                          Thêm học sinh đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3'>
                        {classDetail.students.map((student) => (
                          <div
                            key={student.id}
                            className='relative bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group p-4'
                          >
                            <div className='flex items-start gap-3'>
                              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md'>
                                <span className='text-white font-bold text-base'>
                                  {student.firstName?.charAt(0) || student.username?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <h4 className='font-semibold text-gray-900 text-sm truncate'>
                                    {student.firstName && student.lastName
                                      ? `${student.firstName} ${student.lastName}`
                                      : student.username}
                                  </h4>
                                  {student.isActive && (
                                    <span
                                      className='flex-shrink-0 w-2 h-2 bg-green-500 rounded-full'
                                      title='Đang hoạt động'
                                    ></span>
                                  )}
                                </div>
                                <p className='text-xs text-gray-600 truncate flex items-center gap-1.5 mb-1.5'>
                                  <svg
                                    className='w-3.5 h-3.5 text-gray-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                    />
                                  </svg>
                                  {student.username}
                                </p>
                                <p className='text-xs text-gray-500 truncate flex items-center gap-1.5'>
                                  <svg
                                    className='w-3.5 h-3.5 text-gray-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 012-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                                    />
                                  </svg>
                                  {student.email}
                                </p>
                                {student.enrolledAt && (
                                  <p className='text-[10px] text-gray-400 mt-2 flex items-center gap-1'>
                                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                      />
                                    </svg>
                                    Tham gia: {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleRemoveStudent(
                                  student.studentId,
                                  student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName}`
                                    : student.username
                                )
                              }
                              className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700'
                              title='Xóa khỏi lớp'
                            >
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'exams' && (
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold'>Danh sách bài thi</h3>
                      <button
                        onClick={() => setShowAssignExamsModal(true)}
                        className='px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm flex items-center gap-2'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                        </svg>
                        Giao bài thi
                      </button>
                    </div>
                    {classDetail.examSessions.length === 0 ? (
                      <div className='text-center py-12'>
                        <div className='text-5xl mb-3'>📝</div>
                        <p className='text-gray-500 text-sm mb-4'>Chưa có bài thi nào được giao</p>
                        <button
                          onClick={() => setShowAssignExamsModal(true)}
                          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm'
                        >
                          Giao bài thi đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                        <div className='overflow-x-auto'>
                          <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gradient-to-r from-blue-50 to-indigo-50'>
                              <tr>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/4'>
                                  Tên bài thi
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6'>
                                  Mã bài thi
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6'>
                                  Thời gian bắt đầu
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6'>
                                  Thời gian kết thúc
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/8'>
                                  Thời lượng
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/8'>
                                  Trạng thái
                                </th>
                                <th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/8'>
                                  Thao tác
                                </th>
                              </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                              {classDetail.examSessions
                                .slice(examPage * examsPerPage, (examPage + 1) * examsPerPage)
                                .map((exam) => {
                                  const now = new Date()
                                  const startTime = new Date(exam.startAt)
                                  const endTime = new Date(exam.expiredAt)
                                  const isUpcoming = startTime > now
                                  const isActive = startTime <= now && endTime >= now
                                  const isExpired = endTime < now

                                  return (
                                    <tr
                                      key={exam.id}
                                      className='hover:bg-gray-50 transition-colors cursor-pointer'
                                      onClick={() => navigate(`/teacher/exam-sessions/${exam.id}/results`)}
                                    >
                                      <td className='px-4 py-3 w-1/4'>
                                        <div className='flex items-center gap-2'>
                                          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
                                            <svg
                                              className='w-4 h-4 text-white'
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
                                          </div>
                                          <div className='min-w-0 flex-1'>
                                            <div className='text-sm font-semibold text-gray-900 truncate'>
                                              {exam.examSessionName}
                                            </div>
                                            {exam.description && (
                                              <div className='text-xs text-gray-500 truncate'>{exam.description}</div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className='px-4 py-3 w-1/6'>
                                        <span className='text-sm text-gray-600 font-mono block truncate'>
                                          {exam.examSessionCode}
                                        </span>
                                      </td>
                                      <td className='px-4 py-3 w-1/6'>
                                        <div className='text-sm text-gray-900'>
                                          <div className='truncate'>
                                            {new Date(exam.startAt).toLocaleDateString('vi-VN')}
                                          </div>
                                          <div className='text-xs text-gray-500 truncate'>
                                            {new Date(exam.startAt).toLocaleTimeString('vi-VN', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      </td>
                                      <td className='px-4 py-3 w-1/6'>
                                        <div className='text-sm text-gray-900'>
                                          <div className='truncate'>
                                            {new Date(exam.expiredAt).toLocaleDateString('vi-VN')}
                                          </div>
                                          <div className='text-xs text-gray-500 truncate'>
                                            {new Date(exam.expiredAt).toLocaleTimeString('vi-VN', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      </td>
                                      <td className='px-4 py-3 w-1/8'>
                                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap'>
                                          {exam.durationMinutes} phút
                                        </span>
                                      </td>
                                      <td className='px-4 py-3 w-1/8'>
                                        {isActive && (
                                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 gap-1 whitespace-nowrap'>
                                            <span className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></span>
                                            Đang diễn ra
                                          </span>
                                        )}
                                        {isUpcoming && (
                                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 gap-1 whitespace-nowrap'>
                                            Sắp diễn ra
                                          </span>
                                        )}
                                        {isExpired && (
                                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 gap-1 whitespace-nowrap'>
                                            Đã kết thúc
                                          </span>
                                        )}
                                      </td>
                                      <td className='px-4 py-3 w-1/8 text-center'>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveExamSession(exam.id, exam.examSessionName)
                                          }}
                                          className='inline-flex items-center px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition text-xs font-medium gap-1 whitespace-nowrap'
                                          title='Xóa bài thi'
                                        >
                                          <svg
                                            className='w-3.5 h-3.5'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={2}
                                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                            />
                                          </svg>
                                          Xóa
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {classDetail.examSessions.length > examsPerPage && (
                          <div className='px-4 py-3 border-t border-gray-200 bg-gray-50'>
                            <ReactPaginate
                              previousLabel='← Trước'
                              nextLabel='Sau →'
                              breakLabel='...'
                              pageCount={Math.ceil(classDetail.examSessions.length / examsPerPage)}
                              marginPagesDisplayed={2}
                              pageRangeDisplayed={3}
                              onPageChange={({ selected }) => setExamPage(selected)}
                              forcePage={examPage}
                              containerClassName='flex items-center justify-center gap-2'
                              pageClassName=''
                              pageLinkClassName='px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors'
                              previousClassName=''
                              previousLinkClassName='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium'
                              nextClassName=''
                              nextLinkClassName='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium'
                              breakClassName=''
                              breakLinkClassName='px-3 py-1.5 text-sm text-gray-500'
                              activeClassName=''
                              activeLinkClassName='px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium'
                              disabledClassName='opacity-50 cursor-not-allowed'
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'chat' && selectedClassId && (
                  <div className='h-full'>
                    <ChatBox
                      classId={selectedClassId}
                      userRole='TEACHER'
                      userId={getUserIdFromToken()}
                      allowStudentChat={allowStudentChat}
                      onToggleChatSettings={async (newValue) => {
                        try {
                          await classChatApi.updateChatSettings(selectedClassId, newValue)
                          setAllowStudentChat(newValue)
                        } catch (error) {
                          console.error('Failed to update chat settings:', error)
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <ClassFormModal classData={editingClass} onClose={handleModalClose} />}

      {showAddStudentsModal && selectedClassId && (
        <AddStudentsModal classId={selectedClassId} onClose={handleAddStudentsClose} />
      )}

      {showAssignExamsModal && selectedClassId && classDetail && (
        <AssignExamsModal
          isOpen={showAssignExamsModal}
          onClose={() => setShowAssignExamsModal(false)}
          onAssign={handleAssignExams}
          classId={selectedClassId}
          className={classDetail.name}
          studentCount={classDetail.students.length}
        />
      )}
    </div>
  )
}

export default ClassListPage
