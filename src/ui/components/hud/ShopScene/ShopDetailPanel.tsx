import React from 'react';
import { ShopItem } from '../../../../configs/ShopConfig';
import { getRarityColor, rarityTranslation, getItemStats } from './shopHelpers';
import { FloatingStatRow } from './FloatingStatRow';
import { BuyBtn } from './BuyBtn';
import { SKINS_DB } from '../../../../configs/SkinsConfig';

interface ShopDetailPanelProps {
    selectedItem: ShopItem;
    playerLevel: number;
    shopDiscounts: any;
    itemPower: number;
    equippedItem: any;
    powerDiff: number;
    handleBuyTrigger: (item: ShopItem) => void;
    isMobile?: boolean;
}

export const ShopDetailPanel: React.FC<ShopDetailPanelProps> = ({
    selectedItem,
    playerLevel,
    shopDiscounts,
    itemPower,
    equippedItem,
    powerDiff,
    handleBuyTrigger,
    isMobile = false,
}) => {
    const stats = getItemStats(selectedItem);

    // Helper to render stat with comparison
    const renderStatWithCompare = (
        icon: string,
        label: string,
        key: 'attackBonus' | 'defenseBonus' | 'hpBonus' | 'critBonus' | 'speedBonus',
        isPercent = false,
    ) => {
        if (!stats) return null;
        const val = stats[key];
        if (val === undefined) return null;

        const displayVal = isPercent ? `+${Math.round(val * 100)}%` : `+${val}`;
        let compText = null;

        if (equippedItem) {
            const eqVal = (equippedItem[key] as number | undefined) || 0;
            const diff = val - eqVal;
            if (diff > 0) {
                compText = (
                    <span
                        style={{
                            color: '#4ade80',
                            fontSize: '11px',
                            fontWeight: 'bold',
                        }}
                    >
                        +{isPercent ? `${Math.round(diff * 100)}%` : diff} 📈
                    </span>
                );
            } else if (diff < 0) {
                compText = (
                    <span
                        style={{
                            color: '#f87171',
                            fontSize: '11px',
                            fontWeight: 'bold',
                        }}
                    >
                        {isPercent ? `${Math.round(diff * 100)}%` : diff} 📉
                    </span>
                );
            } else {
                compText = <span style={{ color: '#94a3b8', fontSize: '11px' }}>=</span>;
            }
        }

        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                <FloatingStatRow icon={icon} label={label} value={displayVal} />
                {compText && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>СРАВН:</span>
                        {compText}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            style={{
                width: isMobile ? '260px' : '380px',
                background: 'rgba(10,8,8,0.85)',
                border: `2px solid ${getRarityColor(selectedItem.rarity)}88`,
                boxShadow: `0 0 30px ${getRarityColor(selectedItem.rarity)}22, inset 0 0 20px rgba(0,0,0,0.8)`,
                borderRadius: '16px',
                padding: isMobile ? '12px' : '25px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '8px' : '20px',
                    flex: 1,
                    height: '100%',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '20px' }}>
                    {/* Header: Quality/Rarity and Name */}
                    <div
                        style={{
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: isMobile ? '6px' : '12px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: isMobile ? '9px' : '11px',
                                color: getRarityColor(selectedItem.rarity),
                                fontWeight: 900,
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            {rarityTranslation[selectedItem.rarity] || selectedItem.rarity}
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '5px',
                                gap: '5px',
                            }}
                        >
                            <h4
                                style={{
                                    margin: 0,
                                    fontSize: isMobile ? '16px' : '22px',
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    lineHeight: '1.2',
                                }}
                            >
                                {selectedItem.name}
                            </h4>
                            {selectedItem.mainTab === 'ARSENAL' && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? '3px' : '6px',
                                        background: 'rgba(240, 192, 64, 0.1)',
                                        border: '1px solid rgba(240, 192, 64, 0.3)',
                                        borderRadius: '6px',
                                        padding: isMobile ? '2px 5px' : '3px 8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src="/assets/images/ui/mosh.png"
                                        style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                        alt="Мощь"
                                    />
                                    <span
                                        style={{
                                            color: '#f0c040',
                                            fontWeight: 900,
                                            fontSize: '13px',
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {itemPower}
                                    </span>
                                    {equippedItem && powerDiff !== 0 && (
                                        <span
                                            style={{
                                                color: powerDiff > 0 ? '#4ade80' : '#f87171',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                marginLeft: '2px',
                                            }}
                                        >
                                            {powerDiff > 0 ? `+${powerDiff}` : powerDiff}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Required level badge */}
                        {selectedItem.requiredLevel !== undefined && selectedItem.requiredLevel > 1 && (
                            <div
                                style={{
                                    marginTop: '8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '11px',
                                    color:
                                        (playerLevel || 1) >= (selectedItem.requiredLevel || 1) ? '#4ade80' : '#ef4444',
                                    fontWeight: 800,
                                    background:
                                        (playerLevel || 1) >= (selectedItem.requiredLevel || 1)
                                            ? 'rgba(74,222,128,0.1)'
                                            : 'rgba(239,68,68,0.1)',
                                    border: `1px solid ${
                                        (playerLevel || 1) >= (selectedItem.requiredLevel || 1)
                                            ? 'rgba(74,222,128,0.3)'
                                            : 'rgba(239,68,68,0.3)'
                                    }`,
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                }}
                            >
                                <span>{(playerLevel || 1) >= (selectedItem.requiredLevel || 1) ? '✓' : '🔒'}</span>
                                <span>Уровень {selectedItem.requiredLevel}</span>
                                {(playerLevel || 1) < (selectedItem.requiredLevel || 1) && (
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}> (у вас: {playerLevel || 1})</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats of the selected item */}
                    {stats && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {renderStatWithCompare('⚔️', 'АТАКА', 'attackBonus')}
                            {renderStatWithCompare('🛡️', 'ЗАЩИТА', 'defenseBonus')}
                            {renderStatWithCompare('❤️', 'ЗДОРОВЬЕ', 'hpBonus')}
                            {renderStatWithCompare('🎯', 'КРИТ. ШАНС', 'critBonus', true)}
                            {renderStatWithCompare('⚡', 'СКОР. АТАКИ', 'speedBonus', true)}
                        </div>
                    )}

                    {/* Description / Flavor Text */}
                    {(selectedItem.flavor || selectedItem.desc) && (
                        <div
                            style={{
                                fontSize: isMobile ? '11px' : '13px',
                                color: 'rgba(255,255,255,0.7)',
                                lineHeight: '1.4',
                                fontStyle: 'italic',
                                background: 'rgba(255,255,255,0.02)',
                                padding: isMobile ? '8px' : '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: isMobile ? 3 : 6,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {selectedItem.flavor || selectedItem.desc}
                        </div>
                    )}
                    {/* Battle Pass notice for skins */}
                    {selectedItem.mainTab === 'SKINS' &&
                        (() => {
                            const skinMeta = SKINS_DB.find((s) => s.id === selectedItem.id);
                            if (!skinMeta || skinMeta.source !== 'battle_pass') return null;
                            return (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background:
                                            'linear-gradient(90deg, rgba(240,192,64,0.10) 0%, rgba(240,140,30,0.07) 100%)',
                                        border: '1px solid rgba(240,192,64,0.35)',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        marginTop: '4px',
                                    }}
                                >
                                    <span style={{ fontSize: '18px', lineHeight: 1 }}>🎖️</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                color: '#f0c040',
                                                fontWeight: 900,
                                                letterSpacing: '0.8px',
                                                textTransform: 'uppercase',
                                                fontFamily: "'Cinzel', serif",
                                            }}
                                        >
                                            Также в Боевом Пропуске
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                                            {skinMeta.sourceLabel}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                </div>

                {/* Buy Button & Price at the bottom */}
                <div style={{ width: '100%' }}>
                    <BuyBtn
                        item={selectedItem}
                        onTrigger={() => handleBuyTrigger(selectedItem)}
                        discount={shopDiscounts?.[selectedItem.id]}
                    />
                </div>
            </div>
        </div>
    );
};
