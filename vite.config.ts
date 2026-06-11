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
        // Очищаем лог ошибок при старте сервера
        try {
          const __dirname = fileURLToPath(new URL('.', import.meta.url));
          const logPath = path.resolve(__dirname, 'runtime_errors.log');
          fs.writeFileSync(logPath, '', 'utf-8');
        } catch (e) {}

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

        server.middlewares.use('/api/log-error', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const __dirname = fileURLToPath(new URL('.', import.meta.url));
                const logPath = path.resolve(__dirname, 'runtime_errors.log');
                const timestamp = new Date().toISOString();
                const logMsg = `[${timestamp}] ERROR: ${data.message}\nFile: ${data.source}:${data.line}:${data.col}\nStack: ${data.stack}\n\n`;
                fs.appendFileSync(logPath, logMsg, 'utf-8');
                
                // Выводим ошибку в консоль сервера ярким цветом
                console.error(`\x1b[41m\x1b[37m 🚨 FRONTEND ERROR DETECTED 🚨 \x1b[0m`);
                console.error(`\x1b[31mError: ${data.message}\x1b[0m`);
                console.error(`\x1b[33mLocation: ${data.source}:${data.line}:${data.col}\x1b[0m`);
                if (data.stack) {
                  console.error(`\x1b[90m${data.stack.split('\n').slice(0, 3).join('\n')}\x1b[0m`);
                }
                
                res.statusCode = 200;
                res.end('Logged');
              } catch (err) {
                res.statusCode = 500;
                res.end('Error writing error log');
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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/functions'],
          'vendor-pixi':     ['pixi.js'],
          'vendor-gsap':     ['gsap'],
          'vendor-framer':   ['framer-motion'],
          'vendor-zustand':  ['zustand'],
        },
      },
    },
  },
  esbuild: {
    // [Lead Architect]: Мы оставляем логи для отладки у игроков в продакшене.
    drop: [], 
  },
});