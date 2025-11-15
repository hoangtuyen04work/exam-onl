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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // CÂU HỎI Ở CỘT A → index 0
      const questionContent = row[0]?.toString().trim();
      if (!questionContent) continue;

      // Đáp án: B, C, D, E (cột 1 đến 4)
      const A = row[1]?.toString().trim() || "";
      const B = row[2]?.toString().trim() || "";
      const C = row[3]?.toString().trim() || "";
      const D = row[4]?.toString().trim() || "";

      // Đáp án đúng: cột F (index 5)
      const correctAns = row[5]?.toString().trim().toUpperCase() || "";

      // Giải thích: cột G (index 6)
      const explanation = row[6]?.toString().trim() || "";

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
        answers,
      });
    }

    if (questions.length === 0) {
      toast.error("Không tìm thấy câu hỏi hợp lệ! Vui lòng kiểm tra cột A có câu hỏi không.");
      return;
    }

    // TỰ ĐỘNG TẠO TÊN ĐỀ
    const examName = `Import - ${file.name.split('.').slice(0, -1).join('.')}`;

    const payload = {
      name: examName,
      description: `Import từ file Excel: ${file.name}`,
      totalPoint: 10,
      durationMinutes: 60,
      shuffleQuestions: true,
      shuffleAnswers: true,
      questions: questions.map((q, idx) => ({
        content: q.content,
        explanation: q.explanation,
        point: Number((10 / questions.length).toFixed(2)),
        orderColumn: idx + 1,
        difficulty: "EASY",
        answers: q.answers,
      })),
    };

    toast.info(`Tạo đề: ${questions.length} câu`);

    const response = await axiosClient.post("/teacher/exams", payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Response:", response.data);

    let examId = null;
    if (response.data?.data?.id) examId = response.data.data.id;
    else if (response.data?.data) examId = response.data.data;
    else if (response.data?.id) examId = response.data.id;

    if (!examId) throw new Error("Không nhận được ID");

    toast.success(`TẠO ĐỀ THÀNH CÔNG! ID: ${examId} | ${questions.length} câu`);
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message;
    toast.error("Lỗi: " + msg);
    console.error(err);
  }
};