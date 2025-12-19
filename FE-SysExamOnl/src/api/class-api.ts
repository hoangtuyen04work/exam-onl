// src/api/class-api.ts
import api from './axiosClient';
import type {
  ClassResponse,
  ClassDetailResponse,
  ClassCreationRequest,
  ClassUpdateRequest,
  AddStudentsToClassRequest,
  AddExamSessionsToClassRequest,
  PageResponse,
  BaseResponse,
} from '../types/class.type';

const CLASS_API_BASE = '/teacher/classes';

/**
 * Get all classes with pagination
 */
export async function getAllClasses(
  page = 0,
  size = 10,
  sort?: string
): Promise<PageResponse<ClassResponse>> {
  const params: Record<string, string | number> = { page, size };
  if (sort) params.sort = sort;

  const response = await api.get<PageResponse<ClassResponse>>(CLASS_API_BASE, { params });
  return response.data;
}

/**
 * Get basic class information by ID
 */
export async function getClassById(classId: number): Promise<ClassResponse> {
  const response = await api.get<BaseResponse<ClassResponse>>(`${CLASS_API_BASE}/${classId}`);
  return response.data.data!;
}

/**
 * Get detailed class information including students and exam sessions
 */
export async function getClassDetail(classId: number): Promise<ClassDetailResponse> {
  const response = await api.get<BaseResponse<ClassDetailResponse>>(
    `${CLASS_API_BASE}/${classId}/detail`
  );
  return response.data.data!;
}

/**
 * Create a new class
 */
export async function createClass(request: ClassCreationRequest): Promise<ClassResponse> {
  const response = await api.post<BaseResponse<ClassResponse>>(CLASS_API_BASE, request);
  return response.data.data!;
}

/**
 * Update class information
 */
export async function updateClass(
  classId: number,
  request: ClassUpdateRequest
): Promise<ClassResponse> {
  const response = await api.put<BaseResponse<ClassResponse>>(
    `${CLASS_API_BASE}/${classId}`,
    request
  );
  return response.data.data!;
}

/**
 * Delete a class
 */
export async function deleteClass(classId: number): Promise<void> {
  await api.delete<BaseResponse<void>>(`${CLASS_API_BASE}/${classId}`);
}

/**
 * Add multiple students to a class
 */
export async function addStudentsToClass(
  classId: number,
  request: AddStudentsToClassRequest
): Promise<void> {
  await api.post<BaseResponse<void>>(`${CLASS_API_BASE}/${classId}/students`, request);
}

/**
 * Remove a student from a class
 */
export async function removeStudentFromClass(classId: number, studentId: number): Promise<void> {
  await api.delete<BaseResponse<void>>(`${CLASS_API_BASE}/${classId}/students/${studentId}`);
}

/**
 * Add multiple exam sessions to a class
 */
export async function addExamSessionsToClass(
  classId: number,
  request: AddExamSessionsToClassRequest
): Promise<void> {
  await api.post<BaseResponse<void>>(`${CLASS_API_BASE}/${classId}/exam-sessions`, request);
}

/**
 * Remove a specific exam session assignment from a class
 * @param classExamSessionId - The ID of the ClassExamSession record (not the ExamSession ID)
 */
export async function removeExamSessionFromClass(
  classId: number,
  classExamSessionId: number
): Promise<void> {
  await api.delete<BaseResponse<void>>(
    `${CLASS_API_BASE}/${classId}/exam-sessions/${classExamSessionId}`
  );
}
