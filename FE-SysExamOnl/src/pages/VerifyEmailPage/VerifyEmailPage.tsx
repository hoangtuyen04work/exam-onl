import { useEffect, useMemo, useState } from 'react'
import axiosClient from '../../api/axiosClient.ts'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, UserIcon } from 'lucide-react'

interface VerifyPayload {
  code: string
  userId: number
}

interface ResendCodePayload {
  userId: number
}

interface VerifyLocationState {
  userId?: number
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Start 5 minute countdown on mount
  useEffect(() => {
    setCountdown(300) // 5 minutes = 300 seconds
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const selectedRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('selectedRole')
      return raw ? (JSON.parse(raw) as { id: number; name?: string }) : null
    } catch {
      return null
    }
  }, [])

  const storedPending = useMemo(() => {
    try {
      const raw = localStorage.getItem('pendingVerification')
      return raw ? (JSON.parse(raw) as { userId?: number }) : null
    } catch {
      return null
    }
  }, [])

  const locationState = (location.state ?? null) as unknown as VerifyLocationState | null
  const userId: number | undefined = locationState?.userId ?? storedPending?.userId

  const authAxios = useMemo(() => axiosClient, [])

  const verifyMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!userId || !code) throw new Error('Thiếu mã xác minh hoặc userId')
      const payload: VerifyPayload = { code, userId }
      await authAxios.post('/auth/verify-email', payload, { headers: { 'Content-Type': 'application/json' } })
    },
    onSuccess: () => {
      toast.success('Xác minh email thành công! Vui lòng đăng nhập')
      navigate('/login')
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Xác minh thất bại')
    }
  })

  const resendCodeMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!userId) throw new Error('Thiếu thông tin user')
      const payload: ResendCodePayload = { userId }
      await authAxios.post('/auth/resend-code', payload)
    },
    onSuccess: () => {
      toast.success('Đã gửi lại mã xác thực!')
      setCountdown(300) // Reset countdown to 5 minutes
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Không thể gửi lại mã')
    }
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center px-4'
      style={{
        backgroundImage: "url('https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser-2048x1245.png')"
      }}
    >
      <div className='p-6 min-h-5/6 w-md border-3 border-blue-600 shadow-2xl  rounded-xl        bg-white/95'>
        <button
          type='button'
          aria-label='Quay lại đăng ký'
          className='mb-2 inline-flex items-center text-blue-700 hover:text-blue-900'
          onClick={() => navigate('/register')}
        >
          <ArrowLeft size={18} className='mr-1' /> Quay lại
        </button>

        <div className='flex flex-col items-center mb-6'>
          <img src='https://actvn.edu.vn/Images/actvn_big_icon.png' alt='Logo' className='w-16 h-16 mb-3' />
          <h1 className='text-center font-semibold text-gray-800'>Phòng Khảo thí & Đảm bảo chất lượng đào tạo</h1>
          <p className='text-blue-800 font-bold text-lg'>Phần Mềm Thi Thử Nghiệm</p>
          <p className=' text-sm flex items-center gap-1  '>
            {(() => {
              const name = (selectedRole?.name || '').toString().toLowerCase()
              if (name.includes('teach'))
                return (
                  <>
                    <BookOpen className='mr-1 text-green-600  '></BookOpen>Giáo Viên{' '}
                  </>
                )
              return (
                <>
                  <UserIcon size={20} className='text-blue-600'></UserIcon>Thí Sinh{' '}
                </>
              )
            })()}
          </p>
        </div>

        <div className='border border-cyan-500 rounded-lg p-6'>
          <h2 className='text-center font-semibold mb-4'>XÁC MINH EMAIL</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!userId) {
                toast.warning('Thiếu thông tin user để xác minh')
                return
              }
              if (!code) {
                toast.warning('Vui lòng nhập mã xác minh')
                return
              }
              verifyMutation.mutate()
            }}
            className='space-y-4'
          >
            <div>
              <label className='block text-sm font-medium mb-1'>Mã xác minh</label>
              <input
                type='text'
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder='Nhập mã 6 số từ email'
                className='w-full border border-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* Countdown and Resend Button */}
            <div className='flex items-center justify-between text-sm'>
              {countdown > 0 ? (
                <span className='text-gray-600'>Mã hết hạn sau: {formatTime(countdown)}</span>
              ) : (
                <span className='text-red-600'>Mã đã hết hạn</span>
              )}
              <button
                type='button'
                onClick={() => resendCodeMutation.mutate()}
                disabled={countdown > 0 || resendCodeMutation.isPending}
                className={`text-blue-600 underline hover:text-blue-800 ${
                  countdown > 0 || resendCodeMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {resendCodeMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã'}
              </button>
            </div>

            <button
              type='submit'
              disabled={verifyMutation.isPending}
              className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium'
            >
              {verifyMutation.isPending ? 'Đang xác minh...' : 'Xác minh'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
