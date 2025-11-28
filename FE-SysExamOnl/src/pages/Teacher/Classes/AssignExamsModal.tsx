import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, Plus, Calendar, Clock, Users, BookOpen, ChevronDown } from 'lucide-react'
import { getAllExams, createExamSession } from '../../../api/exam-api'
import type { ExamResponse } from '../../../api/exam-api'

// Use ExamResponse from exam-api instead
type Exam = ExamResponse

interface AssignExamsModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (examSessionIds: number[]) => Promise<void>
  classId: number // Used for API calls
  className: string
  studentCount: number
}

const AssignExamsModal: React.FC<AssignExamsModalProps> = ({ isOpen, onClose, onAssign, className, studentCount }) => {
  const [isLoading, setIsLoading] = useState(false)

  // Create new session state
  const [exams, setExams] = useState<Exam[]>([])
  const [examPage, setExamPage] = useState(0)
  const [hasMoreExams, setHasMoreExams] = useState(true)
  const [isLoadingExams, setIsLoadingExams] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)

  const examDropdownRef = useRef<HTMLDivElement>(null)
  const examListRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examDropdownRef.current && !examDropdownRef.current.contains(event.target as Node)) {
        setIsExamDropdownOpen(false)
      }
    }

    if (isExamDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExamDropdownOpen])

  const fetchExams = async (page = 0, append = false) => {
    if (isLoadingExams) return

    setIsLoadingExams(true)
    try {
      const examsData = await getAllExams(page, 10)

      if (examsData.length < 10) {
        setHasMoreExams(false)
      }

      if (append) {
        setExams((prev) => [...prev, ...examsData])
      } else {
        setExams(examsData)
      }

      setExamPage(page)
    } catch (error) {
      console.error('Failed to fetch exams:', error)
      alert('Không thể tải danh sách đề thi')
    } finally {
      setIsLoadingExams(false)
    }
  }

  const loadMoreExams = () => {
    if (hasMoreExams && !isLoadingExams) {
      fetchExams(examPage + 1, true)
    }
  }

  const selectedExam = useMemo(() => {
    return exams.find((e) => e.examId === selectedExamId)
  }, [exams, selectedExamId])

  const handleCreateSession = async () => {
    if (!selectedExamId || !sessionName || !startTime || !endTime) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Create exam session
      // Convert datetime-local to ISO 8601 OffsetDateTime format
      const startAtISO = new Date(startTime).toISOString().replace('Z', '+07:00')
      const expiredAtISO = new Date(endTime).toISOString().replace('Z', '+07:00')

      const newSession = await createExamSession({
        examId: selectedExamId,
        name: sessionName,
        startAt: startAtISO,
        expiredAt: expiredAtISO,
        durationMinutes
      })

      // Step 2: Assign session to class
      await onAssign([newSession.examSessionId])

      alert('Tạo và gán đề thi thành công!')
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to create and assign session:', error)
      alert('Có lỗi xảy ra khi tạo đề thi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExamDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100

    // Load more when scrolled 80% down
    if (scrollPercentage > 80 && hasMoreExams && !isLoadingExams) {
      loadMoreExams()
    }
  }

  const handleExamSelect = (examId: number) => {
    setSelectedExamId(examId)
    setIsExamDropdownOpen(false)
  }

  const toggleExamDropdown = () => {
    if (!isExamDropdownOpen && exams.length === 0 && !isLoadingExams) {
      fetchExams(0, false)
    }
    setIsExamDropdownOpen(!isExamDropdownOpen)
  }

  const resetForm = () => {
    setSelectedExamId(null)
    setSessionName('')
    setStartTime('')
    setEndTime('')
    setDurationMinutes(60)
    // Reset exam pagination
    setExamPage(0)
    setHasMoreExams(true)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-white bg-opacity-30 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl'>
          <div className='flex justify-between items-start'>
            <div>
              <h2 className='text-2xl font-bold mb-2'>🎓 Giao đề thi cho lớp</h2>
              <div className='flex items-center gap-4 text-purple-100'>
                <span className='flex items-center gap-2'>
                  <BookOpen className='w-4 h-4' />
                  {className}
                </span>
                <span className='flex items-center gap-2'>
                  <Users className='w-4 h-4' />
                  {studentCount} sinh viên
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 min-h-[400px]'>
          <div className='space-y-6'>
            {/* Select Exam - Custom Dropdown */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Chọn đề thi <span className='text-red-500'>*</span>
              </label>
              <div ref={examDropdownRef} className='relative'>
                {/* Dropdown Button */}
                <button
                  type='button'
                  onClick={toggleExamDropdown}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors'
                >
                  <span className={selectedExam ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedExam
                      ? `${selectedExam.name} (${selectedExam.numberQuestions} câu)`
                      : 'Click để chọn đề thi...'}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExamDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isExamDropdownOpen && (
                  <div className='absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden'>
                    <div ref={examListRef} onScroll={handleExamDropdownScroll} className='max-h-64 overflow-y-auto'>
                      {exams.length === 0 && !isLoadingExams ? (
                        <div className='px-4 py-8 text-center text-gray-500'>
                          <BookOpen className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                          <p className='text-sm'>Đang tải đề thi...</p>
                        </div>
                      ) : (
                        <>
                          {exams.map((exam) => (
                            <button
                              key={exam.examId}
                              type='button'
                              onClick={() => handleExamSelect(exam.examId)}
                              className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                selectedExamId === exam.examId ? 'bg-purple-100 text-purple-900 font-semibold' : ''
                              }`}
                            >
                              <div className='flex justify-between items-start'>
                                <span className='flex-1'>{exam.name}</span>
                                <span className='text-sm text-gray-500 ml-2'>{exam.numberQuestions} câu</span>
                              </div>
                              {exam.description && <p className='text-xs text-gray-500 mt-1'>{exam.description}</p>}
                            </button>
                          ))}
                          {isLoadingExams && (
                            <div className='px-4 py-3 text-center text-sm text-gray-500 border-t'>Đang tải thêm...</div>
                          )}
                          {!hasMoreExams && exams.length > 0 && (
                            <div className='px-4 py-3 text-center text-sm text-gray-400 border-t'>
                              --- Hết danh sách ---
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedExam?.description && <p className='mt-2 text-sm text-gray-600'>📝 {selectedExam.description}</p>}
            </div>

            {/* Session Name */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Tên ca thi <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder='VD: Kỳ thi Giữa kỳ - Lớp CNTT K18'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              />
            </div>

            {/* Time Range */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  <Calendar className='w-4 h-4 inline mr-1' />
                  Thời gian bắt đầu <span className='text-red-500'>*</span>
                </label>
                <input
                  type='datetime-local'
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  <Calendar className='w-4 h-4 inline mr-1' />
                  Thời gian kết thúc <span className='text-red-500'>*</span>
                </label>
                <input
                  type='datetime-local'
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                <Clock className='w-4 h-4 inline mr-1' />
                Thời gian làm bài (phút)
              </label>
              <input
                type='number'
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min='1'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              />
            </div>

            {/* Preview */}
            {selectedExamId && sessionName && startTime && endTime && (
              <div className='bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6'>
                <h3 className='font-bold text-purple-900 mb-4 flex items-center gap-2'>
                  <Plus className='w-5 h-5' />
                  Xem trước ca thi
                </h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Đề thi:</span>
                    <span className='font-semibold text-gray-900'>{selectedExam?.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Tên ca thi:</span>
                    <span className='font-semibold text-gray-900'>{sessionName}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Bắt đầu:</span>
                    <span className='font-semibold text-gray-900'>{formatDateTime(startTime)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Kết thúc:</span>
                    <span className='font-semibold text-gray-900'>{formatDateTime(endTime)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Thời gian làm bài:</span>
                    <span className='font-semibold text-gray-900'>{durationMinutes} phút</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl'>
          <div className='flex justify-end gap-3'>
            <button
              onClick={handleClose}
              className='px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors'
            >
              Hủy
            </button>
            <button
              onClick={handleCreateSession}
              disabled={isLoading || !selectedExamId || !sessionName || !startTime || !endTime}
              className='px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl'
            >
              {isLoading ? 'Đang xử lý...' : 'Tạo và gán đề thi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignExamsModal
