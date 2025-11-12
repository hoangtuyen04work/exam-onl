/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from './axiosClient'

// src/api/student-api.ts
export interface JoinResponseData {
  examSessionId: number
  name: string
  description?: string
  durationMinutes: number
  state: 'NOT_OPEN' | 'OPENING' | 'JOINED' | 'CLOSED'
}

export interface AnswerContentResponse {
  answerId: number
  content: string
  selected: boolean
}

export interface QuestionContentResponse {
  questionId: number
  content: string
  answers: AnswerContentResponse[]
}

export interface DoExamResponseData {
  status: 'IN_PROGRESS' | 'COMPLETED'
  examSessionId: number
  name: string
  questions: QuestionContentResponse[]
}

export interface SubmitPayload {
  examSessionId: number
  questions: Array<{ questionId: number; answerId: number }>
}

export interface ExitPayload {
  examSessionStudentId: number
  eventTime: string
}

export const studentApi = {
  joinExam: async (
    code: string
  ): Promise<{
    success: boolean
    data: JoinResponseData
    message?: string
  }> => {
    const { data } = await axiosClient.post('/student/exam/join', { code: code.trim() })
    return data as { code: number; message: string; success: boolean; data: JoinResponseData }
  },

  doExam: async (
    examSessionId: number
  ): Promise<{
    success: boolean
    data: DoExamResponseData
    message?: string
  }> => {
    const { data } = await axiosClient.post(`/student/exam/${examSessionId}/do`)
    return data
  },

  submitExam: async (state: 'DRAFT' | 'FINAL', payload: SubmitPayload) => {
    const { data } = await axiosClient.post(`/student/exam/submit?state=${state}`, payload)
    return data
  },

  exitEvent: async (payload: ExitPayload) => {
    await axiosClient.post('/student/exam/exit', payload)
  }
}

export interface ExamSearchResponse {
  items: Array<{
    examSessionId: number
    examName: string
    submittedAt: string
    score?: number
  }>
  page: number
  size: number
  total: number
  totalPages: number
}

export const fetchCompletedExams = async (page: number, size: number): Promise<ExamSearchResponse> => {
  try {
    const { data } = await axiosClient.get('/student/exam/search', {
      params: {
        page,
        size,
        sort: 'submittedAt,desc'
      }
    })

    if (data && Array.isArray(data.items)) {
      return {
        items: data.items,
        page: data.page ?? page,
        size: data.size ?? size,
        total: data.total ?? 0,
        totalPages: data.totalPages ?? 0
      }
    }

    console.warn('[API] Unexpected response structure:', data)
    return { items: [], page, size, total: 0, totalPages: 0 }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Không thể tải danh sách bài thi'
    console.error('[API] fetchCompletedExams error:', error)
    throw new Error(msg)
  }
}

export default { fetchCompletedExams }
