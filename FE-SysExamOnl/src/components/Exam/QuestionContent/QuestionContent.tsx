// import { useQuery } from '@tanstack/react-query'
// import type { Question } from '../../../types/questions'
// import { useState, useEffect, useCallback } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { useFullScreen } from '../../../hooks/useFullScreen'
// import { toast } from 'react-toastify'
// import { fetchQuestions } from '../../../api/teacher-api'

// export default function QuestionContent() {
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
//   const [answers, setAnswers] = useState<Record<number, string>>({})
//   const [showPassage, setShowPassage] = useState(true)
//   const [isExamStarted, setIsExamStarted] = useState(false)

//   const { id } = useParams()
//   const navigate = useNavigate()

//   const handleEndExamForced = useCallback(() => {
//     if (isExamStarted) {
//       setIsExamStarted(false)
//       toast.error('Bạn đã thoát chế độ toàn màn hình — bài thi kết thúc!')
//       setTimeout(() => navigate('/student'), 1500)
//     }
//   }, [isExamStarted, navigate])

//   const { requestFullscreen, exitFullscreen } = useFullScreen({
//     onExit: handleEndExamForced,
//     enabled: true,
//     requiredFullscreen: true
//   })

//   const {
//     data: questions,
//     isLoading,
//     error
//   } = useQuery<Question[]>({
//     queryKey: ['questions', id],
//     queryFn: () => fetchQuestions(id),
//     enabled: !!id
//   })

//   const questionList = questions || []

//   useEffect(() => {
//     setCurrentQuestionIndex(0)
//     setAnswers({})
//   }, [id])

//   useEffect(() => {
//     if (questionList && questionList.length > 0) {
//       const currentQuestion = questionList[currentQuestionIndex]
//       setShowPassage(!!currentQuestion?.passage)
//     }
//   }, [currentQuestionIndex, questionList])

//   const handleAnswerSelect = (optionKey: string) => {
//     setAnswers((prev) => ({
//       ...prev,
//       [currentQuestionIndex]: optionKey
//     }))
//   }

//   const handleQuestionNavigation = (index: number) => {
//     setCurrentQuestionIndex(index)
//   }

//   const handleNextQuestion = () => {
//     if (questionList.length > 0 && currentQuestionIndex < questionList.length - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1)
//     }
//   }

//   const handlePrevQuestion = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex((prev) => prev - 1)
//     }
//   }

//   const handleStartExam = async () => {
//     const success = await requestFullscreen()
//     if (success) {
//       setIsExamStarted(true)
//     } else {
//       alert('Trình duyệt chặn chế độ toàn màn hình. Hãy cho phép fullscreen thủ công hoặc thử lại.')
//     }
//   }

//   const handleExitExam = async () => {
//     setIsExamStarted(false)
//     await exitFullscreen()
//     navigate('/student')
//     toast.info('Bạn đã chủ động kết thúc/thoát khỏi bài thi.')
//   }

//   if (!isExamStarted) {
//     return (
//       <div className='fixed top-16 left-0 right-0 bottom-0 bg-white bg-opacity-95 flex items-center justify-center z-40'>
//         <div className='bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center border border-gray-200'>
//           <div className='mb-4'>
//             <svg
//               className='mx-auto h-12 w-12 text-blue-600'
//               fill='none'
//               stroke='currentColor'
//               viewBox='0 0 24 24'
//               xmlns='http://www.w3.org/2000/svg'
//             >
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth='2'
//                 d='M4 8V4m0 0h4M4 4l5 5m11-5v4m0 0h-4m0 0l-5 5m5 5v4m0 0h-4m0 0l-5-5m5-5v-4m0 0h4m0 0l5 5'
//               ></path>
//             </svg>
//           </div>

//           <h2 className='text-xl font-bold text-gray-900 mb-2'>Yêu cầu chế độ toàn màn hình</h2>
//           <p className='text-gray-700 text-sm mb-4'>
//             Để đảm bảo tính công bằng và chống gian lận, bạn cần bật chế độ toàn màn hình để làm bài thi.
//           </p>
//           <p className='text-gray-500 text-xs mb-6'>
//             Hệ thống sẽ giám sát và ghi nhận các hành vi vi phạm như chuyển tab hoặc thoát khỏi toàn màn hình.
//           </p>

//           <button
//             onClick={handleStartExam}
//             className='w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200'
//           >
//             Bắt đầu làm bài
//           </button>
//         </div>
//       </div>
//     )
//   }

//   if (isLoading) {
//     return (
//       <div className='min-h-screen bg-gray-50 py-6'>
//         <div className='container mx-auto px-4'>
//           <div className='flex justify-center items-center min-h-64'>
//             <div className='text-gray-500 text-lg'>Đang tải đề thi...</div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className='min-h-screen bg-gray-50 py-6'>
//         <div className='container mx-auto px-4'>
//           <div className='flex justify-center items-center min-h-64'>
//             <div className='text-red-500 text-lg'>Lỗi khi tải đề thi: {(error as Error).message}</div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!questionList || questionList.length === 0) {
//     return (
//       <div className='min-h-screen bg-gray-50 py-6'>
//         <div className='container mx-auto px-4'>
//           <div className='flex justify-center items-center min-h-64'>
//             <div className='text-gray-500 text-lg'>Không tìm thấy câu hỏi cho đề thi này</div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   const currentQuestion = questionList[currentQuestionIndex]
//   const answeredCount = Object.keys(answers).length
//   const totalQuestions = questionList.length

//   return (
//     <div className='min-h-screen bg-gray-50 py-6'>
//       <div className='container mx-auto px-4'>
//         <div className='flex flex-col lg:flex-row gap-6'>
//           <div className='flex-1'>
//             <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6'>
//               <div className='flex justify-between mb-6'>
//                 <button
//                   onClick={handlePrevQuestion}
//                   disabled={currentQuestionIndex === 0}
//                   className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
//                 >
//                   Câu trước
//                 </button>
//                 <button
//                   onClick={handleNextQuestion}
//                   disabled={currentQuestionIndex === totalQuestions - 1}
//                   className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
//                 >
//                   Câu sau
//                 </button>
//               </div>

//               {showPassage && currentQuestion.passage && (
//                 <div className='mb-8'>
//                   <h2 className='text-lg font-semibold text-gray-900 mb-4'>{currentQuestion.passage.split('\n')[0]}</h2>

//                   <div className='bg-gray-50 rounded-lg p-6 space-y-4 text-justify'>
//                     {currentQuestion.passage
//                       .split('\n')
//                       .slice(1)
//                       .map((paragraph, index) => (
//                         <p key={index} className='text-gray-700 leading-relaxed'>
//                           {paragraph}
//                         </p>
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {/* Current Question */}
//               <div className='pt-6'>
//                 <h3 className='font-semibold text-gray-900 mb-4 text-lg'>
//                   Câu {currentQuestionIndex + 1}. {currentQuestion.question}
//                 </h3>

//                 <div className='space-y-3'>
//                   {Object.entries(currentQuestion.options).map(([key, value]) => (
//                     <div
//                       key={key}
//                       className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${
//                         answers[currentQuestionIndex] === key
//                           ? 'border-blue-500 bg-blue-50'
//                           : 'border-gray-200 hover:bg-gray-50'
//                       }`}
//                       onClick={() => handleAnswerSelect(key)}
//                     >
//                       <input
//                         type='radio'
//                         id={`option-${key}`}
//                         name={`question-${currentQuestionIndex}`}
//                         checked={answers[currentQuestionIndex] === key}
//                         onChange={() => handleAnswerSelect(key)}
//                         className='h-4 w-4 text-blue-600 focus:ring-blue-500'
//                       />
//                       <label htmlFor={`option-${key}`} className='ml-3 text-gray-700 cursor-pointer flex-1'>
//                         {key}. {value}
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Sidebar - Right Side */}
//           <div className='w-full lg:w-80'>
//             <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6'>
//               <div className='text-center mb-2'>
//                 <button onClick={handleExitExam} className='text-red-600 hover:text-red-700 font-medium text-sm'>
//                   Thoát
//                 </button>
//               </div>

//               <h3 className='font-semibold text-gray-900 mb-4 text-center'>
//                 Số câu đã trả lời:{' '}
//                 <span className='text-blue-600'>
//                   {answeredCount}/{totalQuestions}
//                 </span>
//               </h3>

//               {/* Question Grid */}
//               <div className='grid grid-cols-5 gap-3 mb-6'>
//                 {questionList.map((_, index) => {
//                   const isAnswered = answers[index] !== undefined
//                   const isCurrent = index === currentQuestionIndex

//                   return (
//                     <button
//                       key={index}
//                       onClick={() => handleQuestionNavigation(index)}
//                       className={`
//                         aspect-square rounded-lg border-2 font-semibold text-sm transition-all hover:scale-105
//                         ${
//                           isCurrent
//                             ? 'border-blue-600 bg-blue-600 text-white shadow-md'
//                             : isAnswered
//                               ? 'border-green-500 bg-green-50 text-green-700'
//                               : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
//                         }
//                       `}
//                     >
//                       {index + 1}
//                     </button>
//                   )
//                 })}
//               </div>

//               {/* Legend */}
//               <div className='space-y-3 text-sm border-t pt-4'>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-5 h-5 rounded border-2 border-blue-600 bg-blue-600' />
//                   <span className='text-gray-700'>Câu hiện tại</span>
//                 </div>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-5 h-5 rounded border-2 border-green-500 bg-green-50' />
//                   <span className='text-gray-700'>Đã trả lời</span>
//                 </div>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-5 h-5 rounded border-2 border-gray-300 bg-white' />
//                   <span className='text-gray-700'>Chưa trả lời</span>
//                 </div>
//               </div>

//               {/* Progress Summary */}
//               <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
//                 <div className='flex justify-between text-sm text-gray-600 mb-2'>
//                   <span>Tiến độ:</span>
//                   <span>{totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0}%</span>
//                 </div>
//                 <div className='w-full bg-gray-200 rounded-full h-2'>
//                   <div
//                     className='bg-green-500 h-2 rounded-full transition-all duration-300'
//                     style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
