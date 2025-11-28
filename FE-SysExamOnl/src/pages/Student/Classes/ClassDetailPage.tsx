import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentClassApi } from '../../../api/student-class-api'
import { StudentClassDetail } from '../../../types/class.type'

const ClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [classDetail, setClassDetail] = useState<StudentClassDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (classId) {
      loadClassDetail()
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
    <div className='p-6'>
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/classes')}
        className='mb-4 flex items-center text-blue-600 hover:text-blue-700'
      >
        <span className='mr-2'>←</span>
        Quay lại danh sách lớp
      </button>

      {/* Class Info Card */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <div className='border-b border-gray-200 pb-4 mb-4'>
          <h1 className='text-3xl font-bold text-gray-900'>{classDetail.name}</h1>
          <p className='text-gray-600 mt-1'>{classDetail.classCode}</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-500'>Mô tả</p>
            <p className='text-gray-900'>{classDetail.description || 'Không có mô tả'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Giảng viên</p>
            <p className='text-gray-900'>{classDetail.teacherName}</p>
            <p className='text-sm text-gray-600'>{classDetail.teacherEmail}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Học kỳ</p>
            <p className='text-gray-900'>
              Học kỳ {classDetail.semester} - {classDetail.academicYear}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Số sinh viên</p>
            <p className='text-gray-900'>{classDetail.totalStudents} sinh viên</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Ngày tham gia</p>
            <p className='text-gray-900'>{new Date(classDetail.enrolledAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Exam Sessions */}
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>Bài thi ({classDetail.examSessions.length})</h2>

        {classDetail.examSessions.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-gray-600'>Chưa có bài thi nào được giao</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {classDetail.examSessions.map((exam) => {
              const status = getExamStatus(exam.startAt, exam.expiredAt)
              const canStart = new Date() >= new Date(exam.startAt) && new Date() <= new Date(exam.expiredAt)

              return (
                <div
                  key={exam.classExamSessionId}
                  className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>{exam.examSessionName}</h3>
                      <p className='text-sm text-gray-600'>{exam.examSessionCode}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.text}</span>
                  </div>

                  <p className='text-gray-700 mb-3'>{exam.description || 'Không có mô tả'}</p>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                    <div>
                      <span className='text-gray-500'>Thời gian bắt đầu:</span>
                      <p className='text-gray-900 font-medium'>{formatDateTime(exam.startAt)}</p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Thời gian kết thúc:</span>
                      <p className='text-gray-900 font-medium'>{formatDateTime(exam.expiredAt)}</p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Thời lượng:</span>
                      <p className='text-gray-900 font-medium'>{exam.durationMinutes} phút</p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Ngày giao:</span>
                      <p className='text-gray-900 font-medium'>
                        {new Date(exam.assignedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {canStart && exam.inviteLink && (
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                      <button
                        onClick={() => handleStartExam(exam.inviteLink)}
                        className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium'
                      >
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
    </div>
  )
}

export default ClassDetailPage
