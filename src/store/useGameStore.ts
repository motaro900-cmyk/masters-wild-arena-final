import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { ITEMS_DATABASE as BASE_ITEMS, calculateItemPower, IEquipmentStats } from '../game/configs/ItemsConfig';
import { ITEMS_DATABASE as HARDCORE_ITEMS } from '../game/configs/ItemsConfig_Hardcore';

const ITEMS_DATABASE = { ...BASE_ITEMS, ...HARDCORE_ITEMS };
import { HEROES_DB } from '../configs/HeroesConfig';
import { QUESTS_POOL } from '../configs/QuestsConfig';
import { audioService } from '../services/AudioService';
import { AssetsMap } from '../configs/AssetsMap';
import { syncService } from '../services/SyncService';
import { showRewardedVideo, purchaseStars } from '../utils/VKBridge';
import { getRankInfo } from '../configs/RankSystem';


const getPlayerTitle = (level: number): string => {
    if (level >= 72) return 'Хранитель Равновесия';
    if (level >= 64) return 'Старейшина';
    if (level >= 56) return 'Провидец';
    if (level >= 48) return 'Мудрец';
    if (level >= 40) return 'Наставник';
    if (level >= 32) return 'Мастер Клинка';
    if (level >= 24) return 'Адепт';
    if (level >= 16) return 'Искатель';
    if (level >= 8) return 'Послушник';
    return 'Странник';
};

// --- СОСТОЯНИЕ ИГРОКА ---
export const useGameStore = create<any>()(
    persist(
        (set, get) => ({
            // --- СОСТОЯНИЕ ИГРОКА ---
            level: 1,
            vipLevel: 0,
            vipExp: 0,
            exp: 0,
            gold: 100000,
            crystals: 100000,
            rating: 0,
            energy: 50,
            maxEnergy: 50,
            lastEnergyUpdate: Date.now(),
            avatar: 'sprite:sprite-avatar avatar-pos-1',
            frame: 'Рамка 1.webp',
            title: 'Странник',
            bpLevel: 1,
            bpExp: 0,
            trophies: 0,
            combatPower: 2450000,
            buffs: [
                { id: 'xp_x2', icon: '✨', label: 'XP x2' },
                { id: 'vip_crown', icon: '👑', label: 'VIP' },
                { id: 'gold_plus', icon: '💰', label: '+10%' }
            ],
            isPremium: false,
            claimedRewards: [],
            messages: [
                { 
                    id: 'welcome-1', 
                    author: 'СИСТЕМА', 
                    avatar: '/assets/images/ui/system_icon.png',
                    text: 'Приветствуем в Masters of the Wild! 🐉⚔️', 
                    type: 'system', 
                    timestamp: Date.now(),
                    level: 1,
                    rankIcon: ''
                }
            ],

            // --- ЭКШЕНЫ РЕСУРСОВ ---
            addGold: (amount: number) => set((state: any) => ({ gold: state.gold + amount })),
            addCrystals: (amount: number) => set((state: any) => ({ crystals: state.crystals + amount })),
            addEnergy: (amount: number) => set((state: any) => ({ energy: state.energy + amount })),
            addMessage: (text: string, author = 'Motar', type = 'common') => {
                const state = get();
                const currentRating = state.rating || 0;
                const rankInfo = getRankInfo(currentRating);
                
                // Сначала определяем реальное имя
                const finalAuthor = (author === 'Игрок' || author === 'Мастер' || author === 'Motar' || !author) ? (state.vkUser?.first_name || 'Мастер') : author;
                const finalAvatar = state.vkUser?.photo_200 || "/assets/images/avatars/панда.webp";
                
                const newMessage = {
                    id: Math.random().toString(36).substr(2, 9),
                    author: finalAuthor,
                    avatar: finalAvatar, // Добавляем аватар
                    text,
                    type,
                    timestamp: Date.now(),
                    level: state.level || 1,
                    rankIcon: rankInfo.icon,
                    vipLevel: state.vipLevel || 0,
                    isTop1: finalAuthor === (state.vkUser?.first_name || 'Мастер')
                };
                set((state: any) => ({
                    messages: [...state.messages.slice(-49), newMessage]
                }));
            },
            removeMessage: (id: string) => set((state: any) => ({
                messages: state.messages.filter((m: any) => m.id !== id)
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
                            rankIcon: ''
                        }
                    ]
                });
            },
            addExp: (amount: number) => set((state: any) => {
                let newExp = state.exp + amount;
                let newLevel = state.level;
                let maxExp = newLevel * 600;

                while (newExp >= maxExp) {
                    newExp -= maxExp;
                    newLevel += 1;
                    maxExp = newLevel * 600;
                }

                return { 
                    exp: newExp, 
                    level: newLevel,
                    title: getPlayerTitle(newLevel)
                };
            }),

            addRating: (amount: number) => set((state: any) => {
                const newRating = state.rating + amount;
                const oldRank = getRankInfo(state.rating).name;
                const newRank = getRankInfo(newRating).name;
                
                // Если подняли ранг до Легенды
                if (newRank === 'ЛЕГЕНДА' && oldRank !== 'ЛЕГЕНДА') {
                    get().broadcastEvent('RANK_UP', { playerName: 'Motar', rankName: 'ЛЕГЕНДА' });
                }
                
                return { rating: newRating };
            }),

            // --- ГЛОБАЛЬНЫЕ СОБЫТИЯ (АНОНСЫ) ---
            broadcastEvent: (type: 'RANK_UP' | 'LEVEL_UP' | 'ITEM_DROP', payload: any) => {
                const { addMessage } = get();
                if (type === 'RANK_UP' && payload.rankName === 'ЛЕГЕНДА') {
                    addMessage(
                        `🌟 ВЕЛИКОЕ СОБЫТИЕ: Мастер ${payload.playerName} достиг ранга ЛЕГЕНДА! Весь мир склоняется перед его силой! 🐉`,
                        'ГЕРОЛЬД',
                        'system'
                    );
                }
                if (type === 'LEVEL_UP' && payload.level >= 80) {
                    addMessage(
                        `⚔️ ТРИУМФ: ${payload.playerName} достиг 80 уровня! Его мощь не знает границ! 🛡️`,
                        'ГЕРОЛЬД',
                        'system'
                    );
                }
            },

            // --- МОНЕТИЗАЦИЯ ---
            watchAdForReward: async (type: 'GOLD' | 'ENERGY' | 'CRYSTAL') => {
                const success = await showRewardedVideo();
                if (success) {
                    if (type === 'GOLD') get().addGold(1000);
                    if (type === 'ENERGY') get().addEnergy(10);
                    if (type === 'CRYSTAL') get().addCrystals(10);
                    // Синхронизируем сразу после награды
                    syncService.syncPlayerData();
                    return true;
                }
                return false;
            },

            buyCrystalsPack: async (packId: string) => {
                const success = await purchaseStars(packId);
                if (success) {
                    let amount = 0;
                    if (packId === 'gems_100') amount = 100;
                    if (packId === 'gems_500') amount = 500;
                    if (packId === 'gems_1000') amount = 1200; // Бонус!

                    if (amount > 0) {
                        get().addCrystals(amount);
                        get().addVipExp(amount); // 1 Алмаз = 1 VIP XP
                        syncService.syncPlayerData();
                        return true;
                    }
                }
                return false;
            },

            // Логика восстановления энергии (1 ед / 5 мин)
            restoreEnergy: () => set((state: any) => {
                if (state.energy >= state.maxEnergy) {
                    return { lastEnergyUpdate: Date.now() };
                }

                const now = Date.now();
                const diff = now - state.lastEnergyUpdate;
                const FIVE_MIN = 5 * 60 * 1000;

                if (diff >= FIVE_MIN) {
                    const energyToAdd = Math.floor(diff / FIVE_MIN);
                    const newEnergy = Math.min(state.maxEnergy, state.energy + energyToAdd);
                    const leftover = diff % FIVE_MIN;
                    
                    return {
                        energy: newEnergy,
                        lastEnergyUpdate: now - leftover
                    };
                }
                return {};
            }),

            usedPromoCodes: [] as string[],
            redeemPromoCode: (code: string) => {
                const normalizedCode = code.trim().toUpperCase();
                const state = get() as any;

                if (state.usedPromoCodes.includes(normalizedCode)) {
                    return { success: false, message: 'ПРОМОКОД УЖЕ ИСПОЛЬЗОВАН' };
                }

                // Список доступных промокодов
                const promoCodes: Record<string, { gold?: number, crystals?: number, energy?: number }> = {
                    'START': { gold: 1000, crystals: 10 },
                    'WILD': { energy: 10 },
                    'DIAMONDS': { crystals: 25 },
                    'MOTAR': { gold: 5000, crystals: 100, energy: 50 },
                };

                const reward = promoCodes[normalizedCode];

                if (reward) {
                    // Создаем письмо с наградами
                    const mailRewards = [];
                    if (reward.gold) mailRewards.push({ type: 'GOLD', amount: reward.gold });
                    if (reward.crystals) mailRewards.push({ type: 'CRYSTAL', amount: reward.crystals });
                    if (reward.energy) mailRewards.push({ type: 'ENERGY', amount: reward.energy });

                    const newMail = {
                        id: `promo_${normalizedCode}_${Date.now()}`,
                        from: 'МУДРЫЙ ФИЛИН',
                        subject: 'ДАР ЗА ТАЙНЫЙ ШИФР!',
                        body: `Приветствую тебя, путник! Лесные духи нашептали мне, что ты узнал древний код "${normalizedCode}". \n\nЗа твою проницательность и мудрость они посылают тебе эти дары. Пусть они помогут тебе в твоем нелегком приключении по Великому Лесу! \n\nИспользуй их с умом, мастер!`,
                        date: new Date().toLocaleDateString(),
                        isRead: false,
                        tab: 'INBOX',
                        rewards: mailRewards
                    };

                    set((s: any) => ({
                        usedPromoCodes: [...s.usedPromoCodes, normalizedCode],
                        mail: [newMail, ...s.mail]
                    }));

                    return { success: true, message: 'ПИСЬМО С ПОДАРКОМ ОТПРАВЛЕНО ВО ВХОДЯЩИЕ!' };
                }

                return { success: false, message: 'НЕВЕРНЫЙ ПРОМОКОД' };
            },

            addVipExp: (amount: number) => set((state: any) => {
                let newExp = state.vipExp + amount;
                let newLevel = state.vipLevel;
                
                // Простая прогрессия: уровень 0 требует 1000, уровень 1 требует 2000 и т.д.
                let expNeeded = (newLevel + 1) * 1000;
                
                while (newExp >= expNeeded) {
                    newExp -= expNeeded;
                    newLevel += 1;
                    expNeeded = (newLevel + 1) * 1000;
                }
                
                return { vipExp: newExp, vipLevel: newLevel };
            }),

            // --- ИНВЕНТАРЬ (стартовые предметы) ---
            inventory: [
                { id: 'stick', type: 'WEAPONS', rarity: 'COMMON', level: 1 },
                { id: 'starter_helm', type: 'HELMETS', rarity: 'COMMON', level: 1 },
                { id: 'starter_armor', type: 'ARMOR', rarity: 'COMMON', level: 1 },
                { id: 'starter_shield', type: 'SHIELDS', rarity: 'COMMON', level: 1 },
            ],
            heroEquipment: {
                'panda': {
                    WEAPONS: 'stick',
                    HELMETS: 'starter_helm',
                    ARMOR: 'starter_armor',
                    SHIELDS: 'starter_shield',
                    SHOULDERS: null,
                    BOOTS: null,
                    PANTS: null
                },
                'wolf_knight': {
                    WEAPONS: null,
                    HELMETS: null,
                    ARMOR: null,
                    SHIELDS: null,
                    SHOULDERS: null,
                    BOOTS: null,
                    PANTS: null
                }
            },
            get equippedItems() {
                const currentHeroId = this.selectedHeroId || 'panda';
                return this.heroEquipment[currentHeroId] || {};
            },

            // --- ГЕРОИ ---
            selectedHeroId: 'panda',
            heroGalleryId: 'panda',
            ownedHeroes: ['panda'],
            tutorialStep: 0,
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
                    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 дней
                    rewards: [
                        { type: 'GOLD', amount: 1000 },
                        { type: 'CRYSTALS', amount: 50 }
                    ]
                }
            ],
            friends: [],
            friendRequests: [],
            clanId: null,
            clanData: null,
            clanCoins: 0,
            heroes: {
                'panda': { strength: 52, agility: 20, stamina: 32 },
                'wolf_knight': { strength: 65, agility: 25, stamina: 45 }
            },
            heroTalents: {
                'panda': {},
                'wolf_knight': {}
            },
            combatLogs: [],
            addCombatLog: (msg: string) => set((state: any) => ({
                combatLogs: [...state.combatLogs.slice(-49), `${new Date().toLocaleTimeString()} - ${msg}`]
            })),
            clearCombatLogs: () => set({ combatLogs: [] }),

            // --- КВЕСТЫ ---
            dailyQuests: [],
            lastDailyRefresh: 0,

            // --- ИНТЕРФЕЙС ---
            activeScreen: 'INTRO', // Стартуем всегда с интро
            showIntro: true,

            heroesInitialTab: 'LIST',
            uiTheme: 'DARK',
            showFps: false,
            musicVolume: 70,
            soundVolume: 85,
            graphicsQuality: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'LOW' : 'ULTRA',
            notificationsEnabled: true,
            pveStage: 1,
            maxPveStage: 1,
            timeScale: 1,
            isGodMode: false,
            isOneShot: false,
            isEnemyFrozen: false,
            hasInfiniteEnergy: false,
            activePveEnemy: null,

            vkUser: null,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isPowerSaving: false,
            isMuted: false,
            winStreak: 0,
            playerId: 'MW-' + Math.random().toString(36).substr(2, 9).toUpperCase(),

            // --- ЭКШЕНЫ ИГРОКА ---
            setGodMode: (val: boolean) => set({ isGodMode: val }),
            setOneShot: (val: boolean) => set({ isOneShot: val }),
            setIsEnemyFrozen: (val: boolean) => set({ isEnemyFrozen: val }),
            setHasInfiniteEnergy: (val: boolean) => set({ hasInfiniteEnergy: val }),
            setTimeScale: (val: number) => set({ timeScale: val }),
            setLevel: (val: number) => set({ level: val, title: getPlayerTitle(val) }),
            setGold: (val: number) => set({ gold: val }),
            setCrystals: (val: number) => set({ crystals: val }),
            setTalentPoints: (val: number) => set((state: any) => ({
                heroTalents: { ...state.heroTalents, panda: { ...state.heroTalents.panda, points: val } }
            })),
            resetAllProgress: () => {
                const state = get();
                set({
                    level: 1,
                    exp: 0,
                    rating: 0,
                    dailyQuests: (state.dailyQuests || []).map((q: any) => ({
                        ...q,
                        progress: 0,
                        isClaimed: false
                    })),
                    lastDailyRefresh: Date.now(), // Обновляем время, чтобы не сработало авто-обновление
                    title: getPlayerTitle(1)
                });
            },
            addClanCoins: (amount: number) => set((state: any) => ({ clanCoins: state.clanCoins + amount })),
            consumeEnergy: () => {
                const state = get() as any;
                if (state.hasInfiniteEnergy) return true;
                if (state.energy > 0) {
                    set({ energy: state.energy - 1 });
                    return true;
                }
                return false;
            },

            // --- ЭКШЕНЫ ИНВЕНТАРЯ ---
            addItemToInventory: (item: any) => set((state: any) => {
                const itemObj = typeof item === 'string' ? { id: item } : item;
                const itemId = String(itemObj.id);
                if (!ITEMS_DATABASE[itemId]) return state;
                if (state.inventory.some((i: any) => String(i.id) === itemId)) return state;
                return { inventory: [...state.inventory, itemObj] };
            }),
            clearInventory: () => set({ 
                inventory: [], 
                heroEquipment: {
                    'panda': { WEAPONS: null, HELMETS: null, ARMOR: null, SHIELDS: null, SHOULDERS: null, BOOTS: null, PANTS: null },
                    'wolf_knight': { WEAPONS: null, HELMETS: null, ARMOR: null, SHIELDS: null, SHOULDERS: null, BOOTS: null, PANTS: null }
                },
                equippedWeaponId: null, equippedHelmId: null, equippedArmorId: null, equippedShieldId: null
            }),
            sellItem: (id: string) => {
                const state = get();
                const itemInInv = state.inventory.find((i: any) => i.id === id);
                if (!itemInInv) return;

                // Нельзя продать экипированное
                const isEquipped = Object.values(state.equippedItems).some(val => val === id);
                if (isEquipped) {
                    alert('Нельзя продать экипированный предмет!');
                    return;
                }

                const data = ITEMS_DATABASE[id] as any;
                const sellPrice = Math.floor((data?.priceGold || 100) * 0.5);

                state.addGold(sellPrice);
                set({
                    inventory: state.inventory.filter((i: any) => i.id !== id)
                });
            },

            equipItem: (id: string) => {
                const state = get();
                const data = ITEMS_DATABASE[id] as any;
                if (!data) return;

                const heroId = state.selectedHeroId || 'panda';
                const subTab = data.subTab; // WEAPONS, HELMETS, etc.

                // 1. Проверяем, не надето ли это на другом герое
                const newHeroEquipment = { ...state.heroEquipment };
                Object.entries(newHeroEquipment).forEach(([hId, gear]: [string, any]) => {
                    if (Object.values(gear).includes(id)) {
                        // Снимаем с предыдущего
                        const updatedGear = { ...gear };
                        Object.keys(updatedGear).forEach(slot => {
                            if (updatedGear[slot] === id) delete updatedGear[slot];
                        });
                        newHeroEquipment[hId] = updatedGear;
                    }
                });

                // 2. Надеваем на текущего героя
                const currentGear = { ...(newHeroEquipment[heroId] || {}) };
                currentGear[subTab] = id;
                newHeroEquipment[heroId] = currentGear;

                set({ heroEquipment: newHeroEquipment });

                // Для обратной совместимости, если где-то используются старые поля
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

                Object.keys(currentGear).forEach(slot => {
                    if (currentGear[slot] === id) delete currentGear[slot];
                });

                newHeroEquipment[heroId] = currentGear;
                set({ heroEquipment: newHeroEquipment });

                // Сброс старых полей
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
                    equippedShieldId: bestShield?.id || state.equippedShieldId
                });
            },

            buyItem: (itemId: string, currencyType: 'gold' | 'gem') => {
                const state = get() as any;
                const itemData = ITEMS_DATABASE[itemId] as any;
                if (!itemData) return false;

                const isBankItem = itemData.mainTab === 'BANK';

                // Проверка: для обычных вещей — нет ли уже такого предмета
                if (!isBankItem && state.inventory.some((i: any) => String(i.id) === itemId)) {
                    console.warn("[Shop] Item already owned");
                    return false;
                }

                const price = currencyType === 'gold' ? itemData.priceGold : itemData.priceGem;
                const balance = currencyType === 'gold' ? state.gold : state.crystals;

                if (price !== undefined && balance >= price) {
                    const newBalanceKey = currencyType === 'gold' ? 'gold' : 'crystals';

                    if (isBankItem) {
                        // Обработка покупки ресурсов (Золото, Алмазы, Энергия)
                        const amount = itemData.amount || 0;
                        const subTab = itemData.subTab;

                        if (subTab === 'GOLD') {
                            set({ [newBalanceKey]: balance - price, gold: state.gold + amount });
                        } else if (subTab === 'GEMS') {
                            set({ [newBalanceKey]: balance - price, crystals: state.crystals + amount });
                        } else if (subTab === 'ENERGY') {
                            set({ [newBalanceKey]: balance - price, energy: state.energy + amount });
                        }
                    } else {
                        // Обычный предмет в инвентарь
                        set({
                            [newBalanceKey]: balance - price,
                            inventory: [...state.inventory, { id: itemId, type: itemData.subTab, rarity: itemData.rarity, level: 1 }]
                        });
                    }

                    // [Quest] Track progress for spending gold
                    if (currencyType === 'gold') {
                        get().updateQuestProgress('SPEND_GOLD', price);
                    }

                    return true;
                }

                return false;
            },
            // --- ЭКШЕНЫ ГЕРОЕВ ---
            setSelectedHeroId: (id: string) => set({ selectedHeroId: id }),
            setHeroGalleryId: (id: string) => set({ heroGalleryId: id }),
            unlockHero: (heroId: string) => set((state: any) => {
                if (state.ownedHeroes.includes(heroId)) return state;
                return { ownedHeroes: [...state.ownedHeroes, heroId] };
            }),
            spendGold: (amount: number) => set((state: any) => ({ gold: Math.max(0, state.gold - amount) })),
            spendDiamonds: (amount: number) => set((state: any) => ({ crystals: Math.max(0, state.crystals - amount) })),
            upgradeTalent: (heroId: string, talentId: string) => set((state: any) => {
                const currentHeroTalents = state.heroTalents[heroId] || {};
                const currentLevel = currentHeroTalents[talentId] || 0;

                // [Quest] Track progress for upgrading
                get().updateQuestProgress('UPGRADE', 1);

                return {
                    heroTalents: {
                        ...state.heroTalents,
                        [heroId]: {
                            ...currentHeroTalents,
                            [talentId]: currentLevel + 1
                        }
                    }
                };
            }),
            resetTalents: (heroId: string) => set((state: any) => {
                const talents = { ...state.heroTalents };
                talents[heroId] = {};
                return { heroTalents: talents };
            }),
            getCalculatedStats: (heroId: string) => {
                const state = get() as any;
                const heroData = HEROES_DB.find(h => h.id === heroId);
                if (!heroData) return null;

                const equipment = state.heroEquipment[heroId] || {};
                const weapon = equipment.WEAPONS ? ITEMS_DATABASE[equipment.WEAPONS] : null;
                const helm = equipment.HELMETS ? ITEMS_DATABASE[equipment.HELMETS] : null;
                const armor = equipment.ARMOR ? ITEMS_DATABASE[equipment.ARMOR] : null;
                const shield = equipment.SHIELDS ? ITEMS_DATABASE[equipment.SHIELDS] : null;

                const allItems = [weapon, helm, armor, shield].filter(Boolean) as IEquipmentStats[];

                // Базовые статы героя (конвертация из RPG-характеристик)
                const base = {
                    hp: heroData.stats.stamina * 10,
                    attack: heroData.stats.strength * 2,
                    defense: heroData.stats.stamina * 0.5,
                    speed: 1 + (heroData.stats.agility * 0.05),
                    critChance: heroData.stats.agility * 0.5,
                    evasion: heroData.stats.agility * 0.2,
                    resilience: heroData.stats.stamina * 0.1,
                    lifesteal: 0,
                    penetration: 0,
                    critDamage: 1.5
                };

                // Итоговые статы
                const total = { ...base };

                // Добавляем бонусы от талантов
                const talents = state.heroTalents[heroId] || {};
                Object.entries(talents).forEach(([tId, lvl]: [string, any]) => {
                    const level = lvl as number;
                    if (level <= 0) return;

                    // Логика бонусов талантов
                    if (tId === 'atk_base') total.attack *= (1 + (level * 0.05)); // +5% за уровень
                    if (tId === 'atk_crit') total.critChance += (level * 2);      // +2% за уровень
                    if (tId === 'atk_pen') total.penetration += (level * 10);    // +10 за уровень

                    if (tId === 'def_base') total.hp *= (1 + (level * 0.05));    // +5% за уровень
                    if (tId === 'def_res') total.resilience += (level * 5);      // +5 за уровень
                    if (tId === 'def_eva') total.evasion += (level * 2);         // +2% за уровень

                    if (tId === 'mas_base') total.speed += (level * 2);          // +2 скорости за уровень
                    if (tId === 'mas_spd') total.speed *= (1 + (level * 0.03));  // +3% скорости за уровень
                    if (tId === 'mas_ult') total.critDamage += 0.2;              // Пример бонуса для ульты
                });

                // Добавляем бонусы от предметов
                allItems.forEach(item => {
                    if (item.hpBonus) total.hp += item.hpBonus;
                    if (item.attackBonus) total.attack += item.attackBonus;
                    if (item.defenseBonus) total.defense += item.defenseBonus;
                    if (item.critBonus) total.critChance += (item.critBonus * 100);
                    if (item.speedBonus) total.speed += (item.speedBonus * 10);
                    if (item.evasion) total.evasion += item.evasion;
                    if (item.resilience) total.resilience += item.resilience;
                    if (item.lifesteal) total.lifesteal += item.lifesteal;
                    if (item.penetration) total.penetration += item.penetration;
                    if (item.critDamage) total.critDamage += item.critDamage;
                });

                return {
                    base,
                    total,
                    weaponTexture: (weapon as IEquipmentStats)?.textureKey || null
                };
            },

            // --- ЭКШЕНЫ КВЕСТОВ ---
            refreshDailyQuests: () => {
                const shuffled = [...QUESTS_POOL].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4).map(q => ({
                    questId: q.id, progress: 0, isClaimed: false
                }));
                set({ dailyQuests: selected, lastDailyRefresh: Date.now() });
            },
            updateQuestProgress: (type: string, amount: number) => set((state: any) => {
                const newQuests = state.dailyQuests.map((dq: any) => {
                    const questData = QUESTS_POOL.find(q => q.id === dq.questId);
                    if (questData && questData.type === type && !dq.isClaimed) {
                        // Для серий (WIN_STREAK) мы устанавливаем значение напрямую
                        const newProgress = type === 'WIN_STREAK' 
                            ? amount 
                            : Math.min(questData.target, dq.progress + amount);
                        return { ...dq, progress: newProgress };
                    }
                    return dq;
                });
                return { dailyQuests: newQuests };
            }),
            claimQuestReward: (questId: string) => {
                const state = get() as any;
                const dq = state.dailyQuests.find((q: any) => q.questId === questId);
                const qData = QUESTS_POOL.find(q => q.id === questId);

                if (dq && qData && dq.progress >= qData.target && !dq.isClaimed) {
                    const newQuests = state.dailyQuests.map((q: any) =>
                        q.questId === questId ? { ...q, isClaimed: true } : q
                    );
                    
                    // Начисляем все награды
                    state.addGold(qData.rewardGold);
                    state.addCrystals(qData.rewardGems);
                    state.addExp(qData.rewardExp);

                    set({ dailyQuests: newQuests });
                }
            },

            // --- ЭКШЕНЫ ИНТЕРФЕЙСА ---
            setActiveScreen: (screen: any) => set({ activeScreen: screen }),
            goToInventory: () => set({ activeScreen: 'HEROES', heroesInitialTab: 'HERO' }),
            setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
            setIsPowerSaving: (enabled: boolean) => set({ isPowerSaving: enabled }),
            setIsMuted: (enabled: boolean) => {
                const isMuted = enabled;
                set({ isMuted });
                if (isMuted) {
                    audioService.setMusicVolume(0);
                    audioService.setSFXVolume(0);
                } else {
                    const state = get();
                    audioService.setMusicVolume(state.musicVolume / 100);
                    audioService.setSFXVolume(state.soundVolume / 100);
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
            markMailAsRead: (id: string) => set((state: any) => ({
                mail: state.mail.map((m: any) => m.id === id ? { ...m, isRead: true } : m)
            })),
            deleteMail: (id: string) => set((state: any) => {
                const mailItem = state.mail.find((m: any) => m.id === id);
                // Нельзя удалять приветствие и новости
                if (mailItem?.id === 'welcome-mail' || mailItem?.tab === 'NEWS') return state;

                return {
                    mail: state.mail.filter((m: any) => m.id !== id)
                };
            }),
            archiveMail: (id: string) => set((state: any) => ({
                mail: state.mail.map((m: any) => m.id === id ? { ...m, tab: 'ARCHIVE' } : m)
            })),
            toggleMailStar: (id: string) => set((state: any) => ({
                mail: state.mail.map((m: any) => m.id === id ? { ...m, isStarred: !m.isStarred } : m)
            })),
            claimMailReward: (id: string) => {
                const mail = get().mail.find((m: any) => m.id === id);
                if (mail && mail.rewards) {
                    mail.rewards.forEach((r: any) => {
                        if (r.type === 'GOLD') get().addGold(r.amount);
                        if (r.type === 'CRYSTALS') get().addCrystals(r.amount);
                        if (r.type === 'ENERGY') get().addEnergy(r.amount);
                    });
                    set((state: any) => ({
                        mail: state.mail.map((m: any) => m.id === id ? { ...m, rewards: null, isRead: true } : m)
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
                    mail: state.mail.map((m: any) =>
                        m.tab === 'INBOX' ? { ...m, rewards: null, isRead: true } : m
                    )
                }));
            },
            sendFeedback: (category: string, text: string) => {
                const state = get();
                const feedbackData = {
                    category,
                    text,
                    userId: state.playerId,
                    level: state.level,
                    platform: navigator.platform,
                    version: 'v1.1.0',
                    timestamp: Date.now()
                };
                console.log('🚀 Feedback Sent:', feedbackData);
            },
            removeFriend: (id: string) => set((state: any) => ({
                friends: state.friends.filter((f: any) => f.id !== id)
            })),
            acceptFriendRequest: (id: string) => set((state: any) => {
                const request = state.friendRequests.find((r: any) => r.id === id);
                if (!request) return state;
                return {
                    friends: [...state.friends, request],
                    friendRequests: state.friendRequests.filter((r: any) => r.id !== id)
                };
            }),
            declineFriendRequest: (id: string) => set((state: any) => ({
                friendRequests: state.friendRequests.filter((r: any) => r.id !== id)
            })),
            sendGift: (friendId: string) => set((state: any) => ({
                friends: state.friends.map((f: any) => f.id === friendId ? { ...f, giftSent: true } : f)
            })),
            collectAllGifts: () => set((state: any) => {
                const hasGifts = state.friends.some((f: any) => f.hasGift);
                if (!hasGifts) return state;
                return {
                    friends: state.friends.map((f: any) => ({ ...f, hasGift: false, giftSent: true })),
                    gold: state.gold + (state.friends.filter((f: any) => f.hasGift).length * 100)
                };
            }),
            addFriend: (friend: any) => set((state: any) => ({
                friends: [...state.friends, friend],
                friendRequests: state.friendRequests.filter((r: any) => r.id !== friend.id)
            })),
            setRating: (rating: number) => set({ rating: Math.max(0, rating) }),
            joinClan: (id: string, data: any) => set({ clanId: id, clanData: data }),
            leaveClan: () => set({ clanId: null, clanData: null }),
            setVkUser: (user: any) => set({ vkUser: user }),
            setAvatar: (avatar: string) => set({ avatar }),
            setFrame: (frame: string) => set({ frame }),
            setTitle: (title: string) => set({ title }),
            shopInitialTab: null as string | null,
            shopInitialSubTab: null as string | null,

            // --- НАВИГАЦИЯ ---
            setScreen: (screen: any) => set({ activeScreen: screen }),
            goToMainMenu: () => set({ activeScreen: 'MAIN_MENU' }),
            goToCity: () => set({ activeScreen: 'CITY' }),
            goToArena: () => set({ activeScreen: 'BATTLE' }), // Или 'ARENA', если есть такой экран
            goToShop: (tab = 'ARSENAL', subTab = null) => set({ 
                activeScreen: 'SHOP', 
                shopInitialTab: tab,
                shopInitialSubTab: subTab
            }),
            goToHeroes: (tab = 'LIST') => set({ activeScreen: 'HEROES', heroesInitialTab: tab }),

            // --- PVE ЛОГИКА ---
            startPveBattle: (stage: number) => {
                const isBoss = stage % 5 === 0;
                const difficultyMult = 1 + (stage * 0.15);
                const enemy = {
                    id: `pve_mob_${stage}`,
                    name: isBoss ? `СТРАЖ ОБИТЕЛИ (Этаж ${stage})` : `ДРЕВНИЙ ДУХ (Этаж ${stage})`,
                    level: stage,
                    hp: Math.floor(100 * difficultyMult * (isBoss ? 2 : 1)),
                    attack: Math.floor(15 * difficultyMult * (isBoss ? 1.5 : 1)),
                    defense: Math.floor(10 * difficultyMult),
                    image: AssetsMap.CHARACTERS.PANDA_FULL,
                    isBoss
                };
                set({ activeScreen: 'BATTLE', activePveEnemy: enemy });
            },

            completePveBattle: (win: boolean) => {
                const { pveStage, maxPveStage, winStreak } = get();
                if (win) {
                    const nextStage = pveStage + 1;
                    const isBoss = pveStage % 5 === 0;
                    const newStreak = winStreak + 1;
                    
                    set((state: any) => ({
                        gold: state.gold + (pveStage * 100),
                        crystals: isBoss ? state.crystals + 20 : state.crystals,
                        pveStage: nextStage,
                        maxPveStage: Math.max(maxPveStage, nextStage),
                        winStreak: newStreak,
                        activeScreen: 'CITY',
                        activePveEnemy: null
                    }));

                    // Обновляем квесты на победы и серии
                    get().updateQuestProgress('WIN', 1);
                    get().updateQuestProgress('WIN_STREAK', newStreak);
                    get().updateQuestProgress('PLAY', 1);
                } else {
                    set({ 
                        winStreak: 0, 
                        activeScreen: 'CITY', 
                        activePveEnemy: null 
                    });
                    // Сбрасываем прогресс серии в квестах
                    get().updateQuestProgress('WIN_STREAK', 0);
                    get().updateQuestProgress('PLAY', 1);
                }

                // Синхронизируем прогресс с Firebase после боя
                syncService.syncPlayerData();
            },
        }),
        {
            name: 'game-storage',
            storage: createJSONStorage(() => getStorage()),
            version: 19, // Поднято до 19: Добавлено 100к ресурсов
        }
    )
);
