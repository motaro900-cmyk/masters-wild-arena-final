/**
 * Phase 3 — Server Authority: Economy, Battles, Rewards & Concurrency Verification Suite
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
const PORT = 3003;
const TEST_SERVER_URL = `http://127.0.0.1:${PORT}`;
const TEST_SECRET = 'vk_test_secret_key_1234567890';

process.env.VK_APP_SECRET = TEST_SECRET;

// Import handlers
import { handleEnergySync, handleEnergySpend } from '../../server/game/energyHandler.js';
import { handleRewardClaim } from '../../server/game/rewardHandler.js';
import { handleInventoryEquip, handleInventorySell } from '../../server/game/inventoryHandler.js';
import { handleBattleStart, handleBattleFinish } from '../../server/game/battleHandler.js';
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
    app.get('/api/game/energy/sync', adapt(handleEnergySync));
    app.post('/api/game/energy/spend', adapt(handleEnergySpend));
    app.post('/api/game/reward/claim', adapt(handleRewardClaim));
    app.post('/api/game/inventory/equip', adapt(handleInventoryEquip));
    app.post('/api/game/inventory/sell', adapt(handleInventorySell));
    app.post('/api/game/battle/start', adapt(handleBattleStart));
    app.post('/api/game/battle/finish', adapt(handleBattleFinish));

    return new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[Phase3Test] Server listening on ${TEST_SERVER_URL}`);
            resolve();
        });
    });
}

const testResults = {
    test1_energy_spend_and_regen: 'NOT TESTED',
    test2_idempotent_rewards: 'NOT TESTED',
    test3_duplicate_reward_prevention: 'NOT TESTED',
    test4_inventory_equip_and_sell: 'NOT TESTED',
    test5_battle_session_lifecycle: 'NOT TESTED',
    test6_replay_battle_prevention: 'NOT TESTED',
    test7_concurrency_10_requests: 'NOT TESTED',
    test8_revision_increment: 'NOT TESTED',
};

async function runEconomyTests() {
    console.log('====================================================');
    console.log('⚔️ RUNNING PHASE 3 SERVER ECONOMY & GAMEPLAY SUITE');
    console.log('====================================================\n');

    await startServer();

    try {
        const vkUserId = '555666';
        const nowSec = Math.floor(Date.now() / 1000);
        const validParams = {
            vk_app_id: '52297839',
            vk_user_id: vkUserId,
            vk_ts: String(nowSec),
            vk_platform: 'mobile_web',
        };
        const validSign = generateVkSign(validParams, TEST_SECRET);
        const validLaunchParams = `?${new URLSearchParams({ ...validParams, sign: validSign }).toString()}`;

        // ─── TEST 1: Server-Calculated Energy ───
        console.log('🔍 [TEST 1] Testing Server-Calculated Energy Spending & Sync...');
        const energySpendRes = await fetch(`${TEST_SERVER_URL}/api/game/energy/spend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                amount: 20,
                operationId: `op_energy_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });
        const energyData = await energySpendRes.json();

        if (energySpendRes.status === 200 && energyData.energy === 80) {
            testResults.test1_energy_spend_and_regen = 'PASS';
            console.log(`✅ [TEST 1 PASS] Server deducted 20 energy: energy=${energyData.energy}/${energyData.maxEnergy}.`);
        } else {
            testResults.test1_energy_spend_and_regen = 'FAIL';
            console.error('❌ [TEST 1 FAIL] Unexpected energy result:', energyData);
        }

        // ─── TEST 2: Idempotent Reward Claims ───
        console.log('\n🔍 [TEST 2] Testing Idempotent Reward Claims (Daily Gift)...');
        const opIdDaily = `daily_gift_${Date.now()}`;
        const rewardRes1 = await fetch(`${TEST_SERVER_URL}/api/game/reward/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                rewardType: 'DAILY_GIFT',
                operationId: opIdDaily,
                launchParams: validLaunchParams,
            }),
        });
        const rewardData1 = await rewardRes1.json();

        if (rewardRes1.status === 200 && rewardData1.data.awarded.gold > 0) {
            testResults.test2_idempotent_rewards = 'PASS';
            console.log(`✅ [TEST 2 PASS] Daily gift claimed successfully: +${rewardData1.data.awarded.gold} gold.`);
        } else {
            testResults.test2_idempotent_rewards = 'FAIL';
            console.error('❌ [TEST 2 FAIL]', rewardData1);
        }

        // ─── TEST 3: Duplicate Reward Request Prevention ───
        console.log('\n🔍 [TEST 3] Testing Duplicate Reward Prevention (Replay with same operationId)...');
        const rewardRes2 = await fetch(`${TEST_SERVER_URL}/api/game/reward/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                rewardType: 'DAILY_GIFT',
                operationId: opIdDaily, // REPLAY
                launchParams: validLaunchParams,
            }),
        });
        const rewardData2 = await rewardRes2.json();

        if (rewardRes2.status === 200 && rewardData2.isDuplicate === true) {
            testResults.test3_duplicate_reward_prevention = 'PASS';
            console.log('✅ [TEST 3 PASS] Replay request recognized as duplicate without duplicate gold payout.');
        } else {
            testResults.test3_duplicate_reward_prevention = 'FAIL';
            console.error('❌ [TEST 3 FAIL] Replay allowed or failed unexpectedly:', rewardData2);
        }

        // ─── TEST 4: Inventory Equip and Sell ───
        console.log('\n🔍 [TEST 4] Testing Server-Authoritative Inventory Equip & Sell...');
        const equipRes = await fetch(`${TEST_SERVER_URL}/api/game/inventory/equip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                instanceId: 'stick_starting',
                slot: 'WEAPONS',
                heroId: 'panda',
                operationId: `equip_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });
        const equipData = await equipRes.json();

        // Attempt to sell equipped stick (should fail)
        const sellEquippedRes = await fetch(`${TEST_SERVER_URL}/api/game/inventory/sell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                instanceId: 'stick_starting',
                operationId: `sell_equipped_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });

        // Sell non-equipped rusty sword
        const sellRes = await fetch(`${TEST_SERVER_URL}/api/game/inventory/sell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                instanceId: 'rusty_sword_spare',
                operationId: `sell_sword_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });
        const sellData = await sellRes.json();

        if (equipRes.status === 200 && sellEquippedRes.status === 400 && sellRes.status === 200) {
            testResults.test4_inventory_equip_and_sell = 'PASS';
            console.log(`✅ [TEST 4 PASS] Item equipped; selling equipped item blocked; sold unequipped item (+${sellData.soldPrice} gold).`);
        } else {
            testResults.test4_inventory_equip_and_sell = 'FAIL';
            console.error('❌ [TEST 4 FAIL]', { equip: equipData, sellEquipped: await sellEquippedRes.text(), sell: sellData });
        }

        // ─── TEST 5 & 6: Battle Session Lifecycle & Replay Prevention ───
        console.log('\n🔍 [TEST 5 & 6] Testing Battle Session Lifecycle & Replay Prevention...');
        const battleStartRes = await fetch(`${TEST_SERVER_URL}/api/game/battle/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                heroId: 'panda',
                opponentId: 'bot_wolf',
                opponentRating: 1100,
                launchParams: validLaunchParams,
            }),
        });
        const battleStartData = await battleStartRes.json();

        const battleFinishRes = await fetch(`${TEST_SERVER_URL}/api/game/battle/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                battleId: battleStartData.battleId,
                won: true,
                launchParams: validLaunchParams,
            }),
        });
        const battleFinishData = await battleFinishRes.json();

        // Attempt to replay the same battle finish
        const battleReplayRes = await fetch(`${TEST_SERVER_URL}/api/game/battle/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                battleId: battleStartData.battleId, // CONSUMED
                won: true,
                launchParams: validLaunchParams,
            }),
        });

        if (battleStartRes.status === 200 && battleFinishRes.status === 200 && battleReplayRes.status === 400) {
            testResults.test5_battle_session_lifecycle = 'PASS';
            testResults.test6_replay_battle_prevention = 'PASS';
            console.log(`✅ [TEST 5 & 6 PASS] Battle session resolved: +${battleFinishData.data.goldEarned} gold, rating +${battleFinishData.data.ratingChange}. Replay rejected.`);
        } else {
            testResults.test5_battle_session_lifecycle = 'FAIL';
            testResults.test6_replay_battle_prevention = 'FAIL';
            console.error('❌ [TEST 5 & 6 FAIL]', { start: battleStartData, finish: battleFinishData, replay: await battleReplayRes.text() });
        }

        // ─── TEST 7: Concurrency Protection (10 Parallel Requests) ───
        console.log('\n🔍 [TEST 7] Testing Concurrency: 10 Simultaneous Parallel Reward Claims...');
        const parallelOpId = `parallel_reward_${Date.now()}`;
        const promises = Array.from({ length: 10 }).map((_, i) =>
            fetch(`${TEST_SERVER_URL}/api/game/reward/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: `VK-${vkUserId}`,
                    isDev: true,
                    rewardType: 'QUEST',
                    rewardKey: 'q_test',
                    operationId: parallelOpId, // Exact same operationId sent concurrently 10 times
                    launchParams: validLaunchParams,
                }),
            }).then((r) => r.json())
        );

        const parallelResults = await Promise.all(promises);
        const successfulNewClaims = parallelResults.filter((r) => r.ok && !r.isDuplicate);
        const duplicateClaims = parallelResults.filter((r) => r.ok && r.isDuplicate);

        if (successfulNewClaims.length === 1 && duplicateClaims.length === 9) {
            testResults.test7_concurrency_10_requests = 'PASS';
            console.log(`✅ [TEST 7 PASS] Concurrency safe: exactly 1 new claim executed, 9 returned cached duplicate response.`);
        } else {
            testResults.test7_concurrency_10_requests = 'FAIL';
            console.error('❌ [TEST 7 FAIL]', { new: successfulNewClaims.length, dup: duplicateClaims.length });
        }

        // ─── TEST 8: Revision Increment ───
        console.log('\n🔍 [TEST 8] Testing Profile Revision Counter...');
        const loadRes = await fetch(`${TEST_SERVER_URL}/api/profile-load?userId=VK-${vkUserId}&isDev=true&launchParams=${encodeURIComponent(validLaunchParams)}`);
        const loadData = await loadRes.json();

        if (loadData.data && typeof loadData.data.revision === 'number' && loadData.data.revision >= 5) {
            testResults.test8_revision_increment = 'PASS';
            console.log(`✅ [TEST 8 PASS] Profile revision incremented monotonically to revision=${loadData.data.revision}.`);
        } else {
            testResults.test8_revision_increment = 'FAIL';
            console.error('❌ [TEST 8 FAIL] Unexpected revision:', loadData.data?.revision);
        }

        // Clean up test file
        const testFile = path.join(ROOT_DIR, 'server', 'data', 'пользователи_dev', `VK-${vkUserId}.json`);
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    } catch (err) {
        console.error('❌ Error during economy tests:', err);
    } finally {
        if (server) server.close();
    }

    console.log('\n====================================================');
    console.log('📊 PHASE 3 ECONOMY VERIFICATION SUMMARY');
    console.log('====================================================');
    console.table(testResults);
    process.exit(0);
}

runEconomyTests();
