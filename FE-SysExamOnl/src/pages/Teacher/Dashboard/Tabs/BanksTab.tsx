'use client'

import { Plus, Eye, Trash2, X, Calendar, FileText, Loader2, ChevronLeft, ChevronRight, Download, Upload, Edit } from 'lucide-react'
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowAddModal(false)} />
      )}

      <div className="  p-4">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* HEADER - tiêu đề đã bỏ, search + tạo mới sang trái */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <input
                  type="text"
                  placeholder="Tìm kiếm đề thi..."
                  className="outline-none text-sm placeholder-slate-400 w-56 bg-transparent"
                />
                <button className="text-slate-500 hover:text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                </button>
              </div>

              <button
                onClick={() => { resetAddForm(); setShowAddModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow hover:scale-[1.02] transition"
              >
                <Plus size={16} /> Tạo mới
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Giữ trống hoặc chèn các control cần thiết về phía phải nếu muốn */}
            </div>
          </div>

          {/* LAYOUT: list + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LIST */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-slate-800">Danh sách ngân hàng</h3>
                  <span className="text-sm text-slate-500">({papers.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExport} className="p-2 rounded-md hover:bg-slate-50 text-slate-600" title="Xuất">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={triggerImport} className="p-2 rounded-md hover:bg-slate-50 text-slate-600" title="Nhập">
                    <Upload className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={handleImportFile} />
                </div>
              </div>

              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
                {loadingPapers ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin w-7 h-7 text-indigo-600" />
                  </div>
                ) : papers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Chưa có ngân hàng đề</div>
                ) : (
                  papers.map(p => (
                    <div
                      key={p.bankQuestionId}
                      onClick={() => fetchPaperDetail(p.bankQuestionId)}
                      className={`flex justify-between items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${selectedPaper?.bankQuestionId === p.bankQuestionId ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 shadow' : 'bg-white border-gray-100 hover:shadow-sm'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {String(p.name || 'D').slice(0,1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500 truncate">{p.description || 'Không có mô tả'}</div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> <span>{formatDate(p.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePaper(p.bankQuestionId) }}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-400">{p.questionCount ?? 0} câu</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => fetchPapers(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded-md bg-white border border-gray-100 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-sm text-slate-600">Trang {page + 1} / {totalPages}</div>
                  <button
                    onClick={() => fetchPapers(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-md bg-white border border-gray-100 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* DETAIL */}
            <div className="lg:col-span-2">
              {!selectedPaper ? (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl shadow p-12 border border-gray-100">
                  <Eye size={64} className="text-indigo-200 mb-4" />
                  <div className="text-lg font-medium text-slate-700">Chọn một đề để xem chi tiết</div>
                  <div className="text-sm text-slate-400 mt-2">Hoặc tạo ngân hàng đề mới để bắt đầu</div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow p-4 border border-gray-100 flex flex-col ">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-800">{selectedPaper.name}</h2>
                      <div className="text-sm text-slate-500 mt-1">{selectedPaper.description || 'Không có mô tả'}</div>
                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(selectedPaper.createdAt)}</span>
                        <span className="px-2 py-1 rounded bg-slate-50 text-slate-500 text-xs">{selectedPaper.questions.length} câu</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleExport()} className="px-3 py-2 rounded-md bg-white border text-slate-600 hover:bg-slate-50">
                        <Download className="w-4 h-4 mr-2 inline" /> Xuất
                      </button>
                      <button onClick={() => { /* placeholder cho edit */ }} className="px-3 py-2 rounded-md bg-white border text-slate-600 hover:bg-slate-50">
                        <Edit className="w-4 h-4 mr-2 inline" /> Sửa
                      </button>
                      <button onClick={() => setSelectedPaper(null)} className="p-2 rounded-md text-slate-500 hover:bg-slate-50">
                        <X />
                      </button>
                    </div>
                  </div>

                  {loadingDetail ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
                    </div>
                  ) : (
                    // new scroll container to prevent page break
                    <div className="mt-4 overflow-auto max-h-[56vh] space-y-4">
                      {selectedPaper.questions.map((q, i) => (
                        <div key={i} className="p-4 bg-gradient-to-r from-slate-50 to-white border border-gray-100 rounded-lg w-full break-words">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <div className="text-sm text-slate-600">Câu {i + 1}</div>
                              <h3 className="text-md font-medium text-slate-800 whitespace-pre-wrap break-words">{q.content}</h3>
                              <div className="text-xs text-slate-500 mt-1">Độ khó: <span className="font-medium text-indigo-600">{difficultyText(q.difficulty)}</span></div>
                              {q.explanation && <div className="mt-2 text-sm text-amber-700 italic whitespace-pre-wrap break-words">Giải thích: {q.explanation}</div>}
                            </div>
                            <div className="text-indigo-700 font-bold ml-4">{q.point} đ</div>
                          </div>

                          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {q.answers.map((a, j) => (
                              <li key={j} className={`p-2 rounded-md ${a.correct ? 'bg-green-50 border border-green-100 text-green-700 font-semibold' : 'bg-white border border-gray-100 text-slate-700'}`}>
                                <div className="flex items-start gap-3">
                                  <div className="font-semibold w-6">{String.fromCharCode(65 + j)}.</div>
                                  <div className="text-sm whitespace-pre-wrap break-words">{a.content}</div>
                                </div>
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

        {/* MODAL CREATE */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Tạo ngân hàng đề mới</h3>
                  <div className="text-sm text-slate-500">Thiết lập tên, mô tả và nhập câu hỏi</div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-md text-slate-500 hover:bg-slate-50">
                  <X />
                </button>
              </div>

              <div className="p-6 overflow-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-200"
                    placeholder="Tên ngân hàng đề"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none"
                    placeholder="Mô tả (tùy chọn)"
                    rows={2}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-700">Câu hỏi</h4>
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
                      className="text-indigo-600 hover:underline text-sm flex items-center gap-2"
                    >
                      <Plus size={14} /> Thêm câu hỏi
                    </button>
                  </div>

                  {newQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-gray-100 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-medium">Câu {qIdx + 1}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setNewQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Nội dung câu hỏi"
                        rows={2}
                        value={q.content}
                        onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, content: e.target.value } : qq))}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <select
                          className="border border-gray-200 rounded-lg p-2 text-sm"
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
                          className="border border-gray-200 rounded-lg p-2 text-sm"
                          placeholder="Điểm"
                          value={q.point}
                          onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, point: parseFloat(e.target.value) || 1 } : qq))}
                        />

                        <input
                          type="text"
                          className="border border-gray-200 rounded-lg p-2 text-sm"
                          placeholder="Giải thích (tùy chọn)"
                          value={q.explanation || ''}
                          onChange={e => setNewQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, explanation: e.target.value } : qq))}
                        />
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-sm text-slate-600">Đáp án</div>
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
                              className="w-4 h-4 text-indigo-600"
                            />
                            <input
                              className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
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
                                className="text-red-500 p-1 rounded hover:bg-red-50"
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
                            className="text-indigo-600 hover:underline text-sm"
                          >
                            + Thêm đáp án
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md text-slate-600 bg-white hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddPaper}
                  className="px-5 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
                >
                  Tạo ngân hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}