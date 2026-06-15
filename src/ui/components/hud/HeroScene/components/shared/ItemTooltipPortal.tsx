import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ITEMS_DATABASE } from '../../../../../../game/configs/ItemsConfig';
import { rarityColors } from '../../constants/roleIcons';
import { resolveAssetPath } from '../../../../../../utils/assetPath';

import { useGameStore } from '../../../../../../store/useGameStore';

interface ItemTooltipPortalProps {
    hoveredItem: { id: string; x: number; y: number } | null;
    heroEquipment: any;
    selectedHeroId: string;
}

export const ItemTooltipPortal: React.FC<ItemTooltipPortalProps> = ({ hoveredItem, heroEquipment, selectedHeroId }) => {
    const inventory = useGameStore((s: any) => s.inventory) || [];
    const invItem = hoveredItem ? inventory.find((i: any) => (i.instanceId || i.id) === hoveredItem.id) : null;
    const templateId = invItem ? invItem.id : (hoveredItem?.id || '');

    if (!hoveredItem || !ITEMS_DATABASE[templateId]) return null;

    const itemData = ITEMS_DATABASE[templateId] as any;
    const rarityColor = (rarityColors as any)[itemData.rarity] || '#fff';

    const wrapper = document.querySelector('.game-scale-wrapper');

    const localX = hoveredItem.x;
    const localY = hoveredItem.y;

    const tooltipWidth = 460;
    const leftAbsolute = Math.max(10, localX + tooltipWidth + 20 > 1920 ? localX - tooltipWidth - 20 : localX + 20);
    const topAbsolute = Math.max(10, Math.min(1080 - 450, localY - 100));

    const leftFixed = hoveredItem.x + tooltipWidth + 20 > window.innerWidth ? hoveredItem.x - tooltipWidth - 20 : hoveredItem.x + 20;
    const topFixed = Math.max(10, Math.min(window.innerHeight - 450, hoveredItem.y - 100));

    const portalTarget = wrapper || document.body;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    position: portalTarget === document.body ? 'fixed' : 'absolute',
                    left: portalTarget === document.body ? leftFixed : leftAbsolute,
                    top: portalTarget === document.body ? topFixed : topAbsolute,
                    zIndex: 2000000,
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        width: '460px',
                        background: 'rgba(12, 10, 8, 0.99)',
                        border: `2px solid ${rarityColor}`,
                        borderRadius: '20px',
                        padding: '30px',
                        boxShadow: `0 25px 80px rgba(0,0,0,0.9), 0 0 40px ${rarityColor}33`,
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div style={{ display: 'flex', gap: '25px', marginBottom: '20px' }}>
                        <div
                            style={{
                                width: '100px',
                                height: '100px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            {itemData.spriteClass ? (
                                <div className={itemData.spriteClass} style={{ width: '120px', height: '120px' }} />
                            ) : (
                                <img
                                    src={resolveAssetPath(itemData.image)}
                                    style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                                    alt=""
                                />
                            )}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    color: rarityColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    marginBottom: '6px',
                                }}
                            >
                                {(() => {
                                    const r = itemData.rarity;
                                    const map: any = {
                                        COMMON: 'ОБЫЧНЫЙ',
                                        RARE: 'РЕДКИЙ',
                                        EPIC: 'ЭПИЧЕСКИЙ',
                                        MYTHIC: 'МИФИЧЕСКИЙ',
                                        LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
                                    };
                                    return map[r] || r;
                                })()}
                            </div>
                            <div
                                style={{
                                    fontSize: '26px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    fontFamily: "'Cinzel', serif",
                                    lineHeight: 1.1,
                                }}
                            >
                                {itemData.name}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.6)',
                            fontStyle: 'italic',
                            marginBottom: '25px',
                            lineHeight: '1.6',
                        }}
                    >
                        {itemData.desc}
                    </div>

                    {itemData.subTab !== 'RESOURCES' && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                background: 'rgba(0,0,0,0.5)',
                                padding: '20px',
                                borderRadius: '15px',
                                border: '1px solid rgba(255,255,255,0.03)',
                            }}
                        >
                            {['attackBonus', 'defenseBonus', 'hpBonus'].map((statKey) => {
                                const val = itemData[statKey];
                                if (val === undefined) return null;
                                const labels: any = {
                                    attackBonus: 'АТАКА',
                                    defenseBonus: 'ЗАЩИТА',
                                    hpBonus: 'ЗДОРОВЬЕ',
                                };
                                const colors: any = {
                                    attackBonus: '#f97316',
                                    defenseBonus: '#3b82f6',
                                    hpBonus: '#ef4444',
                                };
                                const icons: any = {
                                    attackBonus: 'sprite-stat stat-attack',
                                    defenseBonus: 'sprite-stat stat-defense',
                                    hpBonus: 'sprite-stat stat-hp',
                                };
                                return (
                                    <div
                                        key={statKey}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '16px',
                                            fontWeight: 900,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div
                                                className={icons[statKey]}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    backgroundSize: '400% 200%',
                                                    filter: `contrast(1.2) brightness(1.1) drop-shadow(0 0 5px ${colors[statKey]}aa)`,
                                                    imageRendering: '-webkit-optimize-contrast',
                                                }}
                                            />
                                            <span style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                                                {labels[statKey]}
                                            </span>
                                        </div>
                                        <span style={{ color: colors[statKey] }}>+{val}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {itemData.subTab !== 'RESOURCES' && (
                        <div
                            style={{
                                marginTop: '25px',
                                paddingTop: '20px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '13px',
                                color: '#f0c040',
                                fontWeight: 900,
                                textAlign: 'center',
                                letterSpacing: '2px',
                            }}
                        >
                            {(() => {
                                const heroEquip = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
                                const isEquippedOnMe = Object.values(heroEquip).includes(hoveredItem.id);
                                return isEquippedOnMe ? 'КЛИКНИТЕ, ЧТОБЫ СНЯТЬ' : 'КЛИКНИТЕ, ЧТОБЫ НАДЕТЬ';
                            })()}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        portalTarget,
    );
};
