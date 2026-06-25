import React from 'react';
import { useGameStore } from '../../../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../../game/configs/ItemsConfig';
import { AssetsMap } from '../../../../../configs/AssetsMap';

const getRarityColor = (rarity: string) => {
    switch (rarity?.toUpperCase()) {
        case 'MYTHIC':
            return '#ef4444';
        case 'LEGENDARY':
            return '#f59e0b';
        case 'EPIC':
            return '#a855f7';
        case 'RARE':
            return '#3b82f6';
        case 'UNCOMMON':
            return '#10b981';
        default:
            return '#78716c';
    }
};

const RARITY_RU: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    UNCOMMON: 'НЕОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
};

interface EquipmentSlotItemProps {
    slotId: string;
    slotLabel: string;
    gridArea: string;
    equipment: Record<string, string | null>;
    isMirrored?: boolean;
}

export const EquipmentSlotItem: React.FC<EquipmentSlotItemProps> = ({
    slotId,
    slotLabel,
    gridArea,
    equipment,
    isMirrored,
}) => {
    const [hovered, setHovered] = React.useState(false);
    const itemId = equipment[slotId];

    // Берём уровень предмета из инвентаря игрока (не из конфига!)
    const inventory = useGameStore((s: any) => s.inventory) || [];
    const inventoryItem = itemId
        ? inventory.find((i: any) => String(i.instanceId) === String(itemId) || String(i.id) === String(itemId))
        : null;
    const templateId = inventoryItem ? inventoryItem.id : itemId;

    const item = templateId ? (ITEMS_DATABASE as any)[templateId] : null;
    const color = item ? getRarityColor(item.rarity) : 'rgba(255,255,255,0.05)';
    const itemLevel = inventoryItem?.level ?? null;

    let blueprintSrc = '';
    if (slotId === 'HELMETS') blueprintSrc = AssetsMap.UI.BLUEPRINT_HELMET;
    else if (slotId === 'ARMOR') blueprintSrc = AssetsMap.UI.BLUEPRINT_ARMOR;
    else if (slotId === 'WEAPONS') blueprintSrc = AssetsMap.UI.BLUEPRINT_WEAPON;
    else if (slotId === 'SHIELDS') blueprintSrc = AssetsMap.UI.BLUEPRINT_SHIELD;
    else if (slotId === 'SHOULDERS') blueprintSrc = AssetsMap.UI.BLUEPRINT_SHOULDERS;
    else if (slotId === 'PANTS') blueprintSrc = AssetsMap.UI.BLUEPRINT_PANTS;
    else if (slotId === 'BOOTS') blueprintSrc = AssetsMap.UI.BLUEPRINT_BOOTS;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
                if (item) {
                    setHovered((prev) => !prev);
                }
            }}
            style={{
                gridArea,
                width: '92px',
                height: '92px',
                borderRadius: '14px',
                background: 'rgba(0,0,0,0.7)',
                border: `2px solid ${item ? color : 'rgba(240, 192, 64, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: item ? `0 0 14px ${color}55` : 'none',
                cursor: item ? 'help' : 'default',
                zIndex: hovered ? 200 : 1,
                transition: 'all 0.2s ease-in-out',
            }}
        >
            {item ? (
                <img
                    src={item.image || item.icon}
                    onError={(e) => {
                        const currentSrc = e.currentTarget.src;
                        if (currentSrc.endsWith('.webp')) {
                            e.currentTarget.src = currentSrc
                                .replace(/_mobile\.webp$/i, '.png')
                                .replace(/\.webp$/i, '.png');
                        }
                    }}
                    alt={item.name}
                    style={{
                        width: '80%',
                        height: '80%',
                        objectFit: 'contain',
                        transform: isMirrored ? 'scaleX(-1)' : 'none',
                    }}
                />
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
                    {blueprintSrc && (
                        <img
                            src={blueprintSrc}
                            style={{
                                width: '65%',
                                height: '55%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 5px rgba(240,192,64,0.5)) grayscale(0.3)',
                                transform: isMirrored ? 'scaleX(-1)' : 'none',
                            }}
                            alt=""
                        />
                    )}
                    <span
                        style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            marginTop: '2px',
                            color: '#f0c040',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            transform: isMirrored ? 'scaleX(-1)' : 'none',
                            display: 'inline-block',
                        }}
                    >
                        {slotLabel}
                    </span>
                </div>
            )}

            {item && itemLevel !== null && (
                <div
                    style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: 'rgba(0,0,0,0.75)',
                        border: '1px solid rgba(240,192,64,0.5)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 900,
                        color: '#f0c040',
                        fontFamily: "'Russo One', sans-serif",
                        letterSpacing: '0.5px',
                        transform: isMirrored ? 'scaleX(-1)' : 'none',
                        zIndex: 2,
                    }}
                >
                    L{itemLevel}
                </div>
            )}

            {item && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-6px',
                        background: color,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '8px',
                        fontWeight: 900,
                        color: '#000',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.6)',
                        transform: isMirrored ? 'scaleX(-1)' : 'none',
                    }}
                >
                    {RARITY_RU[item.rarity] || item.rarity}
                </div>
            )}

            {hovered &&
                item &&
                (() => {
                    const isTopSlot = ['HELMETS', 'SHOULDERS', 'ARMOR'].includes(slotId);
                    const itemPower = calculateItemPower(item);
                    return (
                        <div
                            style={{
                                position: 'absolute',
                                ...(isTopSlot ? { top: '120%' } : { bottom: '120%' }),
                                left: '50%',
                                transform: isMirrored ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%)',
                                background: 'rgba(15,10,5,0.98)',
                                border: `2px solid ${color}`,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                width: '200px',
                                zIndex: 9999,
                                fontSize: '13px',
                                color: '#fff',
                                boxShadow: '0 16px 30px rgba(0,0,0,0.95), 0 0 20px rgba(240,192,64,0.15)',
                                pointerEvents: 'none',
                                textAlign: 'center',
                                fontFamily: "'Montserrat', sans-serif",
                            }}
                        >
                            <div style={{ color, fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                                {item.name}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    marginBottom: '8px',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '11px',
                                        opacity: 0.6,
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {RARITY_RU[item.rarity] || item.rarity} • {slotLabel}
                                </span>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        background: 'rgba(251, 191, 36, 0.15)',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(251, 191, 36, 0.3)',
                                    }}
                                >
                                    <img
                                        src={AssetsMap.UI.ICON_POWER}
                                        style={{ width: '10px', height: '10px', objectFit: 'contain' }}
                                        alt="power"
                                    />
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#fbbf24',
                                            fontFamily: "'Russo One', sans-serif",
                                        }}
                                    >
                                        {itemPower}
                                    </span>
                                </div>
                            </div>
                            {item.hpBonus && (
                                <div style={{ color: '#22c55e', fontSize: '12px' }}>+{item.hpBonus} Здоровье</div>
                            )}
                            {item.attackBonus && (
                                <div style={{ color: '#ef4444', fontSize: '12px' }}>+{item.attackBonus} Атака</div>
                            )}
                            {item.defenseBonus && (
                                <div style={{ color: '#3b82f6', fontSize: '12px' }}>+{item.defenseBonus} Защита</div>
                            )}
                        </div>
                    );
                })()}
        </div>
    );
};
