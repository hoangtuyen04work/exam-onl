import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import axiosClient from '../../api/axiosClient.ts'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
// import { useDispatch } from 'react-redux'
import { ArrowLeft } from 'lucide-react'

interface RegisterPayload {
  email: string
  password: string
  roleId?: number
}

interface ApiErrorResponse {
  message?: string
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roleId, setRoleId] = useState<string | number | ''>('')
  const navigate = useNavigate()
  // const dispatch = useDispatch()

  // Dùng axiosClient với baseURL cấu hình sẵn
  const authAxios = useMemo(() => axiosClient, [])

  const selectedRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('selectedRole')
      return raw ? JSON.parse(raw) as { id: string | number; name?: string } : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    // Không gọi roles nữa, chỉ sử dụng selectedRole từ localStorage
    if (selectedRole?.id !== undefined && selectedRole?.id !== null) {
      setRoleId(selectedRole.id)
    }
  }, [selectedRole])

  const registerMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const payload: RegisterPayload = { email, password }
      if (roleId !== '') payload.roleId = Number(roleId)
      try {
        setIsSubmitting(true)
        const { data } = await authAxios.post(
          '/auth/register',
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        )
        // Lưu userId để verify email (theo spec mẫu)
        const raw = (data && data.data) ? data.data : data
        const userId = raw?.userId
        if (userId !== undefined && userId !== null) {
          localStorage.setItem('pendingVerification', JSON.stringify({ userId, roleId: Number(roleId), roleName: selectedRole?.name || '' }))
        }
        return
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? (err.response.data as ApiErrorResponse).message
            : err instanceof Error ? err.message : 'Đăng ký thất bại'
        throw new Error(msg || 'Đăng ký thất bại')
      } finally {
        setIsSubmitting(false)
      }
    },
    onSuccess: async () => {
      toast.success('Đăng ký thành công! Vui lòng xác minh email')
      const raw = localStorage.getItem('pendingVerification')
      const parsed = raw ? JSON.parse(raw) as { userId?: number } : null
      const userId = parsed?.userId
      navigate('/verify-email', { state: { userId } })
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Không thể đăng ký tài khoản')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !password) {
      toast.warning('Vui lòng nhập email và mật khẩu')
      return
    }
    if (roleId === '') {
      toast.warning('Vui lòng chọn vai trò ở bước trước')
      navigate('/role-select')
      return
    }
    registerMutation.mutate()
  }

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center px-4'
      style={{
        backgroundImage: "url('https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser-2048x1245.png')"
      }}
    >
      <div className="bg-white/95 shadow-2xl border-4 border-blue-600 rounded-2xl w-full max-w-md p-8 mx-auto my-12 backdrop-blur-sm min-h-0">
        <button
          type='button'
          aria-label='Quay lại chọn vai trò'
          className='mb-2 inline-flex items-center text-blue-700 hover:text-blue-900'
          onClick={() => navigate('/role-select')}
        >
          <ArrowLeft size={18} className='mr-1' /> Quay lại chọn vai trò
        </button>
        <div className='flex flex-col items-center mb-6'>
          <img src='https://actvn.edu.vn/Images/actvn_big_icon.png' alt='Logo' className='w-16 h-16 mb-3' />
          <h1 className='text-center font-semibold text-gray-800'>Phòng Khảo thí & Đảm bảo chất lượng đào tạo</h1>
          <p className='text-blue-800 font-bold text-lg'>Phần Mềm Thi Thử Nghiệm</p>
          <p className='text-gray-500 text-sm'>
            {(() => {
              const name = (selectedRole?.name || '').toString().toLowerCase()
              if (name.includes('teach')) return '(dành cho giáo viên)'
              return '(dành cho thí sinh)'
            })()}
          </p>
        </div>

        <div className='border border-cyan-500 rounded-lg p-6'>
          <h2 className='text-center font-semibold mb-4'>ĐĂNG KÝ TÀI KHOẢN</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Họ và tên
              </label>
              <input
                type='text'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Nhập họ và tên'
                className='w-full border border-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Email <span className='text-red-500'>*</span>
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Nhập email'
                className='w-full border border-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Mật khẩu <span className='text-red-500'>*</span>
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Nhập mật khẩu'
                className='w-full border border-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500'
              />
          {/* Role được lấy từ bước chọn vai trò, không hiển thị selector */}
            </div>

            <button
              type='submit'
              disabled={isSubmitting || registerMutation.isPending}
              className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium'
            >
              {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>
          <div className='text-center mt-4 text-sm'>
            <button className='text-blue-600 underline' onClick={() => navigate('/login')}>Đã có tài khoản? Đăng nhập</button>
          </div>
        </div>

        <div className='mt-8 text-center text-xs text-gray-500 space-y-2'>
          <p className='text-gray-400'>© HV KTMM – Thực tập cơ sở</p>
        </div>

        <div className='mt-4 border-t border-gray-200 pt-4 text-center text-xs space-y-1 text-gray-600'>
          <p>Địa chỉ: Số 114 Chiến Thắng, Phương Liệt, Hà Nội</p>
          <p>Điện thoại: 84-24-88889999; Email: kt@actvn.edu.vn</p>
        </div>
      </div>
    </div>
  )
}


