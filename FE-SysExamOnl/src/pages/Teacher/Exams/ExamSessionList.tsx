// import { useEffect, useState, useCallback } from 'react';
// import api from '../../../api/axiosClient';
// import { Trash2 } from 'lucide-react';
// import { toast } from 'react-toastify';
// import type {ExamSessionResponse} from '../../../api/exam-api';
// import type { PageResponse } from '../../../types/class.type';

// export default function ExamSessionList() {
//   const [sessions, setSessions] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState()

//   const fetchSessions = useCallback(async () => {
//     setLoading(true); setError(undefined)
//     try {
//       const res = await api.get('/api/teacher/exam-sessions')
//       console.log("resseseses", res)
//       setSessions(res.data?.data || res.data || [])
//     } catch (err) {
//       setError('Lỗi lấy danh sách phiên thi');
//       toast.error('Lỗi lấy danh sách phiên thi')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => { fetchSessions() }, [fetchSessions])

//   const handleDelete = async (sessionId) => {
//     if (!window.confirm('Bạn có chắc muốn xóa phiên thi này?')) return
//     try {
//       await api.delete(`/api/teacher/exam-sessions/${sessionId}`)
//       setSessions(sessions.filter(s => s.id !== sessionId))
//       toast.success('Đã xóa phiên thi')
//     } catch {
//       toast.error('Không xóa được phiên thi!')
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-6 py-8 max-w-6xl">
//         <h1 className="text-2xl font-semibold mb-6">Quản lý phiên thi đã giao</h1>
//         {loading ? (
//           <div className="text-center py-16">Đang tải danh sách phiên thi...</div>
//         ) : error ? (
//           <div className="text-center py-16 text-red-600">{error}</div>
//         ) : sessions.length === 0 ? (
//           <div className="text-center py-12 text-gray-500"><p className="text-lg">Chưa có phiên thi nào được giao</p></div>
//         ) : (
//           <div className="grid gap-4">
//             {sessions.map(s => (
//               <div key={s.id} className="p-6 border rounded-lg bg-white shadow-sm flex items-center justify-between">
//                 <div>
//                   <div className="font-semibold text-gray-900">Mã phiên: {s.id}</div>
//                   <div className="text-gray-600">Đề thi: {s.examName || s.examId}</div>
//                   <div className="text-gray-600">Ngày: {s.date || (s.createdAt && new Date(s.createdAt).toLocaleString('vi-VN'))}</div>
//                   <div className="text-gray-600">Trạng thái: {s.status || 'N/A'}</div>
//                 </div>
//                 <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa phiên thi"><Trash2 className="w-4 h-4" /></button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
