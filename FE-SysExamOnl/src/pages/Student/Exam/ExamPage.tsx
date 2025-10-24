/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { fetchExams } from '../../../api/mock-api'

export default function ExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const user = useSelector((state: any) => state.auth.user)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [timeLeft, setTimeLeft] = useState(3600) // 60 phút = 3600 giây

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams
  })

  const exam = exams?.find((e: any) => e.id === examId)

  useEffect(() => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập trước!')
      navigate('/login')
      return
    }

    if (!exam) {
      toast.error('Không tìm thấy bài thi!')
      navigate('/student')
      return
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [user, exam, navigate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmitExam = () => {
    const totalQuestions = exam?.questions?.length || 0
    const answeredQuestions = Object.keys(answers).length
    const unansweredQuestions = totalQuestions - answeredQuestions

    if (unansweredQuestions > 0) {
      const confirmSubmit = window.confirm(
        `Bạn còn ${unansweredQuestions} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`
      )
      if (!confirmSubmit) return
    }

    // Tính điểm (mock)
    const score = Math.floor((answeredQuestions / totalQuestions) * 100)
    
    toast.success(`Bạn đã hoàn thành bài thi! Điểm: ${score}/100`)
    navigate('/student')
  }

  const handleNextQuestion = () => {
    if (currentQuestion < (exam?.questions?.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải bài thi...</p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>Không tìm thấy bài thi</h2>
          <p className='text-gray-600 mb-4'>Bài thi không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/student')}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  const currentQ = exam.questions?.[currentQuestion]
  const totalQuestions = exam.questions?.length || 0

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='max-w-6xl mx-auto flex justify-between items-center'>
          <div>
            <h1 className='text-xl font-semibold text-gray-800'>{exam.name}</h1>
            <p className='text-sm text-gray-600'>Thí sinh: {user?.name} - {user?.studentId}</p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2 text-red-600'>
              <Clock className='w-5 h-5' />
              <span className='font-mono text-lg font-semibold'>{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={handleSubmitExam}
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2'
            >
              <CheckCircle className='w-4 h-4' />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Question Navigation */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-md p-4 sticky top-8'>
              <h3 className='font-semibold text-gray-800 mb-4'>Danh sách câu hỏi</h3>
              <div className='grid grid-cols-5 gap-2'>
                {Array.from({ length: totalQuestions }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                      index === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : answers[`q${index}`]
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className='mt-4 text-xs text-gray-600'>
                <div className='flex items-center space-x-2 mb-1'>
                  <div className='w-3 h-3 bg-blue-600 rounded'></div>
                  <span>Đang làm</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-green-100 border border-green-300 rounded'></div>
                  <span>Đã trả lời</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className='lg:col-span-3'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-lg font-semibold text-gray-800'>
                  Câu {currentQuestion + 1} / {totalQuestions}
                </h2>
                <span className='text-sm text-gray-500'>
                  {currentQ?.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}
                </span>
              </div>

              {currentQ && (
                <div className='space-y-6'>
                  <div className='prose max-w-none'>
                    <p className='text-gray-800 leading-relaxed'>{currentQ.question}</p>
                  </div>

                  {currentQ.type === 'multiple-choice' && currentQ.options && (
                    <div className='space-y-3'>
                      {currentQ.options.map((option: string, index: number) => (
                        <label
                          key={index}
                          className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer'
                        >
                          <input
                            type='radio'
                            name={`question-${currentQuestion}`}
                            value={option}
                            checked={answers[`q${currentQuestion}`] === option}
                            onChange={(e) => handleAnswerChange(`q${currentQuestion}`, e.target.value)}
                            className='w-4 h-4 text-blue-600'
                          />
                          <span className='text-gray-700'>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'essay' && (
                    <div>
                      <textarea
                        value={answers[`q${currentQuestion}`] || ''}
                        onChange={(e) => handleAnswerChange(`q${currentQuestion}`, e.target.value)}
                        placeholder='Nhập câu trả lời của bạn...'
                        className='w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className='flex justify-between mt-8 pt-6 border-t border-gray-200'>
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Câu trước
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === totalQuestions - 1}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Câu tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
