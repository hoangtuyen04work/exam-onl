import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import axios from 'axios'
import axiosClient from '../../api/axiosClient'
import { BookOpen, UserIcon, ArrowLeft } from 'lucide-react'

interface ForgotPasswordPayload {
  email: string
  roleId: number
}

interface ResetPasswordPayload {
  email: string
  roleId: number
  code: string
  newPassword: string
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState<number>(2)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      const payload: ForgotPasswordPayload = { email, roleId }
      await axiosClient.post('/auth/forgot-password', payload)
    },
    onSuccess: () => {
      toast.success('Mã xác thực đã được gửi đến email của bạn!')
      setStep('reset')
    },
    onError: (error: any) => {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Không thể gửi mã xác thực. Vui lòng thử lại.'
      toast.error(msg)
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp')
      }
      const payload: ResetPasswordPayload = { email, roleId, code, newPassword }
      await axiosClient.post('/auth/reset-password', payload)
    },
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công!')
      navigate('/login')
    },
    onError: (error: any) => {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : 'Không thể đặt lại mật khẩu'
      toast.error(msg)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'email') {
      if (!email) {
        toast.warning('Vui lòng nhập email')
        return
      }
      forgotPasswordMutation.mutate()
    } else {
      if (!code || !newPassword || !confirmPassword) {
        toast.warning('Vui lòng nhập đầy đủ thông tin')
        return
      }
      resetPasswordMutation.mutate()
    }
  }

  return (
    <div
      className='h-screen bg-cover bg-center flex items-center justify-center'
      style={{
        backgroundImage: "url('https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser-2048x1245.png')"
      }}
    >
      <div className='p-4 max-w-md w-full mx-4 border-2 border-blue-600 shadow-xl rounded-lg bg-white/95'>
        <div className='flex flex-col items-center mb-3 text-center'>
          <img src='https://actvn.edu.vn/Images/actvn_big_icon.png' alt='Logo' className='w-12 h-12 mb-2' />
          <h1 className='font-semibold text-sm'>Phòng Khảo thí & Đảm bảo chất lượng đào tạo</h1>
          <p className='font-bold text-base'>Phần Mềm Thi Thử Nghiệm</p>
        </div>

        <div>
          <h2 className='text-center font-bold mb-2 text-base'>
            {step === 'email' ? 'QUÊN MẬT KHẨU' : 'ĐẶT LẠI MẬT KHẨU'}
          </h2>

          <form onSubmit={handleSubmit} className='space-y-3'>
            {step === 'email' ? (
              <>
                {/* Role Selection */}
                <div>
                  <label className='block text-xs font-medium mb-2 text-gray-700'>
                    Vai trò <span className='text-red-600'>*</span>
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      type='button'
                      onClick={() => setRoleId(2)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ${
                        roleId === 2
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-400'
                      }`}
                    >
                      <UserIcon size={24} className={`mb-1 ${roleId === 2 ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`font-medium text-xs ${roleId === 2 ? 'text-blue-700' : 'text-gray-700'}`}>
                        Thí Sinh
                      </span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setRoleId(1)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ${
                        roleId === 1
                          ? 'border-green-600 bg-green-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-green-400'
                      }`}
                    >
                      <BookOpen size={24} className={`mb-1 ${roleId === 1 ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className={`font-medium text-xs ${roleId === 1 ? 'text-green-700' : 'text-gray-700'}`}>
                        Giáo Viên
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Email <span className='text-red-600'>*</span>
                  </label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Nhập email'
                    className='w-full text-sm border border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600'
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Mã xác thực <span className='text-red-600'>*</span>
                  </label>
                  <input
                    type='text'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder='Nhập mã 6 số'
                    maxLength={6}
                    className='w-full text-sm border border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Mật khẩu mới <span className='text-red-600'>*</span>
                  </label>
                  <input
                    type='password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder='Nhập mật khẩu mới'
                    className='w-full text-sm border border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium mb-1'>
                    Xác nhận mật khẩu <span className='text-red-600'>*</span>
                  </label>
                  <input
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Nhập lại mật khẩu mới'
                    className='w-full text-sm border border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600'
                  />
                </div>
              </>
            )}

            <button
              type='submit'
              disabled={forgotPasswordMutation.isPending || resetPasswordMutation.isPending}
              className='w-full bg-blue-600 text-white py-1.5 text-sm rounded-lg hover:bg-blue-700 transition font-medium'
            >
              {forgotPasswordMutation.isPending || resetPasswordMutation.isPending
                ? 'Đang xử lý...'
                : step === 'email'
                  ? 'Gửi mã xác thực'
                  : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <div className='text-center mt-3 space-y-2'>
            {step === 'reset' && (
              <button className='text-blue-600 text-xs underline hover:text-blue-800' onClick={() => setStep('email')}>
                ← Quay lại
              </button>
            )}
            <div>
              <button
                className='text-blue-600 text-xs underline hover:text-blue-800'
                onClick={() => navigate('/login')}
              >
                <ArrowLeft size={12} className='inline mr-1' />
                Quay về đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
