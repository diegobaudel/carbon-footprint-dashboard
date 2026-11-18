import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages publica en una subcarpeta (/carbon-footprint-dashboard/);
  // Vercel y el modo local usan la raíz. GITHUB_ACTIONS solo existe al compilar en GitHub.
  base: process.env.GITHUB_ACTIONS ? '/carbon-footprint-dashboard/' : '/',
})
