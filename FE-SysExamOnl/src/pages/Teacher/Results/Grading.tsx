import { useState } from 'react'
import { mockResults, mockExams } from '../../../data/mockData'
import { Search, Filter, Download, Eye, CheckCircle, Clock, Users } from 'lucide-react'

export default function Grading() {
  const [results, setResults] = useState(mockResults)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const exams = mockExams
  const statuses = ['completed', 'pending', 'graded']

  const filteredResults = results.filter(result => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesExam = !selectedExam || result.examName === selectedExam
    const matchesStatus = !statusFilter || result.status === statusFilter
    return matchesSearch && matchesExam && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'graded': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành'
      case 'pending': return 'Chờ chấm'
      case 'graded': return 'Đã chấm'
      default: return status
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleGrade = (resultId: string) => {
    setResults(results.map(result => 
      result.id === resultId 
        ? { ...result, status: 'graded' }
        : result
    ))
  }

  const handleExport = () => {
    // Simulate export functionality
    alert('Tính năng xuất file sẽ được triển khai')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Chấm điểm và kết quả</h1>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất kết quả
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tổng bài thi</p>
                <p className="text-xl font-semibold">{results.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Đã chấm</p>
                <p className="text-xl font-semibold">
                  {results.filter(r => r.status === 'graded').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Chờ chấm</p>
                <p className="text-xl font-semibold">
                  {results.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Điểm TB</p>
                <p className="text-xl font-semibold">
                  {(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm thí sinh..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">Tất cả đề thi</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.name}>{exam.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedExam('')
                setStatusFilter('')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thí sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đề thi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm số
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{result.studentName}</div>
                        <div className="text-sm text-gray-500">{result.studentId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.examName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-semibold ${getScoreColor(result.score)}`}>
                          {result.score}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          /10 ({result.correctAnswers}/{result.totalQuestions})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                        {getStatusText(result.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.submittedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {result.status === 'completed' && (
                          <button
                            onClick={() => handleGrade(result.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Chấm điểm"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Không tìm thấy kết quả nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc tìm kiếm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}