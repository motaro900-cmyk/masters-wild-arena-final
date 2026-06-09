import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { showRewardedVideo, purchaseStars } from '../../utils/VKBridge';
import { syncService } from '../../services/SyncService';

const getRarityWeight = (rarity: string, playerLevel: number): number => {
    switch (rarity) {
        case 'COMMON':
            return 60;
        case 'UNCOMMON':
            return playerLevel >= 5 ? 40 : 0;
        case 'RARE':
            return playerLevel >= 15 ? 25 : 0;
        case 'EPIC':
            return playerLevel >= 30 ? 10 : 0;
        case 'LEGENDARY':
            return playerLevel >= 50 ? 4 : 0;
        case 'MYTHIC':
            return playerLevel >= 70 ? 1 : 0;
        default:
            return 10;
    }
};

const generateShopRotation = (playerLevel: number = 1) => {
    const allItems = Object.values(ITEMS_DATABASE).filter(
        (item) =>
            (item.priceGold !== undefined && item.priceGold > 0) ||
            (item.priceGem !== undefined && item.priceGem > 0) ||
            item.priceStars !== undefined ||
            item.isAd === true ||
            item.id === 'pan' ||
            item.id === 'stick',
    );

    const rotation: Record<string, string[]> = {};
    const subTabs = ['WEAPONS', 'SHIELDS', 'HELMETS', 'SHOULDERS', 'ARMOR', 'PANTS', 'BOOTS', 'POTIONS'];

    subTabs.forEach((subTab) => {
        let pool = allItems.filter((item) => item.subTab === subTab);

        // Filter by player level first
        const levelAppropriate = pool.filter((item) => {
            const reqLvl = (item as any).requiredLevel || 1;
            return reqLvl <= playerLevel;
        });

        if (levelAppropriate.length > 0) {
            pool = levelAppropriate;
        } else {
            // Fallback: find the lowest required level available in this category
            const minReqLvl = Math.min(...pool.map((item) => (item as any).requiredLevel || 1));
            pool = pool.filter((item) => ((item as any).requiredLevel || 1) === minReqLvl);
        }

        const selectedItems: any[] = [];
        const pickPool = [...pool];
        for (let i = 0; i < 4 && pickPool.length > 0; i++) {
            const totalWeight = pickPool.reduce(
                (sum, item) => sum + Math.max(1, getRarityWeight(item.rarity || 'COMMON', playerLevel)),
                0,
            );
            if (totalWeight <= 0) break;
            let random = Math.random() * totalWeight;
            let selectedIdx = 0;
            for (let j = 0; j < pickPool.length; j++) {
                const w = Math.max(1, getRarityWeight(pickPool[j].rarity || 'COMMON', playerLevel));
                random -= w;
                if (random <= 0) {
                    selectedIdx = j;
                    break;
                }
            }
            selectedItems.push(pickPool[selectedIdx]);
            pickPool.splice(selectedIdx, 1);
        }

        rotation[subTab] = selectedItems.map((item) => String(item.id));
    });

    return rotation;
};

const generateShopDiscounts = (rotation: Record<string, string[]>) => {
    const discounts: Record<string, number> = {};
    const possibleDiscounts = [10, 15, 20, 25, 30, 40, 50];

    Object.entries(rotation).forEach(([, itemIds]) => {
        if (itemIds.length > 0) {
            // Guarantee at least 1-2 items in each subTab get a discount
            const forcedDiscountIdx = Math.floor(Math.random() * itemIds.length);
            itemIds.forEach((itemId, idx) => {
                if (idx === forcedDiscountIdx || Math.random() < 0.35) {
                    discounts[itemId] = possibleDiscounts[Math.floor(Math.random() * possibleDiscounts.length)];
                }
            });
        }
    });

    return discounts;
};

export const createShopSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ МАГАЗИНА ---
    shopRotation: null as any,
    shopDiscounts: {} as Record<string, number>,
    shopLastRefreshTime: 0,
    shopInitialTab: null as string | null,
    shopInitialSubTab: null as string | null,
    shopReturnScreen: null as string | null,

    // --- ЭКШЕНЫ МАГАЗИНА ---
    goToShop: (tab = 'ARSENAL', subTab = null) => {
        get().initializeShop();
        const currentScreen = get().activeScreen;
        const returnScreen = currentScreen !== 'SHOP' ? currentScreen : get().shopReturnScreen || 'MAIN_MENU';
        set({
            activeScreen: 'SHOP',
            shopInitialTab: tab,
            shopInitialSubTab: subTab,
            shopReturnScreen: returnScreen,
        });
    },

    exitShop: () => {
        const returnScreen = get().shopReturnScreen || 'MAIN_MENU';
        set({
            activeScreen: returnScreen,
            shopReturnScreen: null,
        });

        // Lazily switch the PIXI scene back to MainScreen to keep UI in sync and prevent getting stuck
        import('../../engine/core/SceneManager')
            .then(({ SceneManager }) => {
                import('../../ui/screens/MainScreen')
                    .then(({ MainScreen }) => {
                        try {
                            const sceneManager = SceneManager.getInstance();
                            const currentScene = sceneManager.getCurrentScene();
                            if (
                                currentScene &&
                                (currentScene.label === 'ShopScreen' || currentScene.name === 'ShopScreen')
                            ) {
                                console.log('[ShopSlice] exitShop: Switching PIXI scene back to MainScreen');
                                sceneManager.switchScene(new MainScreen());
                            }
                        } catch (e) {
                            console.error('Error switching PIXI scene on exitShop:', e);
                        }
                    })
                    .catch((err) => console.error('Failed to load MainScreen on exitShop:', err));
            })
            .catch((err) => console.error('Failed to load SceneManager on exitShop:', err));
    },

    initializeShop: () => {
        const state = get() as any;
        const now = Date.now();
        const cooldown = 4 * 60 * 60 * 1000; // 4 hours

        if (!state.shopRotation || !state.shopRotation.WEAPONS || now - (state.shopLastRefreshTime || 0) >= cooldown) {
            const playerLevel = state.level || 1;
            const newRotation = generateShopRotation(playerLevel);

            // Generate random discounts
            const newDiscounts = generateShopDiscounts(newRotation);

            set({
                shopRotation: newRotation,
                shopDiscounts: newDiscounts,
                shopLastRefreshTime: now,
            });
            syncService.debouncedSync();
        }
    },

    refreshShop: async (currencyType?: 'gold' | 'gem' | 'ad') => {
        const state = get() as any;
        let allowed = false;

        if (!currencyType) {
            allowed = true;
        } else if (currencyType === 'gold') {
            if (state.gold >= 500) {
                set({ gold: state.gold - 500 });
                allowed = true;
            }
        } else if (currencyType === 'gem') {
            if (state.crystals >= 10) {
                set({ crystals: state.crystals - 10 });
                allowed = true;
            }
        } else if (currencyType === 'ad') {
            const success = await showRewardedVideo();
            if (success) {
                allowed = true;
            }
        }

        if (allowed) {
            const playerLevel = state.level || 1;
            const newRotation = generateShopRotation(playerLevel);

            // Generate random discounts
            const newDiscounts = generateShopDiscounts(newRotation);

            set({
                shopRotation: newRotation,
                shopDiscounts: newDiscounts,
                shopLastRefreshTime: Date.now(),
            });
            syncService.debouncedSync();
            return true;
        }
        return false;
    },

    buyCrystalsPack: async (packId: string) => {
        // TODO: требует серверной валидации через VK Pay Receipt
        // Временная защита: проверка через VK Bridge
        if (
            process.env.NODE_ENV !== 'development' &&
            typeof window !== 'undefined' &&
            !(window as any).vkBridgeInitialized
        ) {
            console.warn('[Shop] Direct purchase blocked outside VK environment');
            return false;
        }

        const success = await purchaseStars(packId);
        if (success) {
            let amount = 0;
            if (packId === 'gems_100') amount = 100;
            if (packId === 'gems_500') amount = 500;
            if (packId === 'gems_1000') amount = 1200; // Бонус!

            if (amount > 0) {
                get().addCrystals(amount);
                syncService.logPlayerAction(`Купил пак кристаллов: +${amount} 💎`);
                syncService.syncPlayerData();
                return true;
            }
        }
        return false;
    },

    buyItem: (itemId: string, currencyType: 'gold' | 'gem') => {
        const state = get() as any;
        const itemData = ITEMS_DATABASE[itemId] as any;
        if (!itemData) return false;

        if (itemData.requiredLevel && state.level < itemData.requiredLevel) {
            console.warn(
                `[Shop] Player level ${state.level} insufficient for item requiring level ${itemData.requiredLevel}`,
            );
            return false;
        }
        const isBankItem = itemData.mainTab === 'BANK';
        const isSkin = itemData.mainTab === 'SKINS';

        if (isSkin) {
            const owned = state.ownedSkins || ['default'];
            if (owned.includes(itemId)) {
                console.warn('[Shop] Skin already owned');
                return false;
            }
        }

        let price = currencyType === 'gold' ? itemData.priceGold : itemData.priceGem;
        if (price !== undefined) {
            const discount = state.shopDiscounts?.[itemId] || 0;
            if (discount > 0) {
                price = Math.max(1, Math.round(price * (1 - discount / 100)));
            }
        }
        const balance = currencyType === 'gold' ? state.gold : state.crystals;

        if (price !== undefined && balance >= price) {
            const newBalanceKey = currencyType === 'gold' ? 'gold' : 'crystals';

            if (isBankItem) {
                const amount = itemData.amount || 0;
                const subTab = itemData.subTab;

                if (subTab === 'GOLD') {
                    set({ [newBalanceKey]: balance - price, gold: state.gold + amount });
                } else if (subTab === 'GEMS') {
                    set({ [newBalanceKey]: balance - price, crystals: state.crystals + amount });
                } else if (subTab === 'ENERGY') {
                    set({ [newBalanceKey]: balance - price, energy: Math.min(state.energy + amount, state.maxEnergy) });
                }
            } else if (isSkin) {
                const owned = [...(state.ownedSkins || ['default'])];
                if (!owned.includes(itemId)) owned.push(itemId);
                set({
                    [newBalanceKey]: balance - price,
                    ownedSkins: owned,
                });
            } else {
                if (itemData.mainTab === 'ALCHEMY') {
                    const existingItemIndex = state.inventory.findIndex((i: any) => String(i.id) === itemId);
                    if (existingItemIndex > -1) {
                        const newInventory = [...state.inventory];
                        const existingItem = newInventory[existingItemIndex];
                        newInventory[existingItemIndex] = {
                            ...existingItem,
                            amount: (existingItem.amount || 1) + 1,
                        };
                        set({
                            [newBalanceKey]: balance - price,
                            inventory: newInventory,
                        });
                    } else {
                        set({
                            [newBalanceKey]: balance - price,
                            inventory: [
                                ...state.inventory,
                                {
                                    id: itemId,
                                    type: itemData.subTab,
                                    rarity: itemData.rarity,
                                    level: 1,
                                    amount: 1,
                                },
                            ],
                        });
                    }
                } else {
                    const itemTemplate = { id: itemId, type: itemData.subTab, rarity: itemData.rarity, level: 1 };
                    set({
                        [newBalanceKey]: balance - price,
                        inventory: [
                            ...state.inventory,
                            {
                                ...itemTemplate,
                                instanceId: `${itemTemplate.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                            },
                        ],
                    });
                }
            }

            if (currencyType === 'gold') {
                get().updateQuestProgress('SPEND_GOLD', price);
            }

            const itemName = itemData.name || itemId;
            syncService.logPlayerAction(`Купил в магазине: ${itemName}`);
            syncService.syncPlayerData();

            return true;
        }

        return false;
    },
});
