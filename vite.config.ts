import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 使用相对路径，兼容 GitHub Pages 等子路径部署
  base: './',
  plugins: [react()],
})
