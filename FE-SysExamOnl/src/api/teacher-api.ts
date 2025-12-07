import type { Exam } from '../types/exam'
import type { Question } from '../types/question'

let teacherExams: Exam[] = [
  { id: 'e1', name: 'Toán 12 - Giữa kỳ', subject: 'Toán', duration: 60, date: '2025-10-20', published: true },
  { id: 'e2', name: 'Văn 12 - Cuối kỳ', subject: 'Ngữ văn', duration: 90, date: '2025-11-10', published: false }
]

const teacherQuestions: Question[] = [
  { id: 'q1', content: 'Đạo hàm của x^2 là gì?', subject: 'Toán', level: 'easy' },
  { id: 'q2', content: 'Phân tích nhân vật Chí Phèo...', subject: 'Ngữ văn', level: 'medium' }
]

// Simulate latency
const wait = (ms = 400) => new Promise((res) => setTimeout(res, ms))

export async function fetchTeacherExams(): Promise<Exam[]> {
  await wait()
  return [...teacherExams]
}

export async function createExam(payload: Omit<Exam, 'id'>): Promise<Exam> {
  await wait()
  const newExam: Exam = { id: crypto.randomUUID(), ...payload }
  teacherExams = [newExam, ...teacherExams]
  return newExam
}

export async function deleteExam(id: string): Promise<{ id: string }> {
  await wait()
  teacherExams = teacherExams.filter((e) => e.id !== id)
  return { id }
}

export async function fetchQuestions(): Promise<Question[]> {
  await wait()
  return [...teacherQuestions]
}

// Exam Session APIs
import axiosClient from './axiosClient'
import type { ExamSessionStatistics, StudentResult } from '../types/exam'

export async function updatePassingScore(examSessionId: number, passingScore: number) {
  const response = await axiosClient.put(`/teacher/exam-sessions/${examSessionId}/passing-score`, {
    passingScore
  })
  return response.data
}

export async function getExamSessionStatistics(examSessionId: number): Promise<ExamSessionStatistics> {
  const response = await axiosClient.get(`/teacher/exam-sessions/${examSessionId}/statistics`)
  return response.data.data
}

export async function getStudentResults(examSessionId: number, params?: {
  page?: number
  size?: number
  sort?: string
}): Promise<{ items: StudentResult[], totalPages: number, totalItems: number }> {
  const response = await axiosClient.get(`/teacher/exam-sessions/${examSessionId}`, { params })
  return response.data
}