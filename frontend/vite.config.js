import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
  server: {
    port: 5731,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8573',
        changeOrigin: true,
      }
    }
  },
  // Proxy API requests to backend during development
  preview: {
    port: 5731,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8573',
        changeOrigin: true,
      }
    }
  }
})
