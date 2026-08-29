/**
 * @owner: @Motaro900 / Backend Architecture Team
 * @purpose: Server-authoritative Daily Gift and Fortune Wheel claiming system with MSK calendar reset and atomic mutex transactions.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { sanitizeDocId } from '../securityMiddleware.js';
import { runAtomicTransaction } from './transactionManager.js';

// Canonical Daily Gift Rewards Table (Day 1 - 7)
export const DAILY_GIFT_TABLE = [
    { day: 1, gold: 500, crystals: 0, energy: 0 },
    { day: 2, gold: 0, crystals: 15, energy: 0 },
    { day: 3, gold: 1000, crystals: 0, energy: 0 },
    { day: 4, gold: 0, crystals: 0, energy: 30 },
    { day: 5, gold: 2000, crystals: 0, energy: 0 },
    { day: 6, gold: 0, crystals: 30, energy: 0 },
    { day: 7, gold: 5000, crystals: 50, energy: 50 },
];

// Canonical Fortune Wheel Sectors
export const WHEEL_SECTORS = [
    { sector: 0, type: 'GOLD', amount: 500 },
    { sector: 1, type: 'CRYSTAL', amount: 10 },
    { sector: 2, type: 'ENERGY', amount: 20 },
    { sector: 3, type: 'GOLD', amount: 1500 },
    { sector: 4, type: 'CRYSTAL', amount: 25 },
    { sector: 5, type: 'ENERGY', amount: 50 },
    { sector: 6, type: 'GOLD', amount: 3000 },
    { sector: 7, type: 'CRYSTAL', amount: 50 },
];

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function handleDailyGiftClaim(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, double = false, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `daily_gift_${Date.now()}`,
        'daily_gift.claim',
        async (profile) => {
            const nowMs = Date.now();
            const currentMSKDay = Math.floor((nowMs + MSK_OFFSET_MS) / DAY_MS);
            const lastClaimTime = profile.lastDailyGiftClaimedTime || 0;
            const lastClaimMSKDay = lastClaimTime > 0 ? Math.floor((lastClaimTime + MSK_OFFSET_MS) / DAY_MS) : -1;

            if (currentMSKDay === lastClaimMSKDay) {
                return { success: false, error: 'Подарок за сегодня уже получен' };
            }

            let streak = 1;
            if (lastClaimMSKDay !== -1) {
                if (currentMSKDay === lastClaimMSKDay + 1) {
                    streak = ((profile.loginStreak || 0) % 7) + 1;
                } else {
                    streak = 1; // Streak broken
                }
            }

            const giftDef = DAILY_GIFT_TABLE[streak - 1] || DAILY_GIFT_TABLE[0];
            const multiplier = double === true ? 2 : 1;

            const goldReward = (giftDef.gold || 0) * multiplier;
            const crystalsReward = (giftDef.crystals || 0) * multiplier;
            const energyReward = (giftDef.energy || 0) * multiplier;

            const oldGold = profile.gold || 0;
            const oldCrystals = profile.crystals || 0;
            const oldEnergy = profile.energy || 0;

            profile.gold = oldGold + goldReward;
            profile.crystals = oldCrystals + crystalsReward;
            profile.energy = oldEnergy + energyReward;
            profile.loginStreak = streak;
            profile.lastDailyGiftClaimedTime = nowMs;

            return {
                success: true,
                data: {
                    streak,
                    awarded: { gold: goldReward, crystals: crystalsReward, energy: energyReward },
                    gold: profile.gold,
                    crystals: profile.crystals,
                    energy: profile.energy,
                    lastDailyGiftClaimedTime: nowMs,
                },
                changes: {
                    gold: { oldVal: oldGold, newVal: profile.gold },
                    crystals: { oldVal: oldCrystals, newVal: profile.crystals },
                    energy: { oldVal: oldEnergy, newVal: profile.energy },
                },
                reason: `daily_gift_day_${streak}_x${multiplier}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}

export async function handleWheelSpin(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `wheel_spin_${Date.now()}`,
        'wheel.spin',
        async (profile) => {
            const nowMs = Date.now();
            const lastSpinTime = profile.lastWheelSpinTime || 0;
            const diffSeconds = (nowMs - lastSpinTime) / 1000;

            if (diffSeconds < 24 * 3600) {
                const waitSeconds = Math.ceil(24 * 3600 - diffSeconds);
                return { success: false, error: `Колесо фортуны перезаряжается. Подождите ${waitSeconds} сек.` };
            }

            // Server-authoritative random sector selection
            const chosenSectorIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
            const wonSector = WHEEL_SECTORS[chosenSectorIndex];

            const oldGold = profile.gold || 0;
            const oldCrystals = profile.crystals || 0;
            const oldEnergy = profile.energy || 0;

            if (wonSector.type === 'GOLD') {
                profile.gold = oldGold + wonSector.amount;
            } else if (wonSector.type === 'CRYSTAL') {
                profile.crystals = oldCrystals + wonSector.amount;
            } else if (wonSector.type === 'ENERGY') {
                profile.energy = oldEnergy + wonSector.amount;
            }

            profile.lastWheelSpinTime = nowMs;

            return {
                success: true,
                data: {
                    sectorIndex: chosenSectorIndex,
                    reward: wonSector,
                    gold: profile.gold,
                    crystals: profile.crystals,
                    energy: profile.energy,
                    lastWheelSpinTime: nowMs,
                },
                changes: {
                    gold: { oldVal: oldGold, newVal: profile.gold },
                    crystals: { oldVal: oldCrystals, newVal: profile.crystals },
                    energy: { oldVal: oldEnergy, newVal: profile.energy },
                },
                reason: `wheel_sector_${chosenSectorIndex}_${wonSector.type}_${wonSector.amount}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}
