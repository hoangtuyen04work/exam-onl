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
  const [modalData, setModalData] = useState<{ link: string; code: string } | null>(null)
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
        const res = await axiosClient.get('/teacher/exams', { params: { page: 0, size: 20 } })
        const items = Array.isArray(res.data.items)
          ? res.data.items.map((item: any) => ({
              id: item.id ?? item.examId ?? item.examID ?? item.uuid ?? '',
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
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [navigate])

 
  const handleCreateSession = async (examId: number | string) => {
  try {
    const duration = 60 // phút
    const now = new Date()
    
    // Lấy offset timezone (VD: +7h = -420 phút)
    const timezoneOffsetMs = now.getTimezoneOffset() * 60000

    // Chuyển sang UTC đúng chuẩn
    const startAt = new Date(now.getTime() - timezoneOffsetMs)
    const expiredAt = new Date(startAt.getTime() + duration * 60 * 1000)

    const payload = {
      examId: Number(examId),
      name: 'Phiên thi tự động',
      description: 'Tạo từ giao diện giáo viên',
      durationMinutes: duration,
      startAt: startAt.toISOString(),
      expiredAt: expiredAt.toISOString()
    }

    const res = await axiosClient.post('/teacher/exam-sessions', payload)
    console.log('Exam session created:', res.data)

    if (res.data?.data) {
      const { inviteLink, code } = res.data.data
      setModalData({ link: inviteLink, code })
      toast.success('Tạo phiên thi thành công!')
    } else {
      toast.error('Không nhận được dữ liệu từ server!')
    }
  } catch (err) {
    toast.error('Không thể tạo phiên thi!')
  }
}

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
        <div className="text-center py-8 text-gray-500 italic">Chưa có đề thi nào.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {list.map((exam) => (
            <div
              key={exam.id}
              className="relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all p-4 flex flex-col justify-between"
              style={{ aspectRatio: '3/4', transform: 'scale(0.95)' }}
            >
              <div>
                <h3 className="text-base font-semibold text-blue-700 line-clamp-2">{exam.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                  {exam.description || 'Không có mô tả.'}
                </p>

                <div className="text-[11px] text-gray-500 mt-2">
                  🧩 {exam.numberQuestions} câu — ⏱ {exam.durationMinutes} phút
                </div>
                <div className="text-[11px] text-gray-400">
                  📅{' '}
                  {exam.startTime
                    ? new Date(exam.startTime).toLocaleString('vi-VN')
                    : '—'}
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
                  onClick={() => handleCreateSession(exam.id)}
                  className="text-gray-600 hover:underline text-xs"
                >
                  📤 Giao đề
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Popup hiển thị link + code */}
      {modalData && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm">
    <div className="bg-white/80 border border-gray-200 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-[380px] text-center animate-fadeIn">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🎉 Phiên thi được tạo thành công!
      </h3>

      <div className="text-left bg-white/60 rounded-lg p-3 shadow-inner">
        <p className="text-sm text-gray-700 break-words">
          <strong>🔗 Link:</strong>{' '}
          <a
            href={modalData.link}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            {modalData.link}
          </a>
        </p>

        <p className="text-sm mt-3 text-gray-700">
          <strong>🧾 Mã tham gia:</strong>{' '}
          <span className="font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">
            {modalData.code}
          </span>
        </p>
      </div>

      <button
        onClick={() => setModalData(null)}
        className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-all"
      >
        Đóng
      </button>
    </div>
  </div>
)}

    </div>
  )
}
