import { ITEMS_DATABASE, calculateItemPower } from '../../game/configs/ItemsConfig';
import { getArsenalItems } from '../../configs/ShopConfig';
import { FORGE_CONFIG } from '../../game/configs/constants';
import { syncService } from '../../services/SyncService';

export const createInventorySlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ ИНВЕНТАРЯ ---
    inventory: [] as any[],
    heroEquipment: {
        panda: {
            WEAPONS: null,
            HELMETS: null,
            ARMOR: null,
            SHIELDS: null,
            SHOULDERS: null,
            BOOTS: null,
            PANTS: null,
        },
        wolf_knight: {
            WEAPONS: null,
            HELMETS: null,
            ARMOR: null,
            SHIELDS: null,
            SHOULDERS: null,
            BOOTS: null,
            PANTS: null,
        },
    } as Record<string, any>,
    coal: 0,
    steel_bars: 0,
    runic_shards: 0,
    ancient_compass: 0,
    astral_crystal: 0,
    void_sphere: 0,
    golden_sprout: 0,
    dragon_scale: 0,
    lava_heart: 0,
    protection_stones: 0,
    equippedWeaponId: null as string | null,
    equippedHelmId: null as string | null,
    equippedArmorId: null as string | null,
    equippedShieldId: null as string | null,
    equippedShouldersId: null as string | null,
    equippedBootsId: null as string | null,
    equippedPantsId: null as string | null,
    forgeCooldowns: {} as Record<string, number>,

    // --- ЭКШЕНЫ ИНВЕНТАРЯ ---
    addItemToInventory: (item: any) => {
        const state = get() as any;
        const itemObj = typeof item === 'string' ? { id: item } : item;
        const itemId = String(itemObj.id);
        if (!ITEMS_DATABASE[itemId]) return;

        const itemConfig = ITEMS_DATABASE[itemId];
        if (itemConfig.mainTab === 'ALCHEMY') {
            const existingItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
            if (existingItemIndex > -1) {
                const newInventory = [...state.inventory];
                const existingItem = newInventory[existingItemIndex];
                newInventory[existingItemIndex] = {
                    ...existingItem,
                    amount: (existingItem.amount || 1) + (itemObj.amount || 1),
                };
                set({ inventory: newInventory });
                return;
            }
        } else {
            if (state.inventory.some((i: any) => String(i.id) === itemId)) return;
        }

        const newItem = {
            ...itemObj,
            id: itemId,
            type: (itemConfig as any).subTab || (itemConfig as any).type || itemObj.type || 'WEAPONS',
            rarity: itemConfig.rarity || itemObj.rarity || 'COMMON',
            level: itemObj.level || 1,
            amount: itemObj.amount || 1,
        };
        set({ inventory: [...state.inventory, newItem] });
    },

    openSeasonChest: () => {
        const state = get() as any;
        const chestIndex = state.inventory.findIndex((i: any) => String(i.id) === 'season_chest');
        if (chestIndex === -1) {
            console.warn('[Chest] No season chest in inventory');
            return null;
        }

        const newInventory = [...state.inventory];
        const chestItem = newInventory[chestIndex];
        const chestAmount = chestItem.amount || 1;
        if (chestAmount > 1) {
            newInventory[chestIndex] = { ...chestItem, amount: chestAmount - 1 };
        } else {
            newInventory.splice(chestIndex, 1);
        }

        const shopArsenalItems = getArsenalItems();
        const ownedIds = newInventory.map((i: any) => String(i.id));
        const unownedArsenalItems = shopArsenalItems.filter((item) => !ownedIds.includes(String(item.id)));

        let rewardResult: any = null;

        if (unownedArsenalItems.length > 0) {
            const randomItem = unownedArsenalItems[Math.floor(Math.random() * unownedArsenalItems.length)];
            newInventory.push({
                id: randomItem.id,
                type: randomItem.subTab,
                rarity: randomItem.rarity,
                level: 1,
            });
            rewardResult = {
                type: 'NEW',
                item: randomItem,
                level: 1,
            };
        } else {
            const upgradeableItems = newInventory.filter((invItem: any) => {
                const isArsenal = shopArsenalItems.some((shopItem) => String(shopItem.id) === String(invItem.id));
                const currentLevel = invItem.level || 1;
                return isArsenal && currentLevel < 3;
            });

            if (upgradeableItems.length > 0) {
                const randomItemToUpgrade = upgradeableItems[Math.floor(Math.random() * upgradeableItems.length)];
                const idx = newInventory.findIndex((i: any) => String(i.id) === String(randomItemToUpgrade.id));
                const currentLvl = newInventory[idx].level || 1;
                newInventory[idx] = {
                    ...newInventory[idx],
                    level: currentLvl + 1,
                };
                const itemConfig = ITEMS_DATABASE[String(randomItemToUpgrade.id)];
                rewardResult = {
                    type: 'UPGRADE',
                    item: itemConfig,
                    level: currentLvl + 1,
                };
            } else {
                rewardResult = {
                    type: 'GOLD',
                    amount: 25000,
                };
            }
        }

        if (rewardResult.type === 'GOLD') {
            set({
                inventory: newInventory,
                gold: state.gold + 25000,
            });
        } else {
            set({
                inventory: newInventory,
            });
        }

        get().updateQuestProgress('OPEN_CHEST', 1);
        syncService.syncPlayerData();

        return rewardResult;
    },

    clearInventory: () =>
        set({
            inventory: [],
            heroEquipment: {
                panda: {
                    WEAPONS: null,
                    HELMETS: null,
                    ARMOR: null,
                    SHIELDS: null,
                    SHOULDERS: null,
                    BOOTS: null,
                    PANTS: null,
                },
                wolf_knight: {
                    WEAPONS: null,
                    HELMETS: null,
                    ARMOR: null,
                    SHIELDS: null,
                    SHOULDERS: null,
                    BOOTS: null,
                    PANTS: null,
                },
            },
            equippedWeaponId: null,
            equippedHelmId: null,
            equippedArmorId: null,
            equippedShieldId: null,
            equippedShouldersId: null,
            equippedBootsId: null,
            equippedPantsId: null,
        }),

    sellItem: (id: string) => {
        const state = get();
        const itemInInv = state.inventory.find((i: any) => i.id === id);
        if (!itemInInv) return;

        const isEquipped = Object.values(state.equippedItems).some((val) => val === id);
        if (isEquipped) {
            console.warn('[inventorySlice] Cannot sell equipped item');
            return;
        }

        const data = ITEMS_DATABASE[id] as any;
        const sellPrice = Math.floor((data?.priceGold || 100) * 0.5);

        state.addGold(sellPrice);
        set({
            inventory: state.inventory.filter((i: any) => i.id !== id),
        });
    },

    equipItem: (id: string) => {
        const state = get();
        const data = ITEMS_DATABASE[id] as any;
        if (!data) return;

        const heroId = state.selectedHeroId || 'panda';
        const subTab = data.subTab;

        const newHeroEquipment = { ...state.heroEquipment };
        Object.entries(newHeroEquipment).forEach(([hId, gear]: [string, any]) => {
            if (Object.values(gear).includes(id)) {
                const updatedGear = { ...gear };
                Object.keys(updatedGear).forEach((slot) => {
                    if (updatedGear[slot] === id) delete updatedGear[slot];
                });
                newHeroEquipment[hId] = updatedGear;
            }
        });

        const currentGear = { ...(newHeroEquipment[heroId] || {}) };
        currentGear[subTab] = id;
        newHeroEquipment[heroId] = currentGear;

        set({ heroEquipment: newHeroEquipment });

        if (subTab === 'WEAPONS') set({ equippedWeaponId: id });
        if (subTab === 'HELMETS') set({ equippedHelmId: id });
        if (subTab === 'ARMOR') set({ equippedArmorId: id });
        if (subTab === 'SHIELDS') set({ equippedShieldId: id });
        if (subTab === 'SHOULDERS') set({ equippedShouldersId: id });
        if (subTab === 'BOOTS') set({ equippedBootsId: id });
        if (subTab === 'PANTS') set({ equippedPantsId: id });
    },

    unequipItem: (id: string) => {
        const state = get();
        const heroId = state.selectedHeroId || 'panda';
        const newHeroEquipment = { ...state.heroEquipment };
        const currentGear = { ...(newHeroEquipment[heroId] || {}) };

        Object.keys(currentGear).forEach((slot) => {
            if (currentGear[slot] === id) delete currentGear[slot];
        });

        newHeroEquipment[heroId] = currentGear;
        set({ heroEquipment: newHeroEquipment });

        const data = ITEMS_DATABASE[id] as any;
        if (data?.subTab === 'WEAPONS') set({ equippedWeaponId: null });
        if (data?.subTab === 'HELMETS') set({ equippedHelmId: null });
        if (data?.subTab === 'ARMOR') set({ equippedArmorId: null });
        if (data?.subTab === 'SHIELDS') set({ equippedShieldId: null });
        if (data?.subTab === 'SHOULDERS') set({ equippedShouldersId: null });
        if (data?.subTab === 'BOOTS') set({ equippedBootsId: null });
        if (data?.subTab === 'PANTS') set({ equippedPantsId: null });
    },

    getHeroByItemId: (itemId: string) => {
        const state = get();
        let foundHeroId: string | null = null;
        Object.entries(state.heroEquipment).forEach(([hId, gear]: [string, any]) => {
            if (Object.values(gear).includes(itemId)) foundHeroId = hId;
        });
        return foundHeroId;
    },

    equipBest: () => {
        const state = get() as any;
        const inv = state.inventory;

        const findBest = (subTab: string) => {
            return inv
                .filter((i: any) => {
                    const d = ITEMS_DATABASE[String(i.id)];
                    return d && d.subTab === subTab;
                })
                .sort((a: any, b: any) => {
                    const da = ITEMS_DATABASE[String(a.id)];
                    const db = ITEMS_DATABASE[String(b.id)];
                    if (!da || !db) return 0;
                    return calculateItemPower(db) - calculateItemPower(da);
                })[0];
        };

        const bestWeapon = findBest('WEAPONS');
        const bestHelm = findBest('HELMETS');
        const bestArmor = findBest('ARMOR');
        const bestShield = findBest('SHIELDS');

        set({
            equippedWeaponId: bestWeapon?.id || state.equippedWeaponId,
            equippedHelmId: bestHelm?.id || state.equippedHelmId,
            equippedArmorId: bestArmor?.id || state.equippedArmorId,
            equippedShieldId: bestShield?.id || state.equippedShieldId,
        });
    },

    upgradeItem: (itemId: string, useProtectionStone?: boolean) => {
        const state = get() as any;
        const invItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
        if (invItemIndex === -1) return null;

        const invItem = state.inventory[invItemIndex];
        const currentLevel = invItem.level || 1;
        if (currentLevel >= 10) return null;

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return null;

        // Helper для расчета ресурсов
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
                if (rarity === 'RARE') {
                    rareType = 'ancient_compass';
                    rareCost = 1;
                } else if (rarity === 'EPIC') {
                    rareType = 'astral_crystal';
                    rareCost = 1;
                } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                    rareType = 'void_sphere';
                    rareCost = 1;
                }
            } else if (level === 3) {
                coalCost = Math.round(25 * rarityMultiplier);
                steelCost = Math.round(15 * rarityMultiplier);
                shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 4 : 1;
                goldCost = Math.round(4000 * rarityMultiplier);
                if (rarity === 'RARE') {
                    rareType = 'ancient_compass';
                    rareCost = 2;
                } else if (rarity === 'EPIC') {
                    rareType = 'astral_crystal';
                    rareCost = 2;
                } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                    rareType = 'void_sphere';
                    rareCost = 2;
                }
            } else if (level === 4) {
                coalCost = Math.round(40 * rarityMultiplier);
                steelCost = Math.round(25 * rarityMultiplier);
                shardCost = rarity === 'LEGENDARY' || rarity === 'EPIC' ? 8 : 3;
                goldCost = Math.round(8000 * rarityMultiplier);
                if (rarity === 'RARE') {
                    rareType = 'golden_sprout';
                    rareCost = 2;
                } else if (rarity === 'EPIC') {
                    rareType = 'dragon_scale';
                    rareCost = 2;
                } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                    rareType = 'lava_heart';
                    rareCost = 2;
                }
            } else {
                // Уровни 5-9
                const scale = level - 3;
                coalCost = Math.round(30 * scale * rarityMultiplier);
                steelCost = Math.round(18 * scale * rarityMultiplier);
                shardCost = Math.round(3 * scale * rarityMultiplier);
                goldCost = Math.round(8000 * Math.pow(1.5, scale - 1) * rarityMultiplier);

                if (rarity === 'RARE') {
                    rareType = 'golden_sprout';
                    rareCost = Math.min(5, scale);
                } else if (rarity === 'EPIC') {
                    rareType = 'dragon_scale';
                    rareCost = Math.min(5, scale);
                } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
                    rareType = 'lava_heart';
                    rareCost = Math.min(5, scale);
                }
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

        // Вычисляем шанс успеха
        const getSuccessChance = (lvl: number) => {
            if (lvl < 5) return 1.0;
            if (lvl === 5) return 0.8;
            if (lvl === 6) return 0.7;
            if (lvl === 7) return 0.6;
            if (lvl === 8) return 0.45;
            return 0.3; // 9 -> 10
        };

        const chance = getSuccessChance(currentLevel);
        const rand = Math.random();
        const success = rand <= chance;

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
                finalLevel = Math.max(5, currentLevel - 1); // Деградация, но не ниже безопасного уровня 5
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

        get().updateQuestProgress('UPGRADE', 1);
        syncService.syncPlayerData();

        return { success, degraded, protectionUsed, newLevel: finalLevel };
    },

    dismantleItem: (itemId: string) => {
        const state = get();
        const invItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
        if (invItemIndex === -1) return false;

        const invItem = state.inventory[invItemIndex];
        const heroId = state.selectedHeroId || 'panda';
        const equippedGear = state.heroEquipment[heroId] || {};
        const isEquipped = Object.values(equippedGear).includes(itemId);

        if (isEquipped) {
            console.warn('[inventorySlice] Cannot dismantle equipped item');
            return false;
        }

        const itemData = ITEMS_DATABASE[itemId];
        if (!itemData) return false;

        const rarity = itemData.rarity;
        let goldGained = 200;
        let coalGained = 0;
        let steelGained = 0;
        let shardGained = 0;

        if (rarity === 'COMMON') {
            goldGained = 200;
            coalGained = 5 + Math.floor(Math.random() * 5);
            steelGained = 1 + Math.floor(Math.random() * 2);
        } else if (rarity === 'UNCOMMON' || rarity === 'RARE') {
            goldGained = 500;
            coalGained = 8 + Math.floor(Math.random() * 6);
            steelGained = 3 + Math.floor(Math.random() * 4);
            shardGained = Math.random() < 0.3 ? 1 : 0;
        } else if (rarity === 'EPIC') {
            goldGained = 1200;
            coalGained = 12 + Math.floor(Math.random() * 8);
            steelGained = 6 + Math.floor(Math.random() * 6);
            shardGained = 1 + Math.floor(Math.random() * 2);
        } else if (rarity === 'LEGENDARY' || rarity === 'MYTHIC') {
            goldGained = 3000;
            coalGained = 20 + Math.floor(Math.random() * 15);
            steelGained = 12 + Math.floor(Math.random() * 10);
            shardGained = 3 + Math.floor(Math.random() * 4);
        }

        const levelMultiplier = invItem.level || 1;
        goldGained *= levelMultiplier;
        coalGained *= levelMultiplier;
        steelGained *= levelMultiplier;
        shardGained *= levelMultiplier;

        const newInventory = state.inventory.filter((i: any) => String(i.id) !== itemId);

        set({
            gold: state.gold + goldGained,
            coal: (state.coal || 0) + coalGained,
            steel_bars: (state.steel_bars || 0) + steelGained,
            runic_shards: (state.runic_shards || 0) + shardGained,
            inventory: newInventory,
        });

        syncService.syncPlayerData();
        return { goldGained, coalGained, steelGained, shardGained };
    },

    reforgeItem: (itemId: string) => {
        const state = get();
        const invItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
        if (invItemIndex === -1) return false;

        const costGold = 500;
        const costSteel = 4;

        if (state.gold < costGold || (state.steel_bars || 0) < costSteel) {
            return false;
        }

        const invItem = state.inventory[invItemIndex];

        let newMultiplier = 0.95 + Math.random() * 0.35;
        newMultiplier = Math.round(newMultiplier * 100) / 100;

        const newInventory = [...state.inventory];
        newInventory[invItemIndex] = {
            ...invItem,
            reforgeMultiplier: newMultiplier,
        };

        set({
            gold: state.gold - costGold,
            steel_bars: (state.steel_bars || 0) - costSteel,
            inventory: newInventory,
        });

        syncService.syncPlayerData();
        return newMultiplier;
    },

    useConsumable: (itemId: string) => {
        const state = get() as any;
        const invItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
        if (invItemIndex === -1) return false;

        const invItem = state.inventory[invItemIndex];
        
        // Decrease inventory amount
        const newInventory = [...state.inventory];
        if ((invItem.amount || 1) > 1) {
            newInventory[invItemIndex] = { ...invItem, amount: invItem.amount - 1 };
        } else {
            newInventory.splice(invItemIndex, 1);
        }

        // Apply buff
        const now = Date.now();
        const duration = 60 * 60 * 1000; // 1 hour
        const newBuffs = { ...(state.activeBuffs || {}) };
        
        // Potion types
        if (itemId === 'hp_potion_1' || itemId === 'hp_potion_2' || itemId === 'hp_potion_3' || itemId === 'mana_potion_1') {
            newBuffs[itemId] = now + duration;
        } else {
            return false; // Can't consume other items this way
        }

        set({
            inventory: newInventory,
            activeBuffs: newBuffs,
        });

        syncService.syncPlayerData();
        return true;
    },

    // --- FORGE COOLDOWN ---
    setForgeCooldown: (itemId: string) => {
        const s = get();
        const cd = s.isPremium ? FORGE_CONFIG.PREMIUM_COOLDOWN_MS : FORGE_CONFIG.COOLDOWN_MS;
        set((state: any) => ({
            forgeCooldowns: { ...state.forgeCooldowns, [itemId]: Date.now() + cd },
        }));
    },

    canUpgrade: (itemId: string) => {
        const expiry = get().forgeCooldowns[itemId];
        return !expiry || expiry <= Date.now();
    },

    getForgeTimeRemaining: (itemId: string) => {
        const expiry = get().forgeCooldowns[itemId];
        return expiry ? Math.max(0, expiry - Date.now()) : 0;
    },
});
