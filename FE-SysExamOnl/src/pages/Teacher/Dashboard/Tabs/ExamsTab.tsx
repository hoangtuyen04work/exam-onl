// src/components/teacher/ExamsTab.tsx
import React from 'react'
import { toast } from 'react-toastify'
import { exportExams } from '../../Dashboard/import_export/exportExams'
import { importExams } from '../../Dashboard/import_export/importExams'
import { useExamsTab, DURATIONS } from '../Tabs/HookTab/HookExamsTab'

export default function ExamsTab() {
  const {
    list,
    loading,
    selectedExams,
    modalData,
    showTimeModal,
    startAt,
    expiredAt,
    duration,
    creating,

    toggleSelect,
    selectAll,
    openTimeModal,
    handleCreateSession,
    formatDateTime,
    setModalData,
    setShowTimeModal,
    setStartAt,
    setExpiredAt,
    setDuration,
    navigate
  } = useExamsTab()

  const handleExportSelected = () => {
    const selectedIds: number[] = []
    const selectedNames: string[] = []

    list.forEach(exam => {
      if (selectedExams.get(exam.id)) {
        selectedIds.push(Number(exam.id))
        selectedNames.push(exam.name)
      }
    })

    if (selectedIds.length === 0) {
      toast.warn('Vui lòng chọn ít nhất 1 đề để export!')
      return
    }

    exportExams(selectedIds, selectedNames)
  }

  const selectedCount = Array.from(selectedExams.values()).filter(Boolean).length

  return (
<<<<<<< HEAD
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
          Danh sách đề thi
        </h2>
=======
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-bold'>Danh sách đề thi</h2>
>>>>>>> 2eabc32c43b3ca16544cfdafe3e750b0f4a9e142

        <div className='flex gap-3'>
          <button
            onClick={() => navigate('/teacher/exams/create')}
<<<<<<< HEAD
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow hover:shadow-xl transition-all"
=======
            className='bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition'
>>>>>>> 2eabc32c43b3ca16544cfdafe3e750b0f4a9e142
          >
            + Tạo đề thi
          </button>

          <button
            onClick={() => navigate('/teacher/questions')}
<<<<<<< HEAD
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow hover:shadow-xl transition-all"
=======
            className='bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition'
>>>>>>> 2eabc32c43b3ca16544cfdafe3e750b0f4a9e142
          >
            + Tạo từ ngân hàng
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Import */}
      <input
        type="file"
        accept=".xlsx"
        id="importExcel"
        hidden
        onChange={(e) => e.target.files?.[0] && importExams(e.target.files[0])}
      />
      <button
        onClick={() => document.getElementById('importExcel')?.click()}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:shadow-xl transition-all mb-4"
      >
        Import đề thi (.xlsx)
      </button>

      {/* Export selected */}
      {selectedCount > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            Đã chọn {selectedCount} đề thi
          </span>
          <button
            onClick={handleExportSelected}
            className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg shadow hover:bg-blue-700 transition"
          >
            Export các đề đã chọn
          </button>
=======
      {loading ? (
        <div className='text-center py-8'>Đang tải...</div>
      ) : list.length === 0 ? (
        <div className='text-center py-8 text-gray-500 italic'>Chưa có đề thi nào.</div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={list.length > 0 && selectedCount === list.length}
              onChange={selectAll}
              className="w-5 h-5 accent-blue-600 rounded"
            />
            <span>Chọn tất cả</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((exam) => (
              <div
                key={exam.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-xl transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!selectedExams.get(exam.id)}
                    onChange={() => toggleSelect(exam.id)}
                    className="w-5 h-5 accent-blue-600 rounded mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-700 line-clamp-2">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {exam.description || 'Không có mô tả.'}
                    </p>
                    <span className="text-[11px] text-gray-500 mt-2 block">
                      {exam.numberQuestions} câu — {exam.durationMinutes} phút
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs mt-4">
                  <button
                    onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => navigate('/teacher/exam-sessions/list', { state: { examId: exam.id } })}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Đã giao
                  </button>
                  <button
                    onClick={() => openTimeModal(exam.id)}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Giao đề
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal thời gian + kết quả giữ nguyên như cũ, chỉ thay DURATIONS import từ hook */}
      {showTimeModal && (
<<<<<<< HEAD
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Thiết lập phiên thi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Thời gian bắt đầu</label>
                <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
<<<<<<< HEAD
                <label className="block text-sm font-medium">Thời gian kết thúc</label>
                <input type="datetime-local" value={expiredAt} onChange={e => setExpiredAt(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium">Thời gian làm bài</label>
                <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                  {DURATIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
<<<<<<< HEAD
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTimeModal(false)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className={`px-5 py-2 rounded-xl text-white ${creating ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {creating ? 'Đang tạo...' : 'Tạo phiên'}
=======
                className={`px-5 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  creating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {creating ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Đang tạo...
                  </>
                ) : (
                  'Tạo phiên'
                )}
>>>>>>> 2eabc32c43b3ca16544cfdafe3e750b0f4a9e142
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal kết quả */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-center mb-4">Tạo phiên thành công!</h3>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="font-medium">Link:</p>
                <a href={modalData.inviteLink} target="_blank" rel="noreferrer" className="text-blue-600 break-all text-xs">
                  {modalData.inviteLink}
                </a>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <p className="font-medium">Mã tham gia:</p>
                <p className="font-mono text-2xl text-green-700">{modalData.code}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-purple-50 p-3 rounded-xl text-center">
                  <p className="font-medium">Mở lúc</p>
                  <p>{formatDateTime(modalData.startAt)}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl text-center">
                  <p className="font-medium">Đóng lúc</p>
                  <p>{formatDateTime(modalData.expiredAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => { navigator.clipboard.writeText(modalData.inviteLink); toast.success('Copied link!') }} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl">Copy Link</button>
              <button onClick={() => { navigator.clipboard.writeText(modalData.code); toast.success('Copied mã!') }} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl">Copy Mã</button>
              <button onClick={() => setModalData(null)} className="px-4 py-2 bg-gray-700 text-white rounded-xl">Đóng</button>
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======

      {/* hidden file input for exams import */}
      <input ref={fileInputRefExam} type='file' accept='.xlsx,.xls' className='hidden' onChange={handleImportExam} />

      {/* fixed import/export buttons bottom-right */}
      <div className='fixed bottom-6 right-6 z-50 flex flex-col gap-3'>
        <button
          onClick={triggerImportExam}
          className='px-4 py-2 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md text-sm'
          title='Import đề thi từ Excel'
        >
          Import
        </button>
        <button
          onClick={handleExportExam}
          className='px-4 py-2 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md text-sm'
          title='Export các đề thi ra Excel'
        >
          Export
        </button>
      </div>
>>>>>>> 2eabc32c43b3ca16544cfdafe3e750b0f4a9e142
    </div>
  )
}