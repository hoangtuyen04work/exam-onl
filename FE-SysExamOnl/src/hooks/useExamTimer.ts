// import { useEffect, useCallback } from 'react'



// export function useExamTimer(onTimeUp: () => void) {
//   const dispatch = useAppDispatch()

//   useEffect(() => {
//     if (timeRemaining === 0) {
//       onTimeUp()
//       return
//     }

//     // Ngừng đếm nếu thời gian đã hết
//     if (timeRemaining < 0) return

//     const interval = setInterval(() => {
//       dispatch(decrementTime())
//     }, 1000)

//     return () => clearInterval(interval)
//   }, [timeRemaining, dispatch, onTimeUp])

//   const formatTime = useCallback((seconds: number) => {
//     if (seconds < 0) seconds = 0

//     const hours = Math.floor(seconds / 3600)
//     const minutes = Math.floor((seconds % 3600) / 60)
//     const secs = seconds % 60

//     if (hours > 0) {
//       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
//     }
//     return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
//   }, [])

//   return { timeRemaining, formatTime }
// }
