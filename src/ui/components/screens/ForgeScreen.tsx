import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { GfxMenuButton } from '../hud/SharedUI';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

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
    const maxLevel = 10;

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

    const getStatMultiplier = (lvl: number) => 1 + (lvl - 1) * 0.2;

    const renderStatRow = (label: string, icon: string, value: number | undefined, color: string) => {
        if (!value) return null;
        const currentVal = Math.round(value * getStatMultiplier(currentLevel));
        const nextVal = Math.round(value * getStatMultiplier(currentLevel + 1));

        return (
            <div key={label} style={styles.statRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '24px' }}>{icon}</span>
                    <span style={styles.statLabel}>{label.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={styles.statValue}>{currentVal}</span>
                    {currentLevel < maxLevel && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', gap: '15px' }}
                        >
                            <span style={{ color: '#f0c040', fontWeight: 900 }}>→</span>
                            <span style={{ ...styles.statValue, color: color }}>{nextVal}</span>
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

            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.headerTitleGroup}>
                    <h1 style={styles.mainTitle}>КОРОЛЕВСКАЯ КУЗНИЦА</h1>
                    <div style={styles.titleUnderline} />
                </div>
                <button onClick={goToCity} style={styles.closeBtn}>
                    ВЫХОД [ESC]
                </button>
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
                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    animate={isSelected ? {
                                        scale: [1, 1.02, 1],
                                        boxShadow: [
                                            '0 0 10px rgba(240,192,64,0.3)',
                                            '0 0 25px rgba(240,192,64,0.6)',
                                            '0 0 10px rgba(240,192,64,0.3)'
                                        ]
                                    } : {}}
                                    transition={isSelected ? { duration: 2, repeat: Infinity } : {}}
                                    onClick={() => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        setSelectedItemId(item.id);
                                    }}
                                    style={{
                                        ...styles.itemCard,
                                        border: isSelected ? '3px solid #f0c040' : '1px solid rgba(255,255,255,0.1)',
                                        background: isSelected ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.03)',
                                    }}
                                >
                                    <img src={data.image} style={styles.itemImg} alt="" />
                                    <div style={styles.itemLvlBadge}>L{item.level || 1}</div>
                                    {isSelected && <div style={styles.selectedIndicator} />}
                                </motion.button>
                            );
                        })}
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
                            animate={isUpgrading ? { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] } : {}}
                            transition={{ duration: 0.15, repeat: isUpgrading ? Infinity : 0 }}
                            style={styles.heroItemContainer}
                        >
                            <img
                                src={itemData.image}
                                style={{
                                    ...styles.heroItemImg,
                                    filter: `drop-shadow(0 0 50px ${isUpgrading ? '#ff6600' : '#f0c04066'})`,
                                }}
                                alt=""
                            />
                            <motion.div
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={styles.itemGlow}
                            />
                        </motion.div>
                    )}

                    <div style={styles.itemInfo}>
                        <h2 style={styles.itemName}>{itemData?.name || 'ВЫБЕРИТЕ ПРЕДМЕТ'}</h2>
                        {itemData && (
                            <div style={styles.powerBadge}>
                                МОЩЬ: {calculateItemPower({ ...itemData, level: currentLevel })}
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
                                <GfxMenuButton
                                    onClick={handleUpgrade}
                                    disabled={!canUpgrade || isUpgrading}
                                    style={{
                                        height: '90px',
                                        background: 'linear-gradient(135deg, #f0c040 0%, #a6844a 100%)',
                                        fontSize: '24px',
                                        boxShadow: '0 10px 40px rgba(240,192,64,0.3)',
                                    }}
                                >
                                    {isUpgrading ? 'ПРОЦЕСС КОВКИ...' : 'УЛУЧШИТЬ'}
                                </GfxMenuButton>
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
        filter: 'brightness(0.7)', // [Lead Architect]: Increased visibility as requested
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
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        padding: '0 60px 60px 60px',
        gap: '40px',
    },
    arsenalPanel: {
        width: '450px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '30px',
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
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '30px',
        padding: '40px',
        border: '1px solid rgba(255,255,255,0.05)',
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
        background: 'rgba(20,15,10,0.8)',
        borderRadius: '30px',
        padding: '40px',
        border: '1px solid #f0c04044',
        textAlign: 'center',
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
