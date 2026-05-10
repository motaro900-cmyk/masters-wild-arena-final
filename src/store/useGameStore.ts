import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { ITEMS_DATABASE, calculateItemPower, IEquipmentStats } from '../game/configs/ItemsConfig';
import { HEROES_DB } from '../configs/HeroesConfig';
import { QUESTS_POOL } from '../configs/QuestsConfig';
import { audioService } from '../services/AudioService';
import { AssetsMap } from '../configs/AssetsMap';

/**
 * Единый стор с использованием Slice-подхода (внутренняя организация)
 */
export const useGameStore = create<any>()(
    persist(
        (set, get) => ({
            // --- СОСТОЯНИЕ ИГРОКА ---
            level: 1,
            exp: 0,
            gold: 25850,
            crystals: 1250,
            energy: 6,
            maxEnergy: 10,
            avatar: 'панда.png',
            frame: 'Рамка 6.png',
            title: 'ЛЕГЕНДА АРЕНЫ',
            bpLevel: 1,
            bpExp: 250,
            isPremium: false,
            claimedRewards: [],

            // --- ИНВЕНТАРЬ ---
            inventory: [],
            equippedWeaponId: null,
            equippedHelmId: null,
            equippedArmorId: null,
            equippedShieldId: null,

            // --- ГЕРОИ ---
            selectedHeroId: 'panda',
            heroGalleryId: 'panda',
            ownedHeroes: ['panda', 'boar'],
            heroes: {
                'panda': { strength: 52, agility: 20, stamina: 32 },
                'boar': { strength: 68, agility: 18, stamina: 38 }
            },

            // --- КВЕСТЫ ---
            dailyQuests: [],
            lastDailyRefresh: 0,

            // --- ИНТЕРФЕЙС ---
            activeScreen: 'MAIN_MENU',
            shopInitialTab: 'ARSENAL',
            heroesInitialTab: 'LIST',
            uiTheme: 'DARK',
            showFps: false,
            musicVolume: 70,
            soundVolume: 85,
            graphicsQuality: 'ULTRA',
            notificationsEnabled: true,
            vkUser: null,

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
            equipWeapon: (id: string) => set({ equippedWeaponId: id }),
            equipHelm: (id: string) => set({ equippedHelmId: id }),
            equipArmor: (id: string) => set({ equippedArmorId: id }),
            equipShield: (id: string) => set({ equippedShieldId: id }),

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

            sellItem: (itemId: string) => set((state: any) => {
                const item = state.inventory.find((i: any) => i.id === itemId);
                if (!item) return state;
                
                const data = ITEMS_DATABASE[itemId] as any;
                if (!data) return state;

                // Цена продажи = 50% от цены покупки
                const price = Math.floor((data.price || 100) * 0.5);

                // Нельзя продать экипированное
                const isEquipped = itemId === state.equippedWeaponId || itemId === state.equippedHelmId || 
                                 itemId === state.equippedArmorId || itemId === state.equippedShieldId;
                if (isEquipped) return state;

                return {
                    inventory: state.inventory.filter((i: any) => i.id !== itemId),
                    gold: state.gold + price
                };
            }),

            // --- ЭКШЕНЫ ГЕРОЕВ ---
            setSelectedHeroId: (id: string) => set({ selectedHeroId: id }),
            setHeroGalleryId: (id: string) => set({ heroGalleryId: id }),
            getCalculatedStats: (heroId: string) => {
                const state = get() as any;
                const heroData = HEROES_DB.find(h => h.id === heroId);
                if (!heroData) return null;

                const weapon = state.equippedWeaponId ? ITEMS_DATABASE[state.equippedWeaponId] : null;
                const helm = state.equippedHelmId ? ITEMS_DATABASE[state.equippedHelmId] : null;
                const armor = state.equippedArmorId ? ITEMS_DATABASE[state.equippedArmorId] : null;
                const shield = state.equippedShieldId ? ITEMS_DATABASE[state.equippedShieldId] : null;

                const allItems = [weapon, helm, armor, shield].filter(Boolean) as IEquipmentStats[];

                // Базовые статы героя
                let hp = heroData.baseStats.hp;
                let attack = heroData.baseStats.attack;
                let defense = heroData.baseStats.defense;
                let speed = heroData.baseStats.speed;
                let crit = heroData.baseStats.crit;
                
                // Новые базовые статы
                let evasion = heroData.baseStats.evasion || 0;
                let resilience = heroData.baseStats.resilience || 0;
                let lifesteal = heroData.baseStats.lifesteal || 0;
                let penetration = heroData.baseStats.penetration || 0;
                let critDamage = heroData.baseStats.critDamage || 1.5;

                // Добавляем бонусы от предметов
                allItems.forEach(item => {
                    if (item.hpBonus) hp += item.hpBonus;
                    if (item.attackBonus) attack += item.attackBonus;
                    if (item.defenseBonus) defense += item.defenseBonus;
                    if (item.critBonus) crit += (item.critBonus * 100); // Предполагаем 0.1 -> 10%
                    if (item.speedBonus) speed += (item.speedBonus * 10); // Предполагаем 0.1 -> 1
                    
                    if (item.evasion) evasion += item.evasion;
                    if (item.resilience) resilience += item.resilience;
                    if (item.lifesteal) lifesteal += item.lifesteal;
                    if (item.penetration) penetration += item.penetration;
                    if (item.critDamage) critDamage += item.critDamage;
                });

                return {
                    hp, 
                    attack, 
                    defense, 
                    speed, 
                    critChance: crit,
                    evasion,
                    resilience,
                    lifesteal,
                    penetration,
                    critDamage,
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
            setScreen: (screen: any) => set({ activeScreen: screen }),
            setActiveScreen: (screen: any) => set({ activeScreen: screen }),
            goToMainMenu: () => set({ activeScreen: 'MAIN_MENU' }),
            goToInventory: () => set({ activeScreen: 'HEROES', heroesInitialTab: 'HERO' }),
            goToArena: () => set({ activeScreen: 'BATTLE' }),
            goToShop: (tab = 'ARSENAL') => set({ activeScreen: 'SHOP', shopInitialTab: tab }),
            goToHeroes: (tab = 'LIST') => set({ activeScreen: 'HEROES', heroesInitialTab: tab }),
            setUiTheme: (theme: string) => set({ uiTheme: theme }),
            setShowFps: (show: boolean) => set({ showFps: show }),
            setMusicVolume: (val: number) => {
                set({ musicVolume: val });
                audioService.setMusicVolume(val / 100);
            },
            setSoundVolume: (val: number) => {
                set({ soundVolume: val });
                audioService.setSFXVolume(val / 100);
            },
            setGraphicsQuality: (val: string) => set({ graphicsQuality: val }),
            setNotificationsEnabled: (val: boolean) => set({ notificationsEnabled: val }),
            setVkUser: (user: any) => set({ vkUser: user }),
            setAvatar: (avatar: string) => set({ avatar }),
            setFrame: (frame: string) => set({ frame }),
            setTitle: (title: string) => set({ title }),
        }),
        {
            name: 'game-storage',
            storage: createJSONStorage(() => getStorage()),
            version: 2, // Поднимаем версию для сброса старого инвентаря
        }
    )
);
