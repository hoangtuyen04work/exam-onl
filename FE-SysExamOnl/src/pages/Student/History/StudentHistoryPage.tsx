/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchCompletedExams } from '../../../api/student-api'
import { toLocalStringISO } from '../../../utils/utils'
import type { CompletedExam } from '../../../types/user.type'

export default function StudentHistoryPage() {
  const navigate = useNavigate()
  const [currentPage] = useState(0)
  const pageSize = 10000

  const {
    data: completedExamsResponse = { items: [], page: 0, size: pageSize, total: 0, totalPages: 0 },
    isLoading: isLoadingCompletedExams,
    isError: isErrorCompletedExams,
    error
  } = useQuery({
    queryKey: ['completedExams', currentPage],
    queryFn: () => fetchCompletedExams(currentPage, pageSize),
    staleTime: 1000 * 60 * 5,
    select: (data) => ({
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            examSessionId: item.examSessionId,
            examSessionName: item.examSessionName || 'N/A',
            submittedAt: item.submittedAt,
            totalScore: item.totalScore ?? 0,
            status: 'COMPLETED' as const
          }))
        : []
    })
  })

  const completedExams: CompletedExam[] = completedExamsResponse.items

  const handleViewResult = (examSessionId: number) => {
    navigate(`/student/exam/${examSessionId}/result`)
  }

  if (isLoadingCompletedExams) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
        <span className='ml-3 text-slate-600'>Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className='p-10'>
      <h2 className='text-2xl font-bold mb-6 text-slate-800'>Lịch sử làm bài</h2>

      {isErrorCompletedExams && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
          <p className='font-medium'>Lỗi khi tải lịch sử</p>
          <p className='text-sm mt-1'>{(error as Error)?.message || 'Vui lòng thử lại sau.'}</p>
        </div>
      )}

      {completedExams.length === 0 ? (
        <div className='text-center py-16'>
          <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center'>
            <i className='fas fa-clipboard-list text-4xl text-slate-300'></i>
          </div>
          <p className='text-slate-600 text-lg'>Chưa có bài thi nào được hoàn thành</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className='hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden'>
            <table className='w-full text-left'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='p-5 font-bold text-slate-600 text-sm'>Bài kiểm tra</th>
                  <th className='p-5 font-bold text-slate-600 text-sm'>Ngày nộp</th>
                  <th className='p-5 font-bold text-slate-600 text-sm text-center'>Kết quả</th>
                  <th className='p-5 font-bold text-slate-600 text-sm text-right'>Chi tiết</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {completedExams.map((exam) => (
                  <tr key={exam.examSessionId} className='hover:bg-slate-50 transition'>
                    <td className='p-5 font-bold text-slate-700'>{exam.examSessionName}</td>
                    <td className='p-5 text-slate-500 text-sm'>{toLocalStringISO(exam.submittedAt)}</td>
                    <td className='p-5 text-center'>
                      <span
                        className={`px-4 py-1.5 rounded-full font-black text-sm border shadow-sm inline-block ${
                          exam.totalScore >= 8
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : exam.totalScore >= 5
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {exam.totalScore.toFixed(1)}
                      </span>
                    </td>
                    <td className='p-5 text-right'>
                      <button
                        onClick={() => handleViewResult(exam.examSessionId)}
                        className='text-blue-600 font-bold hover:underline'
                      >
                        Xem bài làm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className='md:hidden space-y-3'>
            {completedExams.map((exam) => (
              <div
                key={exam.examSessionId}
                className='bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative'
              >
                {/* Score Badge */}
                <div className='absolute top-4 right-4'>
                  <span
                    className={`px-3 py-1 rounded-full font-black text-sm ${
                      exam.totalScore >= 8
                        ? 'bg-red-100 text-red-600'
                        : exam.totalScore >= 5
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {exam.totalScore.toFixed(1)}
                  </span>
                </div>

                {/* Exam Name */}
                <h3 className='font-bold text-slate-800 text-base mb-2 pr-16'>{exam.examSessionName}</h3>

                {/* Date with Calendar Icon */}
                <div className='flex items-center text-slate-500 text-sm mb-3'>
                  <i className='far fa-calendar-alt mr-2 text-blue-500'></i>
                  <span>{toLocalStringISO(exam.submittedAt)}</span>
                </div>

                {/* View Result Button */}
                <button
                  onClick={() => handleViewResult(exam.examSessionId)}
                  className='text-blue-600 font-semibold text-sm hover:underline flex items-center'
                >
                  Xem bài làm →
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
