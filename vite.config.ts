import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // CRITICAL: base: './' ensures assets are loaded relatively. 
    // This fixes "White Screen" on GitHub Pages, FTP, Shared Hosting, etc.
    base: './', 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
    },
    define: {
      // Prevents crash if API_KEY is missing during build by providing a default string
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""), 
      // Polyfill process.env to an empty object to avoid "ReferenceError: process is not defined" in browser
      'process.env': {},
      // Polyfill global for some older libraries that might assume Node.js environment
      'global': 'window',
    }
  }
})