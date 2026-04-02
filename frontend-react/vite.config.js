import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/funcionarios': 'http://localhost:3000',
      '/registros': 'http://localhost:3000',
      '/relatorio': 'http://localhost:3000',
      '/resumo': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/ia': 'http://localhost:3000',
    }
  }
})
