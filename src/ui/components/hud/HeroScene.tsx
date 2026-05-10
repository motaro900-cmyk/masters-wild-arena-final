import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { AssetsMap } from '../../../configs/AssetsMap';
import { HeroAnimator } from './HeroAnimator';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';
import { InventoryPanel } from './InventoryPanel';
import { resolveAssetPath } from '../../../utils/assetPath';
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
        goToMainMenu,
        ownedHeroes,
        selectedHeroId,
        setSelectedHeroId,
        setHeroGalleryId,
        getCalculatedStats,
        inventory,
        equipWeapon,
        equipHelm,
        equipArmor,
        equipShield,
        equippedWeaponId,
        equippedHelmId,
        equippedArmorId,
        equippedShieldId,
        heroesInitialTab,
    } = useGameStore();

    // --- Scaling Logic for Fixed 1920x1080 Layout ---

    const [activeTab, setActiveTab] = useState<SceneTab>((heroesInitialTab as SceneTab) || 'LIST');
    const [detailSubTab, setDetailSubTab] = useState<'STATS' | 'LORE' | 'INVENTORY'>('INVENTORY');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const isEquipped = (itemId: string) => {
        return itemId === equippedWeaponId || itemId === equippedHelmId || itemId === equippedArmorId || itemId === equippedShieldId;
    };

    const handleItemClick = (itemId: string) => {
        const itemData = ITEMS_DATABASE[String(itemId)] as any;
        console.log(`[HeroScene] Selected item: ${itemId}`, itemData);

        if (!itemData) return;
        
        if (selectedItemId === itemId) {
            // Второе нажатие - экипировать
            if (itemData.subTab === 'WEAPONS') equipWeapon(itemId);
            else if (itemData.subTab === 'HELMETS') equipHelm(itemId);
            else if (itemData.subTab === 'ARMOR') equipArmor(itemId);
            else if (itemData.subTab === 'SHIELDS') equipShield(itemId);
        } else {
            // Первое нажатие - выбрать для сравнения
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
        if (!over) {
            console.log("[HeroScene] Drag ended over nothing");
            return;
        }

        const itemId = active.id;
        const slotType = over.id;
        const itemData = ITEMS_DATABASE[String(itemId)] as any;

        console.log(`[HeroScene] Drag drop: item=${itemId}, to slot=${slotType}`);

        if (itemData && (itemData.subTab === slotType || (slotType === 'WEAPONS' && itemData.subTab === 'WEAPONS'))) {
            handleItemClick(itemId);
        } else {
            console.warn(`[HeroScene] Invalid drop: ${itemData?.subTab} doesn't fit ${slotType}`);
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
            <div style={{
                width: '1920px', height: '1080px', background: '#000', position: 'absolute', top: 0, left: 0, overflow: 'hidden', zIndex: 1000
            }}>
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
                    {/* TOP NAVIGATION */}
                    <div style={{
                        width: '100%', height: '120px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                        display: 'flex', alignItems: 'center', padding: '0 80px', gap: '40px', zIndex: 100
                    }}>
                        <TabButton active={activeTab === 'LIST'} onClick={() => setActiveTab('LIST')} label="ВСЕ ГЕРОИ" icon="👥" />
                        <TabButton active={activeTab === 'HERO'} onClick={() => setActiveTab('HERO')} label="СНАРЯЖЕНИЕ" icon="⚔️" />
                        <TabButton active={activeTab === 'TALENTS'} onClick={() => setActiveTab('TALENTS')} label="ТАЛАНТЫ" icon="🌟" />

                        <div style={{ flex: 1 }} />

                        <button onClick={goToMainMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={AssetsMap.UI.ICON_EXIT} style={{ width: '45px' }} alt="" />
                            <span style={{ color: '#c8a870', fontSize: '20px', fontWeight: 900, fontFamily: "'Cinzel', serif" }}>ВЫХОД</span>
                        </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            {activeTab === 'LIST' ? (
                                <HeroList rarityColors={rarityColors} ownedHeroes={ownedHeroes} selectedHeroId={selectedHeroId} setHeroGalleryId={setHeroGalleryId} setSelectedHeroId={setSelectedHeroId} setActiveTab={setActiveTab} />
                            ) : activeTab === 'TALENTS' ? (
                                <TalentsView hero={selectedHero} />
                            ) : (
                                <GearView 
                                    hero={selectedHero} 
                                    stats={stats} 
                                    detailSubTab={detailSubTab} 
                                    setDetailSubTab={setDetailSubTab} 
                                    handleItemClick={handleItemClick} 
                                    isEquipped={isEquipped} 
                                    equippedIds={{
                                        HELMETS: equippedHelmId,
                                        ARMOR: equippedArmorId,
                                        WEAPONS: equippedWeaponId,
                                        SHIELDS: equippedShieldId
                                    }}
                                    activeDraggingId={activeId}
                                />
                            )}
                        </AnimatePresence>
                    </div>
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
                        <img
                            src={activeItemData.image}
                            style={{
                                width: '80%', height: '80%', objectFit: 'contain',
                                filter: (activeItemData.id === 'pan' || activeItemData.id === 'stick' || activeItemData.id.toString().includes('starter')) ? 'url(#remove-white)' : 'none'
                            }}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// --- Sub-components for cleaner structure ---

const HeroList = ({ rarityColors, ownedHeroes, selectedHeroId, setHeroGalleryId, setSelectedHeroId, setActiveTab }: any) => (
    <motion.div
        key="list"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        style={{ position: 'absolute', inset: '40px 80px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}
    >
        {HEROES_DB.map((hero: any) => (
            <HeroCard
                key={hero.id}
                hero={hero}
                isOwned={ownedHeroes.includes(hero.id)}
                isActive={selectedHeroId === hero.id}
                onClick={() => {
                    setHeroGalleryId(hero.id);
                    if (ownedHeroes.includes(hero.id)) setSelectedHeroId(hero.id);
                    setActiveTab('HERO');
                }}
                color={rarityColors[hero.rarity]}
            />
        ))}
    </motion.div>
);

const GearView = ({ hero, stats, detailSubTab, setDetailSubTab, handleItemClick, isEquipped, equippedIds, activeDraggingId }: any) => {
    const currentStats = stats || { hp: 0, attack: 0, defense: 0 };
    let diffs: any = { hp: 0, attack: 0, defense: 0 };
    
    // We'll calculate diffs here if an item is selected
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

    const onInternalItemClick = (id: string) => {
        setLocalSelectedId(id);
        handleItemClick(id);
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
            style={{ position: 'absolute', inset: '40px 80px', display: 'flex', gap: '50px', alignItems: 'stretch' }}
        >
            {/* LEFT PANEL: CODE-BASED GEAR RACK */}
            <div style={{ 
                width: '320px', 
                height: '800px', 
                background: 'rgba(20, 20, 25, 0.7)',
                backdropFilter: 'blur(15px)',
                borderRadius: '24px',
                border: '2px solid rgba(240, 192, 64, 0.3)',
                boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(240, 192, 64, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                padding: '30px 20px',
                gap: '20px',
                zIndex: 5
            }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h3 style={{ color: '#c8a870', fontSize: '20px', fontFamily: "'Cinzel', serif", letterSpacing: '2px' }}>АРСЕНАЛ</h3>
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #f0c040, transparent)', marginTop: '10px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center' }}>
                    <EquipmentSlot id="HELMETS" label="ГОЛОВА" icon="/equipment_slot_icons_premium_1778246754633.png" itemId={equippedIds.HELMETS} activeDraggingId={activeDraggingId} />
                    <EquipmentSlot id="ARMOR" label="ТЕЛО" icon="/equipment_slot_icons_premium_1778246754633.png" itemId={equippedIds.ARMOR} activeDraggingId={activeDraggingId} />
                    <EquipmentSlot id="WEAPONS" label="ОРУЖИЕ" icon="/equipment_slot_icons_premium_1778246754633.png" itemId={equippedIds.WEAPONS} activeDraggingId={activeDraggingId} />
                    <EquipmentSlot id="SHIELDS" label="ЩИТ" icon="/equipment_slot_icons_premium_1778246754633.png" itemId={equippedIds.SHIELDS} activeDraggingId={activeDraggingId} />
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', opacity: 0.4 }}>
                   <div style={{ fontSize: '11px', color: '#c8a870', fontWeight: 900 }}>ПЕРЕТАЩИТЕ ВЕЩИ СЮДА</div>
                </div>
            </div>

            {/* CENTER: CHARACTER */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', justifyContent: 'flex-end' }}>
                <div style={{ position: 'absolute', bottom: '-50px', width: '800px', height: '500px', backgroundImage: `url("${AssetsMap.UI.HERO_PEDESTAL}")`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 1 }} />
                <div style={{ zIndex: 2, marginBottom: '-60px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <HeroAnimator
                        heroId={hero.id}
                        atlasUrl={AssetsMap.CHARACTERS.PANDA_ATLAS}
                        action="IDLE"
                        weaponId={equippedIds.WEAPONS}
                        helmId={equippedIds.HELMETS}
                        armorId={equippedIds.ARMOR}
                        shieldId={equippedIds.SHIELDS}
                        style={{ transform: 'scale(0.85)', transformOrigin: 'bottom' }}
                    />
                </div>
                <div style={{ textAlign: 'center', zIndex: 10, marginBottom: '40px', background: 'rgba(0,0,0,0.8)', padding: '18px 50px', borderRadius: '15px', border: '1px solid rgba(240,192,64,0.3)', backdropFilter: 'blur(10px)' }}>
                    <h2 style={{ color: '#f0c040', fontSize: '34px', margin: 0, fontFamily: "'Cinzel', serif" }}>{hero.name}</h2>
                    <p style={{ color: '#a040ff', margin: 0, fontWeight: 900, letterSpacing: '4px', fontSize: '12px' }}>МАСТЕР ДЗЕН</p>
                </div>
            </div>

            {/* RIGHT PANEL: STATS / INVENTORY */}
            <div style={{ width: '450px', display: 'flex', flexDirection: 'column' }}>

                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '5px', marginBottom: '20px', gap: '5px' }}>
                    {['STATS', 'INVENTORY', 'LORE'].map(tab => (
                        <button key={tab} onClick={() => setDetailSubTab(tab as any)} style={{ flex: 1, padding: '10px', background: detailSubTab === tab ? '#f0c040' : 'transparent', color: detailSubTab === tab ? '#000' : '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px' }}>
                            {tab === 'STATS' ? 'СТАТЫ' : tab === 'INVENTORY' ? 'ИНВЕНТАРЬ' : 'ЛЕГЕНДА'}
                        </button>
                    ))}
                </div>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.85)', borderRadius: '25px', border: '2px solid rgba(240,192,64,0.4)', padding: '30px', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,1)' }}>
                    {detailSubTab === 'INVENTORY' ? (
                        <InventoryPanel mode="COMPACT" onItemClick={onInternalItemClick} isEquipped={isEquipped} />
                    ) : detailSubTab === 'STATS' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '15px', paddingTop: '20px' }} className="custom-scrollbar">
                            <StatLine label="ЗДОРОВЬЕ" value={currentStats.hp} diff={diffs.hp} icon="❤️" color="#ef4444" max={10000} tooltip="Общий запас жизненных сил героя. Если упадет до 0, бой будет проигран." placement="bottom" />
                            <StatLine label="АТАКА" value={currentStats.attack} diff={diffs.attack} icon="⚔️" color="#f97316" max={2000} tooltip="Сила ваших ударов. Влияет на базовый урон по противнику." placement="bottom" />
                            <StatLine label="ЗАЩИТА" value={currentStats.defense} diff={diffs.defense} icon="🛡️" color="#3b82f6" max={1000} tooltip="Снижает входящий урон. Чем выше защита, тем меньше вы теряете здоровья." />
                            <StatLine label="СКОРОСТЬ" value={currentStats.speed} icon="⚡" color="#fcd34d" max={200} tooltip="Влияет на частоту ходов. Высокая скорость позволяет бить чаще противника." />
                            <StatLine label="КРИТ. ШАНС" value={`${Math.round(currentStats.critChance)}%`} icon="🎯" color="#a855f7" max={100} tooltip="Вероятность нанести сокрушительный критический удар." />
                            
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', margin: '15px 0' }} />
                            
                            <StatLine label="УКЛОНЕНИЕ" value={`${currentStats.evasion}%`} icon="💨" color="#4ade80" max={100} tooltip="Шанс полностью избежать любой атаки противника." />
                            <StatLine label="СТОЙКОСТЬ" value={currentStats.resilience} icon="💎" color="#94a3b8" max={100} tooltip="Снижает шанс получить критический урон и длительность негативных эффектов." />
                            <StatLine label="ВАМПИРИЗМ" value={`${currentStats.lifesteal}%`} icon="🩸" color="#f43f5e" max={100} tooltip="Процент от нанесенного урона, который мгновенно лечит вашего героя." />
                            <StatLine label="ПРОБИТИЕ" value={currentStats.penetration} icon="🗡️" color="#fbbf24" max={500} tooltip="Позволяет вашим атакам игнорировать часть брони цели." />
                            <StatLine label="КРИТ. УРОН" value={`x${currentStats.critDamage?.toFixed(1)}`} icon="💥" color="#ef4444" max={5} tooltip="Множитель, на который умножается урон при критическом попадании." />

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

const EquipmentSlot = ({ id, label, icon, itemId, activeDraggingId }: any) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    const itemData = itemId ? ITEMS_DATABASE[String(itemId)] as any : null;
    const isTarget = activeDraggingId && ITEMS_DATABASE[String(activeDraggingId)]?.subTab === id;
    const rarityColor = itemData ? (({ COMMON: '#a0a0a0', RARE: '#3b82f6', EPIC: '#a855f7', MYTHIC: '#ef4444', LEGENDARY: '#f59e0b' } as any)[itemData.rarity]) : '#f0c040';

    return (
        <div
            ref={setNodeRef}
            style={{
                width: '180px', height: '110px',
                background: isOver ? 'rgba(240,192,64,0.15)' : 'rgba(0,0,0,0.5)',
                borderRadius: '16px',
                border: isOver ? `2px solid ${rarityColor}` : (isTarget ? `2px dashed ${rarityColor}88` : '1px solid rgba(240,192,64,0.2)'),
                display: 'flex', alignItems: 'center', 
                padding: '10px',
                gap: '15px',
                position: 'relative', transition: 'all 0.3s',
                boxShadow: itemData ? `0 0 20px ${rarityColor}22` : 'inset 0 0 10px rgba(0,0,0,0.5)',
                cursor: 'pointer'
            }}
        >
            <div style={{ 
                width: '80px', height: '80px', 
                background: 'rgba(0,0,0,0.4)', 
                borderRadius: '12px', 
                border: `1px solid ${itemData ? rarityColor : 'rgba(240,192,64,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {itemData ? (
                    <img src={itemData.image} style={{ width: '80%', height: '80%', objectFit: 'contain', zIndex: 2 }} alt="" />
                ) : (
                    <img 
                        src={
                            id === 'HELMETS' ? resolveAssetPath('/blueprint_helmet.png') :
                            id === 'ARMOR' ? resolveAssetPath('/blueprint_armor.png') :
                            id === 'WEAPONS' ? resolveAssetPath('/blueprint_weapon.png') :
                            resolveAssetPath('/blueprint_shield.png')
                        } 
                        style={{ 
                            width: '80%', 
                            height: '80%', 
                            objectFit: 'contain', 
                            opacity: 0.6, 
                            filter: 'drop-shadow(0 0 5px rgba(240, 192, 64, 0.4))',
                            mixBlendMode: 'screen'
                        }} 
                        alt="" 
                    />
                )}
                {itemData && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${rarityColor}33 0%, transparent 70%)`, pointerEvents: 'none' }} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ color: '#c8a870', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>{label}</div>
                <div style={{ color: itemData ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
                    {itemData ? itemData.name.split(' ')[0] : 'ПУСТО'}
                </div>
            </div>

            {isOver && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ position: 'absolute', inset: -5, border: `2px solid ${rarityColor}`, borderRadius: '20px', pointerEvents: 'none' }} 
                />
            )}
        </div>
    );
};

const TalentsView = ({ hero }: any) => (
    <motion.div
        key="talents"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
        style={{ position: 'absolute', inset: '40px 80px', display: 'flex', flexDirection: 'column' }}
    >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#f0c040', fontSize: '32px', fontFamily: "'Cinzel', serif" }}>ДРЕВО ТАЛАНТОВ: {hero.name}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', flex: 1 }}>
            <TalentBranch title="ПУТЬ СИЛЫ" icon="🔥" talents={[{ name: 'Удар грома', level: 3, max: 5 }]} />
            <TalentBranch title="ПУТЬ СТОЙКОСТИ" icon="🛡️" talents={[{ name: 'Каменная кожа', level: 5, max: 5 }]} />
            <TalentBranch title="ПУТЬ МАСТЕРСТВА" icon="🌀" talents={[{ name: 'Быстрые лапы', level: 1, max: 5 }]} />
        </div>
    </motion.div>
);

// --- Generic UI Helpers ---

const TabButton = ({ active, onClick, label, icon }: any) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: 900, color: active ? '#fff' : '#c8a870' }}>{label}</span>
        {active && <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: '-15px', left: 0, right: 0, height: '3px', background: '#f0c040', boxShadow: '0 0 10px #f0c040' }} />}
    </button>
);

const HeroCard = ({ hero, isOwned, isActive, onClick, color }: any) => (
    <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        onClick={onClick}
        style={{
            height: '420px', background: 'rgba(0,0,0,0.8)', borderRadius: '20px', border: `2px solid ${isActive ? '#f0c040' : 'rgba(255,255,255,0.1)'}`,
            padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
            filter: isOwned ? 'none' : 'grayscale(1) brightness(0.4)'
        }}
    >
        <img src={hero.image} style={{ width: '100%', height: '250px', objectFit: 'contain' }} alt="" />
        <h3 style={{ color: '#fff', fontSize: '22px', margin: '15px 0', fontFamily: "'Cinzel', serif" }}>{hero.name}</h3>
        <div style={{ color, fontSize: '12px', fontWeight: 900, border: `1px solid ${color}`, padding: '4px 12px', borderRadius: '5px' }}>{hero.rarity}</div>
        {isActive && <div style={{ marginTop: 'auto', color: '#4ade80', fontSize: '12px', fontWeight: 900 }}>АКТИВЕН ✅</div>}
    </motion.div>
);

const StatLine = ({ label, value, diff, icon, color, max, tooltip, placement = 'top' }: any) => {
    const [showTip, setShowTip] = useState(false);

    return (
        <div 
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            style={{ position: 'relative', cursor: 'help' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 900 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                    <span style={{ color: '#c8a870', letterSpacing: '1px' }}>{label}</span>
                    {diff !== undefined && diff !== 0 && (
                        <motion.span 
                            initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                            style={{ color: diff > 0 ? '#22c55e' : '#ef4444', fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}
                        >
                            {diff > 0 ? `+${diff}` : diff}
                        </motion.span>
                    )}
                </div>
                <span style={{ color: '#fff', fontSize: '18px' }}>{value.toLocaleString()}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (parseFloat(String(value).replace(/[^0-9.]/g, '')) / max) * 100)}%` }} style={{ height: '100%', background: color, boxShadow: `0 0 10px ${color}88` }} />
            </div>

            <AnimatePresence>
                {showTip && tooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: placement === 'top' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            position: 'absolute', 
                            bottom: placement === 'top' ? '110%' : 'auto',
                            top: placement === 'bottom' ? '110%' : 'auto',
                            left: '0', right: '0',
                            background: 'rgba(30, 30, 40, 0.95)',
                            backdropFilter: 'blur(10px)',
                            padding: '12px 15px',
                            borderRadius: '10px',
                            border: `1px solid ${color}66`,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            color: '#fff',
                            fontSize: '12px',
                            lineHeight: '1.5',
                            zIndex: 1000,
                            pointerEvents: 'none',
                            fontWeight: 600
                        }}
                    >
                        <div style={{ color: color, fontWeight: 900, marginBottom: '5px', fontSize: '13px' }}>{label}</div>
                        {tooltip}
                        {/* Little triangle arrow */}
                        <div style={{ 
                            position: 'absolute', 
                            bottom: placement === 'top' ? '-6px' : 'auto',
                            top: placement === 'bottom' ? '-6px' : 'auto',
                            left: '20px', width: '12px', height: '12px', 
                            background: 'rgba(30, 30, 40, 0.95)', 
                            transform: 'rotate(45deg)', 
                            borderBottom: placement === 'top' ? `1px solid ${color}66` : 'none',
                            borderRight: placement === 'top' ? `1px solid ${color}66` : 'none',
                            borderTop: placement === 'bottom' ? `1px solid ${color}66` : 'none',
                            borderLeft: placement === 'bottom' ? `1px solid ${color}66` : 'none',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TalentBranch = ({ title, icon, talents }: any) => (
    <div style={{ background: 'rgba(0,0,0,0.85)', borderRadius: '20px', border: '2px solid rgba(240,192,64,0.3)', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(240,192,64,0.2)', paddingBottom: '15px' }}>
            <span style={{ fontSize: '28px' }}>{icon}</span>
            <h3 style={{ color: '#f0c040', fontSize: '18px', margin: 0, fontFamily: "'Cinzel', serif" }}>{title}</h3>
        </div>
        {talents.map((t: any, i: number) => (
            <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fff', fontWeight: 800, fontSize: '13px' }}>
                    <span>{t.name}</span>
                    <span style={{ color: '#f0c040' }}>{t.level}/{t.max}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
            </div>
        ))}
    </div>
);
