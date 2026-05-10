import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower, ItemRarity, IEquipmentStats } from '../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';

interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
}

const RARITY_COLORS: any = {
    [ItemRarity.COMMON]: { border: '#a0a0a0', glow: 'rgba(160,160,160,0.2)', bg: 'rgba(50,50,50,0.8)' },
    [ItemRarity.RARE]: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', bg: 'rgba(20,30,50,0.9)' },
    [ItemRarity.EPIC]: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(40,20,60,0.9)' },
    MYTHIC: { border: '#ef4444', glow: 'rgba(239,68,68,0.4)', bg: 'rgba(60,20,20,0.9)' },
    [ItemRarity.LEGENDARY]: { border: '#f59e0b', glow: 'rgba(245,158,11,0.5)', bg: 'rgba(60,45,10,0.9)' }
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ mode = 'FULL', onItemClick }) => {
    const { inventory, sellItem, equippedItems, equipItem, unequipItem, getHeroByItemId, selectedHeroId } = useGameStore();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'EQUIPMENT' | 'POTIONS'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'RARITY'>('POWER');
    
    // Всплывающие цифры
    const [floatingTexts, setFloatingTexts] = useState<any[]>([]);

    const addFloatingText = (text: string, color: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setFloatingTexts(prev => [...prev, { id, text, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== id));
        }, 2000);
    };

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

    const selectedItemData = selectedItemId ? ITEMS_DATABASE[selectedItemId] : null;

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
                            onClick={() => setActiveTab(tab.id as any)}
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
                    const equippedHeroId = getHeroByItemId(item.id);
                    const isEquippedOnCurrent = equippedHeroId === (selectedHeroId || 'panda');
                    const isEquippedOnOther = equippedHeroId && !isEquippedOnCurrent;
                    
                    const rarity = RARITY_COLORS[data?.rarity || 'COMMON'];
                    
                    return (
                        <motion.div 
                            key={item.id + i}
                            whileHover={{ scale: 1.05, zIndex: 10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setSelectedItemId(item.id);
                                onItemClick?.(item.id);
                            }}
                            style={{
                                background: rarity.bg, borderRadius: '8px', border: `2px solid ${selectedItemId === item.id ? '#f0c040' : rarity.border}`,
                                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: isEquippedOnCurrent ? '0 0 15px rgba(240,192,64,0.3)' : '0 4px 10px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={data.image} style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: isEquippedOnOther ? 0.6 : 1 }} alt="" />
                            
                            {/* МЕТКА ЭКИПИРОВКИ (ТЕКУЩИЙ ГЕРОЙ) */}
                            {isEquippedOnCurrent && (
                                <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: '#f0c040', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#000', fontWeight: 900, border: '2px solid #1a1008' }}>
                                    🛡️
                                </div>
                            )}

                            {/* МЕТКА ЭКИПИРОВКИ (ДРУГОЙ ГЕРОЙ) */}
                            {isEquippedOnOther && (
                                <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '24px', height: '24px', background: '#1a1008', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef4444', overflow: 'hidden' }} title={`Надето на: ${equippedHeroId}`}>
                                    <img 
                                        src={HEROES_DB.find(h => h.id === equippedHeroId)?.image} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        alt="" 
                                    />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.3)' }} />
                                </div>
                            )}

                            {/* ГЕЙР СКОР (УРОВЕНЬ МОЩИ) */}
                            <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', fontWeight: 900, color: '#f0c040', opacity: 0.8 }}>
                                {calculateItemPower(data)}
                            </div>

                            {/* СТАК (для зелий) */}
                            {item.amount > 1 && (
                                <div style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '10px', fontWeight: 900, color: '#fff', textShadow: '0 1px 2px #000' }}>
                                    x{item.amount}
                                </div>
                            )}
                        </motion.div>
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
                    🗑️ ПРОДАТЬ ВЕСЬ ХЛАМ (COMMON)
                </button>
            </div>

            {/* ИНСПЕКТОР ПРЕДМЕТА (POPUP) */}
            <AnimatePresence>
                {selectedItemId && selectedItemData && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setSelectedItemId(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '350px', background: '#1a1008', border: `2px solid ${RARITY_COLORS[selectedItemData.rarity as any].border}`,
                                borderRadius: '20px', padding: '25px', position: 'relative', boxShadow: `0 0 50px ${RARITY_COLORS[selectedItemData.rarity as any].glow}`
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 900, color: RARITY_COLORS[selectedItemData.rarity as any].border, letterSpacing: '2px', marginBottom: '5px' }}>{selectedItemData.rarity}</div>
                                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', margin: 0, color: '#fff' }}>{selectedItemData.name}</h2>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <img src={selectedItemData.image} style={{ width: '80%', height: '80%', objectFit: 'contain' }} alt="" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '10px' }}>{selectedItemData.desc}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {['attackBonus', 'defenseBonus', 'hpBonus'].map(statKey => {
                                            const itemData = selectedItemData as any;
                                            const val = itemData[statKey];
                                            if (val === undefined) return null;
                                            
                                            // Сравнение
                                            const subTab = itemData.subTab;
                                            const equippedId = (equippedItems || {})[subTab];
                                            const equippedItem = equippedId ? ITEMS_DATABASE[equippedId] as IEquipmentStats : null;
                                            const equippedVal = equippedItem ? ((equippedItem as any)[statKey] || 0) : 0;
                                            const diff = val - equippedVal;

                                            const labels: any = { attackBonus: 'АТАКА', defenseBonus: 'ЗАЩИТА', hpBonus: 'ЗДОРОВЬЕ' };
                                            const icons: any = { attackBonus: '⚔️', defenseBonus: '🛡️', hpBonus: '❤️' };

                                            return <StatRow key={statKey} label={labels[statKey]} value={val} diff={diff} icon={icons[statKey]} />;
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {getHeroByItemId(selectedItemId) === (selectedHeroId || 'panda') ? (
                                    <button 
                                        onClick={() => { unequipItem(selectedItemId); setSelectedItemId(null); }}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        СНЯТЬ
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => { 
                                            const otherHero = getHeroByItemId(selectedItemId);
                                            if (otherHero && !confirm(`Этот предмет надет на ${otherHero}. Передать его текущему герою?`)) return;
                                            
                                            // Показываем профит
                                            if (selectedItemData.attackBonus) addFloatingText(`+${selectedItemData.attackBonus} АТАКА`, '#f1c40f');
                                            if (selectedItemData.hpBonus) addFloatingText(`+${selectedItemData.hpBonus} ХП`, '#22c55e');

                                            equipItem(selectedItemId); 
                                            setSelectedItemId(null); 
                                        }}
                                        style={{ flex: 1, padding: '12px', background: 'linear-gradient(180deg, #f0c040, #c87820)', border: 'none', borderRadius: '10px', color: '#1a1008', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        {getHeroByItemId(selectedItemId) ? 'ЗАБРАТЬ И НАДЕТЬ' : 'НАДЕТЬ'}
                                    </button>
                                )}
                                <button 
                                    onClick={() => { sellItem(selectedItemId); setSelectedItemId(null); }}
                                    style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ВСПЛЫВАЮЩИЙ ТЕКСТ */}
            <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <AnimatePresence>
                    {floatingTexts.map(t => (
                        <motion.div 
                            key={t.id}
                            initial={{ y: 0, opacity: 0, scale: 0.5 }}
                            animate={{ y: -100, opacity: 1, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            style={{ color: t.color, fontSize: '24px', fontWeight: 900, textShadow: '0 0 10px rgba(0,0,0,0.8)', fontFamily: "'Cinzel', serif" }}
                        >
                            {t.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string, value: number, diff: number, icon: string }> = ({ label, value, diff, icon }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon} {label}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#fff' }}>+{value}</span>
            {diff !== 0 && (
                <span style={{ color: diff > 0 ? '#22c55e' : '#ef4444', fontSize: '10px' }}>
                    ({diff > 0 ? `+${diff}` : diff})
                </span>
            )}
        </div>
    </div>
);
