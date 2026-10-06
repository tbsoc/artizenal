import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// https://vite.dev/config/
// SINGLE_FILE=1 inlines all JS/CSS into one self-contained index.html
// (used for producing a shareable build).
const singleFile = process.env.SINGLE_FILE === '1'

export default defineConfig({
  // Relative asset paths so the build works under any sub-path (e.g. GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss(), ...(singleFile ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
