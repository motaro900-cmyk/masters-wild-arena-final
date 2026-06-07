import { ENERGY_CONFIG, BATTLE_CONFIG } from '../../game/configs/constants';
import { getRankInfo } from '../../configs/RankSystem';
import { syncService } from '../../services/SyncService';
import { audioService } from '../../services/AudioService';
import { safeSetItem } from '../../utils/SafeStorage';
import { showRewardedVideo, isGroupMember } from '../../utils/VKBridge';
import { getMskDateKey, calculatePetDailyReward } from '../../ui/components/hud/Bestiary/utils/petRewards';
import { HEROES_DB } from '../../configs/HeroesConfig';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPlayerTitle = (_level: number): string => {
    return 'Странник';
};

const calculateMaxEnergy = (isPremium: boolean, isVip: boolean): number => {
    const base = ENERGY_CONFIG.MAX_ENERGY; // 50
    const premiumBonus = isPremium ? 15 : 0; // +15 for Premium
    const vipBonus = isVip ? 15 : 0; // +15 for VIP
    // Решение по балансу: не суммируем бонусы, берем наибольший из них (максимум 65 энергии), чтобы предотвратить бесконечный гринд
    return base + Math.max(premiumBonus, vipBonus);
};

export const getExpNeeded = (level: number): number => {
    if (level <= 40) return level * 600;
    if (level <= 60) return level * 500;
    return level * 400;
};

export const createPlayerSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ ИГРОКА ---
    level: 1,
    vipLevel: 0,
    vipExp: 0,
    exp: 0,
    gold: 300,
    crystals: 50,
    shards: {} as Record<string, number>,
    rating: 0,
    energy: ENERGY_CONFIG.MAX_ENERGY,
    maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
    lastEnergyUpdate: Date.now(),
    vipEndTime: 0,
    dailyAdWatchesCount: 0,
    dailyBattles: 0,
    dailyBattleLimit: BATTLE_CONFIG.DAILY_LIMIT,
    lastBattleReset: Date.now(),
    name: 'Мастер',
    lastNameChange: 0,
    avatar: 'sprite:sprite-avatar avatar-pos-1',
    frame: 'none',
    title: 'Странник',
    trophies: 0,
    wins: 0,
    totalBattles: 0,
    combatPower: 2450000,
    buffs: [
        { id: 'xp_x2', icon: '✨', label: 'XP x2' },
        { id: 'vip_crown', icon: '👑', label: 'VIP' },
        { id: 'gold_plus', icon: '💰', label: '+10%' },
    ],
    isPremium: false,
    claimedRewards: [] as string[],
    claimedSocialRewards: [] as string[],
    usedPromoCodes: [] as string[],
    claimedGifts: [] as string[],
    tutorialStep: 0,
    canClaimDailyGift: false,
    lastWheelSpinTime: 0,
    lastDailyGiftClaimedTime: 0,
    onboardingCompleted: true,
    profileStatus: 'loading' as 'loading' | 'loaded' | 'error',
    activeBuffs: {} as Record<string, number>,
    vkUser: null as any,
    isVkEnvironment:
        typeof window !== 'undefined' &&
        (window.location.search.includes('vk_app_id') || window.location.search.includes('vk_')),
    isMobile:
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isPowerSaving:
        typeof navigator !== 'undefined' &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (typeof window !== 'undefined' &&
                (window.location.search.includes('vk_app_id') || window.location.search.includes('vk_')))),
    isMuted: false,
    referralProcessed: false,
    referredBy: null as string | null,
    playerId:
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.endsWith('.local') ||
            window.location.protocol === 'file:')
            ? 'DEVELOPER'
            : 'MW-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
    musicVolume: 70,
    soundVolume: 85,
    graphicsQuality:
        typeof navigator !== 'undefined'
            ? (() => {
                  const memory = (navigator as any).deviceMemory || 4;
                  return memory >= 6 ? 'ULTRA' : memory >= 4 ? 'MEDIUM' : 'LOW';
              })()
            : 'ULTRA',
    showFps: false,
    notificationsEnabled: true,
    uiTheme: 'DARK',
    heroesInitialTab: 'LIST',
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
        lastDailyCollectDate: null as string | null,
        hasDailyPetReward: false,
    },

    // --- ЭКШЕНЫ ПРОФИЛЯ/ИГРОКА ---
    updateProfile: (data: any) =>
        set((state: any) => {
            const patch = { ...data };
            // TODO: разделить rating и trophies в следующем сезоне
            return { ...state, ...patch };
        }),

    addGold: (amount: number) => set((state: any) => ({ gold: state.gold + amount })),
    spendGold: (amount: number): boolean => {
        const s = get();
        if (s.gold < amount) return false;
        set((state: any) => ({ gold: Math.max(0, state.gold - amount) }));
        return true;
    },
    addCrystals: (amount: number) => set((state: any) => ({ crystals: state.crystals + amount })),
    spendDiamonds: (amount: number) => set((state: any) => ({ crystals: Math.max(0, state.crystals - amount) })),
    addEnergy: (amount: number) => set((state: any) => ({ energy: Math.min(state.energy + amount, state.maxEnergy) })),
    consumeEnergy: (amount: number) => {
        const s = get();
        if (s.hasInfiniteEnergy) return true;
        if (s.energy < amount) return false;
        const wasFull = s.energy >= s.maxEnergy;
        set((state: any) => ({
            energy: Math.max(0, state.energy - amount),
            dailyBattles: state.dailyBattles + 1,
            lastEnergyUpdate: wasFull ? Date.now() : state.lastEnergyUpdate,
        }));
        syncService.debouncedSync();
        return true;
    },
    addShards: (heroId: string, amount: number) =>
        set((state: any) => {
            const currentShards = state.shards?.[heroId] || 0;
            return {
                shards: {
                    ...(state.shards || {}),
                    [heroId]: currentShards + amount,
                },
            };
        }),

    openChest: (type: 'SINGLE' | 'MULTI') => {
        const state = get();
        const cost = type === 'SINGLE' ? 100 : 950;
        if (state.crystals < cost) return null;

        // Используем только реальных героев из HEROES_DB
        const heroPool = HEROES_DB.map((h) => h.id);
        const rewards: { heroId: string; amount: number }[] = [];
        const pulls = type === 'SINGLE' ? 1 : 10;

        for (let i = 0; i < pulls; i++) {
            const randomHero = heroPool[Math.floor(Math.random() * heroPool.length)];
            const randomAmount = Math.floor(Math.random() * 5) + 1; // 1 to 5 shards
            rewards.push({ heroId: randomHero, amount: randomAmount });
        }

        set((state: any) => {
            const newShards = { ...(state.shards || {}) };
            rewards.forEach((r) => {
                newShards[r.heroId] = (newShards[r.heroId] || 0) + r.amount;
            });
            return {
                crystals: state.crystals - cost,
                shards: newShards,
            };
        });

        return rewards;
    },

    addExp: (amount: number) =>
        set((state: any) => {
            let newExp = state.exp + amount;
            let newLevel = state.level;
            let maxExp = getExpNeeded(newLevel);

            while (newExp >= maxExp) {
                newExp -= maxExp;
                newLevel += 1;
                maxExp = getExpNeeded(newLevel);
            }

            return {
                exp: newExp,
                level: newLevel,
                title: getPlayerTitle(newLevel),
            };
        }),

    addRating: (amount: number) =>
        set((state: any) => {
            const newRating = Math.max(0, state.rating + amount);
            const oldRank = getRankInfo(state.rating).name;
            const newRank = getRankInfo(newRating).name;

            // Если подняли ранг до Легенды
            if (newRank === 'ЛЕГЕНДА' && oldRank !== 'ЛЕГЕНДА') {
                get().broadcastEvent('RANK_UP', { playerName: get().name, rankName: 'ЛЕГЕНДА' });
            }

            return { rating: newRating, trophies: newRating };
        }),

    broadcastEvent: (type: 'RANK_UP' | 'LEVEL_UP' | 'ITEM_DROP', payload: any) => {
        const { addMessage } = get();
        if (type === 'RANK_UP' && payload.rankName === 'ЛЕГЕНДА') {
            addMessage(
                `🌟 ВЕЛИКОЕ СОБЫТИЕ: Мастер ${payload.playerName} достиг ранга ЛЕГЕНДА! Весь мир склоняется перед его силой! 🐉`,
                'ГЕРОЛЬД',
                'system',
            );
        }
        if (type === 'LEVEL_UP' && payload.level >= 80) {
            addMessage(
                `⚔️ ТРИУМФ: ${payload.playerName} достиг 80 уровня! Его мощь не знает границ! 🛡️`,
                'ГЕРОЛЬД',
                'system',
            );
        }
    },

    watchAdForReward: async (type: 'GOLD' | 'ENERGY' | 'CRYSTAL') => {
        const state = get() as any;
        const adCount = state.dailyAdWatchesCount || 0;
        if (adCount >= 2) {
            return false;
        }

        const success = await showRewardedVideo();
        if (success) {
            if (type === 'GOLD') get().addGold(700);
            if (type === 'ENERGY') get().addEnergy(25);
            if (type === 'CRYSTAL') get().addCrystals(25);

            set((s: any) => ({ dailyAdWatchesCount: (s.dailyAdWatchesCount || 0) + 1 }));

            // Синхронизируем сразу после награды
            syncService.debouncedSync();
            return true;
        }
        return false;
    },

    buyVip: (days: number, price: number) => {
        const state = get() as any;
        if (state.crystals < price) {
            return false;
        }

        const now = Date.now();
        const currentEndTime = state.vipEndTime && state.vipEndTime > now ? state.vipEndTime : now;
        const newEndTime = currentEndTime + days * 24 * 60 * 60 * 1000;

        set({
            crystals: state.crystals - price,
            vipLevel: 1,
            maxEnergy: calculateMaxEnergy(state.isPremium, true),
            vipEndTime: newEndTime,
        });

        // Продлеваем также локально для обратной совместимости
        safeSetItem('vipEndTime', newEndTime.toString());

        // Синхронизируем
        syncService.debouncedSync();
        return true;
    },

    checkSocialRewards: async () => {
        const { isGroupMember } = await import('../../utils/VKBridge');
        const state = get() as any;
        const rewards = state.claimedSocialRewards || [];

        // 1. Проверка группы
        if (!rewards.includes('group')) {
            const isMember = await isGroupMember();
            if (isMember) {
                get().addCrystals(50);
                set({ claimedSocialRewards: [...rewards, 'group'] });
                get().addMail({
                    id: `social_reward_group_${Date.now()}`,
                    from: 'ЛЕСНЫЕ ДУХИ',
                    subject: 'НАГРАДА ЗА ВСТУПЛЕНИЕ В ГРУППУ!',
                    body: 'Мастер! Лесные духи отметили твою верность и посылают тебе щедрый дар за вступление в нашу общину.',
                    date: new Date().toLocaleDateString(),
                    isRead: false,
                    tab: 'INBOX',
                    rewards: [{ type: 'CRYSTALS', amount: 50 }],
                });
            }
        }
    },

    claimFavoriteReward: async () => {
        const state = get() as any;
        const rewards = state.claimedSocialRewards || [];
        if (rewards.includes('favorites')) return;

        const params = new URLSearchParams(window.location.search);
        const isFav = params.get('vk_is_favorite') === '1' || window.location.hostname === 'localhost';
        if (!isFav) {
            console.warn('claimFavoriteReward: приложение не добавлено в избранное');
            return;
        }

        get().addCrystals(50);
        set({ claimedSocialRewards: [...rewards, 'favorites'] });
        syncService.debouncedSync();
    },

    claimGroupReward: async () => {
        const state = get() as any;
        const rewards = state.claimedSocialRewards || [];
        if (rewards.includes('group')) return;

        const isMember = await isGroupMember();
        if (!isMember) {
            console.warn('claimGroupReward: пользователь не состоит в группе');
            return;
        }

        get().addCrystals(50);
        set({ claimedSocialRewards: [...rewards, 'group'] });
        syncService.debouncedSync();
    },

    canBattle: () => {
        const s = get();
        return s.energy >= BATTLE_CONFIG.ENERGY_COST && s.dailyBattles < s.dailyBattleLimit;
    },

    recordBattle: () => {
        const s = get();
        if (!s.canBattle?.()) return false;
        const wasFull = s.energy >= s.maxEnergy;
        set((state: any) => ({
            energy: Math.max(0, state.energy - BATTLE_CONFIG.ENERGY_COST),
            dailyBattles: state.dailyBattles + 1,
            lastEnergyUpdate: wasFull ? Date.now() : state.lastEnergyUpdate,
        }));
        return true;
    },

    regenerateEnergy: () => {
        const s = get();
        const now = Date.now();
        const regenMs = s.isPremium ? ENERGY_CONFIG.PREMIUM_REGEN_MS : ENERGY_CONFIG.REGEN_MS;
        const isVip = s.vipLevel > 0 || (s.vipEndTime && s.vipEndTime > now);
        // Always compute maxEnergy from config — ignore stale persisted maxEnergy
        const maxEnergy = calculateMaxEnergy(!!s.isPremium, isVip);

        // Sync maxEnergy in store if it's out of date (e.g. was persisted as 50)
        if (s.maxEnergy !== maxEnergy) {
            set({ maxEnergy });
        }

        if (s.energy >= maxEnergy) {
            return;
        }
        const elapsed = now - s.lastEnergyUpdate;
        const points = Math.floor(elapsed / regenMs);
        if (points > 0) {
            set((state: any) => ({
                energy: Math.min(state.energy + points, maxEnergy),
                maxEnergy, // keep in sync
                lastEnergyUpdate: state.lastEnergyUpdate + points * regenMs,
            }));
        }
    },

    resetDailyCounters: () => {
        const s = get();
        const now = new Date();
        const last = new Date(s.lastBattleReset);

        // Используем МСК время (UTC+3) для сброса как в остальных квестовых механиках
        const toMsk = (d: Date) => {
            const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
            return { y: msk.getUTCFullYear(), m: msk.getUTCMonth(), d: msk.getUTCDate() };
        };
        const nowMsk = toMsk(now);
        const lastMsk = toMsk(last);
        const isNewDay = nowMsk.y !== lastMsk.y || nowMsk.m !== lastMsk.m || nowMsk.d !== lastMsk.d;

        if (isNewDay) {
            set({
                dailyBattles: 0,
                dailyBattleLimit: s.isPremium ? BATTLE_CONFIG.PREMIUM_DAILY_LIMIT : BATTLE_CONFIG.DAILY_LIMIT,
                lastBattleReset: Date.now(),
                dailyAdWatchesCount: 0, // Сбрасываем лимит рекламы каждый день
            });
        }
    },

    redeemPromoCode: (code: string) => {
        const normalizedCode = code.trim().toUpperCase();
        const state = get() as any;

        if (state.usedPromoCodes.includes(normalizedCode)) {
            return { success: false, message: 'ПРОМОКОД УЖЕ ИСПОЛЬЗОВАН' };
        }

        const promoCodes: Record<string, { gold?: number; crystals?: number; energy?: number }> = {
            START: { gold: 1000, crystals: 10 },
            WILD: { energy: 10 },
            DIAMONDS: { crystals: 25 },
            // NOTE: dev/test promo codes must NOT be added here — use Firebase Remote Config
        };

        const reward = promoCodes[normalizedCode];

        if (reward) {
            const mailRewards = [];
            if (reward.gold) mailRewards.push({ type: 'GOLD', amount: reward.gold });
            if (reward.crystals) mailRewards.push({ type: 'CRYSTALS', amount: reward.crystals });
            if (reward.energy) mailRewards.push({ type: 'ENERGY', amount: reward.energy });

            const newMail = {
                id: `promo_${normalizedCode}_${Date.now()}`,
                from: 'МУДРЫЙ ФИЛИН',
                subject: 'ДАР ЗА ТАЙНЫЙ ШИФР!',
                body: `Приветствую тебя, путник! Лесные духи нашептали мне, что ты узнал древний код "${normalizedCode}". \n\nЗа твою проницательность и мудрость они посылают тебе эти дары. Пусть они помогут тебе в твоем нелегком приключении по Великому Лесу! \n\nИспользуй их с умом, мастер!`,
                date: new Date().toLocaleDateString(),
                isRead: false,
                tab: 'INBOX',
                rewards: mailRewards,
            };

            set((s: any) => ({
                usedPromoCodes: [...s.usedPromoCodes, normalizedCode],
            }));
            get().addMail(newMail);

            return { success: true, message: 'ПИСЬМО С ПОДАРКОМ ОТПРАВЛЕНО ВО ВХОДЯЩИЕ!' };
        }

        return { success: false, message: 'НЕВЕРНЫЙ ПРОМОКОД' };
    },

    addVipExp: (amount: number) =>
        set((state: any) => {
            let newExp = state.vipExp + amount;
            let newLevel = state.vipLevel;
            let expNeeded = (newLevel + 1) * 1000;

            while (newExp >= expNeeded) {
                newExp -= expNeeded;
                newLevel += 1;
                expNeeded = (newLevel + 1) * 1000;
            }

            return { vipExp: newExp, vipLevel: newLevel };
        }),

    setCanClaimDailyGift: (val: boolean) => set({ canClaimDailyGift: val }),
    setLastDailyGiftClaimedTime: (time: number) => set({ lastDailyGiftClaimedTime: time }),
    setLastWheelSpinTime: (time: number) => set({ lastWheelSpinTime: time }),
    setOnboardingCompleted: (val: boolean) => {
        set({ onboardingCompleted: val });
        syncService.debouncedSync();
    },
    processReferralCode: (code: string) => {
        const state = get() as any;
        if (state.referralProcessed) return;
        set({
            gold: state.gold + 1000,
            crystals: state.crystals + 50,
            referralProcessed: true,
            referredBy: code,
        });
        syncService.debouncedSync();
        console.debug(`🎁 Referral bonus credited! Inviter: ${code}`);
    },

    setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
    setIsPowerSaving: (enabled: boolean) => set({ isPowerSaving: enabled }),
    setIsMuted: (enabled: boolean) => {
        const isMuted = enabled;
        set({ isMuted });
        audioService.setMuted(isMuted);
        if (isMuted) {
            audioService.setMusicVolume(0);
            audioService.setSFXVolume(0);
            audioService.stopAllMusic();
        } else {
            const state = get();
            audioService.setMusicVolume(state.musicVolume / 100);
            audioService.setSFXVolume(state.soundVolume / 100);
            if (state.musicVolume > 0 && !audioService.isPlaying()) {
                audioService.toggleMusic();
            }
        }
    },
    setShowFps: (show: boolean) => set({ showFps: show }),
    setMusicVolume: (vol: number) => {
        set({ musicVolume: vol });
        if (!get().isMuted) audioService.setMusicVolume(vol / 100);
    },
    setSoundVolume: (vol: number) => {
        set({ soundVolume: vol });
        if (!get().isMuted) audioService.setSFXVolume(vol / 100);
    },
    setGraphicsQuality: (val: string) => set({ graphicsQuality: val }),
    setLevel: (val: number) => {
        set({ level: val, title: getPlayerTitle(val) });
        syncService.debouncedSync();
    },
    setGold: (val: number) => {
        set({ gold: val });
        syncService.debouncedSync();
    },
    setCrystals: (val: number) => {
        set({ crystals: val });
        syncService.debouncedSync();
    },
    setVkUser: (user: any) => {
        const state = get() as any;
        const uid = user?.id || user?.uid;
        if (!uid) {
            console.error('setVkUser: невалидный объект пользователя', user);
            return;
        }
        const currentName = state.name;
        const newName = currentName === 'Мастер' || !currentName ? user.firstName : currentName;
        const newPlayerId = `MW-VK-${uid}`;

        set({
            vkUser: user,
            name: newName,
            avatar: user.photo || state.avatar,
            playerId: newPlayerId,
        });
    },

    changeName: (newName: string) => {
        const state = get() as any;
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        if (now - state.lastNameChange < thirtyDays && state.lastNameChange !== 0) {
            const remainingDays = Math.ceil((thirtyDays - (now - state.lastNameChange)) / (24 * 60 * 60 * 1000));
            return { success: false, message: `Смена будет доступна через ${remainingDays} дн.` };
        }

        const cleanName = newName.trim();
        if (cleanName.length < 2 || cleanName.length > 15) {
            return { success: false, message: 'Имя должно быть от 2 до 15 символов' };
        }

        const forbidden = ['хуй', 'пизд', 'еблан', 'сука', 'бля', 'админ', 'gm', 'admin', 'moder'];
        const lowerName = cleanName.toLowerCase();
        if (forbidden.some((word) => lowerName.includes(word))) {
            return { success: false, message: 'Имя содержит недопустимые слова' };
        }

        const nameRegex = /^[a-zA-Zа-яА-Я0-9\s]+$/;
        if (!nameRegex.test(cleanName)) {
            return { success: false, message: 'Только буквы и цифры' };
        }

        set({ name: cleanName, lastNameChange: now });
        syncService.debouncedSync();
        return { success: true };
    },

    setAvatar: (avatar: string) => {
        set({ avatar });
        syncService.debouncedSync();
    },
    setFrame: (frame: string) => {
        set({ frame });
        syncService.debouncedSync();
    },
    setTitle: (title: string) => {
        set({ title });
        syncService.debouncedSync();
    },
    setRating: (rating: number) => {
        set({ rating: Math.max(0, rating) });
        syncService.debouncedSync();
    },

    checkPetDailyReward: () => {
        const state = get() as any;
        if (!state.pet) return;
        const currentMskDate = getMskDateKey();
        if (state.pet.lastDailyCollectDate !== currentMskDate) {
            set((s: any) => ({
                pet: {
                    ...s.pet,
                    hasDailyPetReward: true,
                },
            }));
        }
    },

    collectPetDailyReward: () => {
        const state = get() as any;
        if (!state.pet || !state.pet.hasDailyPetReward) return null;

        const currentMskDate = getMskDateKey();
        const rewards = calculatePetDailyReward(state.pet.level, state.pet.hunger, state.pet.happiness);

        set((s: any) => {
            const nextPet = {
                ...s.pet,
                hasDailyPetReward: false,
                lastDailyCollectDate: currentMskDate,
            };

            const patch: any = {
                gold: s.gold + rewards.gold,
                crystals: s.crystals + rewards.crystals,
                pet: nextPet,
            };

            if (rewards.loot) {
                const lootId = rewards.loot.id;
                if (lootId === 'protection_stone') {
                    patch.protection_stones = (s.protection_stones || 0) + rewards.loot.amount;
                } else if (lootId === 'runic_shard') {
                    patch.runic_shards = (s.runic_shards || 0) + rewards.loot.amount;
                } else if (lootId === 'steel_bar') {
                    patch.steel_bars = (s.steel_bars || 0) + rewards.loot.amount;
                } else if (lootId === 'coal') {
                    patch.coal = (s.coal || 0) + rewards.loot.amount;
                }
            }

            return patch;
        });

        syncService.debouncedSync();
        return rewards;
    },
});
