import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5174',
  },
  webServer: [
    {
      command: 'pnpm --filter @pcm/backend db:migrate && pnpm --filter @pcm/backend db:seed -- --force && pnpm --filter @pcm/backend dev',
      url: 'http://localhost:3001/api/dashboard',
      reuseExistingServer: !process.env['CI'],
      env: { PORT: '3001', DATABASE_PATH: fileURLToPath(new URL('../../data/test.db', import.meta.url)) },
    },
    {
      command: 'pnpm --filter @pcm/frontend dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env['CI'],
      env: { VITE_PORT: '5174', VITE_API_PORT: '3001' },
    },
  ],
});
