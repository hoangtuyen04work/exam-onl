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
import ExamSessionsList from '../pages/Teacher/Dashboard/Tabs/ExamSessionsList'

import axiosClient from '../api/axiosClient'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../store/slices/authSlice'
import ExamSessionDetail from '../pages/Teacher/Dashboard/Tabs/ESListUser'
import ExamSubmissionDetail from '../pages/Teacher/Dashboard/Tabs/ExamSubmissionDetail'

export default function AppRouter() {
  const dispatch = useDispatch()

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
      {/* Trang mặc định */}
      <Route path='/' element={<Navigate to='/role-select' replace />} />

      {/* Auth */}
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
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
        <Route index element={<HomeTab />} />
        <Route path='exams' element={<ExamList />} />
        <Route path='exams/create' element={<CreateEditExam />} />
        <Route path='exams/:examId/edit' element={<CreateEditExam />} />
        <Route path='questions' element={<QuestionBank />} />
        <Route path='students' element={<StudentList />} />
        <Route path='settings' element={<div>Settings Page</div>} />
        <Route path='exam-sessions/list' element={<ExamSessionsList />} />
        <Route path='exam-sessions/detail' element={<ExamSessionDetail />} />
        <Route path='exam-sessions/submission' element={<ExamSubmissionDetail />} />
      </Route>

      {/* 404 */}
      <Route path='*' element={<ErrorPage />} />
    </Routes>
  )
}