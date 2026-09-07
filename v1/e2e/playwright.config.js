const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 60000,
  workers: 1,
  outputDir: '../playwright-results/test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../playwright-results/html-report' }]],
  use: {
    baseURL: 'http://localhost:5183',
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    // { name: 'msedge', use: { browserName: 'chromium', channel: 'msedge' } },
    // { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});