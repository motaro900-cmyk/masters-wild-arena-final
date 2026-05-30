import { MOBS_DB } from '../../configs/MobsConfig';
import { audioService } from '../../services/AudioService';
import { syncService } from '../../services/SyncService';
import { AssetsMap } from '../../configs/AssetsMap';
import { getRankInfo } from '../../configs/RankSystem';

export const createBattleSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ БИТВ, ЭКРАНОВ И ЧАТА ---
    messages: [
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
    ] as any[],
    chatMessages: [
        { id: 1, text: 'Добро пожаловать в общий чат!', sender: 'Система' },
        { id: 2, text: 'Всем привет, кто в пати?', sender: 'xXx_Panda_xXx' },
        { id: 3, text: 'Куплю Меч Рассвета, дорого!', sender: 'TraderBob' },
        { id: 4, text: 'Когда обнова?', sender: 'NoobMaster99' },
    ] as any[],
    combatLogs: [] as string[],
    battleMode: 'RANKED',
    pveLoot: null as any,
    mail: [
        {
            id: 'welcome-mail',
            tab: 'INBOX',
            type: 'SYSTEM',
            from: 'МУДРЫЙ ФИЛИН',
            subject: 'ДОБРО ПОЖАЛОВАТЬ!',
            body: 'Приветствуем тебя, защитник! В Masters of the Wild твоя сила растет с каждой битвой. Мы подготовили для тебя стартовый набор, чтобы путь был легче. Исследуй, сражайся и помни: Дикие Земли не прощают слабости, но вознаграждают храбрых!',
            date: 'СЕГОДНЯ',
            isRead: false,
            isStarred: false,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
            rewards: [
                { type: 'GOLD', amount: 1000 },
                { type: 'CRYSTALS', amount: 50 },
            ],
        },
    ] as any[],
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

    // --- ЭКШЕНЫ БИТВ, ЭКРАНОВ И ЧАТА ---
    setMessages: (newMessages: any[]) => {
        set((state: any) => {
            const allMessages = [...state.messages, ...newMessages];
            const uniqueMessages = Array.from(new Map(allMessages.map((m) => [m.id, m])).values());
            return {
                messages: uniqueMessages.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
            };
        });
    },

    setMail: (newMail: any[]) => {
        set((state: any) => {
            const allMail = [...state.mail, ...newMail];
            const uniqueMail = Array.from(new Map(allMail.map((m) => [m.id, m])).values());
            return { mail: uniqueMail };
        });
    },

    addMessage: async (text: string, author = 'Motar', type = 'common') => {
        const state = get();
        const currentRating = state.rating || 0;
        const rankInfo = getRankInfo(currentRating);

        const finalAuthor =
            author === 'Игрок' || author === 'Мастер' || author === 'Motar' || !author ? state.name : author;

        const finalAvatar = state.vkUser?.photo_200 || state.vkUser?.photo || '/assets/images/avatars/панда.webp';

        const newMessage = {
            author: finalAuthor,
            avatar: finalAvatar,
            text,
            type,
            timestamp: Date.now(),
            level: state.level || 1,
            rankIcon: rankInfo.icon,
            vipLevel: state.vipLevel || 0,
            isTop1: finalAuthor === state.name,
        };

        if (type === 'system' && author === 'СИСТЕМА') {
            set({
                messages: [...state.messages, { ...newMessage, id: Math.random().toString(36).substr(2, 9) }],
            });
        } else {
            await syncService.sendChatMessage(newMessage);
        }
    },

    removeMessage: (id: string) =>
        set((state: any) => ({
            messages: state.messages.filter((m: any) => m.id !== id),
        })),

    resetChat: () => {
        set({
            messages: [
                {
                    id: 'welcome-1',
                    author: 'СИСТЕМА',
                    avatar: '/assets/images/ui/system_icon.png',
                    text: 'Чат очищен. Приятного общения! ✨',
                    type: 'system',
                    timestamp: Date.now(),
                    level: 1,
                    rankIcon: '',
                },
            ],
        });
    },

    addChatMessage: (msg: any) =>
        set((state: any) => ({
            chatMessages: [...state.chatMessages, { id: Date.now(), ...msg }].slice(-50),
        })),

    setBattleMode: (mode: 'RANKED' | 'WARMUP' | 'PVE') => set({ battleMode: mode }),

    addCombatLog: (msg: string) =>
        set((state: any) => ({
            combatLogs: [...state.combatLogs.slice(-49), `${new Date().toLocaleTimeString()} - ${msg}`],
        })),

    clearCombatLogs: () => set({ combatLogs: [] }),

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
            dailyQuests: (state.dailyQuests || []).map((q: any) => ({
                ...q,
                progress: 0,
                isClaimed: false,
            })),
            lastDailyRefresh: Date.now(),
            title: 'Странник', // getPlayerTitle(1) is Странник
        });
    },

    markMailAsRead: (id: string) =>
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, isRead: true } : m)),
        })),

    deleteMail: (id: string) =>
        set((state: any) => {
            const mailItem = state.mail.find((m: any) => m.id === id);
            if (mailItem?.id === 'welcome-mail' || mailItem?.tab === 'NEWS') return state;
            return {
                mail: state.mail.filter((m: any) => m.id !== id),
            };
        }),

    archiveMail: (id: string) =>
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, tab: 'ARCHIVE' } : m)),
        })),

    toggleMailStar: (id: string) =>
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m)),
        })),

    claimMailReward: (id: string) => {
        const mail = get().mail.find((m: any) => m.id === id);
        if (mail && mail.rewards) {
            mail.rewards.forEach((r: any) => {
                if (r.type === 'GOLD') get().addGold(r.amount);
                if (r.type === 'CRYSTALS') get().addCrystals(r.amount);
                if (r.type === 'ENERGY') get().addEnergy(r.amount);
                if (r.type === 'ITEM' && r.itemId) {
                    get().addItemToInventory({ id: r.itemId, level: 1 });
                }
            });
            set((state: any) => ({
                mail: state.mail.map((m: any) => (m.id === id ? { ...m, rewards: null, isRead: true } : m)),
            }));
        }
    },

    collectAllMailRewards: () => {
        const mails = get().mail;
        let totalGold = 0;
        let totalCrystals = 0;
        let totalEnergy = 0;

        mails.forEach((m: any) => {
            if (m.tab === 'INBOX' && m.rewards) {
                m.rewards.forEach((r: any) => {
                    if (r.type === 'GOLD') totalGold += r.amount;
                    if (r.type === 'CRYSTALS') totalCrystals += r.amount;
                    if (r.type === 'ENERGY') totalEnergy += r.amount;
                });
            }
        });

        if (totalGold > 0) get().addGold(totalGold);
        if (totalCrystals > 0) get().addCrystals(totalCrystals);
        if (totalEnergy > 0) get().addEnergy(totalEnergy);

        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.tab === 'INBOX' ? { ...m, rewards: null, isRead: true } : m)),
        }));
    },

    sendFeedback: (category: string, text: string) => {
        const state = get();
        const feedbackData = {
            category,
            text,
            userId: state.playerId,
            userName: state.vkUser ? `${state.vkUser.first_name} ${state.vkUser.last_name}` : 'Мастер',
            level: state.level,
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            version: 'v1.1.0',
            timestamp: Date.now(),
        };
        syncService.sendFeedback(feedbackData);
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
    },

    completePveBattle: (win: boolean) => {
        const { pveStage, maxPveStage, winStreak } = get();
        if (win) {
            const nextStage = pveStage + 1;
            const isBoss = pveStage % 5 === 0;
            const newStreak = winStreak + 1;
            const xpReward = pveStage * 50;

            get().addExp(xpReward);
            get().addBpExp(100);

            // Balanced resource drop rates:
            // Coal: 60% drop rate, amount: 1-3 (2-5 for boss)
            // Steel Bar: 40% drop rate, amount: 1-2 (2-4 for boss)
            // Runic Shard: 20% drop rate, amount: 1 (1-2 for boss)
            // Rare floor resources:
            // Level 1-5 (Floor 1-5): ancient_compass (20% on normal, 50% on boss)
            // Level 6-10 (Floor 6-10): astral_crystal (20% on normal, 50% on boss)
            // Level 11-15: void_sphere (20% on normal, 50% on boss)
            // Level 16-20: golden_sprout (20% on normal, 50% on boss)
            // Level 21-25: dragon_scale (20% on normal, 50% on boss)
            // Level 26+: lava_heart (20% on normal, 50% on boss)
            let coalGained = 0;
            let steelGained = 0;
            let shardGained = 0;
            let compassGained = 0;
            let crystalGained = 0;
            let sphereGained = 0;
            let sproutGained = 0;
            let scaleGained = 0;
            let heartGained = 0;

            const roll = Math.random();
            if (roll < (isBoss ? 0.9 : 0.6)) {
                coalGained = isBoss ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 1;
            }
            if (Math.random() < (isBoss ? 0.8 : 0.4)) {
                steelGained = isBoss ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
            }
            if (Math.random() < (isBoss ? 0.5 : 0.2)) {
                shardGained = isBoss ? Math.floor(Math.random() * 2) + 1 : 1;
            }

            const rareRoll = Math.random();
            const rareChance = isBoss ? 0.6 : 0.25;
            if (rareRoll < rareChance) {
                if (pveStage <= 5) {
                    compassGained = 1;
                } else if (pveStage <= 10) {
                    crystalGained = 1;
                } else if (pveStage <= 15) {
                    sphereGained = 1;
                } else if (pveStage <= 20) {
                    sproutGained = 1;
                } else if (pveStage <= 25) {
                    scaleGained = 1;
                } else {
                    heartGained = 1;
                }
            }

            const goldGained = pveStage * 100;
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

            if (dropLogs.length > 0) {
                logMsg += ` и ресурсы: ${dropLogs.join(', ')}`;
            }

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
                wins: (state.wins || 0) + 1,
                totalBattles: (state.totalBattles || 0) + 1,
                pveLoot: loot,
            }));

            get().updateQuestProgress('WIN', 1);
            get().updateQuestProgress('WIN_STREAK', newStreak);
            get().updateQuestProgress('PLAY', 1);
        } else {
            get().addBpExp(20);

            set((state: any) => ({
                winStreak: 0,
                totalBattles: (state.totalBattles || 0) + 1,
                pveLoot: null,
            }));
            get().updateQuestProgress('WIN_STREAK', 0);
            get().updateQuestProgress('PLAY', 1);
        }

        syncService.syncPlayerData();
    },
});
