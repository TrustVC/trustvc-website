import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  return {
    define: {
      'process.env': {},
      'process.browser': true,
      ...(isTest ? {} : { 'process.version': JSON.stringify('v16.0.0') })
    },
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
         '@': fileURLToPath(new URL('./src', import.meta.url)),
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
