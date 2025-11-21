export interface UserData {
  name: string
  studentId: string
  dob: string
  gender: string
  room: string
  examCenter: string
  examSession: string
}

export interface CompletedExam {
  examSessionId: number
  examSessionName: string
  totalScore: number
  status: 'COMPLETED'
  submittedAt: string
}

export interface ExamSearchResponse {
  items: CompletedExam[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface AvailableExam {
  examId: number
  examName: string
  durationMinutes: number
}
