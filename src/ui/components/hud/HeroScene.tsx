import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { AssetsMap } from '../../../configs/AssetsMap';
import { HeroAnimator } from './HeroAnimator';
import { audioService } from '../../../services/AudioService';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { InventoryPanel } from './InventoryPanel';
import { UnderDevelopmentModal } from './SharedUI';
import {
    DndContext,
    DragOverlay,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter
} from '@dnd-kit/core';

type SceneTab = 'LIST' | 'HERO' | 'TALENTS';

export const HeroScene: React.FC = () => {
    const {
        getCalculatedStats,
        inventory,
        equipItem,
        unequipItem,
        heroEquipment,
        heroesInitialTab,
        selectedHeroId,
        setSelectedHeroId,
        ownedHeroes,
        goToMainMenu,
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<SceneTab>((heroesInitialTab as SceneTab) || 'LIST');
    const [detailSubTab, setDetailSubTab] = useState<'STATS' | 'LORE' | 'INVENTORY'>('INVENTORY');
    const [activeFilter, setActiveFilter] = useState<string>('ВСЕ');
    const [tooltipHero, setTooltipHero] = useState<any>(null);
    const [viewingHero, setViewingHero] = useState<any>(null); // NEW: For Inspector mode
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [confirmingHero, setConfirmingHero] = useState<any>(null);
    const [heroAction, setHeroAction] = useState<'IDLE' | 'VICTORY' | 'ULTIMATE'>('IDLE');
    const [globalHoveredItem, setGlobalHoveredItem] = useState<{ id: string, x: number, y: number } | null>(null);
    const [devModal, setDevModal] = useState({ isOpen: false, title: '' });

    // Всплывающий текст для DnD
    const [floatingTexts, setFloatingTexts] = useState<any[]>([]);
    const addFloatingText = (text: string, color: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setFloatingTexts(prev => [...prev, { id, text, color }]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 2000);
    };

    const triggerVictory = () => {
        setHeroAction('VICTORY');
        setTimeout(() => setHeroAction('IDLE'), 1500);
    };

    const isEquipped = (itemId: string) => {
        const currentHeroGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
        return Object.values(currentHeroGear).includes(itemId);
    };

    const handleItemClick = (itemId: string) => {
        const itemData = ITEMS_DATABASE[String(itemId)] as any;
        if (!itemData) return;

        if (selectedItemId === itemId) {
            // Вычисляем дельту перед экипировкой
            const currentGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
            const existingId = currentGear[itemData.subTab];
            const existingItem = existingId ? ITEMS_DATABASE[String(existingId)] as any : null;

            const attackDelta = (itemData.attackBonus || 0) - (existingItem?.attackBonus || 0);
            const hpDelta = (itemData.hpBonus || 0) - (existingItem?.hpBonus || 0);
            const defenseDelta = (itemData.defenseBonus || 0) - (existingItem?.defenseBonus || 0);

            if (attackDelta !== 0) addFloatingText(`${attackDelta > 0 ? '+' : ''}${attackDelta} АТАКА`, attackDelta > 0 ? '#22c55e' : '#ef4444');
            if (hpDelta !== 0) addFloatingText(`${hpDelta > 0 ? '+' : ''}${hpDelta} ХП`, hpDelta > 0 ? '#22c55e' : '#ef4444');
            if (defenseDelta !== 0) addFloatingText(`${defenseDelta > 0 ? '+' : ''}${defenseDelta} ЗАЩИТА`, defenseDelta > 0 ? '#22c55e' : '#ef4444');

            triggerVictory();
            equipItem(itemId);
        } else {
            setSelectedItemId(itemId);
        }
    };

    useEffect(() => {
        if (heroesInitialTab) {
            setActiveTab(heroesInitialTab as SceneTab);
        }
    }, [heroesInitialTab]);

    const selectedHero = HEROES_DB.find(h => h.id === selectedHeroId) || HEROES_DB[0];
    const stats = getCalculatedStats(selectedHero.id);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const itemId = active.id;
        const slotType = over.id;
        const itemData = ITEMS_DATABASE[String(itemId)] as any;

        if (itemData && (itemData.subTab === slotType || (slotType === 'WEAPONS' && itemData.subTab === 'WEAPONS'))) {
            // Вычисляем ДЕЛЬТУ (прирост от замены), а не абсолютный бонус
            const currentGear = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
            const existingId = currentGear[slotType];
            const existingItem = existingId ? ITEMS_DATABASE[String(existingId)] as any : null;

            const attackDelta = (itemData.attackBonus || 0) - (existingItem?.attackBonus || 0);
            const hpDelta = (itemData.hpBonus || 0) - (existingItem?.hpBonus || 0);
            const defenseDelta = (itemData.defenseBonus || 0) - (existingItem?.defenseBonus || 0);

            if (attackDelta !== 0) addFloatingText(`${attackDelta > 0 ? '+' : ''}${attackDelta} АТАКА`, attackDelta > 0 ? '#22c55e' : '#ef4444');
            if (hpDelta !== 0) addFloatingText(`${hpDelta > 0 ? '+' : ''}${hpDelta} ХП`, hpDelta > 0 ? '#22c55e' : '#ef4444');
            if (defenseDelta !== 0) addFloatingText(`${defenseDelta > 0 ? '+' : ''}${defenseDelta} ЗАЩИТА`, defenseDelta > 0 ? '#22c55e' : '#ef4444');

            triggerVictory();
            equipItem(itemId);
        }
    };

    const activeItem = activeId ? inventory.find((i: any) => i.id === activeId) : null;
    const activeItemData = activeItem ? ITEMS_DATABASE[String(activeItem.id)] as any : null;

    const rarityColors = {
        COMMON: '#a0a0a0',
        RARE: '#3b82f6',
        EPIC: '#a855f7',
        MYTHIC: '#ef4444',
        LEGENDARY: '#f59e0b'
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div 
                id="hero-scene-root"
                style={{
                    width: '1920px', height: '1080px', background: '#000', position: 'absolute', top: 0, left: 0, overflow: 'hidden', zIndex: 1000
                }}
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        width: '1920px', height: '1080px',
                        backgroundImage: `url("${AssetsMap.BACKGROUNDS.HEROES_HALL}")`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        width: '100%', height: '120px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                        display: 'flex', alignItems: 'center', padding: '0 80px', gap: '40px', zIndex: 100
                    }}>
                        <TabButton active={activeTab === 'LIST'} onClick={() => setActiveTab('LIST')} label="ВСЕ ГЕРОИ" icon="👥" />
                        <TabButton active={activeTab === 'HERO'} onClick={() => setActiveTab('HERO')} label="СНАРЯЖЕНИЕ" icon="⚔️" />
                        <TabButton active={activeTab === 'TALENTS'} onClick={() => setDevModal({ isOpen: true, title: 'СИСТЕМА ТАЛАНТОВ' })} label="ТАЛАНТЫ" icon="🌟" />

                        <div style={{ flex: 1 }} />

                        <button onClick={goToMainMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={AssetsMap.UI.ICON_EXIT} style={{ width: '45px' }} alt="" />
                            <span style={{ color: '#c8a870', fontSize: '20px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>ВЫХОД</span>
                        </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            {activeTab === 'LIST' ? (
                                <HeroList 
                                    rarityColors={rarityColors} 
                                    ownedHeroes={ownedHeroes} 
                                    selectedHeroId={selectedHeroId} 
                                    activeFilter={activeFilter}
                                    setActiveFilter={setActiveFilter}
                                    setTooltipHero={setTooltipHero}
                                    setMousePos={setMousePos}
                                    setSelectedHeroId={setSelectedHeroId}
                                    onInspect={(h: any) => setViewingHero(h)}
                                />
                            ) : activeTab === 'HERO' ? (
                                <GearView 
                                    hero={selectedHero}
                                    stats={stats}
                                    detailSubTab={detailSubTab}
                                    setDetailSubTab={setDetailSubTab}
                                    handleItemClick={handleItemClick}
                                    isEquipped={isEquipped}
                                    equippedIds={stats.equippedIds}
                                    activeDraggingId={activeId}
                                    unequipItem={unequipItem}
                                    addFloatingText={addFloatingText}
                                    heroAction={heroAction}
                                    setGlobalHoveredItem={(id: string | null, x: number, y: number) => setGlobalHoveredItem(id ? {id, x, y} : null)}
                                    setDevModal={setDevModal}
                                />
                            ) : (
                                <div style={{ color: '#fff' }}>Таланты в разработке...</div>
                            )}
                        </AnimatePresence>
                    </div>
                    <AnimatePresence>
                        {tooltipHero && <HeroTooltip hero={tooltipHero} mousePos={mousePos} rarityColors={rarityColors} />}
                        {viewingHero && (
                            <HeroDetailsModal
                                hero={viewingHero}
                                isOwned={ownedHeroes.includes(viewingHero.id)}
                                onClose={() => setViewingHero(null)}
                                rarityColors={rarityColors}
                                onBuy={() => {
                                    setConfirmingHero(viewingHero);
                                    setViewingHero(null);
                                }}
                                onSelect={() => {
                                    setSelectedHeroId(viewingHero.id);
                                    setViewingHero(null);
                                    setActiveTab('HERO');
                                }}
                            />
                        )}
                        {confirmingHero && (
                            <PurchaseModal 
                                hero={confirmingHero} 
                                onClose={() => setConfirmingHero(null)} 
                                rarityColors={rarityColors}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>


            <DragOverlay dropAnimation={null}>
                {activeId && activeItemData ? (
                    <div style={{
                        width: '90px', height: '90px',
                        background: 'rgba(240,192,64,0.3)',
                        borderRadius: '12px',
                        border: '2px solid #f0c040',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                        cursor: 'grabbing',
                        zIndex: 10000
                    }}>
                        {activeItemData.spriteClass ? (
                            <div className={activeItemData.spriteClass} style={{ width: '120px', height: '120px' }} />
                        ) : (
                            <img
                                src={activeItemData.image}
                                style={{
                                    width: '80%', height: '80%', objectFit: 'contain',
                                    filter: (activeItemData.id === 'pan' || activeItemData.id === 'stick' || activeItemData.id.toString().includes('starter')) ? 'url(#remove-white)' : 'none'
                                }}
                            />
                        )}
                    </div>
                ) : null}
            </DragOverlay>
            {/* ВСПЛЫВАЮЩИЙ ТЕКСТ ДЛЯ DND (Прямо над пьедесталом) */}
            <div style={{ position: 'absolute', bottom: '400px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <AnimatePresence>
                    {floatingTexts.map(t => (
                        <motion.div 
                            key={t.id}
                            initial={{ y: 0, opacity: 0, scale: 0.5 }}
                            animate={{ y: -150, opacity: 1, scale: 2 }}
                            exit={{ opacity: 0 }}
                            style={{ color: t.color, fontSize: '36px', fontWeight: 900, textShadow: '0 0 20px rgba(0,0,0,0.9)', fontFamily: "'Cinzel', serif" }}
                        >
                            {t.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ГЛОБАЛЬНЫЙ ТУЛТИП ПРЕДМЕТА (ПОРТАЛ) */}
            {globalHoveredItem && ITEMS_DATABASE[globalHoveredItem.id] && createPortal(
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        style={{ 
                            position: 'fixed', 
                            left: globalHoveredItem.x + 480 > window.innerWidth ? globalHoveredItem.x - 480 : globalHoveredItem.x + 20, 
                            top: Math.max(10, Math.min(window.innerHeight - 450, globalHoveredItem.y - 100)), 
                            zIndex: 2000000, pointerEvents: 'none' 
                        }}
                    >
                        <div style={{
                            width: '460px', background: 'rgba(12, 10, 8, 0.99)', 
                            border: `2px solid ${(rarityColors as any)[(ITEMS_DATABASE[globalHoveredItem.id] as any).rarity] || '#fff'}`,
                            borderRadius: '20px', padding: '30px', 
                            boxShadow: `0 25px 80px rgba(0,0,0,0.9), 0 0 40px ${(rarityColors as any)[(ITEMS_DATABASE[globalHoveredItem.id] as any).rarity] || '#fff'}33`,
                            backdropFilter: 'blur(20px)'
                        }}>
                            <div style={{ display: 'flex', gap: '25px', marginBottom: '20px' }}>
                                <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {(ITEMS_DATABASE[globalHoveredItem.id] as any).spriteClass ? (
                                        <div className={(ITEMS_DATABASE[globalHoveredItem.id] as any).spriteClass} style={{ width: '120px', height: '120px' }} />
                                    ) : (
                                        <img src={(ITEMS_DATABASE[globalHoveredItem.id] as any).image} style={{ width: '85%', height: '85%', objectFit: 'contain' }} alt="" />
                                    )}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 900, color: (rarityColors as any)[(ITEMS_DATABASE[globalHoveredItem.id] as any).rarity] || '#fff', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '6px' }}>
                                        {(() => {
                                            const r = (ITEMS_DATABASE[globalHoveredItem.id] as any).rarity;
                                            const map: any = { COMMON: 'ОБЫЧНЫЙ', RARE: 'РЕДКИЙ', EPIC: 'ЭПИЧЕСКИЙ', MYTHIC: 'МИФИЧЕСКИЙ', LEGENDARY: 'ЛЕГЕНДАРНЫЙ' };
                                            return map[r] || r;
                                        })()}
                                    </div>
                                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', fontFamily: "'Cinzel', serif", lineHeight: 1.1 }}>{(ITEMS_DATABASE[globalHoveredItem.id] as any).name}</div>
                                </div>
                            </div>
                            
                            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginBottom: '25px', lineHeight: '1.6' }}>
                                {(ITEMS_DATABASE[globalHoveredItem.id] as any).desc}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                {['attackBonus', 'defenseBonus', 'hpBonus'].map(statKey => {
                                    const val = (ITEMS_DATABASE[globalHoveredItem.id] as any)[statKey];
                                    if (val === undefined) return null;
                                    const labels: any = { attackBonus: 'АТАКА', defenseBonus: 'ЗАЩИТА', hpBonus: 'ЗДОРОВЬЕ' };
                                    const colors: any = { attackBonus: '#f97316', defenseBonus: '#3b82f6', hpBonus: '#ef4444' };
                                    return (
                                        <div key={statKey} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                                            <span style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>{labels[statKey]}</span>
                                            <span style={{ color: colors[statKey] }}>+{val}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: '#f0c040', fontWeight: 900, textAlign: 'center', letterSpacing: '2px' }}>
                                {(() => {
                                    const heroEquip = (heroEquipment || {})[selectedHeroId || 'panda'] || {};
                                    const isEquippedOnMe = Object.values(heroEquip).includes(globalHoveredItem.id);
                                    return isEquippedOnMe ? 'КЛИКНИТЕ, ЧТОБЫ СНЯТЬ' : 'КЛИКНИТЕ, ЧТОБЫ НАДЕТЬ';
                                })()}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            <UnderDevelopmentModal 
                isOpen={devModal.isOpen} 
                title={devModal.title} 
                onClose={() => setDevModal({ ...devModal, isOpen: false })} 
            />
        </DndContext>
    );
};

// --- Sub-components ---

const TabButton = ({ active, onClick, label, icon }: any) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: 900, color: active ? '#fff' : '#c8a870' }}>{label}</span>
        {active && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: '-15px', left: 0, right: 0, height: '3px', background: '#f0c040', boxShadow: '0 0 10px #f0c040' }} />}
    </button>
);

const FilterBar = ({ activeFilter, onSelect }: any) => {
    const { gold, crystals, ownedHeroes } = useGameStore(s => ({
        gold: s.gold, crystals: s.crystals, ownedHeroes: s.ownedHeroes
    }));

    // Считаем сколько героев можно купить прямо сейчас
    const affordableGold = HEROES_DB.filter(h => !ownedHeroes.includes(h.id) && h.unlockType === 'gold' && gold >= (h.unlockCost || 0)).length;
    const affordableDiamond = HEROES_DB.filter(h => !ownedHeroes.includes(h.id) && h.unlockType === 'diamonds' && crystals >= (h.unlockCost || 0)).length;

    const filters = [
        { id: 'ВСЕ', label: 'ВСЕ', badge: 0 },
        { id: 'ДОСТУПНЫЕ', label: 'МОИ', badge: 0 },
        { id: 'gold', label: 'ЗА ЗОЛОТО', badge: affordableGold },
        { id: 'diamonds', label: 'ЗА АЛМАЗЫ', badge: affordableDiamond },
        { id: 'achievement', label: 'ДОСТИЖЕНИЯ', badge: 0 }
    ];

    return (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '0 5px' }}>
            {filters.map(f => {
                const isActive = activeFilter === f.id;
                return (
                    <motion.button
                        key={f.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(f.id)}
                        style={{
                            width: '140px',
                            height: '42px',
                            background: `url("${AssetsMap.BACKGROUNDS.SHOP_BANNER_RED}")`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            border: 'none',
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            filter: isActive ? 'brightness(1.3) drop-shadow(0 0 5px rgba(255,200,0,0.5))' : 'brightness(0.8)',
                            transition: 'all 0.2s',
                            padding: '0 10px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            position: 'relative'
                        }}
                    >
                        {f.id === 'gold' && <span style={{ marginRight: '5px' }}>🪙</span>}
                        {f.id === 'diamonds' && <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: '18px', height: '18px', marginRight: '5px' }} alt="" />}
                        {f.id === 'achievement' && <span style={{ marginRight: '5px' }}>🏆</span>}
                        {f.label}
                        {f.badge > 0 && (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{
                                    position: 'absolute', top: '-6px', right: '-6px',
                                    minWidth: '18px', height: '18px', borderRadius: '9px',
                                    background: '#ef4444', border: '2px solid #fff',
                                    color: '#fff', fontSize: '10px', fontWeight: 900,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(239,68,68,0.8)', padding: '0 3px'
                                }}
                            >
                                {f.badge}
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};


const HeroList = ({ 
    rarityColors, 
    ownedHeroes, 
    selectedHeroId, 
    activeFilter, 
    setActiveFilter,
    setTooltipHero,
    setMousePos,
    onBuyClick,
    onHeroClick // NEW
}: any) => {
    const filteredHeroes = HEROES_DB.filter(hero => {
        if (activeFilter === 'ВСЕ') return true;
        if (activeFilter === 'ДОСТУПНЫЕ') return ownedHeroes.includes(hero.id);
        return hero.unlockType === activeFilter;
    });

    const handleMouseMove = (e: React.MouseEvent) => {
        const root = document.getElementById('hero-scene-root');
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const scaleX = rect.width / 1920;
        const scaleY = rect.height / 1080;
        
        setMousePos({
            x: (e.clientX - rect.left) / scaleX,
            y: (e.clientY - rect.top) / scaleY
        });
    };

    return (
        <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            style={{
                position: 'absolute',
                inset: '20px 80px 40px 80px', 
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <FilterBar activeFilter={activeFilter} onSelect={setActiveFilter} />
            
            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridAutoRows: 'min-content',
                    gap: '25px', 
                    overflowY: 'auto',
                    paddingRight: '20px',
                    flex: 1
                }}
                className="custom-scrollbar"
            >
                {filteredHeroes.map((hero: any) => (
                    <HeroCard
                        key={hero.id}
                        hero={hero}
                        isOwned={ownedHeroes.includes(hero.id)}
                        isActive={selectedHeroId === hero.id}
                        onClick={() => onHeroClick(hero)} // NEW
                        onBuyClick={() => onBuyClick(hero)}
                        color={rarityColors[hero.rarity]}
                        onMouseEnter={(e: any) => {
                            setTooltipHero(hero);
                            handleMouseMove(e);
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setTooltipHero(null)}
                    />
                ))}
            </div>
        </motion.div>
    );
};

const TALENTS_CONFIG = [
    {
        id: 'attack',
        title: 'АТАКА',
        icon: '⚔️',
        color: '#ef4444',
        tiers: [
            { 
                level: 1, 
                requiredInBranch: 0,
                talents: [
                    { id: 'atk_base', name: 'Сила Зверя', iconClass: 'sprite-talent talent-1', max: 5, desc: 'Увеличивает базовую силу атаки на {v}%.' }
                ] 
            },
            { 
                level: 2, 
                requiredInBranch: 3,
                talents: [
                    { id: 'atk_crit', name: 'Острый Коготь', iconClass: 'sprite-talent talent-2', max: 3, desc: 'Шанс критического удара +{v}%.' },
                    { id: 'atk_pen', name: 'Тяжелая Лапа', iconClass: 'sprite-talent talent-3', max: 3, desc: 'Пробивание брони +{v}%.' }
                ] 
            },
            { 
                level: 3, 
                requiredInBranch: 10,
                talents: [
                    { id: 'atk_ult', name: 'Ярость Грома', iconClass: 'sprite-talent talent-4', max: 1, desc: 'Критические удары вызывают разряд молнии.' }
                ] 
            }
        ]
    },
    {
        id: 'defense',
        title: 'ЗАЩИТА',
        icon: '🛡️',
        color: '#3b82f6',
        tiers: [
            { 
                level: 1, 
                requiredInBranch: 0,
                talents: [
                    { id: 'def_base', name: 'Крепкая Шкура', iconClass: 'sprite-talent talent-5', max: 5, desc: 'Увеличивает объем здоровья на {v}%.' }
                ] 
            },
            { 
                level: 2, 
                requiredInBranch: 3,
                talents: [
                    { id: 'def_res', name: 'Каменная Стойка', iconClass: 'sprite-talent talent-6', max: 3, desc: 'Стойкость к критическим ударам +{v}.' },
                    { id: 'def_eva', name: 'Дух Предков', iconClass: 'sprite-talent talent-7', max: 3, desc: 'Шанс уклонения +{v}%.' }
                ] 
            },
            { 
                level: 3, 
                requiredInBranch: 10,
                talents: [
                    { id: 'def_ult', name: 'Неуязвимость', iconClass: 'sprite-talent talent-8', max: 1, desc: 'Весь входящий урон снижен на 20%.' }
                ] 
            }
        ]
    },
    {
        id: 'mastery',
        title: 'МАСТЕРСТВО',
        icon: '✨',
        color: '#f0c040',
        tiers: [
            { 
                level: 1, 
                requiredInBranch: 0,
                talents: [
                    { id: 'mas_base', name: 'Медитация', iconClass: 'sprite-talent talent-9', max: 5, desc: 'Восстановление энергии в бою +{v}.' }
                ] 
            },
            { 
                level: 2, 
                requiredInBranch: 3,
                talents: [
                    { id: 'mas_spd', name: 'Ловкость Тени', iconClass: 'sprite-talent talent-10', max: 3, desc: 'Скорость передвижения и атаки +{v}%.' },
                    { id: 'mas_focus', name: 'Взор Дракона', iconClass: 'sprite-talent talent-11', max: 3, desc: 'Точность и шанс попадания +{v}%.' }
                ] 
            },
            { 
                level: 3, 
                requiredInBranch: 10,
                talents: [
                    { id: 'mas_ult', name: 'Дзен-Мастер', iconClass: 'sprite-talent talent-12', max: 1, desc: 'Способности стоят на 25% меньше энергии.' }
                ] 
            }
        ]
    }
];

const TalentsView = ({ hero }: any) => {
    const { heroTalents, upgradeTalent, resetTalents, talentPoints } = useGameStore();
    const talents = heroTalents[hero.id] || {};

    const availablePoints = talentPoints;

    const [activeTalent, setActiveTalent] = useState<any>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const handleUpgrade = (talent: any, branchId: string) => {
        if (availablePoints <= 0) return;
        const currentLevel = talents[talent.id] || 0;
        if (currentLevel >= talent.max) return;

        const branchPoints = Object.entries(talents)
            .filter(([id]) => id.startsWith(branchId.substring(0, 3)))
            .reduce((a, [_, v]) => a + (v as number), 0);

        const tier = TALENTS_CONFIG.find(b => b.id === branchId)?.tiers.find(t => t.talents.some(tt => tt.id === talent.id));
        if (tier && branchPoints < tier.requiredInBranch) return;

        upgradeTalent(hero.id, talent.id);
        audioService.playSFX('SFX_UPGRADE');
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{ 
                position: 'absolute', 
                inset: '40px 80px',
                display: 'flex', 
                flexDirection: 'column', 
                zIndex: 10
            }}
        >
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '15px 30px', borderRadius: '18px', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 0 25px rgba(0,0,0,0.5)' }}>
                    <h2 style={{ color: '#fff', fontSize: '28px', margin: 0, fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>ДРЕВО ТАЛАНТОВ</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '13px', fontWeight: 600 }}>Улучшайте способности вашего героя</p>
                </div>

                {/* PREMIUM POINTS BLOCK */}
                <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(240, 192, 64, 0.3) 0%, rgba(20, 20, 25, 0.98) 100%)', 
                        border: '2px solid #f0c040', 
                        padding: '15px 40px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '25px',
                        boxShadow: '0 15px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(240,192,64,0.15)',
                        backdropFilter: 'blur(15px)'
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <motion.span 
                            animate={{ scale: [1, 1.2, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ fontSize: '50px', display: 'block' }}
                        >
                            ⭐
                        </motion.span>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #f0c040 0%, transparent 70%)', opacity: 0.4, filter: 'blur(12px)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#f0c040', fontSize: '16px', fontWeight: 900, letterSpacing: '3px', fontFamily: "'Cinzel', serif", textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>ОЧКИ ТАЛАНТОВ</span>
                        <span style={{ color: '#fff', fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>{availablePoints}</span>
                    </div>
                </motion.div>
            </div>

            {/* TREE COLUMNS */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                {TALENTS_CONFIG.map(branch => (
                    <div key={branch.id} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* BRANCH HEADER */}
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '15px', 
                            background: `linear-gradient(90deg, ${branch.color}88 0%, transparent 100%)`,
                            padding: '10px 20px', borderRadius: '10px',
                            borderLeft: `4px solid ${branch.color}`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <span style={{ fontSize: '24px', filter: `drop-shadow(0 0 8px ${branch.color})` }}>{branch.icon}</span>
                            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: "'Cinzel', serif", letterSpacing: '2px', textShadow: `0 0 12px ${branch.color}` }}>{branch.title}</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            {branch.tiers.map((tier, tIndex) => {
                                const branchPoints = Object.entries(talents)
                                    .filter(([id]) => id.startsWith(branch.id.substring(0, 3)))
                                    .reduce((a, [_, v]) => a + (v as number), 0);
                                const isUnlocked = branchPoints >= tier.requiredInBranch;

                                return (
                                    <div key={tIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%' }}>
                                        {/* CONNECTORS (DYNAMIC GEOMETRY) */}
                                        {tIndex > 0 && (
                                            <div style={{ position: 'relative', height: '50px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                {/* CASE A: 1 Parent -> 2 Children (Branching) */}
                                                {branch.tiers[tIndex - 1].talents.length === 1 && tier.talents.length > 1 && (
                                                    <>
                                                        {/* Spine UP */}
                                                        <div style={{ position: 'absolute', top: 0, width: '6px', height: '25px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                        {/* Bridge */}
                                                        <div style={{ position: 'absolute', top: '25px', width: '170px', height: '6px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`, borderRadius: '3px' }} />
                                                        {/* 2 Legs DOWN */}
                                                        <div style={{ position: 'absolute', top: '25px', left: 'calc(50% - 85px)', width: '6px', height: '25px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                        <div style={{ position: 'absolute', top: '25px', left: 'calc(50% + 85px)', width: '6px', height: '25px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                    </>
                                                )}

                                                {/* CASE B: 2 Parents -> 1 Child (Merging) */}
                                                {branch.tiers[tIndex - 1].talents.length > 1 && tier.talents.length === 1 && (
                                                    <>
                                                        {/* Bridge MIDDLE */}
                                                        <div style={{ position: 'absolute', top: '25px', width: '170px', height: '6px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}`, borderRadius: '3px' }} />
                                                        {/* 2 Legs UP (Connect to parents above) */}
                                                        <div style={{ position: 'absolute', top: 0, left: 'calc(50% - 85px)', width: '6px', height: '25px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                        <div style={{ position: 'absolute', top: 0, left: 'calc(50% + 85px)', width: '6px', height: '25px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                        {/* Spine DOWN (Connect to child below) */}
                                                        <div style={{ position: 'absolute', top: '25px', width: '6px', height: '25px', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                    </>
                                                )}

                                                {/* CASE C: 1 Parent -> 1 Child (Straight) */}
                                                {branch.tiers[tIndex - 1].talents.length === 1 && tier.talents.length === 1 && (
                                                    <div style={{ width: '6px', height: '100%', background: isUnlocked ? branch.color : '#0a0a0a', border: `1px solid ${isUnlocked ? branch.color + '88' : 'rgba(255,255,255,0.15)'}` }} />
                                                )}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '60px', justifyContent: 'center', width: '100%', zIndex: 2 }}>
                                            {tier.talents.map(talent => {
                                                const lvl = talents[talent.id] || 0;
                                                return (
                                                    <TalentNode 
                                                        key={talent.id} 
                                                        talent={talent} 
                                                        level={lvl} 
                                                        branchColor={branch.color} 
                                                        isUnlocked={isUnlocked}
                                                        canAfford={availablePoints > 0}
                                                        onClick={() => handleUpgrade(talent, branch.id)}
                                                        onMouseEnter={(e: any) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const root = document.getElementById('hero-scene-root');
                                                            const rootRect = root?.getBoundingClientRect();
                                                            if (rootRect) {
                                                                const scale = rootRect.width / 1920;
                                                                const x = (rect.right - rootRect.left) / scale + 20;
                                                                const y = (rect.top - rootRect.top) / scale;
                                                                // SMART POSITIONING: Lowered threshold and increased offset to ensure visibility
                                                                setTooltipPos({ 
                                                                    x: x > 1400 ? x - 520 : x, 
                                                                    y: y > 420 ? y - 520 : y 
                                                                });
                                                            }
                                                            setActiveTalent({ ...talent, branchPoints, required: tier.requiredInBranch, level: lvl });
                                                        }}
                                                        onMouseLeave={() => setActiveTalent(null)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (confirm('Сбросить все таланты? Очки будут возвращены.')) {
                            resetTalents(hero.id);
                            audioService.playSFX('SFX_CLICK');
                        }
                    }}
                    style={{
                        padding: '18px 50px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '15px', color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: 900,
                        cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: '2px', backdropFilter: 'blur(10px)'
                    }}
                >
                    🔄 СБРОСИТЬ ТАЛАНТЫ
                </motion.button>
            </div>

            {/* CONTEXTUAL TOOLTIP (ABSOLUTE) */}
            <AnimatePresence>
                {activeTalent && (
                    <TalentTooltip 
                        talent={activeTalent} 
                        pos={tooltipPos}
                        color={TALENTS_CONFIG.find(b => b.tiers.some(t => t.talents.some(tt => tt.id === activeTalent.id)))?.color || '#fff'} 
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TalentNode = ({ talent, level, branchColor, isUnlocked, canAfford, onClick, onMouseEnter, onMouseLeave }: any) => {
    const isMax = level >= talent.max;
    return (
        <motion.div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            whileHover={isUnlocked && !isMax && canAfford ? { scale: 1.1, boxShadow: `0 0 40px ${branchColor}cc` } : {}}
            whileTap={isUnlocked && !isMax && canAfford ? { scale: 0.9 } : {}}
            onClick={isUnlocked && !isMax && canAfford ? onClick : undefined}
            style={{
                width: '110px', height: '110px', borderRadius: '28px',
                background: isUnlocked ? 'rgba(25, 25, 35, 0.9)' : 'rgba(10,10,15,0.95)',
                border: `4px solid ${isMax ? '#f0c040' : (isUnlocked ? branchColor : 'rgba(255,255,255,0.15)')}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isUnlocked && !isMax && canAfford ? 'pointer' : 'default',
                position: 'relative',
                boxShadow: isMax ? `0 0 50px #f0c04099, inset 0 0 25px #f0c04033` : (isUnlocked ? `0 0 25px ${branchColor}66` : 'none'),
                filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.35)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <div className={talent.iconClass} style={{ width: '70px', height: '70px', filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.5)' }} />
            
            <div style={{
                position: 'absolute', bottom: '5px', right: '5px',
                background: isMax ? 'linear-gradient(135deg, #f0c040, #d4a017)' : '#0a0a0a',
                color: isMax ? '#000' : '#fff',
                width: '42px', height: '42px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 900, border: `2px solid ${isMax ? '#fff' : branchColor}`,
                boxShadow: isMax ? '0 4px 10px rgba(0,0,0,0.5)' : 'none',
                zIndex: 10
            }}>
                {level}/{talent.max}
            </div>

            {isMax && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: '-8px', border: '3px dashed #f0c040', borderRadius: '32px', opacity: 0.5 }}
                />
            )}
        </motion.div>
    );
};

const TalentTooltip = ({ talent, pos, color }: any) => {
    const isMax = talent.level >= talent.max;
    const progressValue = talent.level * (talent.id.includes('ult') ? 10 : 5);
    const progressText = talent.desc.replace('{v}', progressValue.toString());
    const nextText = !isMax ? talent.desc.replace('{v}', (progressValue + (talent.id.includes('ult') ? 10 : 5)).toString()) : null;

    let left = pos.x;
    let top = pos.y;
    // Bounds check within 1920x1080 (Hero Scene bounds)
    const expectedHeight = 550; 
    if (left + 480 > 1910) left = pos.x - 520;
    if (top + expectedHeight > 1070) top = 1070 - expectedHeight;
    if (top < 10) top = 10;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'absolute', left: left, top: top,
                width: '450px', background: 'rgba(10, 10, 18, 0.98)', backdropFilter: 'blur(25px)',
                borderRadius: '28px', border: `3px solid ${color}`, padding: '35px', zIndex: 100000,
                boxShadow: `0 40px 120px rgba(0,0,0,1), 0 0 60px ${color}33`,
                pointerEvents: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '25px' }}>
                <div style={{ 
                    width: '85px', height: '85px', background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}66`, boxShadow: `inset 0 0 15px ${color}22`
                }}>
                    <div className={talent.iconClass} style={{ width: '60px', height: '60px' }} />
                </div>
                <div>
                    <div style={{ color: '#fff', fontSize: '28px', fontWeight: 900, fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{talent.name}</div>
                    <div style={{ color: color, fontSize: '15px', fontWeight: 900, letterSpacing: '2px' }}>{isMax ? 'МАКС. УРОВЕНЬ' : `УРОВЕНЬ ${talent.level}/${talent.max}`}</div>
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: color, fontSize: '12px', fontWeight: 900, marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>Текущий Эффект</div>
                    <div style={{ color: '#fff', fontSize: '17px', lineHeight: '1.5', fontWeight: 600 }}>{talent.level > 0 ? progressText : 'Талант не активирован'}</div>
                </div>

                {!isMax && (
                    <div style={{ background: `${color}15`, padding: '20px', borderRadius: '18px', border: `1px solid ${color}33` }}>
                        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 900, marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7 }}>Следующий Уровень</div>
                        <div style={{ color: '#fff', fontSize: '17px', lineHeight: '1.5', fontWeight: 600 }}>{nextText}</div>
                    </div>
                )}
            </div>

            {talent.branchPoints < talent.required && (
                <div style={{ 
                    marginTop: '25px', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.1))', 
                    padding: '15px', borderRadius: '14px', border: '1px solid #ef4444', color: '#fff', 
                    fontSize: '14px', fontWeight: 900, textAlign: 'center', letterSpacing: '1.5px',
                    fontFamily: "'Cinzel', serif", boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}>
                    ⚠️ ТРЕБУЕТСЯ {talent.required} ОЧКОВ ВЕТКИ
                </div>
            )}
        </motion.div>
    );
};

const HeroTooltip = ({ hero, mousePos, rarityColors }: any) => {
    const { ownedHeroes, graphicsQuality } = useGameStore();
    const isLowGraphics = graphicsQuality === 'LOW';
    const isOwned = ownedHeroes.includes(hero.id);
    const color = rarityColors[hero.rarity];
    const tooltipWidth = 280; 
    const tooltipHeight = 240;

    let left = mousePos.x + 30;
    let top = mousePos.y + 10;

    if (left + tooltipWidth > 1880) left = mousePos.x - tooltipWidth - 30;
    if (top + tooltipHeight > 1040) top = mousePos.y - tooltipHeight - 10;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'absolute',
                left: left,
                top: top,
                width: `${tooltipWidth}px`,
                background: isLowGraphics ? 'rgba(5,3,2,1)' : 'rgba(10,6,3,0.98)',
                border: `2px solid ${color}`, 
                borderRadius: '16px', 
                padding: '20px',
                zIndex: 10000, 
                pointerEvents: 'none',
                boxShadow: isLowGraphics ? 'none' : `0 20px 60px rgba(0,0,0,0.9), 0 0 40px ${color}44`,
                backdropFilter: isLowGraphics ? 'none' : 'blur(16px)'
            }}
        >
            <div style={{ color: '#fff', fontSize: '20px', fontFamily: "'Cinzel', serif", marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{hero.name}</div>
            <div style={{ 
                color: color, 
                fontSize: '11px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '2px', 
                marginBottom: '15px', 
                background: `${color}33`, 
                padding: '4px 12px', 
                borderRadius: '6px', 
                display: 'inline-block'
            }}>
                {hero.rarity}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <TooltipStat icon="❤️" label="Здоровье" value={hero.baseStats.hp} color="#ef4444" />
                <TooltipStat icon="⚔️" label="Атака" value={hero.baseStats.attack} color="#f97316" />
                <TooltipStat icon="🛡️" label="Защита" value={hero.baseStats.defense} color="#3b82f6" />
            </div>

            {!isOwned && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#ff4444', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                    ТРЕБУЕТСЯ РАЗБЛОКИРОВКА
                </div>
            )}
        </motion.div>
    );
};

const TooltipStat = ({ label, value, color, icon }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span>{label}</span>
        </div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: '13px', textShadow: `0 0 10px ${color}44` }}>{value.toLocaleString()}</div>
    </div>
);

const PurchaseModal = ({ hero, onClose, rarityColors }: any) => {
    const { gold, crystals, unlockHero, spendGold, spendDiamonds } = useGameStore();
    const color = rarityColors[hero.rarity];
    
    const price = hero.unlockCost;
    const isGold = hero.unlockType === 'gold';
    const hasEnough = isGold ? gold >= price : crystals >= price;

    const handleConfirm = () => {
        if (hasEnough) {
            unlockHero(hero.id);
            if (isGold) spendGold(price);
            else spendDiamonds(price);
            audioService.playSFX('SFX_BUY');
            onClose();
        } else {
            audioService.playSFX('SFX_ERROR');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 20000,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '500px',
                    background: 'rgba(25,25,30,0.95)',
                    borderRadius: '24px',
                    border: `2px solid ${color}66`,
                    padding: '40px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px',
                    boxShadow: `0 30px 100px rgba(0,0,0,0.9), 0 0 50px ${color}22`
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: color, fontSize: '12px', fontWeight: 900, letterSpacing: '4px', marginBottom: '10px' }}>ПОДТВЕРЖДЕНИЕ ПОКУПКИ</div>
                    <div style={{ color: '#fff', fontSize: '32px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>{hero.name}</div>
                </div>

                <img src={hero.avatar} style={{ width: '220px', filter: `drop-shadow(0 0 30px ${color}44)` }} alt="" />

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '15px 30px', borderRadius: '16px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 900 }}>ЦЕНА:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={isGold ? AssetsMap.UI.ICON_GOLD_FULL : AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: '32px', height: '32px' }} alt="" />
                        <span style={{ fontSize: '32px', fontWeight: 900, color: hasEnough ? '#fff' : '#ff4444' }}>{price}</span>
                    </div>
                </div>

                {!hasEnough && (
                    <div style={{ color: '#ff4444', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>
                        ⚠️ НЕДОСТАТОЧНО СРЕДСТВ
                    </div>
                )}

                <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '18px 0', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px', fontWeight: 900, cursor: 'pointer', fontFamily: "'Cinzel', serif"
                        }}
                    >
                        ОТМЕНА
                    </motion.button>
                    <motion.button
                        whileHover={hasEnough ? { scale: 1.05, boxShadow: `0 0 20px ${color}44` } : {}}
                        whileTap={hasEnough ? { scale: 0.95 } : {}}
                        onClick={handleConfirm}
                        disabled={!hasEnough}
                        style={{
                            flex: 1, padding: '18px 0', borderRadius: '12px', 
                            background: hasEnough ? (isGold ? 'linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)' : 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)') : 'rgba(255,255,255,0.02)',
                            border: 'none', color: hasEnough ? '#fff' : 'rgba(255,255,255,0.1)',
                            fontSize: '12px', fontWeight: 900, cursor: hasEnough ? 'pointer' : 'default', fontFamily: "'Cinzel', serif",
                            boxShadow: hasEnough ? '0 10px 30px rgba(0,0,0,0.3)' : 'none'
                        }}
                    >
                        РАЗБЛОКИРОВАТЬ
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};



const HeroDetailsModal = ({ hero, isOwned, onClose, rarityColors, onBuy, onSelect }: any) => {
    const color = rarityColors[hero.rarity];
    const role = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000,
                backdropFilter: 'blur(10px)'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: '1200px', height: '800px', background: '#0a0a0a',
                    borderRadius: '40px', border: `2px solid ${color}`,
                    overflow: 'hidden', display: 'flex', position: 'relative',
                    boxShadow: `0 30px 100px rgba(0,0,0,1), 0 0 50px ${color}33`
                }}
            >
                {/* LEFT SIDE: HERO PREVIEW */}
                <div style={{ width: '45%', height: '100%', position: 'relative', background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)` }}>
                    <motion.img
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        src={hero.image}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '60px', zIndex: 2, position: 'relative' }}
                    />
                    <div style={{ position: 'absolute', bottom: '60px', left: '60px', zIndex: 3 }}>
                        <div style={{ background: role.bg, border: `1px solid ${role.color}`, borderRadius: '12px', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '24px' }}>{role.icon}</span>
                            <span style={{ color: role.color, fontSize: '18px', fontWeight: 900, letterSpacing: '2px' }}>{role.label}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: INFO */}
                <div style={{ width: '55%', height: '100%', padding: '60px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' }} className="custom-scrollbar">
                    <div>
                        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '64px', color: '#fff', margin: 0, fontFamily: "'Cinzel', serif", textShadow: `0 0 20px ${color}44` }}>{hero.name}</motion.h1>
                        <div style={{ color: color, fontSize: '20px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>{hero.rarity}</div>
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', lineHeight: '1.6', fontStyle: 'italic' }}>
                        "{hero.lore}"
                    </div>

                    {/* STATS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <DetailStat iconClass="sprite-stat stat-hp" label="ЗДОРОВЬЕ (MAX)" value={hero.baseStats.hp * 5} color="#ef4444" />
                        <DetailStat iconClass="sprite-stat stat-attack" label="АТАКА (MAX)" value={hero.baseStats.attack * 5} color="#f97316" />
                        <DetailStat iconClass="sprite-stat stat-defense" label="ЗАЩИТА (MAX)" value={hero.baseStats.defense * 5} color="#3b82f6" />
                        <DetailStat iconClass="sprite-stat stat-speed" label="СКОРОСТЬ" value={hero.baseStats.speed} color="#fcd34d" />
                        <DetailStat iconClass="sprite-stat stat-crit" label="КРИТ. ШАНС" value="15%" color="#a855f7" />
                        <DetailStat iconClass="sprite-stat stat-accuracy" label="УКЛОНЕНИЕ" value="12%" color="#4ade80" />
                        <DetailStat iconClass="sprite-stat stat-penetration" label="ПРОБИТИЕ" value="15" color="#fbbf24" />
                        <DetailStat iconClass="sprite-stat stat-lifesteal" label="ВАМПИРИЗМ" value="5%" color="#f43f5e" />
                    </div>

                    {/* SKILLS PLACEHOLDER */}
                    <div>
                        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 900, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>СПОСОБНОСТИ</div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <SkillItem icon="🔥" name="Мощный удар" desc="Наносит 200% урона по цели." />
                            <SkillItem icon="🛡️" name="Железная воля" desc="Повышает защиту на 50% на 2 хода." />
                            <SkillItem icon="🌀" name="Вихрь" desc="Атака по всем противникам." />
                        </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                flex: 1, height: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '15px', color: '#fff', fontSize: '20px', fontWeight: 900, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'
                            }}
                            onClick={() => alert('Режим тренировки скоро будет доступен!')}
                        >
                            <span>🎮</span> ПОПРОБОВАТЬ
                        </motion.button>

                        {isOwned ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    flex: 1, height: '70px', background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)', border: 'none',
                                    borderRadius: '15px', color: '#fff', fontSize: '20px', fontWeight: 900, cursor: 'pointer'
                                }}
                                onClick={onSelect}
                            >
                                ВЫБРАТЬ ГЕРОЯ
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    flex: 1, height: '70px', background: 'linear-gradient(180deg, #f1c40f 0%, #d4a017 100%)', border: 'none',
                                    borderRadius: '15px', color: '#fff', fontSize: '20px', fontWeight: 900, cursor: 'pointer'
                                }}
                                onClick={onBuy}
                            >
                                РАЗБЛОКИРОВАТЬ
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: '32px', cursor: 'pointer', width: '60px', height: '60px', borderRadius: '50%' }}
                >
                    ✕
                </button>
            </motion.div>
        </motion.div>
    );
};

const DetailStat = ({ iconClass, label, value, color }: any) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', borderLeft: `4px solid ${color}` }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 900, marginBottom: '5px' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className={iconClass} style={{ width: '80px', height: '80px', backgroundSize: '400% 200%' }} />
            <span style={{ color: '#fff', fontSize: '36px', fontWeight: 900 }}>{value}</span>
        </div>
    </div>
);

const SkillItem = ({ icon, name, desc }: any) => (
    <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {icon}
        </div>
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}>{name}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: '1.4' }}>{desc}</div>
    </div>
);


const ROLE_ICONS: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    TANK:     { icon: '🛡️', label: 'ТАНК',    color: '#60a5fa', bg: 'rgba(30,60,120,0.9)' },
    WARRIOR:  { icon: '⚔️', label: 'БОЕЦ',    color: '#fb923c', bg: 'rgba(120,50,10,0.9)' },
    ASSASSIN: { icon: '🗡️', label: 'УБИЙЦА',  color: '#c084fc', bg: 'rgba(80,20,120,0.9)' },
};

const HeroCard = ({ hero, isOwned, isActive, onClick, onBuyClick, color, onMouseEnter, onMouseMove, onMouseLeave }: any) => {
    const { gold, crystals, level, trophies } = useGameStore(s => ({
        gold: s.gold, crystals: s.crystals, level: s.level ?? 1, trophies: s.trophies ?? 0
    }));


    const role = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;
    const isGold = hero.unlockType === 'gold';
    const isDiamond = hero.unlockType === 'diamonds';
    const canAfford = isGold ? gold >= hero.unlockCost : isDiamond ? crystals >= hero.unlockCost : false;
    const showRedDot = !isOwned && (isGold || isDiamond) && canAfford;

    // Прогресс для достижений/уровней
    const achievementProgress = hero.unlockType === 'level'
        ? { current: Math.min(level, hero.unlockCost), max: hero.unlockCost }
        : hero.unlockType === 'achievement' && hero.unlockAchievement?.includes('50')
        ? { current: Math.min(trophies % 50, 50), max: 50 }
        : null;

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            onMouseEnter={onMouseEnter}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                height: '420px',
                background: `linear-gradient(180deg, ${color}22 0%, rgba(10,10,15,1) 60%, rgba(5,5,8,1) 100%)`,
                borderRadius: '24px',
                border: isActive ? `2px solid #f0c040` : `2px solid ${color}55`,
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? `0 0 30px ${color}44, inset 0 0 20px ${color}22` : `0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px ${color}11`,
                transition: 'all 0.3s ease'
            }}
            onClick={onClick}
        >
            {/* TOP ACCENT LINE */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.8 }} />

            {/* LEGENDARY SHIMMER */}
            {hero.rarity === 'LEGENDARY' && (
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)', pointerEvents: 'none', zIndex: 1 }}
                />
            )}

            {/* ACTIVE CROWN */}
            {isActive && (
                <div style={{ position: 'absolute', top: '-8px', fontSize: '20px', zIndex: 10, filter: 'drop-shadow(0 0 10px gold)' }}>👑</div>
            )}

            {/* ROLE BADGE — верхний левый угол, контрастный */}
            <div style={{
                position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                background: role.bg,
                border: `1px solid ${role.color}`,
                borderRadius: '8px', padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: `0 2px 8px rgba(0,0,0,0.7)`
            }}>
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{role.icon}</span>
                <span style={{ color: role.color, fontSize: '10px', fontWeight: 900, letterSpacing: '1.5px', textShadow: 'none' }}>{role.label}</span>
            </div>

            {/* RED DOT — можно купить прямо сейчас */}
            {showRedDot && (
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                        position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: '#ef4444', border: '2px solid #fff',
                        boxShadow: '0 0 8px rgba(239,68,68,0.8)'
                    }}
                />
            )}

            {/* HERO IMAGE */}
            <div style={{ width: '100%', height: '220px', position: 'relative', marginBottom: '15px', filter: isOwned ? 'none' : 'grayscale(1) brightness(0.4) sepia(0.3)' }}>
                <img src={hero.image} style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, position: 'relative' }} alt="" />
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`, opacity: isOwned ? 1 : 0.2 }} />
            </div>

            {/* NAME & RARITY — с тенью для читаемости на тёмном фоне */}
            <div style={{ textAlign: 'center', flex: 1, zIndex: 2, width: '100%' }}>
                <h3 style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    margin: '0 0 8px 0',
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: '1px',
                    textShadow: isOwned
                        ? `0 2px 8px rgba(0,0,0,0.9), 0 0 20px ${color}66`
                        : '0 2px 8px rgba(0,0,0,0.9)',
                    opacity: isOwned ? 1 : 0.55,
                    lineHeight: 1.2
                }}>{hero.name}</h3>
                <div style={{
                    color: isOwned ? color : 'rgba(200,200,200,0.5)',
                    fontSize: '10px', fontWeight: 900,
                    background: isOwned ? `${color}22` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isOwned ? color + '66' : 'rgba(255,255,255,0.1)'}`,
                    padding: '3px 14px', borderRadius: '4px', display: 'inline-block',
                    textTransform: 'uppercase', letterSpacing: '2px'
                }}>{hero.rarity}</div>
            </div>

            {/* BOTTOM ACTION */}
            <div style={{ width: '100%', zIndex: 3, marginTop: '8px' }}>
                {!isOwned ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        {(isGold || isDiamond) ? (
                            <motion.button
                                animate={canAfford ? {
                                    boxShadow: [
                                        `0 0 0px ${color}00`,
                                        `0 0 18px ${color}bb`,
                                        `0 0 0px ${color}00`
                                    ]
                                } : {}}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); onBuyClick(); }}
                                style={{
                                    width: '100%', height: '44px',
                                    background: !canAfford
                                        ? 'rgba(50,50,55,0.9)'
                                        : isGold
                                        ? 'linear-gradient(180deg, #f1c40f 0%, #d4a017 100%)'
                                        : 'linear-gradient(180deg, #b060f8 0%, #7c3aed 100%)',
                                    border: canAfford
                                        ? `2px solid ${isGold ? '#f1c40f' : '#c084fc'}`
                                        : '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    cursor: canAfford ? 'pointer' : 'default',
                                    fontFamily: "'Cinzel', serif",
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                    opacity: canAfford ? 1 : 0.5,
                                    letterSpacing: '0.5px',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                                }}
                            >
                                КУПИТЬ ЗА
                                <img src={isGold ? AssetsMap.UI.ICON_GOLD_FULL : AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: '20px', height: '20px' }} alt="" />
                                <span style={{ color: canAfford ? '#fff' : '#ff8888', fontWeight: 900 }}>{hero.unlockCost}</span>
                            </motion.button>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <div style={{
                                    width: '100%', padding: '9px 0', textAlign: 'center',
                                    background: 'rgba(0,0,0,0.7)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '10px',
                                    color: 'rgba(220,200,160,0.9)',
                                    fontSize: '11px', fontWeight: 900,
                                    fontFamily: "'Cinzel', serif", marginBottom: '6px'
                                }}>
                                    {hero.unlockType === 'level' ? `⭐ УРОВЕНЬ ${hero.unlockCost}` : `🏆 ${hero.unlockAchievement}`}
                                </div>
                                {achievementProgress && (
                                    <div style={{ width: '100%' }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', marginBottom: '4px',
                                            padding: '0 2px'
                                        }}>
                                            <span style={{ color: 'rgba(180,180,180,0.8)', fontSize: '10px', fontWeight: 700 }}>Прогресс</span>
                                            <span style={{
                                                color: '#f0c040', fontSize: '11px', fontWeight: 900,
                                                textShadow: '0 0 8px rgba(240,192,64,0.5)'
                                            }}>{achievementProgress.current} / {achievementProgress.max}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '7px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(achievementProgress.current / achievementProgress.max) * 100}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                style={{ height: '100%', background: `linear-gradient(90deg, ${color}dd, ${color}66)`, borderRadius: '4px', boxShadow: `0 0 10px ${color}88` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            width: '100%', padding: '13px',
                            background: isActive
                                ? 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                                : 'rgba(240,192,64,0.08)',
                            border: `2px solid ${isActive ? '#22c55e' : '#f0c040'}`,
                            borderRadius: '10px',
                            color: isActive ? '#fff' : '#f0c040',
                            fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                            letterSpacing: '1.5px', fontFamily: "'Cinzel', serif",
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                            boxShadow: isActive ? '0 4px 15px rgba(34,197,94,0.4)' : 'none'
                        }}
                    >
                        {isActive ? 'ВЫБРАН ✓' : 'ВЫБРАТЬ'}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};




const GearView = ({ hero, stats, detailSubTab, setDetailSubTab, handleItemClick, isEquipped, equippedIds = {}, activeDraggingId, unequipItem, addFloatingText, heroAction, setGlobalHoveredItem, setDevModal }: any) => {
    const { graphicsQuality } = useGameStore();
    const isLowGraphics = graphicsQuality === 'LOW';
    
    // stats теперь имеет структуру { base, total, weaponTexture }
    const currentStats = stats?.total || { hp: 0, attack: 0, defense: 0, speed: 0, critChance: 0, evasion: 0, resilience: 0, lifesteal: 0, penetration: 0, critDamage: 1.5 };
    const baseStats = stats?.base || currentStats;
    
    let diffs: any = { hp: 0, attack: 0, defense: 0 };
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

    const onInternalItemClick = (id: string) => {
        setLocalSelectedId(id);
        handleItemClick(id);
    };

    const handleUnequip = (itemId: string) => {
        const item = ITEMS_DATABASE[itemId] as any;
        if (item) {
            if (item.attackBonus) addFloatingText(`-${item.attackBonus} АТАКА`, '#ef4444');
            if (item.hpBonus) addFloatingText(`-${item.hpBonus} ЗДОРОВЬЕ`, '#ef4444');
            if (item.defenseBonus) addFloatingText(`-${item.defenseBonus} ЗАЩИТА`, '#ef4444');
            unequipItem(itemId);
            audioService.playSFX('SFX_CLICK');
        }
    };

    if (localSelectedId && !isEquipped(localSelectedId)) {
        const selItem = ITEMS_DATABASE[localSelectedId] as any;
        if (selItem) {
            const equippedId = equippedIds[selItem.subTab];
            const equippedItem = equippedId ? ITEMS_DATABASE[equippedId] as any : null;
            if (['WEAPONS', 'HELMETS', 'ARMOR', 'SHIELDS'].includes(selItem.subTab)) {
                diffs.hp = (selItem.hpBonus || 0) - (equippedItem?.hpBonus || 0);
                diffs.attack = (selItem.attackBonus || 0) - (equippedItem?.attackBonus || 0);
                diffs.defense = (selItem.defenseBonus || 0) - (equippedItem?.defenseBonus || 0);
            }
        }
    }

    return (
            <motion.div
                key="hero"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                style={{ position: 'absolute', inset: '20px 60px', display: 'flex', gap: '40px', alignItems: 'stretch' }}
            >
            <div style={{
                width: '380px', height: '100%', background: isLowGraphics ? 'rgba(20, 20, 25, 1)' : 'rgba(20, 20, 25, 0.7)', 
                backdropFilter: isLowGraphics ? 'none' : 'blur(15px)',
                borderRadius: '24px', border: '2px solid rgba(240, 192, 64, 0.3)',
                boxShadow: isLowGraphics ? 'none' : '0 0 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(240, 192, 64, 0.05)',
                display: 'flex', flexDirection: 'column', padding: '40px 30px', gap: '30px', zIndex: 5
            }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h3 style={{ color: '#c8a870', fontSize: '20px', fontFamily: "'Cinzel', serif", letterSpacing: '2px' }}>ЭКИПИРОВКА</h3>
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #f0c040, transparent)', marginTop: '10px' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '35px', alignItems: 'center', justifyContent: 'center' }}>
                    <EquipmentSlot id="HELMETS" label="ГОЛОВА" itemId={equippedIds.HELMETS} activeDraggingId={activeDraggingId} 
                        onMouseEnter={(e: any) => setGlobalHoveredItem(equippedIds.HELMETS, e.clientX, e.clientY)}
                        onMouseLeave={() => setGlobalHoveredItem(null, 0, 0)}
                        onMouseMove={(e: any) => setGlobalHoveredItem(equippedIds.HELMETS, e.clientX, e.clientY)}
                        onClick={() => { if(equippedIds.HELMETS) handleUnequip(equippedIds.HELMETS); }} 
                    />
                    <EquipmentSlot id="ARMOR" label="ТЕЛО" itemId={equippedIds.ARMOR} activeDraggingId={activeDraggingId} 
                        onMouseEnter={(e: any) => setGlobalHoveredItem(equippedIds.ARMOR, e.clientX, e.clientY)}
                        onMouseLeave={() => setGlobalHoveredItem(null, 0, 0)}
                        onMouseMove={(e: any) => setGlobalHoveredItem(equippedIds.ARMOR, e.clientX, e.clientY)}
                        onClick={() => { if(equippedIds.ARMOR) handleUnequip(equippedIds.ARMOR); }} 
                    />
                    <EquipmentSlot id="WEAPONS" label="ОРУЖИЕ" itemId={equippedIds.WEAPONS} activeDraggingId={activeDraggingId} 
                        onMouseEnter={(e: any) => setGlobalHoveredItem(equippedIds.WEAPONS, e.clientX, e.clientY)}
                        onMouseLeave={() => setGlobalHoveredItem(null, 0, 0)}
                        onMouseMove={(e: any) => setGlobalHoveredItem(equippedIds.WEAPONS, e.clientX, e.clientY)}
                        onClick={() => { if(equippedIds.WEAPONS) handleUnequip(equippedIds.WEAPONS); }} 
                    />
                    <EquipmentSlot id="SHIELDS" label="ЩИТ" itemId={equippedIds.SHIELDS} activeDraggingId={activeDraggingId} 
                        onMouseEnter={(e: any) => setGlobalHoveredItem(equippedIds.SHIELDS, e.clientX, e.clientY)}
                        onMouseLeave={() => setGlobalHoveredItem(null, 0, 0)}
                        onMouseMove={(e: any) => setGlobalHoveredItem(equippedIds.SHIELDS, e.clientX, e.clientY)}
                        onClick={() => { if(equippedIds.SHIELDS) handleUnequip(equippedIds.SHIELDS); }} 
                    />
                </div>
                <div style={{ textAlign: 'center', opacity: 0.6, fontSize: '11px', color: '#c8a870', letterSpacing: '2px', fontWeight: 900 }}>
                    КЛИКНИТЕ ПО ПРЕДМЕТУ В ИНВЕНТАРЕ
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', justifyContent: 'flex-end' }}>
                <div style={{ position: 'absolute', bottom: '-50px', width: '800px', height: '500px', backgroundImage: `url("${AssetsMap.UI.HERO_PEDESTAL}")`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 1 }} />
                <div style={{ zIndex: 2, marginBottom: '-60px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <HeroAnimator
                        heroId={hero.id} atlasUrl={AssetsMap.CHARACTERS.PANDA_ATLAS} action={heroAction as any}
                        weaponId={equippedIds.WEAPONS} helmId={equippedIds.HELMETS} armorId={equippedIds.ARMOR} shieldId={equippedIds.SHIELDS}
                        style={{ transform: 'scale(0.85)', transformOrigin: 'bottom' }}
                    />
                </div>
                <div style={{ textAlign: 'center', zIndex: 10, marginBottom: '40px', background: 'rgba(0,0,0,0.8)', padding: '18px 50px', borderRadius: '15px', border: '1px solid rgba(240,192,64,0.3)', backdropFilter: 'blur(10px)' }}>
                    <h2 style={{ color: '#f0c040', fontSize: '34px', margin: 0, fontFamily: "'Cinzel', serif" }}>{hero.name}</h2>
                    <p style={{ color: '#a040ff', margin: 0, fontWeight: 900, letterSpacing: '4px', fontSize: '12px' }}>МАСТЕР ДЗЕН</p>
                </div>
            </div>

            <div style={{ width: '550px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '5px', marginBottom: '20px', gap: '5px' }}>
                    {['STATS', 'INVENTORY', 'LORE'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => {
                                if (tab === 'LORE') {
                                    setDevModal({ isOpen: true, title: 'ЛЕГЕНДА ГЕРОЯ' });
                                } else {
                                    setDetailSubTab(tab as any);
                                }
                            }} 
                            style={{ flex: 1, padding: '10px', background: detailSubTab === tab ? '#f0c040' : 'transparent', color: detailSubTab === tab ? '#000' : '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px' }}
                        >
                            {tab === 'STATS' ? 'СТАТЫ' : tab === 'INVENTORY' ? 'ИНВЕНТАРЬ' : 'ЛЕГЕНДА'}
                        </button>
                    ))}
                </div>
                <div style={{ flex: 1, background: 'rgba(12, 8, 8, 0.98)', borderRadius: '25px', border: '2px solid rgba(240,192,64,0.4)', padding: '25px', overflow: 'visible', boxShadow: '0 20px 60px rgba(0,0,0,1)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {detailSubTab === 'INVENTORY' ? (
                        <InventoryPanel mode="COMPACT" onItemClick={onInternalItemClick} setGlobalHoveredItem={setGlobalHoveredItem} />
                    ) : detailSubTab === 'STATS' ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', paddingRight: '10px', paddingTop: '10px' }} className="custom-scrollbar">
                            <StatLine label="ЗДОРОВЬЕ" value={currentStats.hp} base={baseStats.hp} diff={diffs.hp} iconClass="sprite-stat stat-hp" color="#ef4444" max={10000} tooltip="Общий запас жизненных сил героя." placement="bottom" />
                            <StatLine label="АТАКА" value={currentStats.attack} base={baseStats.attack} diff={diffs.attack} iconClass="sprite-stat stat-attack" color="#f97316" max={2000} tooltip="Сила ваших ударов. Влияет на базовый урон." placement="bottom" />
                            <StatLine label="ЗАЩИТА" value={currentStats.defense} base={baseStats.defense} diff={diffs.defense} iconClass="sprite-stat stat-defense" color="#3b82f6" max={1000} tooltip="Снижает входящий урон." />
                            <StatLine label="СКОРОСТЬ" value={currentStats.speed} base={baseStats.speed} iconClass="sprite-stat stat-speed" color="#fcd34d" max={200} tooltip="Влияет на частоту ходов." />
                            <StatLine label="КРИТ. ШАНС" value={`${Math.round(currentStats.critChance)}%`} base={`${Math.round(baseStats.critChance)}%`} iconClass="sprite-stat stat-crit" color="#a855f7" max={100} tooltip="Вероятность нанести критический удар." />
                            <StatLine label="УКЛОНЕНИЕ" value={`${currentStats.evasion}%`} base={`${baseStats.evasion}%`} iconClass="sprite-stat stat-accuracy" color="#4ade80" max={100} tooltip="Шанс избежать атаки." />
                            <StatLine label="ПРОБИТИЕ" value={currentStats.penetration} base={baseStats.penetration} iconClass="sprite-stat stat-penetration" color="#fbbf24" max={500} tooltip="Игнорирование брони цели." />
                            <StatLine label="ВАМПИРИЗМ" value={`${currentStats.lifesteal}%`} base={`${baseStats.lifesteal}%`} iconClass="sprite-stat stat-lifesteal" color="#f43f5e" max={100} tooltip="Лечение от нанесенного урона." />
                            <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(240,192,64,0.05)', borderRadius: '15px', border: '1px dashed rgba(240,192,64,0.2)' }}>
                                <p style={{ color: '#c8a870', fontSize: '14px', margin: 0, textAlign: 'center', fontStyle: 'italic', lineHeight: '1.6' }}>{hero.description}</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '100%', overflowY: 'auto' }} className="custom-scrollbar">
                            <p style={{ color: '#fff', fontSize: '16px', lineHeight: '1.8', fontStyle: 'italic' }}>{hero.lore}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const EquipmentSlot = ({ id, label, itemId, activeDraggingId, onClick, onMouseEnter, onMouseLeave, onMouseMove }: any) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const itemData = itemId ? ITEMS_DATABASE[String(itemId)] as any : null;
    
    const rarityColors: any = { COMMON: '#a0a0a0', RARE: '#3b82f6', EPIC: '#a855f7', MYTHIC: '#ef4444', LEGENDARY: '#f59e0b' };
    const rarityMap: any = { COMMON: 'ОБЫЧНЫЙ', RARE: 'РЕДКИЙ', EPIC: 'ЭПИЧЕСКИЙ', MYTHIC: 'МИФИЧЕСКИЙ', LEGENDARY: 'ЛЕГЕНДАРНЫЙ' };

    const rarityColor = itemData ? (rarityColors[itemData.rarity] || '#f0c040') : '#f0c040';

    // DnD logic
    const draggingItemData = activeDraggingId ? ITEMS_DATABASE[String(activeDraggingId)] as any : null;
    const isCompatible = draggingItemData && draggingItemData.subTab === id;
    const isOtherSlotDragging = activeDraggingId && !isCompatible;

    return (
        <motion.div 
            whileHover={itemId ? { scale: 1.05, x: 10 } : {}}
            whileTap={itemId ? { scale: 0.95 } : {}}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            animate={isCompatible ? { 
                scale: [1, 1.05, 1],
                boxShadow: ['0 0 0px rgba(240,192,64,0)', '0 0 30px rgba(240,192,64,0.4)', '0 0 0px rgba(240,192,64,0)']
            } : {}}
            transition={isCompatible ? { duration: 1.5, repeat: Infinity } : {}}
            onClick={onClick}
            ref={setNodeRef} 
            style={{ 
                width: '220px', 
                height: '110px', 
                background: isOver ? 'rgba(240,192,64,0.2)' : 'rgba(0,0,0,0.6)', 
                borderRadius: '16px', 
                border: isOver ? `2px solid ${rarityColor}` : (isCompatible ? `2px solid rgba(240,192,64,0.6)` : '1px solid rgba(240,192,64,0.15)'), 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px', 
                gap: '15px', 
                position: 'relative', 
                transition: 'all 0.3s', 
                boxShadow: itemData ? `0 0 25px ${rarityColor}33` : 'inset 0 0 15px rgba(0,0,0,0.6)', 
                cursor: itemId ? 'pointer' : 'default',
                opacity: isOtherSlotDragging ? 0.4 : 1,
                filter: isOtherSlotDragging ? 'grayscale(0.5)' : 'none'
            }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: `2px solid ${itemData ? rarityColor : 'rgba(240,192,64,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {itemData ? (
                    itemData.spriteClass ? (
                        <div className={itemData.spriteClass} style={{ width: '90px', height: '90px' }} />
                    ) : (
                        <img src={itemData.image} style={{ width: '85%', height: '85%', objectFit: 'contain', zIndex: 2 }} alt="" />
                    )
                ) : (
                    <img 
                        src={
                            id === 'HELMETS' ? AssetsMap.UI.BLUEPRINT_HELMET :
                            id === 'ARMOR' ? AssetsMap.UI.BLUEPRINT_ARMOR :
                            id === 'WEAPONS' ? AssetsMap.UI.BLUEPRINT_WEAPON :
                            AssetsMap.UI.BLUEPRINT_SHIELD
                        }
                        style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: 0.15, filter: 'grayscale(1) brightness(2)' }} 
                        alt="" 
                    />
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                <div style={{ color: '#c8a870', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{label}</div>
                <div style={{ color: itemData ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>{itemData ? itemData.name.split(' ')[0] : 'ПУСТО'}</div>
                {itemData && (
                    <div style={{ color: rarityColor, fontSize: '9px', fontWeight: 900, marginTop: '4px' }}>{rarityMap[itemData.rarity] || itemData.rarity}</div>
                )}
            </div>
        </motion.div>
    );
};

const StatLine = ({ label, value, base, diff, iconClass, color, max, tooltip, placement = 'top' }: any) => {
    const [showTip, setShowTip] = useState(false);
    
    // Вычисляем бонус (разницу между итоговым и базовым значением)
    const getNum = (v: any) => parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;
    const valNum = getNum(value);
    const baseNum = getNum(base);
    const bonus = valNum - baseNum;

    return (
        <div onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)} style={{ position: 'relative', cursor: 'help' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 900 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className={iconClass} style={{ width: '64px', height: '64px', backgroundSize: '400% 200%', flexShrink: 0, imageRendering: 'auto' }} />
                    <span style={{ color: '#c8a870', letterSpacing: '2px', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase' }}>{label}</span>
                    {diff !== undefined && diff !== 0 && (
                        <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} style={{ color: diff > 0 ? '#22c55e' : '#ef4444', fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{diff > 0 ? `+${diff}` : diff}</motion.span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fff', fontSize: '18px' }}>{value.toLocaleString()}</span>
                    {bonus > 0 && (
                        <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 900 }}>+{bonus.toLocaleString()}</span>
                    )}
                </div>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (parseFloat(String(value).replace(/[^0-9.]/g, '')) / max) * 100)}%` }} style={{ height: '100%', background: color, boxShadow: `0 0 10px ${color}88` }} />
            </div>
            <AnimatePresence>
                {showTip && tooltip && (
                    <motion.div initial={{ opacity: 0, y: placement === 'top' ? 10 : -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'absolute', bottom: placement === 'top' ? '110%' : 'auto', top: placement === 'bottom' ? '110%' : 'auto', left: '0', right: '0', background: 'rgba(30, 30, 40, 0.95)', backdropFilter: 'blur(10px)', padding: '12px 15px', borderRadius: '10px', border: `1px solid ${color}66`, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', color: '#fff', fontSize: '12px', lineHeight: '1.5', zIndex: 1000, pointerEvents: 'none', fontWeight: 600 }}>
                        <div style={{ color: color, fontWeight: 900, marginBottom: '5px', fontSize: '13px' }}>{label}</div>
                        {tooltip}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
