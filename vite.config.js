import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vercel serves from the root; GitHub Pages builds with BASE_PATH=/FOODE3-GH/.
  base: process.env.BASE_PATH || '/',
});
