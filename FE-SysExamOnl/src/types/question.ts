export interface Question {
  id: string
  content: string
  subject?: string
  level?: 'easy' | 'medium' | 'hard'
}