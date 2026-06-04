import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    port: parseInt(process.env['VITE_PORT'] ?? '5173'),
    proxy: {
      '/api': `http://localhost:${process.env['VITE_API_PORT'] ?? '3000'}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/unit/**/*.test.tsx', 'tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
  },
});
