export type JoinExamState = 'NOT_OPEN' | 'OPENING' | 'JOINED' | 'CLOSED'

export interface JoinResponseData {
  examSessionId: number
  examName: string
  durationMinutes: number
  timeStart?: string
  timeEnd?: string
  studentStatus?: string
  startedAt?: string
}

export interface ExtendedJoinResponseData {
  examSessionId: number
  state: JoinExamState
  examSessionStudentId?: number
  answers?: Record<number, number>
}

export interface JoinExamResponse {
  success: boolean
  message?: string
  data?: ExtendedJoinResponseData
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

export type SubmitState = 'DRAFT' | 'FINAL'

export interface SubmitPayload {
  examSessionId: number
  questions: Array<{
    questionId: number
    answerId: number
  }>
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
  eventTime: string // ISO 8601 timestamp
}

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

export interface Answer {
  answerId: number
  content: string
  correct: boolean
  selected: boolean
}

export interface Question {
  questionId: number
  content: string
  explanation: string
  teacherFeedback: string | null
  answers: Answer[]
}

export interface DisplayQuestion {
  questionId: number
  content: string
  difficulty: string
  answers: {
    answerId: number
    content: string
  }[]
}

export interface ExamResult {
  examSessionId: number
  examSessionName: string
  totalScore: number
  status: string
  submittedAt: string
  teacherOverallFeedback: string | null
  questions: Question[]
}

export interface ExamSessionContent {
  examName: string
  durationMinutes: number
  questions: {
    questionId: number
    content: string
    difficulty: string
    answers: {
      answerId: number
      content: string
    }[]
  }[]
  submitted?: boolean
  timeLeft?: number
}
