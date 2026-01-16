// src/api/ai-api.ts
import axiosClient from './axiosClient';

export interface AIExamGenerationRequest {
  bankQuestionId: number;
  examName: string;
  examDescription?: string;
  userRequirement: string;
  desiredQuestionCount?: number;
  desiredDifficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  desiredDurationMinutes?: number;
}

export interface AnswerResponse {
  answerId: number;
  content: string;
  correct: boolean;
}

export interface QuestionResponse {
  questionId: number;
  content: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string;
  shuffleAnswers: boolean;
  shuffleQuestions: boolean;
  answers: AnswerResponse[];
  point: number;
}

export interface AIExamGenerationResponse {
  examId: number;
  examName: string;
  examDescription?: string;
  totalQuestions: number;
  totalPoints: number;
  aiSuggestion: string;
  questions: QuestionResponse[];
}

interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * Generate exam from bank questions using AI
 */
export async function generateExamFromBankQuestion(
  request: AIExamGenerationRequest
): Promise<AIExamGenerationResponse> {
  const { data } = await axiosClient.post<BaseResponse<AIExamGenerationResponse>>(
    '/teacher/ai/generate-exam',
    request
  );
  return data.data;
}
