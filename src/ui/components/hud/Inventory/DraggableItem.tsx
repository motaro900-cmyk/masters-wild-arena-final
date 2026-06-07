import React from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { calculateItemPower } from '../../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../../configs/HeroesConfig';

interface DraggableItemProps {
    item: any;
    data: any;
    isEquippedOnCurrent: boolean;
    isEquippedOnOther: boolean;
    equippedHeroId: string | null;
    rarity: any;
    onItemClick: (id: string) => void;
    setGlobalHoveredItem: (id: string | null, x: number, y: number) => void;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
    item,
    data,
    isEquippedOnCurrent,
    isEquippedOnOther,
    equippedHeroId,
    rarity,
    onItemClick,
    setGlobalHoveredItem,
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.instanceId || item.id,
        data: item,
        disabled: !!item.isResource,
    });

    return (
        <motion.div
            whileHover={{
                scale: 1.05,
                zIndex: 10,
                boxShadow: `${rarity?.glow ? `0 0 25px ${rarity.glow}` : ''}, 0 10px 30px rgba(0,0,0,0.5)`,
            }}
            whileTap={{ scale: 0.95 }}
            onMouseMove={(e: any) => setGlobalHoveredItem?.(item.instanceId || item.id, e.clientX, e.clientY)}
            onMouseEnter={(e: any) => setGlobalHoveredItem?.(item.instanceId || item.id, e.clientX, e.clientY)}
            onMouseLeave={() => setGlobalHoveredItem?.(null, 0, 0)}
            onClick={() => {
                if (!isDragging && !item.isResource) {
                    onItemClick(item.instanceId || item.id);
                }
            }}
            style={{
                background: rarity?.bg
                    ? `linear-gradient(135deg, ${rarity.bg}aa 0%, rgba(18, 14, 11, 0.95) 100%)`
                    : 'linear-gradient(135deg, rgba(28, 22, 18, 0.95) 0%, rgba(18, 14, 11, 0.98) 100%)',
                borderRadius: '8px',
                border: `1.5px solid ${isEquippedOnCurrent ? '#f0c040' : 'rgba(240, 192, 64, 0.15)'}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEquippedOnCurrent
                    ? `0 0 15px rgba(240,192,64,0.45), 0 4px 12px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.8)`
                    : `0 4px 10px rgba(0,0,0,0.45), inset 0 0 8px rgba(0,0,0,0.8)`,
                cursor: item.isResource ? 'default' : 'pointer',
                transition: 'all 0.2s',
                opacity: isDragging ? 0.4 : 1,
            }}
        >
            {/* Rarity inner trim border */}
            <div
                style={{
                    position: 'absolute',
                    inset: '2px',
                    border: `1px solid ${rarity?.border || 'rgba(240, 192, 64, 0.2)'}`,
                    borderRadius: '6px',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: 0.65,
                }}
            />
            {!item.isResource && (
                <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            background: isEquippedOnCurrent ? '#ef4444' : '#f0c040',
                            color: '#000',
                            fontSize: '9px',
                            fontWeight: 900,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontFamily: "'Cinzel', serif",
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            pointerEvents: 'auto',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onItemClick?.(item.instanceId || item.id);
                        }}
                    >
                        {item.id === 'season_chest' ? 'ОТКРЫТЬ' : isEquippedOnCurrent ? 'СНЯТЬ' : 'НАДЕТЬ'}
                    </div>
                </motion.div>
            )}

            {!item.isResource && (
                <div
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 5,
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                />
            )}

            {data.spriteClass ? (
                <div
                    className={data.spriteClass}
                    style={{
                        width: '80px',
                        height: '80px',
                        opacity: isEquippedOnOther ? 0.6 : 1,
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
            ) : (
                <img
                    src={data.image}
                    style={{
                        width: '70%',
                        height: '70%',
                        objectFit: 'contain',
                        opacity: isEquippedOnOther ? 0.6 : 1,
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                    alt=""
                />
            )}

            {isEquippedOnCurrent && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '20px',
                        height: '20px',
                        background: '#f0c040',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#000',
                        fontWeight: 900,
                        border: '2px solid #1a1008',
                        boxShadow: '0 2px 6px rgba(240, 192, 64, 0.45)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    ✔
                </div>
            )}

            {isEquippedOnOther && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '24px',
                        height: '24px',
                        background: '#1a1008',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ef4444',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                    title={`Надето на: ${equippedHeroId}`}
                >
                    <img
                        src={HEROES_DB.find((h) => h.id === equippedHeroId)?.image}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt=""
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.3)' }} />
                </div>
            )}

            {!item.isResource && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '4px',
                        fontSize: '9px',
                        fontWeight: 900,
                        color: '#f0c040',
                        opacity: 0.8,
                        pointerEvents: 'none',
                    }}
                >
                    {Math.round(calculateItemPower(data) * (item.level === 3 ? 1.35 : item.level === 2 ? 1.15 : 1.0))}
                </div>
            )}

            {/* УРОВЕНЬ ПРЕДМЕТА (L1, L2, L3) */}
            {!item.isResource && item.level && item.level > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '4px',
                        fontSize: '10px',
                        fontWeight: 900,
                        color: '#f0c040',
                        textShadow: '0 1px 3px #000',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    L{item.level}
                </div>
            )}

            {/* СТАК (для зелий и ресурсов) */}
            {item.amount > 0 && (item.isResource || item.amount > 1) && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '6px',
                        fontSize: '10px',
                        fontWeight: 900,
                        color: '#fff',
                        textShadow: '0 1px 2px #000',
                        pointerEvents: 'none',
                        background: 'rgba(0, 0, 0, 0.65)',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                >
                    x{item.amount}
                </div>
            )}
        </motion.div>
    );
};
