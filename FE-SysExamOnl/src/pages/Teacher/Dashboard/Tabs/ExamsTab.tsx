// src/components/teacher/ExamsTab.tsx
import React from 'react';
import { toast } from 'react-toastify';
import { exportExams } from '../../Dashboard/import_export/exportExams';
import { importExams } from '../../Dashboard/import_export/importExams';
import { useExamsTab, DURATIONS } from '../Tabs/HookTab/HookExamsTab';
import { CheckCircle, Clock, Download, Edit2, Upload } from 'lucide-react';
import  Pagination  from '../../../../components/Common/Pagination';

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
    openTimeModal,
    handleCreateSession,
    formatDateTime,
    setModalData,
    setShowTimeModal,
    setStartAt,
    setExpiredAt,
    setDuration,
    navigate
  } = useExamsTab();

  // === PAGINATION ===
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const currentList = list.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportSelected = () => {
    const ids: number[] = [];
    const names: string[] = [];

    list.forEach((e) => {
      if (selectedExams.get(e.id)) {
        ids.push(Number(e.id));
        names.push(e.name);
      }
    });

    if (ids.length === 0) {
      toast.warn('Vui lòng chọn ít nhất 1 đề!');
      return;
    }

    exportExams(ids, names);
  };

  const selectedCount = Array.from(selectedExams.values()).filter(Boolean).length;

  return (
     <div className="pb-10">

      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Danh sách đề thi
          </h2>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-1 rounded-xl shadow-sm border">
          <input
            type="file"
            accept=".xlsx"
            hidden
            id="examImportFile"
            onChange={(e) => e.target.files?.[0] && importExams(e.target.files[0])}
          />

          <button
            onClick={() => document.getElementById('examImportFile')?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all"
          >
            <Upload size={18} />
            <span>Tải lên</span>
          </button>

          <button
            onClick={handleExportSelected}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
              ${selectedCount === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'}
            `}
          >
            <Download size={18} />
            <span>Tải xuống</span>
            {selectedCount > 0 && <span>({selectedCount})</span>}
          </button>

          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => navigate('/teacher/exams/create')}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              + Tạo đề thi
            </button>

            <button
              onClick={() => navigate('/teacher/questions')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              + Tạo từ ngân hàng
            </button>
          </div>
        </div>
      </div>

      {/* LOADING / EMPTY */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-gray-400 italic">Chưa có đề thi nào.</div>
      ) : (
        <>
          {/* SELECT ALL */}
          <div className="flex items-center gap-3 mb-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={currentList.length > 0 && currentList.every((e) => selectedExams.get(e.id))}
              onChange={() => currentList.forEach((e) => toggleSelect(e.id))}
              className="w-4 h-4 accent-blue-600"
            />
            <span>Chọn tất cả (trong trang)</span>
          </div>

          {/* GRID */}
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">

  {currentList.map((exam) => (
  <div
    key={exam.id}
    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-3 flex flex-col h-full"
  >
    <div className="flex items-start gap-2 flex-1">
      <input
        type="checkbox"
        checked={!!selectedExams.get(exam.id)}
        onChange={() => toggleSelect(exam.id)}
        className="w-4 h-4 accent-blue-600 mt-1 flex-shrink-0"
      />

      <div
        onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
        className="flex-1 cursor-pointer min-w-0" // thêm min-w-0 để text không đẩy layout
      >
        {/* Tên đề thi - 2 dòng, ... nếu dài */}
        <h3 className="font-semibold text-blue-700 text-base line-clamp-2 break-words">
          {exam.name}
        </h3>

        {/* Mô tả - 2 dòng, ... nếu dài */}
        <p className="text-sm text-gray-500 mt-1 line-clamp-2 break-words">
          {exam.description || 'Không có mô tả.'}
        </p>

        {/* Số câu hỏi */}
        <span className="text-[10px] text-gray-600 block mt-1.5">
          {exam.numberQuestions} câu
        </span>
      </div>
    </div>

    {/* Nút hành động */}
    <div className="flex flex-wrap gap-3 text-[11px] mt-3 pt-2 border-t border-gray-300">
      <button
        onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
        className="text-blue-600 hover:underline flex items-center gap-1"
      >
        <Edit2 className="w-3.5 h-3.5" /> Sửa
      </button>

      <button
        onClick={() =>
          navigate('/teacher/exam-sessions/list', { state: { examId: exam.id } })
        }
        className="text-green-600 hover:underline flex items-center gap-1"
      >
        <CheckCircle className="w-3.5 h-3.5" /> Đã giao
      </button>

      <button
        onClick={() => openTimeModal(exam.id)}
        className="text-red-600 hover:underline flex items-center gap-1"
      >
        <Clock className="w-3.5 h-3.5" /> Giao đề
      </button>
    </div>
  </div>
))}
</div>

        </>
      )}
 
      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="fixed bottom-0 left-0 w-full   shadow-lg z-50"
      />

     {/* MODAL THỜI GIAN */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4">Thiết lập phiên thi</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Thời gian làm bài</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTimeModal(false)} className="px-4 py-2 text-gray-600">
                Hủy
              </button>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className={`px-5 py-2 rounded-xl text-white ${
                  creating ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {creating ? 'Đang tạo...' : 'Tạo phiên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KẾT QUẢ */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-semibold text-center mb-4">Tạo phiên thành công!</h3>

            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="font-medium text-blue-700 mb-1">Link tham gia</p>
                <div className="flex items-center gap-2">
                  <a
                    href={modalData.inviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-blue-600 text-sm break-all underline hover:text-blue-800"
                  >
                    {modalData.inviteLink}
                  </a>
                </div>
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
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalData.inviteLink);
                  toast.success('Copied link!');
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl cursor-pointer"
              >
                Copy Link
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalData.code);
                  toast.success('Copied mã!');
                }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-xl cursor-pointer"
              >
                Copy Mã
              </button>

              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}