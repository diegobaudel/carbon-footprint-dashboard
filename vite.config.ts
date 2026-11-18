import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages publica en https://diegobaudel.github.io/carbon-footprint-dashboard/
  base: '/carbon-footprint-dashboard/',
})
