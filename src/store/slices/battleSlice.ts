import { MOBS_DB } from '../../configs/MobsConfig';
import { audioService } from '../../services/AudioService';
import { syncService } from '../../services/SyncService';
import { AssetsMap } from '../../configs/AssetsMap';

/**
 * battleSlice — боевые настройки, экранная навигация, PvE-прогрессия.
 *
 * Чат и почта вынесены в chatSlice и mailSlice соответственно,
 * чтобы каждый домен пересчитывался независимо.
 */
export const createBattleSlice = (set: any, get: any) => ({
    // --- Боевые настройки ---
    battleMode: 'RANKED' as 'RANKED' | 'WARMUP' | 'PVE',
    pveLoot: null as any,
    activeScreen: 'INTRO',
    showIntro: true,
    pveStage: 1,
    maxPveStage: 1,
    timeScale: 0.7,
    isGodMode: false,
    isOneShot: false,
    isEnemyFrozen: false,
    hasInfiniteEnergy: false,
    activePveEnemy: null as any,
    activeRankedOpponent: null as any,
    winStreak: 0,
    lossStreak: 0,

    // --- Экшены ---

    setBattleMode: (mode: 'RANKED' | 'WARMUP' | 'PVE') => set({ battleMode: mode }),

    setActiveScreen: (screen: any) => {
        set({ activeScreen: screen });
        try {
            if (screen === 'BATTLE') {
                audioService.stopAmbient();
            } else if (screen === 'MAIN_MENU' || screen === 'SANCTUARY') {
                const track = AssetsMap?.AUDIO?.MUSIC_LIST?.[6] || '/assets/audio/music/Where_the_Canopy_Weeps.mp3';
                audioService.playAmbient(track);
            }
        } catch (err) {
            console.warn('Failed to update ambient audio on screen change:', err);
        }
    },

    setScreen: (screen: string) => set({ activeScreen: screen }),
    goToHeroes: (tab = 'LIST') => set({ activeScreen: 'HEROES', heroesInitialTab: tab }),
    goToCity: () => set({ activeScreen: 'CITY' }),
    goToForge: () => set({ activeScreen: 'FORGE' }),
    goToArena: () => set({ activeScreen: 'BATTLE' }),
    goToMainMenu: () => set({ activeScreen: 'MAIN_MENU' }),

    setGodMode: (val: boolean) => set({ isGodMode: val }),
    setOneShot: (val: boolean) => set({ isOneShot: val }),
    setIsEnemyFrozen: (val: boolean) => set({ isEnemyFrozen: val }),
    setHasInfiniteEnergy: (val: boolean) => set({ hasInfiniteEnergy: val }),
    setTimeScale: (val: number) => set({ timeScale: val }),

    resetAllProgress: () => {
        const state = get();
        set({
            level: 1,
            exp: 0,
            rating: 0,
            gold: 300,
            crystals: 50,
            shards: {},
            energy: 50,
            maxEnergy: 50,
            lastEnergyUpdate: Date.now(),
            vipEndTime: 0,
            dailyAdWatchesCount: 0,
            dailyBattles: 0,
            lastBattleReset: Date.now(),
            name: 'Мастер',
            lastNameChange: 0,
            avatar: 'sprite:sprite-avatar avatar-pos-1',
            frame: 'harvest_wheat_frame.webp',
            title: 'Странник',
            trophies: 0,
            wins: 0,
            totalBattles: 0,
            isPremium: false,
            claimedRewards: [],
            claimedSocialRewards: [],
            usedPromoCodes: [],
            claimedGifts: [],
            tutorialStep: 0,
            canClaimDailyGift: false,
            lastWheelSpinTime: 0,
            lastDailyGiftClaimedTime: 0,
            onboardingCompleted: false,
            referralProcessed: false,
            referredBy: null,
            bpLevel: 1,
            bpExp: 0,
            friends: [],
            friendRequests: [],
            clanId: null,
            clanData: null,
            clanCoins: 0,
            vipLevel: 0,
            vipExp: 0,
            pet: {
                id: 'baby_dragon',
                name: 'Дракоша',
                level: 1,
                exp: 0,
                hunger: 100,
                happiness: 100,
                lastFed: Date.now(),
                lastHungerDecay: Date.now(),
                lastHappinessDecay: Date.now(),
                petCharges: 5,
                lastPetTime: Date.now(),
                lastDailyCollectDate: null,
                hasDailyPetReward: false,
            },
            inventory: [],
            heroEquipment: {},
            ownedHeroes: ['panda'],
            coal: 0,
            steel_bars: 0,
            runic_shards: 0,
            ancient_compass: 0,
            astral_crystal: 0,
            void_sphere: 0,
            golden_sprout: 0,
            dragon_scale: 0,
            lava_heart: 0,
            pveStage: 1,
            maxPveStage: 1,
            winStreak: 0,
            lossStreak: 0,
            dailyQuests: (state.dailyQuests || []).map((q: any) => ({
                ...q,
                progress: 0,
                isClaimed: false,
            })),
            lastDailyRefresh: Date.now(),
        });
    },

    startPveBattle: (stage: number) => {
        const isBoss = stage % 5 === 0;
        let mobId = 'ancient_wolf';
        if (isBoss) {
            if (stage % 15 === 5) mobId = 'ancient_treant';
            else if (stage % 15 === 10) mobId = 'ancient_griffin';
            else mobId = 'ancient_golem';
        } else {
            if (stage % 3 === 1) mobId = 'ancient_wolf';
            else if (stage % 3 === 2) mobId = 'ancient_panther';
            else mobId = 'ancient_spider';
        }

        const mobData = MOBS_DB.find((m) => m.id === mobId) || MOBS_DB[0];
        const difficultyMult = 1 + stage * 0.15;
        const enemy = {
            id: mobId,
            name: `${mobData.name} (Этаж ${stage})`,
            level: stage,
            hp: Math.floor(mobData.baseStats.hp * difficultyMult * (isBoss ? 1.5 : 1.0)),
            attack: Math.floor(mobData.baseStats.attack * difficultyMult * (isBoss ? 1.2 : 1.0)),
            defense: Math.floor(mobData.baseStats.defense * difficultyMult),
            image: mobData.image,
            isBoss,
        };

        set({
            activeScreen: 'BATTLE',
            activePveEnemy: enemy,
            selectedEnemyId: mobId,
            battleMode: 'PVE',
        });
        syncService.logPlayerAction(`Начал бой против моба: ${enemy.name}`);
        syncService.debouncedSync();
    },

    completePveBattle: (win: boolean) => {
        const { pveStage, maxPveStage, winStreak } = get();
        if (win) {
            const nextStage = pveStage + 1;
            const isBoss = pveStage % 5 === 0;
            const newStreak = winStreak + 1;
            const xpReward = Math.min(50 + pveStage * 5, 500);

            const activeHeroId = get().selectedHeroId || 'panda';
            get().addHeroExp(activeHeroId, xpReward);
            get().addExp(xpReward); // Опыт аккаунта для прокачки уровня игрока

            let coalGained = 0,
                steelGained = 0,
                shardGained = 0,
                compassGained = 0,
                crystalGained = 0,
                sphereGained = 0,
                sproutGained = 0,
                scaleGained = 0,
                heartGained = 0;

            const roll = Math.random();
            if (roll < (isBoss ? 0.9 : 0.6))
                coalGained = isBoss ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 1;
            if (Math.random() < (isBoss ? 0.8 : 0.4))
                steelGained = isBoss ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
            if (Math.random() < (isBoss ? 0.5 : 0.2)) shardGained = isBoss ? Math.floor(Math.random() * 2) + 1 : 1;

            const rareRoll = Math.random();
            const rareChance = isBoss ? 0.6 : 0.25;
            if (rareRoll < rareChance) {
                if (pveStage <= 5) compassGained = 1;
                else if (pveStage <= 10) crystalGained = 1;
                else if (pveStage <= 15) sphereGained = 1;
                else if (pveStage <= 20) sproutGained = 1;
                else if (pveStage <= 25) scaleGained = 1;
                else heartGained = 1;
            }

            const goldGained = Math.min(
                100 + pveStage * 30,
                5000, // максимум 5к золота за 1 PvE бой
            );
            const crystalsGained = isBoss ? 20 : 0;

            let logMsg = `Победа! Получено: 🪙 ${goldGained} золота, 🔷 ${xpReward} опыта`;
            if (crystalsGained > 0) logMsg += `, 💎 ${crystalsGained} алмазов`;

            const dropLogs: string[] = [];
            if (coalGained > 0) dropLogs.push(`🪵 Уголь x${coalGained}`);
            if (steelGained > 0) dropLogs.push(`🔩 Сталь x${steelGained}`);
            if (shardGained > 0) dropLogs.push(`🔮 Рун. осколок x${shardGained}`);
            if (compassGained > 0) dropLogs.push(`🧭 Древний компас x${compassGained}`);
            if (crystalGained > 0) dropLogs.push(`💎 Астральный кристалл x${crystalGained}`);
            if (sphereGained > 0) dropLogs.push(`🌌 Сфера бездны x${sphereGained}`);
            if (sproutGained > 0) dropLogs.push(`🌱 Золотой росток x${sproutGained}`);
            if (scaleGained > 0) dropLogs.push(`🐲 Чешуя дракона x${scaleGained}`);
            if (heartGained > 0) dropLogs.push(`🔥 Сердце лавы x${heartGained}`);
            if (dropLogs.length > 0) logMsg += ` и ресурсы: ${dropLogs.join(', ')}`;

            get().addCombatLog(logMsg);

            const loot = {
                coal: coalGained,
                steel_bars: steelGained,
                runic_shards: shardGained,
                ancient_compass: compassGained,
                astral_crystal: crystalGained,
                void_sphere: sphereGained,
                golden_sprout: sproutGained,
                dragon_scale: scaleGained,
                lava_heart: heartGained,
            };

            set((state: any) => ({
                gold: state.gold + goldGained,
                crystals: state.crystals + crystalsGained,
                coal: (state.coal || 0) + coalGained,
                steel_bars: (state.steel_bars || 0) + steelGained,
                runic_shards: (state.runic_shards || 0) + shardGained,
                ancient_compass: (state.ancient_compass || 0) + compassGained,
                astral_crystal: (state.astral_crystal || 0) + crystalGained,
                void_sphere: (state.void_sphere || 0) + sphereGained,
                golden_sprout: (state.golden_sprout || 0) + sproutGained,
                dragon_scale: (state.dragon_scale || 0) + scaleGained,
                lava_heart: (state.lava_heart || 0) + heartGained,
                pveStage: nextStage,
                maxPveStage: Math.max(maxPveStage, nextStage),
                winStreak: newStreak,
                lossStreak: 0,
                wins: (state.wins || 0) + 1,
                totalBattles: (state.totalBattles || 0) + 1,
                pveLoot: loot,
            }));

            get().updateQuestProgress('WIN', 1);
            get().updateQuestProgress('WIN_STREAK', newStreak);
            get().updateQuestProgress('PLAY', 1);

            syncService.logPlayerAction(`Победа в бою (Этап PvE: ${pveStage})`);
        } else {

            set((state: any) => ({
                winStreak: 0,
                lossStreak: (state.lossStreak || 0) + 1,
                totalBattles: (state.totalBattles || 0) + 1,
                pveLoot: null,
            }));
            get().updateQuestProgress('WIN_STREAK', 0);
            get().updateQuestProgress('PLAY', 1);

            syncService.logPlayerAction(`Поражение в бою (Этап PvE: ${pveStage})`);
        }

        syncService.syncPlayerData();
    },
});
