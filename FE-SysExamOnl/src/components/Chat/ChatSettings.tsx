import { useState } from 'react'

interface ChatSettingsProps {
  classId: number
  initialAllowStudentChat: boolean
  onSettingChange?: (newValue: boolean) => void
}

const ChatSettings = ({ classId, initialAllowStudentChat, onSettingChange }: ChatSettingsProps) => {
  const [allowStudentChat, setAllowStudentChat] = useState(initialAllowStudentChat)
  const [loading, setLoading] = useState(false)
  const serverPort = (import.meta.env.VITE_SERVER_PORT_EXPOSE as string | undefined)?.replace(/\/+$/, '') || '';

  const handleToggle = async () => {
    const newValue = !allowStudentChat
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(
        `${serverPort}/api/classes/${classId}/chat-settings?allowStudentChat=${newValue}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        setAllowStudentChat(newValue)
        onSettingChange?.(newValue)
      } else {
        console.error('Failed to update chat settings')
      }
    } catch (error) {
      console.error('Error updating chat settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-4 mb-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-800'>Cài đặt Chat</h3>
          <p className='text-sm text-gray-600 mt-1'>
            {allowStudentChat ? 'Học sinh có thể gửi tin nhắn trong nhóm' : 'Học sinh không thể gửi tin nhắn (chỉ xem)'}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            allowStudentChat ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              allowStudentChat ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {loading && <div className='mt-2 text-sm text-blue-600'>Đang cập nhật...</div>}
    </div>
  )
}

export default ChatSettings
