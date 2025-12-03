import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function StudentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isStudentExamPage = location.pathname.startsWith('/student/exam')

  const handleHeaderClick = () => {
    navigate('/student')
  }

  return (
    <>
      {!isStudentExamPage && (
        <div onClick={handleHeaderClick} className='cursor-pointer'>
          <Header /> 
        </div>
      )}
      <Outlet />
      <Footer />
    </>
  )
}
