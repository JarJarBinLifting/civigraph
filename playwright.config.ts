import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4300', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium', channel: 'chrome', viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: 'npm run start', url: 'http://127.0.0.1:4300', reuseExistingServer: !process.env.CI, timeout: 60000 },
});
