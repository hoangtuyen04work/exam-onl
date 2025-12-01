// src/api/axiosClient.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// Lấy base URL từ .env (Vite chuẩn)
const baseURL = (import.meta.env.VITE_API_BASE_EXPOSE as string | undefined)?.replace(/\/+$/, '') || '';

// Tạo instance Axios
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

// Đọc token từ nhiều nguồn (linh hoạt)
function readToken(): string | null {
  try {
    return (
      localStorage.getItem('authToken') ||        // ✅ thêm dòng này
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('authToken') ||
      null
    );
  } catch {
    return null;
  }
}


// Cập nhật token (login/logout)
export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
    }
  } catch {
    // ignore
  }
}

// === REQUEST INTERCEPTOR ===
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = readToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Debug log (chỉ ở dev)
    if (import.meta.env.DEV) {
      const method = config.method?.toUpperCase() ?? 'GET';
      const url = config.url ? `${baseURL}${config.url}`.replace(/\/+/g, '/') : 'unknown';
      const data = config.params ?? config.data ?? {};
      console.debug('[api] REQ', method, url, data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.debug('[api] RES', response.status, response.config.url, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (import.meta.env.DEV) {
      console.error('[api] ERR', status, url, error.response?.data ?? error.message);
    }

    // Xử lý hết hạn token
    if (status === 401) {
      setAuthToken(null);
      // window.location.href = '/login'; // bật nếu cần redirect
    }

    return Promise.reject(error);
  }
);

export default api;