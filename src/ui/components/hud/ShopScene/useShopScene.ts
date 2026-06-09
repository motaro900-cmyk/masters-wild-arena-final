import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { getAllShopItems, ShopItem } from '../../../../configs/ShopConfig';
import { MainTab, getSubTabs } from './shopHelpers';

export const useShopScene = () => {
    const {
        shopInitialTab,
        shopInitialSubTab,
        exitShop,
        watchAdForReward,
        buyCrystalsPack,
        isMobile,
        dailyAdWatchesCount,
        shopDiscounts,
        shopLastRefreshTime,
        initializeShop,
        refreshShop,
        level: playerLevel,
        gold,
        crystals,
        hasBoughtStarterPack,
    } = useGameStore();

    const [activeMainTab, setActiveMainTab] = useState<MainTab>((shopInitialTab as MainTab) || 'ARSENAL');
    const subTabs = getSubTabs(activeMainTab);
    const [activeSubTab, setActiveSubTab] = useState<string>(subTabs[0]?.id || 'WEAPONS');
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [timeStr, setTimeStr] = useState('00:00:00');

    // Initialize shop rotation on load
    useEffect(() => {
        initializeShop();
    }, [initializeShop]);

    // Handle count down timer
    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now();
            const nextRefresh = (shopLastRefreshTime || 0) + 4 * 60 * 60 * 1000;
            const diff = nextRefresh - now;
            if (diff <= 0) {
                initializeShop();
                setTimeStr('04:00:00');
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                const hh = String(h).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                const ss = String(s).padStart(2, '0');
                setTimeStr(hh + ':' + mm + ':' + ss);
            }
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, [shopLastRefreshTime, initializeShop]);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        if (shopInitialTab) {
            const timer = setTimeout(() => {
                setActiveMainTab(shopInitialTab as MainTab);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [shopInitialTab]);

    useEffect(() => {
        const newSubTabs = getSubTabs(activeMainTab);
        if (newSubTabs.length > 0) {
            const timer = setTimeout(() => {
                if (shopInitialSubTab) {
                    setActiveSubTab(shopInitialSubTab);
                } else {
                    setActiveSubTab(newSubTabs[0].id);
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [activeMainTab, shopInitialSubTab]);

    const allItems = useMemo(() => getAllShopItems(), []);

    // Get all items in the sub-tab (full catalog)
    const filteredItems = useMemo(() => {
        const getRotationItems = (): ShopItem[] => {
            if (activeMainTab === 'BANK') {
                return allItems.filter((item) => {
                    const matchesMain = item.mainTab === activeMainTab;
                    if (!matchesMain) return false;
                    if (item.id === 'starter_pack' && hasBoughtStarterPack) return false;
                    if (activeSubTab === 'FREE') return item.isAd === true;
                    if (item.isAd) return false;
                    return item.subTab === activeSubTab;
                });
            }
            if (activeMainTab === 'SKINS') {
                return getAllShopItems().filter((item) => item.mainTab === 'SKINS');
            }

            if (activeMainTab === 'ARSENAL' || activeMainTab === 'ALCHEMY') {
                return allItems.filter((item) => item.mainTab === activeMainTab && item.subTab === activeSubTab);
            }

            return [];
        };

        const items = getRotationItems();
        return [...items].sort((a, b) => {
            if (a.id === 'starter_pack') return -1;
            if (b.id === 'starter_pack') return 1;

            const hasDiscountA = (shopDiscounts?.[a.id] || 0) > 0;
            const hasDiscountB = (shopDiscounts?.[b.id] || 0) > 0;
            if (hasDiscountA && !hasDiscountB) return -1;
            if (!hasDiscountA && hasDiscountB) return 1;
            return 0;
        });
    }, [allItems, activeMainTab, activeSubTab, shopDiscounts]);

    // Auto-select first item when tab changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filteredItems.length > 0) {
                setSelectedItem(filteredItems[0]);
            } else {
                setSelectedItem(null);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [activeMainTab, activeSubTab, filteredItems]);

    const handleItemClick = (item: ShopItem) => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setSelectedItem(item);
    };

    const handleBuyTrigger = (item: ShopItem) => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setSelectedItem(item);
        setShowConfirm(true);
    };

    const confirmPurchase = async (currency: 'gold' | 'gem' | 'votes' | 'ad') => {
        if (!selectedItem) return;
        const item = selectedItem;

        setShowConfirm(false);

        try {
            let success = false;

            if (currency === 'ad') {
                let rewardType: 'GOLD' | 'ENERGY' | 'CRYSTAL' = 'GOLD';
                if (item.subTab === 'ENERGY') rewardType = 'ENERGY';
                else if (item.subTab === 'GEMS') rewardType = 'CRYSTAL';

                success = await watchAdForReward(rewardType);
            } else if (currency === 'votes') {
                success = await buyCrystalsPack(item.id);
            } else {
                success = useGameStore.getState().buyItem(String(item.id), currency);
            }

            if (success) {
                audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                setToastMessage('✅ Покупка успешно завершена!');
            } else {
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
                setToastMessage('❌ Ошибка покупки или операция отменена.');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            setToastMessage('❌ Произошла ошибка при обработке платежа.');
        }
    };

    const triggerManualRefresh = async (currency: 'gold' | 'gem' | 'ad') => {
        setShowRefreshConfirm(false);
        try {
            const success = await refreshShop(currency);
            if (success) {
                audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                setToastMessage('🔄 Магазин успешно обновлен!');
            } else {
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
                setToastMessage('❌ Недостаточно средств для обновления.');
            }
        } catch (err) {
            console.error('Refresh error:', err);
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
        }
    };

    return {
        activeMainTab,
        setActiveMainTab,
        activeSubTab,
        setActiveSubTab,
        selectedItem,
        setSelectedItem,
        showConfirm,
        setShowConfirm,
        showRefreshConfirm,
        setShowRefreshConfirm,
        toastMessage,
        setToastMessage,
        timeStr,
        filteredItems,
        isMobile,
        dailyAdWatchesCount,
        playerLevel,
        gold,
        crystals,
        shopDiscounts,
        exitShop,
        handleItemClick,
        handleBuyTrigger,
        confirmPurchase,
        triggerManualRefresh,
    };
};
