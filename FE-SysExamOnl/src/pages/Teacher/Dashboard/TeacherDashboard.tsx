import React, { useEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import axiosClient from '../../../api/axiosClient'
import { getBanks } from '../../../api/bankApi'
import { mockExams } from '../../../data/mockData'
import { toast } from 'react-toastify'
import { Home, FileText, Database, Users, Settings } from "lucide-react"

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  const [showMenu, setShowMenu] = useState(false)
  const dropdownRef = useRef(null)
  const menuRef = useRef(null)
  const buttonRefs = useRef({})
  const [connectorLeft, setConnectorLeft] = useState(0)

  const teacherName = localStorage.getItem('teacherName') || 'Giáo viên'

  const tabs = [
    { key: "/teacher", icon: Home, label: "Màn hình chính" },
    { key: "/teacher/exams", icon: FileText, label: "Đề thi" },
    { key: "/teacher/questions", icon: Database, label: "Ngân hàng" },
    { key: "/teacher/students", icon: Users, label: "Thí sinh" },
    { key: "/teacher/settings", icon: Settings, label: "Cài đặt" }
  ]

  // ✅ Xác định tab đang active theo key dài nhất → tránh Home bị active sai
  const activeTabKey = [...tabs]
    .sort((a, b) => b.key.length - a.key.length)
    .find(t => location.pathname.startsWith(t.key))?.key

  useEffect(() => {
    const updatePos = () => {
      const menuEl = menuRef.current
      const activeBtn = buttonRefs.current[activeTabKey]
      if (!menuEl || !activeBtn) return

      const menuRect = menuEl.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()

      const centerX = btnRect.left + btnRect.width / 2
      setConnectorLeft(centerX - menuRect.left)
    }

    setTimeout(updatePos, 50)
    window.addEventListener('resize', updatePos)
    return () => window.removeEventListener('resize', updatePos)
  }, [activeTabKey])

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="bg-blue-400 min-h-screen flex flex-col relative overflow-hidden">

      {/* Header */}
      <div className="bg-blue-400 px-6 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/teacher')}>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">A</div>
          <div>
            <div className="text-lg font-semibold text-white">Exam System</div>
            <div className="text-xs text-blue-100">Quản lý giáo viên</div>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-white/40 mx-6"></div>

        {/* Navigation */}
        <div className="flex-1 flex justify-center relative">
          <div ref={menuRef} className="flex gap-6 relative pb-4">

            {/* Vòng tròn highlight */}
            <div
              className="absolute transition-all duration-300 z-10 rounded-full"
              style={{
                width: 64,
                height: 64,
                top: -6,
                left: connectorLeft - 32,
                backgroundColor: "white",
                boxShadow: "0 3px 12px rgba(0,0,0,0.25)",
              }}
            ></div>

            {/* Icons */}
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTabKey === tab.key

              return (
                <button
                  key={tab.key}
                  ref={el => buttonRefs.current[tab.key] = el}
                  onClick={() => navigate(tab.key)}
                  className={`relative z-20 w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300
                    ${isActive
                      ? "text-blue-600 scale-110 font-semibold"
                      : "text-blue-100 hover:text-white hover:scale-105"}`}
                >
                  <Icon size={28} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Avatar + Menu */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-sm font-medium text-white">{teacherName}</div>
            <div className="text-xs text-blue-100">Giáo viên</div>
          </div>

          <button onClick={() => setShowMenu(prev => !prev)} className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=random&rounded=true`} alt="avatar" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white shadow-lg rounded-md border py-2 z-50">
              <button onClick={() => navigate('/teacher/settings')} className="dropdown-item">Hồ sơ cá nhân</button>
              <div className="border-t my-1" />
              <button onClick={handleLogout} className="dropdown-item text-red-600">Đăng xuất</button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 m-[10px] relative z-10">
        <div className="rounded-2xl shadow-md p-8 w-full min-h-[calc(100vh-120px)] bg-gray-100 border transition-all duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
