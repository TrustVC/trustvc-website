import { execFileSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const e2eDir = path.resolve(__dirname, '..')

// Run the locally installed Synpress CLI with the current Node binary rather
// than `npx synpress`, so nothing is resolved through PATH and no shell runs.
const synpressCli = path.resolve(
  e2eDir,
  '../node_modules/@synthetixio/synpress/dist/cli.js'
)

/**
 * Playwright global setup:
 *   - Builds the MetaMask wallet cache via Synpress so tests start fast.
 *   - Does NOT deploy Hardhat contracts — run e2e/helpers/deploy.ts separately.
 */
export default async function globalSetup() {
  try {
    execFileSync(
      process.execPath,
      [synpressCli, 'wallet-setup'],
      { cwd: e2eDir, stdio: 'inherit' }
    )
  } catch (err) {
    // Synpress cache may already exist — ignore duplicate-build errors
    console.warn('[global-setup] synpress wallet build warning:', (err as Error).message)
  }
}
