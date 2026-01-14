import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, Calendar, Clock, Users, BookOpen, ChevronDown } from 'lucide-react'
import { getAllExams, createExamSession } from '../../../api/exam-api'
import type { ExamResponse } from '../../../api/exam-api'
import { notification } from 'antd'

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
  const [durationMinutesInput, setDurationMinutesInput] = useState('60')
  const [passingScore, setPassingScore] = useState<string>('')

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
      notification.error({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đề thi'
      })
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

  const durationMinutes = Number(durationMinutesInput) || selectedExam?.durationMinutes || 60

  const handleCreateSession = async () => {
    if (!selectedExamId || !sessionName || !startTime || !endTime) {
      notification.warning({
        title: 'Cảnh báo',
        description: 'Vui lòng điền đầy đủ thông tin'
      })
      return
    }

    if (durationMinutes <= 0) {
      notification.warning({
        title: 'Cảnh báo',
        description: 'Thời gian làm bài phải lớn hơn 0 phút'
      })
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
        durationMinutes,
        passingScore: passingScore ? parseFloat(passingScore) : 0
      })

      // Step 2: Assign session to class
      await onAssign([newSession.examSessionId])

      notification.success({
        title: 'Thành công',
        description: 'Tạo và gán đề thi thành công!'
      })
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to create and assign session:', error)
      notification.error({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tạo đề thi'
      })
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
    const exam = exams.find((e) => e.examId === examId)
    setDurationMinutesInput(exam?.durationMinutes?.toString() || '60')
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
    setDurationMinutesInput('60')
    setPassingScore('')
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
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn'
      onClick={handleClose}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        className='bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-white/20 animate-scaleIn'
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-sm text-white px-6 py-4 border-b border-white/10 rounded-t-3xl'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-3'>
              <div className='w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                <BookOpen className='w-6 h-6' />
              </div>
              <div>
                <h2 className='text-lg font-bold mb-1'>Giao đề thi cho lớp</h2>
                <div className='flex items-center gap-4 text-purple-100 text-xs'>
                  <span className='flex items-center gap-1.5'>
                    <BookOpen className='w-3.5 h-3.5' />
                    {className}
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <Users className='w-3.5 h-3.5' />
                    {studentCount} sinh viên
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-all duration-200'
              disabled={isLoading}
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 min-h-[400px]'>
          <div className='space-y-5'>
            {/* Select Exam - Custom Dropdown */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                <BookOpen className='w-4 h-4' />
                Chọn đề thi <span className='text-red-500'>*</span>
              </label>
              <div ref={examDropdownRef} className='relative'>
                {/* Dropdown Button */}
                <button
                  type='button'
                  onClick={toggleExamDropdown}
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-left flex items-center justify-between hover:border-gray-300 transition-all duration-200'
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
                  <div className='absolute z-10 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden'>
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
              {selectedExam?.description && (
                <p className='mt-2 text-sm text-gray-600 bg-blue-50/80 backdrop-blur-sm px-3 py-2 rounded-lg'>
                  📝 {selectedExam.description}
                </p>
              )}
            </div>

            {/* Session Name */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                Tên ca thi <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder='VD: Kỳ thi Giữa kỳ - Lớp CNTT K18'
                className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200'
              />
            </div>

            {/* Time Range */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Thời gian bắt đầu <span className='text-red-500'>*</span>
                </label>
                <input
                  type='datetime-local'
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Thời gian kết thúc <span className='text-red-500'>*</span>
                </label>
                <input
                  type='datetime-local'
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200'
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                <Clock className='w-4 h-4' />
                Thời gian làm bài (phút) <span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                min='1'
                value={durationMinutesInput}
                onChange={(e) => setDurationMinutesInput(e.target.value)}
                className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200'
              />
            </div>

            {/* Passing Score */}
            <div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  Điểm sàn (0-100)
                </label>
                <input
                  type='number'
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  min='0'
                  max='100'
                  step='0.01'
                  placeholder='VD: 50 (không bắt buộc)'
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200'
                />
              </div>
            </div>

            {/* Preview */}
            {selectedExamId && sessionName && startTime && endTime && (
              <div className='bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-5'>
                <h3 className='font-bold text-purple-900 mb-4 flex items-center gap-2'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  Xem trước ca thi
                </h3>
                <div className='space-y-2.5 text-sm'>
                  <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                    <span className='text-gray-600'>Đề thi:</span>
                    <span className='font-semibold text-gray-900'>{selectedExam?.name}</span>
                  </div>
                  <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                    <span className='text-gray-600'>Tên ca thi:</span>
                    <span className='font-semibold text-gray-900'>{sessionName}</span>
                  </div>
                  <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                    <span className='text-gray-600'>Bắt đầu:</span>
                    <span className='font-semibold text-gray-900'>{formatDateTime(startTime)}</span>
                  </div>
                  <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                    <span className='text-gray-600'>Kết thúc:</span>
                    <span className='font-semibold text-gray-900'>{formatDateTime(endTime)}</span>
                  </div>
                  <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                    <span className='text-gray-600'>Thời gian làm bài:</span>
                    <span className='font-semibold text-gray-900'>{durationMinutes} phút</span>
                  </div>
                  {passingScore && (
                    <div className='flex justify-between items-center py-2'>
                      <span className='text-gray-600'>Điểm sàn:</span>
                      <span className='font-semibold text-purple-600'>{passingScore}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200/50 p-6 bg-gray-50/80 backdrop-blur-sm rounded-b-3xl'>
          <div className='flex justify-end gap-3'>
            <button
              onClick={handleClose}
              className='px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-100/80 backdrop-blur-sm transition-all duration-200 font-medium text-gray-700'
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              onClick={handleCreateSession}
              disabled={isLoading || !selectedExamId || !sessionName || !startTime || !endTime}
              className='px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/30 flex items-center gap-2'
            >
              {isLoading ? (
                <span className='flex items-center gap-2'>
                  <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <span className='flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Tạo và gán đề thi
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default AssignExamsModal
