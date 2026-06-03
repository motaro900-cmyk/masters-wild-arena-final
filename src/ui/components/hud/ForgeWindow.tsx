import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { GfxMenuButton } from './SharedUI';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

// Статический конфиг искр (вынесен за пределы компонента для чистоты хуков)
const STATIC_SPARKS = [...Array(40)].map((_, i) => ({
    id: i,
    targetX: `${10 + ((i * 7.7) % 80)}%`,
    targetY: `${10 + ((i * 13.3) % 80)}%`,
    delay: (i * 0.05) % 0.5,
}));

/**
 * КУЗНИЦА: ПРЕМИУМ-ИНТЕРФЕЙС
 * Позволяет улучшать предметы, повышая их характеристики и мощь.
 */
export const ForgeWindow: React.FC = () => {
    const { gold, crystals, inventory, heroEquipment, selectedHeroId, upgradeItem } = useGameStore();
    const heroId = selectedHeroId || 'panda';
    const equipped = heroEquipment[heroId] || {};

    // Состояние выбора предмета
    const [selectedItemId, setSelectedItemId] = useState<string | null>(
        equipped.WEAPONS || (() => {
            const firstWep = inventory.find((i: any) => i.type === 'WEAPONS' || i.subTab === 'WEAPONS');
            return firstWep ? (firstWep.instanceId || firstWep.id) : null;
        })()
    );

    // Состояние для эффектов
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const invItem = inventory.find((i: any) => i.instanceId === selectedItemId || String(i.id) === selectedItemId);
    const itemData = invItem ? ITEMS_DATABASE[invItem.id] : null;

    const currentLevel = invItem?.level || 1;
    const maxLevel = 3; // максимальный уровень соответствует useGameStore

    // Расчет стоимости — Баланс v2 (синхронизировано с useGameStore.upgradeItem)
    let upgradeCostGold = 0;
    let upgradeCostGem = 0;

    if (itemData) {
        const isDiamondItem = (itemData as any).priceGem && (itemData as any).priceGem > 0;
        if (!isDiamondItem) {
            const basePrice = (itemData as any).priceGold || 0;
            if (currentLevel === 1)
                upgradeCostGold = Math.round(basePrice * 1.5); // было 0.5×
            else if (currentLevel === 2) upgradeCostGold = Math.round(basePrice * 3.0); // было 1.0×
        } else {
            if (currentLevel === 1)
                upgradeCostGem = 75; // было 50
            else if (currentLevel === 2) upgradeCostGem = 150; // было 100
        }
    }

    const canUpgrade = currentLevel < maxLevel && gold >= upgradeCostGold && (crystals || 0) >= upgradeCostGem;

    const handleUpgrade = async () => {
        if (!selectedItemId || isUpgrading || !canUpgrade) return;

        setIsUpgrading(true);
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

        await new Promise((resolve) => setTimeout(resolve, 1200));

        const success = upgradeItem(selectedItemId);
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
        setIsUpgrading(false);
    };

    const getStatMultiplier = (lvl: number) => 1 + (lvl - 1) * 0.15;

    const renderStatRow = (label: string, icon: string, value: number | undefined, color: string) => {
        if (!value) return null;
        const currentVal = Math.round(value * getStatMultiplier(currentLevel));
        const nextVal = Math.round(value * getStatMultiplier(currentLevel + 1));

        return (
            <div
                key={label}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600 }}>
                        {label.toUpperCase()}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>{currentVal}</span>
                    {currentLevel < maxLevel && (
                        <motion.div
                            initial={{ x: -5, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                            <span style={{ color: '#f0c040', fontWeight: 900 }}>→</span>
                            <span style={{ color: color, fontWeight: 900, fontSize: '18px' }}>{nextVal}</span>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                background: 'radial-gradient(circle at center, rgba(30,20,10,0.4) 0%, transparent 100%)',
                padding: '20px',
                gap: '30px',
            }}
        >
            <div
                style={{
                    width: '380px',
                    background: 'rgba(10,10,10,0.6)',
                    borderRadius: '24px',
                    border: '1px solid rgba(200,168,112,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <h3 style={{ fontFamily: "'Cinzel', serif", color: '#f0c040', fontSize: '18px', margin: 0 }}>
                        АРСЕНАЛ
                    </h3>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{inventory.length} ПРЕДМЕТОВ</div>
                </div>

                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        paddingRight: '5px',
                    }}
                >
                    {inventory
                        .filter((i: any) =>
                            ['WEAPONS', 'ARMOR', 'HELMETS', 'SHIELDS', 'SHOULDERS', 'BOOTS', 'PANTS'].includes(
                                i.type || ITEMS_DATABASE[i.id]?.subTab,
                            ),
                        )
                        .map((item: any) => {
                            const data = ITEMS_DATABASE[item.id] as any;
                            if (!data) return null;
                            const itemKey = item.instanceId || item.id;
                            const isSelected = selectedItemId === itemKey;
                            const isEquipped = Object.values(equipped).includes(itemKey) || Object.values(equipped).includes(item.id);

                            return (
                                <motion.button
                                    key={itemKey}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => setSelectedItemId(itemKey)}
                                    style={{
                                        aspectRatio: '1/1',
                                        background: isSelected ? 'rgba(240,192,64,0.15)' : 'rgba(255,255,255,0.03)',
                                        border: isSelected ? '2px solid #f0c040' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '10px',
                                        boxShadow: isSelected ? '0 0 15px rgba(240,192,64,0.2)' : 'none',
                                    }}
                                >
                                    <img
                                        src={data.image}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        alt=""
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: '4px',
                                            right: '6px',
                                            background: '#f0c040',
                                            color: '#000',
                                            fontSize: '10px',
                                            fontWeight: 900,
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        L{item.level || 1}
                                    </div>
                                    {isEquipped && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                left: '-5px',
                                                fontSize: '14px',
                                            }}
                                        >
                                            🛡️
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {itemData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '25px' }}>
                        <div
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.4)',
                                borderRadius: '30px',
                                border: '1px solid rgba(240,192,64,0.2)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            <AnimatePresence>
                                {isUpgrading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
                                    >
                                        {STATIC_SPARKS.map((spark) => (
                                            <motion.div
                                                key={spark.id}
                                                initial={{ x: '50%', y: '50%', scale: 0 }}
                                                animate={{
                                                    x: spark.targetX,
                                                    y: spark.targetY,
                                                    scale: [0, 1, 0],
                                                    opacity: [1, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    repeat: Infinity,
                                                    delay: spark.delay,
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    width: '4px',
                                                    height: '4px',
                                                    background: '#ff6600',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 0 10px #ffcc00',
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                animate={
                                    isUpgrading
                                        ? {
                                              y: [0, -10, 0],
                                              scale: [1, 1.05, 1],
                                              rotate: [0, 2, -2, 0],
                                          }
                                        : {}
                                }
                                transition={{ duration: 0.2, repeat: isUpgrading ? Infinity : 0 }}
                                style={{
                                    width: '280px',
                                    height: '280px',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 2,
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `radial-gradient(circle, ${isUpgrading ? '#ff660044' : '#f0c04022'} 0%, transparent 70%)`,
                                        borderRadius: '50%',
                                    }}
                                />
                                <img
                                    src={itemData.image}
                                    style={{
                                        width: '80%',
                                        height: '80%',
                                        objectFit: 'contain',
                                        filter: `drop-shadow(0 0 30px ${isUpgrading ? '#ff6600' : '#f0c04066'})`,
                                    }}
                                    alt=""
                                />
                            </motion.div>

                            <div style={{ position: 'absolute', bottom: '30px', textAlign: 'center', zIndex: 3 }}>
                                <h2
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: '28px',
                                        color: '#fff',
                                        margin: '0 0 5px 0',
                                        textShadow: '0 2px 10px rgba(0,0,0,1)',
                                    }}
                                >
                                    {itemData.name}
                                </h2>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '15px',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            background: 'rgba(0,0,0,0.6)',
                                            padding: '5px 15px',
                                            borderRadius: '10px',
                                            border: '1px solid #f0c040',
                                        }}
                                    >
                                        <span style={{ color: '#f0c040', fontWeight: 900 }}>
                                            УРОВЕНЬ {currentLevel}
                                        </span>
                                    </div>
                                    <span style={{ color: '#fff', fontSize: '24px' }}>🛡️</span>
                                    <div style={{ color: '#f0c040', fontWeight: 900 }}>
                                        МОЩЬ: {calculateItemPower({ ...itemData, level: currentLevel })}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showSuccess && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1.2, opacity: 1 }}
                                        exit={{ scale: 1.5, opacity: 0 }}
                                        style={{
                                            position: 'absolute',
                                            top: '40%',
                                            color: '#10b981',
                                            fontSize: '48px',
                                            fontWeight: 900,
                                            fontFamily: "'Cinzel', serif",
                                            textShadow: '0 0 20px rgba(16,185,129,0.8)',
                                            zIndex: 10,
                                        }}
                                    >
                                        УСПЕХ!
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div
                            style={{
                                background: 'rgba(20,20,20,0.8)',
                                borderRadius: '24px',
                                padding: '25px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '30px',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h4
                                    style={{
                                        color: '#c8a870',
                                        fontSize: '12px',
                                        letterSpacing: '3px',
                                        marginBottom: '15px',
                                    }}
                                >
                                    ХАРАКТЕРИСТИКИ
                                </h4>
                                {renderStatRow('Сила Атаки', '⚔️', (itemData as any).attackBonus, '#ef4444')}
                                {renderStatRow('Защита', '🛡️', (itemData as any).defenseBonus, '#3b82f6')}
                                {renderStatRow('Здоровье', '❤️', (itemData as any).hpBonus, '#22c55e')}
                                {renderStatRow(
                                    'Скорость',
                                    '⚡',
                                    (itemData as any).speedBonus || (itemData as any).attackSpeed,
                                    '#fcd34d',
                                )}
                                {renderStatRow(
                                    'Крит. Шанс',
                                    '🎯',
                                    (itemData as any).critBonus || (itemData as any).critChance,
                                    '#a855f7',
                                )}
                            </div>

                            <div
                                style={{
                                    width: '320px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    gap: '20px',
                                }}
                            >
                                {currentLevel < maxLevel ? (
                                    <>
                                        <div style={{ textAlign: 'center' }}>
                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                СТОИМОСТЬ УЛУЧШЕНИЯ
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '20px',
                                                    justifyContent: 'center',
                                                    fontSize: '22px',
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {upgradeCostGold > 0 && (
                                                    <span
                                                        style={{
                                                            color: gold >= upgradeCostGold ? '#fcd34d' : '#ef4444',
                                                        }}
                                                    >
                                                        {upgradeCostGold.toLocaleString()} 🟡
                                                    </span>
                                                )}
                                                {upgradeCostGem > 0 && (
                                                    <span
                                                        style={{
                                                            color: crystals >= upgradeCostGem ? '#00e5ff' : '#ef4444',
                                                        }}
                                                    >
                                                        {upgradeCostGem.toLocaleString()} 💎
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <GfxMenuButton
                                            onClick={handleUpgrade}
                                            disabled={!canUpgrade || isUpgrading}
                                            style={{
                                                height: '80px',
                                                opacity: canUpgrade && !isUpgrading ? 1 : 0.5,
                                                background: 'linear-gradient(135deg, #f0c040 0%, #a6844a 100%)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span style={{ fontSize: '20px', fontWeight: 900, color: '#000' }}>
                                                    {isUpgrading ? 'КУЕМ...' : 'УЛУЧШИТЬ ПРЕДМЕТ'}
                                                </span>
                                                {!isUpgrading && (
                                                    <span
                                                        style={{
                                                            fontSize: '10px',
                                                            color: '#000',
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        Шанс успеха: 100%
                                                    </span>
                                                )}
                                            </div>
                                        </GfxMenuButton>
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            height: '80px',
                                            background: 'rgba(16,185,129,0.1)',
                                            borderRadius: '16px',
                                            border: '1px solid #10b981',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#10b981',
                                            fontWeight: 900,
                                            fontSize: '18px',
                                        }}
                                    >
                                        МАКСИМАЛЬНЫЙ УРОВЕНЬ
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.5,
                        }}
                    >
                        ВЫБЕРИТЕ ПРЕДМЕТ ИЗ АРСЕНАЛА СЛЕВА
                    </div>
                )}
            </div>
        </div>
    );
};
