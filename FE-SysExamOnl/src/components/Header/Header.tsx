import { useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  return (
    <header className='bg-[#005baa] text-white shadow sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto flex items-center justify-between px-6 py-3'>
        <h1 className='text-lg md:text-2xl font-bold tracking-wide uppercase'>HỆ THỐNG THI KMA - SEP</h1>

        <button
          onClick={() => {
            localStorage.removeItem('auth')
            navigate('/login')
          }}
          className='bg-white text-blue-700 font-semibold px-4 py-2 rounded hover:bg-gray-100'
        >
          Đăng xuất
        </button>
      </div>
      <div className='h-[2px] bg-gray-200' />
    </header>
  )
}
