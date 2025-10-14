import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

interface FullScreenOptions {
  onExit: () => void
  enabled?: boolean
  requiredFullscreen?: boolean
}

export function useFullScreen({ onExit, enabled = true, requiredFullscreen = true }: FullScreenOptions) {
  // Kiểm tra trạng thái màn hình
  const [isFullscreen, setIsFullScreen] = useState(false)

  // Theo dõi đóng/mở thoát khỏi fullscreen
  useEffect(() => {
    if (!enabled) return

    const checkFullScreen = () => {
      const fullscreenElement = document.fullscreenElement
      const isCurrentFullscreen = !!fullscreenElement
      setIsFullScreen(isCurrentFullscreen)

      if (!isCurrentFullscreen) {
        onExit()

        if (requiredFullscreen) {
          toast.warning('Cảnh báo: Bạn đã thoát khỏi chế độ toàn màn hình!')
        }
      }
    }

    // Thêm event listeners cho các trình duyệt khác nhau
    document.addEventListener('fullscreenchange', checkFullScreen)
    document.addEventListener('webkitfullscreenchange', checkFullScreen)
    document.addEventListener('mozfullscreenchange', checkFullScreen)
    document.addEventListener('MSFullscreenChange', checkFullScreen)

    return () => {
      document.removeEventListener('fullscreenchange', checkFullScreen)
      document.removeEventListener('webkitfullscreenchange', checkFullScreen)
      document.removeEventListener('mozfullscreenchange', checkFullScreen)
      document.removeEventListener('MSFullscreenChange', checkFullScreen)
    }
  }, [onExit, enabled, requiredFullscreen])

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullScreen(true)
      return true
    } catch (error) {
      toast.error('Lỗi, không thể mở chế độ toàn màn hình')
      console.error(error)
      return false
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      // Trạng thái isFullScreen sẽ được cập nhật bởi event listener 'fullscreenchange'
    } catch (error) {
      toast.error('Thất bại: Không thể thoát khỏi toàn màn hình')
      console.error(error)
    }
  }

  return { isFullscreen, requestFullscreen, exitFullscreen }
}
