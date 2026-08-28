import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is set at build time via VITE_BASE_PATH so the same build works
// on GitHub Pages, Vercel, and local dev.
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
