import React from 'react';
import { motion } from 'framer-motion';
import { ITEMS_DATABASE } from '../../../../game/configs/ItemsConfig';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { resolveAssetPath } from '../../../../utils/assetPath';
import { styles, rarityColors, rarityTranslation, itemTypeTranslation } from './ForgeStyles';

interface ForgeUpgradePanelProps {
    itemData: any;
    currentLevel: number;
    currentXp: number;
    maxXp: number;
    progressXp: number;
    reqs: any;
    isDiamondItem: boolean;
    gemCost: number;
    goldCost: number;
    coal: number;
    steel_bars: number;
    runic_shards: number;
    protection_stones: number;
    stateStore: any;
    useProtection: boolean;
    setUseProtection: React.Dispatch<React.SetStateAction<boolean>>;
    canUpgrade: boolean;
    isUpgrading: boolean;
    handleUpgrade: () => void;
    isMaxLevel: boolean;
    itemReforgeMultiplier: number;
    getStatMultiplier: (lvl: number) => number;
}

export const ForgeUpgradePanel: React.FC<ForgeUpgradePanelProps> = ({
    itemData,
    currentLevel,
    currentXp,
    maxXp,
    progressXp,
    reqs,
    isDiamondItem,
    gemCost,
    goldCost,
    coal,
    steel_bars,
    runic_shards,
    protection_stones,
    stateStore,
    useProtection,
    setUseProtection,
    canUpgrade,
    isUpgrading,
    handleUpgrade,
    isMaxLevel,
    itemReforgeMultiplier,
    getStatMultiplier,
}) => {
    const needsProtection = currentLevel >= 5;

    const renderStatDetails = (label: string, value: number | undefined) => {
        if (!value) return null;
        const currentVal = Math.round(value * getStatMultiplier(currentLevel) * itemReforgeMultiplier);
        const nextVal = Math.round(value * getStatMultiplier(currentLevel + 1) * itemReforgeMultiplier);
        const diff = nextVal - currentVal;

        return (
            <div
                key={label}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
            >
                <span style={{ fontSize: 14, opacity: 0.9, color: '#e8d8a8', fontWeight: 700 }}>
                    {label.toUpperCase()}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>{currentVal}</span>
                    {!isMaxLevel && <span style={{ fontSize: 14, color: '#4ade80', fontWeight: 900 }}>+{diff}</span>}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.statsPanel}>
            {itemData ? (
                <>
                    <div style={styles.itemDetailsCard}>
                        <span style={{ ...styles.itemSubtitle, color: rarityColors[itemData.rarity] || '#fff' }}>
                            {rarityTranslation[itemData.rarity] || 'ОБЫЧНЫЙ'}{' '}
                            {itemTypeTranslation[(itemData as any).subTab] || 'СНАРЯЖЕНИЕ'}
                        </span>
                        <h2 style={styles.itemName}>{itemData.name}</h2>

                        {/* Изображение предмета (Круглый пьедестал) */}
                        <div style={styles.itemShowcaseContainer}>
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: `radial-gradient(circle, ${(rarityColors[itemData.rarity] || '#fff') + '22'} 0%, transparent 70%)`,
                                }}
                            />
                            <img
                                src={itemData.image}
                                style={{
                                    width: '95%',
                                    height: '95%',
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 0 20px ${rarityColors[itemData.rarity] || '#fff'})`,
                                    transform: 'rotate(-5deg)',
                                }}
                                alt=""
                            />
                        </div>

                        {/* Шкала прогресса уровня */}
                        <div style={{ width: '100%', marginTop: 15 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 12,
                                    marginBottom: 5,
                                }}
                            >
                                <span style={{ fontWeight: 900 }}>УРОВЕНЬ: {currentLevel}/10</span>
                                <span style={{ opacity: 0.6 }}>
                                    {Math.round(currentXp)} / {maxXp} XP
                                </span>
                            </div>
                            <div style={styles.progressBarBg}>
                                <div style={{ ...styles.progressBarFill, width: `${progressXp}%` }} />
                            </div>
                        </div>

                        {/* Характеристики */}
                        <div style={{ width: '100%', marginTop: 20 }}>
                            <h4 style={styles.statsListHeader}>ХАРАКТЕРИСТИКИ</h4>
                            <div style={styles.statsList}>
                                {renderStatDetails('Атака', (itemData as any).attackBonus)}
                                {renderStatDetails('Защита', (itemData as any).defenseBonus)}
                                {renderStatDetails('Здоровье', (itemData as any).hpBonus)}
                                {renderStatDetails('Крит. Шанс', (itemData as any).critChance)}
                                {renderStatDetails('Пробивание', (itemData as any).penetration)}
                            </div>
                        </div>
                    </div>

                    {/* Требуемые Ресурсы */}
                    <div style={styles.resourcesCostCard}>
                        <h4 style={styles.statsListHeader}>ТРЕБУЕМЫЕ РЕСУРСЫ</h4>
                        <div style={styles.resourcesGrid}>
                            {/* Уголь */}
                            <div style={styles.resourceReqItem}>
                                <img
                                    src={resolveAssetPath('/assets/images/resources/coal.png')}
                                    style={styles.resIcon}
                                    alt="Coal"
                                />
                                <span
                                    style={{
                                        color: (coal || 0) >= reqs.coalCost ? '#4ade80' : '#f87171',
                                        fontSize: 14,
                                        fontWeight: 900,
                                    }}
                                >
                                    {coal || 0}/{reqs.coalCost}
                                </span>
                            </div>
                            {/* Сталь */}
                            <div style={styles.resourceReqItem}>
                                <img
                                    src={resolveAssetPath('/assets/images/resources/steel_bar.png')}
                                    style={styles.resIcon}
                                    alt="Steel"
                                />
                                <span
                                    style={{
                                        color: (steel_bars || 0) >= reqs.steelCost ? '#4ade80' : '#f87171',
                                        fontSize: 14,
                                        fontWeight: 900,
                                    }}
                                >
                                    {steel_bars || 0}/{reqs.steelCost}
                                </span>
                            </div>
                            {/* Кристаллы улучшения (руны) */}
                            {reqs.shardCost > 0 && (
                                <div style={styles.resourceReqItem}>
                                    <img
                                        src={resolveAssetPath('/assets/images/resources/runic_shard.png')}
                                        style={styles.resIcon}
                                        alt="Runic Shard"
                                    />
                                    <span
                                        style={{
                                            color: (runic_shards || 0) >= reqs.shardCost ? '#4ade80' : '#f87171',
                                            fontSize: 14,
                                            fontWeight: 900,
                                        }}
                                    >
                                        {runic_shards || 0}/{reqs.shardCost}
                                    </span>
                                </div>
                            )}
                            {/* Редкий ресурс этажей */}
                            {reqs.rareType &&
                                reqs.rareCost > 0 &&
                                (() => {
                                    const rareItem = ITEMS_DATABASE[reqs.rareType];
                                    const currentRareCount = stateStore[reqs.rareType] || 0;
                                    return (
                                        <div style={styles.resourceReqItem} title={rareItem?.name}>
                                            <img
                                                src={resolveAssetPath(rareItem?.image || '')}
                                                style={styles.resIcon}
                                                alt={rareItem?.name}
                                            />
                                            <span
                                                style={{
                                                    color: currentRareCount >= reqs.rareCost ? '#4ade80' : '#f87171',
                                                    fontSize: 14,
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {currentRareCount}/{reqs.rareCost}
                                            </span>
                                        </div>
                                    );
                                })()}
                        </div>

                        {needsProtection && (
                            <div
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setUseProtection((p) => !p);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    margin: '15px 0 10px 0',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(240,192,64,0.15)',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    width: '100%',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={useProtection}
                                    onChange={() => {}}
                                    style={{ cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#fcd34d' }}>
                                        Использовать Камень Защиты
                                    </span>
                                    <span style={{ fontSize: '11px', opacity: 0.6 }}>
                                        Предотвратит понижение уровня при неудаче.
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <img
                                        src={resolveAssetPath('/assets/images/resources/protection_stone.png')}
                                        style={{ width: 20, height: 20 }}
                                        alt=""
                                    />
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 900,
                                            color: (protection_stones || 0) >= 1 ? '#4ade80' : '#f87171',
                                        }}
                                    >
                                        {protection_stones || 0}/1
                                    </span>
                                </div>
                            </div>
                        )}

                        <motion.button
                            whileHover={
                                canUpgrade && !isUpgrading
                                    ? { scale: 1.02, boxShadow: '0 0 25px rgba(240,192,64,0.45)' }
                                    : {}
                            }
                            whileTap={canUpgrade && !isUpgrading ? { scale: 0.98 } : {}}
                            disabled={!canUpgrade || isUpgrading}
                            onClick={handleUpgrade}
                            style={{
                                ...styles.upgradeBtn,
                                background: isMaxLevel
                                    ? 'rgba(255,255,255,0.05)'
                                    : canUpgrade
                                      ? 'linear-gradient(180deg, #fce074 0%, #d89c24 50%, #90600c 100%)'
                                      : 'rgba(40, 30, 20, 0.75)',
                                color: canUpgrade ? '#150c02' : 'rgba(255,255,255,0.45)',
                                border: canUpgrade ? '1px solid #f0c040' : '1px solid rgba(240, 192, 64, 0.25)',
                                cursor: canUpgrade ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                padding: '10px 0',
                                height: '64px',
                                boxShadow: canUpgrade ? '0 5px 20px rgba(240,192,64,0.25)' : 'none',
                            }}
                        >
                            {isMaxLevel ? (
                                <span style={{ fontSize: '16px', fontWeight: 900 }}>МАКС. УРОВЕНЬ</span>
                            ) : isUpgrading ? (
                                <span style={{ fontSize: '16px', fontWeight: 900 }}>КОВКА...</span>
                            ) : (
                                <>
                                    <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '3px' }}>
                                        УЛУЧШИТЬ
                                    </span>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            marginTop: '2px',
                                        }}
                                    >
                                        <img
                                            src={
                                                isDiamondItem
                                                    ? resolveAssetPath(AssetsMap.UI.ICON_ALMAZ_FULL)
                                                    : resolveAssetPath(AssetsMap.UI.ICON_GOLD_FULL)
                                            }
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                objectFit: 'contain',
                                                filter: canUpgrade ? 'none' : 'grayscale(1) brightness(0.7)',
                                            }}
                                            alt=""
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: 800 }}>
                                            {isDiamondItem ? gemCost : goldCost.toLocaleString()}
                                        </span>
                                    </div>
                                </>
                            )}
                        </motion.button>
                    </div>
                </>
            ) : (
                <div style={styles.emptyDetails}>
                    <h3>ВЫБЕРИТЕ ПРЕДМЕТ</h3>
                    <p style={{ opacity: 0.5 }}>
                        Выберите предмет экипировки из левой панели, чтобы увидеть его статы и улучшить.
                    </p>
                </div>
            )}
        </div>
    );
};
