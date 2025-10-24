/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchStudents() {
  try {
    const res = await fetch('/mock-data/auth.json')
    if (!res.ok) {
      console.error('Failed to fetch auth.json:', res.status, res.statusText)
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    const data = await res.json()
    console.log('Fetched users:', data)
    return data
  } catch (error) {
    console.error('fetchStudents error:', error)
    throw new Error('Không thể tải danh sách người dùng')
  }
}

export async function authenticateUser(userId: string, pass: string) {
  console.log('Authenticating user:', userId, 'with password:', pass ? '***' : 'empty')
  
  const users = await fetchStudents()
  console.log('Available users:', users.map((u: any) => ({ studentId: u.studentId, role: u.role })))
  
  const user = users.find((u: any) => u.studentId === userId && u.password === pass)
  console.log('Found user:', user ? { id: user.id, name: user.name, role: user.role } : 'null')

  if (!user) {
    console.error('Authentication failed for:', userId)
    throw new Error('Invalid credentials')
  }

  const result = {
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
  
  console.log('Authentication successful:', result)
  return result
}

export async function fetchExams() {
  const response = await fetch('/mock-data/exams.json')
  return response.json()
}

export async function fetchQuestions2(examId: string) {
  const response = await fetch('/mock-data/questions.json')
  const data = await response.json()
  return data[examId] || []
}

export interface Question {
  id: number
  type: string
  passage?: string
  question: string
  options: Record<string, string>
  correctAnswer: string
  explanation?: string
}

export async function fetchQuestions(examId: string): Promise<Question[]> {
  try {
    const response = await fetch('/mock-data/questions.json')
    if (!response.ok) {
      throw new Error('Không thể tải dữ liệu câu hỏi')
    }
    const allQuestions = await response.json()
    const questions = allQuestions[examId]

    if (!questions) {
      throw new Error(`Không tìm thấy đề thi với ID: ${examId}`)
    }
    return questions
  } catch (error) {
    throw new Error(`Lỗi khi tải đề thi: ${(error as Error).message}`)
  }
}
