import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import Footer from '../components/Footer'

export default function StudentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state: any) => state.auth.user)
  // Chỉ ẩn sidebar khi đang làm bài thi, không ẩn ở trang kết quả
  const isStudentExamPage = location.pathname.includes('/student/exam/join')
  const [_activeTab, setActiveTab] = useState('dashboard')

  const handleLogout = () => {
    dispatch(logout())
    localStorage.clear()
    navigate('/login', { replace: true })
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    switch (tab) {
      case 'dashboard':
        navigate('/student')
        break
      case 'classes':
        navigate('/student/classes')
        break
      case 'history':
        navigate('/student/history')
        break
    }
  }

  // Nếu là trang thi, không hiện header/sidebar
  if (isStudentExamPage) {
    return (
      <>
        <Outlet />
        <Footer />
      </>
    )
  }

  return (
    <div className='bg-slate-50 text-slate-800 overflow-hidden'>
      {/* FIXED HEADER */}
      <header className='fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-6 flex justify-between items-center shadow-sm'>
        <div
          className='flex items-center space-x-3 cursor-pointer hover:opacity-80 transition'
          onClick={() => navigate('/student')}
        >
          <div className='bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg'>
            <i className='fas fa-graduation-cap text-white text-lg'></i>
          </div>
          <span className='text-xl font-bold tracking-tight text-slate-800'>ExamOnlineSystem</span>
        </div>

        <div className='flex items-center space-x-6'>
          <div className='flex items-center space-x-3 border-r pr-6 border-slate-200'>
            <div className='text-right hidden sm:block'>
              <p className='text-sm font-bold text-slate-700'>{user?.name || 'Học sinh'}</p>
              <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>Học sinh</p>
            </div>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Student')}&background=0D8ABC&color=fff`}
              className='w-9 h-9 rounded-full border-2 border-white shadow-sm'
              alt='Avatar'
            />
          </div>
          <button
            onClick={handleLogout}
            className='flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-bold text-sm'
          >
            <i className='fas fa-sign-out-alt'></i>
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className='flex pt-16 h-screen'>
        {/* MAIN SIDEBAR (LEFT BAR) */}
        <aside className='w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0'>
          <nav className='flex-1 px-3 py-6 space-y-2'>
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                location.pathname === '/student'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className='fas fa-home w-8 text-lg'></i>
              <span className='font-bold hidden md:block'>Trang chủ</span>
            </button>
            <button
              onClick={() => handleTabChange('classes')}
              className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                location.pathname.startsWith('/student/classes')
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className='fas fa-users w-8 text-lg'></i>
              <span className='font-bold hidden md:block'>Lớp học</span>
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                location.pathname.startsWith('/student/history')
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className='fas fa-clipboard-list w-8 text-lg'></i>
              <span className='font-bold hidden md:block'>Lịch sử thi</span>
            </button>
          </nav>
          <div className='p-4 border-t border-slate-100'>
            <div className='bg-slate-50 rounded-xl p-3 text-center hidden md:block'>
              <p className='text-[10px] text-slate-400 font-bold uppercase'>Hỗ trợ</p>
              <p className='text-sm font-bold text-blue-600'>1900 1234</p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className='flex-1 overflow-y-auto relative bg-white'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
