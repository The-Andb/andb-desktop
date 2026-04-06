import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.spec.ts',
  timeout: 300_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: 0,
  workers: 1, 
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    headless: false, 
    screenshot: 'on',
    video: 'on', 
    actionTimeout: 30_000,
    trace: 'on',
  },
});
