import { useState, useMemo } from 'react'
import { Eye, EyeOff, BookOpen, UserIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import axiosClient from '../../api/axiosClient.ts'
import { useDispatch } from 'react-redux'
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
  roleId?: string | number
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Lấy role đã chọn (RoleSelectPage lưu vào localStorage)
  const selectedRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('selectedRole')
      return raw ? JSON.parse(raw) as { id: string | number; name?: string } : null
    } catch {
      return null
    }
  }, [])
  function handleRoleChange() {
    localStorage.removeItem('selectedRole');
    navigate('/role-select')
    toast.info('Vui lòng chọn  vai trò trước khi đăng nhập.')
  }

  const loginMutation = useMutation<LoginResponse, Error, void>({
    mutationFn: async () => {
      try {
        // gửi kèm roleId nếu đã chọn
        const payload: LoginPayload = { email, password }
        if (selectedRole?.id) payload.roleId = selectedRole.id
        const { data } = await axiosClient.post(
          '/auth/login',
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        )
        // Chuẩn hoá theo backend: có thể trả về { data: {...} } hoặc trực tiếp {...}
        const raw = (data && data.data) ? data.data : data
        const token = raw?.token ?? ''
        const name = raw?.name ?? raw?.fullName ?? raw?.username
        const roleId = raw?.roleId ?? selectedRole?.id
        const roleName = raw?.roleName ?? selectedRole?.name

        // Chuẩn hoá role về 'teacher' | 'student'
        const norm = (roleName || '').toString().toLowerCase()
        let role: 'teacher' | 'student'
        if (norm.includes('teach')) role = 'teacher'
        else if (norm.includes('student')) role = 'student'
        else if (Number(roleId) === 1 || String(roleId) === 'TEACHER') role = 'teacher'
        else role = 'student'

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
            : err instanceof Error ? err.message : 'Đăng nhập thất bại'
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
    if (!selectedRole?.id) {
      toast.warning('Vui lòng chọn vai trò trước khi đăng nhập')
      navigate('/role-select')
      return
    }
    loginMutation.mutate()
  }

  return (
  
  <div
    className="h-screen bg-cover bg-center flex items-center justify-center "
    style={{
      backgroundImage:
        "url('https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser-2048x1245.png')",
    }}
  >
    <div className=" p-6 min-h-5/6 w-md border-3 border-blue-600 shadow-2xl  rounded-xl        bg-white/95">
      <div className="flex flex-col items-center mb-4 pt-2 text-center ">
        <img
          src="https://actvn.edu.vn/Images/actvn_big_icon.png"
          alt="Logo"
          className="w-16 h-16 mb-3"
        />
        <h1 className="font-semibold ">
          Phòng Khảo thí & Đảm bảo chất lượng đào tạo
        </h1>
        <p className=" font-bold text-lg">Phần Mềm Thi Thử Nghiệm</p>

        <p className=" text-sm flex items-center gap-1 ml-10 ">
          {(() => {
            const name = (selectedRole?.name || "").toString().toLowerCase();
            if (name.includes("teach")) return (
              <><BookOpen className='mr-1 text-green-600'></BookOpen>Giáo Viên </>
            );
            return (
               <><UserIcon size={20} className='text-blue-600'></UserIcon>Thí Sinh </>
            )
          })()}
          <div 
          onClick={handleRoleChange}
          className='text-blue-600  cursor-pointer hover:text-blue-800 underline'>thay đổi</div>
        </p>
        
      </div>

      <div className="mx-4 ">
        <h2 className="text-center font-bold mb-2 ">ĐĂNG NHẬP </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 ">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              className="w-full   border border-blue-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 ">
              Mật khẩu <span className="text-red-600">*</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full  border border-blue-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full cursor-pointer bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="text-center mt-4 text-sm ">
          <button
            className="text-blue-600 underline cursor-pointer hover:text-blue-800"
            onClick={() => navigate("/register")}
          >
            Chưa có tài khoản? Đăng ký
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
        <p className="text-gray-400">© HV KTMM – Thực tập cơ sở</p>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4 text-center text-xs space-y-1 text-gray-600 break-words">
        <p>Địa chỉ: Số 114 Chiến Thắng, Phương Liệt, Hà Nội</p>
        <p>Điện thoại: 84-24-88889999; Email: kt@actvn.edu.vn</p>
        <p className="text-[10px] text-gray-400">
          Release date: 2025-10-01T11:54:17+07:00
        </p>
      </div>
    </div>
  </div>
);


}
