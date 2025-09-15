import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Import path
import fs from 'fs'   // Import fs

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
