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
      const offsetTop = 20
      scrollBtnRef.current.style.top = `${window.scrollY + offsetTop}px`
    }
  }
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])


  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Đang tải đề thi...
      </div>
    )
  }

  return (
    <div className="py-6 px-3">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {isEdit ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
                </h1>
                {isEdit && <p className="text-xs text-gray-500 mt-0.5">ID: {examId}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              {isEdit && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-60 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* Exam Info */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đề thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Đề thi học kỳ 1 - Toán lớp 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

           
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ví dụ: Đề kiểm tra 45 phút, gồm 20 câu trắc nghiệm..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm"
            />
          </div>

          {/* Questions */}
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-800">Câu {qIndex + 1}</h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-800 transition text-sm"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={q.content}
                onChange={e => updateQuestion(qIndex, 'content', e.target.value)}
                placeholder="Nội dung câu hỏi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
              />

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <label className="block mb-1">Điểm</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={q.point}
                    onChange={e => updateQuestion(qIndex, 'point', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1">Độ khó</label>
                  <select
                    value={q.difficulty}
                    onChange={e => updateQuestion(qIndex, 'difficulty', e.target.value as any)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 mb-3 text-sm">
                {q.answers.map((a, aIndex) => (
                  <div
                    key={aIndex}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      a.correct ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="font-bold w-6">{String.fromCharCode(65 + aIndex)}.</span>
                    <input
                      type="text"
                      value={a.content}
                      onChange={e => updateAnswer(qIndex, aIndex, e.target.value)}
                      placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                      className="flex-1 px-2 py-1 border-0 bg-transparent outline-none text-sm"
                    />
                    <label className="flex items-center gap-1 cursor-pointer text-green-700 text-sm">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={a.correct}
                        onChange={() => setCorrectAnswer(qIndex, aIndex)}
                        className="w-4 h-4"
                      />
                      Đúng
                    </label>
                    {q.answers.length > 2 && (
                      <button
                        onClick={() => removeAnswer(qIndex, aIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addAnswer(qIndex)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1 text-sm"
                >
                  <Plus className="w-3 h-3" /> Thêm đáp án
                </button>
              </div>

              <textarea
                value={q.explanation}
                onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                placeholder="Giải thích đáp án"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          ))}

          {/* Add Question Button */}
          <div className="text-center mt-6">
            <button
              onClick={addQuestion}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus className="w-3 h-3" /> Thêm câu hỏi
            </button>
          </div>
        </div>
      </div>

      {showScroll && (
  <div
    ref={scrollBtnRef}
    onClick={scrollToTop}
    className="absolute right-5 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 cursor-pointer transition-all flex items-center justify-center"
    style={{ top: `${window.scrollY + 20}px` }} // top sẽ được cập nhật trong useEffect
  >
    <ArrowUp className="w-5 h-5" />
  </div>
)}

    </div>
  )
}
