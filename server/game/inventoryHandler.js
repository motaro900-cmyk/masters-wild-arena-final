/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Server-authoritative inventory, equip/unequip, and sell operations.
 */

import { verifyVkSign, setCorsHeaders } from '../vkAuth.js';
import { runAtomicTransaction } from './transactionManager.js';
import { sanitizeDocId } from '../securityMiddleware.js';

// Base prices for items
const ITEM_PRICES_CONFIG = {
    stick: 50,
    bandana: 50,
    ragged_tunic: 50,
    weapon_rusty_sword: 100,
    iron_helmet: 150,
    leather_armor: 200,
};

export async function handleInventoryEquip(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, instanceId, heroId = 'panda', slot, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!instanceId || !slot) return res.status(400).json({ error: 'Missing instanceId or slot' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `equip_${instanceId}_${Date.now()}`,
        'inventory.equip',
        async (profile) => {
            if (!profile.inventory || !Array.isArray(profile.inventory)) {
                return { success: false, error: 'Empty inventory' };
            }

            const item = profile.inventory.find((i) => i.instanceId === instanceId || i.id === instanceId);
            if (!item) {
                return { success: false, error: 'Item not found in inventory' };
            }

            if (!profile.heroEquipment) profile.heroEquipment = {};
            if (!profile.heroEquipment[heroId]) profile.heroEquipment[heroId] = {};

            // Unequip from any other hero/slot
            for (const hId of Object.keys(profile.heroEquipment)) {
                for (const s of Object.keys(profile.heroEquipment[hId])) {
                    if (profile.heroEquipment[hId][s] === instanceId) {
                        profile.heroEquipment[hId][s] = null;
                    }
                }
            }

            profile.heroEquipment[heroId][slot] = instanceId;

            return {
                success: true,
                data: {
                    heroEquipment: profile.heroEquipment,
                    equippedSlot: slot,
                    instanceId,
                    heroId,
                },
                reason: `equip_${slot}_${instanceId}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
}

export async function handleInventorySell(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, instanceId, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!instanceId) return res.status(400).json({ error: 'Missing instanceId' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `sell_${instanceId}_${Date.now()}`,
        'inventory.sell',
        async (profile) => {
            if (!profile.inventory || !Array.isArray(profile.inventory)) {
                return { success: false, error: 'Empty inventory' };
            }

            const itemIndex = profile.inventory.findIndex((i) => i.instanceId === instanceId || i.id === instanceId);
            if (itemIndex === -1) {
                return { success: false, error: 'Item not found in inventory' };
            }

            const itemToSell = profile.inventory[itemIndex];

            // Check if equipped
            if (profile.heroEquipment) {
                for (const heroGear of Object.values(profile.heroEquipment)) {
                    if (heroGear && Object.values(heroGear).includes(instanceId)) {
                        return { success: false, error: 'Cannot sell equipped item' };
                    }
                }
            }

            const basePrice = ITEM_PRICES_CONFIG[itemToSell.id] || 50;
            const sellPrice = Math.floor(basePrice * 0.5) * (itemToSell.amount || 1);

            const oldGold = profile.gold || 0;
            const newGold = oldGold + sellPrice;
            profile.gold = newGold;

            // Remove item from inventory
            profile.inventory.splice(itemIndex, 1);

            return {
                success: true,
                data: {
                    gold: newGold,
                    soldPrice: sellPrice,
                    inventory: profile.inventory,
                },
                changes: { gold: { oldVal: oldGold, newVal: newGold } },
                reason: `sell_${itemToSell.id}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
}

export async function handleInventoryUpgrade(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, isDev, instanceId, operationId, launchParams } = body;

    const cleanId = sanitizeDocId(userId);
    if (!cleanId) return res.status(400).json({ error: 'Invalid user ID' });
    if (!instanceId) return res.status(400).json({ error: 'Missing instanceId' });

    const auth = verifyVkSign(launchParams, req.headers.host);
    if (!auth.ok) return res.status(403).json({ error: `Forbidden: ${auth.error}` });
    if (auth.vkUserId && cleanId !== `VK-${auth.vkUserId}`) {
        return res.status(403).json({ error: 'Forbidden: identity mismatch' });
    }

    const result = await runAtomicTransaction(
        cleanId,
        isDev === true,
        operationId || `upgrade_${instanceId}_${Date.now()}`,
        'inventory.upgrade',
        async (profile) => {
            if (!profile.inventory || !Array.isArray(profile.inventory)) {
                return { success: false, error: 'Empty inventory' };
            }

            const item = profile.inventory.find((i) => i.instanceId === instanceId || i.id === instanceId);
            if (!item) {
                return { success: false, error: 'Item not found in inventory' };
            }

            const currentLevel = item.level || 1;
            if (currentLevel >= 10) {
                return { success: false, error: 'Item already at max level (10)' };
            }

            const upgradeGoldCost = Math.round(500 * Math.pow(1.5, currentLevel - 1));
            const currentGold = profile.gold || 0;

            if (currentGold < upgradeGoldCost) {
                return { success: false, error: `Insufficient gold: requires ${upgradeGoldCost}, has ${currentGold}` };
            }

            const oldGold = currentGold;
            const newGold = currentGold - upgradeGoldCost;
            const newLevel = currentLevel + 1;

            profile.gold = newGold;
            item.level = newLevel;

            return {
                success: true,
                data: {
                    upgradedItem: item,
                    gold: newGold,
                    costPaid: upgradeGoldCost,
                    newLevel,
                    inventory: profile.inventory,
                },
                changes: {
                    gold: { oldVal: oldGold, newVal: newGold },
                },
                reason: `upgrade_${item.id}_to_lvl_${newLevel}`,
            };
        }
    );

    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.status(200).json(result.data);
}
