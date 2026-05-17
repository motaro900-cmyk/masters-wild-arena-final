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

import { HeroSceneHeader } from './components/HeroSceneHeader';
import { HeroList } from './components/HeroList';
import { GearView } from './components/Equipment/GearView';
import { TalentsView } from './components/Talents/TalentsView';
import { HeroTooltip } from './components/HeroList/HeroTooltip';
import { HeroDetailsModal } from './components/HeroDetails/HeroDetailsModal';
import { PurchaseModal } from './components/HeroDetails/PurchaseModal';
import { ItemTooltipPortal } from './components/shared/ItemTooltipPortal';
import { FloatingTextsLayer } from './components/shared/FloatingTextsLayer';
import { DragOverlayLayer } from './components/shared/DragOverlayLayer';
import { UnderDevelopmentModal } from '../SharedUI';

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

    // -- UI State --
    const [activeTab, setActiveTab] = useState<SceneTab>((heroesInitialTab as SceneTab) || 'LIST');
    const [detailSubTab, setDetailSubTab] = useState<'STATS' | 'LORE' | 'INVENTORY'>('INVENTORY');
    const [activeFilter, setActiveFilter] = useState<string>('ВСЕ');
    const [tooltipHero, setTooltipHero] = useState<any>(null);
    const [viewingHero, setViewingHero] = useState<any>(null);
    const [confirmingHero, setConfirmingHero] = useState<any>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [globalHoveredItem, setGlobalHoveredItem] = useState<{ id: string; x: number; y: number } | null>(null);
    const [devModal, setDevModal] = useState({ isOpen: false, title: '' });

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

    // -- Clear Tooltip on Tab Change --
    useEffect(() => {
        setTimeout(() => setTooltipHero(null), 0);
    }, [activeTab]);

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
                            background: 'rgba(0,0,0,0.3)',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                    <HeroSceneHeader activeTab={activeTab} setActiveTab={setActiveTab} />

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
                                    onHeroClick={(h: any) => {
                                        setTooltipHero(null); // КРИТИЧНО: Скрываем тултип перед переходом
                                        setSelectedHeroId(h.id);
                                        setActiveTab('HERO');
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
                                    fontFamily: "'Cinzel', serif",
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

                    <AnimatePresence>
                        {tooltipHero && (
                            <HeroTooltip hero={tooltipHero} mousePos={mousePos} rarityColors={rarityColors} />
                        )}

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

            {/* --- КНОПКА ВЫХОДА (СПРАВА ВНИЗУ) --- */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={goToMainMenu}
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: '40px',
                    background: 'rgba(20, 15, 10, 0.8)',
                    border: '2px solid #f0c040',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    zIndex: 2000,
                    boxShadow: '0 5px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(240,192,64,0.2)',
                    pointerEvents: 'auto',
                }}
            >
                <img src={AssetsMap.UI.ICON_EXIT} style={{ width: '40px', height: '40px' }} alt="" />
                <span
                    style={{
                        color: '#f0c040',
                        fontSize: '22px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        textShadow: '0 2px 4px #000',
                        letterSpacing: '2px',
                    }}
                >
                    ВЫХОД
                </span>
            </motion.button>

            <UnderDevelopmentModal
                isOpen={devModal.isOpen}
                title={devModal.title}
                onClose={() => setDevModal({ ...devModal, isOpen: false })}
            />
        </DndContext>
    );
};
