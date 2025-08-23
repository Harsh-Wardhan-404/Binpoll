import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'binpoll.blue2green.me',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.blue2green.me',
      '.vercel.app',
      '.netlify.app',
      '.github.io'
    ]
  },
  server: {
    allowedHosts: [
      'binpoll.blue2green.me',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.blue2green.me',
      '.vercel.app',
      '.netlify.app',
      '.github.io'
    ]
  }
})
