import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import RoleSelectPage from '../pages/RoleSelectPage/RoleSelectPage'
import RegisterPage from '../pages/RegisterPage/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage/VerifyEmailPage'
import ProtectedRoute from '../components/Common/ProtectedRoute'
import TeacherDashboard from '../pages/Teacher/Dashboard/TeacherDashboard'
import StudentDashboard from '../pages/Student/Dashboard'
import ExamPage from '../pages/Student/Exam/ExamPage'
import JoinExam from '../pages/Student/Exam/JoinExam'
import ResultPage from '../pages/Student/Exam/ResultPage'
import ErrorPage from '../components/ErrorPage'
import HomeTab from '../pages/Teacher/Dashboard/Tabs/HomeTab'
import ExamList from '../pages/Teacher/Dashboard/Tabs/ExamsTab'
import QuestionBank from '../pages/Teacher/Dashboard/Tabs/BanksTab'
import StudentList from '../pages/Teacher/Dashboard/Tabs/StudentsTab'
import CreateEditExam from '../pages/Teacher/Exams/CreateEditExam'
import axiosClient from '../api/axiosClient'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../store/slices/authSlice'

export default function AppRouter() {
  const dispatch = useDispatch()

  // ✅ Khi app load lại, tự khôi phục token và user info từ localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('name')

    if (token) {
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      dispatch(loginSuccess({ token, role, name }))
    }
  }, [dispatch])

  return (
    <Routes>
      {/* Trang mặc định: chuyển sang /role-select */}
      <Route path='/' element={<Navigate to='/role-select' replace />} />

      {/* Trang đăng nhập */}
      <Route path='/login' element={<LoginPage />} />

      {/* Đăng ký tài khoản */}
      <Route path='/register' element={<RegisterPage />} />

      {/* Xác minh email */}
      <Route path='/verify-email' element={<VerifyEmailPage />} />

      {/* Chọn vai trò */}
      <Route path='/role-select' element={<RoleSelectPage />} />

      {/* Student Routes */}
      <Route
        path='/student'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path='/exam/:examId'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/student/join'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <JoinExam />
          </ProtectedRoute>
        }
      />
      <Route
        path='/exam/:examId/result'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ResultPage />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path='/teacher'
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeTab />} /> {/* /teacher */}
        <Route path='exams' element={<ExamList />} /> {/* /teacher/exams */}
        <Route path='exams/create' element={<CreateEditExam />} /> {/* /teacher/exams/create */}
        <Route path='exams/:examId/edit' element={<CreateEditExam />} /> {/* /teacher/exams/:examId/edit */}
        <Route path='questions' element={<QuestionBank />} /> {/* /teacher/questions */}
        <Route path='students' element={<StudentList />} /> {/* /teacher/students */}
        <Route path='settings' element={<div>Settings Page</div>} />
        {/* /teacher/settings */}
      </Route>

      {/* 404 */}
      <Route path='*' element={<ErrorPage />} />
    </Routes>
  )
}
