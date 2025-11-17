// src/components/teacher/HomeTab.tsx
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpenText, Upload, Sparkles } from 'lucide-react'

export default function HomeTab() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* Chào mừng – nhỏ gọn hơn */}
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          <Sparkles className="inline-block w-6 h-6 text-indigo-600 mr-2 -mt-1" />
          Chào mừng bạn trở lại!
        </h1>
        <p className="text-gray-600">Sẵn sàng tạo đề thi mới chưa nào?</p>
      </div>

      {/* 2 nút hành động chính – dạng card nhỏ gọn, ngang nhau */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Tạo đề mới */}
        <button
          onClick={() => navigate('/teacher/exams/create')}
          className="group flex items-center gap-5 bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all hover:border-blue-400 hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition">
            <Plus className="w-7 h-7 text-blue-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Tạo đề thi mới</h3>
            <p className="text-sm text-gray-500 mt-0.5">Soạn từ đầu, đầy đủ dạng câu</p>
          </div>
        </button>

        {/* Từ ngân hàng câu hỏi */}
        <button
          onClick={() => navigate('/teacher/questions')}
          className="group flex items-center gap-5 bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all hover:border-green-400 hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition">
            <BookOpenText className="w-7 h-7 text-green-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Dùng ngân hàng câu hỏi</h3>
            <p className="text-sm text-gray-500 mt-0.5">Hàng nghìn câu sẵn có, lọc nhanh</p>
          </div>
        </button>
      </div>

      {/* Import Excel – dạng banner nhỏ gọn */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Upload className="w-9 h-9 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Có đề cũ rồi à?</p>
              <p className="text-sm text-gray-600">Import Excel chỉ mất vài giây</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md whitespace-nowrap">
            Tải mẫu Excel
          </button>
        </div>
      </div>

      {/* Footer siêu nhỏ */}
      <div className="text-center text-xs text-gray-400 pt-8">
        © 2025 Exam System – Dành riêng cho giáo viên Việt Nam
      </div>
    </div>
  )
}