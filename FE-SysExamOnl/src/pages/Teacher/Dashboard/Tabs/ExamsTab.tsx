import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../../../api/axiosClient'
import { toast } from 'react-toastify'

interface ExamItem {
  id: string | number
  name: string
  description: string
  totalPoint: string
  numberQuestions: number
  startTime: string
  endTime: string
  durationMinutes: number
}

export default function ExamsTab() {
  const [list, setList] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('Vui lòng đăng nhập.')
      navigate('/role-select')
      return
    }

    const fetchExams = async () => {
      setLoading(true)
      try {
        const res = await axiosClient.get('/teacher/exams', {
          params: { page: 0, size: 20 }
        })

        console.log('Fetched exams:', res.data)

        // ✅ Map dữ liệu chuẩn, đảm bảo có id
        const items = Array.isArray(res.data.items)
          ? res.data.items.map((item: any) => ({
              id: item.id ?? item.examId ?? item.examID ?? item.uuid ?? '', // 👈 đảm bảo không undefined
              name: item.name ?? '',
              description: item.description ?? '',
              totalPoint: item.totalPoint ?? '',
              numberQuestions: item.numberQuestions ?? 0,
              startTime: item.startTime ?? '',
              endTime: item.endTime ?? '',
              durationMinutes: item.durationMinutes ?? 0
            }))
          : []

        setList(items)
      } catch (err: any) {
        toast.error('Không tải được danh sách đề thi')
        setList([])
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [navigate])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Danh sách đề thi</h2>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/teacher/exams/create')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition"
          >
            + Tạo đề thi
          </button>

          <button
            onClick={() => navigate('/teacher/questions')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition"
          >
            + Tạo từ ngân hàng
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic">
          Chưa có đề thi nào.
        </div>
      ) : (
        // ✅ Hiển thị kiểu tờ A4 mini
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {list.map((exam) => (
            <div
              key={exam.id}
              className="relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all p-4 flex flex-col justify-between"
              style={{ aspectRatio: '3/4', transform: 'scale(0.95)' }}
            >
              <div>
                <h3 className="text-base font-semibold text-blue-700 line-clamp-2">
                  {exam.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                  {exam.description || 'Không có mô tả.'}
                </p>

                <div className="text-[11px] text-gray-500 mt-2">
                  🧩 {exam.numberQuestions} câu — ⏱ {exam.durationMinutes} phút
                </div>
                <div className="text-[11px] text-gray-400">
                  📅 {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : '—'}
                </div>
              </div>

              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => {
                    if (!exam.id) {
                      toast.error('Không tìm thấy ID đề thi!')
                      return
                    }
                    navigate(`/teacher/exams/${exam.id}/edit`)
                  }}
                  className="text-blue-600 hover:underline text-xs font-medium"
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => toast.info('Tính năng giao đề sẽ cập nhật sau')}
                  className="text-gray-600 hover:underline text-xs"
                >
                  📤 Giao đề
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
