import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url'; // 👈 Используем node:url, а не path
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: './',
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'save-layout-plugin',
      configureServer(server) {
        server.middlewares.use('/api/save-layout', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const __dirname = fileURLToPath(new URL('.', import.meta.url));
                const filePath = path.resolve(__dirname, 'src/data/layoutConfig.json');
                fs.writeFileSync(filePath, body, 'utf-8');
                res.statusCode = 200;
                res.end('Saved successfully');
              } catch (err) {
                res.statusCode = 500;
                res.end('Error saving file');
              }
            });
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  esbuild: {
    // [Lead Architect]: Мы оставляем логи для отладки у игроков в продакшене.
    drop: [], 
  },
});