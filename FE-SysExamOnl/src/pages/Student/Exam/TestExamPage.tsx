import { useParams } from 'react-router-dom'

export default function TestExamPage() {
  const { examId } = useParams()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Test Exam Page
        </h1>
        <p className="text-gray-600">
          Exam ID: {examId}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Nếu bạn thấy trang này, route đã hoạt động!
        </p>
      </div>
    </div>
  )
}
