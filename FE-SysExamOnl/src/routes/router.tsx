import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import ErrorPage from '../components/ErrorPage'
import StudentLayout from '../layouts/StudentLayout'
import StudentDashboard from '../pages/Student/Dashboard'
import Exam from '../components/Exam'

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
        index: true,
        element: <StudentDashboard />
      },
      {
        path: 'exam/:id',
        element: <Exam />
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
