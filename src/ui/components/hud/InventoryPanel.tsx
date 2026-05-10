import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { useDraggable } from '@dnd-kit/core';

interface InventoryPanelProps {
    onItemClick: (id: string) => void;
    isEquipped: (id: string) => boolean;
    mode?: 'FULL' | 'COMPACT';
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ onItemClick, isEquipped, mode = 'FULL' }) => {
    const { inventory, sellItem } = useGameStore();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'WEAPONS' | 'HELMETS' | 'ARMOR' | 'SHIELDS' | 'POTIONS'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'RARITY'>('POWER');

    const filteredItems = useMemo(() => {
        let items = activeTab === 'ALL' ? [...inventory] : inventory.filter((item: any) => {
            const data = ITEMS_DATABASE[String(item.id)] as any;
            return data?.subTab === activeTab;
        });

        const rarityOrder: Record<string, number> = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'MYTHIC': 3, 'LEGENDARY': 4 };

        return items.sort((a: any, b: any) => {
            const dataA = ITEMS_DATABASE[String(a.id)] as any;
            const dataB = ITEMS_DATABASE[String(b.id)] as any;
            if (!dataA || !dataB) return 0;

            if (sortBy === 'POWER') {
                return calculateItemPower(dataB) - calculateItemPower(dataA);
            } else {
                return rarityOrder[dataB.rarity] - rarityOrder[dataA.rarity];
            }
        });
    }, [inventory, activeTab, sortBy]);

    const tabs = [
        { id: 'ALL', label: 'ВСЁ' },
        { id: 'WEAPONS', label: 'ОРУЖИЕ' },
        { id: 'HELMETS', label: 'ШЛЕМЫ' },
        { id: 'ARMOR', label: 'БРОНЯ' },
        { id: 'SHIELDS', label: 'ЩИТЫ' },
        { id: 'POTIONS', label: 'ЗЕЛЬЯ' }
    ];

    return (
        <div style={{ 
            width: '100%', height: '100%', 
            display: 'flex', flexDirection: 'column',
            gap: '15px'
        }}>
            {/* TABS & TOOLS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ 
                    display: 'flex', gap: '4px', overflowX: 'auto',
                    background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '12px',
                    border: '1px solid rgba(240,192,64,0.1)'
                }} className="custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '8px 14px',
                                background: activeTab === tab.id ? '#f0c040' : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab.id ? '#000' : '#c8a870',
                                border: 'none', borderRadius: '8px',
                                fontSize: '10px', fontWeight: 900, cursor: 'pointer',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                                fontFamily: "'Cinzel', serif"
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                            background: 'rgba(0,0,0,0.8)', color: '#f0c040', border: '1px solid rgba(240,192,64,0.4)',
                            borderRadius: '8px', padding: '5px 15px', fontSize: '10px', fontFamily: "'Cinzel', serif", outline: 'none'
                        }}
                    >
                        <option value="POWER">СОРТ: ПО МОЩИ</option>
                        <option value="RARITY">СОРТ: ПО РЕДКОСТИ</option>
                    </select>
                </div>
            </div>

            {/* GRID CONTAINER */}
            <div style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(240,192,64,0.1)',
                padding: mode === 'FULL' ? '20px' : '10px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: mode === 'FULL' ? 'repeat(6, 1fr)' : 'repeat(2, 1fr)',
                gridAutoRows: mode === 'FULL' ? '120px' : '150px',
                gap: '10px'
            }} className="custom-scrollbar">
                {filteredItems.map((item: any, i: number) => (
                    <DraggableInventoryItem 
                        key={item.id + '-' + i}
                        item={item}
                        isSelected={selectedItemId === item.id}
                        isEquipped={isEquipped(item.id)}
                        mode={mode}
                        onClick={() => {
                            setSelectedItemId(item.id);
                            onItemClick?.(item.id);
                        }}
                        onSell={() => sellItem(item.id)}
                    />
                ))}
                {Array.from({ length: Math.max(0, 16 - filteredItems.length) }).map((_, i) => (
                    <div key={'empty-' + i} style={{ 
                        background: 'rgba(0,0,0,0.2)', 
                        borderRadius: '12px',
                        border: '1px solid rgba(240,192,64,0.05)',
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
                    }} />
                ))}
            </div>
        </div>
    );
};

const DraggableInventoryItem: React.FC<{ item: any, isSelected: boolean, isEquipped: boolean, mode: 'FULL' | 'COMPACT', onClick: () => void, onSell: () => void }> = ({ item, isSelected, isEquipped, mode, onClick, onSell }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
    });

    const data = ITEMS_DATABASE[String(item.id)] as any;
    const rarityColors: any = {
        COMMON: '#a0a0a0',
        RARE: '#3b82f6',
        EPIC: '#a855f7',
        MYTHIC: '#ef4444',
        LEGENDARY: '#f59e0b'
    };

    const style = {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <motion.div 
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            whileHover={{ scale: 1.05, boxShadow: `0 0 25px ${rarityColors[data?.rarity || 'COMMON']}77` }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            style={{
                width: mode === 'FULL' ? '105px' : '130px', 
                height: mode === 'FULL' ? '105px' : '130px',
                background: isSelected ? 'rgba(240,192,64,0.2)' : 'rgba(10,10,15,0.95)',
                borderRadius: '12px',
                border: `2px solid ${isSelected ? '#f0c040' : 'rgba(240,192,64,0.12)'}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected 
                    ? `0 0 35px ${rarityColors[data?.rarity || 'COMMON']}55, inset 0 0 20px ${rarityColors[data?.rarity || 'COMMON']}33` 
                    : '0 4px 15px rgba(0,0,0,0.4)',
                overflow: 'visible',
                ...style
            }}
        >
            {/* RARITY BACKGROUND GLOW FOR RARE ITEMS */}
            {(data?.rarity === 'EPIC' || data?.rarity === 'MYTHIC' || data?.rarity === 'LEGENDARY') && (
                <motion.div 
                    animate={{ 
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle, ${rarityColors[data.rarity]} 0%, transparent 70%)`,
                        zIndex: 0,
                        borderRadius: '8px'
                    }}
                />
            )}

            {data && (
                <>
                    <img 
                        src={data.image} 
                        style={{ 
                            width: '85%', 
                            height: '85%', 
                            objectFit: 'contain',
                            filter: (item.id === 'pan' || item.id === 'stick' || item.id.toString().includes('starter')) 
                                ? 'url(#remove-white) drop-shadow(0 8px 12px rgba(0,0,0,0.8))' 
                                : 'drop-shadow(0 8px 12px rgba(0,0,0,0.8))',
                            imageRendering: '-webkit-optimize-contrast',
                            position: 'relative',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }} 
                    />
                    {/* GEAR SCORE BADGE */}
                    <div style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 900,
                        color: '#f0c040',
                        border: '1px solid rgba(240,192,64,0.3)',
                        zIndex: 5,
                        fontFamily: "'Cinzel', serif"
                    }}>
                        {calculateItemPower(data)}
                    </div>
                </>
            )}
            
            {/* RARITY INDICATOR */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: rarityColors[data?.rarity || 'COMMON'],
                borderRadius: '0 0 8px 8px',
                zIndex: 2
            }} />

            {isEquipped && (
                <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '28px',
                    height: '28px',
                    background: 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#000',
                    fontWeight: 900,
                    border: '2px solid #1a1008',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                    textShadow: '0 1px 0 rgba(255,255,255,0.3)'
                }}>★</div>
            )}

            {isSelected && !isEquipped && (
                <motion.button 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.2 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSell();
                    }}
                    style={{
                        position: 'absolute',
                        bottom: '-12px',
                        right: '-12px',
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)',
                        border: '2px solid #fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                    }}
                    title="Продать предмет"
                >
                    💰
                </motion.button>
            )}
        </motion.div>
    );
};
