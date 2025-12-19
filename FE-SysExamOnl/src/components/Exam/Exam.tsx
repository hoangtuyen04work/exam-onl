// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Clock, Save, Send } from 'lucide-react'
// import { useSelector } from 'react-redux'
// import QuestionContent from './QuestionContent'

// export default function Exam() {
//   const user = useSelector((state: any) => state.auth.user)
//   const now = new Date()

//   return (
//     <div className='min-h-screen bg-gray-50'>
//       <header className='w-full bg-[#005baa] text-white shadow-md fixed top-0 left-0 right-0 z-50'>
//         <div className='flex items-center justify-between px-30 py-4'>
//           <div className='flex items-center gap-6'>
//             <div>
//               <p className='text-sm opacity-90'>{user?.name}</p>
//               <p className='text-xs opacity-75'>
//                 SBD: {user?.studentId} | Môn thi: Test | Ngày thi: {now.toLocaleDateString()} | Ca thi: 8
//               </p>
//             </div>
//           </div>

//           <div className='flex items-center gap-4'>
//             <div className='flex items-center gap-2 bg-[#0a67b8] px-4 py-2 rounded-lg'>
//               <Clock className='h-4 w-4' />
//               <span className='font-mono text-lg font-bold'>12:00</span>
//             </div>
//             <button
//               className='bg-white text-black px-2 py-1 rounded flex items-center gap-2 hover:bg-white/50 disabled:opacity-50'
//               // onClick={() => saveMutation.mutate()}
//               // disabled={saveMutation.isPending}
//             >
//               <Save className='h-4 w-4' />
//               Lưu
//             </button>

//             <button
//               className='bg-red-500 text-white px-2 py-1 rounded flex items-center gap-2 hover:bg-red-600 disabled:opacity-50'
//               // onClick={handleSubmit}
//               // disabled={submitMutation.isPending}
//             >
//               <Send className='h-4 w-4' />
//               Nộp bài
//             </button>
//           </div>
//         </div>
//       </header>
//       <main className='pt-20 px-6'>
//         <QuestionContent />
//       </main>
//     </div>
//   )
// }
