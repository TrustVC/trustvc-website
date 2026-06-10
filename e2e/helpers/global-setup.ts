import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Playwright global setup:
 *   - Builds the MetaMask wallet cache via Synpress so tests start fast.
 *   - Does NOT deploy Hardhat contracts — run e2e/helpers/deploy.ts separately.
 */
export default async function globalSetup() {
  try {
    execSync(
      'npx synpress --wallet-setup-file ./wallet-setup/basic.setup.ts',
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      }
    )
  } catch (err) {
    // Synpress cache may already exist — ignore duplicate-build errors
    console.warn('[global-setup] synpress wallet build warning:', (err as Error).message)
  }
}
