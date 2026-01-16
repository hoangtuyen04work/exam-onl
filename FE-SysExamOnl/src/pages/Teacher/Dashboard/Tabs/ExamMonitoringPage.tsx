import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import { LogIn, LogOut, Clock } from 'lucide-react'
import SockJS from 'sockjs-client'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

interface StudentEvent {
  examSessionId: number
  event:
    | 'WAITING'
    | 'ENTER'
    | 'LEAVE'
    | 'FOCUS_LOST'
    | 'FOCUS_REGAINED'
    | 'SUBMIT'
    | 'TAB_SWITCH'
    | 'DISCONNECTED'
    | 'RECONNECTED'
}

interface StudentEventBroadcast {
  userId: number
  username: string
  event: StudentEvent
}

interface StudentStatusResponse {
  userId: number
  username: string
  fullName: string
  email: string
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'FOCUS_LOST' | 'DISCONNECTED' | 'LEFT'
  timestamp: string
}

type StudentDetail = {
  name: string
  email?: string
  lastEvent: StudentEventBroadcast | null
  currentStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'FOCUS_LOST' | 'LEFT' | 'DISCONNECTED' | 'UNKNOWN'
  timestamp?: string
  focusLostCount?: number
  tabSwitchCount?: number
}

export default function ExamMonitoringPage() {
  const [onlineStudents, setOnlineStudents] = useState<Set<number>>(new Set())
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

        // Tạo Map mới và Set mới một lần thôi
        const updatedMap = new Map<number, StudentDetail>()
        const onlineSet = new Set<number>()

        participants.forEach((participant) => {
          const isOnline = participant.status === 'IN_PROGRESS'

          if (isOnline) {
            onlineSet.add(participant.userId)
          }

          // Map status từ backend sang frontend
          let currentStatus:
            | 'WAITING'
            | 'IN_PROGRESS'
            | 'COMPLETED'
            | 'FOCUS_LOST'
            | 'LEFT'
            | 'DISCONNECTED'
            | 'UNKNOWN' = 'UNKNOWN'
          switch (participant.status) {
            case 'WAITING':
              currentStatus = 'WAITING'
              break
            case 'IN_PROGRESS':
              currentStatus = 'IN_PROGRESS'
              break
            case 'COMPLETED':
              currentStatus = 'COMPLETED'
              break
            case 'FOCUS_LOST':
              currentStatus = 'FOCUS_LOST'
              break
            case 'DISCONNECTED':
              currentStatus = 'DISCONNECTED'
              break
            case 'LEFT':
              currentStatus = 'LEFT'
              break
            default:
              currentStatus = 'UNKNOWN'
          }

          updatedMap.set(participant.userId, {
            name: participant.fullName || participant.username || `Sinh viên ${participant.userId}`,
            email: participant.email,
            lastEvent: null,
            currentStatus,
            timestamp: participant.timestamp
          })
        })

        // Cập nhật state 1 lần — tránh rerender nhiều
        setStudentDetails(updatedMap)
        setOnlineStudents(onlineSet)
      } catch (err) {
        console.error('Lỗi fetch participants:', err)
      }
    }

    fetchParticipants()
  }, [token, examSessionId])

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
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    })

    client.onConnect = () => {
      setConnected(true)
      console.log('[Teacher WS] ✅ Connected to WebSocket')

      // Subscribe với logging chi tiết
      const topic = `/topic/exam/${examSessionId}`
      console.log('[Teacher WS] 📡 Subscribing to:', topic)
      
      const subscription = client.subscribe(topic, (message) => {
        console.log('[Teacher WS] 📨 Received message:', message.body)
        
        try {
          const broadcast: StudentEventBroadcast = JSON.parse(message.body)
          console.log('[Teacher WS] 📊 Parsed broadcast:', broadcast)

          const name = broadcast.username || 'Sinh viên ' + broadcast.userId

          // Cập nhật chi tiết sinh viên
          setStudentDetails((prev) => {
            const newMap = new Map(prev)
            const existing = prev.get(broadcast.userId)

            // Xác định currentStatus dựa trên event
            let newStatus:
              | 'WAITING'
              | 'IN_PROGRESS'
              | 'COMPLETED'
              | 'FOCUS_LOST'
              | 'LEFT'
              | 'DISCONNECTED'
              | 'UNKNOWN' = 'UNKNOWN'
            switch (broadcast.event.event) {
              case 'WAITING':
                newStatus = 'WAITING'
                break
              case 'ENTER':
                newStatus = 'IN_PROGRESS'
                break
              case 'SUBMIT':
                newStatus = 'COMPLETED'
                break
              case 'FOCUS_LOST':
                newStatus = 'FOCUS_LOST'
                break
              case 'LEAVE':
                newStatus = 'LEFT'
                break
              case 'DISCONNECTED':
                newStatus = 'DISCONNECTED'
                break
              case 'FOCUS_REGAINED':
              case 'RECONNECTED':
              case 'TAB_SWITCH':
                newStatus = 'IN_PROGRESS'
                break
              default:
                newStatus = existing?.currentStatus || 'UNKNOWN'
            }

            console.log('[Teacher WS] 🔄 Updating student:', {
              userId: broadcast.userId,
              name,
              event: broadcast.event.event,
              oldStatus: existing?.currentStatus,
              newStatus
            })

            newMap.set(broadcast.userId, {
              name,
              lastEvent: broadcast,
              currentStatus: newStatus,
              timestamp: new Date().toISOString() // Cập nhật timestamp khi nhận event
            })
            return newMap
          })

          // Cập nhật online/offline
          if (broadcast.event.event === 'ENTER' || broadcast.event.event === 'RECONNECTED') {
            setOnlineStudents((prev) => new Set(prev).add(broadcast.userId))
            console.log('[Teacher WS] 🟢 Student online:', broadcast.userId)
          } else if (
            broadcast.event.event === 'LEAVE' ||
            broadcast.event.event === 'SUBMIT' ||
            broadcast.event.event === 'DISCONNECTED'
          ) {
            setOnlineStudents((prev) => {
              const next = new Set(prev)
              next.delete(broadcast.userId)
              console.log('[Teacher WS] 🔴 Student offline:', broadcast.userId)
              return next
            })
          }
        } catch (err) {
          console.error(`[Teacher WS] ❌ Parse error:`, err)
        }
      })
      
      console.log('[Teacher WS] 📝 Subscription created:', subscription.id)
    }

    client.onStompError = (frame) => {
      setConnected(false)
      console.error('[Teacher WS] ❌ STOMP Error:', frame.headers['message'])
      console.error('[Teacher WS] Error details:', frame.body)
    }

    client.onWebSocketError = (error) => {
      setConnected(false)
      console.error('[Teacher WS] ❌ WebSocket Error:', error)
    }

    client.onWebSocketClose = (event) => {
      setConnected(false)
      console.warn('[Teacher WS] ⚠️ WebSocket closed:', event)
    }

    console.log('[Teacher WS] 🚀 Activating WebSocket client...')
    client.activate()

    return () => {
      console.log('[Teacher WS] 🔌 Deactivating WebSocket client...')
      client.deactivate()
    }
  }, [token, examSessionId, serverPort])

  // Lấy danh sách sinh viên từ studentDetails
  const studentList = Array.from(studentDetails.entries()).sort((a, b) => a[0] - b[0]) // Sắp xếp theo userId

  return (
    <div className='min-h-screen bg-[#f3f4ff] p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Giám sát phòng thi</h1>
              <p className='text-gray-600 mt-1'>
                Phòng thi ID: <span className='font-semibold'>{examSessionId}</span>
              </p>
            </div>
            <div className='flex items-center gap-6'>
              <div className='text-right'>
                <p className='text-sm text-gray-500'>Sinh viên đang online</p>
                <p className='text-3xl font-bold text-green-600'>{onlineStudents.size}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {connected ? 'Đã kết nối' : 'Mất kết nối'}
              </div>
            </div>
          </div>
        </div>

        {/* Grid các card sinh viên - giống ảnh */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8'>
          {studentList.map(([userId, details], index) => {
            const currentStatus = details.currentStatus

            // Xác định label và màu sắc dựa trên currentStatus
            let statusLabel: string
            let isActive: boolean
            let badgeColor: string

            switch (currentStatus) {
              case 'WAITING':
                statusLabel = 'Đang chờ vào'
                isActive = false
                badgeColor = 'bg-purple-500'
                break
              case 'IN_PROGRESS':
                statusLabel = 'Đang làm bài'
                isActive = true
                badgeColor = 'bg-green-500'
                break
              case 'COMPLETED':
                statusLabel = 'Đã hoàn thành'
                isActive = false
                badgeColor = 'bg-blue-500'
                break
              case 'FOCUS_LOST':
                statusLabel = 'Mất tập trung'
                isActive = true
                badgeColor = 'bg-yellow-500'
                break
              case 'LEFT':
                statusLabel = 'Đã rời phòng'
                isActive = false
                badgeColor = 'bg-red-500'
                break
              case 'DISCONNECTED':
                statusLabel = 'Mất kết nối'
                isActive = false
                badgeColor = 'bg-orange-500'
                break
              default:
                statusLabel = 'Chưa vào phòng'
                isActive = false
                badgeColor = 'bg-gray-500'
            }

            // Format thời gian
            let timeDisplay = 'Chưa có thông tin'
            if (details.timestamp) {
              try {
                timeDisplay = formatDistanceToNow(new Date(details.timestamp), {
                  addSuffix: true,
                  locale: vi
                })
              } catch {
                timeDisplay = 'Thời gian không hợp lệ'
              }
            }

            return (
              <div
                key={userId}
                className={`rounded-xl shadow-sm p-4 flex flex-col items-center text-center transition-all duration-300 ${
                  isActive ? 'bg-[#e8fff4] hover:bg-[#d4ffe9]' : 'bg-[#fff4e6] hover:bg-[#ffe8cc]'
                }`}
              >
                <div
                  className={`mb-2 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    badgeColor
                  } text-white`}
                >
                  {isActive ? <LogIn className='w-4 h-4' /> : <LogOut className='w-4 h-4' />}
                  {statusLabel}
                </div>
                <p className='text-lg font-semibold text-gray-800'>#{index + 1}</p>
                <p
                  className='text-base font-medium text-gray-900 mt-1 cursor-help'
                  title={details.email || 'Không có email'}
                >
                  {details.name}
                </p>
                <p className='text-sm text-gray-600 mt-2 flex items-center gap-1'>
                  <Clock className='w-4 h-4' />
                  {timeDisplay}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
