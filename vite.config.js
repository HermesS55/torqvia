import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve('dist', 'sw.js')
      if (!existsSync(swPath)) return
      const content = readFileSync(swPath, 'utf-8')
      const version = `torqvia-v${Date.now()}`
      const updated = content.replace(/torqvia-v\d+/, version)
      writeFileSync(swPath, updated)
      console.log(`[sw-version] Cache version → ${version}`)
    },
  }
}

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  build: {
    chunkSizeWarningLimit: 600,
  },
})
