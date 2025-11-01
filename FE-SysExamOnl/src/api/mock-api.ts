/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from './axiosClient.ts'

export async function fetchStudents() {
  try {
    const { data } = await axiosClient.get('/mock-data/auth.json')
    return data
  } catch {
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
  const { data } = await axiosClient.get('/mock-data/exams.json')
  return data
}

export async function fetchQuestions2(examId: string) {
  const { data } = await axiosClient.get('/mock-data/questions.json')
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
    const { data: allQuestions } = await axiosClient.get('/mock-data/questions.json')
    const questions = allQuestions[examId]
    if (!questions) {
      throw new Error(`Không tìm thấy đề thi với ID: ${examId}`)
    }
    return questions
  } catch {
    throw new Error('Không thể tải dữ liệu câu hỏi')
  }
}
