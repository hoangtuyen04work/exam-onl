import { useState, useEffect } from 'react'
import { Eye, EyeOff, BookOpen, UserIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import axiosClient from '../../api/axiosClient.ts'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess } from '../../store/slices/authSlice'

// Type definitions
interface LoginResponse {
  token: string
  name?: string
  role: 'teacher' | 'student'
}

interface ApiErrorResponse {
  message: string
}

interface LoginPayload {
  email: string
  password: string
  roleId: number
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleId, setRoleId] = useState<number>(2) // Default: Student (roleId = 2)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const role = localStorage.getItem('role')
      if (role === 'teacher') {
        navigate('/teacher', { replace: true })
      } else {
        navigate('/student', { replace: true })
      }
    }
  }, [isAuthenticated, navigate])

  // Prevent back button after logout
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const loginMutation = useMutation<LoginResponse, Error, void>({
    mutationFn: async () => {
      try {
        const payload: LoginPayload = { email, password, roleId }
        const { data } = await axiosClient.post('/auth/login', payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        // Chuẩn hoá theo backend: có thể trả về { data: {...} } hoặc trực tiếp {...}
        const raw = data && data.data ? data.data : data
        const token = raw?.token ?? ''
        const name = raw?.name ?? raw?.fullName ?? raw?.username

        // Chuẩn hoá role về 'teacher' | 'student'
        const role: 'teacher' | 'student' = roleId === 1 ? 'teacher' : 'student'

        // Lưu token
        if (token) {
          localStorage.setItem('authToken', token)
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }

        const normalized: LoginResponse = { token, name, role }
        return normalized
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? (err.response.data as ApiErrorResponse).message
            : err instanceof Error
              ? err.message
              : 'Đăng nhập thất bại'
        throw new Error(msg)
      }
    },
    onSuccess: (user: LoginResponse) => {
      dispatch(loginSuccess(user))
      toast.success(`Chào mừng ${user.name || 'bạn'}!`)
      if (user.role === 'teacher') navigate('/teacher')
      else navigate('/student')
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Thông tin đăng nhập không đúng!')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !password) {
      toast.warning('Vui lòng nhập đầy đủ thông tin!')
      return
    }
    loginMutation.mutate()
  }

  return (
    <div
      className='h-screen bg-cover bg-center flex items-center justify-center '
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
          <h2 className='text-center font-bold mb-2 text-base'>ĐĂNG NHẬP</h2>

          <form onSubmit={handleSubmit} className='space-y-3'>
            {/* Role Selection */}
            <div>
              <label className='block text-xs font-medium mb-2 text-gray-700'>
                Đăng nhập với vai trò <span className='text-red-600'>*</span>
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => setRoleId(2)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ${
                    roleId === 2
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <UserIcon
                    size={24}
                    className={`mb-1 transition-colors ${roleId === 2 ? 'text-blue-600' : 'text-gray-500'}`}
                  />
                  <span className={`font-medium text-xs ${roleId === 2 ? 'text-blue-700' : 'text-gray-700'}`}>
                    Thí Sinh
                  </span>
                  {roleId === 2 && (
                    <div className='absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center'>
                      <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  type='button'
                  onClick={() => setRoleId(1)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ${
                    roleId === 1
                      ? 'border-green-600 bg-green-50 shadow-md'
                      : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50/50'
                  }`}
                >
                  <BookOpen
                    size={24}
                    className={`mb-1 transition-colors ${roleId === 1 ? 'text-green-600' : 'text-gray-500'}`}
                  />
                  <span className={`font-medium text-xs ${roleId === 1 ? 'text-green-700' : 'text-gray-700'}`}>
                    Giáo Viên
                  </span>
                  {roleId === 1 && (
                    <div className='absolute top-1 right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center'>
                      <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
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

            <div>
              <label className='block text-xs font-medium mb-1'>
                Mật khẩu <span className='text-red-600'>*</span>
              </label>

              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Nhập mật khẩu'
                  className='w-full text-sm border border-blue-400 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-600 pr-8'
                />
                <button
                  type='button'
                  className='absolute right-2 top-2 text-white'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className='text-right mt-1'>
                <button
                  type='button'
                  className='text-xs text-blue-600 underline hover:text-blue-800'
                  onClick={() => navigate('/forgot-password')}
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={loginMutation.isPending}
              className='w-full cursor-pointer bg-blue-600 text-white py-1.5 text-sm rounded-lg hover:bg-blue-700 transition font-medium'
            >
              {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            {/* Divider */}
            <div className='relative my-3'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>Hoặc</span>
              </div>
            </div>

            {/* OAuth Sign In Buttons */}
            <div className='space-y-2'>
              {/* Microsoft Sign In Button */}
              <button
                type='button'
                onClick={() => {
                  // Redirect to Azure OAuth endpoint
                  const backendUrl =
                    import.meta.env.VITE_SERVER_PORT_EXPOSE || 'http://localhost:8888/exam-online-system'
                  window.location.href = `${backendUrl}/oauth2/authorization/azure?role=${roleId}`
                }}
                className='w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-1.5 text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition font-medium shadow-sm'
              >
                <svg className='w-4 h-4' viewBox='0 0 23 23' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path d='M0 0h10.931v10.931H0V0z' fill='#F25022' />
                  <path d='M12.069 0H23v10.931H12.069V0z' fill='#7FBA00' />
                  <path d='M0 12.069h10.931V23H0V12.069z' fill='#00A4EF' />
                  <path d='M12.069 12.069H23V23H12.069V12.069z' fill='#FFB900' />
                </svg>
                <span>Đăng nhập với Microsoft</span>
              </button>
            </div>
          </form>

          <div className='text-center mt-3 text-xs'>
            <button
              className='text-blue-600 underline cursor-pointer hover:text-blue-800'
              onClick={() => navigate('/register')}
            >
              Chưa có tài khoản? Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
