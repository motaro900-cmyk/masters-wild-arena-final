import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { ITEMS_DATABASE } from '../../../../../../game/configs/ItemsConfig';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { rarityColors } from '../../constants/roleIcons';

export const EquipmentSlot = ({ id, label, itemId, activeDraggingId, onClick, setGlobalHoveredItem }: any) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    const itemData = itemId ? (ITEMS_DATABASE[String(itemId)] as any) : null;
    const rarityColor = itemData ? rarityColors[itemData.rarity] || '#f0c040' : '#f0c040';

    const draggingItemData = activeDraggingId ? (ITEMS_DATABASE[String(activeDraggingId)] as any) : null;
    const isCompatible = draggingItemData && draggingItemData.subTab === id;

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
                background: isOver ? 'rgba(240,192,64,0.2)' : 'rgba(0,0,0,0.4)',
                borderRadius: '18px',
                border: isOver
                    ? '2px solid #fff'
                    : isCompatible
                      ? '2px solid #f0c040'
                      : '1px solid rgba(240,192,64,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.3s',
                boxShadow: itemData ? `0 0 25px ${rarityColor}44` : 'none',
                cursor: itemId ? 'pointer' : 'default',
            }}
        >
            {itemData ? (
                itemData.spriteClass ? (
                    <div className={itemData.spriteClass} style={{ width: '110px', height: '110px' }} />
                ) : (
                    <img src={itemData.image} style={{ width: '80%', height: '80%', objectFit: 'contain' }} alt="" />
                )
            ) : (
                <div
                    style={{
                        opacity: 0.4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {id === 'HELMETS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_HELMET}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'ARMOR' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_ARMOR}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'WEAPONS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_WEAPON}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'SHIELDS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_SHIELD}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'SHOULDERS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_SHOULDERS}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'PANTS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_PANTS}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'BOOTS' && (
                        <img
                            src={AssetsMap.UI.BLUEPRINT_BOOTS}
                            style={{
                                width: '85%',
                                height: '65%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.5)',
                            }}
                            alt=""
                        />
                    )}
                    {id === 'RING' && (
                        <div
                            style={{
                                fontSize: '40px',
                                filter: 'drop-shadow(0 0 8px rgba(240,192,64,0.5)) grayscale(0.8)',
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
                    {itemData.rarity}
                </div>
            )}
        </motion.div>
    );
};
