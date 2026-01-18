import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Build app into /app directory at repo root
    outDir: '../app',
    // App is served from /app on the server
    base: '/app/',
    assetsDir: 'assets',
    manifest: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
}) 
=======
  build: {
    outDir: '../',
    emptyOutDir: false,
    rollupOptions: {
      input: { main: './index.html' }
    }
  },
  publicDir: false
})
>>>>>>> 9988d1613fcae282d84e6e56ef9c42f2f9bee99a
