// src/components/teacher/ExamsTab.tsx
import React from 'react'
import { toast } from 'react-toastify'
import { exportExams } from '../../Dashboard/import_export/exportExams'
import { importExams } from '../../Dashboard/import_export/importExams'
import { useExamsTab } from '../Tabs/HookTab/HookExamsTab'
import { Calendar, Check, CheckCircle, Database, Download, Edit2, FileText, Plus, Upload } from 'lucide-react'
import Pagination from '../../../../components/Common/Pagination'

export default function ExamsTab() {
  const {
    list,
    loading,
    selectedExams,
    modalData,
    showTimeModal,
    sessionName,
    startAt,
    expiredAt,
    duration,
    passingScore,
    creating,

    toggleSelect,
    openTimeModal,
    handleCreateSession,
    formatDateTime,
    setModalData,
    setShowTimeModal,
    setSessionName,
    setStartAt,
    setExpiredAt,
    setDuration,
    setPassingScore,
    navigate
  } = useExamsTab()

  // === PAGINATION ===
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 8
  const totalPages = Math.ceil(list.length / itemsPerPage)
  const currentList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportSelected = () => {
    const ids: number[] = []
    const names: string[] = []

    list.forEach((e) => {
      if (selectedExams.get(e.id)) {
        ids.push(Number(e.id))
        names.push(e.name)
      }
    })

    if (ids.length === 0) {
      toast.warn('Vui lòng chọn ít nhất 1 đề!')
      return
    }

    exportExams(ids, names)
  }

  const selectedCount = Array.from(selectedExams.values()).filter(Boolean).length

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Danh sách đề thi</h1>
            <p className='text-gray-600 mt-1'>Quản lý và tổ chức các kỳ thi của bạn</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6'>
          <div className='flex flex-wrap items-center gap-3'>
            {/* Import button */}
            <input
              type='file'
              accept='.xlsx'
              hidden
              id='examImportFile'
              onChange={(e) => e.target.files?.[0] && importExams(e.target.files[0])}
            />
            <button
              onClick={() => document.getElementById('examImportFile')?.click()}
              className='inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
            >
              <Upload size={18} />
              <span>Tải lên Excel</span>
            </button>

            {/* Export button */}
            <button
              onClick={handleExportSelected}
              disabled={selectedCount === 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-colors ${
                selectedCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download size={18} />
              <span>Tải xuống ({selectedCount})</span>
            </button>

            {/* Spacer */}
            <div className='flex-1'></div>

            {/* Create buttons */}
            <div className='flex items-center gap-3'>
              <button
                onClick={() => navigate('/teacher/exams/create')}
                className='inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all shadow-sm'
              >
                <Plus size={18} />
                <span>Tạo đề thi mới</span>
              </button>
              <button
                onClick={() => navigate('/teacher/questions')}
                className='inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-sm'
              >
                <Database size={18} />
                <span>Tạo từ ngân hàng</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4'></div>
            <p className='text-gray-600'>Đang tải danh sách đề thi...</p>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
              <FileText className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có đề thi nào</h3>
            <p className='text-gray-600 mb-6'>Bắt đầu bằng cách tạo đề thi mới hoặc tải lên từ file Excel.</p>
            <button
              onClick={() => navigate('/teacher/exams/create')}
              className='px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
            >
              Tạo đề thi đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Select all checkbox */}
          <div className='bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0 p-4'>
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                checked={currentList.length > 0 && currentList.every((e) => selectedExams.get(e.id))}
                onChange={() => currentList.forEach((e) => toggleSelect(e.id))}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
              />
              <span className='text-sm font-medium text-gray-700'>Chọn tất cả trong trang này</span>
              {selectedCount > 0 && (
                <span className='ml-2 text-sm text-gray-600'>({selectedCount} đề thi được chọn)</span>
              )}
            </div>
          </div>

          {/* Exam cards grid */}
          <div className='bg-white rounded-b-xl shadow-sm border border-gray-200 p-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {currentList.map((exam) => (
                <div
                  key={exam.id}
                  className='group bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all hover:shadow-md'
                >
                  {/* Card header with checkbox */}
                  <div className='flex items-start gap-3 mb-3'>
                    <input
                      type='checkbox'
                      checked={!!selectedExams.get(exam.id)}
                      onChange={() => toggleSelect(exam.id)}
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0'
                    />
                    <div
                      onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                      className='flex-1 min-w-0 cursor-pointer'
                    >
                      <h3 className='font-semibold text-gray-900 group-hover:text-blue-600 truncate'>{exam.name}</h3>
                      <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{exam.description || 'Không có mô tả'}</p>
                    </div>
                  </div>

                  {/* Exam info */}
                  <div className='flex items-center gap-4 text-sm text-gray-500 mb-4'>
                    <span className='flex items-center gap-1'>
                      <FileText className='w-4 h-4' />
                      {exam.numberQuestions} câu
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className='flex items-center gap-2 pt-3 border-t border-gray-100'>
                    <button
                      onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                      className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
                    >
                      <Edit2 className='w-4 h-4' />
                      Sửa
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/exam-sessions?examId=${exam.id}`)}
                      className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors'
                    >
                      <CheckCircle className='w-4 h-4' />
                      Đã giao
                    </button>
                    <button
                      onClick={() => openTimeModal(exam.id)}
                      className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
                    >
                      <Calendar className='w-4 h-4' />
                      Giao đề
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {list.length > 0 && (
        <div className='mt-6'>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'
          />
        </div>
      )}

      {/* Create Session Modal */}
      {showTimeModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md'>
            <div className='p-6'>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Tạo phiên thi mới</h3>
              <p className='text-gray-600 mb-6'>Thiết lập thời gian và thông tin cho kỳ thi</p>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Tên phiên thi <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder='VD: Kỳ thi Giữa kỳ - Lớp CNTT K18'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Thời gian bắt đầu</label>
                    <input
                      type='datetime-local'
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Thời gian kết thúc</label>
                    <input
                      type='datetime-local'
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Thời gian làm bài (phút)</label>
                  <input
                    type='number'
                    min='1'
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder='VD: 60'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Điểm sàn (0-10)</label>
                  <input
                    type='number'
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    min='0'
                    max='10'
                    step='0.01'
                    placeholder='Không bắt buộc'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200'>
              <button
                onClick={() => setShowTimeModal(false)}
                className='px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-colors'
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
                  creating ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {creating ? (
                  <span className='flex items-center gap-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Đang tạo...
                  </span>
                ) : (
                  'Tạo phiên thi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modalData && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg'>
            <div className='p-6'>
              <div className='flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4'>
                <Check className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 text-center mb-2'>Tạo phiên thi thành công!</h3>
              <p className='text-gray-600 text-center mb-6'>Chia sẻ thông tin dưới đây cho học viên</p>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Link tham gia</label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      readOnly
                      value={modalData.inviteLink}
                      className='flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 truncate'
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(modalData.inviteLink)
                        toast.success('Đã sao chép link!')
                      }}
                      className='px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Mã tham gia</label>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg'>
                      <p className='font-mono text-xl font-bold text-center text-gray-900'>{modalData.code}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(modalData.code)
                        toast.success('Đã sao chép mã!')
                      }}
                      className='px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                  <div className='text-center'>
                    <p className='text-sm font-medium text-gray-700 mb-1'>Thời gian mở</p>
                    <p className='text-sm text-gray-900 font-medium'>{formatDateTime(modalData.startAt)}</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm font-medium text-gray-700 mb-1'>Thời gian đóng</p>
                    <p className='text-sm text-gray-900 font-medium'>{formatDateTime(modalData.expiredAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-center p-6 border-t border-gray-200'>
              <button
                onClick={() => setModalData(null)}
                className='px-8 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
