import { Link } from 'react-router-dom'
import { mockExams, mockQuestions } from '../../../data/mockData'

export default function TeacherDashboard() {
  const exams = mockExams
  const questions = mockQuestions

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <h1 className="text-2xl font-semibold mb-6">Teacher Dashboard</h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/teacher/exams" className="p-5 rounded-xl border bg-white hover:bg-blue-50 transition">
            <p className="text-gray-500">Tổng số đề thi</p>
            <p className="text-2xl font-bold">{exams.length}</p>
          </Link>

          <Link to="/teacher/questions" className="p-5 rounded-xl border bg-white hover:bg-blue-50 transition">
            <p className="text-gray-500">Ngân hàng câu hỏi</p>
            <p className="text-2xl font-bold">{questions.length}</p>
          </Link>

          <Link to="/teacher/students" className="p-5 rounded-xl border bg-white hover:bg-blue-50 transition">
            <p className="text-gray-500">Quản lý thí sinh</p>
            <p className="text-2xl font-bold">3</p>
          </Link>

          <Link to="/teacher/results" className="p-5 rounded-xl border bg-white hover:bg-blue-50 transition">
            <p className="text-gray-500">Kết quả chấm</p>
            <p className="text-2xl font-bold">2</p>
          </Link>
        </div>

        {/* Recent Exams */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Đề thi gần đây</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.slice(0, 3).map((exam) => (
              <div key={exam.id} className="p-4 border rounded-lg bg-white">
                <h3 className="font-medium text-gray-900">{exam.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {exam.subject} • {exam.duration} phút • {exam.questions} câu
                </p>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    exam.published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exam.published ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}