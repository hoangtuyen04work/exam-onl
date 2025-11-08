export const toLocalStringISO = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  } catch {
    return iso
  }
}
