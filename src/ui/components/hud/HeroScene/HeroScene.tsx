import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext } from '@dnd-kit/core';

import { useGameStore } from '../../../../store/useGameStore';
import { HEROES_DB } from '../../../../configs/HeroesConfig';
import { AssetsMap } from '../../../../configs/AssetsMap';

import { SceneTab } from './types';
import { rarityColors } from './constants/roleIcons';
import { useHeroActions } from './hooks/useHeroActions';
import { useHeroDnd } from './hooks/useHeroDnd';

import { HeroSceneSidebar } from './components/HeroSceneSidebar';
import { HeroList } from './components/HeroList';
import { GearView } from './components/Equipment/GearView';
import { TalentsView } from './components/Talents/TalentsView';

import { HeroDetailsModal } from './components/HeroDetails/HeroDetailsModal';
import { PurchaseModal } from './components/HeroDetails/PurchaseModal';
import { ItemTooltipPortal } from './components/shared/ItemTooltipPortal';
import { FloatingTextsLayer } from './components/shared/FloatingTextsLayer';
import { DragOverlayLayer } from './components/shared/DragOverlayLayer';
import { UnderDevelopmentModal } from '../SharedUI';
import { ResourceBar } from '../ResourceBar';

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
        setHeroGalleryId,
        ownedHeroes,
        goToMainMenu,
        goToShop,
    } = useGameStore();

    // -- UI State --
    const [activeTab, setActiveTab] = useState<SceneTab>((heroesInitialTab as SceneTab) || 'LIST');
    const [detailSubTab, setDetailSubTab] = useState<'STATS' | 'LORE' | 'INVENTORY'>('INVENTORY');
    const [activeFilter, setActiveFilter] = useState<string>('ВСЕ');
    const [viewingHero, setViewingHero] = useState<any>(null);
    const [confirmingHero, setConfirmingHero] = useState<any>(null);
    const [globalHoveredItem, setGlobalHoveredItem] = useState<{ id: string; x: number; y: number } | null>(null);
    const [devModal, setDevModal] = useState({ isOpen: false, title: '' });

    // -- Sync Gallery Hero with selected Hero --
    useEffect(() => {
        if (activeTab === 'LIST') {
            setHeroGalleryId(selectedHeroId || 'panda');
        }
    }, [activeTab, selectedHeroId, setHeroGalleryId]);

    // -- Logic Hooks --
    const { handleItemClick, isEquipped, addFloatingText, floatingTexts, triggerVictory, heroAction } = useHeroActions(
        selectedHeroId || 'panda',
        heroEquipment,
        equipItem,
        unequipItem,
    );

    const { sensors, handleDragStart, handleDragEnd, activeId, activeItemData, collisionDetection } = useHeroDnd(
        selectedHeroId || 'panda',
        heroEquipment,
        inventory,
        equipItem,
        addFloatingText,
        triggerVictory,
    );

    // -- Sync Tab from Store --
    useEffect(() => {
        if (heroesInitialTab) {
            setTimeout(() => setActiveTab(heroesInitialTab as SceneTab), 0);
        }
    }, [heroesInitialTab]);

    // -- Guard against direct navigation to locked hero --
    useEffect(() => {
        if (activeTab !== 'LIST' && !ownedHeroes.includes(selectedHeroId || 'panda')) {
            setTimeout(() => setActiveTab('LIST'), 0);
        }
    }, [activeTab, selectedHeroId, ownedHeroes]);

    // -- Data --
    const selectedHero = HEROES_DB.find((h) => h.id === selectedHeroId) || HEROES_DB[0];
    const stats = getCalculatedStats(selectedHero.id);

    const isMobile = useGameStore((state) => state.isMobile);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                id="hero-scene-root"
                style={{
                    width: isMobile ? '100%' : '1920px',
                    height: isMobile ? '100%' : '1080px',
                    background: '#000',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                }}
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        width: isMobile ? '100%' : '1920px',
                        height: isMobile ? '100%' : '1080px',
                        backgroundImage: `url("${AssetsMap.BACKGROUNDS.HEROES_HALL}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(10, 8, 5, 0.58)',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />

                    {/* ══════════════════════════════════════════════════════
                         TOP HEADER BAR — full width, like in the reference
                         Shows: ← ГЕРОИ (left)  +  Energy / Gold / Crystals (right)
                        ══════════════════════════════════════════════════════ */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            flexShrink: 0,
                            height: '66px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 28px 0 16px',
                            background: 'linear-gradient(180deg, rgba(10,7,4,0.97) 0%, rgba(10,7,4,0.85) 100%)',
                            borderBottom: '1px solid rgba(240,192,64,0.18)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {/* Left: back arrow + ГЕРОИ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <motion.button
                                whileHover={{ x: -3, scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={goToMainMenu}
                                style={{
                                    background: 'rgba(240,192,64,0.1)',
                                    border: '1px solid rgba(240,192,64,0.3)',
                                    borderRadius: '8px',
                                    width: '38px',
                                    height: '38px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M10 3L5 8l5 5"
                                        stroke="#f0c040"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </motion.button>
                            <span
                                style={{
                                    color: '#fff',
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    letterSpacing: '3px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                ГЕРОИ
                            </span>
                        </div>

                        {/* Right: Resource bars */}
                        <ResourceBar
                            onOpenShop={(tab) => {
                                if (tab === 'GOLD' || tab === 'GEMS' || tab === 'ENERGY') {
                                    goToShop('BANK', tab);
                                } else {
                                    goToShop('ALCHEMY');
                                }
                            }}
                        />
                    </div>

                    {/* ══════════════════════════════════════════════════════
                         MAIN BODY: Sidebar (left) + Content (right)
                        ══════════════════════════════════════════════════════ */}
                    <div
                        style={{
                            flex: 1,
                            height: 0 /* height:0 + flex:1 = correct flex fill in column parent */,
                            display: 'flex',
                            flexDirection: 'row',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        <HeroSceneSidebar activeTab={activeTab} setActiveTab={setActiveTab} onBack={goToMainMenu} />

                        <div
                            style={{
                                flex: 1,
                                position: 'relative',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'rgba(15, 12, 10, 0.6)',
                                backdropFilter: 'blur(2px)',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                                overflow: 'hidden',
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {activeTab === 'LIST' ? (
                                    <HeroList
                                        rarityColors={rarityColors}
                                        ownedHeroes={ownedHeroes}
                                        selectedHeroId={selectedHeroId}
                                        activeFilter={activeFilter}
                                        setActiveFilter={setActiveFilter}
                                        onBuyClick={(h: any) => {
                                            setConfirmingHero(h);
                                        }}
                                        onHeroClick={(h: any) => {
                                            setHeroGalleryId(h.id);
                                        }}
                                    />
                                ) : activeTab === 'HERO' ? (
                                    <GearView
                                        hero={selectedHero}
                                        stats={stats}
                                        detailSubTab={detailSubTab}
                                        setDetailSubTab={setDetailSubTab}
                                        handleItemClick={handleItemClick}
                                        isEquipped={isEquipped}
                                        equippedIds={(heroEquipment || {})[selectedHeroId || 'panda'] || {}}
                                        activeDraggingId={activeId}
                                        unequipItem={unequipItem}
                                        addFloatingText={addFloatingText}
                                        heroAction={heroAction}
                                        setGlobalHoveredItem={(id: string | null, x: number, y: number) =>
                                            setGlobalHoveredItem(id ? { id, x, y } : null)
                                        }
                                        setDevModal={setDevModal}
                                    />
                                ) : activeTab === 'TALENTS' ? (
                                    <TalentsView hero={selectedHero} />
                                ) : (
                                    <div style={{ color: '#fff' }}>Таланты в разработке...</div>
                                )}
                            </AnimatePresence>

                            {/* [TUTORIAL] Simple hint for first-time users */}
                            {activeTab === 'LIST' && ownedHeroes.length === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        position: 'absolute',
                                        top: '25px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(20, 15, 10, 0.9)',
                                        border: '1px solid rgba(240, 192, 64, 0.5)',
                                        borderRadius: '8px',
                                        padding: '6px 20px',
                                        color: '#f0c040',
                                        fontFamily: "'Cinzel', 'Philosopher', serif",
                                        fontSize: '14px',
                                        zIndex: 2000,
                                        textAlign: 'center',
                                        pointerEvents: 'none',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    👇 ВЫБЕРИТЕ ГЕРОЯ, ЧТОБЫ УПРАВЛЯТЬ ЕГО СНАРЯЖЕНИЕМ
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
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

            <DragOverlayLayer activeId={activeId} activeItemData={activeItemData} />

            <FloatingTextsLayer texts={floatingTexts} />

            <ItemTooltipPortal
                hoveredItem={globalHoveredItem}
                heroEquipment={heroEquipment}
                selectedHeroId={selectedHeroId || 'panda'}
            />

            <UnderDevelopmentModal
                isOpen={devModal.isOpen}
                title={devModal.title}
                onClose={() => setDevModal({ ...devModal, isOpen: false })}
            />
        </DndContext>
    );
};
