// src/components/teacher/CreateEditExam.tsx
import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Trash2, Save, ArrowUp } from 'lucide-react'
import { useCreateEditExam } from '../Exams/HookExam/HookCreateEditExam'

const durations = [15, 30, 45, 60, 90, 120, 150, 180]

export default function CreateEditExam() {
  const {
    isEdit,
    examId,
    name,
    setName,
    description,
    setDescription,
    durationMinutes,
    setDurationMinutes,
    questions,
    isLoading,
    isSaving,
    isDeleting,
    addQuestion,
    updateQuestion,
    updateAnswer,
    setCorrectAnswer,
    addAnswer,
    removeAnswer,
    removeQuestion,
    handleSubmit,
    handleDelete,
    navigate
  } = useCreateEditExam()

  const [showScroll, setShowScroll] = useState(false)
  const scrollBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 100)
      if (scrollBtnRef.current) {
        scrollBtnRef.current.style.top = `${window.scrollY + 20}px`
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Đang tải đề thi...
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-2 relative pb-20 text-sm">
      <div className="max-w-4xl mx-auto">
        <div className="p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {isEdit ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
                </h1>
                {isEdit && <p className="text-xs text-gray-500">ID: {examId}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              {isEdit && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-xs"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* Exam Info */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Tên đề thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Đề thi học kỳ 1 - Toán lớp 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Thời gian <span className="text-red-500">*</span>
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {durations.map(m => (
                  <option key={m} value={m}>{m} phút</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Ví dụ: Đề kiểm tra 45 phút..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>

          {/* Questions */}
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-blue-800">Câu {qIndex + 1}</h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={q.content}
                onChange={e => updateQuestion(qIndex, 'content', e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Điểm</label>
                  <input
                    type="number"
                    step="0.1"
                    value={q.point}
                    onChange={e => updateQuestion(qIndex, 'point', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Độ khó</label>
                  <select
                    value={q.difficulty}
                    onChange={e => updateQuestion(qIndex, 'difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">TB</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-2 mb-4">
                <label className="block text-xs font-semibold mb-1">Các đáp án</label>
                {q.answers.map((a, aIndex) => (
                  <div
                    key={aIndex}
                    className={`flex items-center gap-3 p-2 rounded-lg border-2 ${
                      a.correct ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="font-bold w-6">{String.fromCharCode(65 + aIndex)}.</span>

                    <input
                      type="text"
                      value={a.content}
                      onChange={e => updateAnswer(qIndex, aIndex, e.target.value)}
                      className="flex-1 px-2 py-1 border-0 bg-transparent text-sm"
                    />

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={a.correct}
                        onChange={() => setCorrectAnswer(qIndex, aIndex)}
                      />
                      <span className="text-green-700 text-xs">Đúng</span>
                    </label>

                    {q.answers.length > 2 && (
                      <button
                        onClick={() => removeAnswer(qIndex, aIndex)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => addAnswer(qIndex)}
                  className="text-blue-600 hover:text-blue-800 flex gap-1 items-center text-xs"
                >
                  <Plus className="w-4 h-4" /> Thêm đáp án
                </button>
              </div>

              <textarea
                value={q.explanation}
                onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                rows={2}
                placeholder="Giải thích đáp án..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          ))}

          <div className="text-center mt-10">
            <button
              onClick={addQuestion}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex gap-1 items-center mx-auto"
            >
              <Plus className="w-4 h-4" /> Thêm câu hỏi
            </button>
          </div>
        </div>
      </div>

      {showScroll && (
        <div
          ref={scrollBtnRef}
          onClick={scrollToTop}
          className="absolute right-4 p-2 bg-blue-600 text-white rounded-full shadow cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
