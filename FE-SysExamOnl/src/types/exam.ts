export interface Exam {
  id: string
  name: string
  subject?: string
  date?: string
  published?: boolean
}

export interface ExamSessionStatistics {
  examSessionId: number
  examSessionName: string
  totalStudents: number
  submittedCount: number
  passedCount: number
  failedCount: number
  passingScore: number | null
  averageScore: number
  highestScore: number | null
  lowestScore: number | null
  passRate: number
}

export interface StudentResult {
  examSessionStudentId: number
  studentName: string
  studentId: number
  status: string
  submittedAt: string | null
  exitCount: number
  score: number
  isPassed?: boolean
}