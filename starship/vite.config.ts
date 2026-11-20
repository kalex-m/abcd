import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  server: { port: 5173, host: true },
  build: { target: 'es2022', outDir: 'dist', chunkSizeWarningLimit: 4000, sourcemap: false },
});
