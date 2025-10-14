export interface Exam {
  id: string
  name: string
  subject?: string
  date?: string
  duration?: number // minutes
  published?: boolean
}