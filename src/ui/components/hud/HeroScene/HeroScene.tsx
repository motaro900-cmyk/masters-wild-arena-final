import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext } from '@dnd-kit/core';

import { useGameStore } from '../../../../store/useGameStore';
import { HEROES_DB } from '../../../../configs/HeroesConfig';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

import { SceneTab } from './types';
import { rarityColors } from './constants/roleIcons';
import { useHeroActions } from './hooks/useHeroActions';
import { useHeroDnd } from './hooks/useHeroDnd';

import { HeroSceneSidebar } from './components/HeroSceneSidebar';
import { HeroList } from './components/HeroList';
import { GearView } from './components/Equipment/GearView';
import { TalentsView } from './components/Talents/TalentsView';
import { SkinsView } from './components/Skins/SkinsView';

import { HeroDetailsModal } from './components/HeroDetails/HeroDetailsModal';
import { PurchaseModal } from './components/HeroDetails/PurchaseModal';
import { ItemTooltipPortal } from './components/shared/ItemTooltipPortal';
import { FloatingTextsLayer } from './components/shared/FloatingTextsLayer';
import { DragOverlayLayer } from './components/shared/DragOverlayLayer';
import { UnderDevelopmentModal } from '../SharedUI';
import { ResourceBar } from '../ResourceBar';

const getScaleAndOffset = () => {
    const wrapper = document.querySelector('.game-scale-wrapper');
    if (!wrapper) return { scale: 1, left: 0, top: 0, isRotated: false, rect: null as any };
    const rect = wrapper.getBoundingClientRect();
    const isPortraitMobile = useGameStore.getState().isMobile && window.innerWidth < window.innerHeight;
    if (isPortraitMobile) {
        return {
            scale: rect.height / 1920,
            left: rect.left,
            top: rect.top,
            isRotated: true,
            rect,
        };
    }
    return {
        scale: rect.width / 1920,
        left: rect.left,
        top: rect.top,
        isRotated: false,
        rect,
    };
};

const scaleRect = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const info = getScaleAndOffset();
    if (info.isRotated && info.rect) {
        const nx_left = info.rect.width > 0 ? (rect.left - info.rect.left) / info.rect.width : 0;
        const ny_top = info.rect.height > 0 ? (rect.top - info.rect.top) / info.rect.height : 0;
        const nx_right = info.rect.width > 0 ? (rect.right - info.rect.left) / info.rect.width : 0;
        const ny_bottom = info.rect.height > 0 ? (rect.bottom - info.rect.top) / info.rect.height : 0;

        const localLeft = ny_top * 1920;
        const localTop = (1 - nx_right) * 1080;
        const localRight = ny_bottom * 1920;
        const localBottom = (1 - nx_left) * 1080;

        return {
            x: localLeft,
            y: localTop,
            left: localLeft,
            top: localTop,
            right: localRight,
            bottom: localBottom,
            width: localRight - localLeft,
            height: localBottom - localTop,
        };
    }

    const { scale, left, top } = info;
    return {
        x: (rect.left - left) / scale,
        y: (rect.top - top) / scale,
        left: (rect.left - left) / scale,
        top: (rect.top - top) / scale,
        right: (rect.right - left) / scale,
        bottom: (rect.bottom - top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
    };
};

export const HeroScene: React.FC = () => {
    const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);
    const inventory = useGameStore((state) => state.inventory);
    const equipItem = useGameStore((state) => state.equipItem);
    const unequipItem = useGameStore((state) => state.unequipItem);
    const heroEquipment = useGameStore((state) => state.heroEquipment);
    const heroesInitialTab = useGameStore((state) => state.heroesInitialTab);
    const selectedHeroId = useGameStore((state) => state.selectedHeroId);
    const setSelectedHeroId = useGameStore((state) => state.setSelectedHeroId);
    const setHeroGalleryId = useGameStore((state) => state.setHeroGalleryId);
    const ownedHeroes = useGameStore((state) => state.ownedHeroes);
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const goToShop = useGameStore((state) => state.goToShop);
    const isMobile = useGameStore((state) => state.isMobile);

    // -- UI State --
    const [activeTab, setActiveTab] = useState<SceneTab>((heroesInitialTab as SceneTab) || 'LIST');
    const [detailSubTab, setDetailSubTab] = useState<'LORE' | 'INVENTORY' | 'TALENTS'>('INVENTORY');
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
    const stats = selectedHero ? getCalculatedStats(selectedHero.id) : null;

    // Guard: если hero не найден (сломанный localStorage) — показываем fallback
    if (!selectedHero) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            measuring={{
                draggable: {
                    measure: scaleRect,
                },
                droppable: {
                    measure: scaleRect,
                },
            }}
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
                        background: `radial-gradient(circle at 50% 25%, ${
                            selectedHero.rarity === 'LEGENDARY'
                                ? 'rgba(245, 158, 11, 0.42)'
                                : selectedHero.rarity === 'MYTHIC'
                                  ? 'rgba(239, 68, 68, 0.35)'
                                  : selectedHero.rarity === 'EPIC'
                                    ? 'rgba(168, 85, 247, 0.35)'
                                    : selectedHero.rarity === 'RARE'
                                      ? 'rgba(59, 130, 246, 0.35)'
                                      : 'rgba(240, 192, 64, 0.30)'
                        } 0%, #201814 35%, #140e0b 70%, #0a0705 100%)`,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'background 0.5s ease-in-out',
                    }}
                >
                    {/* ══════════════════════════════════════════════════════
                         TOP HEADER BAR — full width, like in the reference
                         Shows: ← ГЕРОИ (left)  +  Energy / Gold / Crystals (right)
                        ══════════════════════════════════════════════════════ */}
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 10000,
                            flexShrink: 0,
                            height: isMobile ? '70px' : '75px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: isMobile ? '0 20px' : '0 40px',
                            background: 'linear-gradient(180deg, #1c1612 0%, #120e0b 100%)',
                            borderBottom: 'none',
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Left: back arrow */}
                        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
                            <button
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    goToMainMenu();
                                }}
                                style={{
                                    position: 'absolute',
                                    top: isMobile ? '12px' : '15px',
                                    left: isMobile ? '80px' : '20px',
                                    padding: isMobile ? '10px 20px' : '8px 16px',
                                    background: 'rgba(20, 15, 10, 0.85)',
                                    border: '2px solid #c8a870',
                                    borderRadius: '8px',
                                    color: '#f0c040',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: isMobile ? '16px' : '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    boxShadow: '0 5px 25px rgba(0,0,0,0.7)',
                                    transition: 'all 0.2s',
                                    zIndex: 10,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <span>←</span> В ЛАГЕРЬ
                            </button>
                        </div>

                        {/* Centered large title */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                margin: 0,
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                background: 'linear-gradient(to bottom, #ffe890 0%, #f0c040 50%, #a27a20 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: isMobile ? '32px' : '44px',
                                fontWeight: 900,
                                letterSpacing: '4px',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                lineHeight: '1',
                                pointerEvents: 'none',
                                filter: 'drop-shadow(0 0 10px rgba(240, 192, 64, 0.45)) drop-shadow(0 4px 15px rgba(0,0,0,0.9))',
                            }}
                        >
                            ГЕРОИ
                        </div>

                        {/* Right: Resource bars */}
                        <ResourceBar
                            onOpenShop={(tab) => {
                                if (tab === 'GOLD' || tab === 'GEMS' || tab === 'ENERGY') {
                                    goToShop('BANK', tab);
                                } else {
                                    goToShop('ARSENAL');
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
                                background: 'rgba(255, 254, 250, 0.04)',
                                borderLeft: '1px solid rgba(197, 137, 17, 0.15)',
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
                                        setGlobalHoveredItem={(id: string | null, clientX: number, clientY: number) => {
                                            if (!id) {
                                                setGlobalHoveredItem(null);
                                                return;
                                            }
                                            const info = getScaleAndOffset();
                                            if (info.isRotated && info.rect) {
                                                const nx =
                                                    info.rect.width > 0 ? (clientX - info.left) / info.rect.width : 0;
                                                const ny =
                                                    info.rect.height > 0 ? (clientY - info.top) / info.rect.height : 0;
                                                setGlobalHoveredItem({
                                                    id,
                                                    x: ny * 1920,
                                                    y: (1 - nx) * 1080,
                                                });
                                            } else {
                                                setGlobalHoveredItem({
                                                    id,
                                                    x: (clientX - info.left) / info.scale,
                                                    y: (clientY - info.top) / info.scale,
                                                });
                                            }
                                        }}
                                        setDevModal={setDevModal}
                                    />
                                ) : activeTab === 'TALENTS' ? (
                                    <TalentsView hero={selectedHero} />
                                ) : activeTab === 'SKINS' ? (
                                    <SkinsView hero={selectedHero} />
                                ) : (
                                    <div style={{ color: '#fff' }}>В разработке...</div>
                                )}
                            </AnimatePresence>
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
