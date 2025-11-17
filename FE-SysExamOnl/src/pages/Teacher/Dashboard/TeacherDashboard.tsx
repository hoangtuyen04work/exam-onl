import React, { useEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, FileText, Database, Users, Settings, LogOut, User } from "lucide-react"

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const [showMenu, setShowMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [connectorLeft, setConnectorLeft] = useState(0)

  const teacherName = localStorage.getItem('teacherName') || 'Giáo viên'

  const tabs = [
    { key: "/teacher", icon: Home, label: "Màn hình chính" },
    { key: "/teacher/exams", icon: FileText, label: "Đề thi" },
    { key: "/teacher/questions", icon: Database, label: "Ngân hàng" },
    { key: "/teacher/students", icon: Users, label: "Thí sinh" },
    { key: "/teacher/settings", icon: Settings, label: "Cài đặt" }
  ]

  // Xác định tab active chính xác theo key dài nhất
  const activeTabKey = [...tabs]
    .sort((a, b) => b.key.length - a.key.length)
    .find(t => location.pathname.startsWith(t.key))?.key

  // Cập nhật vị trí highlight
  useEffect(() => {
    const updatePos = () => {
      const menuEl = menuRef.current
      const activeBtn = buttonRefs.current[activeTabKey || '']
      if (!menuEl || !activeBtn) return

      const menuRect = menuEl.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()
      const centerX = btnRect.left + btnRect.width / 2
      setConnectorLeft(centerX - menuRect.left)
    }

    const timer = setTimeout(updatePos, 50)
    window.addEventListener('resize', updatePos)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePos)
    }
  }, [activeTabKey])

  // Đóng menu khi click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('teacherName')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col overflow-hidden">
      {/* Header với hiệu ứng glassmorphism */}
      <header className="relative bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/teacher')}
          >
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Exam System</h1>
              <p className="text-xs text-gray-500">Bảng điều khiển giáo viên</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex-1 flex justify-center">
            <div ref={menuRef} className="flex gap-1 bg-white/60 backdrop-blur-md rounded-full px-3 py-2 shadow-inner border border-white/40">

              {/* Highlight Circle */}
              <div
                className="absolute z-10 transition-all duration-300 ease-out"
                style={{
                  width: 48,
                  height: 48,
                  top: '50%',
                  left: connectorLeft - 24,
                  transform: 'translateY(-50%)',
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg opacity-90 scale-110"></div>
              </div>

              {/* Tab Buttons */}
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTabKey === tab.key

                return (
                  <button
                    key={tab.key}
                    ref={el => buttonRefs.current[tab.key] = el}
                    onClick={() => navigate(tab.key)}
                    className={`relative z-20 flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 group
                      ${isActive 
                        ? "text-white font-bold" 
                        : "text-gray-600 hover:text-indigo-600"
                      }`}
                  >
                    <Icon size={22} className="transition-transform group-hover:scale-110" />
                    <span className={`text-[10px] mt-1 font-medium transition-all ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {tab.label.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="flex items-center gap-3 p-2 rounded-full hover:bg-white/60 transition-all group"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-gray-700">{teacherName}</p>
                <p className="text-xs text-gray-500">Giáo viên</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-indigo-200 group-hover:ring-indigo-400 transition-all">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=6366f1&color=fff&bold=true`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-14 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{teacherName}</p>
                  <p className="text-xs text-gray-500">giáo viên</p>
                </div>
                <button
                  onClick={() => { navigate('/teacher/settings'); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors"
                >
                  <User size={16} />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 md:p-8 lg:p-10 min-h-[calc(100vh-140px)] transition-all duration-300">
          <Outlet />
        </div>
      </main>

      {/* Optional: Floating background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-blue-300/30 to-indigo-300/30 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}