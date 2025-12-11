import { useState } from 'react'
import { mockStudents } from '../../../../data/mockData'
import { Search, Filter, Plus, Edit, Trash2, Mail, User, Users, UserCheck, UserX } from 'lucide-react'

export default function StudentList() {
  const [students, setStudents] = useState(mockStudents)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const classes = [...new Set(students.map(s => s.class))]
  const statuses = ['active', 'inactive']

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || student.status === statusFilter
    const matchesClass = !classFilter || student.class === classFilter
    return matchesSearch && matchesStatus && matchesClass
  })

  const handleDelete = (studentId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa thí sinh này?')) {
      setStudents(students.filter(s => s.id !== studentId))
    }
  }

  const handleToggleStatus = (studentId: string) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, status: student.status === 'active' ? 'inactive' : 'active' }
        : student
    ))
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Hoạt động' : 'Không hoạt động'
  }

  const getStatusIcon = (status: string) => {
    return status === 'active' ? UserCheck : UserX
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Quản lý thí sinh</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm thí sinh
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
                <p className="text-sm text-gray-600">Tổng thí sinh</p>
                <p className="text-xl font-semibold">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-xl font-semibold">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Không hoạt động</p>
                <p className="text-xl font-semibold">
                  {students.filter(s => s.status === 'inactive').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Lớp học</p>
                <p className="text-xl font-semibold">{classes.length}</p>
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
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Tất cả lớp</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
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
                setClassFilter('')
                setStatusFilter('')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const StatusIcon = getStatusIcon(student.status)
            return (
              <div key={student.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.studentId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Lớp: {student.class}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(student.id)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg flex items-center justify-center gap-2 ${
                      student.status === 'active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {student.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </button>
                  <button
                    className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Xóa thí sinh"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Không tìm thấy thí sinh nào</p>
            <p className="text-sm">Thử thay đổi bộ lọc tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  )
}