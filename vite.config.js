import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split('\\').join('/')

          if (normalizedId.includes('node_modules/three')) {
            if (normalizedId.includes('/src/renderers/')) return 'three-renderers'
            if (normalizedId.includes('/src/materials/')) return 'three-materials'
            if (normalizedId.includes('/src/geometries/')) return 'three-geometries'
            if (normalizedId.includes('/src/objects/')) return 'three-objects'
            if (normalizedId.includes('/src/scenes/')) return 'three-scenes'
            if (normalizedId.includes('/src/textures/')) return 'three-textures'
            if (normalizedId.includes('/src/math/')) return 'three-math'
            if (normalizedId.includes('/src/core/')) return 'three-core'
            return 'three-misc'
          }

          if (normalizedId.includes('node_modules/recharts')) {
            return 'recharts-vendor'
          }
        },
      },
    },
  },
})
