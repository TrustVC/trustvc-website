import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // per-test timeout (2 min)
  expect: { timeout: 30_000 }, // per-assertion timeout
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // MetaMask requires a single browser context
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    actionTimeout: 30_000, // per-action timeout (click, fill, etc.)
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
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
