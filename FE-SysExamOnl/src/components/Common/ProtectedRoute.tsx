import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
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

  const isUnauthenticated = useMemo(() => !user, [user])
  const isUnauthorized = useMemo(() => {
    if (!user) return false
    if (!allowedRoles || allowedRoles.length === 0) return false
    return !allowedRoles.includes(user.role)
  }, [user, allowedRoles])

  useEffect(() => {
    if (isUnauthenticated) {
      toast.warning('Vui lòng đăng nhập trước!')
    } else if (isUnauthorized) {
      toast.error('Bạn không có quyền truy cập vào trang này.')
    }
  }, [isUnauthenticated, isUnauthorized])

  if (isUnauthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (isUnauthorized) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}