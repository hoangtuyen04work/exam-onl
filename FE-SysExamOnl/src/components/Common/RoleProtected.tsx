import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface RoleProtectedProps {
  children: ReactNode
}

// Component này dùng để redirect người dùng đã đăng nhập về trang dashboard
export default function RoleProtected({ children }: RoleProtectedProps) {
  const token = localStorage.getItem('authToken')
  const role = localStorage.getItem('role')

  // Nếu đã login, redirect về dashboard tương ứng
  if (token && role) {
    if (role === 'teacher') {
      return <Navigate to='/teacher' replace />
    } else {
      return <Navigate to='/student' replace />
    }
  }

  return children
}
