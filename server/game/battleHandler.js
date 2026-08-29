/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative battle sessions, combat validation, and reward resolution.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { runAtomicTransaction } from './transactionManager.js';
import { sanitizeDocId } from '../securityMiddleware.js';
import { calculateServerEnergy } from './energyHandler.js';

import { calculateHeroCombatStats, simulateDeterministicBattle } from './battleSimulation.js';

// In-memory active battle sessions table
const activeBattleSessions = new Map();

const BATTLE_ENERGY_COST = 10;

/**
 * Cups calculation formula matching game design
 */
function calculateRatingChange(playerRating, opponentRating, won) {
    const diff = (opponentRating || 1000) - (playerRating || 1000);
    const isWeakOpponent = diff < 0;

    if (playerRating < 1000) {
        return won ? (isWeakOpponent ? 70 : 100) : 0;
    } else if (playerRating < 3000) {
        return won ? (isWeakOpponent ? 40 : 60) : -5;
    } else {
        return won ? 30 : -15;
    }
}

export async function handleBattleStart(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, mode = 'RANKED', heroId = 'panda', opponentId, opponentRating = 1000, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const battleId = `battle_${cleanId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const oppRating = parseInt(opponentRating, 10) || 1000;
    let sessionData = null;

    // Deduct energy atomically and snapshot hero stats
    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        `energy_for_${battleId}`,
        'battle.start',
        async (profile) => {
            const calculated = calculateServerEnergy(profile, Date.now());
            if (calculated.energy < BATTLE_ENERGY_COST) {
                return { success: false, error: 'Insufficient energy to start battle' };
            }

            profile.energy = calculated.energy - BATTLE_ENERGY_COST;
            profile.lastEnergyUpdate = calculated.lastEnergyUpdate;

            const playerEquipment = (profile.heroEquipment && profile.heroEquipment[heroId]) || {};
            const playerStats = calculateHeroCombatStats({ id: heroId }, profile.level || 1, playerEquipment, profile.inventory || []);

            // Generate opponent stats scaled by rating
            const oppLevel = Math.max(1, Math.floor(oppRating / 200));
            const enemyStats = {
                attack: 20 + oppLevel * 4,
                defense: 10 + oppLevel * 3,
                hp: 180 + oppLevel * 25,
                speed: 10 + Math.min(5, Math.floor(oppLevel / 2)),
                critChance: 0.05,
            };

            sessionData = {
                battleId,
                userId: cleanId,
                heroId,
                opponentId,
                opponentRating: oppRating,
                playerStats,
                enemyStats,
                mode,
                startedAt: Date.now(),
                seed: Math.floor(Math.random() * 1000000),
            };

            return {
                success: true,
                data: { energy: profile.energy, seed: sessionData.seed },
                changes: { energy: { oldVal: calculated.energy, newVal: profile.energy } },
                reason: `battle_start_${battleId}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });

    activeBattleSessions.set(battleId, sessionData);

    // Expire session after 10 minutes
    setTimeout(() => {
        activeBattleSessions.delete(battleId);
    }, 10 * 60 * 1000);

    return res.status(200).json({
        ok: true,
        battleId,
        seed: sessionData.seed,
        energyRemaining: result.data.energy,
    });
}

export async function handleBattleFinish(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, battleId, won, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!battleId) return res.status(400).json({ error: 'Missing battleId' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const session = activeBattleSessions.get(battleId);
    if (!session && !operationId) {
        return res.status(400).json({ error: 'Invalid or expired battle session' });
    }

    const opponentRating = session ? session.opponentRating : 1000;
    
    // Run deterministic combat simulation on the server
    let isAttackerWinner = false;
    let simStats = null;
    if (session && session.playerStats && session.enemyStats) {
        simStats = simulateDeterministicBattle(session.playerStats, session.enemyStats, session.seed);
        isAttackerWinner = simStats.winner === 'player';

        if (Boolean(won) && !isAttackerWinner) {
            console.warn(`[BattleHandler] Anti-cheat triggered: client claimed victory for battleId=${battleId}, but server simulation determined defeat! Overriding to defeat.`);
        }
    } else {
        isAttackerWinner = Boolean(won);
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `finish_${battleId}`,
        'battle.finish',
        async (profile) => {
            const playerLevel = profile.level || 1;
            const isVip = profile.vipLevel > 0 && (profile.vipEndTime || 0) > Date.now();

            // Calculate server rewards
            const baseGold = isAttackerWinner ? 100 + playerLevel * 5 : 30;
            const goldAward = Math.floor(baseGold * (isVip ? 1.15 : 1.0));
            const expAward = isAttackerWinner ? 150 + playerLevel * 4 : 50;
            const ratingChange = calculateRatingChange(profile.rating || 1000, opponentRating, isAttackerWinner);

            const oldGold = profile.gold || 0;
            const oldExp = profile.exp || 0;
            const oldRating = profile.rating || 1000;

            profile.gold = oldGold + goldAward;
            profile.exp = oldExp + expAward;
            profile.rating = Math.max(0, oldRating + ratingChange);
            profile.trophies = profile.rating;
            profile.totalBattles = (profile.totalBattles || 0) + 1;
            if (isAttackerWinner) {
                profile.wins = (profile.wins || 0) + 1;
                profile.winStreak = (profile.winStreak || 0) + 1;
                profile.lossStreak = 0;
            } else {
                profile.lossStreak = (profile.lossStreak || 0) + 1;
                profile.winStreak = 0;
            }

            // Remove consumed session
            activeBattleSessions.delete(battleId);

            return {
                success: true,
                data: {
                    won: isAttackerWinner,
                    goldEarned: goldAward,
                    expEarned: expAward,
                    ratingChange,
                    totalRating: profile.rating,
                    totalGold: profile.gold,
                    totalExp: profile.exp,
                    winStreak: profile.winStreak,
                    simulation: simStats,
                },
                changes: {
                    gold: { oldVal: oldGold, newVal: profile.gold },
                    rating: { oldVal: oldRating, newVal: profile.rating },
                },
                reason: `battle_finish_${battleId}_${isAttackerWinner ? 'win' : 'loss'}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json({ ok: true, isDuplicate: result.isDuplicate, data: result.data });
}
