'use client'

import { Plus, Eye, Trash2, X, Calendar, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBankQuestion } from '../Tabs/HookTab/HookBanktab'

export default function QuestionPaperBank() {
  const {
    papers, selectedPaper, loadingPapers, loadingDetail,
    page, totalPages, showAddModal,
    newName, setNewName, newDesc, setNewDesc,
    newQuestions, setNewQuestions,
    fileInputRef, triggerImport, handleImportFile, handleExport,
    setShowAddModal, setSelectedPaper, fetchPaperDetail, fetchPapers,
    handleDeletePaper, handleAddPaper, resetAddForm,
    formatDate, difficultyText
  } = useBankQuestion()

  return (
    <>
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowAddModal(false)} />
      )}

      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 drop-shadow-sm">Ngân hàng đề thi</h1>
            <button
              onClick={() => { resetAddForm(); setShowAddModal(true); }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
            >
              <Plus size={20} /> Tạo đề thi mới
            </button>
          </div>

          {/* BODY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LIST */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-200">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                <FileText size={20} className="text-blue-600" /> Danh sách đề thi
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {loadingPapers ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-blue-600" /></div>
                ) : papers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có đề thi nào</p>
                ) : (
                  papers.map(p => (
                    <div
                      key={p.bankQuestionId}
                      onClick={() => fetchPaperDetail(p.bankQuestionId)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedPaper?.bankQuestionId === p.bankQuestionId
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-800 truncate">{p.name}</div>
                      <div className="text-sm text-gray-600 line-clamp-1 mt-1">{p.description || 'Không có mô tả'}</div>
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(p.createdAt)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePaper(p.bankQuestionId) }}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => fetchPapers(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium">Trang {page + 1} / {totalPages}</span>
                  <button
                    onClick={() => fetchPapers(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* DETAIL */}
            <div className="lg:col-span-2">
              {!selectedPaper ? (
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-12 text-center text-gray-500">
                  <Eye size={60} className="mx-auto opacity-40 mb-4 text-blue-400" />
                  <p className="text-lg font-medium">Chọn một đề thi để xem chi tiết</p>
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPaper.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedPaper.description || 'Không có mô tả'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPaper(null)}
                      className="text-gray-500 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {loadingDetail ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {selectedPaper.questions.map((q, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-800">Câu {i + 1}: {q.content}</h3>
                            <span className="text-indigo-600 font-bold text-sm">{q.point} điểm</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Độ khó: <span className="font-medium">{difficultyText(q.difficulty)}</span></p>
                          {q.explanation && <p className="text-sm text-amber-700 mb-3 italic">Giải thích: {q.explanation}</p>}
                          <ul className="space-y-2">
                            {q.answers.map((a, j) => (
                              <li key={j} className={`flex gap-2 items-start text-sm ${a.correct ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>
                                <span className="font-bold">{String.fromCharCode(65 + j)}.</span>
                                <span>{a.content}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== MODAL TẠO ĐỀ ==================== */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Tạo ngân hàng đề thi mới</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Tên + mô tả */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên ngân hàng đề"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                  <textarea
                    className="w-full md:col-span-2 border border-gray-300 rounded-lg p-3 text-sm resize-none"
                    placeholder="Mô tả (tùy chọn)"
                    rows={2}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                </div>

                {/* Danh sách câu hỏi */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Câu hỏi</h3>
                    <button
                      onClick={() => setNewQuestions(prev => [...prev, {
                        content: '', difficulty: 'EASY', explanation: '', point: 1,
                        orderColumn: prev.length, shuffleAnswers: true, shuffleQuestions: true,
                        answers: [
                          { content: '', correct: true },
                          { content: '', correct: false },
                          { content: '', correct: false },
                          { content: '', correct: false },
                        ],
                      }])}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={16} /> Thêm câu hỏi
                    </button>
                  </div>

                  {newQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-700">Câu {qIdx + 1}</span>
                        <button
                          onClick={() => setNewQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nội dung câu hỏi"
                        rows={2}
                        value={q.content}
                        onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, content: e.target.value } : qq))}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          className="border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                          value={q.difficulty}
                          onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, difficulty: e.target.value as any } : qq))}
                        >
                          <option value="EASY">Dễ</option>
                          <option value="MEDIUM">Trung bình</option>
                          <option value="HARD">Khó</option>
                        </select>

                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Điểm"
                          value={q.point}
                          onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, point: parseFloat(e.target.value) || 1 } : qq))}
                        />

                        <input
                          type="text"
                          className="border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Giải thích (tùy chọn)"
                          value={q.explanation || ''}
                          onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, explanation: e.target.value } : qq))}
                        />
                      </div>

                      {/* Đáp án */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-600">Đáp án:</p>
                        {q.answers.map((a, aIdx) => (
                          <div key={aIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={a.correct}
                              onChange={() => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? {
                                ...qq,
                                answers: qq.answers.map((aa, j) => ({ ...aa, correct: j === aIdx }))
                              } : qq))}
                              className="w-4 h-4 text-blue-600"
                            />
                            <input
                              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                              value={a.content}
                              onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? {
                                ...qq,
                                answers: qq.answers.map((aa, j) => j === aIdx ? { ...aa, content: e.target.value } : aa)
                              } : qq))}
                            />
                            {q.answers.length > 2 && (
                              <button
                                onClick={() => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? {
                                  ...qq,
                                  answers: qq.answers.filter((_, j) => j !== aIdx)
                                } : qq))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        {q.answers.length < 6 && (
                          <button
                            onClick={() => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? {
                              ...qq,
                              answers: [...qq.answers, { content: '', correct: false }]
                            } : qq))}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            + Thêm đáp án
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddPaper}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-md transition-all"
                >
                  Tạo đề thi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import/Export buttons */}
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          <button onClick={triggerImport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md text-sm">
            Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md text-sm">
            Export
          </button>
        </div>
      </div>
    </>
  )
}