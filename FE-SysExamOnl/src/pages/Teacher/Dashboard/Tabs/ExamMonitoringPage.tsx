import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import { Clock, Users, CheckCircle, LogOut, Loader2, HourglassIcon } from 'lucide-react'
import SockJS from 'sockjs-client'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

// Các event từ backend
type StudentEventType =
  | 'WAITING'
  | 'ENTER'
  | 'LEAVE'
  | 'FOCUS_LOST'
  | 'FOCUS_REGAINED'
  | 'TAB_SWITCH'
  | 'SUBMIT'
  | 'DISCONNECTED'
  | 'RECONNECTED'
  | 'FULLSCREEN_EXIT'
  | 'WINDOW_RESIZE'

interface StudentEvent {
  examSessionId: number
  event: StudentEventType
}

interface StudentEventBroadcast {
  userId: number
  username: string
  event: StudentEvent
}

interface StudentStatusResponse {
  userId: number
  username: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FOCUS_LOST' | 'DISCONNECTED'
  timestamp: string
}

// 4 trạng thái hiển thị chính
type DisplayStatus = 'IN_PROGRESS' | 'EXIT_SCREEN' | 'COMPLETED' | 'WAITING'

type StudentDetail = {
  name: string
  lastEvent: StudentEventBroadcast | null
  currentStatus: DisplayStatus
  timestamp?: string
  exitCount: number // Số lần thoát màn hình
}

// Hàm map event sang DisplayStatus
function mapEventToDisplayStatus(eventType: StudentEventType, currentStatus?: DisplayStatus): DisplayStatus {
  switch (eventType) {
    // Đang làm bài
    case 'ENTER':
    case 'RECONNECTED':
    case 'FOCUS_REGAINED':
    case 'FOCUS_LOST':
    case 'TAB_SWITCH':
    case 'WINDOW_RESIZE':
      return 'IN_PROGRESS'

    // Thoát màn hình
    case 'LEAVE':
    case 'FULLSCREEN_EXIT':
    case 'DISCONNECTED':
      return 'EXIT_SCREEN'

    // Đã hoàn thành
    case 'SUBMIT':
      return 'COMPLETED'

    // Đang đợi
    case 'WAITING':
      return 'WAITING'

    default:
      return currentStatus || 'WAITING'
  }
}

// Kiểm tra event có phải là thoát màn hình không
function isExitEvent(eventType: StudentEventType): boolean {
  return ['LEAVE', 'FULLSCREEN_EXIT', 'DISCONNECTED'].includes(eventType)
}

export default function ExamMonitoringPage() {
  const { examSessionId: paramId } = useParams<{ examSessionId: string }>()
  const [examSessionId] = useState(paramId || '28')
  const [connected, setConnected] = useState(false)

  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || ''

  const [studentDetails, setStudentDetails] = useState<Map<number, StudentDetail>>(new Map())

  const token = localStorage.getItem('authToken') || ''

  // Fetch danh sách sinh viên tham gia từ API
  useEffect(() => {
    if (!token) return

    const fetchParticipants = async () => {
      try {
        const response = await fetch(`${serverPort}/api/teacher/exam-sessions/monitoring/${examSessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          console.error('Lỗi fetch danh sách sinh viên:', response.status)
          return
        }

        const data = await response.json()
        console.log('Fetch participants response:', data)

        const participants: StudentStatusResponse[] = data.data || []

        const updatedMap = new Map<number, StudentDetail>()

        participants.forEach((participant) => {
          let displayStatus: DisplayStatus = 'WAITING'
          if (participant.status === 'IN_PROGRESS') {
            displayStatus = 'IN_PROGRESS'
          } else if (participant.status === 'COMPLETED') {
            displayStatus = 'COMPLETED'
          } else if (participant.status === 'DISCONNECTED') {
            displayStatus = 'EXIT_SCREEN'
          }

          updatedMap.set(participant.userId, {
            name: participant.username || `Sinh viên ${participant.userId}`,
            lastEvent: null,
            currentStatus: displayStatus,
            timestamp: participant.timestamp,
            exitCount: 0
          })
        })

        setStudentDetails(updatedMap)
      } catch (err) {
        console.error('Lỗi fetch participants:', err)
      }
    }

    fetchParticipants()
  }, [token, examSessionId, serverPort])

  useEffect(() => {
    if (!token) {
      alert('Vui lòng đăng nhập để xem monitoring!')
      return
    }
    console.log('Kết nối tới WebSocket...', serverPort)

    const client = new Client({
      webSocketFactory: () => new SockJS(serverPort + '/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        if (str.includes('ERROR') || str.includes('CONNECTED') || str.includes('DISCONNECT')) {
          console.log('[WS Debug]', str)
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    })

    client.onConnect = () => {
      setConnected(true)
      console.log('[WS] ✅ Connected, subscribing to /topic/exam/' + examSessionId)

      client.subscribe(`/topic/exam/${examSessionId}`, (message) => {
        console.log('[WS] 📥 Raw message:', message.body)
        try {
          const broadcast: StudentEventBroadcast = JSON.parse(message.body)
          const eventType = broadcast.event.event
          console.log('[WS] ✅ Event:', eventType, 'from user:', broadcast.userId)

          const name = broadcast.username || 'Sinh viên ' + broadcast.userId
          const newStatus = mapEventToDisplayStatus(eventType)

          setStudentDetails((prev) => {
            const newMap = new Map(prev)
            const existing = prev.get(broadcast.userId)

            // Tăng exitCount nếu là event thoát màn hình
            const exitCount = (existing?.exitCount || 0) + (isExitEvent(eventType) ? 1 : 0)

            newMap.set(broadcast.userId, {
              name,
              lastEvent: broadcast,
              currentStatus: newStatus,
              timestamp: existing?.timestamp,
              exitCount
            })
            return newMap
          })
        } catch (err) {
          console.error(`Lỗi parse message: ${err}`)
        }
      })
    }

    client.onStompError = () => setConnected(false)
    client.onWebSocketError = () => setConnected(false)
    client.onWebSocketClose = () => setConnected(false)

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [token, examSessionId, serverPort])

  // Đếm số lượng theo từng trạng thái
  const studentList = Array.from(studentDetails.entries()).sort((a, b) => a[0] - b[0])
  const inProgressCount = studentList.filter(([, d]) => d.currentStatus === 'IN_PROGRESS').length
  const exitScreenCount = studentList.filter(([, d]) => d.currentStatus === 'EXIT_SCREEN').length
  const completedCount = studentList.filter(([, d]) => d.currentStatus === 'COMPLETED').length
  const waitingCount = studentList.filter(([, d]) => d.currentStatus === 'WAITING').length

  // Config cho từng trạng thái
  const getStatusConfig = (status: DisplayStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          label: 'Đang làm bài',
          icon: <Loader2 className='w-4 h-4 animate-spin' />,
          badgeColor: 'bg-green-500',
          cardBg: 'bg-green-50 hover:bg-green-100 border-green-200'
        }
      case 'EXIT_SCREEN':
        return {
          label: 'Thoát màn hình',
          icon: <LogOut className='w-4 h-4' />,
          badgeColor: 'bg-red-500',
          cardBg: 'bg-red-50 hover:bg-red-100 border-red-200'
        }
      case 'COMPLETED':
        return {
          label: 'Đã hoàn thành',
          icon: <CheckCircle className='w-4 h-4' />,
          badgeColor: 'bg-blue-500',
          cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
        }
      case 'WAITING':
      default:
        return {
          label: 'Đang đợi',
          icon: <HourglassIcon className='w-4 h-4' />,
          badgeColor: 'bg-gray-400',
          cardBg: 'bg-gray-50 hover:bg-gray-100 border-gray-200'
        }
    }
  }

  return (
    <div className='min-h-screen bg-[#f3f4ff] p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Giám sát phòng thi</h1>
              <p className='text-gray-600 mt-1'>
                Phòng thi ID: <span className='font-semibold'>{examSessionId}</span>
              </p>
            </div>

            <div className='flex items-center gap-4'>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {connected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
              </div>
            </div>
          </div>

          {/* Thống kê */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 text-center'>
              <p className='text-2xl font-bold text-green-600'>{inProgressCount}</p>
              <p className='text-sm text-green-700'>Đang làm bài</p>
            </div>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-center'>
              <p className='text-2xl font-bold text-red-600'>{exitScreenCount}</p>
              <p className='text-sm text-red-700'>Thoát màn hình</p>
            </div>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 text-center'>
              <p className='text-2xl font-bold text-blue-600'>{completedCount}</p>
              <p className='text-sm text-blue-700'>Đã hoàn thành</p>
            </div>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
              <p className='text-2xl font-bold text-gray-600'>{waitingCount}</p>
              <p className='text-sm text-gray-700'>Đang đợi</p>
            </div>
          </div>
        </div>

        {/* Grid các card sinh viên */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {studentList.map(([userId, details], index) => {
            const config = getStatusConfig(details.currentStatus)

            let timeDisplay = ''
            if (details.timestamp) {
              try {
                timeDisplay = formatDistanceToNow(new Date(details.timestamp), {
                  addSuffix: true,
                  locale: vi
                })
              } catch {
                timeDisplay = ''
              }
            }

            return (
              <div
                key={userId}
                className={`rounded-xl shadow-sm p-4 flex flex-col items-center text-center transition-all duration-300 border ${config.cardBg}`}
              >
                {/* Badge trạng thái */}
                <div
                  className={`mb-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.badgeColor} text-white`}
                >
                  {config.icon}
                  {config.label}
                </div>

                {/* Số thứ tự */}
                <p className='text-lg font-semibold text-gray-800'>#{index + 1}</p>

                {/* Tên */}
                <p className='text-base font-medium text-gray-900 mt-1 truncate w-full'>{details.name}</p>

                {/* Số lần thoát màn hình */}
                {details.exitCount > 0 && (
                  <p className='text-xs text-red-600 mt-2 font-medium'>
                    ⚠️ Thoát {details.exitCount} lần
                  </p>
                )}

                {/* Thời gian */}
                {timeDisplay && (
                  <p className='text-xs text-gray-500 mt-2 flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    {timeDisplay}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {studentList.length === 0 && (
          <div className='text-center py-12 bg-white rounded-xl'>
            <Users className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-500'>Chưa có sinh viên nào tham gia phiên thi này.</p>
          </div>
        )}
      </div>
    </div>
  )
}
