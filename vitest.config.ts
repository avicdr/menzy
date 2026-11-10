import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    setupFiles: ['dotenv/config'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

