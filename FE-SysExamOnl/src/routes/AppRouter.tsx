import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import RoleSelectPage from '../pages/RoleSelectPage/RoleSelectPage'
import RegisterPage from '../pages/RegisterPage/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage/VerifyEmailPage'
import ProtectedRoute from '../components/Common/ProtectedRoute'
import TeacherDashboard from '../pages/Teacher/Dashboard/TeacherDashboard'
import ExamList from '../pages/Teacher/Exams/ExamList'
import CreateExam from '../pages/Teacher/Exams/CreateExam'
import QuestionBank from '../pages/Teacher/Questions/QuestionBank'
import Grading from '../pages/Teacher/Results/Grading'
import StudentList from '../pages/Teacher/Students/StudentList'
import StudentDashboard from '../pages/Student/Dashboard'
import ExamPage from '../pages/Student/Exam/ExamPage'
import ErrorPage from '../components/ErrorPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Trang mặc định: chuyển sang /role-select */}
      <Route path="/" element={<Navigate to="/role-select" replace />} />

      {/* Trang đăng nhập */}
      <Route path="/login" element={<LoginPage />} />

      {/* Đăng ký tài khoản */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Xác minh email */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Chọn vai trò trước khi đăng nhập */}
      <Route path="/role-select" element={<RoleSelectPage />} />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:examId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamPage />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/exams"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ExamList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/exams/create"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CreateExam />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/questions"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <QuestionBank />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/results"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Grading />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <StudentList />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  )
}
