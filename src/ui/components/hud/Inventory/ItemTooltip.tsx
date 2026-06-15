import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../game/configs/ItemsConfig';
import { RARITY_COLORS, rarityTranslation } from '../../../../configs/RarityConfig';

interface ItemTooltipProps {
    item: { id: string; x: number; y: number };
}

const StatRow = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ color: color, fontWeight: 900 }}>{value}</span>
    </div>
);

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item }) => {
    const store = useGameStore(
        useShallow((state) => ({
            inventory: state.inventory,
            coal: state.coal,
            steel_bars: state.steel_bars,
            runic_shards: state.runic_shards,
            ancient_compass: state.ancient_compass,
            astral_crystal: state.astral_crystal,
            void_sphere: state.void_sphere,
            golden_sprout: state.golden_sprout,
            dragon_scale: state.dragon_scale,
            lava_heart: state.lava_heart,
        }))
    );
    const invItem = store.inventory.find((i: any) => (i.instanceId || i.id) === item.id);
    const currentLevel = invItem?.level || 1;

    const getStatMultiplier = (lvl: number) => {
        if (lvl === 1) return 1.0;
        if (lvl === 2) return 1.15;
        if (lvl === 3) return 1.35;
        return 1.0;
    };

    const mult = getStatMultiplier(currentLevel);

    const templateId = invItem ? invItem.id : item.id;
    const data = ITEMS_DATABASE[templateId] as any;
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
    const tooltipWidth = 420;

    const wrapper = document.querySelector('.game-scale-wrapper');
    const rect = wrapper ? wrapper.getBoundingClientRect() : null;
    const isPortraitMobile = useGameStore.getState().isMobile && window.innerWidth < window.innerHeight;

    let localX = item.x;
    let localY = item.y;

    if (rect) {
        if (isPortraitMobile) {
            const nx = rect.width > 0 ? (item.x - rect.left) / rect.width : 0;
            const ny = rect.height > 0 ? (item.y - rect.top) / rect.height : 0;
            localX = ny * 1920;
            localY = (1 - nx) * 1080;
        } else {
            const scale = rect.width / 1920;
            localX = (item.x - rect.left) / scale;
            localY = (item.y - rect.top) / scale;
        }
    }

    const leftAbsolute = localX + tooltipWidth + 25 > 1920 ? Math.max(10, localX - tooltipWidth - 25) : localX + 25;
    const topAbsolute = Math.max(10, Math.min(1080 - 420, localY - 120));

    const leftFixed = item.x + tooltipWidth + 25 > window.innerWidth ? Math.max(10, item.x - tooltipWidth - 25) : item.x + 25;
    const topFixed = Math.max(10, Math.min(window.innerHeight - 420, item.y - 120));

    const portalTarget = wrapper || document.body;

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                position: portalTarget === document.body ? 'fixed' : 'absolute',
                left: portalTarget === document.body ? `${leftFixed}px` : `${leftAbsolute}px`,
                top: portalTarget === document.body ? `${topFixed}px` : `${topAbsolute}px`,
                zIndex: 2000000,
                width: `${tooltipWidth}px`,
                background: 'rgba(15, 10, 5, 0.98)',
                backdropFilter: 'blur(15px)',
                borderRadius: '16px',
                border: `2.5px solid ${rarity.border}`,
                boxShadow: `0 15px 45px rgba(0,0,0,0.85), 0 0 25px ${rarity.glow}aa`,
                padding: '28px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            <div style={{ borderBottom: `1px solid ${rarity.border}44`, paddingBottom: '12px' }}>
                <div
                    style={{
                        color: rarity.color,
                        fontSize: '12px',
                        fontWeight: 900,
                        letterSpacing: '3px',
                        fontFamily: "'Cinzel', serif",
                        marginBottom: '6px',
                    }}
                >
                    {isResource
                        ? 'РЕСУРС УЛУЧШЕНИЯ'
                        : `${rarityTranslation[data.rarity] || data.rarity} ${currentLevel > 1 ? `(УР. ${currentLevel})` : ''}`}
                </div>
                <div
                    style={{
                        color: '#fff',
                        fontSize: '24px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
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
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        fontStyle: 'italic',
                        borderTop: isResource ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        paddingTop: isResource ? '0px' : '12px',
                        marginTop: isResource ? '0px' : '8px',
                    }}
                >
                    "{data.desc}"
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {isResource ? (
                    <div style={{ color: '#4ade80', fontSize: '13px', fontWeight: 900 }}>
                        КОЛИЧЕСТВО: {resourceAmount}
                    </div>
                ) : (
                    <>
                        <div style={{ color: '#f0c040', fontSize: '13px', fontWeight: 900 }}>
                            МОЩЬ: {Math.round(calculateItemPower(data) * mult)}
                        </div>
                        {data.priceGold && (
                            <div
                                style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                ЦЕНА: {data.priceGold} 🪙
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>,
        portalTarget,
    );
};
