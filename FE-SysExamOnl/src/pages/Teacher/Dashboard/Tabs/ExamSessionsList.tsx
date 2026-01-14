// src/pages/teacher/ExamSessionsList.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'
import { ArrowLeft } from 'lucide-react'
import Pagination from '../../../../components/Common/Pagination'

interface ExamSession {
  id: string | number
  code: string
  inviteLink: string
  name: string
  owner: string
  start: string
}

export default function ExamSessionsList() {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Lấy examId từ URL params hoặc location.state
  const examId = searchParams.get('examId') || location.state?.examId || null

  // pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 8
  const totalPages = Math.ceil(sessions.length / itemsPerPage)
  const currentList = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      try {
        // Nếu có examId thì lọc theo examId, không thì lấy tất cả
        const params = examId ? { examId } : {}
        const res = await axiosClient.get('/teacher/exam-sessions/search', {
          params
        })

        const listUsers = Array.isArray(res.data.items)
          ? res.data.items.map((item: any) => ({
              id: item.examSessionId ?? '',
              code: item.code ?? '',
              inviteLink: item.inviteLink ?? item.invitelink ?? '',
              name: item.name ?? '',
              owner: item.ownerName ?? '',
              start: item.startAt ?? ''
            }))
          : []

        setSessions(listUsers)
        console.log('Danh sách phiên thi:', listUsers)
      } catch (err: any) {
        toast.error('Không tải được danh sách phiên thi')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [examId])

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className='space-y-0'>
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='flex items-center gap-4 mb-6'>
          <button onClick={() => navigate(-1)} className='p-2 hover:bg-gray-100 rounded-lg transition'>
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>
              {examId ? `Các phiên thi đã giao (Đề : ${examId})` : 'Tất cả phiên thi'}
            </h1>
            <p className='text-sm text-gray-500'>
              Tổng: <strong>{sessions.length}</strong> phiên
            </p>
          </div>
        </div>

        {loading ? (
          <div className='text-center py-12'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <p className='mt-2 text-gray-600'>Đang tải phiên thi...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className='text-center py-12 bg-gray-50 rounded-xl'>
            <div className='text-6xl mb-4'>📝</div>
            <p className='text-gray-500'>
              {examId ? 'Đề này chưa được giao cho bất kỳ phiên nào.' : 'Chưa có phiên thi nào trong hệ thống.'}
            </p>
          </div>
        ) : (
          <div className='grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]'>
            {currentList.map((session) => (
              <div
                key={session.id}
                className='bg-white border rounded-xl shadow-sm hover:shadow-md transition-all p-2 cursor-pointer'
                onClick={() =>
                  navigate('/teacher/exam-sessions/detail', {
                    state: { examSessionId: session.id }
                  })
                }
              >
                <div className='flex justify-between items-start mb-2'>
                  <h3 className='font-semibold text-blue-700 text-sm line-clamp-1'>
                    {session.name || 'Phiên không tên'}
                  </h3>
                  <span className='text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>{session.code}</span>
                </div>

                <div className='space-y-1.5 text-xs text-gray-600'>
                  <p className='flex items-center gap-1.5'>
                    <span className='font-medium'>Chủ sở hữu:</span>
                    <span className='truncate'>{session.owner}</span>
                  </p>

                  <p className='flex items-center gap-1.5'>
                    <span className='font-medium'>Bắt đầu:</span>
                    <span>{formatDate(session.start)}</span>
                  </p>

                  <p className='flex items-center gap-1.5'>
                    <span className='font-medium'>Link:</span>
                    <a
                      href={session.inviteLink}
                      target='_blank'
                      rel='noreferrer'
                      className='text-blue-600 hover:underline text-[10px] truncate block'
                    >
                      {session.inviteLink || 'Không có'}
                    </a>
                  </p>
                </div>

                <div className='mt-3 flex flex-col gap-1.5'>
                  <div className='flex gap-1.5'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(session.inviteLink)
                        toast.success('Đã copy link!')
                      }}
                      className='flex-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1.5 rounded hover:bg-blue-100 transition'
                    >
                      Copy Link
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(session.code)
                        toast.success('Đã copy mã!')
                      }}
                      className='flex-1 text-[10px] bg-gray-50 text-gray-700 px-2 py-1.5 rounded hover:bg-gray-100 transition'
                    >
                      Copy Mã
                    </button>
                  </div>

                  <div className='flex gap-1.5'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/teacher/monitoring/${session.id}`)
                      }}
                      className='flex-1 text-[10px] bg-green-50 text-green-700 px-2 py-1.5 rounded hover:bg-green-100 transition'
                    >
                      Quản lý
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/teacher/exam-sessions/${session.id}/results`)
                      }}
                      className='flex-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-1.5 rounded hover:bg-purple-100 transition'
                    >
                      Xem kết quả
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className='fixed bottom-0 left-0 w-full bg-white pt-4 pb-4 shadow-lg z-50'
        />
      </div>
    </div>
  )
}
