// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Deployed under GitHub Pages project path:
export default defineConfig({
  base: '/verse-al-learning-labs/tools/value-curve-canvas/',
  plugins: [react()],
})
