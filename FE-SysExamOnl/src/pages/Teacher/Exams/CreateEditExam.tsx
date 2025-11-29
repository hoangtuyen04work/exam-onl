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

  

  // Hiển thị nút khi scroll > 100px
  const [showScroll, setShowScroll] = useState(false)
  const scrollBtnRef = useRef<HTMLDivElement>(null)

  // Hiển thị và di chuyển nút theo scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 100)

      // Cập nhật vị trí top của nút để nó chạy theo scroll
      if (scrollBtnRef.current) {
        const containerOffsetTop = 20 // khoảng cách trên cùng của container
        scrollBtnRef.current.style.top = `${window.scrollY + containerOffsetTop}px`
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
      <div className="min-h-screen flex items-center justify-center text-xl font-medium text-gray-600">
        Đang tải đề thi...
      </div>
    )
  }

  return (
    <div>

    <div className="min-h-screen  py-10 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-3 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {isEdit ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
                </h1>
                {isEdit && <p className="text-sm text-gray-500 mt-1">ID: {examId}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              {isEdit && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-60"
                >
                  <Trash2 className="w-5 h-5" />
                  {isDeleting ? 'Đang xóa...' : 'Xóa đề'}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-60 font-medium"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Đang lưu...' : 'Lưu đề thi'}
              </button>
            </div>
          </div>

          {/* Exam Info */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên đề thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Đề thi học kỳ 1 - Toán lớp 10"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời gian làm bài <span className="text-red-500">*</span>
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              >
                {durations.map(m => (
                  <option key={m} value={m}>{m} phút</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-10">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả đề thi</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ví dụ: Đề kiểm tra 45 phút, gồm 20 câu trắc nghiệm..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Questions */}
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-7 border border-blue-200">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-blue-800">Câu hỏi {qIndex + 1}</h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-800 transition"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <input
                type="text"
                value={q.content}
                onChange={e => updateQuestion(qIndex, 'content', e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full px-5 py-4 border border-gray-300 rounded-xl text-base font-medium focus:ring-2 focus:ring-blue-500 mb-5"
              />

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={q.point}
                    onChange={e => updateQuestion(qIndex, 'point', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                  <select
                    value={q.difficulty}
                    onChange={e => updateQuestion(qIndex, 'difficulty', e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Các đáp án</label>
                {q.answers.map((a, aIndex) => (
                  <div
                    key={aIndex}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      a.correct ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="font-bold text-lg w-8 text-gray-700">
                      {String.fromCharCode(65 + aIndex)}.
                    </span>
                    <input
                      type="text"
                      value={a.content}
                      onChange={e => updateAnswer(qIndex, aIndex, e.target.value)}
                      placeholder={`Nội dung đáp án ${String.fromCharCode(65 + aIndex)}`}
                      className="flex-1 px-3 py-2 border-0 bg-transparent outline-none text-base"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={a.correct}
                        onChange={() => setCorrectAnswer(qIndex, aIndex)}
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="font-medium text-green-700">Đúng</span>
                    </label>
                    {q.answers.length > 2 && (
                      <button
                        onClick={() => removeAnswer(qIndex, aIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addAnswer(qIndex)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 mt-3"
                >
                  <Plus className="w-5 h-5" /> Thêm đáp án
                </button>
              </div>

              <textarea
                value={q.explanation}
                onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                placeholder="Giải thích đáp án (hiển thị sau khi nộp bài)"
                rows={3}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          ))}

          {/* Nút thêm câu hỏi */}
          <div className="text-center mt-16">
  <button
    onClick={addQuestion}
    className="
      inline-flex items-center gap-2
      bg-blue-600 text-white
      px-4 py-2
      rounded-lg
      text-base font-medium
      shadow-md
      hover:bg-blue-700
      transition-all duration-200
      active:scale-95
    "
  >
    <Plus className="w-4 h-4" />
    Thêm câu hỏi
  </button>
</div>

        </div>
      </div>

      {showScroll && (
            <div
              ref={scrollBtnRef}
              onClick={scrollToTop}
              className="absolute right-5 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 cursor-pointer transition-all flex items-center justify-center"
            >
              <ArrowUp className="w-6 h-6" />
            </div>
          )}
          </div>
    </div>
  )
}
  