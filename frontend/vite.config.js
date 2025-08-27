import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../',
    emptyOutDir: false,
    rollupOptions: {
      input: { main: './index.html' }
    }
  },
  publicDir: false
})
