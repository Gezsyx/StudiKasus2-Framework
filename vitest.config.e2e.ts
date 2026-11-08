import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Database SQLite in-memory agar test tidak menyentuh data asli.
    env: { DB_TYPE: 'better-sqlite3', DB_FILE: ':memory:' },
  },
});
