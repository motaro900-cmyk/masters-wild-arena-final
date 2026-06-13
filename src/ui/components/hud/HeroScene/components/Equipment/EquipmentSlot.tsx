import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { ITEMS_DATABASE } from '../../../../../../game/configs/ItemsConfig';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { rarityColors } from '../../constants/roleIcons';
import { useGameStore } from '../../../../../../store/useGameStore';
import { resolveAssetPath } from '../../../../../../utils/assetPath';

const RARITY_RU: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    UNCOMMON: 'НЕОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
};

const getTemplateId = (id: string) => {
    if (!id) return '';
    if (ITEMS_DATABASE[id]) return id;
    const match = Object.keys(ITEMS_DATABASE)
        .filter((key) => id.startsWith(key + '_'))
        .sort((a, b) => b.length - a.length)[0];
    return match || id;
};

export const EquipmentSlot = ({ id, itemId, activeDraggingId, onClick, setGlobalHoveredItem }: any) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const inventory = useGameStore((state) => state.inventory);

    const resolvedItemId = itemId ? getTemplateId(String(itemId)) : '';
    const itemData = resolvedItemId ? (ITEMS_DATABASE[resolvedItemId] as any) : null;
    const rarityColor = itemData ? rarityColors[itemData.rarity] || '#f0c040' : '#f0c040';

    const resolvedDraggingId = activeDraggingId ? getTemplateId(String(activeDraggingId)) : '';
    const draggingItemData = resolvedDraggingId ? (ITEMS_DATABASE[resolvedDraggingId] as any) : null;
    const isCompatible = draggingItemData && draggingItemData.subTab === id;

    const invItem = (inventory || []).find(
        (i: any) => String(i.instanceId) === String(itemId) || String(i.id) === String(itemId),
    );
    const itemLevel = invItem?.level || 1;

    return (
        <motion.div
            className={`equipment-slot-circle ${itemData ? 'has-item' : 'empty-slot'} ${
                activeDraggingId
                    ? isCompatible
                        ? 'drag-compatible'
                        : 'drag-incompatible'
                    : ''
            } ${isOver ? 'drag-over' : ''}`}
            whileHover={itemId ? { scale: 1.05, zIndex: 10 } : { background: 'rgba(240,192,64,0.1)' }}
            onMouseEnter={(e: any) => itemId && setGlobalHoveredItem(itemId, e.clientX, e.clientY)}
            onMouseLeave={() => setGlobalHoveredItem(null, 0, 0)}
            onMouseMove={(e: any) => itemId && setGlobalHoveredItem(itemId, e.clientX, e.clientY)}
            animate={
                isCompatible
                    ? {
                          scale: [1, 1.06, 1],
                      }
                    : {}
            }
            transition={isCompatible ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
            onClick={onClick}
            ref={setNodeRef}
        style={{
                width: '104px',
                height: '104px',
                background: isOver
                    ? 'rgba(240, 192, 64, 0.15)'
                    : itemData
                      ? `radial-gradient(circle at 50% 30%, rgba(40, 32, 24, 0.95) 0%, rgba(14, 10, 8, 0.98) 100%)`
                      : 'radial-gradient(circle at 50% 30%, rgba(28, 22, 17, 0.92) 0%, rgba(12, 9, 7, 0.97) 100%)',
                borderRadius: '12px',
                border: isOver
                    ? '2px solid #fffdf7'
                    : isCompatible
                      ? '2px solid #f0c040'
                      : itemData
                        ? `1.5px solid ${rarityColor}66`
                        : '1.5px solid rgba(240, 192, 64, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.3s, opacity 0.3s',
                boxShadow: itemData
                    ? `0 8px 24px rgba(0,0,0,0.8), 0 0 20px ${rarityColor}44, inset 0 0 16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04)`
                    : isCompatible
                      ? '0 0 20px rgba(240,192,64,0.35), inset 0 0 12px rgba(0,0,0,0.85)'
                      : '0 6px 14px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.03)',
                cursor: itemId ? 'pointer' : 'default',
                opacity: activeDraggingId && !isCompatible ? 0.35 : 1.0,
            }}
        >
            {/* Outer corner accents */}
            {['tl','tr','bl','br'].map((pos) => (
                <div key={pos} style={{
                    position: 'absolute',
                    width: '10px', height: '10px',
                    ...(pos === 'tl' ? { top: 3, left: 3 } : {}),
                    ...(pos === 'tr' ? { top: 3, right: 3 } : {}),
                    ...(pos === 'bl' ? { bottom: 3, left: 3 } : {}),
                    ...(pos === 'br' ? { bottom: 3, right: 3 } : {}),
                    borderTop: ['tl','tr'].includes(pos) ? `1.5px solid ${isCompatible ? '#f0c040' : 'rgba(240,192,64,0.4)'}` : 'none',
                    borderBottom: ['bl','br'].includes(pos) ? `1.5px solid ${isCompatible ? '#f0c040' : 'rgba(240,192,64,0.4)'}` : 'none',
                    borderLeft: ['tl','bl'].includes(pos) ? `1.5px solid ${isCompatible ? '#f0c040' : 'rgba(240,192,64,0.4)'}` : 'none',
                    borderRight: ['tr','br'].includes(pos) ? `1.5px solid ${isCompatible ? '#f0c040' : 'rgba(240,192,64,0.4)'}` : 'none',
                    pointerEvents: 'none',
                    zIndex: 3,
                }} />
            ))}

            {itemData ? (
                itemData.spriteClass ? (
                    <div className={itemData.spriteClass} style={{ width: '72px', height: '72px', zIndex: 2, borderRadius: '12px' }} />
                ) : (
                    <img
                        src={resolveAssetPath(itemData.image)}
                        style={{ width: '68%', height: '68%', objectFit: 'contain', zIndex: 2,
                            filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 8px ${rarityColor}55)` }}
                        alt=""
                    />
                )
            ) : (
                <div
                    style={{
                        opacity: 0.72,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        zIndex: 2,
                    }}
                >
                    {id === 'HELMETS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_HELMET}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'ARMOR' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_ARMOR}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'WEAPONS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_WEAPON}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'SHIELDS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_SHIELD}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'SHOULDERS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_SHOULDERS}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'PANTS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_PANTS}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'BOOTS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_BOOTS}
                            style={{
                                width: '50%',
                                height: '50%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'RING' && (
                        <div
                            style={{
                                fontSize: '28px',
                                filter: 'drop-shadow(0 0 4px rgba(240,192,64,0.45)) sepia(0.9) brightness(1.15) saturate(1.4)',
                                opacity: 0.8,
                            }}
                        >
                            💍
                        </div>
                    )}
                    {!['HELMETS', 'ARMOR', 'WEAPONS', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS', 'RING'].includes(
                        id,
                    ) && <div style={{ fontSize: '20px', opacity: 0.5, filter: 'grayscale(1)' }}>📦</div>}
                </div>
            )}

            {itemData && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: rarityColor,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '8px',
                        fontWeight: 900,
                        color: '#000',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                    }}
                >
                    {RARITY_RU[itemData.rarity] || itemData.rarity}
                </div>
            )}

            {itemData && itemLevel && itemLevel > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.85)',
                        border: '1px solid #f0c040',
                        color: '#f0c040',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 900,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    L{itemLevel}
                </div>
            )}
        </motion.div>
    );
};
