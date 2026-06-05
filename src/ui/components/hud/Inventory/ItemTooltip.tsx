import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../game/configs/ItemsConfig';
import { RARITY_COLORS, rarityTranslation } from '../InventoryPanel';

interface ItemTooltipProps {
    item: { id: string; x: number; y: number };
}

const StatRow = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ color: color, fontWeight: 900 }}>{value}</span>
    </div>
);

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item }) => {
    const store = useGameStore();
    const invItem = store.inventory.find((i: any) => String(i.id) === item.id);
    const currentLevel = invItem?.level || 1;

    const getStatMultiplier = (lvl: number) => {
        if (lvl === 1) return 1.0;
        if (lvl === 2) return 1.15;
        if (lvl === 3) return 1.35;
        return 1.0;
    };

    const mult = getStatMultiplier(currentLevel);

    const data = ITEMS_DATABASE[item.id] as any;
    if (!data) return null;

    const isResource = data.subTab === 'RESOURCES';

    // Get actual count of this resource from the store state
    let resourceAmount = 0;
    if (isResource) {
        if (item.id === 'coal') resourceAmount = store.coal || 0;
        else if (item.id === 'steel_bar') resourceAmount = store.steel_bars || 0;
        else if (item.id === 'runic_shard') resourceAmount = store.runic_shards || 0;
        else if (item.id === 'ancient_compass') resourceAmount = store.ancient_compass || 0;
        else if (item.id === 'astral_crystal') resourceAmount = store.astral_crystal || 0;
        else if (item.id === 'void_sphere') resourceAmount = store.void_sphere || 0;
        else if (item.id === 'golden_sprout') resourceAmount = store.golden_sprout || 0;
        else if (item.id === 'dragon_scale') resourceAmount = store.dragon_scale || 0;
        else if (item.id === 'lava_heart') resourceAmount = store.lava_heart || 0;
    }

    const rarity = RARITY_COLORS[data.rarity || 'COMMON'] || RARITY_COLORS.COMMON;
    const tooltipWidth = 280;

    // Bounds calculations
    const left =
        item.x + tooltipWidth + 20 > window.innerWidth ? Math.max(10, item.x - tooltipWidth - 20) : item.x + 20;

    const top = Math.max(10, Math.min(window.innerHeight - 360, item.y - 120));

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
                zIndex: 2000000,
                width: `${tooltipWidth}px`,
                background: 'rgba(15, 10, 5, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: `2px solid ${rarity.border}`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 15px ${rarity.glow}`,
                padding: '20px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
        >
            <div style={{ borderBottom: `1px solid ${rarity.border}44`, paddingBottom: '10px' }}>
                <div
                    style={{
                        color: rarity.color,
                        fontSize: '10px',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        fontFamily: "'Cinzel', serif",
                        marginBottom: '4px',
                    }}
                >
                    {isResource
                        ? 'РЕСУРС УЛУЧШЕНИЯ'
                        : `${rarityTranslation[data.rarity] || data.rarity} ${currentLevel > 1 ? `(УР. ${currentLevel})` : ''}`}
                </div>
                <div
                    style={{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        textTransform: 'uppercase',
                    }}
                >
                    {data.name}
                </div>
            </div>

            {!isResource && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {data.attackBonus && (
                        <StatRow
                            label="СИЛА АТАКИ"
                            value={`+${Math.round(data.attackBonus * mult)}`}
                            icon="⚔️"
                            color="#f97316"
                        />
                    )}
                    {data.defenseBonus && (
                        <StatRow
                            label="ЗАЩИТА"
                            value={`+${Math.round(data.defenseBonus * mult)}`}
                            icon="🛡️"
                            color="#3b82f6"
                        />
                    )}
                    {data.hpBonus && (
                        <StatRow
                            label="ЗДОРОВЬЕ"
                            value={`+${Math.round(data.hpBonus * mult)}`}
                            icon="❤️"
                            color="#ef4444"
                        />
                    )}
                    {(data.critChance || data.critBonus) && (
                        <StatRow
                            label="КРИТ. ШАНС"
                            value={`+${Math.round((data.critChance || data.critBonus) * 100 * mult)}%`}
                            icon="🎯"
                            color="#a855f7"
                        />
                    )}
                    {(data.attackSpeed || data.speedBonus) && (
                        <StatRow
                            label="СКОРОСТЬ"
                            value={`+${((data.attackSpeed || data.speedBonus) * mult).toFixed(1)}`}
                            icon="⚡"
                            color="#fcd34d"
                        />
                    )}
                </div>
            )}

            {data.desc && (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        fontStyle: 'italic',
                        borderTop: isResource ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        paddingTop: isResource ? '0px' : '10px',
                        marginTop: isResource ? '0px' : '5px',
                    }}
                >
                    "{data.desc}"
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                {isResource ? (
                    <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 900 }}>
                        КОЛИЧЕСТВО: {resourceAmount}
                    </div>
                ) : (
                    <>
                        <div style={{ color: '#f0c040', fontSize: '10px', fontWeight: 900 }}>
                            МОЩЬ: {Math.round(calculateItemPower(data) * mult)}
                        </div>
                        {data.priceGold && (
                            <div
                                style={{
                                    color: 'rgba(255,255,255,0.4)',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                ЦЕНА: {data.priceGold} 🪙
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>,
        document.body,
    );
};
