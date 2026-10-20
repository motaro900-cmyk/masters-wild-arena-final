/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Universal Express application for Masters of the Wild.
 *           Used by both Vercel Serverless Function (api/index.js) and standard VPS (server/vps-server.js).
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import handlers
import timeHandler from './time.js';
import verifySignHandler from './verify-sign.js';
import vkPaymentHandler from './vk-payment.js';
import beaconSyncHandler from './beacon-sync.js';
import authTokenHandler from './auth-token.js';
import profileSaveHandler from './profile-save.js';
import profileLoadHandler from './profile-load.js';
import profileDeleteHandler from './profile-delete.js';
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

const app = express();

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
            callback(null, true);
        }
    },
    credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Bad Request: Malformed JSON' });
    }
    if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    next();
});

const adaptHandler = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (err) {
        console.error('[Server API] Error in handler execution:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

const router = express.Router();

// Core API Routes
router.get('/time', publicLimiter, adaptHandler(timeHandler));
router.get('/verify-sign', publicLimiter, adaptHandler(verifySignHandler));
router.post('/vk-payment', paymentLimiter, adaptHandler(vkPaymentHandler));
router.post('/beacon-sync', profileLimiter, adaptHandler(beaconSyncHandler));
router.get('/auth-token', profileLimiter, adaptHandler(authTokenHandler));
router.post('/profile-save', profileLimiter, adaptHandler(profileSaveHandler));
router.get('/profile-load', profileLimiter, adaptHandler(profileLoadHandler));
router.post('/profile-delete', profileLimiter, adaptHandler(profileDeleteHandler));
router.get('/health', publicLimiter, adaptHandler(healthHandler));
router.post('/log-error', logLimiter, adaptHandler(logErrorHandler));

// Server-Authoritative Game Routes
router.get('/game/energy/sync', gameActionLimiter, adaptHandler(handleEnergySync));
router.post('/game/energy/spend', gameActionLimiter, adaptHandler(handleEnergySpend));
router.post('/game/reward/claim', gameActionLimiter, adaptHandler(handleRewardClaim));
router.post('/game/daily-gift/claim', gameActionLimiter, adaptHandler(handleDailyGiftClaim));
router.post('/game/wheel/spin', gameActionLimiter, adaptHandler(handleWheelSpin));
router.post('/game/inventory/equip', gameActionLimiter, adaptHandler(handleInventoryEquip));
router.post('/game/inventory/sell', gameActionLimiter, adaptHandler(handleInventorySell));
router.post('/game/inventory/upgrade', gameActionLimiter, adaptHandler(handleInventoryUpgrade));
router.post('/game/battle/start', battleLimiter, adaptHandler(handleBattleStart));
router.post('/game/battle/finish', battleLimiter, adaptHandler(handleBattleFinish));

// Secondary Social & Auxiliary Routes
router.get('/chat/messages', chatLimiter, adaptHandler(handleGetMessages));
router.post('/chat/send', chatLimiter, adaptHandler(handleSendMessage));
router.get('/mail/inbox', profileLimiter, adaptHandler(handleGetMail));
router.post('/mail/claim', gameActionLimiter, adaptHandler(handleClaimMail));
router.get('/clan/list', publicLimiter, adaptHandler(handleGetClanList));
router.post('/clan/create', gameActionLimiter, adaptHandler(handleCreateClan));
router.post('/clan/join', gameActionLimiter, adaptHandler(handleJoinClan));
router.post('/clan/leave', gameActionLimiter, adaptHandler(handleLeaveClan));
router.get('/leaderboard/top', publicLimiter, adaptHandler(handleGetLeaderboard));

// Mount router on BOTH /api and / to handle all routing conventions seamlessly
app.use('/api', router);
app.use('/', router);

export default app;
