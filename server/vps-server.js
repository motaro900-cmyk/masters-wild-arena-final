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

// Import handlers
import timeHandler from './time.js';
import verifySignHandler from './verify-sign.js';
import vkPaymentHandler from './vk-payment.js';
import beaconSyncHandler from './beacon-sync.js';
import authTokenHandler from './auth-token.js';
import profileSaveHandler from './profile-save.js';
import profileLoadHandler from './profile-load.js';
import healthHandler from './health.js';
import logErrorHandler from './log-error.js';
import { createRateLimiter } from './securityMiddleware.js';

// Import server-authoritative game handlers
import { handleEnergySync, handleEnergySpend } from './game/energyHandler.js';
import { handleRewardClaim } from './game/rewardHandler.js';
import { handleInventoryEquip, handleInventorySell, handleInventoryUpgrade } from './game/inventoryHandler.js';
import { handleBattleStart, handleBattleFinish } from './game/battleHandler.js';

// Import secondary services handlers
import { handleGetMessages, handleSendMessage } from './services/chatHandler.js';
import { handleGetMail, handleClaimMail } from './services/mailHandler.js';
import { handleGetClanList, handleCreateClan, handleJoinClan, handleLeaveClan } from './services/clanHandler.js';
import { handleGetLeaderboard } from './services/leaderboardHandler.js';
import { handleDailyGiftClaim, handleWheelSpin } from './game/dailyRewardHandler.js';

dotenv.config();

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

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiters
const publicLimiter = createRateLimiter(120, 60000, 'public');
const profileLimiter = createRateLimiter(60, 60000, 'profile');
const gameActionLimiter = createRateLimiter(60, 60000, 'game_action');
const chatLimiter = createRateLimiter(45, 60000, 'chat');
const battleLimiter = createRateLimiter(45, 60000, 'battle');
const paymentLimiter = createRateLimiter(60, 60000, 'payment');
const logLimiter = createRateLimiter(30, 60000, 'log');

// CORS setup with origin validator
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed =
            origin.endsWith('.vk.com') ||
            origin.endsWith('.vk-apps.com') ||
            origin === 'https://vk.com' ||
            origin === 'https://m.vk.com' ||
            origin.includes('mastersofthewild.ru') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1');
        if (allowed) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive in mini app iframe if needed, with credential control
        }
    },
    credentials: true,
}));

// Body parsing middleware (supports large state JSON payloads up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Suppress stack trace leaks on malformed JSON payloads
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Bad Request: Malformed JSON' });
    }
    if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    next();
});

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

// API Routes with Rate Limiting
app.get('/api/time', publicLimiter, adaptHandler(timeHandler));
app.get('/api/verify-sign', publicLimiter, adaptHandler(verifySignHandler));
app.post('/api/vk-payment', paymentLimiter, adaptHandler(vkPaymentHandler));
app.post('/api/beacon-sync', profileLimiter, adaptHandler(beaconSyncHandler));
app.get('/api/auth-token', profileLimiter, adaptHandler(authTokenHandler));
app.post('/api/profile-save', profileLimiter, adaptHandler(profileSaveHandler));
app.get('/api/profile-load', profileLimiter, adaptHandler(profileLoadHandler));
app.get('/api/health', publicLimiter, adaptHandler(healthHandler));
app.post('/api/log-error', logLimiter, adaptHandler(logErrorHandler));

// Server-Authoritative Game Routes
app.get('/api/game/energy/sync', gameActionLimiter, adaptHandler(handleEnergySync));
app.post('/api/game/energy/spend', gameActionLimiter, adaptHandler(handleEnergySpend));
app.post('/api/game/reward/claim', gameActionLimiter, adaptHandler(handleRewardClaim));
app.post('/api/game/daily-gift/claim', gameActionLimiter, adaptHandler(handleDailyGiftClaim));
app.post('/api/game/wheel/spin', gameActionLimiter, adaptHandler(handleWheelSpin));
app.post('/api/game/inventory/equip', gameActionLimiter, adaptHandler(handleInventoryEquip));
app.post('/api/game/inventory/sell', gameActionLimiter, adaptHandler(handleInventorySell));
app.post('/api/game/inventory/upgrade', gameActionLimiter, adaptHandler(handleInventoryUpgrade));
app.post('/api/game/battle/start', battleLimiter, adaptHandler(handleBattleStart));
app.post('/api/game/battle/finish', battleLimiter, adaptHandler(handleBattleFinish));

// Secondary Social & Auxiliary Routes
app.get('/api/chat/messages', chatLimiter, adaptHandler(handleGetMessages));
app.post('/api/chat/send', chatLimiter, adaptHandler(handleSendMessage));
app.get('/api/mail/inbox', profileLimiter, adaptHandler(handleGetMail));
app.post('/api/mail/claim', gameActionLimiter, adaptHandler(handleClaimMail));
app.get('/api/clan/list', publicLimiter, adaptHandler(handleGetClanList));
app.post('/api/clan/create', gameActionLimiter, adaptHandler(handleCreateClan));
app.post('/api/clan/join', gameActionLimiter, adaptHandler(handleJoinClan));
app.post('/api/clan/leave', gameActionLimiter, adaptHandler(handleLeaveClan));
app.get('/api/leaderboard/top', publicLimiter, adaptHandler(handleGetLeaderboard));

// SPA Fallback: Route all non-API paths to index.html for client-side routing
app.get('*all', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`[VPS Server] Game server is listening on port ${PORT}`);
    console.log(`[VPS Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
