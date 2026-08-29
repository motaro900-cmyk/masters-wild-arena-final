/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative reward management and idempotent claim verification.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { runAtomicTransaction } from './transactionManager.js';
import { sanitizeDocId } from '../securityMiddleware.js';

// Server-authoritative reward table for rank achievements
const RANK_REWARDS_CONFIG = {
    ВОИН: { crystals: 75, gold: 1000, minRating: 500 },
    ВЕТЕРАН: { crystals: 150, gold: 2500, minRating: 1000 },
    МАСТЕР: { crystals: 300, gold: 5000, minRating: 2000 },
    ГЕРОЙ: { crystals: 500, gold: 7500, minRating: 3000 },
    ЭЛИТА: { crystals: 750, gold: 10000, minRating: 4500 },
    ЧЕМПИОН: { crystals: 1000, gold: 12500, minRating: 6000 },
    ВЛАСТЕЛИН: { crystals: 2000, gold: 25000, minRating: 7500 },
    ЛЕГЕНДА: { crystals: 3000, gold: 50000, minRating: 9000 },
    МИФИЧЕСКИЙ: { crystals: 5000, gold: 100000, minRating: 10000 },
};

// Daily gift rewards per day of streak (1 to 7)
const DAILY_GIFT_CONFIG = {
    1: { gold: 300, crystals: 5 },
    2: { gold: 500, crystals: 10 },
    3: { gold: 800, crystals: 15 },
    4: { gold: 1200, crystals: 20 },
    5: { gold: 1800, crystals: 25 },
    6: { gold: 2500, crystals: 35 },
    7: { gold: 5000, crystals: 50 },
};

export async function handleRewardClaim(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, rewardType, rewardKey, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!operationId) return res.status(400).json({ error: 'Missing operationId idempotency key' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId,
        `reward.${rewardType || 'generic'}`,
        async (profile) => {
            if (!profile.claimedRewards) profile.claimedRewards = [];
            if (!profile.claimedRankRewards) profile.claimedRankRewards = [];
            if (!profile.claimedGifts) profile.claimedGifts = [];

            let goldAward = 0;
            let crystalsAward = 0;
            let expAward = 0;
            let reason = '';

            if (rewardType === 'DAILY_GIFT') {
                const now = Date.now();
                const lastClaim = profile.lastDailyGiftClaimedTime || 0;
                const MSK_OFFSET = 3 * 3600 * 1000;
                const dayNow = Math.floor((now + MSK_OFFSET) / (24 * 3600 * 1000));
                const dayLast = Math.floor((lastClaim + MSK_OFFSET) / (24 * 3600 * 1000));

                if (dayNow <= dayLast) {
                    return { success: false, error: 'Daily gift already claimed today' };
                }

                const streak = ((profile.loginStreak || 0) % 7) + 1;
                const gift = DAILY_GIFT_CONFIG[streak] || DAILY_GIFT_CONFIG[1];
                goldAward = gift.gold;
                crystalsAward = gift.crystals;
                profile.loginStreak = streak;
                profile.lastDailyGiftClaimedTime = now;
                reason = `daily_gift_streak_${streak}`;
            } else if (rewardType === 'RANK_UP') {
                const rankConfig = RANK_REWARDS_CONFIG[rewardKey];
                if (!rankConfig) {
                    return { success: false, error: 'Unknown rank reward key' };
                }
                if (profile.claimedRankRewards.includes(rewardKey)) {
                    return { success: false, error: 'Rank reward already claimed' };
                }
                if ((profile.rating || 0) < rankConfig.minRating) {
                    return { success: false, error: 'Insufficient rating for rank reward' };
                }

                goldAward = rankConfig.gold;
                crystalsAward = rankConfig.crystals;
                profile.claimedRankRewards.push(rewardKey);
                reason = `rank_up_${rewardKey}`;
            } else if (rewardType === 'QUEST') {
                // Fixed quest reward lookup
                goldAward = 250;
                crystalsAward = 5;
                expAward = 100;
                reason = `quest_${rewardKey}`;
            } else if (rewardType === 'SOCIAL_FAVORITE') {
                if (!profile.claimedSocialRewards) profile.claimedSocialRewards = [];
                if (profile.claimedSocialRewards.includes('favorites')) {
                    return { success: false, error: 'Favorite reward already claimed' };
                }
                crystalsAward = 50;
                profile.claimedSocialRewards.push('favorites');
                reason = 'social_favorite_reward';
            } else if (rewardType === 'SOCIAL_GROUP') {
                if (!profile.claimedSocialRewards) profile.claimedSocialRewards = [];
                if (profile.claimedSocialRewards.includes('group')) {
                    return { success: false, error: 'Group membership reward already claimed' };
                }
                crystalsAward = 50;
                profile.claimedSocialRewards.push('group');
                reason = 'social_group_reward';
            } else if (rewardType === 'REFERRAL_GIFT') {
                if (!profile.claimedGifts) profile.claimedGifts = [];
                const giftId = String(rewardKey || '');
                if (!giftId || profile.claimedGifts.includes(giftId)) {
                    return { success: false, error: 'Referral gift already claimed or invalid' };
                }
                goldAward = 5000;
                profile.claimedGifts.push(giftId);
                reason = `referral_gift_${giftId}`;
            } else {
                return { success: false, error: 'Unsupported reward type' };
            }

            const oldGold = profile.gold || 0;
            const oldCrystals = profile.crystals || 0;
            const oldExp = profile.exp || 0;

            profile.gold = oldGold + goldAward;
            profile.crystals = oldCrystals + crystalsAward;
            profile.exp = oldExp + expAward;

            return {
                success: true,
                data: {
                    gold: profile.gold,
                    crystals: profile.crystals,
                    exp: profile.exp,
                    awarded: { gold: goldAward, crystals: crystalsAward, exp: expAward },
                    loginStreak: profile.loginStreak,
                },
                changes: {
                    gold: { oldVal: oldGold, newVal: profile.gold },
                    crystals: { oldVal: oldCrystals, newVal: profile.crystals },
                },
                reason,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}
