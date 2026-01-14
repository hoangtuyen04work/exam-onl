import type React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

const ChatBox = ({ classId, userRole, userId, allowStudentChat }: ChatBoxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const stompClientRef = useRef<Client | null>(null)
  const scrollSnapshot = useRef<number>(0)
  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || ''

  const canSendMessage = userRole === 'TEACHER' || allowStudentChat

  // Fetch messages (prepend older)
  const fetchMessages = async (pageNum: number = 0) => {
    if (loading || (!hasMore && pageNum !== 0)) return

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
        // API trả desc -> đảo lại asc để render tự nhiên
        const fetchedMessages = [...data.items].reverse()

        if (messagesContainerRef.current && pageNum > 0) {
          scrollSnapshot.current = messagesContainerRef.current.scrollHeight
        }

        setMessages((prev) => {
          const newMessages = pageNum === 0 ? fetchedMessages : [...fetchedMessages, ...prev]
          
          // Nếu là load lần đầu (page 0), scroll xuống bottom ngay lập tức
          if (pageNum === 0) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const container = messagesContainerRef.current
                if (container) {
                  container.scrollTop = container.scrollHeight
                }
              })
            })
          }
          
          return newMessages
        })

        const totalPages = Math.ceil(data.total / data.size)
        setHasMore(data.page < totalPages - 1)
        setPage(data.page)
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

    if (container.scrollTop <= 10) {
      fetchMessages(page + 1)
    }
  }

  // Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const client = new Client({
      webSocketFactory: () => new SockJS(`${serverPort}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        const topic = `/topic/class/${classId}/chat`
        client.subscribe(topic, (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body)
          setMessages((prev) => [...prev, chatMessage])

          // Scroll ngay lập tức xuống bottom nếu đang ở gần cuối
          requestAnimationFrame(() => {
            const container = messagesContainerRef.current
            if (container) {
              const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
              if (isNearBottom) {
                container.scrollTop = container.scrollHeight
              }
            }
          })
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
      client.deactivate()
    }
  }, [classId])

  // Preserve scroll position when loading older messages (infinite scroll)
  useLayoutEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    // Chỉ xử lý scroll snapshot khi load thêm tin nhắn cũ (page > 0)
    if (scrollSnapshot.current !== 0) {
      container.scrollTop = container.scrollHeight - scrollSnapshot.current
      scrollSnapshot.current = 0
    }
  }, [messages])

  // Đảm bảo scroll xuống bottom khi mở chat lần đầu
  useEffect(() => {
    if (isInitialLoad && messages.length > 0 && !loading) {
      const container = messagesContainerRef.current
      if (container) {
        // Triple check để đảm bảo scroll xuống thành công
        container.scrollTop = container.scrollHeight
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        })
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 50)
      }
      setIsInitialLoad(false)
    }
  }, [messages, isInitialLoad, loading])

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
      // Scroll ngay lập tức xuống bottom sau khi gửi
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      })
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
    const now = new Date()

    // Reset time to compare dates only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const diffTime = today.getTime() - messageDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    if (diffDays === 0) {
      return `Hôm nay ${timeString}`
    } else if (diffDays === 1) {
      return `Hôm qua ${timeString}`
    } else {
      const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      return `${dateString} ${timeString}`
    }
  }

  return (
    <div className='h-full bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden'>
      {/* Messages Container - Infinite Scroll */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gradient-to-b from-slate-50 to-white'
      >
        {/* Loading indicator at top */}
        {loading && hasMore && (
          <div className='flex justify-center py-2'>
            <div className='flex items-center gap-2 text-xs text-gray-500'>
              <div className='w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              <span>Đang tải...</span>
            </div>
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMore && messages.length > 0 && (
          <div className='flex justify-center py-2'>
            <span className='text-[10px] text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200'>
              Đầu cuộc trò chuyện
            </span>
          </div>
        )}

        {messages.map((message) => {
          const isOwnMessage = Number(message.senderId) === Number(userId)

          return (
            <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              {!isOwnMessage && (
                <>
                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 shadow-sm'>
                    {message.senderRole === 'TEACHER' ? '👨‍🏫' : message.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className='max-w-[70%]'>
                    <div className='bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm'>
                      <p className='text-[11px] font-semibold text-blue-600 mb-1'>
                        {message.senderRole === 'TEACHER' ? 'Giáo viên' : message.senderName}
                      </p>
                      <p className='text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words'>
                        {message.content}
                      </p>
                    </div>
                    <span className='text-[10px] text-gray-400 mt-1 ml-2 block'>{formatTime(message.createdAt)}</span>
                  </div>
                </>
              )}

              {isOwnMessage && (
                <div className='max-w-[70%]'>
                  <div className='bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-md'>
                    <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>{message.content}</p>
                  </div>
                  <span className='text-[10px] text-gray-400 mt-1 mr-2 block text-right'>
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input Area - Modern Chat Design */}
      <div className='p-4 bg-white border-t border-gray-200'>
        <div className='flex items-center gap-2'>
          <button className='text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-lg'>
            <i className='fas fa-paperclip text-lg'></i>
          </button>
          <div className='flex-1 relative'>
            <input
              type='text'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canSendMessage ? 'Aa' : '🔒 Không thể gửi tin nhắn'}
              disabled={!canSendMessage}
              className='w-full bg-gray-100 border-none rounded-full px-4 py-2.5 focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all text-sm disabled:bg-gray-200 disabled:cursor-not-allowed placeholder:text-gray-400'
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !canSendMessage}
            className='bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed'
          >
            <i className='fas fa-paper-plane text-sm'></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
