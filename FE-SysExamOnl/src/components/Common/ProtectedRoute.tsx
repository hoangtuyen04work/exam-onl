import type { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

type User = { role: string } | null
type RootState = { auth: { user: User } }

type Props = {
  children: ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const user = useSelector((state: RootState) => state.auth.user)
  const location = useLocation()

  if (!user) {
    toast.warning('Vui lòng đăng nhập trước!')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error('Bạn không có quyền truy cập vào trang này.')
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}