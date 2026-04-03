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
    // Proxy apenas para development (quando Vite está rodando localmente)
    proxy: {
      '/funcionarios': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/registros': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/relatorio': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/resumo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/logs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ia': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  },
  build: {
    // Vite usa esbuild por padrão (mais rápido que terser)
    // sourcemap: true, // Descomentar se precisar de source maps em produção
  },
  define: {
    // Definir variáveis globais para o app
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  }
})
