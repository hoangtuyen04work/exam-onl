import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000
  },
  css: {
    devSourcemap: true
  },
    optimizeDeps: {
    include: ["sockjs-client"]
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      './runtimeConfig': './runtimeConfig.browser'
    }
  },
  define: {
    global: 'globalThis', // ← Dòng này fix triệt để mọi lỗi "global is not defined"
  },
})
