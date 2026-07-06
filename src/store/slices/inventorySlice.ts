import { ITEMS_DATABASE, calculateItemPower } from '../../game/configs/ItemsConfig';
import { getArsenalItems } from '../../configs/ShopConfig';
import { syncService } from '../../services/SyncService';

// Resources (coal, steel_bars, etc.) → resourcesSlice.ts
// Forge actions (upgradeItem, dismantleItem, reforgeItem, useConsumable, cooldowns) → forgeSlice.ts

export const createInventorySlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ ---
    inventory: [
        {
            id: 'stick',
            type: 'WEAPONS',
            rarity: 'COMMON',
            level: 1,
            amount: 1,
            instanceId: 'stick_starting',
        },
        {
            id: 'bandana',
            type: 'HELMETS',
            rarity: 'COMMON',
            level: 1,
            amount: 1,
            instanceId: 'bandana_starting',
        },
        {
            id: 'ragged_tunic',
            type: 'ARMOR',
            rarity: 'COMMON',
            level: 1,
            amount: 1,
            instanceId: 'tunic_starting',
        },
    ] as any[],
    heroEquipment: {
        panda: {
            WEAPONS: 'stick_starting',
            HELMETS: 'bandana_starting',
            ARMOR: 'tunic_starting',
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
    // Legacy per-slot shortcut fields (mirrors heroEquipment for selected hero)
    equippedWeaponId: 'stick_starting' as string | null,
    equippedHelmId: 'bandana_starting' as string | null,
    equippedArmorId: 'tunic_starting' as string | null,
    equippedShieldId: null as string | null,
    equippedShouldersId: null as string | null,
    equippedBootsId: null as string | null,
    equippedPantsId: null as string | null,

    // --- ДОБАВЛЕНИЕ ПРЕДМЕТОВ ---
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
                syncService.debouncedSync();
                return;
            }
        }

        const newItem = {
            ...itemObj,
            id: itemId,
            type: (itemConfig as any).subTab || (itemConfig as any).type || itemObj.type || 'WEAPONS',
            rarity: itemConfig.rarity || itemObj.rarity || 'COMMON',
            level: itemObj.level || 1,
            amount: itemObj.amount || 1,
            instanceId: itemObj.instanceId || `${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        };
        set({ inventory: [...state.inventory, newItem] });
        syncService.debouncedSync();
    },

    addItemsToInventory: (items: any[]) => {
        const state = get() as any;
        const newInventory = [...state.inventory];

        items.forEach((item) => {
            const itemObj = typeof item === 'string' ? { id: item } : item;
            const itemId = String(itemObj.id);
            if (!ITEMS_DATABASE[itemId]) return;

            const itemConfig = ITEMS_DATABASE[itemId];
            if (itemConfig.mainTab === 'ALCHEMY') {
                const existingItemIndex = newInventory.findIndex((i: any) => String(i.id) === itemId);
                if (existingItemIndex > -1) {
                    const existingItem = newInventory[existingItemIndex];
                    newInventory[existingItemIndex] = {
                        ...existingItem,
                        amount: (existingItem.amount || 1) + (itemObj.amount || 1),
                    };
                    return;
                }
            }

            newInventory.push({
                ...itemObj,
                id: itemId,
                type: (itemConfig as any).subTab || (itemConfig as any).type || itemObj.type || 'WEAPONS',
                rarity: itemConfig.rarity || itemObj.rarity || 'COMMON',
                level: itemObj.level || 1,
                amount: itemObj.amount || 1,
                instanceId: itemObj.instanceId || `${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            });
        });

        set({ inventory: newInventory });
        syncService.debouncedSync();
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
            newInventory.push({ id: randomItem.id, type: randomItem.subTab, rarity: randomItem.rarity, level: 1 });
            rewardResult = { type: 'NEW', item: randomItem, level: 1 };
        } else {
            const upgradeableItems = newInventory.filter((invItem: any) => {
                const isArsenal = shopArsenalItems.some((shopItem) => String(shopItem.id) === String(invItem.id));
                return isArsenal && (invItem.level || 1) < 3;
            });

            if (upgradeableItems.length > 0) {
                const randomItemToUpgrade = upgradeableItems[Math.floor(Math.random() * upgradeableItems.length)];
                const idx = newInventory.findIndex((i: any) => String(i.id) === String(randomItemToUpgrade.id));
                const currentLvl = newInventory[idx].level || 1;
                newInventory[idx] = { ...newInventory[idx], level: currentLvl + 1 };
                const itemConfig = ITEMS_DATABASE[String(randomItemToUpgrade.id)];
                rewardResult = { type: 'UPGRADE', item: itemConfig, level: currentLvl + 1 };
            } else {
                rewardResult = { type: 'GOLD', amount: 25000 };
            }
        }

        if (rewardResult.type === 'GOLD') {
            set({ inventory: newInventory, gold: state.gold + 25000 });
        } else {
            set({ inventory: newInventory });
        }

        get().updateQuestProgress('OPEN_CHEST', 1);
        syncService.debouncedSync();
        return rewardResult;
    },

    clearInventory: () => {
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
        });
        syncService.debouncedSync();
    },

    sellItem: (id: string) => {
        const state = get();
        const itemIndex = state.inventory.findIndex((i: any) => i.instanceId === id || i.id === id);
        if (itemIndex === -1) return;

        const itemInInv = state.inventory[itemIndex];
        const actualInstanceId = itemInInv.instanceId || itemInInv.id;
        const isEquippedByAnyHero = Object.values(state.heroEquipment).some(
            (heroGear: any) => heroGear && Object.values(heroGear).includes(actualInstanceId),
        );
        if (isEquippedByAnyHero) {
            console.warn('sellItem: предмет надет на одного из героев, продажа заблокирована');
            return;
        }

        const data = ITEMS_DATABASE[itemInInv.id] as any;
        const sellPrice = Math.floor((data?.priceGold || 100) * 0.5) * (itemInInv.amount || 1);

        state.addGold(sellPrice);
        const newInventory = [...state.inventory];
        newInventory.splice(itemIndex, 1);
        set({ inventory: newInventory });
        syncService.logPlayerAction(`Продал предмет: ${data?.name || itemInInv.id}`);
        syncService.debouncedSync();
    },

    // --- ЭКИПИРОВКА ---
    equipItem: (id: string) => {
        const state = get();
        const invItem = state.inventory.find((i: any) => i.instanceId === id || i.id === id);
        if (!invItem) return;
        const templateId = invItem.id;
        const actualInstanceId = invItem.instanceId || invItem.id;
        const data = ITEMS_DATABASE[templateId] as any;
        if (!data) return;

        const heroId = state.selectedHeroId || 'panda';
        const subTab = data.subTab;

        const playerLevel = state.level || 1;
        const requiredLevel = data.requiredLevel || 1;
        if (playerLevel < requiredLevel) {
            console.warn(`equipItem: Требуемый уровень (${requiredLevel}) выше вашего (${playerLevel})`);
            state.showConfirm?.(
                `Недостаточный уровень! Этот предмет требует ${requiredLevel} уровень (ваш: ${playerLevel}).`,
                () => {}
            );
            return;
        }

        const newHeroEquipment = { ...state.heroEquipment };
        Object.entries(newHeroEquipment).forEach(([hId, gear]: [string, any]) => {
            if (Object.values(gear).includes(actualInstanceId)) {
                const updatedGear = { ...gear };
                Object.keys(updatedGear).forEach((slot) => {
                    if (updatedGear[slot] === actualInstanceId) delete updatedGear[slot];
                });
                newHeroEquipment[hId] = updatedGear;
            }
        });

        const currentGear = { ...(newHeroEquipment[heroId] || {}) };
        currentGear[subTab] = actualInstanceId;
        newHeroEquipment[heroId] = currentGear;

        set({ heroEquipment: newHeroEquipment });

        if (heroId === (state.selectedHeroId || 'panda')) {
            if (subTab === 'WEAPONS') set({ equippedWeaponId: actualInstanceId });
            if (subTab === 'HELMETS') set({ equippedHelmId: actualInstanceId });
            if (subTab === 'ARMOR') set({ equippedArmorId: actualInstanceId });
            if (subTab === 'SHIELDS') set({ equippedShieldId: actualInstanceId });
            if (subTab === 'SHOULDERS') set({ equippedShouldersId: actualInstanceId });
            if (subTab === 'BOOTS') set({ equippedBootsId: actualInstanceId });
            if (subTab === 'PANTS') set({ equippedPantsId: actualInstanceId });
        }

        const itemName = data.name || templateId;
        syncService.logPlayerAction(`Надел снаряжение: ${itemName}`);
        syncService.debouncedSync();

        // Пересчёт combat power
        const newStats = get().getCalculatedStats?.(heroId)?.total;
        if (newStats) {
            const avgItemLevel = newStats.avgItemLevel || 1;
            const divisor = 200 + (avgItemLevel - 1) * 25;
            const defMitigation = newStats.defense / (newStats.defense + divisor);
            const effectiveEHP = newStats.hp / Math.max(0.01, 1 - defMitigation);
            set({
                combatPower: Math.floor(
                    newStats.attack * 12 +
                        effectiveEHP * 0.08 +
                        (newStats.critChance || 0) * 8 +
                        (newStats.speed || 1) * 200,
                ),
            });
        }
    },

    unequipItem: (id: string) => {
        const state = get();
        const invItem = state.inventory.find((i: any) => i.instanceId === id || i.id === id);
        const templateId = invItem ? invItem.id : id;
        const actualInstanceId = invItem ? invItem.instanceId || invItem.id : id;
        const data = ITEMS_DATABASE[templateId] as any;

        const heroId = state.selectedHeroId || 'panda';
        const newHeroEquipment = { ...state.heroEquipment };
        const currentGear = { ...(newHeroEquipment[heroId] || {}) };

        Object.keys(currentGear).forEach((slot) => {
            if (currentGear[slot] === actualInstanceId) delete currentGear[slot];
        });

        newHeroEquipment[heroId] = currentGear;
        set({ heroEquipment: newHeroEquipment });

        if (heroId === (state.selectedHeroId || 'panda')) {
            if (data?.subTab === 'WEAPONS') set({ equippedWeaponId: null });
            if (data?.subTab === 'HELMETS') set({ equippedHelmId: null });
            if (data?.subTab === 'ARMOR') set({ equippedArmorId: null });
            if (data?.subTab === 'SHIELDS') set({ equippedShieldId: null });
            if (data?.subTab === 'SHOULDERS') set({ equippedShouldersId: null });
            if (data?.subTab === 'BOOTS') set({ equippedBootsId: null });
            if (data?.subTab === 'PANTS') set({ equippedPantsId: null });
        }

        const itemName = data?.name || templateId;
        syncService.logPlayerAction(`Снял снаряжение: ${itemName}`);
        syncService.debouncedSync();

        // Пересчёт combat power
        const newStatsAfterUnequip = get().getCalculatedStats?.(heroId)?.total;
        if (newStatsAfterUnequip) {
            const avgItemLevel = newStatsAfterUnequip.avgItemLevel || 1;
            const divisor = 200 + (avgItemLevel - 1) * 25;
            const defMitigation = newStatsAfterUnequip.defense / (newStatsAfterUnequip.defense + divisor);
            const effectiveEHP = newStatsAfterUnequip.hp / Math.max(0.01, 1 - defMitigation);
            set({
                combatPower: Math.floor(
                    newStatsAfterUnequip.attack * 12 +
                        effectiveEHP * 0.08 +
                        (newStatsAfterUnequip.critChance || 0) * 8 +
                        (newStatsAfterUnequip.speed || 1) * 200,
                ),
            });
        }
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
        const heroId = state.selectedHeroId || 'panda';

        const playerLevel = state.level || 1;

        const findBest = (subTab: string) =>
            inv
                .filter((i: any) => {
                    const d = ITEMS_DATABASE[String(i.id)];
                    if (!d || d.subTab !== subTab) return false;
                    const reqLvl = d.requiredLevel || 1;
                    return playerLevel >= reqLvl;
                })
                .sort((a: any, b: any) => {
                    const da = ITEMS_DATABASE[String(a.id)];
                    const db = ITEMS_DATABASE[String(b.id)];
                    if (!da || !db) return 0;
                    return calculateItemPower(db) - calculateItemPower(da);
                })[0];

        const bestWeapon = findBest('WEAPONS');
        const bestHelm = findBest('HELMETS');
        const bestArmor = findBest('ARMOR');
        const bestShield = findBest('SHIELDS');

        const newHeroEquipment = { ...state.heroEquipment };
        const currentGear = { ...(newHeroEquipment[heroId] || {}) };

        const weaponInstanceId = bestWeapon ? bestWeapon.instanceId || bestWeapon.id : null;
        const helmInstanceId = bestHelm ? bestHelm.instanceId || bestHelm.id : null;
        const armorInstanceId = bestArmor ? bestArmor.instanceId || bestArmor.id : null;
        const shieldInstanceId = bestShield ? bestShield.instanceId || bestShield.id : null;

        if (weaponInstanceId) currentGear['WEAPONS'] = weaponInstanceId;
        if (helmInstanceId) currentGear['HELMETS'] = helmInstanceId;
        if (armorInstanceId) currentGear['ARMOR'] = armorInstanceId;
        if (shieldInstanceId) currentGear['SHIELDS'] = shieldInstanceId;

        newHeroEquipment[heroId] = currentGear;

        const instancesToEquip = [weaponInstanceId, helmInstanceId, armorInstanceId, shieldInstanceId].filter(Boolean);
        Object.entries(newHeroEquipment).forEach(([hId, gear]: [string, any]) => {
            if (hId === heroId) return;
            const updatedGear = { ...gear };
            let changed = false;
            Object.keys(updatedGear).forEach((slot) => {
                if (instancesToEquip.includes(updatedGear[slot])) {
                    delete updatedGear[slot];
                    changed = true;
                }
            });
            if (changed) newHeroEquipment[hId] = updatedGear;
        });

        set({
            heroEquipment: newHeroEquipment,
            equippedWeaponId: weaponInstanceId || state.equippedWeaponId,
            equippedHelmId: helmInstanceId || state.equippedHelmId,
            equippedArmorId: armorInstanceId || state.equippedArmorId,
            equippedShieldId: shieldInstanceId || state.equippedShieldId,
        });

        syncService.logPlayerAction('Надел лучшее снаряжение');
        syncService.debouncedSync();
    },
});
