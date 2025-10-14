import { useState } from 'react'
import { mockQuestions } from '../../../data/mockData'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'

export default function QuestionBank() {
  const [questions, setQuestions] = useState(mockQuestions)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  const subjects = [...new Set(questions.map(q => q.subject))]
  const difficulties = ['easy', 'medium', 'hard']

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = !selectedSubject || q.subject === selectedSubject
    const matchesDifficulty = !selectedDifficulty || q.difficulty === selectedDifficulty
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  const handleDelete = (questionId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      setQuestions(questions.filter(q => q.id !== questionId))
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ'
      case 'medium': return 'Trung bình'
      case 'hard': return 'Khó'
      default: return difficulty
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Ngân hàng câu hỏi</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm câu hỏi
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Tất cả môn học</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">Tất cả độ khó</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {getDifficultyText(difficulty)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSubject('')
                setSelectedDifficulty('')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="grid gap-4">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {question.content}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(question.difficulty)}`}>
                      {getDifficultyText(question.difficulty)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {question.subject}
                    </span>
                  </div>
                  
                  {question.type === 'multiple-choice' && (
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 mb-2">Các lựa chọn:</p>
                      <ul className="space-y-1">
                        {question.options.map((option, index) => (
                          <li key={index} className={`text-sm ${
                            index === question.correctAnswer 
                              ? 'text-green-600 font-medium' 
                              : 'text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}. {option}
                            {index === question.correctAnswer && ' ✓'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Không tìm thấy câu hỏi nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm câu hỏi mới</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
            <p className="text-sm text-gray-600">Tổng số câu hỏi</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {questions.filter(q => q.difficulty === 'easy').length}
            </p>
            <p className="text-sm text-gray-600">Câu hỏi dễ</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {questions.filter(q => q.difficulty === 'hard').length}
            </p>
            <p className="text-sm text-gray-600">Câu hỏi khó</p>
          </div>
        </div>
      </div>
    </div>
  )
}