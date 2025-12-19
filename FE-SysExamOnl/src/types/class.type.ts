// Types for Class Management APIs

export interface ClassResponse {
  classId: number;
  classCode: string;
  name: string;
  description?: string;
  teacherId: number;
  teacherName?: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  examSessionCount?: number;
}

export interface StudentInClass {
  id: number;
  studentId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  enrolledAt: string;
}

export interface ExamSessionInClass {
  id: number;
  examSessionId: number;
  examSessionName: string;
  examSessionCode: string;
  description?: string;
  startAt: string;
  expiredAt: string;
  durationMinutes: number;
  assignedAt: string;
}

export interface ClassDetailResponse {
  id: number;
  classCode: string;
  name: string;
  description?: string;
  semester: string;
  academicYear: string;
  isActive: boolean;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  students: StudentInClass[];
  examSessions: ExamSessionInClass[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassCreationRequest {
  name: string;
  description?: string;
}

export interface ClassUpdateRequest {
  name?: string;
  description?: string;
}

export interface AddStudentsToClassRequest {
  studentEmails: string[];
}

export interface AddExamSessionsToClassRequest {
  examSessionIds: number[];
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface BaseResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  code?: number;
}

// Student Class Types
export interface StudentClass {
  classId: number;
  classCode: string;
  name: string;
  description: string;
  semester: string;
  academicYear: string;
  teacherName: string;
  totalStudents: number;
  totalExamSessions: number;
  enrolledAt: string;
}

export interface ExamSessionInfo {
  classExamSessionId: number;
  examSessionId: number;
  examSessionName: string;
  examSessionCode: string;
  description: string;
  startAt: string;
  expiredAt: string;
  durationMinutes: number;
  assignedAt: string;
  inviteLink: string;
}

export interface StudentClassDetail {
  classId: number;
  classCode: string;
  name: string;
  description: string;
  semester: string;
  academicYear: string;
  teacherName: string;
  teacherEmail: string;
  totalStudents: number;
  examSessions: ExamSessionInfo[];
  enrolledAt: string;
}
