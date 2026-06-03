import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 520_000, // per-test timeout
  expect: { timeout: 180_000 }, // per-assertion timeout
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // MetaMask requires a single browser context
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    actionTimeout: 180_000, // per-action timeout (click, fill, etc.)
    navigationTimeout: 180_000,
    trace: 'on-first-retry',
    video: 'on',             // record video for every test — stored in test-results/
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
