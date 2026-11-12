import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 后端只在本机 8080；内网穿透负责把外部域名转到 5173，代理不能再指回隧道域名（否则死循环）
const BACKEND = 'http://localhost:8080'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Vite 5.4.12+ 的 Host 校验：穿透域名会变，按后缀放行
    allowedHosts: ['.vicp.fun', '.natappfree.cc', 'localhost'],
    proxy: {
      '/api': BACKEND,
      '/upload': BACKEND,
      '/wechat': BACKEND
    }
  }
})
