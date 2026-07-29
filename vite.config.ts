import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url'; // 👈 Используем node:url, а не path
import fs from 'node:fs';
import path from 'node:path';

// buildTime генерируется только при продакшн-сборке.
// В dev-режиме используем 0, чтобы checkUpdate делал ранний return
// и баннер "ОБНОВЛЕНИЕ ИГРЫ" не появлялся в локалке.
const isBuild = process.argv.includes('build');
const buildTime = isBuild ? Date.now() : 0;

if (isBuild) {
  try {
    const publicDir = fileURLToPath(new URL('./public', import.meta.url));
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(publicDir, 'version.json'),
      JSON.stringify({ buildTime, version: '1.1.5' }, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.error('Failed to write version.json:', e);
  }
}

export default defineConfig({
  base: '/',
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
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'zustand'],
          'vendor-pixi': ['pixi.js'],
        },
      },
    },
  },
  define: {
    __BUILD_TIME__: buildTime,
  },
  esbuild: {
    pure: isBuild ? ['console.log', 'console.info', 'console.debug'] : [],
    drop: ['debugger'],
  },
});