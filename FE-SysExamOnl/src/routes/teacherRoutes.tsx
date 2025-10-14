import { Fragment } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from '../components/Common/ProtectedRoute'
import TeacherDashboard from '../pages/Teacher/Dashboard/TeacherDashboard'
import ExamList from '../pages/Teacher/Exams/ExamList'
import CreateExam from '../pages/Teacher/Exams/CreateExam'
import QuestionBank from '../pages/Teacher/Questions/QuestionBank'
import Grading from '../pages/Teacher/Results/Grading'
import StudentList from '../pages/Teacher/Students/StudentList'

export const TeacherRoutes = () => (
  <Fragment>
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
  </Fragment>
)