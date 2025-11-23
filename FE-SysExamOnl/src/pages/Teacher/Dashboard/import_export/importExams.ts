// src/utils/importExams.ts
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import axiosClient from "../../../../api/axiosClient";

interface ImportAnswer {
  content: string;
  correct: boolean;
}

interface ImportQuestion {
  content: string;
  explanation: string;
  point: number;
  answers: ImportAnswer[];
}

export const importExams = async (file: File) => {
  try {
    toast.info("Đang đọc file Excel...");

    const buffer = await file.arrayBuffer(); 
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) {
      toast.error("File Excel rỗng!");
      return;
    }

    const questions: ImportQuestion[] = [];

    
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];

      // Câu hỏi nằm ở cột B (index 1)
      const questionContent = row[1]?.toString().trim();
      if (!questionContent) continue;

      // Đáp án A–D: index 2–5
      const A = row[2]?.toString().trim() || "";
      const B = row[3]?.toString().trim() || "";
      const C = row[4]?.toString().trim() || "";
      const D = row[5]?.toString().trim() || "";

      // Đáp án đúng: index 6
      const correctAns = row[6]?.toString().trim().toUpperCase() || "";

      // Giải thích: index 7
      const explanation = row[7]?.toString().trim() || "";

      //  Điểm số: index 8
      let pointValue = Number(row[8]);
      if (isNaN(pointValue) || pointValue <= 0) {
        pointValue = 1; 
      }

      const answers = [
        { content: A, correct: correctAns === "A" },
        { content: B, correct: correctAns === "B" },
        { content: C, correct: correctAns === "C" },
        { content: D, correct: correctAns === "D" },
      ].filter(a => a.content);

      if (answers.length === 0) continue;

      questions.push({
        content: questionContent,
        explanation,
        point: pointValue,
        answers
      });
    }

    if (questions.length === 0) {
      toast.error("Không tìm thấy câu hỏi hợp lệ!");
      return;
    }

    // Nếu câu nào không có điểm → chia đều
    const fallbackPoint = Number((10 / questions.length).toFixed(2));

    const finalQuestions = questions.map((q, idx) => ({
      content: q.content,
      explanation: q.explanation,
      point: q.point > 0 ? q.point : fallbackPoint, // ưu tiên giá trị từ Excel
      orderColumn: idx + 1,
      difficulty: "EASY",
      answers: q.answers,
    }));

    const payload = {
      name: `${file.name.split('.').slice(0, -1).join('.')}`,
      description: ``,
      totalPoint: 10,
      durationMinutes: 60,
      shuffleQuestions: true,
      shuffleAnswers: true,
      questions: finalQuestions,
    };

    toast.info(`Tạo đề: ${finalQuestions.length} câu`);

    const response = await axiosClient.post("/teacher/exams", payload);

    const examId =
      response.data?.data?.id ||
      response.data?.data ||
      response.data?.id ||
      null;

    if (!examId) throw new Error("Không nhận được ID");

    toast.success(
      `TẠO ĐỀ THÀNH CÔNG! ID: ${examId} | ${finalQuestions.length} câu`
    );
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message;
    toast.error("Lỗi: " + msg);
    console.error(err);
  }
};
