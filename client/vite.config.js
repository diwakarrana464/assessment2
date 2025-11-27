// vite.config.js (Updated with Path Alias)

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // ⬅️ 1. Import 'path' utility

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // ⬅️ 2. ADD THE RESOLVE BLOCK HERE
  resolve: {
    alias: {
      // This tells Vite that '@' always maps to the 'src' directory.
      '@': path.resolve(__dirname, './src') 
    }
  }
})