// src/utils/exportExams.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axiosClient from '../../../../api/axiosClient';
import { toast } from 'react-toastify';

interface Answer {
  answerId: number;
  content: string;
  correct: boolean;
}

interface Question {
  questionId: number;
  content: string;
  explanation: string;
  answers: Answer[];
}

interface ExamDetail {
  examId: number;
  name: string;
  questions: Question[];
}

export const exportExams = async (examIds: number[], examNames: string[]) => {
  if (examIds.length === 0) {
    toast.warn('Vui lòng chọn ít nhất 1 đề thi!');
    return;
  }

  const total = examIds.length;
  const toastId = toast.loading(`Chuẩn bị export ${total} đề thi...`, { autoClose: false });

  let successCount = 0;
  const failed: string[] = [];

  console.log('[DEBUG] Bắt đầu export:', { examIds, examNames });

  for (let i = 0; i < examIds.length; i++) {
    const examId = examIds[i];
    const examName = examNames[i];

    console.log(`\n[DEBUG] Bắt đầu export đề thứ ${i + 1}/${total}:`, { examId, examName });

    try {
      toast.update(toastId, { render: `Đang tải dữ liệu đề "${examName}"...` });
      console.log('[DEBUG] Gọi API:', `/teacher/exams/${examId}`);

      const res = await axiosClient.get<{ data: ExamDetail }>(`/teacher/exams/${examId}`);
      const exam = res.data.data;

      if (!exam || !exam.questions) {
        throw new Error('Dữ liệu đề thi không hợp lệ');
      }

      console.log('[DEBUG] Nhận dữ liệu thành công:', {
        name: exam.name,
        questionCount: exam.questions.length
      });

      toast.update(toastId, { render: `Đang tạo file Excel cho "${exam.name}"...` });

      // TẠO DỮ LIỆU CHO EXCEL (array of objects)
      const excelData: any[] = [];

      // Tiêu đề đề thi
      excelData.push({ STT: `ĐỀ THI: ${exam.name}` });
      excelData.push({}); // Dòng trống

      // Header
      excelData.push({
        STT: 'STT',
        'Câu hỏi': 'Câu hỏi',
        A: 'A',
        B: 'B',
        C: 'C',
        D: 'D',
        'Đáp án đúng': 'Đáp án đúng',
        'Giải thích': 'Giải thích',
      });

      // Câu hỏi
      exam.questions.forEach((q, idx) => {
        const answers = q.answers.sort((a, b) => a.answerId - b.answerId);
        const correct = answers.find(a => a.correct)?.content || '';

        excelData.push({
          STT: idx + 1,
          'Câu hỏi': q.content,
          A: answers[0]?.content || '',
          B: answers[1]?.content || '',
          C: answers[2]?.content || '',
          D: answers[3]?.content || '',
          'Đáp án đúng': correct,
          'Giải thích': q.explanation || '',
        });
      });

      console.log('[DEBUG] Dữ liệu Excel đã tạo:', excelData.length, 'dòng');

      // DÙNG json_to_sheet → HỖ TRỢ OBJECT
      const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });

      // Định dạng cột
      ws['!cols'] = [
        { wch: 5 },   // STT
        { wch: 50 },  // Câu hỏi
        { wch: 20 },  // A
        { wch: 20 },  // B
        { wch: 20 },  // C
        { wch: 20 },  // D
        { wch: 15 },  // Đáp án đúng
        { wch: 35 },  // Giải thích
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Đề thi');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      console.log('[DEBUG] Blob đã tạo:', blob.size, 'bytes');

      const safeName = examName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') || `de_thi_${examId}`;
      console.log('[DEBUG] Tải file:', `${safeName}.xlsx`);

      saveAs(blob, `${safeName}.xlsx`);

      successCount++;
      console.log('[DEBUG] Export thành công:', examName);

    } catch (err: any) {
      failed.push(examName);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      console.error(`[ERROR] Export thất bại "${examName}":`, msg);
    }
  }
//
  // KẾT THÚC
  toast.dismiss(toastId);

  if (failed.length === 0) {
    toast.success(`Đã export thành công ${successCount} đề thi!`, { autoClose: 4000 });
  } else if (successCount === 0) {
    toast.error(`Tất cả ${total} đề thi đều thất bại!`, { autoClose: 6000 });
  } else {
    toast.warning(`Export ${successCount}/${total} thành công. Thất bại: ${failed.join(', ')}`, { autoClose: 6000 });
  }

  console.log('[DEBUG] Hoàn tất export:', { successCount, failed });
};