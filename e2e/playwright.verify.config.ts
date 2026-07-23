import { defineConfig, devices } from '@playwright/test'

/**
 * Config for the read-only document VERIFICATION e2e tests (verify-*.spec.ts).
 * These don't use MetaMask, so they run headless and in parallel — separate from
 * the transferable-record suite (playwright.config.ts).
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /verify-.*\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Verifies hit external resolution (did:web, DNS, status lists) + one dev server,
  // so cap concurrency to avoid contention/timeouts.
  workers: process.env.CI ? 2 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [['html', { outputFolder: 'playwright-report-verify', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // PW_CHANNEL=chrome uses system Chrome (no Playwright browser download needed).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined } },
  ],
})
