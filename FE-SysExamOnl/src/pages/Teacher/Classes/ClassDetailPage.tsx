// src/pages/Teacher/Classes/ClassDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getClassDetail, removeStudentFromClass, removeExamSessionFromClass } from '../../../api/class-api'
import type { ClassDetailResponse } from '../../../types/class.type'
import AddStudentsModal from './AddStudentsModal'
import AssignExamsModal from './AssignExamsModal'
import { ChatBox, ChatSettings } from '../../../components/Chat'
import { classChatApi } from '../../../api/class-chat-api'

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

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [classDetail, setClassDetail] = useState<ClassDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false)
  const [showAssignExamsModal, setShowAssignExamsModal] = useState(false)

  // Get tab from URL query param
  const searchParams = new URLSearchParams(window.location.search)
  const tabParam = searchParams.get('tab') as 'students' | 'exams' | 'chat' | null
  const [activeTab, setActiveTab] = useState<'students' | 'exams' | 'chat'>(tabParam || 'students')

  const [allowStudentChat, setAllowStudentChat] = useState(true)
  const [showClassInfo, setShowClassInfo] = useState(false)

  const fetchClassDetail = useCallback(async () => {
    if (!classId) return

    try {
      setLoading(true)
      console.log('Fetching class detail for classId:', classId)
      const data = await getClassDetail(Number(classId))
      console.log('Fetched class detail:', data)
      setClassDetail(data)
      setError('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải thông tin lớp học'
      setError(errorMessage)
      console.error('Error fetching class detail:', err)
    } finally {
      setLoading(false)
    }
  }, [classId])

  const loadChatSettings = useCallback(async () => {
    if (!classId) return
    try {
      const response = await classChatApi.getChatSettings(Number(classId))
      if (response.success) {
        setAllowStudentChat(response.data)
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error)
    }
  }, [classId])

  useEffect(() => {
    fetchClassDetail()
    loadChatSettings()
  }, [fetchClassDetail, loadChatSettings])

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!classId || !globalThis.confirm(`Xóa học sinh "${studentName}" khỏi lớp?`)) {
      return
    }

    try {
      await removeStudentFromClass(Number(classId), studentId)
      fetchClassDetail()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa học sinh'
      alert(errorMessage)
      console.error('Error removing student:', err)
    }
  }

  const handleRemoveExamSession = async (classExamSessionId: number, examName: string) => {
    if (!classId || !globalThis.confirm(`Xóa bài thi "${examName}" khỏi lớp?`)) {
      return
    }

    try {
      await removeExamSessionFromClass(Number(classId), classExamSessionId)
      fetchClassDetail()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa bài thi'
      alert(errorMessage)
      console.error('Error removing exam session:', err)
    }
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>Đang tải...</div>
      </div>
    )
  }

  if (error || !classDetail) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error || 'Không tìm thấy lớp học'}
        </div>
        <button onClick={() => navigate('/teacher/classes')} className='text-blue-600 hover:underline'>
          ← Quay lại danh sách
        </button>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {/* Back Button */}
        <Link
          to='/teacher/classes'
          className='mb-5 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors group text-sm'
        >
          <svg
            className='w-4 h-4 transform group-hover:-translate-x-1 transition-transform'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Quay lại danh sách
        </Link>

        {/* Header Card - Modern Design */}
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-100'>
          {/* Gradient Header */}
          <div className='bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-4 text-white relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32'></div>
            <div className='absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24'></div>
            <div className='relative flex justify-between items-start'>
              <div className='flex-1'>
                <div className='flex items-center gap-2.5 mb-2'>
                  <div className='w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center'>
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className='text-xl font-bold mb-1'>{classDetail.name}</h1>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span className='px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium'>
                        {classDetail.classCode}
                      </span>
                      {!classDetail.isActive && (
                        <span className='px-2.5 py-0.5 bg-red-500/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1'>
                          <span className='w-1.5 h-1.5 bg-red-300 rounded-full'></span>
                          Không hoạt động
                        </span>
                      )}
                      {classDetail.isActive && (
                        <span className='px-2.5 py-0.5 bg-green-500/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1'>
                          <span className='w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse'></span>
                          Đang hoạt động
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {classDetail.description && (
                  <p className='text-white/90 text-xs bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 max-w-2xl'>
                    {classDetail.description}
                  </p>
                )}
              </div>
              <Link
                to={`/teacher/classes/${classId}/edit`}
                className='px-4 py-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-1.5 text-sm'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                Chỉnh sửa
              </Link>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShowClassInfo(!showClassInfo)}
            className='w-full px-6 py-2.5 border-t border-indigo-200/30 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-1.5 text-indigo-600 font-medium text-sm'
          >
            <span>{showClassInfo ? 'Ẩn thống kê' : 'Xem thống kê'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showClassInfo ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>

          {/* Stats Grid - Collapsible */}
          {showClassInfo && (
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 border-t border-gray-200'>
              <div className='text-center'>
                <div className='w-10 h-10 mx-auto mb-1.5 rounded-xl bg-blue-100 flex items-center justify-center'>
                  <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <p className='text-xs text-gray-500 mb-0.5'>Học kỳ</p>
                <p className='text-base font-bold text-gray-900'>{classDetail.semester}</p>
              </div>
              <div className='text-center'>
                <div className='w-10 h-10 mx-auto mb-1.5 rounded-xl bg-purple-100 flex items-center justify-center'>
                  <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <p className='text-xs text-gray-500 mb-0.5'>Năm học</p>
                <p className='text-base font-bold text-gray-900'>{classDetail.academicYear}</p>
              </div>
              <div className='text-center'>
                <div className='w-10 h-10 mx-auto mb-1.5 rounded-xl bg-green-100 flex items-center justify-center'>
                  <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
                <p className='text-xs text-gray-500 mb-0.5'>Học sinh</p>
                <p className='text-lg font-bold text-gray-900'>{classDetail.students.length}</p>
              </div>
              <div className='text-center'>
                <div className='w-10 h-10 mx-auto mb-1.5 rounded-xl bg-orange-100 flex items-center justify-center'>
                  <svg className='w-6 h-6 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <p className='text-xs text-gray-500 mb-0.5'>Bài thi</p>
                <p className='text-lg font-bold text-gray-900'>{classDetail.examSessions.length}</p>
              </div>
              <div className='text-center'>
                <div className='w-10 h-10 mx-auto mb-1.5 rounded-xl bg-pink-100 flex items-center justify-center'>
                  <svg className='w-6 h-6 text-pink-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <p className='text-xs text-gray-500 mb-0.5'>Ngày tạo</p>
                <p className='text-xs font-semibold text-gray-900'>
                  {new Date(classDetail.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs - Modern Design */}
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100'>
          <div className='border-b border-gray-200'>
            <div className='flex px-5'>
              <button
                onClick={() => setActiveTab('students')}
                className={`relative px-5 py-3 font-medium transition-all text-sm ${
                  activeTab === 'students' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className='flex items-center gap-1.5'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                  </svg>
                  <span>Học sinh</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === 'students' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {classDetail.students.length}
                  </span>
                </div>
                {activeTab === 'students' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600'></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('exams')}
                className={`relative px-5 py-3 font-medium transition-all text-sm ${
                  activeTab === 'exams' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className='flex items-center gap-1.5'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <span>Bài thi</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === 'exams' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {classDetail.examSessions.length}
                  </span>
                </div>
                {activeTab === 'exams' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600'></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`relative px-5 py-3 font-medium transition-all text-sm ${
                  activeTab === 'chat' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className='flex items-center gap-1.5'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                  </svg>
                  <span>Chat lớp học</span>
                </div>
                {activeTab === 'chat' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600'></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className='p-5'>
            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div className='flex justify-between items-center mb-5'>
                  <h2 className='text-xl font-bold text-gray-900'>Danh sách học sinh</h2>
                  <button
                    onClick={() => setShowAddStudentsModal(true)}
                    className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-1.5 text-sm'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                      />
                    </svg>
                    Thêm học sinh
                  </button>
                </div>{' '}
                {classDetail.students.length === 0 ? (
                  <div className='text-center py-16'>
                    <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center'>
                      <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                        />
                      </svg>
                    </div>
                    <p className='text-gray-600 text-lg'>Chưa có học sinh nào</p>
                  </div>
                ) : (
                  <div className='overflow-x-auto bg-white rounded-xl border border-gray-200'>
                    <table className='w-full'>
                      <thead className='bg-gradient-to-r from-gray-50 to-gray-100'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>STT</th>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>Username</th>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>Họ tên</th>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>Email</th>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>Ngày tham gia</th>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>Trạng thái</th>
                          <th className='px-4 py-3 text-left text-xs font-bold text-gray-700'>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200'>
                        {classDetail.students.map((student, index) => (
                          <tr key={student.id} className='hover:bg-blue-50 transition-colors'>
                            <td className='px-4 py-3 text-xs font-medium text-gray-900'>{index + 1}</td>
                            <td className='px-4 py-3 text-xs font-semibold text-indigo-600'>{student.username}</td>
                            <td className='px-4 py-3 text-xs text-gray-900'>{`${student.firstName} ${student.lastName}`}</td>
                            <td className='px-4 py-3 text-xs text-gray-600'>{student.email}</td>
                            <td className='px-4 py-3 text-xs text-gray-600'>
                              {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className='px-4 py-3 text-xs'>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  student.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {student.isActive ? '✓ Hoạt động' : '✕ Không hoạt động'}
                              </span>
                            </td>
                            <td className='px-4 py-3 text-xs'>
                              <button
                                onClick={() =>
                                  handleRemoveStudent(student.id, `${student.firstName} ${student.lastName}`)
                                }
                                className='text-red-600 hover:text-red-800 font-medium hover:underline'
                              >
                                🗑️ Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Exam Sessions Tab */}
            {activeTab === 'exams' && (
              <div>
                <div className='flex justify-between items-center mb-5'>
                  <h2 className='text-xl font-bold text-gray-900'>Danh sách bài thi</h2>
                  <button
                    onClick={() => setShowAssignExamsModal(true)}
                    className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-1.5 text-sm'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                    </svg>
                    Giao đề thi
                  </button>
                </div>
                {classDetail.examSessions.length === 0 ? (
                  <div className='text-center py-16'>
                    <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center'>
                      <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                    <p className='text-gray-600 text-lg'>Chưa có bài thi nào</p>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {classDetail.examSessions.map((session) => {
                      const now = new Date()
                      const startAt = new Date(session.startAt)
                      const expiredAt = new Date(session.expiredAt)

                      let status = 'ACTIVE'
                      if (now < startAt) {
                        status = 'UPCOMING'
                      } else if (now > expiredAt) {
                        status = 'EXPIRED'
                      }

                      return (
                        <div
                          key={session.id}
                          className='border border-gray-200 rounded-xl p-4 hover:shadow-xl transition-all hover:border-indigo-300 bg-white'
                        >
                          <div className='flex justify-between items-start mb-3'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2.5 mb-1.5'>
                                <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center'>
                                  <svg
                                    className='w-5 h-5 text-white'
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
                                  <h3 className='font-bold text-base text-gray-900'>{session.examSessionName}</h3>
                                  <p className='text-[10px] text-gray-500'>Mã: {session.examSessionCode}</p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveExamSession(session.id, session.examSessionName)}
                              className='text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-colors'
                              title='Xóa bài thi'
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
                          {session.description && (
                            <p className='text-xs text-gray-700 mb-3 p-2.5 bg-gray-50 rounded-lg'>
                              {session.description}
                            </p>
                          )}
                          <div className='grid grid-cols-1 gap-2 mb-3'>
                            <div className='p-2.5 bg-green-50 rounded-lg'>
                              <p className='text-[10px] text-green-600 mb-0.5'>📅 Bắt đầu</p>
                              <p className='text-[10px] font-semibold text-gray-900'>
                                {startAt.toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <div className='p-2.5 bg-red-50 rounded-lg'>
                              <p className='text-[10px] text-red-600 mb-0.5'>⏰ Hết hạn</p>
                              <p className='text-[10px] font-semibold text-gray-900'>
                                {expiredAt.toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <div className='p-2.5 bg-gray-50 rounded-lg'>
                              <p className='text-[10px] text-gray-600 mb-0.5'>📊 Trạng thái</p>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  status === 'UPCOMING'
                                    ? 'text-blue-600 bg-blue-100'
                                    : status === 'ACTIVE'
                                      ? 'text-green-600 bg-green-100'
                                      : 'text-gray-600 bg-gray-100'
                                }`}
                              >
                                {status === 'UPCOMING'
                                  ? 'Sắp diễn ra'
                                  : status === 'ACTIVE'
                                    ? 'Đang diễn ra'
                                    : 'Đã kết thúc'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className='space-y-5'>
                <ChatSettings
                  classId={Number(classId)}
                  initialAllowStudentChat={allowStudentChat}
                  onSettingChange={(newValue) => setAllowStudentChat(newValue)}
                />
                <ChatBox
                  classId={Number(classId)}
                  userRole='TEACHER'
                  userId={getUserIdFromToken()}
                  allowStudentChat={allowStudentChat}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddStudentsModal && (
        <AddStudentsModal
          classId={Number(classId)}
          onClose={(success?: boolean) => {
            setShowAddStudentsModal(false)
            if (success) fetchClassDetail()
          }}
        />
      )}

      {showAssignExamsModal && (
        <AssignExamsModal
          isOpen={showAssignExamsModal}
          onClose={() => setShowAssignExamsModal(false)}
          onAssign={async (examSessionIds: number[]) => {
            try {
              const { addExamSessionsToClass } = await import('../../../api/class-api')
              await addExamSessionsToClass(Number(classId), { examSessionIds })
              fetchClassDetail()
            } catch (err) {
              console.error('Failed to assign exams:', err)
              throw err
            }
          }}
          classId={Number(classId)}
          className={classDetail.name}
          studentCount={classDetail.students.length}
        />
      )}
    </div>
  )
}

export default ClassDetailPage
