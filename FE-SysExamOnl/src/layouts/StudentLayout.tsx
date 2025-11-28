import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function StudentLayout() {
  const location = useLocation()
  const isStudentExamPage = location.pathname.startsWith('/student/exam')

  return (
    <>
      {!isStudentExamPage && <Header />}
      {!isStudentExamPage && location.pathname !== '/student' && (
        <nav className='bg-white shadow-sm border-b'>
          <div className='max-w-7xl mx-auto px-6'>
            <div className='flex space-x-8'>
              <a
                href='/student'
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  location.pathname === '/student'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                Trang chủ
              </a>
              <a
                href='/student/classes'
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  location.pathname.startsWith('/student/classes')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                Lớp học
              </a>
            </div>
          </div>
        </nav>
      )}
      <Outlet />
      <Footer />
    </>
  )
}
