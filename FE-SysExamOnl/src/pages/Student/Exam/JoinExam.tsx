/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { KeyRound, Loader2, ArrowLeftCircle } from 'lucide-react'
import { studentApi } from '../../../api/student-api'

export default function JoinExam() {
  const { inviteCode } = useParams<{ inviteCode?: string }>()
  const [code, setCode] = useState(inviteCode || '')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const hasSubmitted = useRef(false)

  useEffect(() => {
    // Tự động điền mã nếu có trong URL
    if (inviteCode) {
      setCode(inviteCode)
    }
    return () => {
      hasSubmitted.current = false
    }
  }, [inviteCode])

  const handleJoin = async () => {
    if (loading || hasSubmitted.current) return
    if (!code.trim()) {
      toast.warn('Vui lòng nhập mã kỳ thi')
      return
    }

    hasSubmitted.current = true
    setLoading(true)

    try {
      const res = await studentApi.joinExam(code.trim())
      if (res?.success && res.data) {
        toast.success(res.message || 'Tham gia kỳ thi thành công!')
        navigate(`/student/exam/join/${res.data.examSessionId}`)
      } else {
        toast.error(res?.message || 'Không thể tham gia kỳ thi')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tham gia kỳ thi. Vui lòng thử lại.'
      toast.error(msg)
      console.error('Join exam error:', err)
    } finally {
      setLoading(false)
      hasSubmitted.current = false
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center px-6 py-10'>
      <div className='flex flex-col md:flex-row bg-white shadow-2xl rounded-3xl overflow-hidden w-full max-w-5xl'>
        {/* Left side - Form */}
        <div className='flex-1 p-8 sm:p-12 flex flex-col justify-center'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-2xl shadow-inner'>
              <KeyRound className='w-7 h-7' />
            </div>
            <h2 className='text-3xl font-extrabold text-gray-800 tracking-tight'>Tham gia kỳ thi</h2>
          </div>

          <p className='text-gray-600 mb-8 text-sm sm:text-base leading-relaxed'>
            {inviteCode ? (
              <>
                Mã kỳ thi <span className='font-semibold text-blue-600'>{inviteCode}</span> đã được điền sẵn.
                <br />
                Nhấn nút <span className='font-semibold text-gray-800'>"Tham gia ngay"</span> để bắt đầu làm bài.
              </>
            ) : (
              <>
                Nhập <span className='font-semibold text-gray-800'>mã kỳ thi</span> được cung cấp bởi giảng viên để bắt
                đầu làm bài. Đảm bảo rằng bạn đã đăng nhập đúng tài khoản sinh viên.
              </>
            )}
          </p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder='Ví dụ: ABC123'
            className='w-full px-5 py-3.5 text-lg border border-gray-300 rounded-2xl text-center font-semibold text-gray-700 shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition-all duration-200 mb-6'
            disabled={loading}
            readOnly={!!inviteCode}
          />

          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/student')}
              className='flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition disabled:opacity-50'
              disabled={loading}
            >
              <ArrowLeftCircle className='w-5 h-5' />
              <span>Quay lại</span>
            </button>

            <button
              onClick={handleJoin}
              disabled={loading}
              className='flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50'
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  <span>Đang tham gia...</span>
                </>
              ) : (
                'Tham gia ngay'
              )}
            </button>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className='hidden md:flex flex-1 bg-gradient-to-br from-indigo-500 to-blue-600 text-white items-center justify-center relative'>
          <div className='absolute inset-0 opacity-20 bg-[url("https://www.toptal.com/designers/subtlepatterns/patterns/double-bubble-outline.png")]' />
          <div className='relative z-10 text-center p-8'>
            <div className='flex justify-center'>
              <img
                src='https://ktdbcl.actvn.edu.vn/images/Logo_710x125-removebg-preview.png'
                alt='Join Exam Illustration'
                className='w-56 drop-shadow-lg'
              />
            </div>
            <h3 className='text-2xl font-bold mb-3'>Sẵn sàng cho thử thách?</h3>
            <p className='text-sm opacity-90 mb-6'>
              Mỗi bài thi là một cơ hội để bạn chứng minh khả năng của mình. Chuẩn bị thật kỹ và thể hiện tốt nhất nhé!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
