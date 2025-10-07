import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import ErrorPage from '../components/ErrorPage'
import StudentLayout from '../layouts/StudentLayout'
import StudentDashboard from '../pages/Student/Dashboard'

const routerConfig = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      {
        index: true, // /student
        element: <StudentDashboard />
      },
      {
        path: 'exam-info' // /student/exam-info
        // element: <ExamInfo />
      },
      {
        path: 'result' // /student/result
        // element: <Result />
      }
    ]
  },
  {
    path: '*',
    element: <ErrorPage />
  }
])

export default routerConfig
