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

export const DraggableItem: React.FC<DraggableItemProps> = React.memo(({
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
            onClick={(e) => {
                if (!isDragging && !item.isResource && !e.shiftKey) {
                    onItemClick(item.instanceId || item.id);
                }
            }}
            style={{
                width: '100%',
                height: '100%',
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
                boxSizing: 'border-box',
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
            {/* Removed hover overlay button for direct and simpler click-to-equip */}

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
                        bottom: '4px',
                        right: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                        background: 'rgba(20, 14, 8, 0.9)',
                        border: '1.5px solid #f0c040',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                    }}
                >
                    <img
                        src="/assets/images/ui/mosh.png"
                        style={{ width: '15px', height: '15px', objectFit: 'contain' }}
                        alt="Power"
                    />
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: 900,
                            color: '#f0c040',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {Math.round(calculateItemPower(data) * (item.level === 3 ? 1.35 : item.level === 2 ? 1.15 : 1.0))}
                    </span>
                </div>
            )}

            {/* УРОВЕНЬ ПРЕДМЕТА (L1, L2, L3) */}
            {!item.isResource && item.level && item.level > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '4px',
                        fontSize: '12px',
                        fontWeight: 900,
                        color: '#f0c040',
                        textShadow: '0 2px 4px rgba(0,0,0,0.95)',
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
                        fontSize: '11.5px',
                        fontWeight: 900,
                        color: '#fff',
                        textShadow: '0 2px 4px #000',
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
}, (prevProps, nextProps) => {
    return (
        prevProps.isEquippedOnCurrent === nextProps.isEquippedOnCurrent &&
        prevProps.isEquippedOnOther === nextProps.isEquippedOnOther &&
        prevProps.equippedHeroId === nextProps.equippedHeroId &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.amount === nextProps.item.amount &&
        prevProps.item.instanceId === nextProps.item.instanceId &&
        prevProps.data === nextProps.data &&
        prevProps.rarity === nextProps.rarity
    );
});
