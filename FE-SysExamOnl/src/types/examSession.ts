export interface AnswerOption {
  answerId: number
  content: string
}

export interface QuestionItem {
  questionId: number
  content: string
  point: number
  difficulty: string
  answers: AnswerOption[]
}

export interface ExamSessionContent {
  examSessionId: number
  examName: string
  durationMinutes: number
  questions: QuestionItem[]
  startTime: string
  endTime: string
}

export interface JoinResult {
  examSessionId: number
  examName: string
  durationMinutes: number
  timeStart?: string
  timeEnd?: string
  startedAt?: string
}
