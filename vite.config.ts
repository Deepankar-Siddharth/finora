import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so assets resolve correctly when deployed to a
  // GitHub Pages sub-path (e.g. https://deepankar-siddharth.github.io/finora/).
  base: './',
  build: {
    // Split third-party libraries into dedicated chunks for faster loads.
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'charts'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
})
