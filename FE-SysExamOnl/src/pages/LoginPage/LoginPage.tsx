import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { authenticateUser } from '../../api/mock-api'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/slices/authSlice'

export default function LoginPage() {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Hardcode tài khoản giáo viên: giaovien/giaovien
      if (studentId === 'giaovien' && password === 'giaovien') {
        return {
          id: 't-1',
          studentId: 'GV001',
          name: 'Giáo viên',
          role: 'teacher',
          token: 'fake-jwt-' + Math.random().toString(36).slice(2)
        }
      }
      // Mặc định: xác thực thí sinh từ mock-data
      const user = await authenticateUser(studentId, password)
      return user
    },
    onSuccess: (user) => {
      dispatch(loginSuccess(user))
      toast.success(`Chào mừng ${user.name || 'bạn'}!`)
      if (user.role === 'teacher') navigate('/teacher')
      else navigate('/student')
    },
    onError: () => {
      toast.error('Thông tin đăng nhập không đúng!')
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!studentId || !password) {
      toast.warning('Vui lòng nhập đầy đủ thông tin!')
      return
    }
    loginMutation.mutate()
  }

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center px-4'
      style={{
        backgroundImage: "url('https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser-2048x1245.png')"
      }}
    >
      <div className='bg-white/95 shadow-2xl border-4 border-blue-600 rounded-2xl w-full max-w-md p-8 backdrop-blur-sm'>
        <div className='flex flex-col items-center mb-6'>
          <img src='https://actvn.edu.vn/Images/actvn_big_icon.png' alt='Logo' className='w-16 h-16 mb-3' />
          <h1 className='text-center font-semibold text-gray-800'>CỤC QUẢN LÝ CHẤT LƯỢNG</h1>
          <p className='text-blue-800 font-bold text-lg'>Phần Mềm Thi Thử Nghiệm</p>
          <p className='text-gray-500 text-sm'>(dành cho thí sinh)</p>
        </div>

        <div className='border border-cyan-500 rounded-lg p-6'>
          <h2 className='text-center font-semibold mb-4'>ĐĂNG NHẬP LÀM BÀI THI</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Mã thí sinh <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder='Nhập mã thí sinh'
                className='w-full border border-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Mật khẩu <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Nhập mật khẩu'
                  className='w-full border border-gray-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 pr-10'
                />
                <button
                  type='button'
                  className='absolute right-3 top-2.5 text-gray-500'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={loginMutation.isPending}
              className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium'
            >
              {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <div className='mt-8 text-center text-xs text-gray-500 space-y-2'>
          <p>Tải ứng dụng SafeWebBrowser</p>
          <p className='text-gray-400'>© HV KTMM – Thực tập cơ sở</p>
        </div>

        {/* Footer */}
        <div className='mt-4 border-t border-gray-200 pt-4 text-center text-xs space-y-1 text-gray-600'>
          <p>Địa chỉ: Số 114 Chiến Thắng, Phương Liệt, Hà Nội</p>
          <p>Điện thoại: 84-24-88889999; Email: kt@actvn.edu.vn</p>
          <p className='text-[10px] text-gray-400'>Release date: 2025-10-01T11:54:17+07:00</p>
        </div>
      </div>
    </div>
  )
}
