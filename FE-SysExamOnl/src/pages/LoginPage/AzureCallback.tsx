import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'
import axiosClient from '../../api/axiosClient'

// This component handles OAuth2 callbacks from Azure AD and Google
export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL params (if backend sends it)
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
          toast.error(`Đăng nhập thất bại: ${error}`)
          navigate('/login')
          return
        }

        if (!token) {
          // If no token in URL, try to get from backend session
          const response = await axiosClient.get('/auth/me')
          const userData = response.data?.data || response.data

          if (userData?.token) {
            handleSuccessfulLogin(userData)
          } else {
            throw new Error('Không tìm thấy token')
          }
        } else {
          // Token exists in URL params
          const response = await axiosClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          const userData = response.data?.data || response.data
          handleSuccessfulLogin({ ...userData, token })
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.')
        navigate('/login')
      }
    }

    const handleSuccessfulLogin = (userData: any) => {
      const token = userData.token
      const name = userData.name || userData.fullName || userData.email
      const roleId = userData.roleId
      const role: 'teacher' | 'student' = roleId === 1 ? 'teacher' : 'student'

      // Save token
      if (token) {
        localStorage.setItem('authToken', token)
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      // Update Redux store
      dispatch(loginSuccess({ token, name, role }))
      toast.success(`Chào mừng ${name}!`)

      // Navigate based on role
      if (role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }
    }

    handleCallback()
  }, [searchParams, navigate, dispatch])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4'></div>
        <p className='text-gray-600 text-lg'>Đang xử lý đăng nhập...</p>
        <p className='text-gray-400 text-sm mt-2'>Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  )
}
