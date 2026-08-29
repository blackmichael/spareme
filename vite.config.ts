import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

function brandAssets() {
  const source = path.resolve('src/brand/logo.json')
  const generator = path.resolve('scripts/generate-brand-assets.mjs')

  return {
    name: 'brand-assets',
    transformIndexHtml(html: string) {
      const revision = createHash('sha256').update(readFileSync(source)).digest('hex').slice(0, 12)
      return html.replaceAll('%VITE_BRAND_REVISION%', revision)
    },
    configureServer(server: { watcher: { add: (file: string) => void, on: (event: string, callback: (file: string) => void) => void }, ws: { send: (message: { type: string }) => void } }) {
      server.watcher.add(source)
      server.watcher.on('change', (file) => {
        if (path.resolve(file) !== source) return
        execFileSync(process.execPath, [generator], { stdio: 'inherit' })
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

export default defineConfig({
  plugins: [brandAssets(), react()],
  server: {
    port: 3333,
    allowedHosts: ['testlab.walleye-koi.ts.net'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
