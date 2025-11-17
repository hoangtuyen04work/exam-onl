import React, { useEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, FileText, Database, Users, Settings, LogOut, User } from "lucide-react"

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const [showMenu, setShowMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header với hiệu ứng glassmorphism */}
      <header className="bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">

          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/teacher')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
              E
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Exam System</h1>
              <p className="text-xs text-gray-500 -mt-1">Bảng điều khiển giáo viên</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex flex-1 justify-center">
            <div className="flex bg-gray-100/60 backdrop-blur-md rounded-full p-1 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTabKey === tab.key

                return (
                  <button
                    key={tab.key}
                    onClick={() => navigate(tab.key)}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors
                      ${isActive 
                        ? "bg-white text-indigo-700 shadow-sm" 
                        : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
                      }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="flex items-center gap-3 p-2 rounded-full hover:bg-gray-100 transition-all"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-gray-800">{teacherName}</p>
                <p className="text-xs text-gray-500 -mt-1">Giáo viên</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-indigo-200 hover:ring-indigo-400 transition-all">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=6366f1&color=fff&bold=true`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{teacherName}</p>
                  <p className="text-xs text-gray-500">Giáo viên</p>
                </div>
                <button
                  onClick={() => { navigate('/teacher/settings'); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <User size={16} />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl shadow-lg border-t border-gray-100 py-2 z-50">
          <div className="flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTabKey === tab.key

              return (
                <button
                  key={tab.key}
                  onClick={() => navigate(tab.key)}
                  className={`flex flex-col items-center p-2 flex-1 ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 md:p-8 lg:p-10 h-full">
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