import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import OAuthCallback from '../pages/LoginPage/AzureCallback'
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
import ExamMonitoringPage from '../pages/Teacher/Dashboard/Tabs/ExamMonitoringPage'
import ClassListPage from '../pages/Teacher/Classes'
import ClassDetailPage from '../pages/Teacher/Classes/ClassDetailPage'
import ClassEditPage from '../pages/Teacher/Classes/ClassEditPage'
import { ClassListPage as StudentClassListPage } from '../pages/Student/Classes'

import axiosClient from '../api/axiosClient'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../store/slices/authSlice'
import ExamSessionDetail from '../pages/Teacher/Dashboard/Tabs/ESListUser'
import ExamSubmissionDetail from '../pages/Teacher/Dashboard/Tabs/ExamSubmissionDetail'
import ExamResultsPage from '../pages/Teacher/Dashboard/Tabs/ExamResultsPage'
import StudentLayout from '../layouts/StudentLayout'

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
      <Route path='/' element={<Navigate to='/login' replace />} />

      {/* Auth */}
      <Route path='/login' element={<LoginPage />} />
      {/* OAuth2 Callback Routes */}
      <Route path='/oauth2/success' element={<OAuthCallback />} />
      <Route path='/auth/oauth2/callback' element={<OAuthCallback />} />
      <Route path='/auth/azure/callback' element={<OAuthCallback />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />

      {/* Public Exam Routes */}
      <Route path='/exam/join/:inviteCode' element={<JoinExam />} />

      {/* Student Routes */}
      <Route
        path='/student'
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path='classes' element={<StudentClassListPage />} />
        <Route path='classes/:classId' element={<StudentClassListPage />} />
        <Route path='exam/join/:examId' element={<ExamPage />} />
        <Route path='exam/join' element={<JoinExam />} />
        <Route path='exam/:examSessionId/result' element={<ResultPage />} />
      </Route>

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
        <Route path='classes' element={<ClassListPage />} />
        <Route path='classes/:classId' element={<ClassDetailPage />} />
        <Route path='classes/:classId/edit' element={<ClassEditPage />} />
        <Route path='settings' element={<div>Settings Page</div>} />
        <Route path='exam-sessions/list' element={<ExamSessionsList />} />
        <Route path='exam-sessions/detail' element={<ExamSessionDetail />} />
        <Route path='exam-sessions/submission' element={<ExamSubmissionDetail />} />
        <Route path='exam-sessions/:examSessionId/results' element={<ExamResultsPage />} />
        <Route path='monitoring/:examSessionId' element={<ExamMonitoringPage />} />
      </Route>

      {/* 404 */}
      <Route path='*' element={<ErrorPage />} />
    </Routes>
  )
}
