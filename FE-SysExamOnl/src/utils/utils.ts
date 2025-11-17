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
