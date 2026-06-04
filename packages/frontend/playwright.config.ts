import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'pnpm --filter backend dev',
      url: 'http://localhost:3000/api/dashboard',
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'pnpm --filter frontend dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
