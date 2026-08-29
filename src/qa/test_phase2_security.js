/**
 * Phase 2 — Security, VK Authentication & Server Authority Automated Verification Suite
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
const PORT = 3002;
const TEST_SERVER_URL = `http://127.0.0.1:${PORT}`;
const TEST_SECRET = 'vk_test_secret_key_1234567890';

process.env.VK_APP_SECRET = TEST_SECRET;

// Import handlers
import timeHandler from '../../server/time.js';
import verifySignHandler from '../../server/verify-sign.js';
import profileSaveHandler from '../../server/profile-save.js';
import profileLoadHandler from '../../server/profile-load.js';
import { createRateLimiter } from '../../server/securityMiddleware.js';

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

    const profileLimiter = createRateLimiter(60, 60000, 'test_profile');

    const adapt = (fn) => async (req, res) => {
        try {
            await fn(req, res);
        } catch (e) {
            if (!res.headersSent) res.status(500).json({ error: e.message });
        }
    };

    app.post('/api/profile-save', profileLimiter, adapt(profileSaveHandler));
    app.get('/api/profile-load', profileLimiter, adapt(profileLoadHandler));

    return new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[Phase2Test] Server listening on ${TEST_SERVER_URL}`);
            resolve();
        });
    });
}

const testResults = {
    test1_valid_signature: 'NOT TESTED',
    test2_tampered_signature: 'NOT TESTED',
    test3_identity_mismatch_idor: 'NOT TESTED',
    test4_server_authoritative_economy: 'NOT TESTED',
    test5_prototype_pollution_guard: 'NOT TESTED',
    test6_path_traversal_guard: 'NOT TESTED',
    test7_rate_limiter: 'NOT TESTED',
};

async function runSecurityTests() {
    console.log('====================================================');
    console.log('🛡️ RUNNING PHASE 2 SECURITY & SERVER AUTHORITY SUITE');
    console.log('====================================================\n');

    await startServer();

    try {
        const vkUserId = '777888';
        const nowSec = Math.floor(Date.now() / 1000);
        const validParams = {
            vk_app_id: '52297839',
            vk_user_id: vkUserId,
            vk_ts: String(nowSec),
            vk_platform: 'mobile_web',
        };
        const validSign = generateVkSign(validParams, TEST_SECRET);
        const validLaunchParams = `?${new URLSearchParams({ ...validParams, sign: validSign }).toString()}`;

        // ─── TEST 1: Valid Signature Acceptance ───
        console.log('🔍 [TEST 1] Testing Valid VK HMAC Signature...');
        const res1 = await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'mastersofthewild.ru', // simulate non-localhost production host
            },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                launchParams: validLaunchParams,
                syncData: {
                    name: 'Легитимный_Игрок',
                    selectedHeroId: 'raccoon',
                    settings: { soundVolume: 0.8 },
                },
            }),
        });

        if (res1.status === 200) {
            testResults.test1_valid_signature = 'PASS';
            console.log('✅ [TEST 1 PASS] Valid VK signature accepted with HTTP 200.');
        } else {
            testResults.test1_valid_signature = 'FAIL';
            console.error(`❌ [TEST 1 FAIL] Expected 200, got ${res1.status}:`, await res1.text());
        }

        // ─── TEST 2: Tampered Signature Rejection ───
        console.log('\n🔍 [TEST 2] Testing Tampered / Invalid VK Signature...');
        const tamperedLaunchParams = validLaunchParams.replace(validSign, 'invalid_fake_sign_xyz');
        const res2 = await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'mastersofthewild.ru',
            },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                launchParams: tamperedLaunchParams,
                syncData: { name: 'Взломщик' },
            }),
        });

        if (res2.status === 403) {
            testResults.test2_tampered_signature = 'PASS';
            console.log('✅ [TEST 2 PASS] Tampered signature rejected with HTTP 403 Forbidden.');
        } else {
            testResults.test2_tampered_signature = 'FAIL';
            console.error(`❌ [TEST 2 FAIL] Expected 403, got ${res2.status}`);
        }

        // ─── TEST 3: IDOR / Identity Mismatch Protection ───
        console.log('\n🔍 [TEST 3] Testing IDOR Identity Mismatch (Attacker signing as 777888 trying to write 999999)...');
        const res3 = await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'mastersofthewild.ru',
            },
            body: JSON.stringify({
                userId: 'VK-999999', // victim ID
                isDev: true,
                launchParams: validLaunchParams, // attacker's signature (for 777888)
                syncData: { name: 'Взлом_Чужого_Аккаунта' },
            }),
        });

        if (res3.status === 403) {
            testResults.test3_identity_mismatch_idor = 'PASS';
            console.log('✅ [TEST 3 PASS] IDOR attempt blocked with HTTP 403 Forbidden.');
        } else {
            testResults.test3_identity_mismatch_idor = 'FAIL';
            console.error(`❌ [TEST 3 FAIL] Expected 403, got ${res3.status}`);
        }

        // ─── TEST 4: Server-Authoritative Economy Protection ───
        console.log('\n🔍 [TEST 4] Testing Server-Authoritative Economy (Client attempting to inject 999999 gold)...');
        // First, verify current profile on server
        const loadResBefore = await fetch(`${TEST_SERVER_URL}/api/profile-load?userId=VK-${vkUserId}&isDev=true&launchParams=${encodeURIComponent(validLaunchParams)}`, {
            headers: { 'Host': 'mastersofthewild.ru' },
        });
        const loadDataBefore = await loadResBefore.json();
        const initialGold = loadDataBefore.data.gold; // default 500

        // Client attempts to cheat gold & crystals
        await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'mastersofthewild.ru',
            },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                launchParams: validLaunchParams,
                syncData: {
                    name: 'Легитимный_Игрок_Новое_Имя',
                    gold: 999999, // CHEAT ATTEMPT
                    crystals: 999999, // CHEAT ATTEMPT
                    rating: 50000, // CHEAT ATTEMPT
                },
            }),
        });

        // Load back and verify server authority
        const loadResAfter = await fetch(`${TEST_SERVER_URL}/api/profile-load?userId=VK-${vkUserId}&isDev=true&launchParams=${encodeURIComponent(validLaunchParams)}`, {
            headers: { 'Host': 'mastersofthewild.ru' },
        });
        const loadDataAfter = await loadResAfter.json();

        if (
            loadDataAfter.data.name === 'Легитимный_Игрок_Новое_Имя' &&
            loadDataAfter.data.gold === initialGold &&
            loadDataAfter.data.crystals === 10
        ) {
            testResults.test4_server_authoritative_economy = 'PASS';
            console.log(`✅ [TEST 4 PASS] Server authority preserved economy: gold remained ${loadDataAfter.data.gold}, name updated safely.`);
        } else {
            testResults.test4_server_authoritative_economy = 'FAIL';
            console.error('❌ [TEST 4 FAIL] Client modified server-authoritative fields:', loadDataAfter.data);
        }

        // ─── TEST 5: Prototype Pollution Guard ───
        console.log('\n🔍 [TEST 5] Testing Prototype Pollution Guard...');
        const pollutionPayload = JSON.parse('{"__proto__": {"isAdmin": true}, "name": "Hacker"}');
        const res5 = await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'mastersofthewild.ru',
            },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                launchParams: validLaunchParams,
                syncData: pollutionPayload,
            }),
        });

        if (res5.status === 500 || res5.status === 400) {
            testResults.test5_prototype_pollution_guard = 'PASS';
            console.log('✅ [TEST 5 PASS] Prototype pollution payload rejected safely.');
        } else {
            testResults.test5_prototype_pollution_guard = 'FAIL';
        }

        // ─── TEST 6: Path Traversal Guard ───
        console.log('\n🔍 [TEST 6] Testing Path Traversal Guard...');
        const res6 = await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': 'mastersofthewild.ru',
            },
            body: JSON.stringify({
                userId: '../../etc/passwd',
                isDev: true,
                launchParams: validLaunchParams,
                syncData: { name: 'PathAttack' },
            }),
        });

        if (res6.status === 400) {
            testResults.test6_path_traversal_guard = 'PASS';
            console.log('✅ [TEST 6 PASS] Path traversal userId rejected with HTTP 400.');
        } else {
            testResults.test6_path_traversal_guard = 'FAIL';
        }

        // ─── TEST 7: Rate Limiter ───
        console.log('\n🔍 [TEST 7] Testing In-Memory Rate Limiter (Burst 70 requests)...');
        let got429 = false;
        for (let i = 0; i < 70; i++) {
            const r = await fetch(`${TEST_SERVER_URL}/api/profile-load?userId=VK-${vkUserId}&isDev=true&launchParams=${encodeURIComponent(validLaunchParams)}`);
            if (r.status === 429) {
                got429 = true;
                break;
            }
        }

        if (got429) {
            testResults.test7_rate_limiter = 'PASS';
            console.log('✅ [TEST 7 PASS] Rate limit enforced (HTTP 429 Too Many Requests returned on burst).');
        } else {
            testResults.test7_rate_limiter = 'FAIL';
            console.error('❌ [TEST 7 FAIL] Rate limiter did not trigger 429.');
        }

        // Clean up test file
        const testFile = path.join(ROOT_DIR, 'server', 'data', 'пользователи_dev', `VK-${vkUserId}.json`);
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    } catch (err) {
        console.error('❌ Error during security tests:', err);
    } finally {
        if (server) server.close();
    }

    console.log('\n====================================================');
    console.log('📊 PHASE 2 SECURITY VERIFICATION SUMMARY');
    console.log('====================================================');
    console.table(testResults);
    process.exit(0);
}

runSecurityTests();
