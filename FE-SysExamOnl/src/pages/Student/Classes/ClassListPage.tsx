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
  const [activeTab, setActiveTab] = useState<'exams' | 'chat'>('chat')
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
      console.log('Loading classes for page', page)
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
      console.log('OKOK', response)
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

  const handleClassClick = (classId: number, tab: 'exams' | 'chat' = 'chat') => {
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
    <div className='flex h-full'>
      {/* SUB-SIDEBAR - Danh sách lớp học */}
      <aside className='w-72 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 z-10'>
        <div className='p-6 border-b border-slate-200 bg-white'>
          <div className='flex items-center justify-between mb-2'>
            <h2 className='text-lg font-bold text-slate-800'>Lớp học của tôi</h2>
            <button
              onClick={() => setShowJoinModal(true)}
              className='text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors'
              title='Tham gia lớp học mới'
            >
              <i className='fas fa-plus text-sm'></i>
            </button>
          </div>
          <p className='text-xs text-slate-500'>Bạn có {classes.length} lớp học đang tham gia</p>
        </div>

        <div className='flex-1 overflow-y-auto p-3 space-y-2'>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600'></div>
            </div>
          ) : classes.length === 0 ? (
            <div className='text-center py-16 px-4'>
              <div className='text-gray-400 text-4xl mb-3'>📚</div>
              <p className='text-gray-600 text-sm'>Chưa có lớp học nào</p>
              <button
                onClick={() => setShowJoinModal(true)}
                className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors'
              >
                Tham gia lớp học
              </button>
            </div>
          ) : (
            <>
              {classes.map((classItem) => (
                <div
                  key={classItem.classId}
                  onClick={() => handleClassClick(classItem.classId, 'chat')}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    selectedClassId === classItem.classId
                      ? 'bg-white shadow-md border-l-4 border-blue-600'
                      : 'hover:bg-white/50 border-transparent'
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0'>
                      {classItem.name.charAt(0).toUpperCase()}
                    </div>
                    <div className='flex-1 overflow-hidden'>
                      <p className='text-sm font-bold text-slate-700 truncate'>{classItem.name}</p>
                      <p className='text-[11px] text-green-500 font-medium'>● Đang hoạt động</p>
                    </div>
                    {classItem.totalExamSessions > 0 && (
                      <span className='px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium'>
                        {classItem.totalExamSessions}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
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

      {/* MAIN CONTENT AREA - Chat hoặc Exams */}
      <div className='flex-1 flex flex-col h-full bg-slate-50'>
        {!selectedClassId ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center'>
              <div className='w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-xl flex items-center justify-center'>
                <i className='fas fa-comments text-5xl text-slate-300'></i>
              </div>
              <h2 className='text-2xl font-bold text-slate-700 mb-2'>Chọn một lớp học</h2>
              <p className='text-slate-500'>Chọn lớp học từ danh sách bên trái để xem chi tiết và trao đổi</p>
            </div>
          </div>
        ) : loadingDetail ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : !classDetail ? (
          <div className='flex-1 flex items-center justify-center'>
            <p className='text-slate-600'>Không tìm thấy thông tin lớp học</p>
          </div>
        ) : (
          <>
            {/* Header của Chat/Class Detail */}
            <div className='bg-white p-4 border-b border-slate-200 flex justify-between items-center px-8 shadow-sm'>
              <div className='flex items-center space-x-4'>
                <div className='w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-blue-600'>
                  <i className='fas fa-comments text-xl'></i>
                </div>
                <div>
                  <h3 className='font-bold text-slate-800'>{classDetail.name}</h3>
                  <p className='text-xs text-green-500 font-bold'>Giáo viên đang Online</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab(activeTab === 'chat' ? 'exams' : 'chat')}
                className='text-blue-600 text-sm font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2'
              >
                <i className={`fas ${activeTab === 'chat' ? 'fa-file-alt' : 'fa-comments'}`}></i>
                {activeTab === 'chat' ? 'Tài liệu lớp học' : 'Trở về chat'}
              </button>
            </div>

            {/* Nội dung */}
            {activeTab === 'chat' ? (
              <div className='flex-1 flex flex-col overflow-hidden'>
                {/* Chat Messages Area */}
                <div className='flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50'>
                  <ChatBox
                    classId={selectedClassId}
                    userRole='STUDENT'
                    userId={getUserIdFromToken()}
                    allowStudentChat={allowStudentChat}
                  />
                </div>
              </div>
            ) : (
              <div className='flex-1 overflow-y-auto p-8'>
                <h2 className='text-2xl font-bold mb-6 text-slate-800'>Danh sách bài thi</h2>
                {classDetail.examSessions.length === 0 ? (
                  <div className='text-center py-16'>
                    <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center'>
                      <i className='fas fa-clipboard-list text-4xl text-slate-300'></i>
                    </div>
                    <p className='text-slate-600 text-lg'>Chưa có bài thi nào</p>
                  </div>
                ) : (
                  <div className='bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden'>
                    <table className='w-full text-left'>
                      <thead className='bg-slate-50 border-b border-slate-200'>
                        <tr>
                          <th className='p-5 font-bold text-slate-600 text-sm'>Bài kiểm tra</th>
                          <th className='p-5 font-bold text-slate-600 text-sm'>Thời gian</th>
                          <th className='p-5 font-bold text-slate-600 text-sm text-center'>Trạng thái</th>
                          <th className='p-5 font-bold text-slate-600 text-sm text-right'>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100'>
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
                              <tr key={exam.classExamSessionId} className='hover:bg-slate-50 transition'>
                                <td className='p-5'>
                                  <div className='font-bold text-slate-700'>{exam.examSessionName}</div>
                                  {exam.description && (
                                    <div className='text-xs text-slate-500 mt-1'>{exam.description}</div>
                                  )}
                                </td>
                                <td className='p-5'>
                                  <div className='text-slate-500 text-sm'>
                                    {new Date(exam.startAt).toLocaleDateString('vi-VN')}
                                  </div>
                                  <div className='text-xs text-slate-400'>
                                    {new Date(exam.startAt).toLocaleTimeString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}{' '}
                                    -{' '}
                                    {new Date(exam.expiredAt).toLocaleTimeString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className='p-5 text-center'>
                                  {isActive && (
                                    <span className='bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-bold text-sm border border-green-200 shadow-sm inline-flex items-center gap-1'>
                                      <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
                                      Đang diễn ra
                                    </span>
                                  )}
                                  {isUpcoming && (
                                    <span className='bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm border border-blue-200 shadow-sm'>
                                      Sắp diễn ra
                                    </span>
                                  )}
                                  {isExpired && (
                                    <span className='bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full font-bold text-sm border border-gray-200 shadow-sm'>
                                      Đã kết thúc
                                    </span>
                                  )}
                                </td>
                                <td className='p-5 text-right'>
                                  {canStart && (
                                    <button
                                      onClick={() => handleStartExam(exam.inviteLink)}
                                      className='text-blue-600 font-bold hover:underline'
                                    >
                                      Bắt đầu làm bài
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {classDetail.examSessions.length > examsPerPage && (
                      <div className='px-4 py-3 border-t border-slate-200 bg-slate-50'>
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
                          pageLinkClassName='px-3 py-1.5 text-sm text-slate-700 hover:bg-blue-50 rounded-lg transition-colors'
                          previousClassName=''
                          previousLinkClassName='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium'
                          nextClassName=''
                          nextLinkClassName='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium'
                          breakClassName=''
                          breakLinkClassName='px-3 py-1.5 text-sm text-slate-500'
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
          </>
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
