export interface Question {
  id: number
  type: string
  passage?: string
  question: string
  options: Record<string, string>
  correctAnswer: string
  explanation?: string
}

export interface ExamInfo {
  id: string
  name: string
  nameEn: string
  duration: number
  totalQuestions: number
  violationThreshold: number
  requireFullscreen: boolean
  tabSwitchThreshold: number
}

export interface ExamData {
  [examId: string]: Question[]
}
