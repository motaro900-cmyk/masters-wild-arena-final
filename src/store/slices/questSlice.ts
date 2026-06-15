import { QUESTS_POOL, BP_DAILY_QUESTS_POOL } from '../../configs/QuestsConfig';
import { audioService } from '../../services/AudioService';
import { AssetsMap } from '../../configs/AssetsMap';
import { BATTLE_PASS_REWARDS } from '../../ui/components/hud/BattlePass/BattlePassShared';
import { syncService } from '../../services/SyncService';

export const WEEKLY_QUESTS_POOL = [
    {
        id: 'w1',
        title: 'Чемпион Арены',
        description: 'Победите в 20 сражениях на Арене',
        target: 20,
        rewardExp: 1000,
        type: 'WIN',
        icon: '🏆',
    },
    {
        id: 'w2',
        title: 'Коллекционер',
        description: 'Откройте 10 любых сундуков или подарков',
        target: 10,
        rewardExp: 800,
        type: 'OPEN_CHEST',
        icon: '📦',
    },
    {
        id: 'w3',
        title: 'Мастер Стали',
        description: 'Повысьте уровень любого предмета 5 раз',
        target: 5,
        rewardExp: 600,
        type: 'UPGRADE',
        icon: '⚒️',
    },
];

export const createQuestSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ КВЕСТОВ И БОЕВОГО ПРОПУСКА ---
    bpLevel: 1,
    bpExp: 0,
    showBpLevelUpOverlay: false,
    dailyQuests: [] as any[],
    bpDailyQuests: [] as any[],
    lastDailyRefresh: 0,
    weeklyQuests: [] as any[],
    lastWeeklyQuestReset: 0,

    // --- ЭКШЕНЫ КВЕСТОВ ---
    refreshDailyQuests: async () => {
        const { db, USERS_COLLECTION } = await import('../../utils/firebase');
        const { doc, updateDoc, getDoc, runTransaction, serverTimestamp } = await import('firebase/firestore');
        const { SyncService } = await import('../../services/SyncService');
        const { TimeService } = await import('../../utils/TimeService');
        const { useGameStore } = await import('../useGameStore');

        const state = useGameStore.getState();
        const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
        const playerRef = doc(db, USERS_COLLECTION, userId);

        let serverDate: Date;
        try {
            await updateDoc(playerRef, { tempServerTime: serverTimestamp() });
            const snap = await getDoc(playerRef);
            const ts = snap.data()?.tempServerTime;
            serverDate = ts ? ts.toDate() : new Date(TimeService.now());
        } catch (e) {
            console.warn('[questSlice] Failed to fetch serverTimestamp, falling back to calibrated local time', e);
            serverDate = new Date(TimeService.now());
        }

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(playerRef);
                if (!docSnap.exists()) return;

                const data = docSnap.data();
                const lastResetDateTs = data.lastResetDate;

                let shouldReset = false;
                if (!lastResetDateTs) {
                    shouldReset = true;
                } else {
                    const lastResetDate = lastResetDateTs.toDate();
                    const MSK_OFFSET = 3 * 60 * 60 * 1000;
                    const lastMSK = lastResetDate.getTime() + MSK_OFFSET;
                    const serverMSK = serverDate.getTime() + MSK_OFFSET;
                    const DAY_MS = 24 * 60 * 60 * 1000;
                    shouldReset = Math.floor(serverMSK / DAY_MS) > Math.floor(lastMSK / DAY_MS);
                }

                if (shouldReset) {
                    const shuffled = [...QUESTS_POOL].sort(() => 0.5 - Math.random());
                    const selected = shuffled.slice(0, 4).map((q) => ({
                        questId: q.id,
                        progress: 0,
                        isClaimed: false,
                    }));

                    const shuffledBp = [...BP_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
                    const selectedBp = shuffledBp.slice(0, 4).map((q) => ({
                        questId: q.id,
                        progress: 0,
                        isClaimed: false,
                    }));

                    transaction.update(playerRef, {
                        dailyQuests: selected,
                        bpDailyQuests: selectedBp,
                        dailyAdWatchesCount: 0,
                        lastResetDate: serverTimestamp(),
                        lastDailyRefresh: serverDate.getTime(),
                    });

                    set({
                        dailyQuests: selected,
                        bpDailyQuests: selectedBp,
                        lastDailyRefresh: serverDate.getTime(),
                        dailyAdWatchesCount: 0,
                    });
                }
            });
        } catch (err) {
            console.error('[questSlice] Transaction refreshDailyQuests failed:', err);
        }
    },

    updateQuestProgress: (type: string, amount: number) => {
        set((state: any) => {
            const newQuests = (state.dailyQuests || []).map((dq: any) => {
                const questData = QUESTS_POOL.find((q) => q.id === dq.questId);
                if (questData && questData.type === type && !dq.isClaimed) {
                    const newProgress =
                        type === 'WIN_STREAK' ? amount : Math.min(questData.target, dq.progress + amount);
                    return { ...dq, progress: newProgress };
                }
                return dq;
            });

            const newBpDaily = (state.bpDailyQuests || []).map((dq: any) => {
                const questData = BP_DAILY_QUESTS_POOL.find((q) => q.id === dq.questId);
                if (questData && questData.type === type && !dq.isClaimed) {
                    const newProgress =
                        type === 'WIN_STREAK' ? amount : Math.min(questData.target, dq.progress + amount);
                    return { ...dq, progress: newProgress };
                }
                return dq;
            });

            const newWeekly = (state.weeklyQuests || []).map((wq: any) => {
                const questData = WEEKLY_QUESTS_POOL.find((q) => q.id === wq.questId);
                if (questData && questData.type === type && !wq.isClaimed) {
                    const newProgress = Math.min(questData.target, wq.progress + amount);
                    return { ...wq, progress: newProgress };
                }
                return wq;
            });

            return { dailyQuests: newQuests, bpDailyQuests: newBpDaily, weeklyQuests: newWeekly };
        });
        syncService.debouncedSync();
    },

    claimQuestReward: (questId: string) => {
        const state = get() as any;
        const dq = state.dailyQuests.find((q: any) => q.questId === questId);
        const qData = QUESTS_POOL.find((q) => q.id === questId);

        if (dq && qData && dq.progress >= qData.target && !dq.isClaimed) {
            const newQuests = state.dailyQuests.map((q: any) =>
                q.questId === questId ? { ...q, isClaimed: true } : q,
            );

            get().addGold(qData.rewardGold || 0);
            get().addCrystals(qData.rewardGems || 0);
            get().addExp(qData.rewardExp || 0);

            set({ dailyQuests: newQuests });
            syncService.debouncedSync();
        }
    },

    claimBpDailyQuestReward: (questId: string) => {
        const state = get() as any;
        const dq = state.bpDailyQuests.find((q: any) => q.questId === questId);
        const qData = BP_DAILY_QUESTS_POOL.find((q) => q.id === questId);

        if (dq && qData && dq.progress >= qData.target && !dq.isClaimed) {
            const newQuests = state.bpDailyQuests.map((q: any) =>
                q.questId === questId ? { ...q, isClaimed: true } : q,
            );

            state.addBpExp(qData.rewardExp || 0);

            set({ bpDailyQuests: newQuests });
            syncService.debouncedSync();
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
        }
    },

    addBpExp: (amount: number) => {
        const state = get() as any;
        const actualAmount = state.isPremium ? Math.round(amount * 1.5) : amount;
        let newExp = state.bpExp + actualAmount;
        let newLevel = state.bpLevel;
        const maxExp = 1000;
        let leveledUp = false;

        while (newExp >= maxExp) {
            if (newLevel >= 15) {
                newExp = maxExp;
                break;
            }
            newExp -= maxExp;
            newLevel += 1;
            leveledUp = true;
        }

        set({
            bpExp: newExp,
            bpLevel: newLevel,
            showBpLevelUpOverlay: leveledUp ? true : state.showBpLevelUpOverlay,
        });
    },

    hideBpLevelUpOverlay: () => set({ showBpLevelUpOverlay: false }),

    buyBpLevel: () => {
        const state = get() as any;
        const cost = 150;
        if (state.bpLevel >= 15) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            return false;
        }
        if (state.crystals >= cost) {
            set({
                crystals: state.crystals - cost,
                bpLevel: state.bpLevel + 1,
            });
            syncService.debouncedSync();
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
            return true;
        } else {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            return false;
        }
    },

    buyAllBpLevels: () => {
        const state = get() as any;
        const levelsToBuy = 15 - state.bpLevel;
        if (levelsToBuy <= 0) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            return false;
        }
        const cost = levelsToBuy * 150;
        if (state.crystals >= cost) {
            set({
                crystals: state.crystals - cost,
                bpLevel: 15,
            });
            syncService.debouncedSync();
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
            return true;
        } else {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            return false;
        }
    },

    setPremium: (val: boolean) => {
        if (val) {
            const state = get() as any;
            const cost = 999;
            if (state.crystals >= cost) {
                set({
                    crystals: state.crystals - cost,
                    isPremium: true,
                });
                syncService.debouncedSync();
                audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                return true;
            } else {
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
                return false;
            }
        } else {
            set({ isPremium: false });
            syncService.debouncedSync();
            return true;
        }
    },

    claimReward: (rewardId: string) => {
        const state = get() as any;
        if (state.claimedRewards.includes(rewardId)) return;

        let goldToAdd = 0;
        let gemsToAdd = 0;
        let energyToAdd = 0;
        const newInventory = [...state.inventory];
        const newOwnedSkins = [...(state.ownedSkins || ['default'])];
        const newEquippedSkins = { ...(state.equippedSkins || { panda: 'default' }) };
        const shardsObj = { ...(state.shards || {}) };

        if (rewardId.startsWith('gold_')) {
            const amt = parseInt(rewardId.split('_')[1]);
            if (!isNaN(amt)) goldToAdd = amt;
        } else if (rewardId.startsWith('gems_')) {
            const amt = parseInt(rewardId.split('_')[1]);
            if (!isNaN(amt)) gemsToAdd = amt;
        } else if (rewardId.startsWith('energy_')) {
            const amt = parseInt(rewardId.split('_')[1]);
            if (!isNaN(amt)) energyToAdd = amt;
        } else if (rewardId === 'boots_iron') {
            const itemObj = {
                id: 'boots_iron',
                type: 'BOOTS',
                rarity: 'RARE',
                level: 1,
                instanceId: `boots_iron_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(itemObj);
        } else if (rewardId === 'iron_helm') {
            const itemObj = {
                id: 'iron_helm',
                type: 'HELMETS',
                rarity: 'RARE',
                level: 1,
                instanceId: `iron_helm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(itemObj);
        } else if (rewardId === 'dagger_rusty') {
            const weaponObj = {
                id: 'dagger_rusty',
                type: 'WEAPONS',
                rarity: 'RARE',
                level: 1,
                instanceId: `dagger_rusty_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(weaponObj);
        } else if (rewardId === 'dagger_bone') {
            const weaponObj = {
                id: 'dagger_bone',
                type: 'WEAPONS',
                rarity: 'RARE',
                level: 1,
                instanceId: `dagger_bone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(weaponObj);
        } else if (rewardId === 'weapon_moon_sword') {
            const weaponObj = {
                id: 'weapon_moon_sword',
                type: 'WEAPONS',
                rarity: 'EPIC',
                level: 1,
                instanceId: `weapon_moon_sword_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(weaponObj);
        } else if (rewardId === 'weapon_fire_staff') {
            const weaponObj = {
                id: 'weapon_fire_staff',
                type: 'WEAPONS',
                rarity: 'EPIC',
                level: 1,
                instanceId: `weapon_fire_staff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(weaponObj);
        } else if (rewardId === 'weapon_dragon_blade') {
            const weaponObj = {
                id: 'weapon_dragon_blade',
                type: 'WEAPONS',
                rarity: 'EPIC',
                level: 1,
                instanceId: `weapon_dragon_blade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            };
            newInventory.push(weaponObj);
        } else if (rewardId === 'chest_small') {
            goldToAdd = 1000;
            gemsToAdd = 15;
        } else if (rewardId === 'chest_epic') {
            goldToAdd = 5000;
            gemsToAdd = 100;
        } else if (rewardId === 'chest_legendary') {
            goldToAdd = 10000;
            gemsToAdd = 200;
        } else if (
            ['potion_strength', 'potion_strength_great', 'potion_healing', 'potion_defense'].includes(rewardId)
        ) {
            const getPotionData = (rId: string) => {
                if (rId === 'potion_strength')
                    return { potionId: 'hp_potion_3', type: 'POTIONS', rarity: 'EPIC', level: 1 };
                if (rId === 'potion_strength_great')
                    return { potionId: 'hp_potion_3', type: 'POTIONS', rarity: 'EPIC', level: 2 };
                if (rId === 'potion_healing')
                    return { potionId: 'hp_potion_1', type: 'POTIONS', rarity: 'COMMON', level: 1 };
                if (rId === 'potion_defense')
                    return { potionId: 'hp_potion_2', type: 'POTIONS', rarity: 'RARE', level: 1 };
                return null;
            };
            const pData = getPotionData(rewardId);
            if (pData) {
                const rewardItem = BATTLE_PASS_REWARDS.flatMap((r) => [r.free, r.premium]).find(
                    (item) => item && item.id === rewardId,
                );
                const rewardAmount = rewardItem?.amount || 1;
                const existingPotion = newInventory.find((i) => i.id === pData.potionId);
                if (existingPotion) {
                    existingPotion.amount = (existingPotion.amount || 1) + rewardAmount;
                } else {
                    newInventory.push({
                        id: pData.potionId,
                        type: pData.type,
                        rarity: pData.rarity,
                        level: pData.level,
                        amount: rewardAmount,
                    });
                }
            }
        } else if (rewardId === 'skin_lava_golem') {
            if (!newOwnedSkins.includes('skin_lava_golem')) {
                newOwnedSkins.push('skin_lava_golem');
            }
        } else if (rewardId === 'panda_frost') {
            if (!newOwnedSkins.includes('panda_frost')) {
                newOwnedSkins.push('panda_frost');
            }
        } else if (rewardId === 'shard_rare') {
            const heroId = 'wolf_knight';
            shardsObj[heroId] = (shardsObj[heroId] || 0) + 10;
        } else if (rewardId === 'shard_legendary') {
            const heroId = 'wolf_knight';
            shardsObj[heroId] = (shardsObj[heroId] || 0) + 25;
        } else if (rewardId === 'pedestal_legendary') {
            gemsToAdd = 500;
        }

        set({
            claimedRewards: [...state.claimedRewards, rewardId],
            gold: state.gold + goldToAdd,
            crystals: state.crystals + gemsToAdd,
            energy: state.energy + energyToAdd,
            inventory: newInventory,
            ownedSkins: newOwnedSkins,
            equippedSkins: newEquippedSkins,
            shards: shardsObj,
        });
        syncService.debouncedSync();
        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
    },

    refreshWeeklyQuests: () => {
        const selected = WEEKLY_QUESTS_POOL.map((q) => ({
            questId: q.id,
            progress: 0,
            isClaimed: false,
        }));
        set({
            weeklyQuests: selected,
            lastWeeklyQuestReset: Date.now(),
        });
    },

    claimWeeklyQuestReward: (questId: string) => {
        const state = get() as any;
        const wq = state.weeklyQuests.find((q: any) => q.questId === questId);
        const qData = WEEKLY_QUESTS_POOL.find((q) => q.id === questId);

        if (wq && qData && wq.progress >= qData.target && !wq.isClaimed) {
            const newQuests = state.weeklyQuests.map((q: any) =>
                q.questId === questId ? { ...q, isClaimed: true } : q,
            );

            state.addBpExp(qData.rewardExp);

            set({ weeklyQuests: newQuests });
            syncService.debouncedSync();
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
        }
    },
});
