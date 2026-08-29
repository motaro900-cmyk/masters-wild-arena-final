/**
 * Phase 4 — Secondary Services Migration Verification Suite (Chat, Mail, Clans, Leaderboard)
 */

import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const PORT = 3005;
const TEST_SERVER_URL = `http://127.0.0.1:${PORT}`;
const TEST_SECRET = 'vk_test_secret_key_1234567890';

process.env.VK_APP_SECRET = TEST_SECRET;

// Import handlers
import { handleGetMessages, handleSendMessage } from '../../server/services/chatHandler.js';
import { handleGetMail, handleClaimMail } from '../../server/services/mailHandler.js';
import { handleGetClanList, handleCreateClan } from '../../server/services/clanHandler.js';
import { handleGetLeaderboard } from '../../server/services/leaderboardHandler.js';
import profileSaveHandler from '../../server/profile-save.js';
import profileLoadHandler from '../../server/profile-load.js';

let server = null;

function generateVkSign(paramsObj, secret) {
    const vkParams = Object.keys(paramsObj)
        .filter((k) => k.startsWith('vk_'))
        .sort()
        .map((k) => `${k}=${paramsObj[k]}`);
    const queryString = vkParams.join('&');
    return crypto
        .createHmac('sha256', secret)
        .update(queryString)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');
}

async function startServer() {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    const adapt = (fn) => async (req, res) => {
        try {
            await fn(req, res);
        } catch (e) {
            if (!res.headersSent) res.status(500).json({ error: e.message });
        }
    };

    app.post('/api/profile-save', adapt(profileSaveHandler));
    app.get('/api/profile-load', adapt(profileLoadHandler));
    app.get('/api/chat/messages', adapt(handleGetMessages));
    app.post('/api/chat/send', adapt(handleSendMessage));
    app.get('/api/mail/inbox', adapt(handleGetMail));
    app.post('/api/mail/claim', adapt(handleClaimMail));
    app.get('/api/clan/list', adapt(handleGetClanList));
    app.post('/api/clan/create', adapt(handleCreateClan));
    app.get('/api/leaderboard/top', adapt(handleGetLeaderboard));

    return new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[Phase4Test] Server listening on ${TEST_SERVER_URL}`);
            resolve();
        });
    });
}

const serviceResults = {
    test1_chat_get_and_send: 'NOT TESTED',
    test2_chat_flood_protection: 'NOT TESTED',
    test3_mail_atomic_attachment_claim: 'NOT TESTED',
    test4_mail_duplicate_claim_prevention: 'NOT TESTED',
    test5_clan_list_and_create: 'NOT TESTED',
    test6_leaderboard_verified_sorting: 'NOT TESTED',
};

async function runPhase4Tests() {
    console.log('====================================================');
    console.log('🌐 RUNNING PHASE 4 SECONDARY SERVICES TEST SUITE');
    console.log('====================================================\n');

    await startServer();

    try {
        const vkUserId = '112233';
        const nowSec = Math.floor(Date.now() / 1000);
        const validParams = {
            vk_app_id: '52297839',
            vk_user_id: vkUserId,
            vk_ts: String(nowSec),
            vk_platform: 'mobile_web',
        };
        const validSign = generateVkSign(validParams, TEST_SECRET);
        const validLaunchParams = `?${new URLSearchParams({ ...validParams, sign: validSign }).toString()}`;

        // ─── TEST 1 & 2: Chat Service & Flood Protection ───
        console.log('🔍 [TEST 1 & 2] Testing Chat Messages & Anti-Flood Protection...');
        const chatGetRes = await fetch(`${TEST_SERVER_URL}/api/chat/messages?room=global`);
        const chatGetData = await chatGetRes.json();

        const chatSend1 = await fetch(`${TEST_SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                senderName: 'Охотник',
                text: 'Всем привет на арене!',
                room: 'global',
                launchParams: validLaunchParams,
            }),
        });
        const chatSendData1 = await chatSend1.json();

        // Send immediately again (should trigger flood limit)
        const chatSend2Flood = await fetch(`${TEST_SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                senderName: 'Охотник',
                text: 'Спам-сообщение!',
                room: 'global',
                launchParams: validLaunchParams,
            }),
        });

        if (chatGetData.ok && chatSendData1.ok && chatSend2Flood.status === 429) {
            serviceResults.test1_chat_get_and_send = 'PASS';
            serviceResults.test2_chat_flood_protection = 'PASS';
            console.log('✅ [TEST 1 & 2 PASS] Chat sent & stored; rapid flood message rejected with HTTP 429.');
        } else {
            serviceResults.test1_chat_get_and_send = 'FAIL';
            serviceResults.test2_chat_flood_protection = 'FAIL';
            console.error('❌ [TEST 1 & 2 FAIL]', { get: chatGetData, send: chatSendData1, flood: await chatSend2Flood.text() });
        }

        // ─── TEST 3 & 4: Mail Service with Atomic Attachment Claim ───
        console.log('\n🔍 [TEST 3 & 4] Testing Mail Service & Attachment Claiming...');
        // Plant a test mail into player profile directly on disk
        const profilePath = path.join(ROOT_DIR, 'server', 'data', 'пользователи_dev', `VK-${vkUserId}.json`);
        const initialProfile = {
            gold: 1000,
            crystals: 50,
            level: 5,
            rating: 1200,
            mail: [
                {
                    id: 'mail_tournament_gift',
                    from: 'СУДЬЯ АРЕНЫ',
                    subject: 'Награда турнира',
                    isRead: false,
                    isClaimed: false,
                    rewards: [
                        { type: 'GOLD', amount: 1500 },
                        { type: 'CRYSTALS', amount: 50 },
                    ],
                },
            ],
            revision: 1,
            lastSavedTimestamp: Date.now(),
        };
        fs.mkdirSync(path.dirname(profilePath), { recursive: true });
        fs.writeFileSync(profilePath, JSON.stringify(initialProfile, null, 2), 'utf8');

        // Claim attachments
        const mailClaimRes1 = await fetch(`${TEST_SERVER_URL}/api/mail/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                mailId: 'mail_tournament_gift',
                operationId: `claim_tourn_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });
        const mailClaimData1 = await mailClaimRes1.json();

        // Replay claim
        const mailClaimRes2 = await fetch(`${TEST_SERVER_URL}/api/mail/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                mailId: 'mail_tournament_gift',
                operationId: `claim_tourn_replay_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });

        if (mailClaimData1.ok && mailClaimData1.data.gold === 2500 && mailClaimRes2.status === 400) {
            serviceResults.test3_mail_atomic_attachment_claim = 'PASS';
            serviceResults.test4_mail_duplicate_claim_prevention = 'PASS';
            console.log(`✅ [TEST 3 & 4 PASS] Mail claimed: +1500 gold (new total: ${mailClaimData1.data.gold}). Duplicate claim rejected.`);
        } else {
            serviceResults.test3_mail_atomic_attachment_claim = 'FAIL';
            serviceResults.test4_mail_duplicate_claim_prevention = 'FAIL';
            console.error('❌ [TEST 3 & 4 FAIL]', { claim1: mailClaimData1, claim2: await mailClaimRes2.text() });
        }

        // ─── TEST 5: Clan List & Creation ───
        console.log('\n🔍 [TEST 5] Testing Clan List & Clan Creation (Requires 5000 gold)...');
        // Give player 6000 gold for clan creation
        const currentProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        currentProfile.gold = 6000;
        fs.writeFileSync(profilePath, JSON.stringify(currentProfile, null, 2), 'utf8');

        const clanListRes = await fetch(`${TEST_SERVER_URL}/api/clan/list`);
        const clanListData = await clanListRes.json();

        const createClanRes = await fetch(`${TEST_SERVER_URL}/api/clan/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                clanName: 'Северные Волки',
                clanTag: 'WOLF',
                description: 'Клан верных воинов Севера',
                launchParams: validLaunchParams,
            }),
        });
        const createClanData = await createClanRes.json();

        if (clanListData.ok && createClanData.clan && createClanData.goldRemaining === 1000) {
            serviceResults.test5_clan_list_and_create = 'PASS';
            console.log(`✅ [TEST 5 PASS] Clan created: "${createClanData.clan.name}" [${createClanData.clan.tag}], 5000 gold deducted (remaining: ${createClanData.goldRemaining}).`);
        } else {
            serviceResults.test5_clan_list_and_create = 'FAIL';
            console.error('❌ [TEST 5 FAIL]', { list: clanListData, create: createClanData });
        }

        // ─── TEST 6: Leaderboard Top 50 ───
        console.log('\n🔍 [TEST 6] Testing Leaderboard API from verified server profiles...');
        const leadRes = await fetch(`${TEST_SERVER_URL}/api/leaderboard/top?limit=10&isDev=true`);
        const leadData = await leadRes.json();

        if (leadData.ok && Array.isArray(leadData.leaderboard) && leadData.leaderboard.length > 0) {
            const isSorted = leadData.leaderboard.every((p, i, arr) => i === 0 || arr[i - 1].rating >= p.rating);
            if (isSorted) {
                serviceResults.test6_leaderboard_verified_sorting = 'PASS';
                console.log(`✅ [TEST 6 PASS] Leaderboard loaded ${leadData.leaderboard.length} players, strictly sorted by rating.`);
            } else {
                serviceResults.test6_leaderboard_verified_sorting = 'FAIL';
                console.error('❌ [TEST 6 FAIL] Leaderboard not sorted correctly:', leadData);
            }
        } else {
            serviceResults.test6_leaderboard_verified_sorting = 'FAIL';
            console.error('❌ [TEST 6 FAIL] Unexpected leaderboard response:', leadData);
        }

        // Clean up test file
        if (fs.existsSync(profilePath)) {
            fs.unlinkSync(profilePath);
        }
    } catch (err) {
        console.error('❌ Error during Phase 4 tests:', err);
    }

    console.log('\n====================================================');
    console.log('📊 PHASE 4 SERVICES VERIFICATION SUMMARY');
    console.log('====================================================');
    console.table(serviceResults);

    if (server) {
        server.close();
    }
    setTimeout(() => {
        process.exit(0);
    }, 100);
}

runPhase4Tests();
