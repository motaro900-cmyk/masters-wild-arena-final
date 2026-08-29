/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Atomic transaction manager, per-user lock/mutex, idempotency store, and audit logging.
 */

import { getLocalDoc, saveLocalDoc } from '../localStore.js';
import { sanitizeDocId } from '../securityMiddleware.js';

// In-memory per-user lock table to prevent concurrent race conditions
const userLocks = new Map();

/**
 * Acquires an async mutex lock for a specific user ID
 * @param {string} userId
 * @returns {Promise<() => void>} unlock function
 */
export async function acquireUserLock(userId) {
    const cleanId = sanitizeDocId(userId);
    while (userLocks.has(cleanId)) {
        await userLocks.get(cleanId);
    }

    let unlock;
    const lockPromise = new Promise((resolve) => {
        unlock = () => {
            userLocks.delete(cleanId);
            resolve();
        };
    });

    userLocks.set(cleanId, lockPromise);
    return unlock;
}

/**
 * Audit log helper for critical economic transactions
 */
export function logAudit(userId, operation, operationId, changes, reason = '') {
    const timestamp = new Date().toISOString();
    const changesStr = Object.entries(changes)
        .map(([k, { oldVal, newVal }]) => `${k.toUpperCase()} ${oldVal} -> ${newVal}`)
        .join(', ');
    console.log(`[AUDIT] ${timestamp} | USER ${userId} | OP ${operation} | OP_ID ${operationId} | ${changesStr} | REASON: ${reason}`);
}

/**
 * Executes an atomic economic transaction on a player's profile
 *
 * @param {string} userId - Player doc ID (e.g. "VK-123456")
 * @param {boolean} isDev - Whether to use dev collection
 * @param {string} operationId - Unique client idempotency key (e.g. "reward_1787989_abc")
 * @param {string} operationType - Label for audit log (e.g. "reward.claim", "inventory.sell")
 * @param {(profile: any) => Promise<{ success: boolean, data?: any, error?: string, changes?: Record<string, { oldVal: any, newVal: any }> }>} mutator
 * @returns {Promise<{ ok: boolean, data?: any, error?: string, isDuplicate?: boolean }>}
 */
export async function runAtomicTransaction(userId, isDev, operationId, operationType, mutator) {
    const cleanId = sanitizeDocId(userId);
    if (!cleanId) {
        return { ok: false, error: 'Invalid user ID' };
    }

    const unlock = await acquireUserLock(cleanId);
    const USERS_COLLECTION = isDev === true ? 'пользователи_dev' : 'пользователи';

    try {
        const docResult = await getLocalDoc(USERS_COLLECTION, cleanId);
        let profile = docResult.exists && docResult.data ? { ...docResult.data } : null;

        // If no existing profile, initialize safe starting profile
        if (!profile) {
            profile = {
                gold: 500,
                crystals: 10,
                energy: 100,
                maxEnergy: 100,
                lastEnergyUpdate: Date.now(),
                level: 1,
                exp: 0,
                rating: 1000,
                vipLevel: 0,
                vipEndTime: 0,
                inventory: [
                    { id: 'stick', type: 'WEAPONS', rarity: 'COMMON', level: 1, amount: 1, instanceId: 'stick_starting' },
                    { id: 'bandana', type: 'HELMETS', rarity: 'COMMON', level: 1, amount: 1, instanceId: 'bandana_starting' },
                    { id: 'ragged_tunic', type: 'ARMOR', rarity: 'COMMON', level: 1, amount: 1, instanceId: 'tunic_starting' },
                    { id: 'weapon_rusty_sword', type: 'WEAPONS', rarity: 'COMMON', level: 1, amount: 1, instanceId: 'rusty_sword_spare' },
                ],
                heroEquipment: {
                    panda: { WEAPONS: 'stick_starting', HELMETS: 'bandana_starting', ARMOR: 'tunic_starting' },
                },
                _processedOps: {},
                revision: 1,
                lastSavedTimestamp: Date.now(),
            };
        }

        if (!profile._processedOps) {
            profile._processedOps = {};
        }

        // Idempotency check: if operation was already successfully processed, return cached result
        if (operationId && profile._processedOps[operationId]) {
            console.log(`[TransactionManager] Duplicate operationId detected for ${cleanId}: ${operationId}. Returning cached success.`);
            return {
                ok: true,
                isDuplicate: true,
                data: profile._processedOps[operationId].data,
                revision: profile.revision,
                profile,
            };
        }

        // Execute domain mutator function
        const mutationResult = await mutator(profile);
        if (!mutationResult.success) {
            return { ok: false, error: mutationResult.error || 'Transaction rejected by server rule' };
        }

        // Increment revision and record operation
        profile.revision = (profile.revision || 0) + 1;
        profile.lastSavedTimestamp = Date.now();

        if (operationId) {
            profile._processedOps[operationId] = {
                processedAt: Date.now(),
                type: operationType,
                data: mutationResult.data || null,
            };

            // Keep only recent 200 operations to prevent unbounded growth
            const opKeys = Object.keys(profile._processedOps);
            if (opKeys.length > 200) {
                for (const oldKey of opKeys.slice(0, opKeys.length - 200)) {
                    delete profile._processedOps[oldKey];
                }
            }
        }

        // Save atomically to disk
        await saveLocalDoc(USERS_COLLECTION, cleanId, profile);

        if (mutationResult.changes) {
            logAudit(cleanId, operationType, operationId, mutationResult.changes, mutationResult.reason || '');
        }

        return {
            ok: true,
            data: mutationResult.data,
            revision: profile.revision,
            profile,
        };
    } finally {
        unlock();
    }
}
