import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentClassApi } from '../../../api/student-class-api'
import { StudentClassDetail } from '../../../types/class.type'
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

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [classDetail, setClassDetail] = useState<StudentClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [allowStudentChat, setAllowStudentChat] = useState(true)
  const [activeTab, setActiveTab] = useState<'exams' | 'chat'>('exams')
  const [showClassInfo, setShowClassInfo] = useState(false)

  useEffect(() => {
    if (classId) {
      loadClassDetail()
      loadChatSettings()
    }
  }, [classId])

  const loadClassDetail = async () => {
    try {
      setLoading(true)
      const response = await studentClassApi.getClassDetail(Number(classId))
      if (response.success && response.data) {
        setClassDetail(response.data)
      }
    } catch (error) {
      console.error('Failed to load class detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChatSettings = async () => {
    try {
      const response = await classChatApi.getChatSettings(Number(classId))
      if (response.success) {
        setAllowStudentChat(response.data)
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error)
    }
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
      // Navigate to exam page using invite link
      window.location.href = inviteLink
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!classDetail) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <p className='text-gray-600 text-lg'>Không tìm thấy thông tin lớp học</p>
          <button
            onClick={() => navigate('/student/classes')}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Quay lại danh sách lớp
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/classes')}
          className='mb-5 flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors group text-sm'
        >
          <svg
            className='w-4 h-4 transform group-hover:-translate-x-1 transition-transform'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Quay lại danh sách lớp
        </button>

        {/* Class Info Card - Modern Design with Collapsible */}
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-100'>
          {/* Header with gradient - Clickable */}
          <button
            onClick={() => setShowClassInfo(!showClassInfo)}
            className='w-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white hover:from-blue-700 hover:to-purple-700 transition-all'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center'>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <div className='text-left'>
                  <h1 className='text-xl font-bold mb-1'>{classDetail.name}</h1>
                  <span className='inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium'>
                    {classDetail.classCode}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='text-xs font-medium'>Thông tin</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showClassInfo ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          </button>

          {/* Content - Collapsible */}
          {showClassInfo && (
            <div className='px-6 py-4 border-t border-gray-200'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-0.5'>Mô tả</p>
                    <p className='text-gray-900 font-medium text-sm'>{classDetail.description || 'Không có mô tả'}</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-0.5'>Giảng viên</p>
                    <p className='text-gray-900 font-medium text-sm'>{classDetail.teacherName}</p>
                    <p className='text-xs text-gray-600'>{classDetail.teacherEmail}</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-0.5'>Học kỳ</p>
                    <p className='text-gray-900 font-medium text-sm'>
                      Học kỳ {classDetail.semester} - {classDetail.academicYear}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-0.5'>Số sinh viên</p>
                    <p className='text-gray-900 font-medium text-base'>{classDetail.totalStudents}</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-pink-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-0.5'>Ngày tham gia</p>
                    <p className='text-gray-900 font-medium text-sm'>
                      {new Date(classDetail.enrolledAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs - Modern Design */}
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100'>
          <div className='border-b border-gray-200'>
            <div className='flex px-5'>
              <button
                onClick={() => setActiveTab('exams')}
                className={`relative px-5 py-3 font-medium transition-all text-sm ${
                  activeTab === 'exams' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'
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
                      activeTab === 'exams' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {classDetail.examSessions.length}
                  </span>
                </div>
                {activeTab === 'exams' && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600'></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`relative px-5 py-3 font-medium transition-all text-sm ${
                  activeTab === 'chat' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'
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
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600'></div>
                )}
              </button>
            </div>
          </div>

          {/* Exam Sessions Tab */}
          {activeTab === 'exams' && (
            <div className='p-5'>
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
                  <p className='text-gray-600 text-lg'>Chưa có bài thi nào được giao</p>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {classDetail.examSessions.map((exam) => {
                    const status = getExamStatus(exam.startAt, exam.expiredAt)
                    const canStart = new Date() >= new Date(exam.startAt) && new Date() <= new Date(exam.expiredAt)

                    return (
                      <div
                        key={exam.classExamSessionId}
                        className='border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:border-blue-300'
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
                          <p className='text-gray-700 mb-3 p-2.5 bg-gray-50 rounded-lg text-xs'>{exam.description}</p>
                        )}

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mb-3'>
                          <div className='p-2.5 bg-blue-50 rounded-lg'>
                            <p className='text-[10px] text-blue-600 mb-0.5'>Bắt đầu</p>
                            <p className='text-xs text-gray-900 font-semibold'>{formatDateTime(exam.startAt)}</p>
                          </div>
                          <div className='p-2.5 bg-red-50 rounded-lg'>
                            <p className='text-[10px] text-red-600 mb-0.5'>Kết thúc</p>
                            <p className='text-xs text-gray-900 font-semibold'>{formatDateTime(exam.expiredAt)}</p>
                          </div>
                          <div className='p-2.5 bg-green-50 rounded-lg'>
                            <p className='text-[10px] text-green-600 mb-0.5'>Thời lượng</p>
                            <p className='text-xs text-gray-900 font-semibold'>{exam.durationMinutes} phút</p>
                          </div>
                          <div className='p-2.5 bg-purple-50 rounded-lg'>
                            <p className='text-[10px] text-purple-600 mb-0.5'>Ngày giao</p>
                            <p className='text-xs text-gray-900 font-semibold'>
                              {new Date(exam.assignedAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {canStart && exam.inviteLink && (
                          <div className='flex gap-2 pt-3 border-t border-gray-200'>
                            <button
                              onClick={() => handleStartExam(exam.inviteLink)}
                              className='flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-1.5 text-sm'
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
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className='p-5'>
              <ChatBox
                classId={Number(classId)}
                userRole='STUDENT'
                userId={getUserIdFromToken()}
                allowStudentChat={allowStudentChat}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassDetailPage
