/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchStudents() {
  try {
    const res = await fetch('/mock-data/auth.json')
    if (!res.ok) throw new Error('Failed to load user data')
    return await res.json()
  } catch (error) {
    console.error('fetchStudents error:', error)
    throw new Error('Không thể tải danh sách người dùng')
  }
}

export async function authenticateUser(userId: string, pass: string) {
  const users = await fetchStudents()
  const user = users.find((u: any) => u.studentId === userId && u.password === pass)

  if (!user) {
    throw new Error('Invalid credentials')
  }

  return {
    id: user.id,
    studentId: user.studentId,
    name: user.name,
    dob: user.dob || null,
    gender: user.gender || null,
    examCenter: user.examCenter || null,
    room: user.room || null,
    examSession: user.examSession,
    role: user.role,
    token: 'fake-jwt-' + Math.random().toString(36).slice(2)
  }
}

export async function fetchExams() {
  const response = await fetch('/mock-data/exams.json')
  return response.json()
}
