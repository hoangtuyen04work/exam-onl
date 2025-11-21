// src/components/teacher/ExamsTab.tsx
import React from "react";
import { toast } from "react-toastify";
import { exportExams } from "../../Dashboard/import_export/exportExams";
import { importExams } from "../../Dashboard/import_export/importExams";
import { useExamsTab, DURATIONS } from "../Tabs/HookTab/HookExamsTab";

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
    navigate,
  } = useExamsTab();

  // PAGINATION
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;

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
      toast.warn("Vui lòng chọn ít nhất 1 đề!");
      return;
    }

    exportExams(ids, names);
  };

<<<<<<< HEAD
  const selectedCount = Array.from(selectedExams.values()).filter(Boolean)
    .length;
=======
  const selectedCount = Array.from(selectedExams.values()).filter(Boolean).length;
>>>>>>> b302eaeb8bcfda52684e052ee2565286eea8f7cc

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-[calc(100vh-120px)] flex flex-col">
      {/* HEADER + TOOLBAR */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Danh sách đề thi
          </h2>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl shadow-sm border">
          {/* IMPORT */}
          <input
            type="file"
            accept=".xlsx"
            hidden
            id="examImportFile"
            onChange={(e) =>
              e.target.files?.[0] && importExams(e.target.files[0])
            }
          />
          <button
            onClick={() => document.getElementById("examImportFile")?.click()}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
          >
            Import (.xlsx)
          </button>

          {/* EXPORT SELECTED */}
          <button
            onClick={handleExportSelected}
            disabled={selectedCount === 0}
            className={`px-4 py-2 rounded-xl transition ${
              selectedCount === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Export đã chọn {selectedCount > 0 && `(${selectedCount})`}
          </button>

          {/* ADD BUTTONS */}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => navigate("/teacher/exams/create")}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              + Tạo đề thi
            </button>
            <button
              onClick={() => navigate("/teacher/questions")}
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
        <div className="text-center py-10 text-gray-400 italic">
          Chưa có đề thi nào.
        </div>
      ) : (
        <>
          {/* CHECKBOX SELECT ALL */}
          <div className="flex items-center gap-3 mb-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={
                currentList.length > 0 &&
                currentList.every((e) => selectedExams.get(e.id))
              }
              onChange={() =>
                currentList.forEach((e) => toggleSelect(e.id))
              }
              className="w-5 h-5 accent-blue-600"
            />
            <span>Chọn tất cả (trong trang)</span>
          </div>

          {/* GRID LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentList.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-gray-200 shadow hover:shadow-lg transition p-5"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!selectedExams.get(exam.id)}
                    onChange={() => toggleSelect(exam.id)}
                    className="w-5 h-5 accent-blue-600 mt-1"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-700 text-lg line-clamp-2">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {exam.description || "Không có mô tả."}
                    </p>
                    <span className="text-[11px] text-gray-600 block mt-2">
                      {exam.numberQuestions} câu — {exam.durationMinutes} phút
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs mt-4">
                  <button
                    onClick={() =>
                      navigate(`/teacher/exams/${exam.id}/edit`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() =>
                      navigate("/teacher/exam-sessions/list", {
                        state: { examId: exam.id },
                      })
                    }
                    className="text-blue-600 hover:underline"
                  >
                    Đã giao
                  </button>
                  <button
                    onClick={() => openTimeModal(exam.id)}
                    className="text-green-600 hover:underline"
                  >
                    Giao đề
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PAGINATION */}
      <div className="mt-auto pt-6">
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === 1
                  ? "text-gray-400 border-gray-300"
                  : "hover:bg-gray-100"
              }`}
            >
              ← Trước
            </button>

            <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
              Trang {currentPage}/{totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-300"
                  : "hover:bg-gray-100"
              }`}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* MODAL THỜI GIAN & KẾT QUẢ - vẫn dùng từ HookExamsTab */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
<<<<<<< HEAD
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4">Thiết lập phiên thi</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Thời gian bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Thời gian kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Thời gian làm bài
                </label>
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
              <button
                onClick={() => setShowTimeModal(false)}
                className="px-4 py-2 text-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSession}
                disabled={creating}
                className={`px-5 py-2 rounded-xl text-white ${
                  creating
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {creating ? "Đang tạo..." : "Tạo phiên"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL KẾT QUẢ ===== */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-semibold text-center mb-4">
              Tạo phiên thành công!
            </h3>

            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="font-medium">Link:</p>
                <a
                  href={modalData.inviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 text-xs break-all"
                >
                  {modalData.inviteLink}
                </a>
              </div>

              <div className="bg-green-50 p-4 rounded-xl text-center">
                <p className="font-medium">Mã tham gia:</p>
                <p className="font-mono text-2xl text-green-700">
                  {modalData.code}
                </p>
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
                  toast.success("Copied link!");
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl"
              >
                Copy Link
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalData.code);
                  toast.success("Copied mã!");
                }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-xl"
              >
                Copy Mã
              </button>

              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
=======
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Nội dung modal thời gian và kết quả giữ nguyên như cũ từ hook */}
            {/* ... (giữ nguyên code modal bạn đã có trong HookExamsTab) */}
          </div>
        </div>
      )}
>>>>>>> b302eaeb8bcfda52684e052ee2565286eea8f7cc
    </div>
  );
}