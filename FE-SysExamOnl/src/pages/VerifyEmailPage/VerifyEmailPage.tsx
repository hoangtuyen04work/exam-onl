import { useMemo, useState } from 'react'
import axiosClient from '../../api/axiosClient.ts'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, UserIcon } from 'lucide-react'

interface VerifyPayload {
  code: string
  userId: number
}

interface VerifyLocationState {
  userId?: number
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState('')

  const selectedRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('selectedRole')
      return raw ? JSON.parse(raw) as { id: number; name?: string } : null
    } catch {
      return null
    }
  }, [])

  const storedPending = useMemo(() => {
    try {
      const raw = localStorage.getItem('pendingVerification')
      return raw ? JSON.parse(raw) as { userId?: number } : null
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
      await authAxios.post(
        '/auth/verify-email',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      )
    },
    onSuccess: () => {
      toast.success('Xác minh email thành công! Vui lòng đăng nhập')
      navigate('/login')
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Xác minh thất bại')
    }
  })


  
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
         <p className=" text-sm flex items-center gap-1  ">
          {(() => {
            const name = (selectedRole?.name || "").toString().toLowerCase();
            if (name.includes("teach")) return (
              <><BookOpen className='mr-1 text-green-600  '></BookOpen>Giáo Viên </>
            );
            return (
               <><UserIcon size={20} className='text-blue-600'></UserIcon>Thí Sinh </>
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


