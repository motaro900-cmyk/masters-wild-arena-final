/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative energy management and regeneration based strictly on server time.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { runAtomicTransaction } from './transactionManager.js';
import { sanitizeDocId } from '../securityMiddleware.js';

const ENERGY_REGEN_INTERVAL_MS = 6 * 60 * 1000; // 1 energy per 6 minutes (360,000 ms)
const DEFAULT_MAX_ENERGY = 100;

/**
 * Calculates current energy using server time elapsed since lastEnergyUpdate
 */
export function calculateServerEnergy(profile, serverNow = Date.now()) {
    const maxEnergy = profile.maxEnergy || DEFAULT_MAX_ENERGY;
    const storedEnergy = typeof profile.energy === 'number' ? profile.energy : maxEnergy;
    const lastUpdate = profile.lastEnergyUpdate || serverNow;

    if (storedEnergy >= maxEnergy) {
        return {
            energy: storedEnergy,
            lastEnergyUpdate: serverNow,
            nextRegenInMs: 0,
        };
    }

    const elapsedMs = Math.max(0, serverNow - lastUpdate);
    const regenerated = Math.floor(elapsedMs / ENERGY_REGEN_INTERVAL_MS);
    const newEnergy = Math.min(maxEnergy, storedEnergy + regenerated);
    const remainderMs = elapsedMs % ENERGY_REGEN_INTERVAL_MS;
    const newLastUpdate = newEnergy >= maxEnergy ? serverNow : serverNow - remainderMs;
    const nextRegenInMs = newEnergy >= maxEnergy ? 0 : ENERGY_REGEN_INTERVAL_MS - remainderMs;

    return {
        energy: newEnergy,
        lastEnergyUpdate: newLastUpdate,
        nextRegenInMs,
    };
}

export async function handleEnergySync(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { userId, isDev, launchParams } = req.query || {};
    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === 'true',
        `energy_sync_${Date.now()}`,
        'energy.sync',
        async (profile) => {
            const calculated = calculateServerEnergy(profile, Date.now());
            const oldEnergy = profile.energy;
            profile.energy = calculated.energy;
            profile.lastEnergyUpdate = calculated.lastEnergyUpdate;

            return {
                success: true,
                data: {
                    energy: calculated.energy,
                    maxEnergy: profile.maxEnergy || DEFAULT_MAX_ENERGY,
                    nextRegenInMs: calculated.nextRegenInMs,
                    serverTime: Date.now(),
                },
                changes: { energy: { oldVal: oldEnergy, newVal: calculated.energy } },
                reason: 'periodic_energy_sync',
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
}

export async function handleEnergySpend(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, amount = 10, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const spendAmount = parseInt(amount, 10);
    if (!Number.isFinite(spendAmount) || spendAmount <= 0 || spendAmount > 100) {
        return res.status(400).json({ error: 'Invalid energy spend amount' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `energy_spend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        'energy.spend',
        async (profile) => {
            const calculated = calculateServerEnergy(profile, Date.now());
            if (calculated.energy < spendAmount) {
                return { success: false, error: 'Insufficient energy' };
            }

            const oldEnergy = calculated.energy;
            const newEnergy = calculated.energy - spendAmount;
            profile.energy = newEnergy;
            profile.lastEnergyUpdate = calculated.lastEnergyUpdate;

            return {
                success: true,
                data: {
                    energy: newEnergy,
                    maxEnergy: profile.maxEnergy || DEFAULT_MAX_ENERGY,
                    spent: spendAmount,
                },
                changes: { energy: { oldVal: oldEnergy, newVal: newEnergy } },
                reason: `energy_spend_${spendAmount}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
}
