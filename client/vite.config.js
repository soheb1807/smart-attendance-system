import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows network access
    // 👇 THIS FIXES THE "BLOCKED HOST" ERROR
    allowedHosts: [
      'unstudied-karey-undenied.ngrok-free.dev', 
      '.ngrok-free.dev' // (Optional) Allows any ngrok url in future
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})