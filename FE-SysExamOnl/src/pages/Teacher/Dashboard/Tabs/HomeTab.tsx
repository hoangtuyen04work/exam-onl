import { useNavigate } from 'react-router-dom'

export default function HomeTab() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => navigate('/teacher/exams/create')}
          className="
            px-8 py-4 
            bg-white text-black font-bold rounded-xl 
            shadow-md 
            transition-all duration-300 ease-out
            hover:shadow-xl hover:translate-y-[2px] hover:scale-[1.04]
            active:scale-[0.98]
          "
        >
          + Tạo đề thi
        </button>

        <button
          onClick={() => navigate('/teacher/questions')}
          className="
            px-8 py-4 
            bg-white text-black font-bold rounded-xl 
            shadow-md 
            transition-all duration-300 ease-out
            hover:shadow-xl hover:translate-y-[2px] hover:scale-[1.04]
            active:scale-[0.98]
          "
        >
          + Tạo đề thi từ ngân hàng câu hỏi
        </button>
      </div>
    </div>
  )
}
