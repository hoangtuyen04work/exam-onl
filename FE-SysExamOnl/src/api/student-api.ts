import axiosClient from './axiosClient'

export interface JoinResponseData {
  examSessionId: number
  examName: string
  durationMinutes: number
  timeStart?: string
  timeEnd?: string
  studentStatus?: string
  startedAt?: string
}

export interface DoExamQuestionAnswer {
  answerId: number
  content: string
}

export interface DoExamQuestion {
  questionId: number
  content: string
  point: number
  difficulty: string
  answers: DoExamQuestionAnswer[]
}

export interface DoExamResponseData {
  examSessionId: number
  examName: string
  durationMinutes: number
  questions: DoExamQuestion[]
}

export interface SubmitPayload {
  examSessionId: number
  questions: Array<{ questionId: number; answerId: number }>
}

export interface SubmitFinalResponse {
  examSessionStudentId: number
  totalScore: number
  correctCount: number
  wrongCount: number
  submittedAt: string
  status: string
}

export interface ExitPayload {
  examSessionStudentId: number
  eventTime: string
}

export async function joinExam(code: string) {
  const { data } = await axiosClient.post('/student/exam/join', { code })
  return data as { code: number; message: string; success: boolean; data: JoinResponseData }
}

export async function doExam(examSessionId: number) {
  const { data } = await axiosClient.post(`/student/exam/${examSessionId}/do`)
  console.log('doExam response data:', data)
  return data as { code: number; message: string; success: boolean; data: DoExamResponseData }
}

export async function submitExam(state: 'DRAFT' | 'FINAL', payload: SubmitPayload) {
  const { data } = await axiosClient.post(`/student/exam/submit?state=${state}`, payload)
  return data as { code: number; message: string; success: boolean; data: any }
}

export async function exitEvent(payload: ExitPayload) {
  const { data } = await axiosClient.post('/student/exam/exit', payload)
  return data as { code: number; message: string; success: boolean; data: any }
}

export default {
  joinExam,
  doExam,
  submitExam,
  exitEvent
}
