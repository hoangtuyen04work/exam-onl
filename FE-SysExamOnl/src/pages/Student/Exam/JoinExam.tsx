import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { joinExam } from '../../../api/student-api'

export default function JoinExam() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.warn('Vui lòng nhập mã kỳ thi')
      return
    }

    setLoading(true)
    try {
      const res = await joinExam(code.trim())
      if (res?.success && res.data) {
        toast.success(res.message || 'Joined exam session')
        // Navigate to exam page (examSessionId)
        navigate(`/exam/${res.data.examSessionId}`)
      } else {
        toast.error(res?.message || 'Không thể tham gia kỳ thi')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tham gia kỳ thi'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4'>
        <h2 className='text-2xl font-semibold mb-4'>Tham gia kỳ thi</h2>
        <p className='text-sm text-gray-600 mb-6'>Nhập mã kỳ thi do giáo viên cung cấp để tham gia.</p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder='Mã kỳ thi (ví dụ: ABC123)'
          className='w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500'
        />

        <div className='flex justify-between'>
          <button onClick={() => navigate('/student')} className='px-4 py-2 bg-gray-200 rounded-lg' disabled={loading}>
            Hủy
          </button>
          <button onClick={handleJoin} className='px-4 py-2 bg-blue-600 text-white rounded-lg' disabled={loading}>
            {loading ? 'Đang tham gia...' : 'Tham gia'}
          </button>
        </div>
      </div>
    </div>
  )
}
