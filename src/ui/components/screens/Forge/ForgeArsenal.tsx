import React from 'react';
import { motion } from 'framer-motion';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../game/configs/ItemsConfig';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';
import {
    styles,
    rarityColors,
    categories,
    categoryIcons,
    getPluralItems,
} from './ForgeStyles';

interface ForgeArsenalProps {
    inventory: any[];
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    sortBy: 'RARITY' | 'LEVEL' | 'POWER';
    setSortBy: (sortBy: 'RARITY' | 'LEVEL' | 'POWER') => void;
    selectedItemId: string | null;
    setSelectedItemId: (id: string | null) => void;
    onDismantle: () => void;
    onReforge: () => void;
}

export const ForgeArsenal: React.FC<ForgeArsenalProps> = ({
    inventory,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    selectedItemId,
    setSelectedItemId,
    onDismantle,
    onReforge,
}) => {
    // Фильтруем инвентарь по категории
    const filteredInventory = inventory.filter((item: any) => {
        const data = ITEMS_DATABASE[item.id] as any;
        if (!data) return false;
        const subTab = data.subTab || data.type || '';
        if (activeCategory === 'ALL')
            return ['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS'].includes(subTab);
        return subTab === activeCategory;
    });

    // Сортировка инвентаря
    const sortedInventory = [...filteredInventory].sort((a: any, b: any) => {
        const dataA = ITEMS_DATABASE[a.id] as any;
        const dataB = ITEMS_DATABASE[b.id] as any;
        if (!dataA || !dataB) return 0;

        if (sortBy === 'LEVEL') {
            return (b.level || 1) - (a.level || 1);
        }
        if (sortBy === 'POWER') {
            return calculateItemPower(dataB) - calculateItemPower(dataA);
        }
        const rarityWeights: Record<string, number> = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
        const weightA = rarityWeights[dataA.rarity] || 0;
        const weightB = rarityWeights[dataB.rarity] || 0;
        return weightB - weightA;
    });

    return (
        <div style={styles.arsenalPanel}>
            <div style={styles.panelHeader}>
                <span>ВАШ АРСЕНАЛ</span>
                <span style={{ color: '#e8d8a8', opacity: 0.8, fontSize: '14px' }}>
                    {getPluralItems(inventory.length)}
                </span>
            </div>

            {/* Категории */}
            <div style={styles.categoryRow}>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            setActiveCategory(cat.id);
                        }}
                        style={{
                            ...styles.categoryBtn,
                            border:
                                activeCategory === cat.id
                                    ? '1.5px solid #f0c040'
                                    : '1px solid rgba(255,255,255,0.1)',
                            background: activeCategory === cat.id ? 'rgba(240,192,64,0.15)' : 'rgba(0,0,0,0.4)',
                            boxShadow: activeCategory === cat.id ? '0 0 10px rgba(240,192,64,0.2)' : 'none',
                        }}
                    >
                        <img
                            src={categoryIcons[cat.id]}
                            style={{
                                width: '24px',
                                height: '24px',
                                objectFit: 'contain',
                                filter: activeCategory === cat.id ? 'none' : 'grayscale(1) brightness(0.7)',
                            }}
                            alt={cat.label}
                        />
                    </button>
                ))}
            </div>

            {/* Сетка предметов */}
            <div style={styles.inventoryGrid}>
                {(() => {
                    const renderedCards = sortedInventory
                        .map((item: any) => {
                            const data = ITEMS_DATABASE[item.id] as any;
                            if (!data) return null;
                            const isSelected = selectedItemId === item.id;
                            const rarityColor = rarityColors[data.rarity] || '#9e9e9e';

                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => {
                                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                        setSelectedItemId(item.id);
                                    }}
                                    style={{
                                        ...styles.itemCard,
                                        border: isSelected ? `2px solid #f0c040` : `1px solid ${rarityColor}33`,
                                        background: isSelected
                                            ? 'rgba(240,192,64,0.12)'
                                            : 'rgba(20, 15, 10, 0.5)',
                                        boxShadow: isSelected ? `0 0 15px ${rarityColor}55` : 'none',
                                    }}
                                >
                                    <img src={data.image} style={styles.itemImg} alt="" />
                                    <div
                                        style={{
                                            ...styles.itemLvlBadge,
                                            border:
                                                item.level === 5
                                                    ? '1px solid #ff4444'
                                                    : '1px solid rgba(240,192,64,0.35)',
                                            color: item.level === 5 ? '#ff4444' : '#f0c040',
                                        }}
                                    >
                                        L{item.level || 1}
                                    </div>
                                    {item.reforgeMultiplier && item.reforgeMultiplier !== 1.0 && (
                                        <div style={styles.reforgeBadge}>x{item.reforgeMultiplier}</div>
                                    )}
                                </motion.button>
                            );
                        })
                        .filter(Boolean) as React.ReactNode[];

                    const minSlots = 15;
                    const emptySlotsCount = Math.max(0, minSlots - renderedCards.length);
                    for (let i = 0; i < emptySlotsCount; i++) {
                        renderedCards.push(
                            <div
                                key={`empty-${i}`}
                                style={{
                                    ...styles.itemCard,
                                    border: '1px solid rgba(255, 255, 255, 0.04)',
                                    background: 'rgba(5, 5, 5, 0.25)',
                                    cursor: 'default',
                                    pointerEvents: 'none',
                                }}
                            />,
                        );
                    }
                    return renderedCards;
                })()}
            </div>

            {/* Сортировка */}
            <div style={styles.sortSelector}>
                <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 800 }}>СОРТИРОВКА:</span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={styles.dropdown}
                >
                    <option value="RARITY">ПО РЕДКОСТИ</option>
                    <option value="LEVEL">ПО УРОВНЮ</option>
                    <option value="POWER">ПО МОЩНОСТИ</option>
                </select>
            </div>

            {/* Кнопки разбора и перековки */}
            <div style={styles.arsenalActionsRow}>
                <motion.button
                    whileHover={
                        selectedItemId
                            ? {
                                  scale: 1.04,
                                  border: '1.5px solid #f0c040',
                                  boxShadow: '0 0 15px rgba(240,192,64,0.25)',
                              }
                            : {}
                    }
                    whileTap={selectedItemId ? { scale: 0.97 } : {}}
                    disabled={!selectedItemId}
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        onDismantle();
                    }}
                    style={{
                        ...styles.circularActionBtn,
                        opacity: selectedItemId ? 1 : 0.5,
                        cursor: selectedItemId ? 'pointer' : 'not-allowed',
                    }}
                >
                    <span style={{ fontSize: '15px' }}>⚒️</span>
                    <span style={styles.circularBtnTitle}>РАЗОБРАТЬ</span>
                </motion.button>

                <motion.button
                    whileHover={
                        selectedItemId
                            ? {
                                  scale: 1.04,
                                  border: '1.5px solid #f0c040',
                                  boxShadow: '0 0 15px rgba(240,192,64,0.25)',
                              }
                            : {}
                    }
                    whileTap={selectedItemId ? { scale: 0.97 } : {}}
                    disabled={!selectedItemId}
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        onReforge();
                    }}
                    style={{
                        ...styles.circularActionBtn,
                        opacity: selectedItemId ? 1 : 0.5,
                        cursor: selectedItemId ? 'pointer' : 'not-allowed',
                    }}
                >
                    <span style={{ fontSize: '15px' }}>🌀</span>
                    <span style={styles.circularBtnTitle}>ПЕРЕКОВАТЬ</span>
                </motion.button>
            </div>
        </div>
    );
};
