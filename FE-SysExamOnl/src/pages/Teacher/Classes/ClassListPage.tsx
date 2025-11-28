// src/pages/Teacher/Classes/ClassListPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllClasses, deleteClass } from '../../../api/class-api'
import type { ClassResponse } from '../../../types/class.type'
import ClassFormModal from './ClassFormModal'

const ClassListPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassResponse | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAllClasses(page, 10, 'createdAt,desc')
      setClasses(response.items)
      setTotalPages(response.totalPages)
      setError('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách lớp học'
      setError(errorMessage)
      console.error('Error fetching classes:', err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleDelete = async (classId: number, className: string) => {
    if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"?`)) {
      return
    }

    try {
      await deleteClass(classId)
      fetchClasses()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa lớp học'
      alert(errorMessage)
      console.error('Error deleting class:', err)
    }
  }

  const handleCreateNew = () => {
    setEditingClass(null)
    setIsModalOpen(true)
  }

  const handleEdit = (cls: ClassResponse) => {
    setEditingClass(cls)
    setIsModalOpen(true)
  }

  const handleModalClose = (success?: boolean) => {
    setIsModalOpen(false)
    setEditingClass(null)
    if (success) {
      fetchClasses()
    }
  }

  const filteredClasses = searchTerm
    ? classes.filter((cls) => cls.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : classes

  if (loading && classes.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>Đang tải...</div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Quản lý Lớp học</h1>
        <button
          onClick={handleCreateNew}
          className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition'
        >
          + Tạo lớp mới
        </button>
      </div>

      {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

      {/* Search bar */}
      <div className='mb-4'>
        <input
          type='text'
          placeholder='Tìm kiếm lớp học...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </div>

      {/* Class list */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredClasses.map((cls) => (
          <div
            key={cls.classId}
            className='bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-200'
          >
            <div className='flex justify-between items-start mb-3'>
              <h3 className='text-xl font-semibold text-gray-800'>{cls.name}</h3>
              <div className='flex gap-2'>
                <button
                  onClick={() => handleEdit(cls)}
                  className='text-blue-600 hover:text-blue-800 text-sm'
                  title='Chỉnh sửa'
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(cls.id, cls.name)}
                  className='text-red-600 hover:text-red-800 text-sm'
                  title='Xóa'
                >
                  🗑️
                </button>
              </div>
            </div>

            {cls.description && <p className='text-gray-600 text-sm mb-4 line-clamp-2'>{cls.description}</p>}

            <div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
              <span>👥 {cls.studentCount || 0} học sinh</span>
              <span>📝 {cls.examSessionCount || 0} bài thi</span>
            </div>

            <div className='text-xs text-gray-400 mb-4'>Tạo: {new Date(cls.createdAt).toLocaleDateString('vi-VN')}</div>

            <Link
              to={`/teacher/classes/${cls.classId}`}
              className='block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded transition'
            >
              Xem chi tiết
            </Link>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && !loading && (
        <div className='text-center text-gray-500 py-12'>
          {searchTerm ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center items-center gap-2 mt-8'>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className='px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
          >
            ← Trước
          </button>
          <span className='px-4 py-2'>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className='px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100'
          >
            Sau →
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && <ClassFormModal classData={editingClass} onClose={handleModalClose} />}
    </div>
  )
}

export default ClassListPage
