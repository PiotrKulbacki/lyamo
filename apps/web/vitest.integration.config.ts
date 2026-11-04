import { defineConfig } from 'vitest/config';
import base from './vitest.config';

export default defineConfig({
  resolve: base.resolve,
  test: {
    environment: 'node',
    include: ['integration/**/*.test.ts'],
    fileParallelism: false,
  },
});
