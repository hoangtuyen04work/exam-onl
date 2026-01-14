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

  // Detail view
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState<'students' | 'exams' | 'chat'>('students')
  const [classDetail, setClassDetail] = useState<ClassDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Modals
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false)
  const [showAssignExamsModal, setShowAssignExamsModal] = useState(false)

  // Chat
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
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleDelete = async (classId: number, className: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"?`)) return
    try {
      await deleteClass(classId)
      fetchClasses()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa lớp học')
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
    if (success) fetchClasses()
  }

  const handleSelectClass = async (classId: number, tab: 'students' | 'exams' | 'chat') => {
    setSelectedClassId(classId)
    setSelectedTab(tab)
    setDetailLoading(true)

    try {
      const data = await getClassDetail(classId)
      setClassDetail(data)
      setExamPage(0) // reset exam page

      if (tab === 'chat') {
        try {
          const response = await classChatApi.getChatSettings(classId)
          if (response.success) setAllowStudentChat(response.data)
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
    if (!selectedClassId || !confirm(`Xóa học sinh "${studentName}" khỏi lớp?`)) return
    try {
      await removeStudentFromClass(selectedClassId, studentId)
      if (selectedClassId) {
        const data = await getClassDetail(selectedClassId)
        setClassDetail(data)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa học sinh')
    }
  }

  const handleRemoveExamSession = async (classExamSessionId: number, examName: string) => {
    if (!selectedClassId || !confirm(`Xóa bài thi "${examName}" khỏi lớp?`)) return
    try {
      await removeExamSessionFromClass(selectedClassId, classExamSessionId)
      if (selectedClassId) {
        const data = await getClassDetail(selectedClassId)
        setClassDetail(data)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa bài thi')
    }
  }

  const handleAssignExams = async (examSessionIds: number[]) => {
    if (!selectedClassId) return
    try {
      await addExamSessionsToClass(selectedClassId, { examSessionIds })
      setShowAssignExamsModal(false)
      if (selectedClassId) {
        const data = await getClassDetail(selectedClassId)
        setClassDetail(data)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể giao bài thi')
    }
  }

  const handleAddStudentsClose = async (success?: boolean) => {
    setShowAddStudentsModal(false)
    if (success && selectedClassId) {
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
    <div className='flex h-full bg-slate-50'>
      {error && (
        <div className='fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50'>
          {error}
        </div>
      )}

      {/* SUB-SIDEBAR - Class List */}
      <aside className='w-80 bg-white border-r border-slate-200 flex flex-col h-full'>
        {/* Header */}
        <div className='p-4 border-b border-slate-200'>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='text-lg font-bold text-slate-800 flex items-center space-x-2'>
              <i className='fas fa-chalkboard-teacher text-blue-600'></i>
              <span>Lớp học của tôi</span>
            </h2>
            <button
              onClick={handleCreateNew}
              className='w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center shadow-sm'
              title='Tạo lớp mới'
            >
              <i className='fas fa-plus'></i>
            </button>
          </div>

          <div className='relative'>
            <input
              type='text'
              placeholder='Tìm kiếm lớp học...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            />
            <i className='fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'></i>
          </div>
          <p className='text-xs text-slate-500 mt-2'>Bạn có {classes.length} lớp học</p>
        </div>

        {/* Class List */}
        <div className='flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar'>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600'></div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className='text-center py-16 px-4'>
              <i className='fas fa-folder-open text-4xl text-slate-300 mb-3'></i>
              <p className='text-slate-600 text-sm'>{searchTerm ? 'Không tìm thấy lớp học' : 'Chưa có lớp học nào'}</p>
              {!searchTerm && (
                <button
                  onClick={handleCreateNew}
                  className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors'
                >
                  Tạo lớp học đầu tiên
                </button>
              )}
            </div>
          ) : (
            filteredClasses.map((cls) => (
              <div
                key={cls.classId}
                onClick={() => handleSelectClass(cls.classId, 'students')}
                className={`p-4 rounded-xl cursor-pointer transition-all border group ${
                  selectedClassId === cls.classId
                    ? 'bg-white shadow-md border-l-4 border-blue-600'
                    : 'hover:bg-white/50 border-transparent'
                }`}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center space-x-3 flex-1 overflow-hidden'>
                    <div className='w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0'>
                      {cls.name.charAt(0).toUpperCase()}
                    </div>
                    <div className='flex-1 overflow-hidden'>
                      <p className='text-sm font-bold text-slate-700 truncate'>{cls.name}</p>
                      <p className='text-[11px] text-slate-500 font-mono'>{cls.classCode}</p>
                    </div>
                  </div>
                  <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(cls)
                      }}
                      className='w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition'
                      title='Chỉnh sửa'
                    >
                      <i className='fas fa-edit text-xs'></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(cls.classId, cls.name)
                      }}
                      className='w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition'
                      title='Xóa'
                    >
                      <i className='fas fa-trash text-xs'></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='p-3 border-t border-slate-200 bg-white'>
            <div className='flex items-center justify-between text-xs'>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className='px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              >
                ← Trước
              </button>
              <span className='text-slate-600 font-medium'>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className='px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className='flex-1 flex flex-col bg-white'>
        {detailLoading ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-slate-600'>Đang tải...</p>
            </div>
          </div>
        ) : !selectedClassId || !classDetail ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center py-12'>
              <i className='fas fa-chalkboard-teacher text-6xl text-slate-300 mb-4'></i>
              <h3 className='text-xl font-semibold text-slate-800 mb-2'>Quản lý lớp học</h3>
              <p className='text-slate-600 text-sm'>Chọn một lớp học từ danh sách bên trái để bắt đầu</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header lớp */}
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 border-b border-blue-700'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center'>
                    <i className='fas fa-users text-xl'></i>
                  </div>
                  <div>
                    <h2 className='text-lg font-bold'>{classDetail.name}</h2>
                    <div className='flex items-center gap-3 mt-1'>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(classDetail.classCode)
                          alert('Đã copy mã lớp: ' + classDetail.classCode)
                        }}
                        className='flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs hover:bg-white/30 transition'
                        title='Click để copy'
                      >
                        <i className='fas fa-copy'></i>
                        <span className='font-mono font-bold'>{classDetail.classCode}</span>
                      </button>
                      <span className='text-xs text-white/90'>
                        <i className='fas fa-user-graduate mr-1'></i>
                        {classDetail.students.length} học sinh
                      </span>
                      <span className='text-xs text-white/90'>
                        <i className='fas fa-file-alt mr-1'></i>
                        {classDetail.examSessions.length} bài thi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chat Settings Toggle */}
                <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2'>
                  <i className={`fas ${allowStudentChat ? 'fa-comments' : 'fa-comment-slash'} text-white/90`}></i>
                  <span className='text-xs text-white/90'>{allowStudentChat ? 'Chat bật' : 'Chat tắt'}</span>
                  <button
                    onClick={async () => {
                      const newValue = !allowStudentChat
                      try {
                        await classChatApi.updateChatSettings(selectedClassId, newValue)
                        setAllowStudentChat(newValue)
                      } catch (error) {
                        console.error('Failed to update chat settings:', error)
                        alert('Không thể cập nhật cài đặt chat')
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      allowStudentChat ? 'bg-green-500' : 'bg-white/30'
                    }`}
                    title={allowStudentChat ? 'Tắt quyền chat' : 'Bật quyền chat'}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                        allowStudentChat ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className='bg-white border-b border-slate-200 px-6'>
              <div className='flex space-x-1'>
                <button
                  onClick={() => setSelectedTab('students')}
                  className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                    selectedTab === 'students'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-800'
                  }`}
                >
                  <i className='fas fa-user-graduate mr-2'></i> Học sinh
                </button>
                <button
                  onClick={() => setSelectedTab('exams')}
                  className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                    selectedTab === 'exams'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-800'
                  }`}
                >
                  <i className='fas fa-file-alt mr-2'></i> Bài thi
                </button>
                <button
                  onClick={async () => {
                    setSelectedTab('chat')
                    if (selectedClassId && selectedTab !== 'chat') {
                      try {
                        const response = await classChatApi.getChatSettings(selectedClassId)
                        if (response.success) setAllowStudentChat(response.data)
                      } catch (error) {
                        console.error('Failed to load chat settings:', error)
                      }
                    }
                  }}
                  className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                    selectedTab === 'chat'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-800'
                  }`}
                >
                  <i className='fas fa-comments mr-2'></i> Chat
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className='flex-1 overflow-hidden'>
              {/* Tab Học sinh */}
              {selectedTab === 'students' && (
                <div className='h-full overflow-y-auto p-6 custom-scrollbar'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold'>Danh sách học sinh</h3>
                    <button
                      onClick={() => setShowAddStudentsModal(true)}
                      className='px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm flex items-center gap-2'
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
                      <p className='text-gray-500 text-sm mb-4'>Chưa có học sinh nào</p>
                      <button
                        onClick={() => setShowAddStudentsModal(true)}
                        className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm'
                      >
                        Thêm học sinh đầu tiên
                      </button>
                    </div>
                  ) : (
                    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                      <div className='space-y-0 divide-y divide-gray-100'>
                        {classDetail.students.map((student, index) => (
                          <div
                            key={student.studentId}
                            className='group hover:bg-gray-50 transition-colors p-4 flex items-center gap-4'
                          >
                            {/* STT */}
                            <div className='flex-shrink-0 w-8 text-center'>
                              <span className='text-sm font-semibold text-gray-500'>{index + 1}</span>
                            </div>

                            {/* Avatar */}
                            <div className='flex-shrink-0'>
                              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm'>
                                {student.username?.charAt(0).toUpperCase() || 'S'}
                              </div>
                            </div>

                            {/* Thông tin học sinh */}
                            <div className='flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-3'>
                              {/* Họ tên & Username */}
                              <div>
                                <h4 className='font-semibold text-gray-900 text-sm truncate'>
                                  {student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName}`
                                    : student.username}
                                </h4>
                                <p className='text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5'>
                                  <svg
                                    className='w-3 h-3 text-gray-400 flex-shrink-0'
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
                              </div>

                              {/* Email */}
                              <div className='flex items-center'>
                                <p className='text-xs text-gray-600 truncate flex items-center gap-1.5'>
                                  <svg
                                    className='w-3.5 h-3.5 text-gray-400 flex-shrink-0'
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
                              </div>

                              {/* Ngày tham gia */}
                              <div className='flex items-center'>
                                {student.enrolledAt && (
                                  <p className='text-xs text-gray-500 flex items-center gap-1.5'>
                                    <svg
                                      className='w-3.5 h-3.5 text-gray-400 flex-shrink-0'
                                      fill='none'
                                      stroke='currentColor'
                                      viewBox='0 0 24 24'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                      />
                                    </svg>
                                    <span className='hidden sm:inline'>Tham gia: </span>
                                    {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Nút xóa */}
                            <div className='flex-shrink-0'>
                              <button
                                onClick={() =>
                                  handleRemoveStudent(
                                    student.studentId,
                                    student.firstName && student.lastName
                                      ? `${student.firstName} ${student.lastName}`
                                      : student.username
                                  )
                                }
                                className='opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700'
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Bài thi */}
              {selectedTab === 'exams' && (
                <div className='h-full overflow-y-auto p-6 custom-scrollbar'>
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
                    <>
                      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                        <div className='overflow-x-auto'>
                          <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gradient-to-r from-blue-50 to-indigo-50'>
                              <tr>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                                  Tên bài thi
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                                  Mã
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                                  Bắt đầu
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                                  Kết thúc
                                </th>
                                <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                                  Trạng thái
                                </th>
                                <th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
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
                                      <td className='px-4 py-3'>
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
                                          <div>
                                            <div className='text-sm font-semibold text-gray-900 truncate max-w-xs'>
                                              {exam.examSessionName}
                                            </div>
                                            {exam.description && (
                                              <div className='text-xs text-gray-500 truncate max-w-xs'>
                                                {exam.description}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className='px-4 py-3 text-sm text-gray-600 font-mono'>
                                        {exam.examSessionCode}
                                      </td>
                                      <td className='px-4 py-3 text-sm text-gray-900'>
                                        {new Date(exam.startAt).toLocaleString('vi-VN', {
                                          dateStyle: 'short',
                                          timeStyle: 'short'
                                        })}
                                      </td>
                                      <td className='px-4 py-3 text-sm text-gray-900'>
                                        {new Date(exam.expiredAt).toLocaleString('vi-VN', {
                                          dateStyle: 'short',
                                          timeStyle: 'short'
                                        })}
                                      </td>
                                      <td className='px-4 py-3'>
                                        {isActive && (
                                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 gap-1'>
                                            <span className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></span>
                                            Đang diễn ra
                                          </span>
                                        )}
                                        {isUpcoming && (
                                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700'>
                                            Sắp diễn ra
                                          </span>
                                        )}
                                        {isExpired && (
                                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600'>
                                            Đã kết thúc
                                          </span>
                                        )}
                                      </td>
                                      <td className='px-4 py-3 text-center'>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveExamSession(exam.id, exam.examSessionName)
                                          }}
                                          className='text-red-600 hover:text-red-800 transition'
                                          title='Xóa bài thi khỏi lớp'
                                        >
                                          <i className='fas fa-trash text-sm'></i>
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination cho exam */}
                      {classDetail.examSessions.length > examsPerPage && (
                        <div className='mt-4'>
                          <ReactPaginate
                            previousLabel='Trước'
                            nextLabel='Sau'
                            breakLabel='...'
                            pageCount={Math.ceil(classDetail.examSessions.length / examsPerPage)}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={5}
                            onPageChange={({ selected }) => setExamPage(selected)}
                            forcePage={examPage}
                            containerClassName='flex items-center justify-center gap-2'
                            pageLinkClassName='px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors'
                            previousLinkClassName='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium'
                            nextLinkClassName='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium'
                            activeLinkClassName='px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium'
                            disabledClassName='opacity-50 cursor-not-allowed'
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab Chat */}
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
          </>
        )}
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
