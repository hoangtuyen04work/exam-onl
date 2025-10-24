/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { fetchExams } from '../../../api/mock-api'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.auth.user)

  useEffect(() => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập trước!')
      navigate('/login')
    }
  }, [user, navigate])

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams
  })

  const handleStartExam = (examId: any) => {
    navigate(`/exam/${examId}`)
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-6 py-10 max-w-6xl'>
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Thông tin thí sinh */}
          <div className='bg-white border border-gray-200 rounded-xl shadow-md'>
            <div className='bg-blue-50 border-b border-gray-200 px-5 py-3 font-semibold text-blue-700'>
              THÔNG TIN THÍ SINH
            </div>
            <div className='p-6 space-y-3 text-sm'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-gray-500'>Họ và tên:</p>
                  <p className='font-semibold'>{user?.name}</p>
                </div>
                <div>
                  <p className='text-gray-500'>Mã thí sinh:</p>
                  <p className='font-semibold'>{user?.studentId}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-gray-500'>Ngày sinh:</p>
                  <p className='font-semibold'>{user?.dob}</p>
                </div>
                <div>
                  <p className='text-gray-500'>Giới tính:</p>
                  <p className='font-semibold'>{user?.gender}</p>
                </div>
              </div>

              <div>
                <p className='text-gray-500'>Phòng thi:</p>
                <p className='font-semibold'>{user?.room}</p>
              </div>
            </div>
          </div>

          {/* Hội đồng thi */}
          <div className='bg-white border border-gray-200 rounded-xl shadow-md'>
            <div className='bg-blue-50 border-b border-gray-200 px-5 py-3 font-semibold text-blue-700'>
              HỘI ĐỒNG THI
            </div>
            <div className='p-6 text-sm space-y-3'>
              <div>
                <p className='text-gray-500'>Hội đồng:</p>
                <p className='font-semibold'>{user?.examCenter}</p>
              </div>
              <div>
                <p className='text-gray-500'>Phòng thi:</p>
                <p className='font-semibold'>{user?.room}</p>
              </div>
              <div>
                <p className='text-gray-500'>Kỳ thi:</p>
                <p className='font-semibold'>{user?.examSession}</p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-xl shadow-md mt-8'>
          <div className='bg-blue-50 border-b border-gray-200 px-5 py-3 font-semibold text-blue-700'>
            DANH SÁCH MÔN THI
          </div>
          <div className='p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {exams?.map((exam: any) => (
              <div
                key={exam.id}
                className='p-4 border border-gray-300 rounded-lg hover:bg-blue-50 transition flex justify-between items-center'
              >
                <span className='font-medium'>{exam.name}</span>
                <button
                  onClick={() => handleStartExam(exam.id)}
                  className='bg-[#0056a4] text-white px-3 py-1.5 rounded hover:bg-[#0461b9]'
                >
                  Vào thi
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
