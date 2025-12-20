import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studentClassApi } from '../../../api/student-class-api'
import type { StudentClass, StudentClassDetail } from '../../../types/class.type'
import { ChatBox } from '../../../components/Chat'
import { classChatApi } from '../../../api/class-chat-api'
import ReactPaginate from 'react-paginate'
import { notification } from 'antd'

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
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinClassCode, setJoinClassCode] = useState('')
  const [joiningClass, setJoiningClass] = useState(false)

  // Exam pagination
  const [examPage, setExamPage] = useState(0)
  const examsPerPage = 10

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Loading classes for page", page)
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
  }, [page])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetail(selectedClassId)
      loadChatSettings(selectedClassId)
    }
  }, [selectedClassId])

  const loadClassDetail = async (classId: number) => {
    try {
      setLoadingDetail(true)
      const response = await studentClassApi.getClassDetail(classId)
      console.log("OKOK", response)
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


  const handleStartExam = (inviteLink: string) => {
    if (inviteLink) {
      window.location.href = inviteLink
    }
  }

  const handleJoinClass = async () => {
    if (!joinClassCode.trim()) {
      notification.warning({
        title: 'Cảnh báo',
        description: 'Vui lòng nhập mã lớp học'
      })
      return
    }

    setJoiningClass(true)
    try {
      const response = await studentClassApi.joinClassByCode(joinClassCode.trim())
      if (response.success) {
        notification.success({
          title: 'Thành công',
          description: 'Tham gia lớp học thành công!'
        })
        setShowJoinModal(false)
        setJoinClassCode('')
        loadClasses() // Reload the class list
      }
    } catch (error: unknown) {
      console.error('Failed to join class:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể tham gia lớp học'
      notification.error({
        title: 'Lỗi',
        description: errorMessage
      })
    } finally {
      setJoiningClass(false)
    }
  }



  return (
    <div className='h-screen flex overflow-hidden bg-gray-50'>
      {/* Left Sidebar - Class List (Messenger Style) */}
      <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
        {/* Header */}
        <div className='px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'>
          <div className='flex items-center justify-between mb-2'>
            <h1 className='text-xl font-bold text-white'>Lớp học của tôi</h1>
            <button
              onClick={() => setShowJoinModal(true)}
              className='px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-1.5'
              title='Tham gia lớp học'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Tham gia
            </button>
          </div>
          <p className='text-blue-100 text-xs'>{classes.length} lớp học</p>
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
                                const canStart = isActive && exam.inviteLink

                                return (
                                  <tr key={exam.classExamSessionId} className='hover:bg-gray-50 transition-colors'>
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
                                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap'>
                                          Sắp diễn ra
                                        </span>
                                      )}
                                      {isExpired && (
                                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 whitespace-nowrap'>
                                          Đã kết thúc
                                        </span>
                                      )}
                                    </td>
                                    <td className='px-4 py-3 w-1/8 text-center'>
                                      {canStart && (
                                        <button
                                          onClick={() => handleStartExam(exam.inviteLink)}
                                          className='inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all shadow-sm hover:shadow text-xs gap-1 whitespace-nowrap'
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
                                              d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
                                            />
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={2}
                                              d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                            />
                                          </svg>
                                          Bắt đầu
                                        </button>
                                      )}
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

      {/* Join Class Modal */}
      {showJoinModal && (
<div className='fixed inset-0 bg-white/10 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden'>
            {/* Header */}
            <div className='px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-bold text-white'>Tham gia lớp học</h2>
                <button
                  onClick={() => {
                    setShowJoinModal(false)
                    setJoinClassCode('')
                  }}
                  className='text-white hover:bg-white/20 rounded-lg p-1 transition-colors'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className='p-6'>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Mã lớp học</label>
                <input
                  type='text'
                  value={joinClassCode}
                  onChange={(e) => setJoinClassCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                  placeholder='Nhập mã lớp học (vd: CS101)'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold text-lg uppercase'
                  disabled={joiningClass}
                />
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                <div className='flex items-start gap-2'>
                  <svg
                    className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <div className='text-sm text-blue-800'>
                    <p className='font-medium mb-1'>Lưu ý:</p>
                    <ul className='list-disc list-inside space-y-1'>
                      <li>Nhập mã lớp học được cung cấp bởi giảng viên</li>
                      <li>Mã lớp học phân biệt chữ hoa chữ thường</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={() => {
                    setShowJoinModal(false)
                    setJoinClassCode('')
                  }}
                  className='flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors'
                  disabled={joiningClass}
                >
                  Hủy
                </button>
                <button
                  onClick={handleJoinClass}
                  disabled={joiningClass || !joinClassCode.trim()}
                  className='flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {joiningClass ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      <span>Đang tham gia...</span>
                    </>
                  ) : (
                    <>
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      <span>Tham gia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassListPage
