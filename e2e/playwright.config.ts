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
    video: 'retain-on-failure', // record video; keep only for failing tests
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 800, // ms delay between every action — remove when done debugging
        },
      },
    },
  ],
})
