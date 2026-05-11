import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { ITEMS_DATABASE, calculateItemPower, IEquipmentStats } from '../game/configs/ItemsConfig';
import { HEROES_DB } from '../configs/HeroesConfig';
import { QUESTS_POOL } from '../configs/QuestsConfig';
import { audioService } from '../services/AudioService';
import { AssetsMap } from '../configs/AssetsMap';
import { syncService } from '../services/SyncService';


/**
 * Единый стор с использованием Slice-подхода (внутренняя организация)
 */
export const useGameStore = create<any>()(
    persist(
        (set, get) => ({
            // --- СОСТОЯНИЕ ИГРОКА ---
            level: 1,
            exp: 0,
            gold: 50000,
            crystals: 5000,
            rating: 0,
            energy: 50,
            maxEnergy: 50,
            avatar: 'sprite:sprite-avatar avatar-pos-1',
            frame: 'Рамка 6.png',
            title: 'НОВИЧОК',
            bpLevel: 1,
            bpExp: 0,
            trophies: 0,
            isPremium: false,
            claimedRewards: [],

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
                    SHIELDS: 'starter_shield'
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
                    body: 'Приветствуем тебя, защитник! В Masters of the Wild твоя сила растет с каждой битвой. Мы подготовили для тебя стартовый набор, чтобы путь был легче. Исследуй, сражайся и помни: джунгли не прощают слабости, но вознаграждают храбрых!',
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
                'panda': { strength: 52, agility: 20, stamina: 32 }
            },
            heroTalents: {
                'panda': {}
            },

            // --- КВЕСТЫ ---
            lastDailyRefresh: 0,

            // --- ИНТЕРФЕЙС ---
            activeScreen: 'INTRO', // Стартуем всегда с интро (внутри компонента решим, показывать ли его)
            showIntro: true,

            heroesInitialTab: 'LIST',
            uiTheme: 'DARK',
            showFps: false,
            musicVolume: 70,
            soundVolume: 85,
            graphicsQuality: 'ULTRA',
            notificationsEnabled: true,
            pveStage: 1,
            maxPveStage: 1,
            activePveEnemy: null,

            vkUser: null,
            isPowerSaving: false,
            isMuted: false,
            playerId: 'MW-' + Math.random().toString(36).substr(2, 9).toUpperCase(),

            // --- ЭКШЕНЫ ИГРОКА ---
            addGold: (amount: number) => set((state: any) => ({ gold: state.gold + amount })),
            addCrystals: (amount: number) => set((state: any) => ({ crystals: state.crystals + amount })),
            addEnergy: (amount: number) => set((state: any) => ({ energy: state.energy + amount })),
            addExp: (amount: number) => set((state: any) => {
                let newExp = state.exp + amount;
                let newLevel = state.level;
                const expNeeded = newLevel * 600;
                if (newExp >= expNeeded) {
                    newExp -= expNeeded;
                    newLevel += 1;
                }
                return { exp: newExp, level: newLevel };
            }),
            addClanCoins: (amount: number) => set((state: any) => ({ clanCoins: state.clanCoins + amount })),
            consumeEnergy: () => {
                const state = get() as any;
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

                // Базовые статы героя
                const base = {
                    hp: heroData.baseStats.hp,
                    attack: heroData.baseStats.attack,
                    defense: heroData.baseStats.defense,
                    speed: heroData.baseStats.speed,
                    critChance: heroData.baseStats.crit,
                    evasion: heroData.baseStats.evasion || 0,
                    resilience: heroData.baseStats.resilience || 0,
                    lifesteal: heroData.baseStats.lifesteal || 0,
                    penetration: heroData.baseStats.penetration || 0,
                    critDamage: heroData.baseStats.critDamage || 1.5
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
                        return { ...dq, progress: Math.min(questData.target, dq.progress + amount) };
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
                    set({
                        dailyQuests: newQuests,
                        gold: state.gold + qData.rewardGold,
                        crystals: state.crystals + qData.rewardGems
                    });
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
                
                mails.forEach((m: any) => {
                    if (m.tab === 'INBOX' && m.rewards) {
                        m.rewards.forEach((r: any) => {
                            if (r.type === 'GOLD') totalGold += r.amount;
                            if (r.type === 'CRYSTALS') totalCrystals += r.amount;
                        });
                    }
                });

                if (totalGold > 0) get().addGold(totalGold);
                if (totalCrystals > 0) get().addCrystals(totalCrystals);

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

            // --- НАВИГАЦИЯ ---
            setScreen: (screen: any) => set({ activeScreen: screen }),
            goToMainMenu: () => set({ activeScreen: 'MAIN_MENU' }),
            goToCity: () => set({ activeScreen: 'CITY' }),
            goToArena: () => set({ activeScreen: 'BATTLE' }), // Или 'ARENA', если есть такой экран
            goToShop: (tab = 'ARSENAL') => set({ activeScreen: 'SHOP', shopInitialTab: tab }),
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
                const { pveStage, maxPveStage } = get();
                if (win) {
                    const nextStage = pveStage + 1;
                    const isBoss = pveStage % 5 === 0;
                    set((state: any) => ({ 
                        gold: state.gold + (pveStage * 100),
                        crystals: isBoss ? state.crystals + 20 : state.crystals,
                        pveStage: nextStage,
                        maxPveStage: Math.max(maxPveStage, nextStage),
                        activeScreen: 'CITY',
                        activePveEnemy: null
                    }));
                } else {
                    set({ activeScreen: 'CITY', activePveEnemy: null });
                }
                
                // Синхронизируем прогресс с Firebase после боя
                syncService.syncPlayerData();
            },
        }),
        {
            name: 'game-storage',
            storage: createJSONStorage(() => getStorage()),
            version: 13, // Поднято до 13: Система талантов
        }
    )
);
