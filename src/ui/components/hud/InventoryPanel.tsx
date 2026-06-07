import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { ConfirmDialog } from './SharedUI';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import { DraggableItem } from './Inventory/DraggableItem';
import { ItemTooltip } from './Inventory/ItemTooltip';
import { ChestOpeningOverlay } from './Inventory/ChestOpeningOverlay';

const stoneBrickPattern =
    "url(\"data:image/svg+xml;utf8,<svg width='60' height='40' viewBox='0 0 60 40' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='40' fill='none'/><line x1='0' y1='20' x2='60' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='40' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='30' y1='0' x2='30' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='20' x2='0' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='60' y1='20' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='1.5' x2='60' y2='1.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='0' y1='21.5' x2='60' y2='21.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='31.5' y1='0.8' x2='31.5' y2='19.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='1.5' y1='20.8' x2='1.5' y2='39.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><path d='M44,3 L40,7 L42,12 L38,15' stroke='rgba(0,0,0,0.45)' stroke-width='0.8' fill='none'/><path d='M45,3.5 L41,7.5 L43,12.5 L39,15.5' stroke='rgba(255,255,255,0.08)' stroke-width='0.8' fill='none'/><line x1='6' y1='8' x2='20' y2='8' stroke='rgba(0,0,0,0.42)' stroke-width='0.8'/><line x1='6' y1='9' x2='20' y2='9' stroke='rgba(255,255,255,0.08)' stroke-width='0.8'/><path d='M10,23 L13,28 L11,34' stroke='rgba(0,0,0,0.48)' stroke-width='0.9' fill='none'/><path d='M11,23.5 L14,28.5 L12,34.5' stroke='rgba(255,255,255,0.09)' stroke-width='0.9' fill='none'/><path d='M35,33 L48,30 L54,32' stroke='rgba(0,0,0,0.42)' stroke-width='0.8' fill='none'/><path d='M35,34 L48,31 L54,33' stroke='rgba(255,255,255,0.07)' stroke-width='0.8' fill='none'/><circle cx='12' cy='14' r='0.8' fill='rgba(0,0,0,0.45)'/><circle cx='12.5' cy='14.5' r='0.4' fill='rgba(255,255,255,0.08)'/><circle cx='48' cy='26' r='1.2' fill='rgba(0,0,0,0.5)'/><circle cx='48.5' cy='26.5' r='0.6' fill='rgba(255,255,255,0.1)'/></svg>\")";

interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
    setGlobalHoveredItem?: (id: string | null, x: number, y: number) => void;
}

import { RARITY_COLORS } from '../../../configs/RarityConfig';

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
    const [isProcessing, setIsProcessing] = useState(false);
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
                <div
                    style={{
                        display: 'flex',
                        gap: '6px',
                        width: '100%',
                        background: 'rgba(20, 16, 12, 0.65)',
                        borderRadius: '10px',
                        padding: '4px',
                        border: '1px solid rgba(240, 192, 64, 0.2)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    }}
                >
                    {[
                        { id: 'ALL', label: 'ВСЁ' },
                        { id: 'EQUIPMENT', label: 'СНАРЯЖЕНИЕ' },
                        { id: 'POTIONS', label: 'АЛХИМИЯ' },
                        { id: 'RESOURCES', label: 'РЕСУРСЫ' },
                    ].map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px 4px',
                                    borderRadius: '6px',
                                    background: active
                                        ? 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)'
                                        : 'transparent',
                                    border: active ? '1px solid #fffdf7' : '1px solid transparent',
                                    color: active ? '#1a0f00' : 'rgba(255, 254, 250, 0.6)',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    boxShadow: active ? '0 2px 6px rgba(240, 192, 64, 0.2)' : 'none',
                                    textShadow: active
                                        ? '0 1px 1px rgba(255,255,255,0.2)'
                                        : '0 2px 4px rgba(0,0,0,0.8)',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            onClick={handleSellJunk}
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.3)',
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
                            <span>🗑️</span>
                            <span>ПРОДАТЬ ХЛАМ</span>
                        </button>
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
            </div>

            <div
                style={{
                    flex: 1,
                    background: `${stoneBrickPattern}, linear-gradient(180deg, rgba(22, 18, 15, 0.98) 0%, rgba(14, 11, 9, 0.99) 100%)`,
                    borderRadius: '16px',
                    border: '1.5px solid rgba(240, 192, 64, 0.3)',
                    padding: '20px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: mode === 'FULL' ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)',
                    gridAutoRows: mode === 'FULL' ? '90px' : '80px',
                    gap: '12px',
                    boxShadow: 'inset 0 0 24px rgba(0,0,0,0.95), 0 4px 15px rgba(0,0,0,0.5)',
                }}
                className="leaderboard-scroll"
            >
                {filteredItems.map((item: any, i: number) => {
                    const data = ITEMS_DATABASE[item.id] as any;
                    if (!data) return null;

                    const equippedHeroId = getHeroByItemId(item.instanceId || item.id);
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
                            onItemClick={async (id: string) => {
                                if (isProcessing) return;
                                setIsProcessing(true);

                                if (id === 'season_chest') {
                                    handleOpenChest();
                                    setIsProcessing(false);
                                    return;
                                }

                                const executeEquip = async () => {
                                    if (onItemClick) {
                                        await onItemClick(id);
                                    }
                                    setTimeout(() => setIsProcessing(false), 500);
                                };

                                if (isEquippedOnOther) {
                                    setConfirmData({
                                        isOpen: true,
                                        title: 'ПЕРЕДАЧА ВЕЩИ',
                                        message: `Этот предмет надет на ${HEROES_DB.find((h) => h.id === equippedHeroId)?.name || equippedHeroId}. Передать его текущему герою?`,
                                        variant: 'normal',
                                        onConfirm: executeEquip,
                                    });
                                    setIsProcessing(false);
                                } else {
                                    await executeEquip();
                                }
                            }}
                            setGlobalHoveredItem={(id: string | null, x: number, y: number) => {
                                if (id) {
                                    setHoveredItem({ id, x, y });
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
                            background:
                                'radial-gradient(circle at 50% 50%, rgba(12, 9, 7, 0.95) 0%, rgba(20, 16, 13, 0.98) 100%)',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(240, 192, 64, 0.12)',
                            boxShadow: 'inset 0 4px 10px rgba(0, 0, 0, 0.9), 0 1px 1px rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        {/* A subtle runic cross or dot indicator inside the empty slot */}
                        <div
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'rgba(240, 192, 64, 0.08)',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                            }}
                        />
                    </div>
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

            {hoveredItem && !setGlobalHoveredItem && <ItemTooltip item={hoveredItem} />}

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
