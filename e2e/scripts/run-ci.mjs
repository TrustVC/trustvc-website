/**
 * Simulates the GitHub Actions e2e workflow locally.
 * Runs everything in the same order as ci.yml:
 *   1. Hardhat node (background)
 *   2. Contract setup
 *   3. MetaMask wallet cache (--force rebuild)
 *   4. Dev server (background)
 *   5. Playwright tests with CI=true
 *
 * Usage:  npm run e2e:ci
 */
import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })
}

function background(cmd, label) {
  console.log(`\n⚡ [bg] ${label}`)
  const proc = spawn(cmd, { shell: true, stdio: 'ignore', cwd: ROOT })
  proc.on('error', err => console.error(`[bg ${label}] error:`, err.message))
  return proc
}

async function waitOn(url, timeoutMs = 60_000) {
  console.log(`⏳ Waiting for ${url}…`)
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      execSync(`npx wait-on ${url} --timeout 5000`, { stdio: 'ignore', cwd: ROOT })
      console.log(`✅ ${url} is ready`)
      return
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const procs = []

try {
  // ── 1. Hardhat node ───────────────────────────────────────────────────────
  procs.push(background('npx hardhat node', 'hardhat'))
  await waitOn('http://127.0.0.1:8545')

  // ── 2. Deploy contracts ───────────────────────────────────────────────────
  run('node e2e/setup-contracts.cjs')

  // ── 3. MetaMask wallet cache ──────────────────────────────────────────────
  run('npx synpress e2e/wallet-setup --force')

  // ── 4. Dev server ─────────────────────────────────────────────────────────
  procs.push(background('npm run dev -- --open false', 'vite'))
  await waitOn('http://localhost:5173')

  // ── 5. E2E tests with CI=true (mimics GitHub Actions environment) ─────────
  run('npx playwright test --config e2e/playwright.config.ts', {
    env: { ...process.env, CI: 'true' },
  })

  console.log('\n✅ All e2e tests passed.')
} catch (err) {
  console.error('\n❌ CI simulation failed:', err.message)
  process.exitCode = 1
} finally {
  procs.forEach(p => p.kill())
}
