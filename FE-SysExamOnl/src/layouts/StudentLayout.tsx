import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function StudentLayout() {
  const location = useLocation()
  const isStudentExamPage = location.pathname.startsWith('/student/exam')

  return (
    <>
      {!isStudentExamPage && <Header />}
      <Outlet />
      <Footer />
    </>
  )
}
