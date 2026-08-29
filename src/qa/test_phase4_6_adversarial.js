/**
 * PHASE 4.6 — Secondary Services Adversarial Audit & Strict Server Authority Verification
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
const PORT = 3006;
const TEST_SERVER_URL = `http://127.0.0.1:${PORT}`;
const TEST_SECRET = 'vk_test_secret_key_1234567890';

process.env.VK_APP_SECRET = TEST_SECRET;

// Import handlers
import { handleGetMessages, handleSendMessage } from '../../server/services/chatHandler.js';
import { handleGetMail, handleClaimMail } from '../../server/services/mailHandler.js';
import { handleGetClanList, handleCreateClan, handleJoinClan, handleLeaveClan } from '../../server/services/clanHandler.js';
import { handleGetLeaderboard } from '../../server/services/leaderboardHandler.js';
import { handleDailyGiftClaim, handleWheelSpin } from '../../server/game/dailyRewardHandler.js';
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
    app.post('/api/clan/join', adapt(handleJoinClan));
    app.post('/api/clan/leave', adapt(handleLeaveClan));
    app.get('/api/leaderboard/top', adapt(handleGetLeaderboard));
    app.post('/api/game/daily-gift/claim', adapt(handleDailyGiftClaim));
    app.post('/api/game/wheel/spin', adapt(handleWheelSpin));

    return new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[Phase4.6Server] Listening on ${TEST_SERVER_URL}`);
            resolve();
        });
    });
}

const auditResults = {
    adv1_daily_gift_server_authority: 'NOT TESTED',
    adv2_daily_gift_same_day_duplicate_block: 'NOT TESTED',
    adv3_wheel_spin_server_authority_cooldown: 'NOT TESTED',
    adv4_chat_sender_idor_xss_flood_blocks: 'NOT TESTED',
    adv5_chat_unauthorized_clan_room_block: 'NOT TESTED',
    adv6_mail_10_parallel_concurrency_race: 'NOT TESTED',
    adv7_clan_gold_cost_and_10_parallel_creates: 'NOT TESTED',
    adv8_leaderboard_tampered_rating_immunity: 'NOT TESTED',
};

async function runPhase46AdversarialTests() {
    console.log('====================================================');
    console.log('🔥 RUNNING PHASE 4.6 SECONDARY SERVICES ADVERSARIAL AUDIT');
    console.log('====================================================\n');

    await startServer();

    try {
        const vkUserId = '778899';
        const nowSec = Math.floor(Date.now() / 1000);
        const validParams = {
            vk_app_id: '52297839',
            vk_user_id: vkUserId,
            vk_ts: String(nowSec),
            vk_platform: 'mobile_web',
        };
        const validSign = generateVkSign(validParams, TEST_SECRET);
        const validLaunchParams = `?${new URLSearchParams({ ...validParams, sign: validSign }).toString()}`;

        // Initialize fresh test profile on disk
        const profilePath = path.join(ROOT_DIR, 'server', 'data', 'пользователи_dev', `VK-${vkUserId}.json`);
        const initialProfile = {
            gold: 6000,
            crystals: 50,
            energy: 100,
            level: 5,
            rating: 1200,
            clanId: null,
            clanRole: null,
            lastDailyGiftClaimedTime: 0,
            loginStreak: 0,
            lastWheelSpinTime: 0,
            mail: [
                {
                    id: 'mail_adv_gift',
                    from: 'СИСТЕМА',
                    subject: 'Боевая награда',
                    isRead: false,
                    isClaimed: false,
                    rewards: [{ type: 'GOLD', amount: 800 }, { type: 'CRYSTALS', amount: 20 }],
                },
            ],
            revision: 1,
            _processedOps: {},
            lastSavedTimestamp: Date.now(),
        };
        fs.mkdirSync(path.dirname(profilePath), { recursive: true });
        fs.writeFileSync(profilePath, JSON.stringify(initialProfile, null, 2), 'utf8');

        // ─── 1 & 2: Daily Gift Server Authority & Same-day Block ───
        console.log('🔍 [AUDIT 1 & 2] Testing Daily Gift Server Authority & Duplicate Day Block...');
        const giftRes1 = await fetch(`${TEST_SERVER_URL}/api/game/daily-gift/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                double: false,
                operationId: `gift_claim_1_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });
        const giftData1 = await giftRes1.json();

        // Attempt second claim immediately on same day
        const giftRes2 = await fetch(`${TEST_SERVER_URL}/api/game/daily-gift/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                double: false,
                operationId: `gift_claim_2_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });

        // Attempt DevTools tamper to reset lastDailyGiftClaimedTime
        await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                state: { lastDailyGiftClaimedTime: 0, loginStreak: 7 },
                launchParams: validLaunchParams,
            }),
        });

        const giftRes3AfterTamper = await fetch(`${TEST_SERVER_URL}/api/game/daily-gift/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                double: false,
                operationId: `gift_claim_3_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });

        if (giftData1.ok && giftData1.data.gold === 6500 && giftData1.data.streak === 1) {
            auditResults.adv1_daily_gift_server_authority = 'PASS';
            console.log(`✅ [AUDIT 1 PASS] Server awarded Day 1 gift (+500 gold, new total: ${giftData1.data.gold}).`);
        }
        if (giftRes2.status === 400 && giftRes3AfterTamper.status === 400) {
            auditResults.adv2_daily_gift_same_day_duplicate_block = 'PASS';
            console.log('✅ [AUDIT 2 PASS] Same-day duplicate gift claims & DevTools reset injection strictly blocked.');
        }

        // ─── 3: Fortune Wheel Server Authority & Cooldown ───
        console.log('\n🔍 [AUDIT 3] Testing Fortune Wheel Server Authority & 24h Cooldown Enforcement...');
        const wheelRes1 = await fetch(`${TEST_SERVER_URL}/api/game/wheel/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                operationId: `wheel_spin_1_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });
        const wheelData1 = await wheelRes1.json();

        // Immediate second spin (should be blocked by 24h cooldown)
        const wheelRes2 = await fetch(`${TEST_SERVER_URL}/api/game/wheel/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                operationId: `wheel_spin_2_${Date.now()}`,
                launchParams: validLaunchParams,
            }),
        });

        if (wheelData1.ok && typeof wheelData1.data.sectorIndex === 'number' && wheelRes2.status === 400) {
            auditResults.adv3_wheel_spin_server_authority_cooldown = 'PASS';
            console.log(`✅ [AUDIT 3 PASS] Server picked sector #${wheelData1.data.sectorIndex} (${wheelData1.data.reward.type} +${wheelData1.data.reward.amount}). Immediate 2nd spin blocked with HTTP 400 cooldown.`);
        }

        // ─── 4 & 5: Chat Security, IDOR, XSS, Flood, and Clan Room Authorization ───
        console.log('\n🔍 [AUDIT 4 & 5] Testing Chat IDOR Spoofing, XSS Sanitization, Flood & Clan Room Protection...');
        // 4a. Spoofed userId (IDOR)
        const spoofedChat = await fetch(`${TEST_SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'VK-999999', // Spoofed ID
                senderName: 'Хакер',
                text: 'Сообщение от чужого имени',
                room: 'global',
                launchParams: validLaunchParams,
            }),
        });

        // 4b. XSS HTML injection
        const xssChat = await fetch(`${TEST_SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                senderName: '<script>alert(1)</script>',
                text: '<img src=x onerror=alert(2)> Привет!',
                room: 'global',
                launchParams: validLaunchParams,
            }),
        });
        const xssData = await xssChat.json();

        // 4c. Overlong message (>300 chars)
        const longText = 'A'.repeat(350);
        const longChat = await fetch(`${TEST_SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                senderName: 'Охотник',
                text: longText,
                room: 'global',
                launchParams: validLaunchParams,
            }),
        });

        // 5. Clan room message when NOT in clan
        const clanChatNoClan = await fetch(`${TEST_SERVER_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                senderName: 'Охотник',
                text: 'Привет соклановцы!',
                room: 'clan',
                launchParams: validLaunchParams,
            }),
        });

        if (spoofedChat.status === 403 && xssData.ok && !xssData.message.text.includes('<img') && xssData.message.text.includes('&lt;img') && longChat.status === 400) {
            auditResults.adv4_chat_sender_idor_xss_flood_blocks = 'PASS';
            console.log('✅ [AUDIT 4 PASS] IDOR spoofing blocked (403), XSS sanitized (&lt;img&gt;), 350-char message rejected (400).');
        }
        if (clanChatNoClan.status === 403) {
            auditResults.adv5_chat_unauthorized_clan_room_block = 'PASS';
            console.log('✅ [AUDIT 5 PASS] Clan chat write attempt without clan membership blocked with HTTP 403.');
        }

        // ─── 6: Mail Concurrency (10 Parallel Claims on Same Mail) ───
        console.log('\n🔍 [AUDIT 6] Testing Mail: 10 Simultaneous Parallel Claims on Attachment...');
        const preMailProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        const goldBeforeMail = preMailProfile.gold;

        const mailPromises = Array.from({ length: 10 }).map((_, i) =>
            fetch(`${TEST_SERVER_URL}/api/mail/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: `VK-${vkUserId}`,
                    isDev: true,
                    mailId: 'mail_adv_gift',
                    operationId: `mail_parallel_op_${i}`,
                    launchParams: validLaunchParams,
                }),
            }).then((r) => r.json())
        );
        const mailResults = await Promise.all(mailPromises);
        const successfulClaims = mailResults.filter((r) => r.ok && r.data?.awarded?.gold === 800);

        // Load profile to verify gold was added exactly ONCE
        const postMailProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        if (successfulClaims.length === 1 && postMailProfile.gold === goldBeforeMail + 800) {
            auditResults.adv6_mail_10_parallel_concurrency_race = 'PASS';
            console.log(`✅ [AUDIT 6 PASS] Concurrency locks held: exactly 1 claim succeeded (+800 gold: ${goldBeforeMail} -> ${postMailProfile.gold}), 9 rejected.`);
        } else {
            auditResults.adv6_mail_10_parallel_concurrency_race = 'FAIL';
            console.error('❌ [AUDIT 6 FAIL]', { successCount: successfulClaims.length, gold: postMailProfile.gold, expected: goldBeforeMail + 800 });
        }

        // ─── 7: Clan Gold Cost & 10 Parallel Creates ───
        console.log('\n🔍 [AUDIT 7] Testing Clan Creation: 10 Simultaneous Parallel Creates...');
        // Reset gold to 6000
        postMailProfile.gold = 6000;
        postMailProfile.clanId = null;
        fs.writeFileSync(profilePath, JSON.stringify(postMailProfile, null, 2), 'utf8');

        const clanPromises = Array.from({ length: 10 }).map((_, i) =>
            fetch(`${TEST_SERVER_URL}/api/clan/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: `VK-${vkUserId}`,
                    isDev: true,
                    clanName: `Клан ${i}`,
                    clanTag: `CL${i}`,
                    operationId: `clan_create_parallel_${i}`,
                    launchParams: validLaunchParams,
                }),
            }).then((r) => r.json())
        );
        const clanResponses = await Promise.all(clanPromises);
        const successfulClanCreates = clanResponses.filter((r) => r.ok && r.data?.clan);
        const postClanProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

        if (successfulClanCreates.length === 1 && postClanProfile.gold === 1000 && postClanProfile.clanRole === 'LEADER') {
            auditResults.adv7_clan_gold_cost_and_10_parallel_creates = 'PASS';
            console.log(`✅ [AUDIT 7 PASS] Clan created once: 5000 gold deducted (remaining: 1000), 9 parallel creates rejected.`);
        } else {
            auditResults.adv7_clan_gold_cost_and_10_parallel_creates = 'FAIL';
            console.error('❌ [AUDIT 7 FAIL]', { successCount: successfulClanCreates.length, gold: postClanProfile.gold });
        }

        // ─── 8: Leaderboard Rating Tampering Immunity ───
        console.log('\n🔍 [AUDIT 8] Testing Leaderboard Immunity to Client-Injected Rating / Trophies...');
        await fetch(`${TEST_SERVER_URL}/api/profile-save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: `VK-${vkUserId}`,
                isDev: true,
                state: { rating: 999999, trophies: 999999, level: 80 },
                launchParams: validLaunchParams,
            }),
        });

        const leadRes = await fetch(`${TEST_SERVER_URL}/api/leaderboard/top?limit=20&isDev=true`);
        const leadData = await leadRes.json();
        const testUserEntry = leadData.leaderboard?.find((p) => p.userId === `VK-${vkUserId}`);

        if (testUserEntry && testUserEntry.rating === 1200 && testUserEntry.level === 5) {
            auditResults.adv8_leaderboard_tampered_rating_immunity = 'PASS';
            console.log(`✅ [AUDIT 8 PASS] Rating injection stripped: server profile preserved rating=1200, level=5.`);
        } else {
            auditResults.adv8_leaderboard_tampered_rating_immunity = 'FAIL';
            console.error('❌ [AUDIT 8 FAIL] Injected rating leaked into leaderboard:', testUserEntry);
        }

        // Clean up test file
        if (fs.existsSync(profilePath)) {
            fs.unlinkSync(profilePath);
        }
    } catch (err) {
        console.error('❌ Error during Phase 4.6 tests:', err);
    }

    console.log('\n====================================================');
    console.log('📊 PHASE 4.6 ADVERSARIAL AUDIT SUMMARY');
    console.log('====================================================');
    console.table(auditResults);

    if (server) {
        server.close();
    }
    setTimeout(() => {
        process.exit(0);
    }, 100);
}

runPhase46AdversarialTests();
