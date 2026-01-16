import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'

interface FullScreenOptions {
  onExit: () => void
  enabled?: boolean
  requiredFullscreen?: boolean
}

// Extend Document interface for iOS Safari webkit prefixes
interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element
  webkitExitFullscreen?: () => Promise<void>
  mozFullScreenElement?: Element
  mozCancelFullScreen?: () => Promise<void>
  msFullscreenElement?: Element
  msExitFullscreen?: () => Promise<void>
}

interface ElementWithFullscreen extends HTMLElement {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>
  webkitEnterFullscreen?: () => Promise<void>
  mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>
  msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>
}

export function useFullScreen({ onExit, enabled = true, requiredFullscreen = true }: FullScreenOptions) {
  // Kiểm tra trạng thái màn hình
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [exitCount, setExitCount] = useState(0) // Đếm số lần thoát fullscreen

  // Helper function to get fullscreen element across browsers
  const getFullscreenElement = useCallback((): Element | null => {
    const doc = document as DocumentWithFullscreen
    return (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      null
    )
  }, [])

  // Theo dõi đóng/mở thoát khỏi fullscreen
  useEffect(() => {
    if (!enabled) return

    const checkFullScreen = () => {
      const fullscreenElement = getFullscreenElement()
      const isCurrentFullscreen = !!fullscreenElement
      
      // Chỉ xử lý khi có sự thay đổi trạng thái
      if (isCurrentFullscreen !== isFullscreen) {
        setIsFullscreen(isCurrentFullscreen)

        if (!isCurrentFullscreen) {
          setExitCount(prev => prev + 1)
          console.log(`[Fullscreen] Exit detected (count: ${exitCount + 1})`)
          onExit()

          if (requiredFullscreen) {
            toast.warning('Cảnh báo: Bạn đã thoát khỏi chế độ toàn màn hình!')
          }
        }
      }
    }

    // Thêm event listeners cho các trình duyệt khác nhau (bao gồm iOS Safari)
    document.addEventListener('fullscreenchange', checkFullScreen)
    document.addEventListener('webkitfullscreenchange', checkFullScreen)
    document.addEventListener('webkitendfullscreen', checkFullScreen) // iOS specific
    document.addEventListener('mozfullscreenchange', checkFullScreen)
    document.addEventListener('MSFullscreenChange', checkFullScreen)

    return () => {
      document.removeEventListener('fullscreenchange', checkFullScreen)
      document.removeEventListener('webkitfullscreenchange', checkFullScreen)
      document.removeEventListener('webkitendfullscreen', checkFullScreen)
      document.removeEventListener('mozfullscreenchange', checkFullScreen)
      document.removeEventListener('MSFullscreenChange', checkFullScreen)
    }
  }, [onExit, enabled, requiredFullscreen, isFullscreen, exitCount, getFullscreenElement])

  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement as ElementWithFullscreen

      // Try standard API first
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        setIsFullscreen(true)
        return true
      }
      // iOS Safari - webkit prefix
      else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen()
        setIsFullscreen(true)
        return true
      }
      // Older iOS Safari
      else if (elem.webkitEnterFullscreen) {
        await elem.webkitEnterFullscreen()
        setIsFullscreen(true)
        return true
      }
      // Firefox
      else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen()
        setIsFullscreen(true)
        return true
      }
      // IE/Edge
      else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen()
        setIsFullscreen(true)
        return true
      } else {
        toast.warning('Trình duyệt không hỗ trợ chế độ toàn màn hình')
        console.warn('Fullscreen API not supported')
        return false
      }
    } catch (error) {
      toast.error('Lỗi, không thể mở chế độ toàn màn hình')
      console.error('Fullscreen request error:', error)
      return false
    }
  }

  const exitFullscreen = async () => {
    try {
      const doc = document as DocumentWithFullscreen

      if (getFullscreenElement()) {
        // Try standard API
        if (doc.exitFullscreen) {
          await doc.exitFullscreen()
        }
        // iOS Safari - webkit prefix
        else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        }
        // Firefox
        else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen()
        }
        // IE/Edge
        else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen()
        }
      }
      // Trạng thái isFullScreen sẽ được cập nhật bởi event listener 'fullscreenchange'
    } catch (error) {
      toast.error('Thất bại: Không thể thoát khỏi toàn màn hình')
      console.error('Exit fullscreen error:', error)
    }
  }

  return { isFullscreen, requestFullscreen, exitFullscreen }
}
