import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { mockExams } from '../../../data/mockData'
import { Trash2, Edit, Eye, Plus } from 'lucide-react'
import { toast } from 'react-toastify'

export default function ExamList() {
  const navigate = useNavigate()
  const [exams, setExams] = useState(mockExams)

  const handleDelete = (examId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đề thi này?')) {
      setExams(exams.filter(exam => exam.id !== examId))
      toast.success('Đã xóa đề thi')
    }
  }

  const handleTogglePublish = (examId: string) => {
    setExams(exams.map(exam => 
      exam.id === examId 
        ? { ...exam, published: !exam.published }
        : exam
    ))
    toast.success('Đã cập nhật trạng thái đề thi')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Quản lý đề thi</h1>
          <button
            onClick={() => navigate('/teacher/exams/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo đề thi mới
          </button>
        </div>

        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      exam.published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.published ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Môn học:</span> {exam.subject}
                    </div>
                    <div>
                      <span className="font-medium">Thời lượng:</span> {exam.duration} phút
                    </div>
                    <div>
                      <span className="font-medium">Số câu:</span> {exam.questions} câu
                    </div>
                    <div>
                      <span className="font-medium">Ngày thi:</span> {exam.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleTogglePublish(exam.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title={exam.published ? 'Ẩn đề thi' : 'Xuất bản đề thi'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/teacher/exams/${exam.id}/edit`}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {exams.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Chưa có đề thi nào</p>
              <p className="text-sm">Hãy tạo đề thi đầu tiên của bạn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}