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
  point: number;
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

  for (let i = 0; i < examIds.length; i++) {
    const examId = examIds[i];
    const examName = examNames[i];

    try {
      toast.update(toastId, { render: `Đang tải dữ liệu đề "${examName}"...` });

      const res = await axiosClient.get<{ data: ExamDetail }>(`/teacher/exams/${examId}`);
      const exam = res.data.data;

      if (!exam || !exam.questions) {
        throw new Error('Dữ liệu đề thi không hợp lệ');
      }

      toast.update(toastId, { render: `Đang tạo file Excel cho "${exam.name}"...` });

      const excelData: any[] = [];

      // Tên đề thi
      excelData.push({ STT: `ĐỀ THI: ${exam.name}` });
      excelData.push({});

      // Header chuẩn để import lại
      excelData.push({
        STT: 'STT',
        'Câu hỏi': 'Câu hỏi',
        A: 'A',
        B: 'B',
        C: 'C',
        D: 'D',
        'Đáp án đúng': 'Đáp án đúng',
        'Giải thích': 'Giải thích',
        'Điểm số': 'Điểm số'
      });

      // Dữ liệu từng câu hỏi
      exam.questions.forEach((q, idx) => {
        // Sort đảm bảo đúng thứ tự A/B/C/D
        const answers = q.answers.sort((a, b) => a.answerId - b.answerId);

        // ❗ "Đáp án đúng" phải là chữ A/B/C/D để import lại
        const correctIndex = answers.findIndex(a => a.correct);
        const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] || '';

        excelData.push({
          STT: idx + 1,
          'Câu hỏi': q.content,
          A: answers[0]?.content || "",
          B: answers[1]?.content || "",
          C: answers[2]?.content || "",
          D: answers[3]?.content || "",
          'Đáp án đúng': correctLetter,
          'Giải thích': q.explanation || "",
          'Điểm số': q.point || "",
        });
      });

      // Tạo sheet
      const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });

      ws["!cols"] = [
        { wch: 5 },
        { wch: 50 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 35 },
        { wch: 10 }, // Điểm số
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Đề thi");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const safeName =
        examName.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_") ||
        `de_thi_${examId}`;

      saveAs(blob, `${safeName}.xlsx`);

      successCount++;

    } catch (err: any) {
      failed.push(examName);
      console.error(`[ERROR] Export thất bại "${examName}":`, err?.message);
    }
  }

  toast.dismiss(toastId);

  if (failed.length === 0) {
    toast.success(`Đã export thành công ${successCount} đề thi!`);
  } else {
    toast.warning(`Export ${successCount}/${total} thành công. Lỗi: ${failed.join(", ")}`);
  }
};

export const downloadTemplate = () => {
  const data = [
    ["ĐỀ THI: Tên đề thi"], 
    [],                      
    ["STT", "Câu hỏi", "A", "B", "C", "D", "Đáp án đúng", "Giải thích", "Điểm số"], // Header
    [1, "Ví dụ câu hỏi 1?", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "A", "Giải thích mẫu", 1], // Câu hỏi mẫu
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  worksheet["!cols"] = [
    { wch: 5 },   // STT
    { wch: 50 },  // Câu hỏi
    { wch: 20 },  // A
    { wch: 20 },  // B
    { wch: 20 },  // C
    { wch: 20 },  // D
    { wch: 15 },  // Đáp án đúng
    { wch: 35 },  // Giải thích
    { wch: 10 },  // Điểm số
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "Mau_Import_De_Thi.xlsx");
};