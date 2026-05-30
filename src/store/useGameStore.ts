import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { ENERGY_CONFIG } from '../game/configs/constants';

import { createPlayerSlice } from './slices/playerSlice';
import { createShopSlice } from './slices/shopSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createHeroSlice } from './slices/heroSlice';
import { createQuestSlice } from './slices/questSlice';
import { createClanSlice } from './slices/clanSlice';
import { createBattleSlice } from './slices/battleSlice';

export { WEEKLY_QUESTS_POOL } from './slices/questSlice';

export const useGameStore = create<any>()(
    persist(
        (set, get) => ({
            ...createPlayerSlice(set, get),
            ...createShopSlice(set, get),
            ...createInventorySlice(set, get),
            ...createHeroSlice(set, get),
            ...createQuestSlice(set, get),
            ...createClanSlice(set, get),
            ...createBattleSlice(set, get),
            get equippedItems() {
                const currentHeroId = get().selectedHeroId || 'panda';
                return get().heroEquipment?.[currentHeroId] || {};
            },
            get talentPoints() {
                const level = get().level || 1;
                const totalEarned = level;
                const currentHeroId = get().selectedHeroId || 'panda';
                const talents = get().heroTalents?.[currentHeroId] || {};

                const getTalentUpgradeCost = (tId: string): number => {
                    if (['atk_base', 'def_base', 'mas_base'].includes(tId)) return 1;
                    if (['atk_crit', 'atk_pen', 'def_res', 'def_eva', 'mas_spd', 'mas_focus'].includes(tId)) return 2;
                    if (['atk_ult', 'def_ult', 'mas_ult'].includes(tId)) return 3;
                    return 1;
                };

                const totalSpent = Object.entries(talents).reduce((sum: number, [tId, val]: [string, any]) => {
                    const levelVal = typeof val === 'number' ? val : 0;
                    const costPerLevel = getTalentUpgradeCost(tId);
                    return sum + levelVal * costPerLevel;
                }, 0);
                return Math.max(0, totalEarned - totalSpent);
            },
        }),
        {
            name: 'game-storage',
            storage: createJSONStorage(() => getStorage()),
            version: 28, // v28: Fix maxEnergy sync from config
            partialize: (state: any) => ({
                level: state.level,
                vipLevel: state.vipLevel,
                vipExp: state.vipExp,
                exp: state.exp,
                gold: state.gold,
                crystals: state.crystals,
                shards: state.shards,
                rating: state.rating,
                energy: state.energy,
                maxEnergy: state.maxEnergy,
                lastEnergyUpdate: state.lastEnergyUpdate,
                vipEndTime: state.vipEndTime,
                dailyAdWatchesCount: state.dailyAdWatchesCount,
                name: state.name,
                lastNameChange: state.lastNameChange,
                avatar: state.avatar,
                frame: state.frame,
                title: state.title,
                bpLevel: state.bpLevel,
                bpExp: state.bpExp,
                trophies: state.trophies,
                wins: state.wins,
                totalBattles: state.totalBattles,
                claimedSocialRewards: state.claimedSocialRewards,
                ownedSkins: state.ownedSkins,
                equippedSkins: state.equippedSkins,
                usedPromoCodes: state.usedPromoCodes,
                musicVolume: state.musicVolume,
                soundVolume: state.soundVolume,
                graphicsQuality: state.graphicsQuality,
                showFps: state.showFps,
                notificationsEnabled: state.notificationsEnabled,
                pveStage: state.pveStage,
                maxPveStage: state.maxPveStage,
                isPowerSaving: state.isPowerSaving,
                isMuted: state.isMuted,
                winStreak: state.winStreak,
                playerId: state.playerId,
                onboardingCompleted: state.onboardingCompleted,
                activeBuffs: state.activeBuffs,
                friends: state.friends,
                clanId: state.clanId,
                clanCoins: state.clanCoins,
                heroes: state.heroes,
                heroTalents: state.heroTalents,
                pet: state.pet,
                petCharges: state.petCharges,
                lastPetTime: state.lastPetTime,
                inventory: state.inventory,
                heroEquipment: state.heroEquipment,
                selectedHeroId: state.selectedHeroId,
                ownedHeroes: state.ownedHeroes,
                claimedRewards: state.claimedRewards,
                coal: state.coal,
                steel_bars: state.steel_bars,
                runic_shards: state.runic_shards,
                ancient_compass: state.ancient_compass,
                astral_crystal: state.astral_crystal,
                void_sphere: state.void_sphere,
                golden_sprout: state.golden_sprout,
                dragon_scale: state.dragon_scale,
                lava_heart: state.lava_heart,
                protection_stones: state.protection_stones,
                shopRotation: state.shopRotation,
                shopDiscounts: state.shopDiscounts,
                shopLastRefreshTime: state.shopLastRefreshTime,
                lastWheelSpinTime: state.lastWheelSpinTime,
            }),
            migrate: (persistedState: any, version: number) => {
                if (version < 22) {
                    console.log('🔄 Migrating store to v22...');
                    persistedState.bpLevel = 1;
                    persistedState.bpExp = 0;
                    persistedState.messages = [
                        {
                            id: 'welcome-1',
                            author: 'СИСТЕМА',
                            avatar: '/assets/images/ui/system_icon.png',
                            text: 'Приветствуем в Masters of the Wild! Твой путь к величию начинается здесь. 🐉⚔️',
                            type: 'system',
                            timestamp: Date.now() - 1000,
                            level: 1,
                            rankIcon: '',
                        },
                        {
                            id: 'codex-1',
                            author: 'КОДЕКС ЧЕСТИ',
                            avatar: '/assets/images/ui/system_icon.png',
                            text: 'Истинная сила — в уважении. Будьте вежливы, не используйте оскорбления и мат. Пусть в чате царит дух честной игры! 🛡️🤝',
                            type: 'system',
                            timestamp: Date.now(),
                            level: 1,
                            rankIcon: '',
                        },
                    ];

                    if (persistedState.activeScreen === 'ARENA' || persistedState.activeScreen === 'OTHER') {
                        persistedState.activeScreen = 'MAIN_MENU';
                    }
                }

                if (version < 23) {
                    console.log('🔄 Migrating store to v23: Forcing Intro...');
                    persistedState.activeScreen = 'INTRO';
                    persistedState.name = 'Мастер';
                    persistedState.avatar = 'sprite:sprite-avatar avatar-pos-1';
                }

                if (version < 24) {
                    console.log('🔄 Migrating store to v24: Adding materials...');
                    persistedState.coal = 35;
                    persistedState.steel_bars = 20;
                    persistedState.runic_shards = 10;
                }

                if (version < 25) {
                    console.log('🔄 Migrating store to v25: Adding new resources...');
                    persistedState.ancient_compass = 5;
                    persistedState.astral_crystal = 5;
                    persistedState.void_sphere = 5;
                    persistedState.golden_sprout = 5;
                    persistedState.dragon_scale = 5;
                    persistedState.lava_heart = 5;
                }

                if (version < 26) {
                    console.log('🔄 Migrating store to v26: Adding protection stones and shop persistence...');
                    persistedState.protection_stones = 5;
                    persistedState.shopDiscounts = {};
                }

                if (version < 27) {
                    console.log('🔄 Migrating store to v27: Adding lastWheelSpinTime...');
                    persistedState.lastWheelSpinTime = 0;
                }

                if (version < 28) {
                    console.log('🔄 Migrating store to v28: Fix maxEnergy...');
                    const correctMax = persistedState.isPremium
                        ? ENERGY_CONFIG.PREMIUM_MAX_ENERGY
                        : ENERGY_CONFIG.MAX_ENERGY;
                    persistedState.maxEnergy = correctMax;
                    // Cap energy to the correct maximum
                    if (persistedState.energy > correctMax) {
                        persistedState.energy = correctMax;
                    }
                    // Reset lastEnergyUpdate so regen starts fresh
                    persistedState.lastEnergyUpdate = Date.now();
                }

                return persistedState;
            },
        },
    ),
);

if (typeof window !== 'undefined') {
    (window as any).useGameStore = useGameStore;
}
