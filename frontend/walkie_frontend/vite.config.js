import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    host: true, 
    proxy: {
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
      }
    },

    // --- ADICIONE ESTA LINHA ---
    allowedHosts: ['kristen-unsiding-norene.ngrok-free.dev']
    // --- FIM DA LINHA ADICIONADA ---
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})