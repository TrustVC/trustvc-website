import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      nodePolyfills({
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true,
      }),
    ],
    resolve: {
      alias: {
        'dotenv/config': path.resolve(__dirname, 'src/shims/dotenv-config.js'),
        'node-fetch': path.resolve(__dirname, 'src/shims/node-fetch.js'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
    }
  }
})
