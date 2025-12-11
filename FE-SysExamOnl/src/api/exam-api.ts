// src/api/exam-api.ts
import axiosClient from './axiosClient';
import type { PageResponse } from '../types/class.type'; 

interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}


// Exam Types
export interface ExamResponse {
  examId: number;
  name: string;
  description: string;
  numberQuestions: number;
}

// Exam Session Types
export interface ExamSessionResponse {
  examSessionId: number;
  code: string;
  inviteLink: string;
  name: string;
  description?: string;
  expiredAt: string; // OffsetDateTime from backend
  startAt: string; // OffsetDateTime from backend
  ownerName: string;
}

export interface ExamSessionCreationRequest {
  examId: number;
  name: string;
  startAt: string; // ISO 8601 OffsetDateTime format: 2024-11-27T14:30:00+07:00
  expiredAt: string; // ISO 8601 OffsetDateTime format: 2024-11-27T16:30:00+07:00
  durationMinutes: number;
  passingScore: number;
}

const EXAM_API_BASE = '/teacher/exams';
const EXAM_SESSION_API_BASE = '/teacher/exam-sessions';

// ========== EXAM APIs ==========

/**
 * Get all exams with pagination
 */
export async function getAllExams(page = 0, size = 10): Promise<ExamResponse[]> {
  const { data } = await axiosClient.get<PageResponse<ExamResponse>>(
    EXAM_API_BASE,
    {
      params: { page, size },
    }
  );
  return data.items;
}
/**
 * Get exam by ID (basic info)
 */
export async function getExamById(examId: number): Promise<ExamResponse> {
  const { data } = await axiosClient.get<BaseResponse<ExamResponse>>(
    `${EXAM_API_BASE}/basic/${examId}`
  );
  return data.data;
}

// ========== EXAM SESSION APIs ==========

/**
 * Get all exam sessions with search and pagination
 */
export async function getAllExamSessions(
  searchParams?: {
    examId?: number;
    name?: string;
    code?: string;
  },
  page = 0,
  size = 100
): Promise<ExamSessionResponse[]> {
  const { data } = await axiosClient.get<PageResponse<ExamSessionResponse>>(
    `${EXAM_SESSION_API_BASE}/search`,
    {
      params: {
        ...searchParams,
        page,
        size
      }
    }
  );
  return data.items;
}

/**
 * Get exam session by ID
 */
export async function getExamSessionById(examSessionId: number): Promise<ExamSessionResponse> {
  const { data } = await axiosClient.get<BaseResponse<ExamSessionResponse>>(
    EXAM_SESSION_API_BASE,
    {
      params: { examSessionId }
    }
  );
  return data.data;
}

/**
 * Create new exam session
 */
export async function createExamSession(
  request: ExamSessionCreationRequest
): Promise<ExamSessionResponse> {
  const { data } = await axiosClient.post<BaseResponse<ExamSessionResponse>>(
    EXAM_SESSION_API_BASE,
    request
  );
  return data.data;
}

/**
 * Delete exam session
 */
export async function deleteExamSession(examSessionId: number): Promise<void> {
  await axiosClient.delete<BaseResponse<void>>(`${EXAM_SESSION_API_BASE}/${examSessionId}`);
}
