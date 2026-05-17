import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

// Цвета редкости предметов
const rarityColors: Record<string, string> = {
    COMMON: '#9e9e9e',
    RARE: '#2196f3',
    EPIC: '#a855f7',
    LEGENDARY: '#ff9800',
    MYTHIC: '#ef4444',
};

// Статический конфиг искр
const staticSparks = [...Array(50)].map((_, i) => ({
    id: i,
    targetX: `${10 + ((i * 7.7) % 80)}%`,
    targetY: `${10 + ((i * 13.3) % 80)}%`,
    delay: (i * 0.04) % 0.6,
}));

/**
 * FORGE SCREEN: ПОЛНОЭКРАННАЯ КУЗНИЦА (AAA GRADE)
 */
export const ForgeScreen: React.FC = () => {
    const { gold, crystals, inventory, heroEquipment, selectedHeroId, upgradeItem, goToCity } = useGameStore();
    const heroId = selectedHeroId || 'panda';
    const equipped = heroEquipment[heroId] || {};

    const [selectedItemId, setSelectedItemId] = useState<string | null>(
        equipped.WEAPONS || inventory.find((i: any) => i.type === 'WEAPONS' || i.subTab === 'WEAPONS')?.id || null,
    );

    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const invItem = inventory.find((i: any) => String(i.id) === selectedItemId);
    const itemData = selectedItemId ? ITEMS_DATABASE[selectedItemId] : null;

    const currentLevel = invItem?.level || 1;
    const maxLevel = 3;
    const emptySlotsCount = Math.max(0, 16 - inventory.length);

    let upgradeCostGold = 0;
    let upgradeCostGem = 0;

    if (itemData) {
        const basePrice = itemData.priceGold || 1000;
        const multiplier = Math.pow(1.8, currentLevel - 1) * 0.5;
        upgradeCostGold = Math.round(basePrice * multiplier);
        if (currentLevel > 3) {
            upgradeCostGem = Math.round(currentLevel * 15);
        }
    }

    const canUpgrade = currentLevel < maxLevel && gold >= upgradeCostGold && (crystals || 0) >= upgradeCostGem;

    const handleUpgrade = async () => {
        if (!selectedItemId || isUpgrading || !canUpgrade) return;
        setIsUpgrading(true);

        // [Lead Architect]: Multi-stage feedback for premium feel
        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);

        await new Promise((resolve) => setTimeout(resolve, 1500));
        const success = upgradeItem(selectedItemId);
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
        setIsUpgrading(false);
    };

    // [Lead Architect]: Native Escape key handling for immersive UI
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') goToCity();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToCity]);

    const getStatMultiplier = (lvl: number) => {
        if (lvl === 1) return 1.0;
        if (lvl === 2) return 1.15;
        if (lvl === 3) return 1.35;
        return 1.0;
    };

    const renderStatRow = (label: string, icon: string, value: number | undefined, color: string) => {
        if (!value) return null;
        const currentVal = Math.round(value * getStatMultiplier(currentLevel));
        const nextVal = Math.round(value * getStatMultiplier(currentLevel + 1));

        return (
            <div
                key={label}
                style={{
                    ...styles.statRow,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderLeft: `4px solid ${color}`,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    borderBottom: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '24px' }}>{icon}</span>
                    <span style={{ ...styles.statLabel, color: 'rgba(255,255,255,0.8)' }}>{label.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#fff',
                        }}
                    >
                        {currentVal}
                    </div>
                    {currentLevel < maxLevel && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', gap: '15px', alignItems: 'center' }}
                        >
                            <span style={{ color: '#f0c040', fontWeight: 900 }}>→</span>
                            <div
                                style={{
                                    background: 'rgba(16,185,129,0.15)',
                                    border: '1px solid rgba(16,185,129,0.4)',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: '#10b981',
                                }}
                            >
                                {nextVal}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.screenContainer}
        >
            {/* BACKGROUND BLURRED CITY */}
            <div style={styles.bgOverlay} />

            {/* Вспышка при успехе */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: '#fff',
                            zIndex: 9999,
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div style={styles.header}>
                <button
                    onClick={goToCity}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#fff',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '18px',
                        fontWeight: 700,
                    }}
                >
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundImage: `url(${AssetsMap.UI.ICON_EXIT})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                    <span>ВЫХОД [ESC]</span>
                </button>
                <div style={styles.headerTitleGroup}>
                    <h1 style={{ ...styles.mainTitle, color: '#fff' }}>КОРОЛЕВСКАЯ КУЗНИЦА</h1>
                    <div style={styles.titleUnderline} />
                </div>
                <div style={{ width: '150px' }} /> {/* Spacer to balance layout */}
            </div>

            <div style={styles.mainContent}>
                {/* LEFT: ARSENAL */}
                <div style={styles.arsenalPanel}>
                    <div style={styles.panelHeader}>
                        <span>ВАШ АРСЕНАЛ</span>
                        <span style={{ opacity: 0.5 }}>{inventory.length} ПРЕДМЕТОВ</span>
                    </div>
                    <div style={styles.inventoryGrid}>
                        {inventory.map((item: any) => {
                            const data = ITEMS_DATABASE[item.id] as any;
                            if (!data) return null;
                            const isSelected = selectedItemId === item.id;
                            const rarityColor = rarityColors[data.rarity] || '#9e9e9e';
                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    animate={
                                        isSelected
                                            ? {
                                                  scale: [1, 1.02, 1],
                                                  boxShadow: [
                                                      `0 0 10px ${rarityColor}44`,
                                                      `0 0 25px ${rarityColor}aa`,
                                                      `0 0 10px ${rarityColor}44`,
                                                  ],
                                              }
                                            : {}
                                    }
                                    transition={isSelected ? { duration: 2, repeat: Infinity } : {}}
                                    onClick={() => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        setSelectedItemId(item.id);
                                    }}
                                    style={{
                                        ...styles.itemCard,
                                        border:
                                            item.level === 3
                                                ? '2px solid #c48b3b'
                                                : isSelected
                                                  ? '3px solid #f0c040'
                                                  : `1px solid ${rarityColor}55`,
                                        background: isSelected ? `${rarityColor}22` : 'rgba(255,255,255,0.03)',
                                        boxShadow: item.level === 3 ? '0 0 10px rgba(196,139,59,0.3)' : 'none',
                                    }}
                                >
                                    <img src={data.image} style={styles.itemImg} alt="" />
                                    <div
                                        style={{
                                            ...styles.itemLvlBadge,
                                            background: item.level === 3 ? '#c48b3b' : '#f0c040',
                                            color: item.level === 3 ? '#000' : '#fff',
                                        }}
                                    >
                                        L{item.level || 1}
                                    </div>
                                    {isSelected && <div style={styles.selectedIndicator} />}
                                </motion.button>
                            );
                        })}
                        {Array(emptySlotsCount)
                            .fill(0)
                            .map((_, index) => (
                                <div
                                    key={`empty-${index}`}
                                    style={{
                                        ...styles.itemCard,
                                        background: 'rgba(255,255,255,0.01)',
                                        border: '1px dashed rgba(255,255,255,0.05)',
                                        cursor: 'default',
                                    }}
                                />
                            ))}
                    </div>
                </div>

                {/* CENTER: ANVIL */}
                <div style={styles.anvilArea}>
                    <AnimatePresence>
                        {isUpgrading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={styles.sparkContainer}
                            >
                                {staticSparks.map((spark: any) => (
                                    <motion.div
                                        key={spark.id}
                                        initial={{ x: '50%', y: '50%', scale: 0 }}
                                        animate={{
                                            x: spark.targetX,
                                            y: spark.targetY,
                                            scale: [0, 1.5, 0],
                                            opacity: [1, 1, 0],
                                        }}
                                        transition={{ duration: 0.7, repeat: Infinity, delay: spark.delay }}
                                        style={styles.spark}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {itemData && (
                        <motion.div
                            animate={
                                showSuccess
                                    ? { x: [0, -10, 10, -10, 10, -5, 5, 0], y: [0, 5, -5, 5, -5, 2, -2, 0] }
                                    : isUpgrading
                                      ? { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }
                                      : {}
                            }
                            transition={
                                showSuccess ? { duration: 0.5 } : { duration: 0.15, repeat: isUpgrading ? Infinity : 0 }
                            }
                            style={styles.heroItemContainer}
                        >
                            {/* Лёгкий фон-подложка для оружия */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '550px',
                                    height: '550px',
                                    background:
                                        currentLevel === 3
                                            ? 'radial-gradient(circle, rgba(196,139,59,0.1) 0%, rgba(20,15,10,0.8) 70%, transparent 100%)'
                                            : 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, rgba(20,15,10,0.8) 70%, transparent 100%)',
                                    borderRadius: '24px',
                                    border:
                                        currentLevel === 3
                                            ? '3px solid #c48b3b'
                                            : `2px solid ${rarityColors[itemData.rarity] || '#f0c040'}55`,
                                    boxShadow:
                                        currentLevel === 3
                                            ? `0 0 40px rgba(196,139,59,0.4), inset 0 0 20px rgba(196,139,59,0.4)`
                                            : `0 0 30px ${rarityColors[itemData.rarity] || '#f0c040'}aa, inset 0 0 30px ${rarityColors[itemData.rarity] || '#f0c040'}aa`,
                                    zIndex: 1,
                                }}
                            />

                            <img
                                src={itemData.image}
                                style={{
                                    ...styles.heroItemImg,
                                    filter: `drop-shadow(0 0 50px ${isUpgrading ? '#ff6600' : (rarityColors[itemData.rarity] || '#f0c040') + 'aa'})`,
                                    zIndex: 5,
                                }}
                                alt=""
                            />
                            <motion.div
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ ...styles.itemGlow, zIndex: 2 }}
                            />
                        </motion.div>
                    )}

                    <div style={styles.itemInfo}>
                        <h2 style={styles.itemName}>{itemData?.name || 'ВЫБЕРИТЕ ПРЕДМЕТ'}</h2>
                        {itemData && (
                            <div style={{ ...styles.powerBadge, color: '#fff' }}>
                                МОЩЬ: {Math.round(calculateItemPower(itemData) * getStatMultiplier(currentLevel))}
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 2, opacity: 0 }}
                                style={styles.successLabel}
                            >
                                ШЕДЕВР!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT: STATS & BUTTON */}
                <div style={styles.statsPanel}>
                    <div style={styles.statsInner}>
                        <h3 style={styles.panelSubTitle}>ХАРАКТЕРИСТИКИ</h3>
                        <div style={styles.statsList}>
                            {renderStatRow('Атака', '⚔️', (itemData as any)?.attackBonus, '#ef4444')}
                            {renderStatRow('Защита', '🛡️', (itemData as any)?.defenseBonus, '#3b82f6')}
                            {renderStatRow('Здоровье', '❤️', (itemData as any)?.hpBonus, '#22c55e')}
                            {renderStatRow('Крит', '🎯', (itemData as any)?.critBonus, '#a855f7')}
                        </div>
                        {currentLevel === 3 && (
                            <div
                                style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    border: '3px solid #c48b3b',
                                    borderRadius: '12px',
                                    color: '#c48b3b',
                                    textAlign: 'center',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '4px',
                                    background: 'rgba(196,139,59,0.05)',
                                    transform: 'rotate(-5deg)',
                                    boxShadow: '0 0 20px rgba(196,139,59,0.2)',
                                    fontSize: '24px',
                                }}
                            >
                                СОВЕРШЕННО
                            </div>
                        )}
                    </div>

                    <div style={styles.upgradeSection}>
                        {currentLevel < maxLevel ? (
                            <>
                                <div style={styles.costContainer}>
                                    <div style={{ color: gold >= upgradeCostGold ? '#fcd34d' : '#ff4444' }}>
                                        {upgradeCostGold.toLocaleString()} 🟡
                                    </div>
                                    {upgradeCostGem > 0 && (
                                        <div style={{ color: crystals >= upgradeCostGem ? '#00e5ff' : '#ff4444' }}>
                                            {upgradeCostGem.toLocaleString()} 💎
                                        </div>
                                    )}
                                </div>
                                <motion.button
                                    whileHover={
                                        !(!canUpgrade || isUpgrading)
                                            ? { scale: 1.05, boxShadow: '0 0 30px rgba(245,158,11,0.6)' }
                                            : {}
                                    }
                                    whileTap={!(!canUpgrade || isUpgrading) ? { scale: 0.95 } : {}}
                                    onClick={handleUpgrade}
                                    disabled={!canUpgrade || isUpgrading}
                                    style={{
                                        width: '100%',
                                        height: '70px',
                                        background: isUpgrading
                                            ? 'linear-gradient(180deg, #b45309 0%, #78350f 100%)'
                                            : canUpgrade
                                              ? 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)'
                                              : 'rgba(255,255,255,0.05)',
                                        border: canUpgrade ? '2px solid #fde047' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: canUpgrade ? '#fff' : 'rgba(255,255,255,0.3)',
                                        fontSize: '22px',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '2px',
                                        cursor: canUpgrade ? 'pointer' : 'not-allowed',
                                        boxShadow: canUpgrade ? '0 4px 20px rgba(245,158,11,0.3)' : 'none',
                                        textShadow: canUpgrade ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {isUpgrading ? 'ПРОЦЕСС КОВКИ...' : 'УЛУЧШИТЬ'}
                                </motion.button>
                                <div style={styles.chanceLabel}>Шанс успеха: 100%</div>
                            </>
                        ) : (
                            <div style={styles.maxLvlLabel}>МАКСИМАЛЬНЫЙ УРОВЕНЬ ДОСТИГНУТ</div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    screenContainer: {
        width: '1920px',
        height: '1080px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        overflow: 'hidden',
        fontFamily: "'Cinzel', serif",
        pointerEvents: 'auto', // [Critical]: Restore interactivity blocked by HUD layer
    },
    bgOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${AssetsMap.BACKGROUNDS.FORGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.9)', // Increased brightness for better visibility
        zIndex: -1,
    },
    header: {
        height: '140px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 80px',
    },
    headerTitleGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    mainTitle: {
        fontSize: '42px',
        margin: 0,
        color: '#f0c040',
        textShadow: '0 0 20px rgba(240,192,64,0.4)',
        letterSpacing: '5px',
    },
    titleUnderline: {
        height: '3px',
        background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
        width: '100%',
    },
    closeBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid #f0c040',
        padding: '12px 30px',
        color: '#f0c040',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 900,
        fontSize: '18px',
        boxShadow: '0 0 10px rgba(240,192,64,0.2)',
        transition: 'all 0.3s',
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        padding: '0 60px 60px 60px',
        gap: '40px',
    },
    arsenalPanel: {
        width: '450px',
        background: 'rgba(20, 15, 10, 0.4)',
        borderRadius: '30px',
        border: '1px solid rgba(240, 192, 64, 0.3)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '30px',
        boxShadow: '0 0 30px rgba(240, 192, 64, 0.1)',
    },
    panelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        fontSize: '14px',
        fontWeight: 900,
        letterSpacing: '2px',
    },
    inventoryGrid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridAutoRows: 'min-content',
        gap: '20px',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '10px',
    },
    itemCard: {
        aspectRatio: '1/1',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '15px',
        transition: 'all 0.3s',
    },
    itemImg: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    itemLvlBadge: {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: '#f0c040',
        color: '#000',
        fontSize: '12px',
        fontWeight: 900,
        padding: '2px 8px',
        borderRadius: '6px',
    },
    anvilArea: {
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroItemContainer: {
        width: '500px',
        height: '500px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroItemImg: {
        width: '90%',
        height: '90%',
        objectFit: 'contain',
        zIndex: 5,
    },
    itemGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, #f0c04033 0%, transparent 70%)',
        borderRadius: '50%',
    },
    sparkContainer: {
        position: 'absolute',
        inset: 0,
        zIndex: 10,
    },
    spark: {
        position: 'absolute',
        width: '6px',
        height: '6px',
        background: '#ff6600',
        borderRadius: '50%',
        boxShadow: '0 0 15px #ffcc00',
    },
    itemInfo: {
        textAlign: 'center',
        marginTop: '20px',
    },
    itemName: {
        fontSize: '48px',
        margin: '0 0 10px 0',
        textShadow: '0 5px 30px rgba(0,0,0,1)',
    },
    powerBadge: {
        display: 'inline-block',
        background: 'rgba(240,192,64,0.15)',
        border: '1px solid #f0c040',
        padding: '8px 25px',
        borderRadius: '15px',
        color: '#f0c040',
        fontWeight: 900,
        fontSize: '20px',
    },
    successLabel: {
        position: 'absolute',
        top: '30%',
        color: '#10b981',
        fontSize: '120px',
        fontWeight: 900,
        textShadow: '0 0 50px rgba(16,185,129,0.5)',
        zIndex: 20,
    },
    statsPanel: {
        width: '450px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
    },
    statsInner: {
        flex: 1,
        background: 'rgba(20, 15, 10, 0.4)',
        borderRadius: '30px',
        padding: '40px',
        border: '1px solid rgba(240, 192, 64, 0.3)',
        boxShadow: '0 0 30px rgba(240, 192, 64, 0.1)',
    },
    panelSubTitle: {
        fontSize: '16px',
        letterSpacing: '5px',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: '30px',
    },
    statsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    statLabel: {
        fontSize: '18px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.6)',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: 900,
    },
    upgradeSection: {
        background: 'rgba(20, 15, 10, 0.6)',
        borderRadius: '30px',
        padding: '40px',
        border: '1px solid rgba(240, 192, 64, 0.4)',
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(240, 192, 64, 0.05)',
    },
    costContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        fontSize: '32px',
        fontWeight: 900,
        marginBottom: '25px',
    },
    chanceLabel: {
        fontSize: '14px',
        opacity: 0.5,
        marginTop: '15px',
    },
    maxLvlLabel: {
        color: '#10b981',
        fontWeight: 900,
        fontSize: '20px',
    },
    selectedIndicator: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        width: '8px',
        height: '8px',
        background: '#f0c040',
        borderRadius: '50%',
        boxShadow: '0 0 10px #f0c040',
    },
};
