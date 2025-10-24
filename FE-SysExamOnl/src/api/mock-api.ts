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
