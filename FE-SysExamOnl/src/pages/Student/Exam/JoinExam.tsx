import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { joinExam } from '../../../api/student-api'

export default function JoinExam() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Ngăn gọi API 2 lần do React Strict Mode
  const hasSubmitted = useRef(false)

  // Reset khi rời trang (nếu cần cho phép thử lại)
  useEffect(() => {
    return () => {
      hasSubmitted.current = false
    }
  }, [])

  const handleJoin = async () => {
    // Ngăn gọi nhiều lần
    if (loading || hasSubmitted.current) {
      console.warn('Submit prevented: already in progress or Strict Mode double call')
      return
    }

    if (!code.trim()) {
      toast.warn('Vui lòng nhập mã kỳ thi')
      return
    }

    hasSubmitted.current = true
    setLoading(true)

    try {
      const res = await joinExam(code.trim())

      if (res?.success && res.data) {
        toast.success(res.message || 'Tham gia kỳ thi thành công!')
        navigate(`/exam/${res.data.examSessionId}`)
      } else {
        toast.error(res?.message || 'Không thể tham gia kỳ thi')
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Lỗi khi tham gia kỳ thi. Vui lòng thử lại.'
      toast.error(msg)
      console.error('Join exam error:', err)
    } finally {
      setLoading(false)
      // Không reset hasSubmitted để tránh submit lại khi quay lại trang
      // Nếu muốn cho phép nhập mã khác: hasSubmitted.current = false
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4'>
        <h2 className='text-2xl font-semibold mb-4'>Tham gia kỳ thi</h2>
        <p className='text-sm text-gray-600 mb-6'>
          Nhập mã kỳ thi do giáo viên cung cấp để tham gia.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder='Mã kỳ thi (ví dụ: ABC123)'
          className='w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition'
          disabled={loading}
        />

        <div className='flex justify-between gap-3'>
          <button
            onClick={() => navigate('/student')}
            className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50'
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleJoin}
            className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50'
            disabled={loading}
          >
            {loading ? 'Đang tham gia...' : 'Tham gia'}
          </button>
        </div>
      </div>
    </div>
  )
}