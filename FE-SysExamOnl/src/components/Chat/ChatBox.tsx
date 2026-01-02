import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

interface ChatMessage {
  id: number
  classId: number
  senderId: number
  senderName: string
  senderRole: 'TEACHER' | 'STUDENT'
  content: string
  createdAt: string
}

interface ChatBoxProps {
  classId: number
  userRole: 'TEACHER' | 'STUDENT'
  userId: number
  allowStudentChat: boolean
  onToggleChatSettings?: (newValue: boolean) => Promise<void>
}

const ChatBox = ({ classId, userRole, userId, allowStudentChat, onToggleChatSettings }: ChatBoxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const stompClientRef = useRef<Client | null>(null)
  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || ''

  const canSendMessage = userRole === 'TEACHER' || allowStudentChat

  // Fetch messages
  const fetchMessages = async (pageNum: number = 0) => {
    if (loading) return

    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const url = `${serverPort}/api/classes/${classId}/messages?page=${pageNum}&size=20`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.items) {
        const newMessages = data.items || []

        // Save scroll position before updating messages (for infinite scroll)
        const container = messagesContainerRef.current
        const oldScrollHeight = container?.scrollHeight || 0

        setMessages((prev) => (pageNum === 0 ? newMessages : [...prev, ...newMessages]))

        // Restore scroll position after loading more messages
        if (pageNum > 0 && container) {
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - oldScrollHeight
          }, 0)
        }

        const totalPages = Math.ceil(data.total / data.size)
        setHasMore(data.page < totalPages - 1)
      }
    } catch (error) {
      console.error('[ChatBox] Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Infinite scroll handler
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container || loading || !hasMore) return

    // Load more when scrolled to top
    if (container.scrollTop === 0) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMessages(nextPage)
    }
  }

  // Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const wsUrl = `${serverPort}/ws`

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        const topic = `/topic/class/${classId}/chat`
        client.subscribe(topic, (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body)
          setMessages((prev) => [chatMessage, ...prev])
        })
      },
      onStompError: (frame) => {
        console.error('[ChatBox] STOMP error:', frame)
      }
    })

    client.activate()
    stompClientRef.current = client

    fetchMessages(0)

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate()
      }
    }
  }, [classId])

  // Scroll to bottom only on initial load (no animation)
  useEffect(() => {
    if (isInitialLoad && messages.length > 0 && messagesContainerRef.current) {
      // Use scrollTop to prevent page-level scroll
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      setIsInitialLoad(false)
    }
  }, [messages, isInitialLoad])

  // Scroll to bottom when new message arrives (only if user is near bottom)
  useEffect(() => {
    if (!isInitialLoad) {
      const container = messagesContainerRef.current
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
        if (isNearBottom) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
    }
  }, [messages.length])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !canSendMessage) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${serverPort}/api/classes/${classId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          classId,
          content: newMessage.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setNewMessage('')
      // Scroll to bottom after sending
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }
      }, 100)
    } catch (error) {
      console.error('[ChatBox] Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Settings Panel - Collapsible */}
      {showSettings && userRole === 'TEACHER' && onToggleChatSettings && (
        <div className='px-4 py-3 bg-blue-50 border-b border-blue-100'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-medium text-gray-700'>Cho phép học sinh chat</p>
              <p className='text-[10px] text-gray-500 mt-0.5'>
                {allowStudentChat ? 'Học sinh có thể gửi tin nhắn' : 'Học sinh chỉ xem được tin nhắn'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleChatSettings(!allowStudentChat)
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allowStudentChat ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  allowStudentChat ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Messages Container - Infinite Scroll */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50 overscroll-contain'
      >
        {/* Loading indicator at top */}
        {loading && hasMore && (
          <div className='flex justify-center py-2'>
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              <span>Đang tải tin nhắn...</span>
            </div>
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMore && messages.length > 0 && (
          <div className='flex justify-center py-2'>
            <span className='text-xs text-gray-400 bg-white px-4 py-1 rounded-full shadow-sm'>
              • Đã tải hết tin nhắn •
            </span>
          </div>
        )}

        {messages
          .slice()
          .reverse()
          .map((message) => {
            const isOwnMessage = Number(message.senderId) === Number(userId)

            return (
              <div
                key={message.id}
                className={`flex items-start animate-fadeIn ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {/* Teacher/Other Student Message (Left) */}
                {!isOwnMessage && (
                  <div className='flex items-start max-w-2xl'>
                    <div className='w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold mr-3 shrink-0'>
                      {message.senderRole === 'TEACHER' ? 'GV' : message.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className='bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm'>
                        <p className='text-xs font-bold text-blue-600 mb-1'>
                          {message.senderRole === 'TEACHER' ? 'Giáo viên' : message.senderName}
                        </p>
                        <p className='text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words'>
                          {message.content}
                        </p>
                      </div>
                      <span className='text-[10px] text-slate-400 mt-1 block'>{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                )}

                {/* Own Message (Right) */}
                {isOwnMessage && (
                  <div className='flex items-start justify-end'>
                    <div className='max-w-xl'>
                      <div className='bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md'>
                        <p className='text-sm font-medium whitespace-pre-wrap break-words'>{message.content}</p>
                      </div>
                      <span className='text-[10px] text-slate-400 mt-1 block text-right font-bold uppercase'>
                        Đã xem
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Following UI Design */}
      <div className='p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]'>
        <div className='flex items-center space-x-3 max-w-5xl mx-auto'>
          <button className='text-slate-400 hover:text-blue-600 transition'>
            <i className='fas fa-paperclip text-xl'></i>
          </button>
          <div className='flex-1 relative'>
            <input
              type='text'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canSendMessage ? 'Nhập tin nhắn...' : '🔒 Bạn không có quyền gửi tin nhắn'}
              disabled={!canSendMessage}
              className='w-full bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm disabled:bg-gray-200 disabled:cursor-not-allowed'
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !canSendMessage}
            className='bg-blue-600 text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed'
          >
            <i className='fas fa-paper-plane text-xl'></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
