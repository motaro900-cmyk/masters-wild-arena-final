import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getAllShopItems, ShopItem } from '../../../configs/ShopConfig';

import { WEAPONS_DB, HELMS_DB, ARMOR_DB, SHIELDS_DB, PANTS_DB, BOOTS_DB, SHOULDERS_DB, IEquipmentStats } from '../../../game/configs/ItemsConfig';
import { audioService } from '../../../services/AudioService';

type MainTab = 'ARSENAL' | 'ALCHEMY' | 'BANK' | 'SKINS';
type SubTab = 'ALL' | 'WEAPONS' | 'HELMETS' | 'ARMOR' | 'SHIELDS' | 'POTIONS' | 'GOLD' | 'GEMS' | 'ENERGY';

/**
 * ShopScene (v6.2) - AAA Premium Storefront with Confirmation Modal
 */

const getRarityColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
        case 'COMMON':
            return '#a0a0a0';
        case 'UNCOMMON':
            return '#10b981';
        case 'RARE':
            return '#3b82f6';
        case 'EPIC':
            return '#a855f7';
        case 'MYTHIC':
            return '#ef4444';
        case 'LEGENDARY':
            return '#f59e0b';
        default:
            return '#fff';
    }
};

const rarityTranslation: Record<string, string> = {
    'COMMON': 'ОБЫЧНЫЙ',
    'UNCOMMON': 'НЕОБЫЧНЫЙ',
    'RARE': 'РЕДКИЙ',
    'EPIC': 'ЭПИЧЕСКИЙ',
    'MYTHIC': 'МИФИЧЕСКИЙ',
    'LEGENDARY': 'ЛЕГЕНДАРНЫЙ',
};

const getItemStats = (item: ShopItem): IEquipmentStats | null => {
    const id = String(item.id);
    if (item.subTab === 'WEAPONS') return WEAPONS_DB[id] || null;
    if (item.subTab === 'HELMETS') return HELMS_DB[id] || null;
    if (item.subTab === 'ARMOR') return ARMOR_DB[id] || null;
    if (item.subTab === 'SHIELDS') return SHIELDS_DB[id] || null;
    if (item.subTab === 'PANTS') return PANTS_DB[id] || null;
    if (item.subTab === 'BOOTS') return BOOTS_DB[id] || null;
    if (item.subTab === 'SHOULDERS') return SHOULDERS_DB[id] || null;
    return null;
};

export const ShopScene: React.FC = () => {
    const {
        addGold,
        addCrystals,
        addEnergy,
        inventory,
        equipItem,
        equippedWeaponId,
        equippedHelmId,
        equippedArmorId,
        equippedShieldId,
        shopInitialTab,
        shopInitialSubTab,
        goToMainMenu,
        watchAdForReward,
        buyCrystalsPack,
        isMobile,
    } = useGameStore();

    const [activeMainTab, setActiveMainTab] = useState<MainTab>((shopInitialTab as MainTab) || 'ARSENAL');
    const subTabs = getSubTabs(activeMainTab);
    const [activeSubTab, setActiveSubTab] = useState<string>(subTabs[0]?.id || 'WEAPONS');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (shopInitialTab) {
            setTimeout(() => {
                setActiveMainTab(shopInitialTab as MainTab);
            }, 0);
        }
    }, [shopInitialTab]);

    useEffect(() => {
        const newSubTabs = getSubTabs(activeMainTab);
        if (newSubTabs.length > 0) {
            // Если есть начальная под-вкладка, используем её, иначе первую
            if (shopInitialSubTab) {
                setTimeout(() => {
                    setActiveSubTab(shopInitialSubTab);
                }, 0);
            } else {
                setTimeout(() => {
                    setActiveSubTab(newSubTabs[0].id);
                }, 0);
            }
        }
    }, [activeMainTab, shopInitialSubTab]);

    const getSectionTitle = (main: MainTab) => {
        switch (main) {
            case 'ARSENAL':
                return 'ЭКИПИРОВКА';
            case 'ALCHEMY':
                return 'МАГИЧЕСКАЯ ЛАВКА';
            case 'SKINS':
                return 'ГАРДЕРОБ ГЕРОЯ';
            case 'BANK':
                return 'КОРОЛЕВСКИЙ БАНК';
            default:
                return 'МАГАЗИН';
        }
    };

    const filteredItems = getAllShopItems().filter((item) => {
        const matchesMain = item.mainTab === activeMainTab;
        if (!matchesMain) return false;

        if (activeSubTab === 'FREE') return item.isAd === true;
        if (item.isAd) return false; // Исключаем рекламные товары из обычных вкладок

        return item.subTab === activeSubTab;
    });

    const handleEquip = (item: ShopItem) => {
        equipItem(String(item.id));
    };

    const handleItemClick = (item: ShopItem) => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        setSelectedItem(item);
        setShowConfirm(true);
    };

    const confirmPurchase = async (currency: 'gold' | 'gem' | 'stars' | 'ad') => {
        if (!selectedItem) return;
        const item = selectedItem;

        setIsProcessing(true);
        setShowConfirm(false);

        try {
            let success = false;

            if (currency === 'ad') {
                let rewardType: 'GOLD' | 'ENERGY' | 'CRYSTAL' = 'GOLD';
                if (item.subTab === 'ENERGY') rewardType = 'ENERGY';
                else if (item.subTab === 'GEMS') rewardType = 'CRYSTAL';

                success = await watchAdForReward(rewardType);
            } else if (currency === 'stars') {
                success = await buyCrystalsPack(item.id);
            } else {
                // Обычная покупка за игровое золото/алмазы
                success = useGameStore.getState().buyItem(String(item.id), currency);

                if (success && item.mainTab === 'BANK') {
                    const amount = item.amount || 0;
                    if (item.subTab === 'GOLD') addGold(amount);
                    else if (item.subTab === 'GEMS') addCrystals(amount);
                    else if (item.subTab === 'ENERGY') addEnergy(amount);
                }
            }

            if (success) {
                audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
            } else {
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
        } finally {
            setIsProcessing(false);
            setSelectedItem(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: isMobile ? '100%' : '1920px',
                height: isMobile ? '100%' : '1080px',
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundImage: `url("${AssetsMap.BACKGROUNDS.SHOP}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pointerEvents: 'auto',
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '120px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 80px',
                    pointerEvents: 'none',
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontFamily: "'Cinzel', serif",
                        color: '#f0c040',
                        fontSize: '44px',
                        textShadow: isMobile
                            ? '0 2px 4px #000'
                            : '0 0 20px #000, 0 4px 15px #000, 0 0 40px rgba(240,192,64,0.3)',
                        letterSpacing: '4px',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase',
                        lineHeight: '1',
                        pointerEvents: 'auto',
                    }}
                >
                    {getSectionTitle(activeMainTab)}
                </h2>
            </div>

            <div style={{ display: 'flex', flex: 1, padding: '20px 80px 60px 80px', gap: '50px' }}>
                <div
                    style={{
                        width: '380px',
                        height: '800px',
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: '12px',
                        border: '2px solid rgba(240, 192, 64, 0.2)',
                        padding: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '50px',
                            left: '25px',
                            right: '25px',
                            bottom: '30px',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            padding: '40px 20px',
                        }}
                    >
                        <SidebarBtn
                            active={activeMainTab === 'ARSENAL'}
                            onClick={() => setActiveMainTab('ARSENAL')}
                            label="ЭКИПИРОВКА"
                            image={AssetsMap.UI.TAB_ARSENAL}
                        />
                        <SidebarBtn
                            active={activeMainTab === 'ALCHEMY'}
                            onClick={() => setActiveMainTab('ALCHEMY')}
                            label="АЛХИМИЯ"
                            image={AssetsMap.UI.TAB_ALCHEMY}
                        />
                        <SidebarBtn
                            active={activeMainTab === 'SKINS'}
                            onClick={() => setActiveMainTab('SKINS')}
                            label="ОБЛИКИ"
                            image={AssetsMap.UI.TAB_SKINS}
                        />
                        <SidebarBtn
                            active={activeMainTab === 'BANK'}
                            onClick={() => setActiveMainTab('BANK')}
                            label="БАНК"
                            image={AssetsMap.UI.TAB_BANK}
                        />

                        <div style={{ marginTop: 'auto', padding: '0 10px' }}>
                            <button
                                onClick={goToMainMenu}
                                style={{
                                    width: '100%',
                                    height: '55px',
                                    background: 'rgba(255,50,50,0.1)',
                                    border: '1px solid rgba(255,50,50,0.3)',
                                    borderRadius: '8px',
                                    color: '#ff6666',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 900,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                }}
                            >
                                ВЕРНУТЬСЯ
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div
                        style={{
                            position: 'relative',
                            height: '60px',
                            borderBottom: '2px solid rgba(240,192,64,0.3)',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: '5px',
                                justifyContent: 'flex-start',
                                flex: 1,
                                background: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: !isMobile ? 'blur(8px)' : 'none',
                                padding: '5px 15px',
                                borderRadius: '12px 12px 0 0',
                                border: '1px solid rgba(240, 192, 64, 0.15)',
                                borderBottom: 'none',
                            }}
                        >
                            {getSubTabs(activeMainTab).map((tab) => (
                                <SubTabBtn
                                    key={tab.id}
                                    active={activeSubTab === tab.id}
                                    onClick={() => setActiveSubTab(tab.id as SubTab)}
                                    label={tab.label}
                                    isMobile={isMobile}
                                />
                            ))}
                        </div>
                    </div>

                    <div
                        className="custom-scrollbar"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            paddingRight: '20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '30px',
                            alignContent: 'start',
                            maxHeight: '750px',
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item) => (
                                <ShopItemCard
                                    key={String(item.id)}
                                    item={item}
                                    inventory={inventory}
                                    equippedWeaponId={equippedWeaponId}
                                    equippedHelmId={equippedHelmId}
                                    equippedArmorId={equippedArmorId}
                                    equippedShieldId={equippedShieldId}
                                    onBuy={() => handleItemClick(item)}
                                    onSelect={() => handleItemClick(item)}
                                    isProcessing={isProcessing}
                                    glowColor={getRarityColor(item.rarity)}
                                    isMobile={isMobile}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showConfirm && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 3000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: !isMobile ? 'blur(10px)' : 'none',
                        }}
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={isMobile ? { opacity: 0, y: 0 } : { scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: isMobile ? '95vw' : '900px',
                                height: isMobile ? '80vh' : '600px',
                                background: 'rgba(20,20,25,0.95)',
                                borderRadius: '24px',
                                border: `2px solid ${getRarityColor(selectedItem.rarity)}88`,
                                boxShadow: isMobile
                                    ? 'none'
                                    : `0 0 50px ${getRarityColor(selectedItem.rarity)}33, inset 0 0 30px rgba(0,0,0,0.8)`,
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    height: isMobile ? '250px' : 'auto',
                                    flex: isMobile ? 'none' : 1,
                                    background: `radial-gradient(circle at center, ${getRarityColor(selectedItem.rarity)}22 0%, transparent 70%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    borderBottom: isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                }}
                            >
                                {selectedItem.spriteClass ? (
                                    <div
                                        className={selectedItem.spriteClass}
                                        style={{
                                            width: isMobile ? '200px' : '400px',
                                            height: isMobile ? '200px' : '400px',
                                            filter: `contrast(1.2) brightness(1.15) saturate(1.2) drop-shadow(0 0 15px ${getRarityColor(selectedItem.rarity)}aa)`,
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={selectedItem.image}
                                        onError={(e) => (e.currentTarget.src = AssetsMap.UI.ICON_DAILY_CHEST)}
                                        style={{
                                            width: isMobile ? '200px' : '400px',
                                            height: isMobile ? '200px' : '400px',
                                            objectFit: 'contain',
                                            filter:
                                                selectedItem.id.toString().includes('starter') ||
                                                [
                                                    'pan',
                                                    'stick',
                                                    'broken_sword',
                                                    'rusty_dagger',
                                                    'sling',
                                                    'bandana',
                                                    'ragged_tunic',
                                                    'dented_buckler',
                                                    'iron_helm',
                                                    'forest_hood',
                                                    'bone_mask',
                                                    'chainmail',
                                                    'spiked_leather',
                                                    'hunter_furs',
                                                    'steel_shield',
                                                    'bone_shield',
                                                    'plank_shield',
                                                ].includes(selectedItem.id.toString())
                                                    ? 'url(#remove-white)'
                                                    : 'none',
                                        }}
                                        alt=""
                                    />
                                )}

                                <div
                                    style={{
                                        position: 'absolute',
                                        top: isMobile ? '15px' : '30px',
                                        left: isMobile ? '15px' : '30px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '5px 15px',
                                            background: getRarityColor(selectedItem.rarity),
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        {rarityTranslation[selectedItem.rarity] || selectedItem.rarity}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: INFO */}
                            <div
                                style={{
                                    flex: 1.2,
                                    padding: isMobile ? '20px' : '50px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflowY: 'auto',
                                }}
                            >
                                <h2
                                    style={{
                                        margin: '0 0 5px 0',
                                        fontSize: isMobile ? '24px' : '36px',
                                        color: '#fff',
                                        fontFamily: "'Cinzel', serif",
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {selectedItem.name}
                                </h2>
                                <p
                                    style={{
                                        color: '#c8a870',
                                        fontSize: isMobile ? '14px' : '18px',
                                        margin: '0 0 15px 0',
                                        fontFamily: "'Cinzel', serif",
                                        fontWeight: 700,
                                    }}
                                >
                                    {selectedItem.desc}
                                </p>

                                {/* STATS AREA */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {(() => {
                                        const stats = getItemStats(selectedItem);
                                        if (!stats)
                                            return (
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                                    Этот предмет не дает прямых боевых бонусов.
                                                </p>
                                            );
                                        return (
                                            <>
                                                {stats.attackBonus && (
                                                    <StatItem
                                                        label="АТАКА"
                                                        value={stats.attackBonus}
                                                        icon="⚔️"
                                                        color="#f97316"
                                                    />
                                                )}
                                                {stats.defenseBonus && (
                                                    <StatItem
                                                        label="ЗАЩИТА"
                                                        value={stats.defenseBonus}
                                                        icon="🛡️"
                                                        color="#3b82f6"
                                                    />
                                                )}
                                                {stats.hpBonus && (
                                                    <StatItem
                                                        label="ЗДОРОВЬЕ"
                                                        value={stats.hpBonus}
                                                        icon="❤️"
                                                        color="#ef4444"
                                                    />
                                                )}
                                                {stats.critBonus && (
                                                    <StatItem
                                                        label="КРИТ"
                                                        value={`${Math.round(stats.critBonus * 100)}%`}
                                                        icon="🎯"
                                                        color="#a855f7"
                                                    />
                                                )}
                                                {stats.speedBonus && (
                                                    <StatItem
                                                        label="СКОРОСТЬ"
                                                        value={
                                                            stats.speedBonus > 0
                                                                ? `+${Math.round(stats.speedBonus * 100)}%`
                                                                : `${Math.round(stats.speedBonus * 100)}%`
                                                        }
                                                        icon="⚡"
                                                        color="#fcd34d"
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {selectedItem.flavor && (
                                    <p
                                        style={{
                                            color: 'rgba(255,255,255,0.4)',
                                            fontSize: '14px',
                                            fontStyle: 'italic',
                                            margin: '20px 0',
                                        }}
                                    >
                                        "{selectedItem.flavor}"
                                    </p>
                                )}

                                {/* ACTION BUTTONS */}
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: isMobile ? '10px' : '20px',
                                        marginTop: isMobile ? '20px' : 'auto',
                                        flexShrink: 0,
                                    }}
                                >
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        style={{
                                            flex: 1,
                                            height: isMobile ? '50px' : '60px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: isMobile ? '12px' : '14px',
                                        }}
                                    >
                                        ОТМЕНА
                                    </button>
                                    {selectedItem.priceGold !== undefined && (
                                        <button
                                            onClick={() => confirmPurchase('gold')}
                                            style={{
                                                flex: 1.5,
                                                height: isMobile ? '50px' : '60px',
                                                background: 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#1a0f00',
                                                fontWeight: 900,
                                                fontSize: isMobile ? '16px' : '20px',
                                                cursor: 'pointer',
                                                fontFamily: "'Cinzel', serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            {selectedItem.priceGold}
                                            <img
                                                src={AssetsMap.UI.ICON_GOLD_FULL}
                                                style={{ width: isMobile ? 18 : 25 }}
                                                alt=""
                                            />
                                        </button>
                                    )}
                                    {selectedItem.priceGem !== undefined && (
                                        <button
                                            onClick={() => confirmPurchase('gem')}
                                            style={{
                                                flex: 1.5,
                                                height: isMobile ? '50px' : '60px',
                                                background: 'linear-gradient(180deg, #00ffff 0%, #008888 100%)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#000',
                                                fontWeight: 900,
                                                fontSize: isMobile ? '16px' : '20px',
                                                cursor: 'pointer',
                                                fontFamily: "'Cinzel', serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            {selectedItem.priceGem}
                                            <img
                                                src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                                style={{ width: isMobile ? 18 : 25 }}
                                                alt=""
                                            />
                                        </button>
                                    )}
                                    {selectedItem.priceStars !== undefined && (
                                        <button
                                            onClick={() => confirmPurchase('stars')}
                                            style={{
                                                flex: 1.5,
                                                height: isMobile ? '50px' : '60px',
                                                background: 'linear-gradient(180deg, #5de2ff 0%, #0066ff 100%)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: 900,
                                                fontSize: isMobile ? '16px' : '20px',
                                                cursor: 'pointer',
                                                fontFamily: "'Cinzel', serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            {selectedItem.priceStars}
                                            <span style={{ fontSize: isMobile ? '18px' : '24px' }}>⭐</span>
                                        </button>
                                    )}
                                    {selectedItem.isAd && (
                                        <button
                                            onClick={() => confirmPurchase('ad')}
                                            style={{
                                                flex: 1.5,
                                                height: isMobile ? '50px' : '60px',
                                                background: 'linear-gradient(180deg, #4ade80 0%, #166534 100%)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontWeight: 900,
                                                fontSize: isMobile ? '16px' : '20px',
                                                cursor: 'pointer',
                                                fontFamily: "'Cinzel', serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            {isMobile ? 'AD' : 'СМОТРЕТЬ'}
                                            <span style={{ fontSize: isMobile ? '18px' : '24px' }}>📺</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const StatItem: React.FC<{ label: string; value: any; icon: string; color: string }> = ({
    label,
    value,
    icon,
    color,
}) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '20px', width: '30px' }}>{icon}</span>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 800 }}>{label}</span>
                <span style={{ color: color, fontSize: '14px', fontWeight: 900 }}>{value}</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    style={{ height: '100%', background: color, borderRadius: '2px', boxShadow: `0 0 10px ${color}aa` }}
                />
            </div>
        </div>
    </div>
);

const SidebarBtn: React.FC<{ active: boolean; onClick: () => void; label: string; image: string }> = ({
    active,
    onClick,
    label,
    image,
}) => (
    <motion.button
        onClick={() => {
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            onClick();
        }}
        whileHover={{ x: 5, color: '#fff' }}
        style={{
            width: '100%',
            height: '80px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '10px',
            gap: '15px',
            position: 'relative',
            zIndex: 10,
            color: active ? '#ffd700' : '#c8a870',
            fontFamily: "'Cinzel', serif",
            fontWeight: 900,
            fontSize: '18px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            borderLeft: active ? '3px solid #f0c040' : '3px solid transparent',
            transition: 'all 0.3s',
        }}
    >
        <div
            style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: active ? '0 0 15px rgba(240,192,64,0.4)' : 'none',
                border: active ? '1px solid #f0c040' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s',
            }}
        >
            <img
                src={image}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: active ? 'none' : 'grayscale(0.5) brightness(0.7)',
                }}
                alt=""
            />
        </div>
        {label}
    </motion.button>
);

const getSubTabs = (mainTab: MainTab) => {
    switch (mainTab) {
        case 'ARSENAL':
            return [
                { id: 'WEAPONS', label: 'ОРУЖИЕ' },
                { id: 'SHIELDS', label: 'ЩИТЫ' },
                { id: 'HELMETS', label: 'ШЛЕМЫ' },
                { id: 'SHOULDERS', label: 'НАПЛЕЧНИКИ' },
                { id: 'ARMOR', label: 'ДОСПЕХИ' },
                { id: 'PANTS', label: 'ПОНОЖИ' },
                { id: 'BOOTS', label: 'САПОГИ' },
            ];
        case 'ALCHEMY':
            return [{ id: 'POTIONS', label: 'ЗЕЛЬЯ' }];
        case 'BANK':
            return [
                { id: 'GOLD', label: 'ЗОЛОТО' },
                { id: 'GEMS', label: 'АЛМАЗЫ' },
                { id: 'ENERGY', label: 'ЭНЕРГИЯ' },
                { id: 'FREE', label: 'БЕСПЛАТНО' },
            ];
        case 'SKINS':
            return [{ id: 'ALL', label: 'ОБЛИКИ' }];
        default:
            return [];
    }
};

interface ShopItemCardProps {
    item: ShopItem;
    inventory: any[];
    equippedWeaponId: string | null;
    equippedHelmId: string | null;
    equippedArmorId: string | null;
    equippedShieldId: string | null;
    onBuy: () => void;
    onSelect: () => void;
    isProcessing: boolean;
    glowColor: string;
    isMobile: boolean;
}

const ShopItemCard = React.forwardRef((props: ShopItemCardProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const {
        item,
        inventory,
        equippedWeaponId,
        equippedHelmId,
        equippedArmorId,
        equippedShieldId,
        onBuy,
        onSelect,
        isProcessing,
        glowColor,
        isMobile,
    } = props;
    const isEquipped =
        (item.subTab === 'WEAPONS' && String(item.id) === String(equippedWeaponId)) ||
        (item.subTab === 'HELMETS' && String(item.id) === String(equippedHelmId)) ||
        (item.subTab === 'ARMOR' && String(item.id) === String(equippedArmorId)) ||
        (item.subTab === 'SHIELDS' && String(item.id) === String(equippedShieldId));

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={!isMobile ? { y: -10, transition: { type: 'spring', stiffness: 400, damping: 20 } } : {}}
            onClick={onSelect}
            style={{
                width: '220px',
                height: '340px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                background: `radial-gradient(circle at center, rgba(45, 45, 60, 0.8) 0%, rgba(10, 10, 15, 0.95) 100%)`,
                border: `1px solid ${glowColor}33`,
                borderRadius: '12px',
                boxShadow: isMobile ? 'none' : `0 8px 20px rgba(0,0,0,0.6), 0 0 10px ${glowColor}11`,
                cursor: 'pointer',
                overflow: 'hidden',
            }}
        >
            {!isMobile && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: `radial-gradient(circle, ${glowColor}11 0%, transparent 50%)`,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    background: isMobile ? glowColor : `linear-gradient(135deg, ${glowColor}dd, ${glowColor}88)`,
                    borderRadius: '3px',
                    boxShadow: isMobile ? 'none' : `0 0 8px ${glowColor}66`,
                    border: '1px solid rgba(255,255,255,0.3)',
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        width: '4px',
                        height: '4px',
                        backgroundColor: '#fff',
                        transform: 'rotate(45deg)',
                        boxShadow: '0 0 5px #fff',
                    }}
                />
                <span
                    style={{
                        fontSize: '9px',
                        color: '#fff',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                    }}
                >
                    {(() => {
                        const map: Record<string, string> = {
                            COMMON: 'ОБЫЧНЫЙ',
                            RARE: 'РЕДКИЙ',
                            EPIC: 'ЭПИЧЕСКИЙ',
                            MYTHIC: 'МИФИЧЕСКИЙ',
                            LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
                        };
                        return map[item.rarity] || item.rarity;
                    })()}
                </span>
            </div>
            <div
                style={{
                    width: '150px',
                    height: '150px',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    background: `radial-gradient(circle, ${glowColor}55 0%, rgba(10,10,15,0.9) 100%)`,
                    boxShadow: isMobile ? 'none' : `inset 0 0 20px ${glowColor}33, 0 0 15px rgba(0,0,0,0.5)`,
                    border: `1px solid ${glowColor}44`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}
            >
                {!isMobile && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            width: '120px',
                            height: '120px',
                            background: `radial-gradient(circle, ${glowColor}66 0%, transparent 70%)`,
                            borderRadius: '50%',
                            filter: 'blur(10px)',
                        }}
                    />
                )}
                {item.spriteClass ? (
                    <div
                        className={item.spriteClass}
                        style={{
                            width: '135px',
                            height: '135px',
                            zIndex: 2,
                            filter: isMobile
                                ? 'none'
                                : `contrast(1.2) brightness(1.15) saturate(1.2) drop-shadow(0 0 5px ${glowColor}aa)`,
                        }}
                    />
                ) : (
                    <img
                        src={item.image}
                        onError={(e) => (e.currentTarget.src = AssetsMap.UI.ICON_DAILY_CHEST)}
                        style={{
                            width: '135px',
                            height: '135px',
                            objectFit: 'contain',
                            zIndex: 2,
                            filter: isMobile
                                ? 'none'
                                : `contrast(1.2) brightness(1.15) saturate(1.2) drop-shadow(0 0 5px ${glowColor}aa) drop-shadow(0 4px 8px rgba(0,0,0,0.8))`,
                        }}
                        alt=""
                    />
                )}
            </div>
            <h3
                style={{
                    fontFamily: "'Cinzel', serif",
                    color: '#f0f0f0',
                    fontSize: '15px',
                    textAlign: 'center',
                    margin: '15px 0 5px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {item.name}
            </h3>

            {/* ВЫ ПОЛУЧИТЕ */}
            {item.mainTab === 'BANK' && item.amount && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px',
                        margin: '10px 0',
                        color: '#a0a0a0',
                        fontSize: '12px',
                    }}
                >
                    <span>Вы получите:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span
                            style={{
                                fontSize: '18px',
                                fontWeight: 900,
                                color:
                                    item.subTab === 'GOLD' ? '#f0c040' : item.subTab === 'GEMS' ? '#00ffff' : '#ff5555',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            {item.amount.toLocaleString()}
                        </span>
                        <img
                            src={
                                item.subTab === 'GOLD'
                                    ? AssetsMap.UI.ICON_GOLD_FULL
                                    : item.subTab === 'GEMS'
                                      ? AssetsMap.UI.ICON_ALMAZ_FULL
                                      : AssetsMap.UI.ICON_ENERGY_FULL
                            }
                            style={{ width: 18, height: 18 }}
                            alt=""
                        />
                    </div>
                </div>
            )}

            {/* СТАТЫ ПРЕДМЕТА */}
            {item.mainTab !== 'BANK' && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px',
                        margin: '10px 0',
                        color: '#a0a0a0',
                        fontSize: '12px',
                        height: '45px',
                        justifyContent: 'center',
                    }}
                >
                    {(() => {
                        if (item.mainTab === 'ALCHEMY') {
                            return (
                                <span
                                    style={{
                                        color: '#f0c040',
                                        fontSize: '12px',
                                        fontWeight: 900,
                                        textAlign: 'center',
                                        padding: '0 10px',
                                    }}
                                >
                                    {item.desc || 'Эффект неизвестен'}
                                </span>
                            );
                        }

                        return (
                            <span
                                style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.5)',
                                    fontStyle: 'italic',
                                    textAlign: 'center',
                                }}
                            >
                                Нажмите для просмотра характеристик
                            </span>
                        );
                    })()}
                </div>
            )}

            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    onBuy();
                }}
                whileHover={!isMobile ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.95 }}
                style={{
                    marginTop: 'auto',
                    width: '100%',
                    height: '38px',
                    background:
                        item.priceStars !== undefined
                            ? 'linear-gradient(180deg, #2b82c9 0%, #1a5c96 100%)'
                            : 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                    border: item.priceStars !== undefined ? '1px solid #52a1e5' : '1px solid #ffdf00',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 900,
                    color: item.priceStars !== undefined ? '#ffffff' : '#1a0f00',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {!isMobile && (
                    <motion.div
                        animate={{ left: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            width: '30px',
                            height: '100%',
                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)',
                            transform: 'skewX(-25deg)',
                        }}
                    />
                )}
                {isProcessing ? (
                    '...'
                ) : item.isAd ? (
                    'СМОТРЕТЬ'
                ) : item.priceStars !== undefined ? (
                    <span style={{ fontSize: '18px' }}>{item.priceStars} ⭐</span>
                ) : item.priceGem !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{item.priceGem.toLocaleString()}</span>
                        <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: 24, height: 24 }} alt="" />
                    </div>
                ) : item.priceGold !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{item.priceGold.toLocaleString()}</span>
                        <img src={AssetsMap.UI.ICON_GOLD_FULL} style={{ width: 24, height: 24 }} alt="" />
                    </div>
                ) : (
                    'КУПИТЬ'
                )}
            </motion.button>
        </motion.div>
    );
});

const SubTabBtn: React.FC<{ active: boolean; onClick: () => void; label: string; isMobile: boolean }> = ({
    active,
    onClick,
    label,
    isMobile,
}) => (
    <div
        style={{
            position: 'relative',
            width: '180px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <motion.button
            onClick={() => {
                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                onClick();
            }}
            whileHover={!isMobile ? { y: -2 } : {}}
            style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10,
                color: active ? '#ffd700' : '#e0d0b0',
                fontFamily: "'Cinzel', serif",
                fontWeight: 900,
                fontSize: '15px',
                textTransform: 'uppercase',
                textShadow: '0px 1px 2px #000, 0px -1px 2px #000, 1px 0px 2px #000, -1px 0px 2px #000',
                letterSpacing: '1px',
                transition: 'all 0.3s',
            }}
        >
            {label}
        </motion.button>
        {active && (
            <motion.div
                layoutId="activeSubTab"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url("${AssetsMap.BACKGROUNDS.SHOP_BANNER_RED}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 5,
                    filter: !isMobile ? 'brightness(1.3) drop-shadow(0 0 20px rgba(255,0,0,0.5))' : 'brightness(1.1)',
                }}
            />
        )}
    </div>
);
