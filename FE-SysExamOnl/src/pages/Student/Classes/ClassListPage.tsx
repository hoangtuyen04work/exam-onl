import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studentClassApi } from '../../../api/student-class-api'
import { StudentClass, StudentClassDetail } from '../../../types/class.type'
import { ChatBox } from '../../../components/Chat'
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

const ClassListPage = () => {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId?: string }>()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(classId ? Number(classId) : null)
  const [classDetail, setClassDetail] = useState<StudentClassDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<'exams' | 'chat'>('exams')
  const [allowStudentChat, setAllowStudentChat] = useState(true)
  const [showClassInfo, setShowClassInfo] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [page])

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetail(selectedClassId)
      loadChatSettings(selectedClassId)
    }
  }, [selectedClassId])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const response = await studentClassApi.getMyClasses(page, 50)
      if (response && response.items) {
        setClasses(response.items)
        setTotalPages(response.totalPages)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClassDetail = async (classId: number) => {
    try {
      setLoadingDetail(true)
      const response = await studentClassApi.getClassDetail(classId)
      if (response.success && response.data) {
        setClassDetail(response.data)
      }
    } catch (error) {
      console.error('Failed to load class detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const loadChatSettings = async (classId: number) => {
    try {
      const response = await classChatApi.getChatSettings(classId)
      if (response.success) {
        setAllowStudentChat(response.data)
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error)
    }
  }

  const handleClassClick = (classId: number, tab: 'exams' | 'chat' = 'exams') => {
    setSelectedClassId(classId)
    setActiveTab(tab)
    navigate(`/student/classes/${classId}`, { replace: true })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getExamStatus = (startAt: string, expiredAt: string) => {
    const now = new Date()
    const start = new Date(startAt)
    const expired = new Date(expiredAt)

    if (now < start) {
      return { text: 'Sắp diễn ra', color: 'text-blue-600 bg-blue-100' }
    } else if (now > expired) {
      return { text: 'Đã kết thúc', color: 'text-gray-600 bg-gray-100' }
    } else {
      return { text: 'Đang diễn ra', color: 'text-green-600 bg-green-100' }
    }
  }

  const handleStartExam = (inviteLink: string) => {
    if (inviteLink) {
      window.location.href = inviteLink
    }
  }

  return (
    <div className='h-screen flex overflow-hidden bg-gray-50'>
      {/* Left Sidebar - Class List (Messenger Style) */}
      <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
        {/* Header */}
        <div className='px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'>
          <h1 className='text-xl font-bold text-white'>Lớp học của tôi</h1>
          <p className='text-blue-100 text-xs mt-1'>{classes.length} lớp học</p>
        </div>

        {/* Class List */}
        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600'></div>
            </div>
          ) : classes.length === 0 ? (
            <div className='text-center py-16 px-4'>
              <div className='text-gray-400 text-5xl mb-3'>📚</div>
              <p className='text-gray-600'>Chưa có lớp học nào</p>
            </div>
          ) : (
            <div>
              {classes.map((classItem) => (
                <div key={classItem.classId} className='border-b border-gray-100 group'>
                  <div
                    className={`w-full px-3 py-3 hover:bg-blue-50 transition-colors cursor-pointer ${
                      selectedClassId === classItem.classId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className='flex items-start gap-2.5'>
                      {/* Avatar/Icon */}
                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
                        <span className='text-white font-bold text-base'>{classItem.name.charAt(0).toUpperCase()}</span>
                      </div>

                      {/* Class Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between mb-0.5'>
                          <h3 className='font-semibold text-gray-900 truncate text-sm'>{classItem.name}</h3>
                          {classItem.totalExamSessions > 0 && (
                            <span className='px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full flex-shrink-0 font-medium'>
                              {classItem.totalExamSessions}
                            </span>
                          )}
                        </div>
                        <p className='text-xs text-gray-500 truncate'>{classItem.classCode}</p>
                        <p className='text-xs text-gray-600 truncate mt-0.5'>👨‍🏫 {classItem.teacherName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Menu - Shows on hover below the item */}
                  <div className='max-h-0 group-hover:max-h-32 overflow-hidden transition-all duration-300 ease-in-out bg-gray-50'>
                    <div className='px-3 pb-2.5 space-y-1.5 pt-1'>
                      <button
                        onClick={() => handleClassClick(classItem.classId, 'exams')}
                        className='w-full px-2.5 py-2 text-left hover:bg-blue-100 transition-colors flex items-center gap-2 rounded-lg bg-white border border-gray-200'
                      >
                        <div className='w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center'>
                          <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <p className='font-medium text-gray-900 text-xs'>Bài thi</p>
                          <p className='text-[10px] text-gray-500'>{classItem.totalExamSessions} bài</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleClassClick(classItem.classId, 'chat')}
                        className='w-full px-2.5 py-2 text-left hover:bg-green-100 transition-colors flex items-center gap-2 rounded-lg bg-white border border-gray-200'
                      >
                        <div className='w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center'>
                          <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <p className='font-medium text-gray-900 text-xs'>Chat lớp học</p>
                          <p className='text-[10px] text-gray-500'>Nhắn tin</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='px-3 py-2.5 border-t border-gray-200 bg-gray-50'>
            <div className='flex items-center justify-between text-xs'>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className='px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              >
                ← Trước
              </button>
              <span className='text-gray-600'>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className='px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Content - Class Detail */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {!selectedClassId ? (
          <div className='flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50'>
            <div className='text-center'>
              <div className='w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-xl flex items-center justify-center'>
                <svg className='w-16 h-16 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-gray-700 mb-2'>Chọn một lớp học</h2>
              <p className='text-gray-500'>Chọn lớp học từ danh sách bên trái để xem chi tiết</p>
            </div>
          </div>
        ) : loadingDetail ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : !classDetail ? (
          <div className='flex-1 flex items-center justify-center'>
            <p className='text-gray-600'>Không tìm thấy thông tin lớp học</p>
          </div>
        ) : (
          <div className='flex-1 flex flex-col overflow-hidden'>
            {/* Class Header */}
            <div className='bg-white border-b border-gray-200 shadow-sm'>
              <button
                onClick={() => setShowClassInfo(!showClassInfo)}
                className='w-full px-5 py-3.5 hover:bg-gray-50 transition-colors'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                      <span className='text-white font-bold text-base'>{classDetail.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className='text-left'>
                      <h2 className='text-lg font-bold text-gray-900'>{classDetail.name}</h2>
                      <p className='text-xs text-gray-500'>{classDetail.classCode}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5 text-gray-600'>
                    <span className='text-xs font-medium'>Thông tin</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showClassInfo ? 'rotate-180' : ''}`}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Collapsible Info */}
              {showClassInfo && (
                <div className='px-5 py-3 border-t border-gray-100 bg-gray-50'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-xs'>
                    <div>
                      <p className='text-gray-500 mb-0.5'>👨‍🏫 Giảng viên</p>
                      <p className='font-medium text-gray-900 text-sm'>{classDetail.teacherName}</p>
                    </div>
                    <div>
                      <p className='text-gray-500 mb-0.5'>📅 Học kỳ</p>
                      <p className='font-medium text-gray-900 text-sm'>
                        HK{classDetail.semester} - {classDetail.academicYear}
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500 mb-0.5'>👥 Sinh viên</p>
                      <p className='font-medium text-gray-900 text-sm'>{classDetail.totalStudents} người</p>
                    </div>
                    <div>
                      <p className='text-gray-500 mb-0.5'>📝 Bài thi</p>
                      <p className='font-medium text-gray-900 text-sm'>{classDetail.examSessions.length} bài</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content - No Tabs */}
            <div className='flex-1 overflow-y-auto bg-gray-50'>
              {activeTab === 'exams' && (
                <div className='p-6'>
                  {classDetail.examSessions.length === 0 ? (
                    <div className='text-center py-16'>
                      <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center'>
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
                    <div className='space-y-3'>
                      {classDetail.examSessions.map((exam) => {
                        const status = getExamStatus(exam.startAt, exam.expiredAt)
                        const canStart = new Date() >= new Date(exam.startAt) && new Date() <= new Date(exam.expiredAt)

                        return (
                          <div
                            key={exam.classExamSessionId}
                            className='bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-200'
                          >
                            <div className='flex justify-between items-start mb-3'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2.5 mb-1.5'>
                                  <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
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
                                    <h3 className='text-base font-bold text-gray-900'>{exam.examSessionName}</h3>
                                    <p className='text-xs text-gray-500'>{exam.examSessionCode}</p>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color} flex items-center gap-1`}
                              >
                                {status.text === 'Đang diễn ra' && '🟢'}
                                {status.text === 'Sắp diễn ra' && '🔵'}
                                {status.text === 'Đã kết thúc' && '⚫'}
                                {status.text}
                              </span>
                            </div>

                            {exam.description && (
                              <p className='text-gray-700 mb-3 p-2.5 bg-gray-50 rounded-lg text-xs'>
                                {exam.description}
                              </p>
                            )}

                            <div className='grid grid-cols-2 gap-2 mb-3'>
                              <div className='p-2.5 bg-blue-50 rounded-lg'>
                                <p className='text-[10px] text-blue-600 mb-0.5'>⏰ Bắt đầu</p>
                                <p className='text-xs font-semibold text-gray-900'>{formatDateTime(exam.startAt)}</p>
                              </div>
                              <div className='p-2.5 bg-red-50 rounded-lg'>
                                <p className='text-[10px] text-red-600 mb-0.5'>⏱️ Kết thúc</p>
                                <p className='text-xs font-semibold text-gray-900'>{formatDateTime(exam.expiredAt)}</p>
                              </div>
                              <div className='p-2.5 bg-green-50 rounded-lg'>
                                <p className='text-[10px] text-green-600 mb-0.5'>⏳ Thời lượng</p>
                                <p className='text-xs font-semibold text-gray-900'>{exam.durationMinutes} phút</p>
                              </div>
                              <div className='p-2.5 bg-purple-50 rounded-lg'>
                                <p className='text-[10px] text-purple-600 mb-0.5'>📅 Ngày giao</p>
                                <p className='text-xs font-semibold text-gray-900'>
                                  {new Date(exam.assignedAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>

                            {canStart && exam.inviteLink && (
                              <button
                                onClick={() => handleStartExam(exam.inviteLink)}
                                className='w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-sm'
                              >
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
                                  />
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                  />
                                </svg>
                                Bắt đầu làm bài
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className='p-6 h-full'>
                  <div className='h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                    <ChatBox
                      classId={selectedClassId}
                      userRole='STUDENT'
                      userId={getUserIdFromToken()}
                      allowStudentChat={allowStudentChat}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassListPage
