import { useEffect, useState } from 'react'

export const toLocalStringISO = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  } catch {
    return iso
  }
}

export const toVNISO = (dateStr: string) => {
  const date = new Date(dateStr)
  const tzOffset = -date.getTimezoneOffset()
  const diff = tzOffset >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0')
  const hours = pad(tzOffset / 60)
  const minutes = pad(tzOffset % 60)
  return `${date.toISOString().slice(0, 19)}${diff}${hours}:${minutes}`
}

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveToLocalStorage = (examSessionId: number, data: Record<string, any>) => {
  try {
    const existing = localStorage.getItem(`exam_${examSessionId}`)
    const existingData = existing ? JSON.parse(existing) : {}
    localStorage.setItem(
      `exam_${examSessionId}`,
      JSON.stringify({
        ...existingData,
        ...data,
        lastSavedAt: new Date().toISOString()
      })
    )
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

export const loadFromLocalStorage = (examSessionId: number) => {
  try {
    const saved = localStorage.getItem(`exam_${examSessionId}`)
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    console.error('Error loading from localStorage:', e)
    return null
  }
}

export const getBaseUrl = () => {
  return (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || ''
}
