import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // 代理测试文件请求到静态文件
      '/browser-extension': {
        target: 'http://localhost:3003', // 我们将创建一个简单的静态文件服务器
        changeOrigin: true
      }
    },
    // 允许访问上级目录
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist'
  }
})