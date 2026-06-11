import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { FORGE_CONFIG } from '../../game/configs/constants';
import { syncService } from '../../services/SyncService';
import { TimeService } from '../../utils/TimeService';

export const createForgeSlice = (set: any, get: any) => ({
    // --- FORGE COOLDOWNS ---
    forgeCooldowns: {} as Record<string, number>,

    setForgeCooldown: (itemId: string) => {
        const s = get();
        const cd = s.isPremium ? FORGE_CONFIG.PREMIUM_COOLDOWN_MS : FORGE_CONFIG.COOLDOWN_MS;
        set((state: any) => ({
            forgeCooldowns: { ...state.forgeCooldowns, [itemId]: TimeService.now() + cd },
        }));
    },

    canUpgrade: (itemId: string) => {
        const expiry = get().forgeCooldowns[itemId];
        return !expiry || expiry <= TimeService.now();
    },

    getForgeTimeRemaining: (itemId: string) => {
        const expiry = get().forgeCooldowns[itemId];
        return expiry ? Math.max(0, expiry - TimeService.now()) : 0;
    },

    // --- UPGRADE ---
    upgradeItem: (itemId: string, useProtectionStone?: boolean) => {
        const state = get() as any;
        if (!state.canUpgrade(itemId)) return null;
        const invItemIndex = state.inventory.findIndex((i: any) => i.instanceId === itemId || String(i.id) === itemId);
        if (invItemIndex === -1) return null;

        const invItem = state.inventory[invItemIndex];
        const currentLevel = invItem.level || 1;
        if (currentLevel >= 10) return null;

        const itemData = ITEMS_DATABASE[invItem.id];
        if (!itemData) return null;

        const getUpgradeRequirements = (level: number, rarity: string) => {
            let coalCost = 10;
            let steelCost = 5;
            let shardCost = 0;
            let goldCost = 1000;
            let rareType: string | null = null;
            let rareCost = 0;

            const rarityMultiplier = rarity === 'LEGENDARY' ? 3 : rarity === 'EPIC' ? 2 : rarity === 'RARE' ? 1.5 : 1;

            if (level === 1) {
                coalCost = Math.round(10 * rarityMultiplier);
                steelCost = Math.round(4 * rarityMultiplier);
                goldCost = Math.round(1000 * rarityMultiplier);
            } else if (level === 2) {
                coalCost = Math.round(15 * rarityMultiplier);
                steelCost = Math.round(8 * rarityMultiplier);
                shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 2 : 0;
                goldCost = Math.round(2000 * rarityMultiplier);
                if (rarity === 'RARE') { rareType = 'ancient_compass'; rareCost = 1; }
                else if (rarity === 'EPIC') { rareType = 'astral_crystal'; rareCost = 1; }
                else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') { rareType = 'void_sphere'; rareCost = 1; }
            } else if (level === 3) {
                coalCost = Math.round(25 * rarityMultiplier);
                steelCost = Math.round(15 * rarityMultiplier);
                shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 4 : 1;
                goldCost = Math.round(4000 * rarityMultiplier);
                if (rarity === 'RARE') { rareType = 'ancient_compass'; rareCost = 2; }
                else if (rarity === 'EPIC') { rareType = 'astral_crystal'; rareCost = 2; }
                else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') { rareType = 'void_sphere'; rareCost = 2; }
            } else if (level === 4) {
                coalCost = Math.round(40 * rarityMultiplier);
                steelCost = Math.round(25 * rarityMultiplier);
                shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 8 : 3;
                goldCost = Math.round(8000 * rarityMultiplier);
                if (rarity === 'RARE') { rareType = 'golden_sprout'; rareCost = 2; }
                else if (rarity === 'EPIC') { rareType = 'dragon_scale'; rareCost = 2; }
                else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') { rareType = 'lava_heart'; rareCost = 2; }
            } else {
                const scale = level - 3;
                coalCost = Math.round(30 * scale * rarityMultiplier);
                steelCost = Math.round(18 * scale * rarityMultiplier);
                shardCost = Math.round(3 * scale * rarityMultiplier);
                goldCost = Math.round(8000 * Math.pow(1.5, scale - 1) * rarityMultiplier);
                if (rarity === 'RARE') { rareType = 'golden_sprout'; rareCost = Math.min(5, scale); }
                else if (rarity === 'EPIC') { rareType = 'dragon_scale'; rareCost = Math.min(5, scale); }
                else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') { rareType = 'lava_heart'; rareCost = Math.min(5, scale); }
            }

            return { coalCost, steelCost, shardCost, goldCost, rareType, rareCost };
        };

        const isDiamondItem = itemData.priceGem && itemData.priceGem > 0;
        const reqs = getUpgradeRequirements(currentLevel, itemData.rarity);
        let goldCost = reqs.goldCost;
        let gemCost = 0;

        if (isDiamondItem) {
            goldCost = 0;
            if (currentLevel === 1) gemCost = 75;
            else if (currentLevel === 2) gemCost = 150;
            else if (currentLevel === 3) gemCost = 300;
            else if (currentLevel === 4) gemCost = 500;
            else gemCost = Math.round(500 * Math.pow(1.4, currentLevel - 4));
        }

        const hasRareResource = !reqs.rareType || (state[reqs.rareType] || 0) >= reqs.rareCost;
        const needsProtection = currentLevel >= 5;
        const hasProtectionStone = !needsProtection || !useProtectionStone || (state.protection_stones || 0) >= 1;

        if (
            state.gold < goldCost ||
            state.crystals < gemCost ||
            (state.coal || 0) < reqs.coalCost ||
            (state.steel_bars || 0) < reqs.steelCost ||
            (state.runic_shards || 0) < reqs.shardCost ||
            !hasRareResource ||
            !hasProtectionStone
        ) {
            return null;
        }

        const getSuccessChance = (lvl: number) => {
            if (lvl < 5) return 1.0;
            if (lvl === 5) return 0.8;
            if (lvl === 6) return 0.7;
            if (lvl === 7) return 0.6;
            if (lvl === 8) return 0.45;
            return 0.3;
        };

        const chance = getSuccessChance(currentLevel);
        const success = Math.random() <= chance;

        let finalLevel = currentLevel;
        let protectionUsed = false;
        let degraded = false;

        if (success) {
            finalLevel = currentLevel + 1;
        } else {
            if (needsProtection && useProtectionStone) {
                protectionUsed = true;
            } else if (needsProtection) {
                degraded = true;
                finalLevel = Math.max(5, currentLevel - 1);
            }
        }

        const newInventory = [...state.inventory];
        newInventory[invItemIndex] = { ...invItem, level: finalLevel };

        const updatedState: any = {
            gold: state.gold - goldCost,
            crystals: state.crystals - gemCost,
            coal: (state.coal || 0) - reqs.coalCost,
            steel_bars: (state.steel_bars || 0) - reqs.steelCost,
            runic_shards: (state.runic_shards || 0) - reqs.shardCost,
            inventory: newInventory,
        };

        if (reqs.rareType && reqs.rareCost > 0) {
            updatedState[reqs.rareType] = state[reqs.rareType] - reqs.rareCost;
        }
        if (protectionUsed) {
            updatedState.protection_stones = (state.protection_stones || 0) - 1;
        }

        set(updatedState);

        if (success) get().setForgeCooldown(itemId);

        get().updateQuestProgress('UPGRADE', 1);
        syncService.debouncedSync();

        return { success, degraded, protectionUsed, newLevel: finalLevel };
    },

    // --- DISMANTLE ---
    dismantleItem: (itemId: string) => {
        const state = get();
        const invItemIndex = state.inventory.findIndex((i: any) => i.instanceId === itemId || String(i.id) === itemId);
        if (invItemIndex === -1) return false;

        const invItem = state.inventory[invItemIndex];
        const actualInstanceId = invItem.instanceId || invItem.id;
        const isEquippedByAnyHero = Object.values(state.heroEquipment).some(
            (heroGear: any) => heroGear && Object.values(heroGear).includes(actualInstanceId),
        );

        if (isEquippedByAnyHero) {
            console.warn('dismantleItem: предмет надет на одного из героев, разборка заблокирована');
            return false;
        }

        const itemData = ITEMS_DATABASE[invItem.id];
        if (!itemData) return false;

        const rarity = itemData.rarity;
        let goldGained = 200;
        let coalGained = 0;
        let steelGained = 0;
        let shardGained = 0;

        if (rarity === 'COMMON') {
            goldGained = 200; coalGained = 5 + Math.floor(Math.random() * 5); steelGained = 1 + Math.floor(Math.random() * 2);
        } else if (rarity === 'UNCOMMON' || rarity === 'RARE') {
            goldGained = 500; coalGained = 8 + Math.floor(Math.random() * 6); steelGained = 3 + Math.floor(Math.random() * 4);
            shardGained = Math.random() < 0.3 ? 1 : 0;
        } else if (rarity === 'EPIC') {
            goldGained = 1200; coalGained = 12 + Math.floor(Math.random() * 8); steelGained = 6 + Math.floor(Math.random() * 6);
            shardGained = 1 + Math.floor(Math.random() * 2);
        } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
            goldGained = 3000; coalGained = 20 + Math.floor(Math.random() * 15); steelGained = 12 + Math.floor(Math.random() * 10);
            shardGained = 3 + Math.floor(Math.random() * 4);
        }

        const levelMultiplier = invItem.level || 1;
        goldGained *= levelMultiplier;
        coalGained *= levelMultiplier;
        steelGained *= levelMultiplier;
        shardGained *= levelMultiplier;

        const newInventory = [...state.inventory];
        newInventory.splice(invItemIndex, 1);

        set({
            gold: state.gold + goldGained,
            coal: (state.coal || 0) + coalGained,
            steel_bars: (state.steel_bars || 0) + steelGained,
            runic_shards: (state.runic_shards || 0) + shardGained,
            inventory: newInventory,
        });

        syncService.debouncedSync();
        return { goldGained, coalGained, steelGained, shardGained };
    },

    // --- REFORGE ---
    reforgeItem: (itemId: string) => {
        const state = get();
        const invItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
        if (invItemIndex === -1) return false;

        const costGold = 500;
        const costSteel = 4;

        if (state.gold < costGold || (state.steel_bars || 0) < costSteel) return false;

        const invItem = state.inventory[invItemIndex];
        let newMultiplier = 0.95 + Math.random() * 0.35;
        newMultiplier = Math.round(newMultiplier * 100) / 100;

        const newInventory = [...state.inventory];
        newInventory[invItemIndex] = { ...invItem, reforgeMultiplier: newMultiplier };

        set({
            gold: state.gold - costGold,
            steel_bars: (state.steel_bars || 0) - costSteel,
            inventory: newInventory,
        });

        syncService.debouncedSync();
        return newMultiplier;
    },

    // --- USE CONSUMABLE ---
    useConsumable: (itemId: string) => {
        const state = get() as any;
        const invItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
        if (invItemIndex === -1) return false;

        const invItem = state.inventory[invItemIndex];
        const itemConfig = ITEMS_DATABASE[itemId] as any;
        if (!itemConfig) return false;

        const newInventory = [...state.inventory];
        if ((invItem.amount || 1) > 1) {
            newInventory[invItemIndex] = { ...invItem, amount: invItem.amount - 1 };
        } else {
            newInventory.splice(invItemIndex, 1);
        }

        if (itemConfig.expReward) {
            state.addExp(itemConfig.expReward);
            set({ inventory: newInventory });
            syncService.debouncedSync();
            return true;
        }

        const now = TimeService.now();
        const duration = 60 * 60 * 1000;
        const newBuffs = { ...(state.activeBuffs || {}) };

        if (
            itemId === 'hp_potion_1' ||
            itemId === 'hp_potion_2' ||
            itemId === 'hp_potion_3' ||
            itemId === 'mana_potion_1'
        ) {
            newBuffs[itemId] = now + duration;
        } else {
            return false;
        }

        set({ inventory: newInventory, activeBuffs: newBuffs });
        syncService.debouncedSync();
        return true;
    },
});
