import { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Loader2,
  FileText,
  Settings,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Wand2,
  Brain
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import {
  generateExamFromBankQuestion,
  type AIExamGenerationRequest,
  type AIExamGenerationResponse
} from '../../api/ai-api'
import type { QuestionPaper } from '../../pages/Teacher/Dashboard/Tabs/HookTab/HookBanktab'

interface AIExamGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPaper: QuestionPaper | null
}

const DIFFICULTY_OPTIONS = [
  { value: 'MIXED', label: 'Hỗn hợp', desc: 'Kết hợp nhiều độ khó', color: 'bg-purple-100 text-purple-700' },
  { value: 'EASY', label: 'Dễ', desc: 'Câu hỏi cơ bản', color: 'bg-green-100 text-green-700' },
  { value: 'MEDIUM', label: 'Trung bình', desc: 'Câu hỏi vừa phải', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HARD', label: 'Khó', desc: 'Câu hỏi nâng cao', color: 'bg-red-100 text-red-700' }
]

const PRESET_REQUIREMENTS = [
  'Tạo đề thi cân đối giữa các độ khó, phù hợp cho kiểm tra giữa kỳ',
  'Tạo đề thi với các câu hỏi cơ bản, dễ hiểu cho học sinh mới bắt đầu',
  'Tạo đề thi thử với độ khó cao, kiểm tra kiến thức chuyên sâu',
  'Tạo đề thi nhanh với 10 câu hỏi ngẫu nhiên',
  'Tạo đề thi với các câu hỏi có tính ứng dụng thực tế'
]

export default function AIExamGeneratorModal({ isOpen, onClose, selectedPaper }: AIExamGeneratorModalProps) {
  const navigate = useNavigate()

  // Form states
  const [examName, setExamName] = useState('')
  const [examDescription, setExamDescription] = useState('')
  const [userRequirement, setUserRequirement] = useState('')
  const [desiredQuestionCount, setDesiredQuestionCount] = useState<number | undefined>(undefined)
  const [desiredDifficulty, setDesiredDifficulty] = useState<string>('MIXED')
  const [desiredDurationMinutes, setDesiredDurationMinutes] = useState<number | undefined>(undefined)

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<AIExamGenerationResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  // Reset form when modal opens with new paper
  useEffect(() => {
    if (isOpen && selectedPaper) {
      setExamName(`${selectedPaper.name} - Đề thi AI`)
      setExamDescription(selectedPaper.description || '')
      setUserRequirement('')
      setDesiredQuestionCount(Math.min(selectedPaper.questions?.length || 10, 10))
      setDesiredDifficulty('MIXED')
      setDesiredDurationMinutes(undefined)
      setGeneratedResult(null)
      setShowPreview(false)
    }
  }, [isOpen, selectedPaper])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleGenerate = async () => {
    if (!selectedPaper) {
      toast.error('Vui lòng chọn ngân hàng câu hỏi')
      return
    }
    if (!examName.trim()) {
      toast.error('Vui lòng nhập tên đề thi')
      return
    }
    if (!userRequirement.trim()) {
      toast.error('Vui lòng nhập yêu cầu tạo đề thi')
      return
    }

    setIsLoading(true)
    setGeneratedResult(null)

    try {
      const request: AIExamGenerationRequest = {
        bankQuestionId: selectedPaper.bankQuestionId,
        examName: examName.trim(),
        examDescription: examDescription.trim() || undefined,
        userRequirement: userRequirement.trim(),
        desiredQuestionCount: desiredQuestionCount || undefined,
        desiredDifficulty: desiredDifficulty as AIExamGenerationRequest['desiredDifficulty'],
        desiredDurationMinutes: desiredDurationMinutes || undefined
      }

      const result = await generateExamFromBankQuestion(request)
      setGeneratedResult(result)
      setShowPreview(true)
      toast.success('Tạo đề thi thành công!')
    } catch (error: any) {
      console.error('AI generation error:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đề thi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewExam = () => {
    if (generatedResult?.examId) {
      onClose()
      navigate('/teacher/exams')
    }
  }

  const handleUsePreset = (preset: string) => {
    setUserRequirement(preset)
  }

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'Dễ'
      case 'MEDIUM':
        return 'Trung bình'
      case 'HARD':
        return 'Khó'
      default:
        return diff
    }
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'bg-green-100 text-green-700'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700'
      case 'HARD':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Overlay */}
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div
        className='relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col m-4'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-600 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/20 rounded-lg'>
                <Sparkles className='w-6 h-6' />
              </div>
              <div>
                <h2 className='text-xl font-semibold'>Tạo đề thi với AI</h2>
                <p className='text-sm text-white/80'>AI sẽ phân tích ngân hàng câu hỏi và tạo đề thi theo yêu cầu</p>
              </div>
            </div>
            <button onClick={onClose} className='p-2 hover:bg-white/20 rounded-lg transition'>
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {!showPreview ? (
            <div className='space-y-6'>
              {/* Bank Info Card */}
              <div className='bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100'>
                <div className='flex items-start gap-4'>
                  <div className='p-3 bg-indigo-100 rounded-lg'>
                    <BookOpen className='w-6 h-6 text-indigo-600' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-medium text-gray-900 truncate'>
                      {selectedPaper?.name || 'Chưa chọn ngân hàng'}
                    </h3>
                    <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                      {selectedPaper?.description || 'Không có mô tả'}
                    </p>
                    <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                      <span className='flex items-center gap-1'>
                        <FileText className='w-3.5 h-3.5' />
                        {selectedPaper?.questions?.length || 0} câu hỏi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className='space-y-4'>
                <h4 className='font-medium text-gray-800 flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-indigo-600' />
                  Thông tin đề thi
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                      Tên đề thi <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder='Nhập tên đề thi'
                      className='w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1.5'>Mô tả</label>
                    <input
                      type='text'
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder='Mô tả ngắn (tùy chọn)'
                      className='w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'
                    />
                  </div>
                </div>
              </div>

              {/* AI Requirement */}
              <div className='space-y-4'>
                <h4 className='font-medium text-gray-800 flex items-center gap-2'>
                  <Brain className='w-4 h-4 text-purple-600' />
                  Yêu cầu tạo đề thi <span className='text-red-500'>*</span>
                </h4>
                <div>
                  <textarea
                    value={userRequirement}
                    onChange={(e) => setUserRequirement(e.target.value)}
                    placeholder="Mô tả yêu cầu của bạn cho AI, ví dụ: 'Tạo đề thi với 15 câu hỏi, phân bổ đều giữa các độ khó, ưu tiên các câu hỏi về chủ đề X...'"
                    rows={4}
                    className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none'
                  />
                </div>

                {/* Preset Suggestions */}
                <div className='space-y-2'>
                  <p className='text-xs text-gray-500'>Gợi ý nhanh:</p>
                  <div className='flex flex-wrap gap-2'>
                    {PRESET_REQUIREMENTS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUsePreset(preset)}
                        className='px-3 py-1.5 text-xs bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-full transition truncate max-w-[200px]'
                        title={preset}
                      >
                        {preset.length > 40 ? preset.substring(0, 40) + '...' : preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className='flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition'
              >
                <Settings className='w-4 h-4' />
                Tùy chọn nâng cao
                {showAdvanced ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
              </button>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className='space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {/* Question Count */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                        <span className='flex items-center gap-1.5'>
                          <Target className='w-4 h-4 text-indigo-600' />
                          Số câu hỏi
                        </span>
                      </label>
                      <input
                        type='number'
                        min={1}
                        max={selectedPaper?.questions?.length || 100}
                        value={desiredQuestionCount || ''}
                        onChange={(e) => setDesiredQuestionCount(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder={`Tối đa ${selectedPaper?.questions?.length || 0}`}
                        className='w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                        <span className='flex items-center gap-1.5'>
                          <Clock className='w-4 h-4 text-indigo-600' />
                          Thời gian (phút)
                        </span>
                      </label>
                      <input
                        type='number'
                        min={5}
                        max={180}
                        value={desiredDurationMinutes || ''}
                        onChange={(e) =>
                          setDesiredDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        placeholder='Tùy chọn'
                        className='w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'
                      />
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1.5'>Độ khó mong muốn</label>
                      <select
                        value={desiredDifficulty}
                        onChange={(e) => setDesiredDifficulty(e.target.value)}
                        className='w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'
                      >
                        {DIFFICULTY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} - {opt.desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Results */
            <div className='space-y-6'>
              {/* Success Banner */}
              <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100'>
                <div className='flex items-start gap-4'>
                  <div className='p-2 bg-green-100 rounded-full'>
                    <CheckCircle className='w-6 h-6 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-green-800'>Đề thi đã được tạo thành công!</h3>
                    <p className='text-sm text-green-700 mt-1'>{generatedResult?.aiSuggestion}</p>
                  </div>
                </div>
              </div>

              {/* Exam Info */}
              <div className='bg-white rounded-xl border border-gray-200 p-4'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                  <div className='p-3 bg-indigo-50 rounded-lg'>
                    <div className='text-2xl font-bold text-indigo-600'>{generatedResult?.totalQuestions || 0}</div>
                    <div className='text-xs text-gray-600'>Câu hỏi</div>
                  </div>
                  <div className='p-3 bg-purple-50 rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {generatedResult?.totalPoints?.toFixed(1) || 0}
                    </div>
                    <div className='text-xs text-gray-600'>Tổng điểm</div>
                  </div>
                  <div className='p-3 bg-green-50 rounded-lg'>
                    <div className='text-2xl font-bold text-green-600'>
                      {generatedResult?.questions?.filter((q) => q.difficulty === 'EASY').length || 0}
                    </div>
                    <div className='text-xs text-gray-600'>Câu dễ</div>
                  </div>
                  <div className='p-3 bg-red-50 rounded-lg'>
                    <div className='text-2xl font-bold text-red-600'>
                      {generatedResult?.questions?.filter((q) => q.difficulty === 'HARD').length || 0}
                    </div>
                    <div className='text-xs text-gray-600'>Câu khó</div>
                  </div>
                </div>
              </div>

              {/* Questions Preview */}
              <div className='space-y-3'>
                <h4 className='font-medium text-gray-800 flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-indigo-600' />
                  Danh sách câu hỏi ({generatedResult?.questions?.length || 0})
                </h4>
                <div className='space-y-2 max-h-[300px] overflow-y-auto pr-2'>
                  {generatedResult?.questions?.map((q, idx) => (
                    <div key={q.questionId} className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                        className='w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition'
                      >
                        <div className='flex items-center gap-3 flex-1 min-w-0'>
                          <span className='flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 text-sm font-medium rounded-full'>
                            {idx + 1}
                          </span>
                          <span className='text-sm text-gray-800 truncate'>{q.content}</span>
                        </div>
                        <div className='flex items-center gap-2 flex-shrink-0'>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(q.difficulty)}`}>
                            {getDifficultyLabel(q.difficulty)}
                          </span>
                          {expandedQuestion === idx ? (
                            <ChevronUp className='w-4 h-4 text-gray-400' />
                          ) : (
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          )}
                        </div>
                      </button>

                      {expandedQuestion === idx && (
                        <div className='px-4 pb-4 border-t border-gray-100'>
                          <div className='mt-3 space-y-2'>
                            {q.answers?.map((a, aIdx) => (
                              <div
                                key={a.answerId}
                                className={`flex items-start gap-2 p-2 rounded-lg ${
                                  a.correct
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <span
                                  className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                                    a.correct ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                                  }`}
                                >
                                  {String.fromCharCode(65 + aIdx)}
                                </span>
                                <span className={`text-sm ${a.correct ? 'text-green-700' : 'text-gray-700'}`}>
                                  {a.content}
                                </span>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className='mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200'>
                              <p className='text-xs text-amber-800'>
                                <strong>Giải thích:</strong> {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-100 bg-gray-50'>
          <div className='flex items-center justify-between'>
            {!showPreview ? (
              <>
                <button onClick={onClose} className='px-4 py-2 text-gray-600 hover:text-gray-800 transition'>
                  Hủy
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !userRequirement.trim() || !examName.trim()}
                  className='inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Đang tạo đề thi...
                    </>
                  ) : (
                    <>
                      <Wand2 className='w-4 h-4' />
                      Tạo đề thi với AI
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowPreview(false)}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 transition'
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleViewExam}
                  className='inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg shadow-green-200'
                >
                  <CheckCircle className='w-4 h-4' />
                  Xem đề thi
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
