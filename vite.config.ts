import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone, host-neutral demo page (docs/07 decision 1). Fixtures are served
// from public/fixtures; no live gateway call from the browser.
export default defineConfig({
  // Relative base so the build works at a GitHub Pages subpath (.../<repo>/).
  base: './',
  plugins: [react()],
  server: { port: 5181 },
})
