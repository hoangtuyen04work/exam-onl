import { createSlice } from '@reduxjs/toolkit'

// 🔹 Khi app khởi tạo, đọc token & user từ localStorage
const token = localStorage.getItem('authToken')
const role = localStorage.getItem('role')
const name = localStorage.getItem('name')

const initialState = {
  user: token ? { name, role, token } : null,
  token: token || null,
  isAuthenticated: !!token,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload
      state.token = action.payload.token
      state.isAuthenticated = true

      // 🔹 Lưu lại thông tin vào localStorage để giữ login sau reload
      localStorage.setItem('authToken', action.payload.token)
      if (action.payload.role) localStorage.setItem('role', action.payload.role)
      if (action.payload.name) localStorage.setItem('name', action.payload.name)
    },

    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false

      // 🔹 Xóa localStorage khi logout
      localStorage.removeItem('authToken')
      localStorage.removeItem('role')
      localStorage.removeItem('name')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
