import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomeTab() {
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Quản lý Đề Thi
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/teacher/exams/create')}
            className="
              px-8 py-6 
              bg-blue-600 text-white font-bold rounded-xl 
              shadow-md 
              transition-all duration-300 ease-out
              hover:shadow-xl hover:-translate-y-1 hover:scale-105
              active:scale-95 active:translate-y-0
              flex items-center justify-center gap-2
            "
          >
            + Tạo đề thi mới
          </button>

          <button
            onClick={() => navigate('/teacher/questions')}
            className="
              px-8 py-6 
              bg-green-600 text-white font-bold rounded-xl 
              shadow-md 
              transition-all duration-300 ease-out
              hover:shadow-xl hover:-translate-y-1 hover:scale-105
              active:scale-95 active:translate-y-0
              flex items-center justify-center gap-2
            "
          >
            + Tạo từ ngân hàng câu hỏi
          </button>
        </div>
      </div>
    </div>
  )
}