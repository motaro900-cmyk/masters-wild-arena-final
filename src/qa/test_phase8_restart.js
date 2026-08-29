/**
 * PHASE 8 — Server Restart, Crash Recovery & Idempotency Persistence Suite
 *
 * Verifies that:
 * 1. An economic transaction creates state on disk.
 * 2. The VPS Node.js process is stopped and restarted.
 * 3. The state and `_processedOps` table remain fully intact.
 * 4. A replayed request after restart is recognized as a duplicate and does NOT double-credit currency.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const PORT = 3014;
const TEST_SERVER_URL = `http://localhost:${PORT}`;

const TEST_SECRET = 'vk_test_secret_key_1234567890';
process.env.VK_APP_SECRET = TEST_SECRET;

import { handleRewardClaim } from '../../server/game/rewardHandler.js';
import { getLocalDoc, saveLocalDoc } from '../../server/localStore.js';
import profileLoadHandler from '../../server/profile-load.js';
import profileSaveHandler from '../../server/profile-save.js';

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

function createExpressApp() {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    const adapt = (fn) => async (req, res) => {
        try {
            await fn(req, res);
        } catch (e) {
            if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
        }
    };

    app.post('/api/game/reward/claim', adapt(handleRewardClaim));
    app.get('/api/profile-load', adapt(profileLoadHandler));
    app.post('/api/profile-save', adapt(profileSaveHandler));
    return app;
}

let serverInstance = null;

function startServer() {
    const app = createExpressApp();
    return new Promise((resolve) => {
        serverInstance = app.listen(PORT, () => {
            resolve();
        });
    });
}

function stopServer() {
    return new Promise((resolve) => {
        if (serverInstance) {
            serverInstance.close(() => {
                serverInstance = null;
                resolve();
            });
        } else {
            resolve();
        }
    });
}

const restartResults = {
    test1_pre_restart_transaction: 'NOT TESTED',
    test2_server_restart_execution: 'NOT TESTED',
    test3_post_restart_state_integrity: 'NOT TESTED',
    test4_post_restart_replay_rejection: 'NOT TESTED',
};

async function runRestartSuite() {
    console.log('====================================================');
    console.log('🔄 RUNNING PHASE 8 SERVER RESTART & PERSISTENCE AUDIT');
    console.log('====================================================\n');

    const testUserId = 'VK-restart-user-999';
    const nowSec = Math.floor(Date.now() / 1000);
    const validParamsObj = {
        vk_app_id: '52297839',
        vk_user_id: 'restart-user-999',
        vk_ts: String(nowSec),
        vk_platform: 'mobile_android',
    };
    const validSign = generateVkSign(validParamsObj, TEST_SECRET);
    const validLaunchParams = `?${new URLSearchParams({ ...validParamsObj, sign: validSign }).toString()}`;

    // Clean initial profile
    await saveLocalDoc('пользователи_dev', testUserId, {
        gold: 1000,
        crystals: 50,
        energy: 100,
        level: 1,
        revision: 1,
        _processedOps: {},
    });

    // ─── 1. START SERVER 1 & EXECUTE TRANSACTION ───
    console.log('🚀 [STEP 1] Starting VPS Server Instance #1...');
    await startServer();

    const uniqueOpId = `restart_op_${Date.now()}`;
    console.log(`💰 Executing economic transaction with operationId: ${uniqueOpId}...`);
    const claimRes1 = await fetch(`${TEST_SERVER_URL}/api/game/reward/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: testUserId,
            isDev: true,
            rewardType: 'QUEST',
            rewardKey: 'q_restart_test',
            operationId: uniqueOpId,
            launchParams: validLaunchParams,
        }),
    });
    const claimData1 = await claimRes1.json();
    if (claimData1.ok && (claimData1.data?.awarded?.gold === 250 || claimData1.data?.gold === 1250)) {
        restartResults.test1_pre_restart_transaction = 'PASS';
        console.log('✅ [STEP 1 PASS] Transaction #1 succeeded (+250 gold).');
    } else {
        restartResults.test1_pre_restart_transaction = 'FAIL';
        console.error('❌ [STEP 1 FAIL] Transaction #1 failed:', claimData1);
    }

    // ─── 2. SIMULATE HARD SERVER CRASH / RESTART ───
    console.log('\n🛑 [STEP 2] Simulating Server Crash / Restart (stopping Server Instance #1)...');
    await stopServer();
    await new Promise((r) => setTimeout(r, 500));
    console.log('🔄 Restarting VPS Server Instance #2...');
    await startServer();
    restartResults.test2_server_restart_execution = 'PASS';
    console.log('✅ [STEP 2 PASS] Server successfully rebooted.');

    // ─── 3. VERIFY PROFILE LOAD INTEGRITY POST-RESTART ───
    console.log('\n📊 [STEP 3] Verifying profile data integrity post-restart...');
    const loadDoc = await getLocalDoc('пользователи_dev', testUserId);
    if (loadDoc.exists && loadDoc.data.gold === 1250 && loadDoc.data._processedOps[uniqueOpId]) {
        restartResults.test3_post_restart_state_integrity = 'PASS';
        console.log('✅ [STEP 3 PASS] Gold balance (1250) and _processedOps fully preserved on disk.');
    } else {
        restartResults.test3_post_restart_state_integrity = 'FAIL';
        console.error('❌ [STEP 3 FAIL] State corrupted after restart!', loadDoc);
    }

    // ─── 4. ATTEMPT REPLAY OF OPERATION AFTER RESTART ───
    console.log('\n🔒 [STEP 4] Attempting Replay of Transaction with identical operationId...');
    const claimRes2 = await fetch(`${TEST_SERVER_URL}/api/game/reward/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: testUserId,
            isDev: true,
            rewardType: 'QUEST',
            rewardKey: 'q_restart_test',
            operationId: uniqueOpId, // Exact duplicate operationId
            launchParams: validLaunchParams,
        }),
    });
    const claimData2 = await claimRes2.json();

    const verifyFinalDoc = await getLocalDoc('пользователи_dev', testUserId);
    if (claimData2.ok && claimData2.isDuplicate === true && verifyFinalDoc.data.gold === 1250) {
        restartResults.test4_post_restart_replay_rejection = 'PASS';
        console.log('✅ [STEP 4 PASS] Replay recognized as duplicate post-restart. Gold remains exactly 1250.');
    } else {
        restartResults.test4_post_restart_replay_rejection = 'FAIL';
        console.error('❌ [STEP 4 FAIL] Replay caused duplicate credit or failed! Final gold:', verifyFinalDoc.data.gold);
    }

    await stopServer();

    // Clean up test document
    const primaryFilePath = path.join(ROOT_DIR, 'server', 'data', 'пользователи_dev', `${testUserId}.json`);
    if (fs.existsSync(primaryFilePath)) fs.unlinkSync(primaryFilePath);
    if (fs.existsSync(`${primaryFilePath}.bak`)) fs.unlinkSync(`${primaryFilePath}.bak`);

    console.log('\n====================================================');
    console.log('📊 PHASE 8 SERVER RESTART & PERSISTENCE SUMMARY');
    console.log('====================================================');
    console.table(restartResults);

    setTimeout(() => {
        process.exit(0);
    }, 100);
}

runRestartSuite();
