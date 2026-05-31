/* eslint-disable react-refresh/only-export-components */
import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower, ItemRarity } from '../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { ConfirmDialog } from './SharedUI';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import { DraggableItem } from './Inventory/DraggableItem';
import { ItemTooltip } from './Inventory/ItemTooltip';
import { ChestOpeningOverlay } from './Inventory/ChestOpeningOverlay';

interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
    setGlobalHoveredItem?: (id: string | null, x: number, y: number) => void;
}

export const RARITY_COLORS: any = {
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

export const rarityTranslation: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ mode = 'FULL', onItemClick, setGlobalHoveredItem }) => {
    const {
        inventory,
        sellItem,
        equippedItems,
        getHeroByItemId,
        selectedHeroId,
        openSeasonChest,
        coal,
        steel_bars,
        runic_shards,
        ancient_compass,
        astral_crystal,
        void_sphere,
        golden_sprout,
        dragon_scale,
        lava_heart,
    } = useGameStore();
    const [activeTab, setActiveTab] = useState<'ALL' | 'EQUIPMENT' | 'POTIONS' | 'RESOURCES'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'RARITY'>('POWER');
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

    const [openingResult, setOpeningResult] = useState<any | null>(null);
    const [isOpening, setIsOpening] = useState(false);
    const [showRewardCard, setShowRewardCard] = useState(false);
    const [showFlash, setShowFlash] = useState(false);

    const handleOpenChest = () => {
        if (isOpening) return;
        setIsOpening(true);
        setShowRewardCard(false);
        setShowFlash(false);
        setOpeningResult(null);

        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

        const result = openSeasonChest();

        setTimeout(() => {
            setShowFlash(true);
            setOpeningResult(result);
            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);

            setTimeout(() => {
                setShowFlash(false);
                setShowRewardCard(true);
            }, 150);
        }, 1500);
    };

    // Лимит инвентаря (заглушка на 100)
    const MAX_SLOTS = 100;

    const filteredItems = useMemo(() => {
        // Virtual resource items
        const resourceItems = [
            { id: 'coal', amount: coal || 0, isResource: true },
            { id: 'steel_bar', amount: steel_bars || 0, isResource: true },
            { id: 'runic_shard', amount: runic_shards || 0, isResource: true },
            { id: 'ancient_compass', amount: ancient_compass || 0, isResource: true },
            { id: 'astral_crystal', amount: astral_crystal || 0, isResource: true },
            { id: 'void_sphere', amount: void_sphere || 0, isResource: true },
            { id: 'golden_sprout', amount: golden_sprout || 0, isResource: true },
            { id: 'dragon_scale', amount: dragon_scale || 0, isResource: true },
            { id: 'lava_heart', amount: lava_heart || 0, isResource: true },
        ].filter((r) => r.amount > 0);

        if (activeTab === 'RESOURCES') {
            return resourceItems;
        }

        let items = [...inventory];

        if (activeTab === 'EQUIPMENT') {
            items = items.filter((item) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL');
        } else if (activeTab === 'POTIONS') {
            items = items.filter(
                (item) =>
                    (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ALCHEMY' &&
                    (ITEMS_DATABASE[item.id] as any)?.subTab !== 'RESOURCES',
            );
        } else if (activeTab === 'ALL') {
            // Include normal items + resources when looking at everything
            const normalItems = items.filter((item) => (ITEMS_DATABASE[item.id] as any)?.subTab !== 'RESOURCES');
            items = [...normalItems, ...resourceItems];
        }

        const rarityOrder: Record<string, number> = { COMMON: 0, RARE: 1, EPIC: 2, MYTHIC: 3, LEGENDARY: 4 };

        return items.sort((a: any, b: any) => {
            const dataA = ITEMS_DATABASE[a.id] as any;
            const dataB = ITEMS_DATABASE[b.id] as any;
            if (!dataA || !dataB) return 0;

            if (sortBy === 'POWER') {
                const powerA = a.isResource ? 0 : calculateItemPower(dataA);
                const powerB = b.isResource ? 0 : calculateItemPower(dataB);
                return powerB - powerA;
            } else {
                return rarityOrder[dataB.rarity] - rarityOrder[dataA.rarity];
            }
        });
    }, [
        inventory,
        activeTab,
        sortBy,
        coal,
        steel_bars,
        runic_shards,
        ancient_compass,
        astral_crystal,
        void_sphere,
        golden_sprout,
        dragon_scale,
        lava_heart,
    ]);

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    {[
                        { id: 'ALL', label: 'ВСЁ' },
                        { id: 'EQUIPMENT', label: 'СНАРЯЖЕНИЕ' },
                        { id: 'POTIONS', label: 'АЛХИМИЯ' },
                        { id: 'RESOURCES', label: 'РЕСУРСЫ' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                            }}
                            style={{
                                flex: 1,
                                padding: '8px 4px',
                                borderRadius: '8px',
                                border: '1px solid rgba(240,192,64,0.2)',
                                background: activeTab === tab.id ? 'rgba(240,192,64,0.1)' : 'transparent',
                                color: activeTab === tab.id ? '#f0c040' : 'rgba(255,255,255,0.4)',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div
                        style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.5)',
                            fontWeight: 700,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.2px',
                        }}
                    >
                        СУМКА:{' '}
                        <span style={{ color: inventory.length > MAX_SLOTS * 0.8 ? '#ef4444' : '#fff' }}>
                            {inventory.length}/{MAX_SLOTS}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setSortBy(sortBy === 'POWER' ? 'RARITY' : 'POWER');
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK || 'SFX_CLICK');
                        }}
                        style={{
                            background: 'rgba(240,192,64,0.05)',
                            color: '#f0c040',
                            border: '1px solid rgba(240,192,64,0.25)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '10px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span>⇅</span>
                        <span>{sortBy === 'POWER' ? 'ПО МОЩИ' : 'ПО РЕДКОСТИ'}</span>
                    </button>
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
                                if (id === 'season_chest') {
                                    handleOpenChest();
                                    return;
                                }
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



            <ConfirmDialog
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
                onConfirm={confirmData.onConfirm}
                title={confirmData.title}
                message={confirmData.message}
                variant={confirmData.variant}
            />

            {hoveredItem && <ItemTooltip item={hoveredItem} />}

            <ChestOpeningOverlay
                isOpening={isOpening}
                showRewardCard={showRewardCard}
                openingResult={openingResult}
                showFlash={showFlash}
                onClose={() => {
                    setIsOpening(false);
                    setShowRewardCard(false);
                }}
            />
        </div>
    );
};
