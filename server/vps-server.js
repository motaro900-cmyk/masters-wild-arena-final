/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Express server wrapper for deploying the game on a standard VPS.
 *           Serves the Vite static bundle and executes serverless API handlers.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import existing handlers
import timeHandler from './time.js';
import verifySignHandler from './verify-sign.js';
import vkPaymentHandler from './vk-payment.js';
import beaconSyncHandler from './beacon-sync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from Vite build output folder ('dist')
app.use(express.static(path.join(__dirname, '../dist')));

// Express middleware handler wrapper to catch async errors
const adaptHandler = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (err) {
        console.error('[VPS Server] Error in handler execution:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// API Routes
app.get('/api/time', adaptHandler(timeHandler));
app.get('/api/verify-sign', adaptHandler(verifySignHandler));
app.post('/api/vk-payment', adaptHandler(vkPaymentHandler));
app.post('/api/beacon-sync', adaptHandler(beaconSyncHandler));

// SPA Fallback: Route all non-API paths to index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`[VPS Server] Game server is listening on port ${PORT}`);
    console.log(`[VPS Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
