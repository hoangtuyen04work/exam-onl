import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { toast } from 'react-toastify'
import axiosClient from '../../../../api/axiosClient'

// --- Icons (Sử dụng SVG nội tuyến đơn giản, bạn có thể thay thế bằng thư viện icon) ---
const IconClock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const IconWifi = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
    />
  </svg>
)

const IconWifiOff = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.364 5.636a1 1 0 00-1.414 0l-1.06 1.06A11.95 11.95 0 0012 4C7.582 4 3.73 6.368 1.94 9.636a1 1 0 000 1.091A14.927 14.927 0 0012 19.889c2.17 0 4.204-.44 6.06-1.228l1.06 1.06a1 1 0 001.414-1.414L5.636 6.364a1 1 0 00-1.414 1.414L18.364 5.636zM12 16.889a4.888 4.888 0 01-4.889-4.889 4.888 4.888 0 014.889-4.889 4.888 4.888 0 014.889 4.889A4.888 4.888 0 0112 16.889z"
    />
  </svg>
)

const IconMonitor = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
)

// --- Types ---
// Định nghĩa lại Type cho Student để chứa nhiều thông tin hơn
type StudentStatus =
  | 'PENDING' // Chưa vào
  | 'JOINED' // Đã vào (Vũ Đức Mạnh)
  | 'IN_PROGRESS' // Đang làm bài (Nguyễn Văn An)
  | 'COMPLETED' // Hoàn thành (Trần Thị Bình)
  | 'DISCONNECTED' // Mất kết nối (Phạm Thu Hà)

type StudentMonitoringInfo = {
  userId: number
  username: string // Tên đầy đủ
  status: StudentStatus
  joinTime: string | null // Thời gian vào thi (ISO string)
  submitTime: string | null // Thời gian nộp bài (ISO string)
  deadline: string | null // Hạn nộp (ISO string)
  isFullScreen: boolean // True: Đang toàn màn, False: Đã thoát toàn màn
}

// Giả định loại sự kiện nhận về từ WebSocket
type IncomingEvent = {
  userId?: number
  username?: string
  event?: {
    event?: string // Tên sự kiện: 'STUDENT_JOINED', 'STUDENT_SUBMITTED', 'STUDENT_DISCONNECTED', 'FULLSCREEN_EXITED' v.v.
    payload?: any
    examSessionId?: number
  }
  timestamp?: string
}

// --- Helper Functions ---
/**
 * Lấy chữ cái đầu tiên của tên
 */
const getInitial = (name: string) => {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts[parts.length - 1][0]?.toUpperCase() || '?'
}

/**
 * Định dạng thời gian từ ISO string hoặc timestamp string
 * Ví dụ: "2025-11-17T14:30:15" -> "14:30:15"
 */
const formatTime = (timeString: string | null) => {
  if (!timeString) return '--:--:--'
  try {
    // Thử parse trực tiếp nếu là ISO string
    const date = new Date(timeString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('vi-VN', { hour12: false })
    }
    // Nếu là string "16:00:00" thì trả về luôn
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString
    }
    return '--:--:--'
  } catch (e) {
    return '--:--:--'
  }
}

/**
 * Trả về text và class màu cho từng trạng thái
 */
const getStatusDisplay = (status: StudentStatus) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { text: 'Đang làm bài', className: 'text-green-600' }
    case 'COMPLETED':
      return { text: 'Hoàn thành', className: 'text-blue-600' }
    case 'JOINED':
      return { text: 'Đã vào', className: 'text-gray-500' }
    case 'DISCONNECTED':
      return { text: 'Mất kết nối', className: 'text-red-600' }
    case 'PENDING':
    default:
      return { text: 'Chưa vào', className: 'text-gray-400' }
  }
}

// --- Main Component ---
export default function TeacherMonitoring() {
  const { examSessionId } = useParams<{ examSessionId: string }>()
  const navigate = useNavigate()

  // Sử dụng Type StudentMonitoringInfo mới
  const [studentList, setStudentList] = useState<StudentMonitoringInfo[]>([])
  // State `events` không còn dùng để render UI chính, nhưng giữ lại để debug (tùy chọn)
  // const [events, setEvents] = useState<IncomingEvent[]>([])

  const clientRef = useRef<Client | null>(null)

  // ---------------------------
  // 1) GỌI API LẤY DANH SÁCH STUDENT
  // ---------------------------
  const fetchStudents = async () => {
    try {
      const res = await axiosClient.get(
        `/teacher/exam-sessions/monitoring/${examSessionId}`
      )

      if (res?.data?.data) {
        // Giả định API trả về danh sách đầy đủ thông tin
        // Cần map dữ liệu API trả về (có thể khác) sang StudentMonitoringInfo
        const initialStudents: StudentMonitoringInfo[] = res.data.data.map(
          (stu: any) => ({
            userId: stu.userId,
            username: stu.username,
            // API cũ chỉ có 'IN_PROGRESS' | 'COMPLETED'
            // Chúng ta cần API trả về trạng thái chi tiết hơn
            // Tạm thời 'map' trạng thái cũ sang trạng thái mới
            status:
              stu.status === 'COMPLETED'
                ? 'COMPLETED'
                : stu.status === 'IN_PROGRESS'
                  ? 'IN_PROGRESS'
                  : 'PENDING', // Mặc định là PENDING nếu chưa rõ
            joinTime: stu.joinTime || null, // Cần API cung cấp
            submitTime: stu.submitTime || null, // Cần API cung cấp
            deadline: stu.deadline || '16:00:00', // Cần API cung cấp (đang hardcode)
            isFullScreen: stu.isFullScreen ?? true, // Cần API cung cấp (đang hardcode)
          })
        )
        setStudentList(initialStudents)
      }
    } catch (error) {
      toast.error('Không lấy được danh sách sinh viên!')
      console.error(error)
    }
  }

  // ---------------------------
  // 2) WEBSOCKET + STOMP KẾT NỐI
  // ---------------------------
  useEffect(() => {
    if (!examSessionId) {
      toast.error('Không có examSessionId')
      navigate('/teacher/exam-sessions/list')
      return
    }

    fetchStudents() // load danh sách khi mở trang

    const token = localStorage.getItem('authToken') || ''

    const socket = new SockJS('http://localhost:8888/exam-online-system/ws')

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log(
          '%c[WS] Connected!',
          'color: yellow; font-weight: bold; background: black'
        )

        const topic = `/topic/exam/${examSessionId}`
        console.log('%c[WS] Subscribe Topic:', 'color: lightblue', topic)

        client.subscribe(
          topic,
          (message) => {
            console.log('%c[WS] RAW MESSAGE:', 'color: orange', message)
            console.log('%c[WS] BODY:', 'color: cyan', message.body)

            try {
              const body: IncomingEvent = JSON.parse(message.body)
              const eventType = body.event?.event
              const payload = body.event?.payload
              const userId = body.userId

              if (!eventType || !userId) {
                console.warn('[WS] Invalid message (no eventType or userId)')
                return
              }

              // --- CẬP NHẬT TRẠNG THÁI SINH VIÊN (LOGIC QUAN TRỌNG) ---
              setStudentList((prevList) =>
                prevList.map((stu) => {
                  if (stu.userId !== userId) {
                    return stu // Không phải sinh viên này, bỏ qua
                  }

                  // Đây đúng là sinh viên, cập nhật trạng thái
                  switch (eventType) {
                    case 'STUDENT_JOINED':
                      return {
                        ...stu,
                        status: 'JOINED',
                        joinTime:
                          payload?.timestamp ?? new Date().toISOString(),
                      }

                    case 'EXAM_STARTED': // Sinh viên bắt đầu làm bài
                      return { ...stu, status: 'IN_PROGRESS' }

                    case 'STUDENT_SUBMITTED':
                      return {
                        ...stu,
                        status: 'COMPLETED',
                        submitTime:
                          payload?.timestamp ?? new Date().toISOString(),
                      }

                    case 'STUDENT_DISCONNECTED':
                      return { ...stu, status: 'DISCONNECTED' }

                    case 'STUDENT_RECONNECTED':
                      // Khi kết nối lại, quay về trạng thái trước đó (trừ khi đã nộp)
                      return {
                        ...stu,
                        status:
                          stu.status === 'COMPLETED'
                            ? 'COMPLETED'
                            : 'IN_PROGRESS',
                      }

                    case 'FULLSCREEN_ENTERED':
                      return { ...stu, isFullScreen: true }

                    case 'FULLSCREEN_EXITED':
                      return { ...stu, isFullScreen: false }

                    // Giữ event cũ để tương thích
                    case 'STUDENT_STATUS_CHANGED':
                      if (payload?.status === 'COMPLETED') {
                        return {
                          ...stu,
                          status: 'COMPLETED',
                          submitTime: new Date().toISOString(),
                        }
                      }
                      if (payload?.status === 'IN_PROGRESS') {
                        return { ...stu, status: 'IN_PROGRESS' }
                      }
                      return stu

                    default:
                      console.warn(`[WS] Unknown event type: ${eventType}`)
                      return stu
                  }
                })
              )
            } catch (err) {
              console.error('Invalid WS message', err)
            }
          },
          {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          }
        )
      },

      onStompError: (frame) => console.error('STOMP error', frame),
      onWebSocketError: (event) => console.error('WebSocket error', event),
    })

    client.activate()
    clientRef.current = client

    return () => {
      try {
        client.deactivate()
      } catch (e) {
        console.warn('Error disconnecting stomp client', e)
      }
      clientRef.current = null
    }
  }, [examSessionId, navigate])

  // ---------------------------
  // 3) TÍNH TOÁN CHO THẺ TỔNG QUAN
  // ---------------------------
  const summary = {
    total: studentList.length,
    inProgress: studentList.filter(
      (s) => s.status === 'IN_PROGRESS' || s.status === 'JOINED'
    ).length,
    completed: studentList.filter((s) => s.status === 'COMPLETED').length,
    disconnected: studentList.filter((s) => s.status === 'DISCONNECTED').length,
  }

  // ---------------------------
  // UI RENDER MỚI
  // ---------------------------
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen" style={{ background: 'linear-gradient(to bottom, #5D50C6, #4A40A8)'}}>
      <div className="max-w-7xl mx-auto">
        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-6">
          <div className='text-white'>
            <h1 className="text-3xl font-bold">Giám Sát Bài Thi</h1>
            <p className="text-sm text-gray-200">
              Theo dõi trạng thái làm bài của học sinh theo thời gian thực
              (phiên #{examSessionId})
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            Quay lại
          </button>
        </div>

        {/* --- Thẻ tổng quan --- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Thông kế tổng quan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Tổng số" value={summary.total} color="gray" />
            <SummaryCard
              title="Đang làm"
              value={summary.inProgress}
              color="green"
            />
            <SummaryCard
              title="Hoàn thành"
              value={summary.completed}
              color="blue"
            />
            <SummaryCard
              title="Mất kết nối"
              value={summary.disconnected}
              color="red"
            />
          </div>
        </div>

        {/* --- Lưới danh sách sinh viên --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentList.length === 0 ? (
            <p className="text-white/70">Không có sinh viên nào trong phiên thi này.</p>
          ) : (
            studentList.map((student) => (
              <StudentCard key={student.userId} student={student} />
            ))
          )}
        </div>

        {/* Có thể giữ lại phần debug log sự kiện nếu muốn */}
        {/* <pre className="text-white mt-10">
          {JSON.stringify(studentList, null, 2)}
        </pre> */}
      </div>
    </div>
  )
}

// ---------------------------
// COMPONENT PHỤ
// ---------------------------

/**
 * Thẻ hiển thị thông tin tổng quan
 */
interface SummaryCardProps {
  title: string
  value: number
  color: 'gray' | 'green' | 'blue' | 'red'
}

function SummaryCard({ title, value, color }: SummaryCardProps) {
  const colorClasses = {
    gray: 'bg-gray-700',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600',
  }

  return (
    <div
      className={`p-6 rounded-xl shadow-lg text-white ${colorClasses[color]}`}
    >
      <div className="text-4xl font-bold">{value}</div>
      <div className="text-sm font-medium uppercase opacity-80">{title}</div>
    </div>
  )
}

/**
 * Thẻ hiển thị thông tin chi tiết của 1 sinh viên
 */
interface StudentCardProps {
  student: StudentMonitoringInfo
}

function StudentCard({ student }: StudentCardProps) {
  const statusDisplay = getStatusDisplay(student.status)
  const avatarBgColor = 'bg-blue-200' // Có thể thay đổi màu theo tên
  const avatarTextColor = 'text-blue-800'

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
      {/* --- Header Thẻ --- */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarBgColor} ${avatarTextColor}`}
          >
            {getInitial(student.username)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {student.username}
            </h3>
            <p className={`text-sm font-medium ${statusDisplay.className}`}>
              {statusDisplay.text}
            </p>
          </div>
        </div>
      </div>

      {/* --- Thông tin thời gian --- */}
      <div className="p-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <IconClock />
          <span>
            Vào lúc: <strong>{formatTime(student.joinTime)}</strong>
          </span>
        </div>
        <div className="flex items-center">
          <IconClock />
          <span>
            Hạn nộp: <strong>{formatTime(student.deadline)}</strong>
          </span>
        </div>
        {student.status === 'COMPLETED' && (
          <div className="flex items-center text-blue-600">
            <IconClock />
            <span>
              Nộp lúc: <strong>{formatTime(student.submitTime)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* --- Footer Thẻ (Trạng thái kết nối) --- */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs font-medium">
        {/* Trạng thái kết nối */}
        {student.status === 'DISCONNECTED' ? (
          <span className="flex items-center text-red-500">
            <IconWifiOff />
            Mất kết nối
          </span>
        ) : (
          <span className="flex items-center text-green-500">
            <IconWifi />
            Kết nối
          </span>
        )}

        {/* Trạng thái toàn màn hình */}
        {/* Logic trong hình: 
          - "Toàn màn" (màu xám): Đang ở chế độ toàn màn hình (Tốt)
          - "Thoát toàn màn" (màu vàng): Đã thoát khỏi toàn màn hình (Cảnh báo)
        */}
        {student.isFullScreen ? (
          <span className="flex items-center text-gray-500">
            <IconMonitor />
            Toàn màn
          </span>
        ) : (
          <span className="flex items-center text-yellow-600">
            <IconMonitor />
            Thoát toàn màn
          </span>
        )}
      </div>
    </div>
  )
}