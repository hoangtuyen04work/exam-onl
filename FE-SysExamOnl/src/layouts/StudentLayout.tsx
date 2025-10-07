import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function StudentLayout() {
  return (
    <>
      <Header />
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        <Outlet />
      </div>
      <Footer />
    </>
  )
}
