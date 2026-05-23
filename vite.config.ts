import { defineConfig } from 'vite'

const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGitHubPagesBuild ? '/ts-canvas-app/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
