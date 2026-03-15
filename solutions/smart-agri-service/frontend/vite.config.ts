import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/huinongfu/',
  server: {
    port: parseInt(process.env.VITE_PORT || '5281'),
    host: true,
  },
})
