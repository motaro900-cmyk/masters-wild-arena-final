import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower, ItemRarity } from '../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { UnderDevelopmentModal, ConfirmDialog } from './SharedUI';
import { useDraggable } from '@dnd-kit/core';

interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
    setGlobalHoveredItem?: (id: string | null, x: number, y: number) => void;
}

const RARITY_COLORS: any = {
    [ItemRarity.COMMON]: {
        border: '#a0a0a0',
        glow: 'rgba(160,160,160,0.2)',
        bg: 'rgba(50,50,50,0.8)',
        color: '#a0a0a0',
    },
    [ItemRarity.RARE]: {
        border: '#3b82f6',
        glow: 'rgba(59,130,246,0.3)',
        bg: 'rgba(20,30,50,0.9)',
        color: '#3b82f6',
    },
    [ItemRarity.EPIC]: {
        border: '#a855f7',
        glow: 'rgba(168,85,247,0.4)',
        bg: 'rgba(40,20,60,0.9)',
        color: '#a855f7',
    },
    MYTHIC: {
        border: '#ef4444',
        glow: 'rgba(239,68,68,0.4)',
        bg: 'rgba(60,20,20,0.9)',
        color: '#ef4444',
    },
    [ItemRarity.LEGENDARY]: {
        border: '#f59e0b',
        glow: 'rgba(245,158,11,0.5)',
        bg: 'rgba(60,45,10,0.9)',
        color: '#f59e0b',
    },
};

const rarityTranslation: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ mode = 'FULL', onItemClick, setGlobalHoveredItem }) => {
    const { inventory, sellItem, equippedItems, getHeroByItemId, selectedHeroId } = useGameStore();
    const [activeTab, setActiveTab] = useState<'ALL' | 'EQUIPMENT' | 'POTIONS'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'RARITY'>('POWER');
    const [devModalOpen, setDevModalOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<{ id: string; x: number; y: number } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const [confirmData, setConfirmData] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'danger' | 'normal';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'normal',
    });

    // Лимит инвентаря (заглушка на 100)
    const MAX_SLOTS = 100;

    const filteredItems = useMemo(() => {
        let items = [...inventory];

        if (activeTab === 'EQUIPMENT') {
            items = items.filter((item) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL');
        } else if (activeTab === 'POTIONS') {
            items = items.filter((item) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ALCHEMY');
        }

        const rarityOrder: Record<string, number> = { COMMON: 0, RARE: 1, EPIC: 2, MYTHIC: 3, LEGENDARY: 4 };

        return items.sort((a: any, b: any) => {
            const dataA = ITEMS_DATABASE[a.id] as any;
            const dataB = ITEMS_DATABASE[b.id] as any;
            if (!dataA || !dataB) return 0;

            if (sortBy === 'POWER') {
                return calculateItemPower(dataB) - calculateItemPower(dataA);
            } else {
                return rarityOrder[dataB.rarity] - rarityOrder[dataA.rarity];
            }
        });
    }, [inventory, activeTab, sortBy]);

    const isItemEquipped = (itemId: string) => {
        return Object.values(equippedItems || {}).some((id: any) => id === itemId);
    };

    const handleSellJunk = () => {
        const junk = inventory.filter((item: any) => {
            const data = ITEMS_DATABASE[item.id] as any;
            return data?.rarity === 'COMMON' && !isItemEquipped(item.id);
        });
        if (junk.length === 0) return;

        setConfirmData({
            isOpen: true,
            title: 'ПРОДАЖА ВЕЩЕЙ',
            message: `Продать все обычные предметы (${junk.length} шт.) за золото?`,
            variant: 'danger',
            onConfirm: () => {
                junk.forEach((item: any) => sellItem(item.id));
            },
        });
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                position: 'relative',
            }}
        >
            {/* ТАБЫ И ИНФО */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { id: 'ALL', label: 'ВСЁ' },
                        { id: 'EQUIPMENT', label: 'СНАРЯЖЕНИЕ' },
                        { id: 'POTIONS', label: 'АЛХИМИЯ' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid rgba(240,192,64,0.2)',
                                background: activeTab === tab.id ? 'rgba(240,192,64,0.1)' : 'transparent',
                                color: activeTab === tab.id ? '#f0c040' : 'rgba(255,255,255,0.4)',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                        СУМКА:{' '}
                        <span style={{ color: inventory.length > MAX_SLOTS * 0.8 ? '#ef4444' : '#fff' }}>
                            {inventory.length}/{MAX_SLOTS}
                        </span>
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            color: '#f0c040',
                            border: '1px solid rgba(240,192,64,0.2)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '10px',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        <option value="POWER">ПО МОЩИ</option>
                        <option value="RARITY">ПО РЕДКОСТИ</option>
                    </select>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    border: '1px solid rgba(240,192,64,0.1)',
                    padding: '15px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: mode === 'FULL' ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)',
                    gridAutoRows: mode === 'FULL' ? '90px' : '80px',
                    gap: '10px',
                }}
                className="leaderboard-scroll"
            >
                {filteredItems.map((item: any, i: number) => {
                    const data = ITEMS_DATABASE[item.id] as any;
                    if (!data) return null;

                    const equippedHeroId = getHeroByItemId(item.id);
                    const isEquippedOnCurrent = String(equippedHeroId) === String(selectedHeroId || 'panda');
                    const isEquippedOnOther = equippedHeroId && !isEquippedOnCurrent;

                    const rarity = RARITY_COLORS[String(data?.rarity || 'COMMON')];

                    return (
                        <DraggableItem
                            key={item.id + i}
                            item={item}
                            data={data}
                            rarity={rarity}
                            isEquippedOnCurrent={isEquippedOnCurrent}
                            isEquippedOnOther={isEquippedOnOther}
                            equippedHeroId={equippedHeroId}
                            onItemClick={(id: string) => {
                                if (isEquippedOnOther) {
                                    setConfirmData({
                                        isOpen: true,
                                        title: 'ПЕРЕДАЧА ВЕЩИ',
                                        message: `Этот предмет надет на ${HEROES_DB.find((h) => h.id === equippedHeroId)?.name || equippedHeroId}. Передать его текущему герою?`,
                                        variant: 'normal',
                                        onConfirm: () => onItemClick?.(id),
                                    });
                                } else {
                                    onItemClick?.(id);
                                }
                            }}
                            setGlobalHoveredItem={(id: string | null, x: number, y: number) => {
                                if (id && containerRef.current) {
                                    const rect = containerRef.current.getBoundingClientRect();
                                    const scale = rect.width / containerRef.current.offsetWidth;
                                    const relX = (x - rect.left) / scale;
                                    const relY = (y - rect.top) / scale;
                                    setHoveredItem({ id, x: relX, y: relY });
                                } else {
                                    setHoveredItem(null);
                                }
                                setGlobalHoveredItem?.(id, x, y);
                            }}
                        />
                    );
                })}
                {Array.from({ length: Math.max(0, 18 - filteredItems.length) }).map((_, i) => (
                    <div
                        key={'empty-' + i}
                        style={{
                            background: 'rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            border: '1px dashed rgba(240,192,64,0.05)',
                        }}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={handleSellJunk}
                    style={{
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                    }}
                >
                    🗑️ ПРОДАТЬ ВЕСЬ ХЛАМ (ОБЫЧНЫЕ)
                </button>
            </div>

            <UnderDevelopmentModal
                isOpen={devModalOpen}
                onClose={() => setDevModalOpen(false)}
                title="СЕКРЕТЫ АЛХИМИИ"
            />

            <ConfirmDialog
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
                onConfirm={confirmData.onConfirm}
                title={confirmData.title}
                message={confirmData.message}
                variant={confirmData.variant}
            />

            {hoveredItem && <ItemTooltip item={hoveredItem} />}
        </div>
    );
};

const ItemTooltip = ({ item }: { item: { id: string; x: number; y: number } }) => {
    const data = ITEMS_DATABASE[item.id] as any;
    if (!data) return null;

    const rarity = RARITY_COLORS[data.rarity || 'COMMON'];
    const tooltipWidth = 280;
    const isTooRight = item.x > 500;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                position: 'absolute',
                left: isTooRight ? item.x - tooltipWidth - 20 : item.x + 20,
                top: item.y + 20,
                zIndex: 10000,
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
                    {rarityTranslation[data.rarity] || data.rarity}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.attackBonus && (
                    <StatRow label="СИЛА АТАКИ" value={`+${data.attackBonus}`} icon="⚔️" color="#f97316" />
                )}
                {data.defenseBonus && (
                    <StatRow label="ЗАЩИТА" value={`+${data.defenseBonus}`} icon="🛡️" color="#3b82f6" />
                )}
                {data.hpBonus && <StatRow label="ЗДОРОВЬЕ" value={`+${data.hpBonus}`} icon="❤️" color="#ef4444" />}
                {(data.critChance || data.critBonus) && (
                    <StatRow
                        label="КРИТ. ШАНС"
                        value={`+${Math.round((data.critChance || data.critBonus) * 100)}%`}
                        icon="🎯"
                        color="#a855f7"
                    />
                )}
                {(data.attackSpeed || data.speedBonus) && (
                    <StatRow
                        label="СКОРОСТЬ"
                        value={`+${(data.attackSpeed || data.speedBonus).toFixed(1)}`}
                        icon="⚡"
                        color="#fcd34d"
                    />
                )}
            </div>

            {data.desc && (
                <div
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        fontStyle: 'italic',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '10px',
                        marginTop: '5px',
                    }}
                >
                    "{data.desc}"
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <div style={{ color: '#f0c040', fontSize: '10px', fontWeight: 900 }}>
                    МОЩЬ: {calculateItemPower(data)}
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
            </div>
        </motion.div>
    );
};

const StatRow = ({ label, value, icon, color }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ color: color, fontWeight: 900 }}>{value}</span>
    </div>
);

const DraggableItem = ({
    item,
    data,
    isEquippedOnCurrent,
    isEquippedOnOther,
    equippedHeroId,
    rarity,
    onItemClick,
    setGlobalHoveredItem,
}: any) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: item,
    });

    return (
        <motion.div
            whileHover={{
                scale: 1.05,
                zIndex: 10,
                boxShadow: `0 0 25px ${rarity.glow}, 0 10px 30px rgba(0,0,0,0.5)`,
            }}
            whileTap={{ scale: 0.95 }}
            onMouseMove={(e: any) => setGlobalHoveredItem?.(item.id, e.clientX, e.clientY)}
            onMouseEnter={(e: any) => setGlobalHoveredItem?.(item.id, e.clientX, e.clientY)}
            onMouseLeave={() => setGlobalHoveredItem?.(null, 0, 0)}
            style={{
                background: rarity.bg,
                borderRadius: '8px',
                border: `2px solid ${isEquippedOnCurrent ? '#f0c040' : rarity.border}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEquippedOnCurrent
                    ? `0 0 15px rgba(240,192,64,0.3), 0 0 10px ${rarity.glow}`
                    : `0 4px 10px rgba(0,0,0,0.3), 0 0 5px ${rarity.glow}`,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                opacity: isDragging ? 0.4 : 1,
            }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(2px)',
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
                        onItemClick?.(item.id);
                    }}
                >
                    {isEquippedOnCurrent ? 'СНЯТЬ' : 'НАДЕТЬ'}
                </div>
            </motion.div>

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
                {calculateItemPower(data)}
            </div>

            {/* УРОВЕНЬ ПРЕДМЕТА (L1, L2, L3) */}
            {item.level && item.level > 0 && (
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

            {/* СТАК (для зелий) */}
            {item.amount > 1 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: '4px',
                        fontSize: '10px',
                        fontWeight: 900,
                        color: '#fff',
                        textShadow: '0 1px 2px #000',
                        pointerEvents: 'none',
                    }}
                >
                    x{item.amount}
                </div>
            )}
        </motion.div>
    );
};
