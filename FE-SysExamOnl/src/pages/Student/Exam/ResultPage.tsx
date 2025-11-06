import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Award, FileCheck } from 'lucide-react'

interface ExamResult {
  totalScore: number
  correctCount: number
  wrongCount: number
  submittedAt: string
  status: string
  timeSpent?: number
}

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { examId } = useParams()
  const result = (location.state as any)?.result as ExamResult | undefined

  function toLocalStringISO(iso?: string) {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })
    } catch {
      return iso
    }
  }

  function formatTimeSpent(seconds?: number) {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (hours > 0) parts.push(`${hours} giờ`)
    if (minutes > 0) parts.push(`${minutes} phút`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs} giây`)

    return parts.join(' ')
  }

  if (!result) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <XCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>Không tìm thấy kết quả</h2>
          <p className='text-gray-600 mb-4'>Không có dữ liệu kết quả. Vui lòng truy cập từ trang làm bài thi.</p>
          <button
            onClick={() => navigate('/student')}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  const total = result.correctCount + result.wrongCount
  const score = total > 0 ? ((result.correctCount / total) * 10).toFixed(2) : '0.00'

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-3xl mx-auto px-4'>
        <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
          {/* Header */}
          <div className='bg-blue-600 px-6 py-8 text-center text-white'>
            <CheckCircle className='w-16 h-16 mx-auto mb-4' />
            <h1 className='text-3xl font-bold mb-2'>Đã nộp bài thành công!</h1>
            <p className='text-blue-100'>Cảm ơn bạn đã hoàn thành bài thi</p>
          </div>

          {/* Score Section */}
          <div className='px-6 py-8'>
            <div className='text-center mb-8'>
              <div className='inline-flex items-center justify-center'>
                <Award className='w-8 h-8 text-yellow-500 mr-2' />
                <div className='text-5xl font-bold text-gray-800'>{score}/10</div>
              </div>
              <p className='text-gray-500 mt-2'>Điểm số của bạn</p>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
              <div className='bg-gray-50 rounded-lg p-6'>
                <div className='flex items-start'>
                  <FileCheck className='w-6 h-6 text-blue-500 mr-3 mt-1' />
                  <div>
                    <div className='text-gray-500 text-sm mb-1'>Số câu đúng</div>
                    <div className='text-2xl font-semibold text-gray-800'>
                      {result.correctCount}/{total}
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-6'>
                <div className='flex items-start'>
                  <Clock className='w-6 h-6 text-blue-500 mr-3 mt-1' />
                  <div>
                    <div className='text-gray-500 text-sm mb-1'>Thời gian làm bài</div>
                    <div className='text-2xl font-semibold text-gray-800'>{formatTimeSpent(result.timeSpent)}</div>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-6 md:col-span-2'>
                <div className='flex items-start'>
                  <CheckCircle className='w-6 h-6 text-green-500 mr-3 mt-1' />
                  <div>
                    <div className='text-gray-500 text-sm mb-1'>Thời gian nộp bài</div>
                    <div className='text-2xl font-semibold text-gray-800'>{toLocalStringISO(result.submittedAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-center space-x-4'>
              <button
                onClick={() => navigate('/student')}
                className='bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition'
              >
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
