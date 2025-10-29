import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

type Role = {
  id: string | number
  name: string
  code?: string
}

export default function RoleSelectPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchRoles = async () => {
      setLoading(true)
      try {
        const res = await axios.get(
          'http://192.120.4.105:8888/exam-online-system/api/roles'
        )
        if (!mounted) return
        // Hỗ trợ cả 2 dạng: { data: Role[] } hoặc Role[]
        type ApiRole = Partial<Role> & {
          roleId?: string | number
          roleName?: string
        }
        const listRaw: ApiRole[] = Array.isArray(res.data?.data)
          ? (res.data.data as ApiRole[])
          : Array.isArray(res.data)
            ? (res.data as ApiRole[])
            : []
        // Chuẩn hoá: đảm bảo mỗi role có id và name
        const normalized: Role[] = listRaw.map((item, idx) => {
          // Ưu tiên dùng roleId, roleName từ API
          const id = item?.roleId ?? item?.id ?? idx
          const name = item?.roleName ?? item?.name ?? `Role ${idx + 1}`
          const code = item?.code
          return { id, name, code }
        })
        setRoles(normalized)
      } catch {
        toast.error('Không load được danh sách vai trò')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchRoles()
    return () => {
      mounted = false
    }
  }, [])

  const selectRole = (role: Role) => {
    try {
      localStorage.setItem('selectedRole', JSON.stringify({ id: role.id, name: role.name }))
      toast.success(`Chọn vai trò: ${role.name}`)
      navigate('/login')
    } catch {
      toast.error('Không thể lưu lựa chọn vai trò')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{
        backgroundImage: "url('https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser-2048x1245.png')"
      }}
    >
      <div className="bg-white/95 shadow-2xl border-4 border-blue-600 rounded-2xl w-full max-w-md p-8 m-12 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-6">
          <img src='https://actvn.edu.vn/Images/actvn_big_icon.png' alt='Logo' className='w-16 h-16 mb-3' />
          <h1 className='text-center font-semibold text-gray-800'>Phòng Khảo thí & Đảm bảo chất lượng đào tạo</h1>
          <p className='text-blue-800 font-bold text-lg'>Phần Mềm Thi Thử Nghiệm</p>
          
        </div>

        <div className='border border-cyan-500 rounded-lg p-6'>
          <h2 className='text-center font-semibold mb-4'>CHỌN VAI TRÒ</h2>
          {loading ? (
            <p className="text-center">Đang tải vai trò...</p>
          ) : (
            <>
              {roles.length === 0 ? (
                <p className="text-center text-sm text-gray-500">Không có vai trò để hiển thị</p>
              ) : (
                <div className="space-y-3">
                  {roles.map((r) => (
                    <button
                      key={String(r.id)}
                      className="w-full border rounded-lg py-3 hover:bg-blue-50 transition text-left px-4"
                      onClick={() => selectRole(r)}
                    >
                      <div className="font-medium">{r.name}</div>
                      {r.code && <div className="text-xs text-gray-500">{r.code}</div>}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  className="text-blue-600 underline"
                  onClick={() => {
                    localStorage.removeItem('selectedRole')
                    toast.info('Đã bỏ chọn vai trò')
                  }}
                >
                  Bỏ chọn
                </button>
                <button className="text-blue-600 underline" onClick={() => window.location.href = '/login'}>
                  Quay lại đăng nhập
                </button>
              </div>
            </>
          )}
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