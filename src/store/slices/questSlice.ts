import { QUESTS_POOL } from '../../configs/QuestsConfig';
import { audioService } from '../../services/AudioService';
import { AssetsMap } from '../../configs/AssetsMap';

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
    lastDailyRefresh: 0,
    weeklyQuests: [] as any[],

    // --- ЭКШЕНЫ КВЕСТОВ ---
    refreshDailyQuests: () => {
        const shuffled = [...QUESTS_POOL].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4).map((q) => ({
            questId: q.id,
            progress: 0,
            isClaimed: false,
        }));
        set({
            dailyQuests: selected,
            lastDailyRefresh: Date.now(),
            dailyAdWatchesCount: 0,
        });
    },

    updateQuestProgress: (type: string, amount: number) =>
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

            const newWeekly = (state.weeklyQuests || []).map((wq: any) => {
                const questData = WEEKLY_QUESTS_POOL.find((q) => q.id === wq.questId);
                if (questData && questData.type === type && !wq.isClaimed) {
                    const newProgress = Math.min(questData.target, wq.progress + amount);
                    return { ...wq, progress: newProgress };
                }
                return wq;
            });

            return { dailyQuests: newQuests, weeklyQuests: newWeekly };
        }),

    claimQuestReward: (questId: string) => {
        const state = get() as any;
        const dq = state.dailyQuests.find((q: any) => q.questId === questId);
        const qData = QUESTS_POOL.find((q) => q.id === questId);

        if (dq && qData && dq.progress >= qData.target && !dq.isClaimed) {
            const newQuests = state.dailyQuests.map((q: any) =>
                q.questId === questId ? { ...q, isClaimed: true } : q,
            );

            state.addGold(qData.rewardGold);
            state.addCrystals(qData.rewardGems);
            state.addExp(qData.rewardExp);
            state.addBpExp(qData.rewardExp);

            set({ dailyQuests: newQuests });
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

    setPremium: (val: boolean) => {
        if (val) {
            const state = get() as any;
            const cost = 999;
            if (state.crystals >= cost) {
                set({
                    crystals: state.crystals - cost,
                    isPremium: true,
                });
                audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                return true;
            } else {
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
                return false;
            }
        } else {
            set({ isPremium: false });
            return true;
        }
    },

    claimReward: (rewardId: string) => {
        const state = get() as any;
        if (state.claimedRewards.includes(rewardId)) return;

        let goldToAdd = 0;
        let gemsToAdd = 0;
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
        } else if (rewardId === 'weapon_moon_sword') {
            const weaponObj = { id: 'weapon_moon_sword', type: 'WEAPONS', rarity: 'EPIC', level: 1 };
            if (!newInventory.some((i) => i.id === 'weapon_moon_sword')) {
                newInventory.push(weaponObj);
            }
        } else if (rewardId === 'weapon_fire_staff') {
            const weaponObj = { id: 'weapon_fire_staff', type: 'WEAPONS', rarity: 'EPIC', level: 1 };
            if (!newInventory.some((i) => i.id === 'weapon_fire_staff')) {
                newInventory.push(weaponObj);
            }
        } else if (rewardId === 'weapon_dragon_blade') {
            const weaponObj = { id: 'weapon_dragon_blade', type: 'WEAPONS', rarity: 'EPIC', level: 1 };
            if (!newInventory.some((i) => i.id === 'weapon_dragon_blade')) {
                newInventory.push(weaponObj);
            }
        } else if (rewardId === 'chest_small') {
            goldToAdd = 1000;
            gemsToAdd = 15;
        } else if (rewardId === 'chest_epic') {
            goldToAdd = 5000;
            gemsToAdd = 100;
        } else if (rewardId === 'chest_legendary') {
            goldToAdd = 10000;
            gemsToAdd = 200;
        } else if (rewardId === 'potion_strength') {
            const itemObj = { id: 'hp_potion_3', type: 'POTIONS', rarity: 'EPIC', level: 1 };
            if (!newInventory.some((i) => i.id === 'hp_potion_3')) {
                newInventory.push(itemObj);
            }
        } else if (rewardId === 'potion_strength_great') {
            const itemObj = { id: 'hp_potion_3', type: 'POTIONS', rarity: 'EPIC', level: 2 };
            if (!newInventory.some((i) => i.id === 'hp_potion_3')) {
                newInventory.push(itemObj);
            }
        } else if (rewardId === 'potion_healing') {
            const itemObj = { id: 'hp_potion_1', type: 'POTIONS', rarity: 'COMMON', level: 1 };
            if (!newInventory.some((i) => i.id === 'hp_potion_1')) {
                newInventory.push(itemObj);
            }
        } else if (rewardId === 'potion_defense') {
            const itemObj = { id: 'hp_potion_2', type: 'POTIONS', rarity: 'RARE', level: 1 };
            if (!newInventory.some((i) => i.id === 'hp_potion_2')) {
                newInventory.push(itemObj);
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
            inventory: newInventory,
            ownedSkins: newOwnedSkins,
            equippedSkins: newEquippedSkins,
            shards: shardsObj,
        });

        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
    },

    refreshWeeklyQuests: () => {
        const selected = WEEKLY_QUESTS_POOL.map((q) => ({
            questId: q.id,
            progress: 0,
            isClaimed: false,
        }));
        set({ weeklyQuests: selected });
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
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
        }
    },
});
