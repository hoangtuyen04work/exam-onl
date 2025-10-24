import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import AppRouter from './routes/AppRouter'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

console.log('main.tsx loaded') // debug xem script có chạy không

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
          <ToastContainer position="top-right" autoClose={2000} />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
)
