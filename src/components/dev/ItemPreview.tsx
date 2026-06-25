import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/react';

export interface ItemPreviewData {
    id: string;
    name: string;
    description: string;
    type: string;
    subTab: string;
    rarity: string;
    requiredLevel: number;
    priceGold?: number;
    priceGem?: number;
    stats: {
        attack?: number;
        defense?: number;
        health?: number;
        speed?: number;
        critChance?: number;
        critDamage?: number;
    };
    image: string;
}

interface ItemPreviewProps {
    item: ItemPreviewData;
}

const getRarityColor = (rarity: string) => {
    switch (rarity) {
        case 'COMMON':
            return '#b0c4de';
        case 'RARE':
            return '#3b82f6';
        case 'EPIC':
            return '#a855f7';
        case 'LEGENDARY':
            return '#f97316';
        case 'MYTHIC':
            return '#ef4444';
        default:
            return '#ffffff';
    }
};

const getRarityGradient = (rarity: string) => {
    if (rarity === 'MYTHIC') {
        return 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)';
    }
    return getRarityColor(rarity);
};

export const ItemPreview: React.FC<ItemPreviewProps> = ({ item }) => {
    useEffect(() => {
        console.warn('[DEPRECATED IMPORT] ItemPreview legacy component is mounted.');
        try {
            Sentry.withScope((scope) => {
                scope.setTag('migration_phase', 'deprecation_stage');
                scope.setExtra('legacy_component', 'ItemPreview');
                Sentry.captureMessage('Legacy Component Access: ItemPreview', 'warning');
            });
        } catch (e) {}
    }, []);

    const glow = getRarityColor(item.rarity);
    const borderStyle =
        item.rarity === 'MYTHIC'
            ? {
                  borderImageSource: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                  borderImageSlice: 1,
                  borderWidth: '2px',
                  borderStyle: 'solid',
              }
            : { border: `1.5px solid ${glow}88` };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '30px',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '20px',
                background: 'rgba(15, 12, 12, 0.95)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                color: '#fff',
                maxWidth: '700px',
                margin: '0 auto',
                fontFamily: "'Nunito', sans-serif",
            }}
        >
            {/* Left Column: Game Shop Card Style */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span
                    style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#aaa',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                    }}
                >
                    Вид в магазине
                </span>
                <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    style={{
                        width: '160px',
                        height: '180px',
                        background: 'linear-gradient(180deg, rgba(30,25,25,0.85) 0%, rgba(15,15,20,0.95) 100%)',
                        ...borderStyle,
                        boxShadow: `0 4px 15px rgba(0,0,0,0.6), 0 0 10px ${glow}22`,
                        borderRadius: item.rarity === 'MYTHIC' ? '0px' : '10px',
                        padding: '12px 10px 10px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Item Rarity Tag */}
                    <span
                        style={{
                            fontSize: '9px',
                            color: glow,
                            fontWeight: 900,
                            alignSelf: 'flex-start',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            background:
                                item.rarity === 'MYTHIC'
                                    ? 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
                                    : undefined,
                            WebkitBackgroundClip: item.rarity === 'MYTHIC' ? 'text' : undefined,
                            WebkitTextFillColor: item.rarity === 'MYTHIC' ? 'transparent' : undefined,
                        }}
                    >
                        {item.rarity}
                    </span>

                    {/* Sprite Container */}
                    <div
                        style={{
                            width: '85px',
                            height: '85px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src={item.image || '/assets/images/ui/gift_premium.webp'}
                            onError={(e) => {
                                // Standard fallback image
                                e.currentTarget.src = 'https://placehold.co/128x128/221c1c/f0c040?text=?';
                            }}
                            style={{
                                width: '75px',
                                height: '75px',
                                objectFit: 'contain',
                                filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${glow}44)`,
                            }}
                            alt=""
                        />
                    </div>

                    {/* Tiny Item Name */}
                    <span
                        style={{
                            fontSize: '11px',
                            color: '#e8d5a0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 700,
                            textAlign: 'center',
                        }}
                    >
                        {item.name || 'Без названия'}
                    </span>
                </motion.div>
            </div>

            {/* Right Column: Detailed Inspect Style */}
            <div
                style={{
                    flex: 1,
                    minWidth: '280px',
                    background: 'rgba(5, 5, 5, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {/* Rarity & Name */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Rarity Badge */}
                        <span
                            style={{
                                fontSize: '10px',
                                background: getRarityGradient(item.rarity),
                                color: '#fff',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            }}
                        >
                            {item.rarity}
                        </span>

                        {/* Required Level */}
                        {item.requiredLevel > 1 && (
                            <span
                                style={{
                                    fontSize: '10px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                }}
                            >
                                Требуемый уровень: {item.requiredLevel}
                            </span>
                        )}
                    </div>

                    <h3
                        style={{
                            margin: '8px 0 0 0',
                            fontSize: '18px',
                            color: '#f0c040',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {item.name || 'Без названия'}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        Категория: {item.subTab} | ID: <code style={{ color: '#aaa' }}>{item.id || 'not_set'}</code>
                    </div>
                </div>

                {/* Description */}
                <div
                    style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.7)',
                        fontStyle: 'italic',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.03)',
                    }}
                >
                    {item.description || 'Нет описания предмета.'}
                </div>

                {/* Stats */}
                <div>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#aaa',
                            textTransform: 'uppercase',
                            display: 'block',
                            marginBottom: '6px',
                        }}
                    >
                        Характеристики
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <StatRow icon="⚔️" label="Атака" value={item.stats.attack} />
                        <StatRow icon="🛡️" label="Защита" value={item.stats.defense} />
                        <StatRow icon="❤️" label="Здоровье" value={item.stats.health} />
                        <StatRow icon="⚡" label="Скорость" value={item.stats.speed} isPercent />
                        <StatRow icon="🎯" label="Крит Шанс" value={item.stats.critChance} isPercent />
                        <StatRow icon="💥" label="Крит Урон" value={item.stats.critDamage} />
                    </div>
                </div>

                {/* Price Display */}
                <div
                    style={{
                        marginTop: '5px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 700 }}>Цена:</span>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px', fontWeight: 900 }}
                    >
                        {item.priceGem !== undefined && (
                            <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {item.priceGem.toLocaleString()} 💎
                            </span>
                        )}
                        {item.priceGold !== undefined && (
                            <span style={{ color: '#f0c040', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {item.priceGold.toLocaleString()} 🪙
                            </span>
                        )}
                        {item.priceGold === undefined && item.priceGem === undefined && (
                            <span style={{ color: '#ef4444' }}>Бесплатно</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ icon: string; label: string; value?: number; isPercent?: boolean }> = ({
    icon,
    label,
    value = 0,
    isPercent = false,
}) => {
    if (value === 0) return null;
    const displayVal = isPercent ? `+${value}%` : `+${value}`;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '12px',
            }}
        >
            <span>{icon}</span>
            <span style={{ color: '#aaa', flex: 1 }}>{label}</span>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayVal}</span>
        </div>
    );
};
