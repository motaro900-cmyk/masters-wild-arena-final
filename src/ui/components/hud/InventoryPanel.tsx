import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower, ItemRarity } from '../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { UnderDevelopmentModal } from './SharedUI';
import { useDraggable } from '@dnd-kit/core';

interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
    setGlobalHoveredItem?: (id: string | null, x: number, y: number) => void;
}

const RARITY_COLORS: any = {
    [ItemRarity.COMMON]: { border: '#a0a0a0', glow: 'rgba(160,160,160,0.2)', bg: 'rgba(50,50,50,0.8)' },
    [ItemRarity.RARE]: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', bg: 'rgba(20,30,50,0.9)' },
    [ItemRarity.EPIC]: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(40,20,60,0.9)' },
    MYTHIC: { border: '#ef4444', glow: 'rgba(239,68,68,0.4)', bg: 'rgba(60,20,20,0.9)' },
    [ItemRarity.LEGENDARY]: { border: '#f59e0b', glow: 'rgba(245,158,11,0.5)', bg: 'rgba(60,45,10,0.9)' }
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ mode = 'FULL', onItemClick, setGlobalHoveredItem }) => {
    const { inventory, sellItem, equippedItems, getHeroByItemId, selectedHeroId } = useGameStore();
    const [activeTab, setActiveTab] = useState<'ALL' | 'EQUIPMENT' | 'POTIONS'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'RARITY'>('POWER');
    const [devModalOpen, setDevModalOpen] = useState(false);

    // Лимит инвентаря (заглушка на 100)
    const MAX_SLOTS = 100;

    const filteredItems = useMemo(() => {
        let items = [...inventory];
        
        if (activeTab === 'EQUIPMENT') {
            items = items.filter(item => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL');
        } else if (activeTab === 'POTIONS') {
            items = items.filter(item => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ALCHEMY');
        }

        const rarityOrder: Record<string, number> = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'MYTHIC': 3, 'LEGENDARY': 4 };

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
        if (confirm(`Продать все обычные предметы (${junk.length} шт.)?`)) {
            junk.forEach((item: any) => sellItem(item.id));
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* ТАБЫ И ИНФО */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { id: 'ALL', label: 'ВСЁ' },
                        { id: 'EQUIPMENT', label: 'СНАРЯЖЕНИЕ' },
                        { id: 'POTIONS', label: 'АЛХИМИЯ' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                            }}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(240,192,64,0.2)',
                                background: activeTab === tab.id ? 'rgba(240,192,64,0.1)' : 'transparent',
                                color: activeTab === tab.id ? '#f0c040' : 'rgba(255,255,255,0.4)',
                                fontSize: '11px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Cinzel', serif"
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                        СУМКА: <span style={{ color: inventory.length > MAX_SLOTS * 0.8 ? '#ef4444' : '#fff' }}>{inventory.length}/{MAX_SLOTS}</span>
                    </div>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                            background: 'rgba(0,0,0,0.5)', color: '#f0c040', border: '1px solid rgba(240,192,64,0.2)',
                            borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontFamily: "'Cinzel', serif"
                        }}
                    >
                        <option value="POWER">ПО МОЩИ</option>
                        <option value="RARITY">ПО РЕДКОСТИ</option>
                    </select>
                </div>
            </div>

            {/* СЕТКА ПРЕДМЕТОВ */}
            <div style={{
                flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(240,192,64,0.1)',
                padding: '15px', overflowY: 'auto', display: 'grid',
                gridTemplateColumns: mode === 'FULL' ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)',
                gridAutoRows: mode === 'FULL' ? '90px' : '80px', gap: '10px'
            }} className="leaderboard-scroll">
                {filteredItems.map((item: any, i: number) => {
                    const data = ITEMS_DATABASE[item.id] as any;
                    if (!data) return null; // Защита от вылета, если предмета нет в базе
                    
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
                            onItemClick={onItemClick}
                            setGlobalHoveredItem={setGlobalHoveredItem}
                        />
                    );
                })}
                {/* Пустые слоты */}
                {Array.from({ length: Math.max(0, 18 - filteredItems.length) }).map((_, i) => (
                    <div key={'empty-' + i} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px dashed rgba(240,192,64,0.05)' }} />
                ))}
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЙ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                    onClick={handleSellJunk}
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                    🗑️ ПРОДАТЬ ВЕСЬ ХЛАМ (ОБЫЧНЫЕ)
                </button>

            </div>

            <UnderDevelopmentModal 
                isOpen={devModalOpen} 
                onClose={() => setDevModalOpen(false)} 
                title="СЕКРЕТЫ АЛХИМИИ" 
            />
        </div>
    );
};

const DraggableItem = ({ item, data, isEquippedOnCurrent, isEquippedOnOther, equippedHeroId, rarity, onItemClick, setGlobalHoveredItem }: any) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: item
    });

    return (
        <motion.div 
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onMouseMove={(e: any) => setGlobalHoveredItem?.(item.id, e.clientX, e.clientY)}
            onMouseEnter={(e: any) => setGlobalHoveredItem?.(item.id, e.clientX, e.clientY)}
            onMouseLeave={() => setGlobalHoveredItem?.(null, 0, 0)}
            style={{
                background: rarity.bg, borderRadius: '8px', border: `2px solid ${isEquippedOnCurrent ? '#f0c040' : rarity.border}`,
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isEquippedOnCurrent ? '0 0 15px rgba(240,192,64,0.3)' : '0 4px 10px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                opacity: isDragging ? 0.4 : 1
            }}
        >
            {/* DRAG HANDLE - Скрытая или маленькая зона для драга */}
            <div 
                ref={setNodeRef}
                {...listeners} 
                {...attributes}
                onClick={(e: any) => {
                    e.stopPropagation();
                    if (isEquippedOnOther) {
                        if (!confirm(`Этот предмет надет на ${equippedHeroId}. Передать его текущему герою?`)) return;
                    }
                    onItemClick?.(item.id);
                }}
                style={{ 
                    position: 'absolute', inset: 0, zIndex: 5, 
                    cursor: isDragging ? 'grabbing' : 'grab',
                }} 
            />

            {data.spriteClass ? (
                <div className={data.spriteClass} style={{ width: '80px', height: '80px', opacity: isEquippedOnOther ? 0.6 : 1, pointerEvents: 'none', zIndex: 1 }} />
            ) : (
                <img src={data.image} style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: isEquippedOnOther ? 0.6 : 1, pointerEvents: 'none', zIndex: 1 }} alt="" />
            )}
            
            {/* МЕТКА ЭКИПИРОВКИ (ТЕКУЩИЙ ГЕРОЙ) */}
            {isEquippedOnCurrent && (
                <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: '#f0c040', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#000', fontWeight: 900, border: '2px solid #1a1008', pointerEvents: 'none', zIndex: 10 }}>
                    🛡️
                </div>
            )}

            {/* МЕТКА ЭКИПИРОВКИ (ДРУГОЙ ГЕРОЙ) */}
            {isEquippedOnOther && (
                <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '24px', height: '24px', background: '#1a1008', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef4444', overflow: 'hidden', pointerEvents: 'none' }} title={`Надето на: ${equippedHeroId}`}>
                    <img 
                        src={HEROES_DB.find(h => h.id === equippedHeroId)?.image} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt="" 
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.3)' }} />
                </div>
            )}

            {/* ГЕЙР СКОР (УРОВЕНЬ МОЩИ) */}
            <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', fontWeight: 900, color: '#f0c040', opacity: 0.8, pointerEvents: 'none' }}>
                {calculateItemPower(data)}
            </div>

            {/* СТАК (для зелий) */}
            {item.amount > 1 && (
                <div style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '10px', fontWeight: 900, color: '#fff', textShadow: '0 1px 2px #000', pointerEvents: 'none' }}>
                    x{item.amount}
                </div>
            )}
        </motion.div>
    );
};
