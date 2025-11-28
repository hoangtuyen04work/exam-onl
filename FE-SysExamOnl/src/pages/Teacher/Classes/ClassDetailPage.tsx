// src/pages/Teacher/Classes/ClassDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getClassDetail, removeStudentFromClass, removeExamSessionFromClass } from '../../../api/class-api'
import type { ClassDetailResponse } from '../../../types/class.type'
import AddStudentsModal from './AddStudentsModal'
import AssignExamsModal from './AssignExamsModal'

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [classDetail, setClassDetail] = useState<ClassDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false)
  const [showAssignExamsModal, setShowAssignExamsModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'students' | 'exams'>('students')

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

  useEffect(() => {
    fetchClassDetail()
  }, [fetchClassDetail])

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
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-6'>
        <Link to='/teacher/classes' className='text-blue-600 hover:underline mb-4 inline-block'>
          ← Quay lại danh sách
        </Link>
        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-3xl font-bold'>{classDetail.name}</h1>
                <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold'>
                  {classDetail.classCode}
                </span>
                {!classDetail.isActive && (
                  <span className='px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold'>
                    Không hoạt động
                  </span>
                )}
              </div>
              {classDetail.description && <p className='text-gray-600 mb-3'>{classDetail.description}</p>}
              <div className='flex gap-4 text-sm text-gray-500 mb-2'>
                <span>📚 {classDetail.semester}</span>
                <span>🎓 {classDetail.academicYear}</span>
                <span>👨‍🏫 {classDetail.teacherName}</span>
              </div>
              <div className='flex gap-4 text-sm text-gray-500'>
                <span>👥 {classDetail.students.length} học sinh</span>
                <span>📝 {classDetail.examSessions.length} bài thi</span>
                <span>📅 Tạo: {new Date(classDetail.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <Link
              to={`/teacher/classes/${classId}/edit`}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition'
            >
              ✏️ Chỉnh sửa
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='mb-4 border-b border-gray-200'>
        <div className='flex gap-4'>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-2 px-4 ${
              activeTab === 'students'
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Học sinh ({classDetail.students.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`pb-2 px-4 ${
              activeTab === 'exams'
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Bài thi ({classDetail.examSessions.length})
          </button>
        </div>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className='bg-white rounded-lg shadow-md p-6 min-h-[500px]'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Danh sách học sinh</h2>
            <button
              onClick={() => setShowAddStudentsModal(true)}
              className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition'
            >
              + Thêm học sinh
            </button>
          </div>

          {classDetail.students.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>Chưa có học sinh nào</div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>STT</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Username</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Họ tên</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Email</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Ngày tham gia</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Trạng thái</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Thao tác</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {classDetail.students.map((student, index) => (
                    <tr key={student.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-3 text-sm'>{index + 1}</td>
                      <td className='px-4 py-3 text-sm font-medium'>{student.username}</td>
                      <td className='px-4 py-3 text-sm'>{`${student.firstName} ${student.lastName}`}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{student.email}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>
                        {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {student.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        <button
                          onClick={() => handleRemoveStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          className='text-red-600 hover:text-red-800'
                        >
                          Xóa
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
        <div className='bg-white rounded-lg shadow-md p-6 min-h-[500px]'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Danh sách bài thi</h2>
            <button
              onClick={() => setShowAssignExamsModal(true)}
              className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold'
            >
              🎓 Giao đề thi
            </button>
          </div>

          {classDetail.examSessions.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>Chưa có bài thi nào</div>
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

                let statusColor = 'bg-green-100 text-green-800'
                let statusText = 'Đang diễn ra'
                if (status === 'UPCOMING') {
                  statusColor = 'bg-blue-100 text-blue-800'
                  statusText = 'Sắp diễn ra'
                } else if (status === 'EXPIRED') {
                  statusColor = 'bg-gray-100 text-gray-800'
                  statusText = 'Đã kết thúc'
                }

                return (
                  <div key={session.id} className='border rounded-lg p-4 hover:shadow-md transition'>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-lg'>{session.examSessionName}</h3>
                        <p className='text-xs text-gray-500 mt-1'>Mã: {session.examSessionCode}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveExamSession(session.id, session.examSessionName)}
                        className='text-red-600 hover:text-red-800 text-sm ml-2'
                      >
                        🗑️
                      </button>
                    </div>
                    {session.description && <p className='text-sm text-gray-600 mb-2'>📝 {session.description}</p>}
                    <div className='text-sm text-gray-600 space-y-1'>
                      <p>⏱️ Thời gian: {session.durationMinutes} phút</p>
                      <p>📅 Bắt đầu: {startAt.toLocaleString('vi-VN')}</p>
                      <p>🏁 Kết thúc: {expiredAt.toLocaleString('vi-VN')}</p>
                      <p>📌 Giao: {new Date(session.assignedAt).toLocaleString('vi-VN')}</p>
                      <p className='mt-2'>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                          {statusText}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
