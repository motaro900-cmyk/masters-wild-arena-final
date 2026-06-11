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

export const EquipmentSlot = ({ id, label, itemId, activeDraggingId, onClick, setGlobalHoveredItem }: any) => {
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
            whileHover={itemId ? { scale: 1.05, zIndex: 10 } : { background: 'rgba(240,192,64,0.1)' }}
            onMouseEnter={(e: any) => itemId && setGlobalHoveredItem(itemId, e.clientX, e.clientY)}
            onMouseLeave={() => setGlobalHoveredItem(null, 0, 0)}
            onMouseMove={(e: any) => itemId && setGlobalHoveredItem(itemId, e.clientX, e.clientY)}
            animate={
                isCompatible
                    ? {
                          scale: [1, 1.1, 1],
                          boxShadow: [
                              '0 0 0px rgba(240,192,64,0)',
                              '0 0 30px rgba(240,192,64,0.6)',
                              '0 0 0px rgba(240,192,64,0)',
                          ],
                      }
                    : {}
            }
            transition={isCompatible ? { duration: 1, repeat: Infinity } : {}}
            onClick={onClick}
            ref={setNodeRef}
            style={{
                width: '110px',
                height: '110px',
                background: isOver
                    ? 'rgba(240, 192, 64, 0.18)'
                    : 'radial-gradient(circle, rgba(32, 26, 21, 0.9) 0%, rgba(18, 14, 11, 0.96) 100%)',
                borderRadius: '18px',
                border: isOver
                    ? '2.5px solid #fffdf7'
                    : isCompatible
                      ? '2.5px solid #f0c040'
                      : '1px solid rgba(240, 192, 64, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.3s',
                boxShadow: itemData
                    ? `0 8px 20px rgba(0,0,0,0.7), 0 0 15px ${rarityColor}33, inset 0 0 12px rgba(0,0,0,0.8)`
                    : isCompatible
                      ? '0 0 20px rgba(240,192,64,0.35), inset 0 0 10px rgba(0,0,0,0.8)'
                      : '0 4px 10px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.8)',
                cursor: itemId ? 'pointer' : 'default',
            }}
        >
            {/* Inner gold frame decoration */}
            <div
                style={{
                    position: 'absolute',
                    inset: '3px',
                    border: isCompatible
                        ? '1.5px solid rgba(240, 192, 64, 0.45)'
                        : '1px solid rgba(240, 192, 64, 0.12)',
                    borderRadius: '15px',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />

            {itemData ? (
                itemData.spriteClass ? (
                    <div className={itemData.spriteClass} style={{ width: '110px', height: '110px', zIndex: 2 }} />
                ) : (
                    <img
                        src={resolveAssetPath(itemData.image)}
                        style={{ width: '80%', height: '80%', objectFit: 'contain', zIndex: 2 }}
                        alt=""
                    />
                )
            ) : (
                <div
                    style={{
                        opacity: 0.5,
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
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'ARMOR' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_ARMOR}
                            style={{
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'WEAPONS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_WEAPON}
                            style={{
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'SHIELDS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_SHIELD}
                            style={{
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'SHOULDERS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_SHOULDERS}
                            style={{
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'PANTS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_PANTS}
                            style={{
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'BOOTS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_BOOTS}
                            style={{
                                width: '80%',
                                height: '60%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'RING' && (
                        <div
                            style={{
                                fontSize: '36px',
                                filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.3)) sepia(0.8) brightness(0.8) saturate(1.2)',
                                opacity: 0.8,
                            }}
                        >
                            💍
                        </div>
                    )}
                    {!['HELMETS', 'ARMOR', 'WEAPONS', 'SHIELDS', 'SHOULDERS', 'PANTS', 'BOOTS', 'RING'].includes(
                        id,
                    ) && <div style={{ fontSize: '24px', opacity: 0.5, filter: 'grayscale(1)' }}>📦</div>}
                    <div
                        style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            marginTop: '5px',
                            color: '#f0c040',
                            letterSpacing: '1px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            textTransform: 'uppercase',
                        }}
                    >
                        {label}
                    </div>
                </div>
            )}

            {itemData && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-8px',
                        background: rarityColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '8px',
                        fontWeight: 900,
                        color: '#000',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                    }}
                >
                    {RARITY_RU[itemData.rarity] || itemData.rarity}
                </div>
            )}

            {itemData && itemLevel && itemLevel > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        background: 'rgba(0,0,0,0.75)',
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
