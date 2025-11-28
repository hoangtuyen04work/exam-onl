import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentClassApi } from '../../../api/student-class-api'
import { StudentClass } from '../../../types/class.type'

const ClassListPage = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadClasses()
  }, [page])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const response = await studentClassApi.getMyClasses(page, 12)
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

  const handleClassClick = (classId: number) => {
    navigate(`/student/classes/${classId}`)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Lớp học của tôi</h1>
        <p className='text-gray-600 mt-2'>Danh sách các lớp học mà bạn đang tham gia</p>
      </div>

      {classes.length === 0 ? (
        <div className='text-center py-12'>
          <div className='text-gray-400 text-6xl mb-4'>📚</div>
          <p className='text-gray-600 text-lg'>Bạn chưa tham gia lớp học nào</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {classes.map((classItem) => (
              <div
                key={classItem.classId}
                onClick={() => handleClassClick(classItem.classId)}
                className='bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer border border-gray-200 overflow-hidden'
              >
                <div className='bg-gradient-to-r from-blue-500 to-blue-600 p-4'>
                  <h3 className='text-xl font-bold text-white truncate'>{classItem.name}</h3>
                  <p className='text-blue-100 text-sm mt-1'>{classItem.classCode}</p>
                </div>

                <div className='p-4'>
                  <div className='mb-3'>
                    <p className='text-gray-700 line-clamp-2 min-h-[48px]'>
                      {classItem.description || 'Không có mô tả'}
                    </p>
                  </div>

                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center text-gray-600'>
                      <span className='w-5 mr-2'>👨‍🏫</span>
                      <span className='truncate'>{classItem.teacherName}</span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <span className='w-5 mr-2'>📅</span>
                      <span>
                        Học kỳ {classItem.semester} - {classItem.academicYear}
                      </span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <span className='w-5 mr-2'>👥</span>
                      <span>{classItem.totalStudents} sinh viên</span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <span className='w-5 mr-2'>📝</span>
                      <span>{classItem.totalExamSessions} bài thi</span>
                    </div>
                  </div>

                  <div className='mt-4 pt-3 border-t border-gray-200'>
                    <p className='text-xs text-gray-500'>
                      Tham gia: {new Date(classItem.enrolledAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className='mt-8 flex justify-center items-center gap-2'>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className='px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Trước
              </button>
              <span className='text-gray-600'>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className='px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ClassListPage
