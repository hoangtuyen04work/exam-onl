// src/layouts/TeacherDashboard.tsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, Database, Users, Settings, LogOut, Menu, X } from "lucide-react";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const teacherName = localStorage.getItem("teacherName") || "Giáo viên";

  const menuItems = [
    { key: "/teacher", icon: Home, label: "Màn hình chính" },
    { key: "/teacher/exams", icon: FileText, label: "Đề thi" },
    { key: "/teacher/questions", icon: Database, label: "Ngân hàng câu hỏi" },
    { key: "/teacher/students", icon: Users, label: "Thí sinh" },
    { key: "/teacher/settings", icon: Settings, label: "Cài đặt" },
  ];

  const activeTabKey =
    [...menuItems]
      .sort((a, b) => b.key.length - a.key.length)
      .find((item) => location.pathname.startsWith(item.key))?.key || "/teacher";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("teacherName");
    navigate("/login");
  };

  return (
    <>
      {/* Background décor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-32 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-32 -right-20 w-80 h-80 bg-gradient-to-tl from-blue-400/30 to-cyan-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="min-h-screen flex">
        {/* SIDEBAR – SIÊU SẠCH KHI THU GỌN */}
        <aside className={`${sidebarOpen ? "w-64" : "w-30"} transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-2xl shadow-2xl border-r border-white/40 flex flex-col z-20`}>
          
          {/* Logo */}
          <div className="p-5 border-b border-gray-200/50 flex items-center justify-center xl:justify-between">
            <div
              className={`flex items-center gap-3 cursor-pointer ${!sidebarOpen && "justify-center w-full"}`}
              onClick={() => navigate("/teacher")}
            >
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                A
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Exam System</h1>
                 
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2.5 rounded-xl hover:bg-gray-100 hidden xl:block"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* MENU – KHÔNG NỀN, KHÔNG VIỀN, CHỈ CÒN ICON ĐẬM */}
          <nav className="flex-1 px-4 pt-6 pb-2">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTabKey === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    className={`w-full flex items-center transition-all rounded-xl group relative
                      ${sidebarOpen ? "px-4 py-3 gap-3 justify-start" : "py-3 justify-center"}
                      ${isActive
                        ? "text-indigo-600 font-semibold bg-indigo-50"
                        : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                      }`}
                  >
                    {/* Icon thuần – không nền, không viền */}
                    <Icon
                      size={sidebarOpen ? 22 : 24}
                      className={isActive ? "text-indigo-600" : ""}
                    />

                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}

                    {/* Tooltip khi thu gọn */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-3 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-50 shadow-2xl">
                        {item.label}
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* USER + LOGOUT */}
          <div className="p-4 border-t border-gray-200/50">
            <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=6366f1&color=fff&bold=true&size=128`}
                alt="avatar"
                className="w-11 h-11 rounded-full ring-4 ring-indigo-100 shadow-lg"
              />
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{teacherName}</p>
                  <p className="text-xs text-gray-500">Giáo viên</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className={`mt-4 w-full flex items-center gap-3 transition-all rounded-xl
                ${sidebarOpen ? "px-4 py-3 justify-start" : "py-3 justify-center"}
                text-red-600 hover:bg-red-50 font-medium`}
            >
              <LogOut size={sidebarOpen ? 22 : 24} />
              {sidebarOpen && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col">
          <header className="xl:hidden bg-white/90 backdrop-blur-2xl shadow-lg border-b border-white/40 z-10">
            <div className="px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="p-3 rounded-xl hover:bg-gray-100"
              >
                <Menu size={26} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="font-bold text-gray-800">Exam System</p>
                  <p className="text-xs text-gray-500">Giáo viên</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50/50 to-indigo-50/30">
            <div className="min-h-full px-6 py-8 lg:px-10 lg:py-10">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}