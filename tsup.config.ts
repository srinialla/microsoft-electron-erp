import { defineConfig } from 'tsup';

export default defineConfig({
  dts: false,
  sourcemap: true,
  target: 'es2022',
  format: ['cjs'],
  splitting: false,
  clean: false,
  external: ['electron', 'better-sqlite3', 'electron-updater', 'electron-log', 'electron-window-state'],
});
