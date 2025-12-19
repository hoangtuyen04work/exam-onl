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
    <div className='flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200'>
      {/* Header - Clickable for settings */}
      <div
        className='px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all'
        onClick={() => userRole === 'TEACHER' && setShowSettings(!showSettings)}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
            </div>
            <div>
              <h3 className='text-sm font-bold'>Chat Lớp Học</h3>
              <p className='text-[10px] text-blue-100'>{canSendMessage ? 'Trực tuyến' : 'Chat đã tắt'}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {!canSendMessage && (
              <span className='px-2 py-0.5 bg-red-500/20 backdrop-blur-sm rounded-full text-[10px] font-medium'>
                🔒 Chỉ xem
              </span>
            )}
            {userRole === 'TEACHER' && (
              <svg
                className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            )}
          </div>
        </div>
      </div>

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
        className='flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50/50 overscroll-contain'
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
          .map((message, index, arr) => {
            const isOwnMessage = Number(message.senderId) === Number(userId)
            const prevMessage = arr[index - 1]
            const showAvatar = !prevMessage || Number(prevMessage.senderId) !== Number(message.senderId)

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[75%]`}>
                  {/* Avatar - Only show if different sender from previous */}
                  {!isOwnMessage &&
                    (showAvatar ? (
                      <div className='w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md ring-2 ring-white'>
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className='w-7 h-7 flex-shrink-0'></div>
                    ))}

                  {/* Message bubble */}
                  <div className='flex flex-col'>
                    {!isOwnMessage && showAvatar && (
                      <div className='flex items-center gap-1.5 mb-1 px-2.5'>
                        <span className='text-xs font-semibold text-gray-700'>{message.senderName}</span>
                        {message.senderRole === 'TEACHER' && (
                          <span className='px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-[10px] font-medium shadow-sm'>
                            👨‍🏫 GV
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 shadow-sm transition-all hover:shadow-md ${
                        isOwnMessage
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                          : message.senderRole === 'TEACHER'
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-gray-800 border border-green-200 rounded-bl-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>{message.content}</p>
                    </div>
                    <p
                      className={`text-[10px] mt-0.5 px-2.5 ${isOwnMessage ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Compact Design */}
      <div className='px-3 py-2.5 bg-white border-t border-gray-200 rounded-b-lg'>
        <div className='flex items-end gap-2'>
          <div className='flex-1 relative'>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canSendMessage ? '💬 Nhập tin nhắn...' : '🔒 Bạn không có quyền gửi tin nhắn'}
              disabled={!canSendMessage}
              className='w-full px-3.5 py-2.5 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md'
              rows={1}
              style={{ minHeight: '42px', maxHeight: '110px' }}
            />
            {newMessage.trim() && (
              <span className='absolute right-3 bottom-2.5 text-xs text-gray-400'>{newMessage.length}</span>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !canSendMessage}
            className='px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-1.5 font-medium'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
            </svg>
            <span className='text-sm'>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
