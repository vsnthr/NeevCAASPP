import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3002'
    }
  }
});
