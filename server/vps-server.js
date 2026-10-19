/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Express server wrapper for deploying the game on a standard VPS.
 *           Serves the Vite static bundle and executes serverless API handlers.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';

// Enforce single-process execution for LocalStore and in-memory mutex safety
if (
    (process.env.instances && parseInt(process.env.instances, 10) > 1) ||
    (process.env.NODE_APP_INSTANCE && parseInt(process.env.NODE_APP_INSTANCE, 10) > 0)
) {
    console.error('[CRITICAL STARTUP ERROR] Multi-process cluster mode detected! LocalStore requires single-process execution (instances: 1) to prevent race conditions.');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Serve static assets from Vite build output folder ('dist')
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Fallback: Route all non-API paths to index.html for client-side routing
app.get('*all', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`[VPS Server] Game server is listening on port ${PORT}`);
    console.log(`[VPS Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
