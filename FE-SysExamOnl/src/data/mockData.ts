// Mock data cho trang giáo viên
export const mockExams = [
  {
    id: '1',
    name: 'Đề thi Toán học kỳ 1',
    subject: 'Toán học',
    duration: 90,
    date: '2024-01-15',
    published: true,
    questions: 20
  },
  {
    id: '2', 
    name: 'Đề thi Vật lý cuối kỳ',
    subject: 'Vật lý',
    duration: 120,
    date: '2024-01-20',
    published: false,
    questions: 25
  },
  {
    id: '3',
    name: 'Đề thi Hóa học giữa kỳ',
    subject: 'Hóa học', 
    duration: 60,
    date: '2024-01-25',
    published: true,
    questions: 15
  }
]

export const mockQuestions = [
  {
    id: '1',
    content: 'Phương trình bậc hai ax² + bx + c = 0 có nghiệm khi nào?',
    type: 'multiple-choice',
    options: ['Δ > 0', 'Δ ≥ 0', 'Δ < 0', 'Δ ≤ 0'],
    correctAnswer: 1,
    subject: 'Toán học',
    difficulty: 'medium'
  },
  {
    id: '2',
    content: 'Định luật Newton thứ nhất phát biểu về gì?',
    type: 'multiple-choice',
    options: ['Lực và gia tốc', 'Quán tính', 'Tác dụng và phản tác dụng', 'Hấp dẫn'],
    correctAnswer: 1,
    subject: 'Vật lý',
    difficulty: 'easy'
  },
  {
    id: '3',
    content: 'Công thức hóa học của nước là gì?',
    type: 'multiple-choice',
    options: ['H2O', 'CO2', 'O2', 'H2SO4'],
    correctAnswer: 0,
    subject: 'Hóa học',
    difficulty: 'easy'
  }
]

export const mockStudents = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    studentId: 'SV001',
    email: 'an.nguyen@example.com',
    class: '12A1',
    status: 'active'
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    studentId: 'SV002', 
    email: 'binh.tran@example.com',
    class: '12A2',
    status: 'active'
  },
  {
    id: '3',
    name: 'Lê Văn Cường',
    studentId: 'SV003',
    email: 'cuong.le@example.com', 
    class: '12A1',
    status: 'inactive'
  }
]

export const mockResults = [
  {
    id: '1',
    studentName: 'Nguyễn Văn An',
    studentId: 'SV001',
    examName: 'Đề thi Toán học kỳ 1',
    score: 8.5,
    totalQuestions: 20,
    correctAnswers: 17,
    submittedAt: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    studentName: 'Trần Thị Bình',
    studentId: 'SV002',
    examName: 'Đề thi Toán học kỳ 1', 
    score: 7.0,
    totalQuestions: 20,
    correctAnswers: 14,
    submittedAt: '2024-01-15T11:15:00Z',
    status: 'completed'
  }
]
