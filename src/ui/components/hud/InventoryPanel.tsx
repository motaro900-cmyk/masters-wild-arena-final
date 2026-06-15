import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { ConfirmDialog } from './SharedUI';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';
import { DraggableItem } from './Inventory/DraggableItem';
import { ItemTooltip } from './Inventory/ItemTooltip';
import { ChestOpeningOverlay } from './Inventory/ChestOpeningOverlay';
import { RARITY_COLORS } from '../../../configs/RarityConfig';


interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
    setGlobalHoveredItem?: (id: string | null, x: number, y: number) => void;
}


export const InventoryPanel: React.FC<InventoryPanelProps> = ({ mode = 'FULL', onItemClick, setGlobalHoveredItem: propSetGlobalHoveredItem }) => {
    const inventory = useGameStore((state) => state.inventory);
    const sellItem = useGameStore((state) => state.sellItem);
    const equippedItems = useGameStore((state) => state.equippedItems);
    const getHeroByItemId = useGameStore((state) => state.getHeroByItemId);
    const selectedHeroId = useGameStore((state) => state.selectedHeroId);
    const openSeasonChest = useGameStore((state) => state.openSeasonChest);
    const coal = useGameStore((state) => state.coal);
    const steel_bars = useGameStore((state) => state.steel_bars);
    const runic_shards = useGameStore((state) => state.runic_shards);
    const ancient_compass = useGameStore((state) => state.ancient_compass);
    const astral_crystal = useGameStore((state) => state.astral_crystal);
    const void_sphere = useGameStore((state) => state.void_sphere);
    const golden_sprout = useGameStore((state) => state.golden_sprout);
    const dragon_scale = useGameStore((state) => state.dragon_scale);
    const lava_heart = useGameStore((state) => state.lava_heart);

    const [activeTab, setActiveTab] = useState<'ALL' | 'EQUIPMENT' | 'POTIONS' | 'RESOURCES'>('ALL');
    const [sortBy, setSortBy] = useState<'TYPE' | 'POWER' | 'RARITY'>('TYPE');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredItem, setHoveredItem] = useState<{ id: string; x: number; y: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkLayout = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [clientHeight, setClientHeight] = useState(600);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
        setClientHeight(e.currentTarget.clientHeight);
    };

    useEffect(() => {
        setScrollTop(0);
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            setClientHeight(containerRef.current.clientHeight);
        }
    }, [activeTab, searchQuery]);

    const TABS = ['ALL', 'EQUIPMENT', 'POTIONS', 'RESOURCES'] as const;

    const [confirmData, setConfirmData] = useState<{
        isOpen: boolean; title: string; message: string;
        onConfirm: () => void; variant: 'danger' | 'normal';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'normal' });

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
            setTimeout(() => { setShowFlash(false); setShowRewardCard(true); }, 150);
        }, 1500);
    };

    const MAX_SLOTS = 100;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isItemEquipped = (itemId: string) =>
        Object.values(equippedItems || {}).some((id: any) => id === itemId);

    const getSellPrice = (item: any) => {
        const data = ITEMS_DATABASE[item.id] as any;
        return Math.floor((data?.priceGold || 100) * 0.5) * (item.amount || 1);
    };

    const items = useMemo(() => {
        const resourceItems = [
            { id: 'coal',            amount: coal || 0,            isResource: true },
            { id: 'steel_bar',       amount: steel_bars || 0,      isResource: true },
            { id: 'runic_shard',     amount: runic_shards || 0,    isResource: true },
            { id: 'ancient_compass', amount: ancient_compass || 0, isResource: true },
            { id: 'astral_crystal',  amount: astral_crystal || 0,  isResource: true },
            { id: 'void_sphere',     amount: void_sphere || 0,     isResource: true },
            { id: 'golden_sprout',   amount: golden_sprout || 0,   isResource: true },
            { id: 'dragon_scale',    amount: dragon_scale || 0,    isResource: true },
            { id: 'lava_heart',      amount: lava_heart || 0,      isResource: true },
        ].filter((r: any) => r.amount > 0);
        return [...inventory, ...resourceItems];
    }, [inventory, coal, steel_bars, runic_shards, ancient_compass, astral_crystal, void_sphere, golden_sprout, dragon_scale, lava_heart]);

    const sortType = sortBy;

    // ── Filtered + searched items ─────────────────────────────────────────────
    const filteredItems = useMemo(() => {
        let result: any[] = [];
        if (activeTab === 'RESOURCES') {
            result = items.filter((item: any) => item.isResource);
        } else if (activeTab === 'EQUIPMENT') {
            result = items.filter((item: any) => !item.isResource && (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL');
        } else if (activeTab === 'POTIONS') {
            result = items.filter((item: any) => !item.isResource && (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ALCHEMY' && (ITEMS_DATABASE[item.id] as any)?.subTab !== 'RESOURCES');
        } else {
            result = items.filter((item: any) => {
                if (item.isResource) return true;
                const dbItem = ITEMS_DATABASE[item.id] as any;
                return dbItem?.subTab !== 'RESOURCES' && dbItem?.mainTab !== 'ALCHEMY';
            });
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((item) => {
                const data = ITEMS_DATABASE[item.id] as any;
                return (
                    (data?.name || item.id).toLowerCase().includes(q) ||
                    (data?.rarity || '').toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q)
                );
            });
        }

        const rarityOrder: Record<string, number> = { COMMON: 0, RARE: 1, EPIC: 2, MYTHIC: 3, LEGENDARY: 4 };
        const subTabOrder: Record<string, number> = {
            WEAPONS: 0,
            SHIELDS: 1,
            HELMETS: 2,
            ARMOR: 3,
            SHOULDERS: 4,
            PANTS: 5,
            BOOTS: 6,
        };

        return result.sort((a: any, b: any) => {
            const dataA = ITEMS_DATABASE[a.id] as any;
            const dataB = ITEMS_DATABASE[b.id] as any;
            if (!dataA || !dataB) return 0;

            if (sortType === 'TYPE') {
                const orderA = subTabOrder[dataA.subTab] ?? 99;
                const orderB = subTabOrder[dataB.subTab] ?? 99;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                const powerA = a.isResource ? 0 : calculateItemPower(dataA);
                const powerB = b.isResource ? 0 : calculateItemPower(dataB);
                return powerB - powerA;
            }

            if (sortType === 'POWER') {
                const powerA = a.isResource ? 0 : calculateItemPower(dataA);
                const powerB = b.isResource ? 0 : calculateItemPower(dataB);
                return powerB - powerA;
            }
            return rarityOrder[dataB.rarity] - rarityOrder[dataA.rarity];
        });
    }, [items, searchQuery, sortType, activeTab]);

    // ── Tab counts ────────────────────────────────────────────────────────────
    const tabCounts = useMemo(() => ({
        ALL: inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.mainTab !== 'ALCHEMY').length,
        EQUIPMENT: inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL').length,
        POTIONS: 0,
        RESOURCES: [coal, steel_bars, runic_shards, ancient_compass, astral_crystal, void_sphere, golden_sprout, dragon_scale, lava_heart].filter((v: any) => (v || 0) > 0).length,
    }), [inventory, coal, steel_bars, runic_shards, ancient_compass, astral_crystal, void_sphere, golden_sprout, dragon_scale, lava_heart]);

    // ── Sell junk ─────────────────────────────────────────────────────────────
    const junkItems = useMemo(() =>
        inventory.filter((item: any) => {
            const data = ITEMS_DATABASE[item.id] as any;
            return data?.rarity === 'COMMON' && !isItemEquipped(item.id);
        }),
        [inventory, equippedItems]
    );

    const junkGold = junkItems.reduce((sum: number, item: any) => sum + getSellPrice(item), 0);

    const handleSellJunk = () => {
        if (junkItems.length === 0) return;
        setConfirmData({
            isOpen: true,
            title: 'ПРОДАЖА ВЕЩЕЙ',
            message: `Продать все обычные предметы (${junkItems.length} шт.) за ${junkGold.toLocaleString('ru-RU')} 🪙?`,
            variant: 'danger',
            onConfirm: () => junkItems.forEach((item: any) => sellItem(item.id)),
        });
    };

    // ── Multi-select sell ─────────────────────────────────────────────────────
    const selectedGold = useMemo(() => {
        let sum: number = 0;
        selectedItems.forEach((instanceId: string) => {
            const item = inventory.find((i: any) => (i.instanceId || i.id) === instanceId);
            if (item) sum += getSellPrice(item);
        });
        return sum;
    }, [selectedItems, inventory]);

    const handleSellSelected = () => {
        if (selectedItems.size === 0) return;
        setConfirmData({
            isOpen: true,
            title: 'ПРОДАЖА ВЫБРАННЫХ',
            message: `Продать ${selectedItems.size} шт. за ${selectedGold.toLocaleString('ru-RU')} 🪙?`,
            variant: 'danger',
            onConfirm: () => {
                selectedItems.forEach(instanceId => sellItem(instanceId));
                setSelectedItems(new Set());
            },
        });
    };

    const toggleSelectItem = (instanceId: string, e: React.MouseEvent) => {
        if (!e.shiftKey) return; // только Shift+клик
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(instanceId)) next.delete(instanceId);
            else next.add(instanceId);
            return next;
        });
    };

    // ── Bag fill color ────────────────────────────────────────────────────────
    const bagFill = inventory.length / MAX_SLOTS;
    const bagColor = bagFill > 0.9 ? '#ef4444' : bagFill > 0.75 ? '#f59e0b' : '#4ade80';

    const cols = mode === 'FULL' ? (isMobile ? 6 : 5) : 3;
    const rowHeight = mode === 'FULL' ? (isMobile ? 85 : 125) : (isMobile ? 70 : 100);
    const gapHeight = mode === 'FULL' ? (isMobile ? 8 : 14) : (isMobile ? 6 : 10);
    const rowSpacing = rowHeight + gapHeight;

    const totalItems = useMemo(() => {
        type GridElement =
            | { type: 'ITEM'; item: any; index: number }
            | { type: 'EMPTY'; index: number };

        const itemsList: GridElement[] = filteredItems.map((item, index) => ({ type: 'ITEM' as const, item, index }));
        const emptyCount = Math.max(0, (mode === 'FULL' ? 20 : 9) - filteredItems.length);
        const emptyList: GridElement[] = Array.from({ length: emptyCount }).map((_, index) => ({ type: 'EMPTY' as const, index }));
        return [...itemsList, ...emptyList];
    }, [filteredItems, mode]);

    const rows = useMemo(() => {
        const result: typeof totalItems[] = [];
        for (let i = 0; i < totalItems.length; i += cols) {
            result.push(totalItems.slice(i, i + cols));
        }
        return result;
    }, [totalItems, cols]);

    const startIndex = Math.max(0, Math.floor(scrollTop / rowSpacing) - 5);
    const endIndex = Math.min(rows.length - 1, Math.ceil((scrollTop + clientHeight) / rowSpacing) - 1 + 5);

    const topSpacerHeight = startIndex * rowSpacing;
    const bottomSpacerHeight = Math.max(0, (rows.length - 1 - endIndex) * rowSpacing);

    const visibleRows = useMemo(() => {
        return rows.slice(startIndex, endIndex + 1);
    }, [rows, startIndex, endIndex]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}
        >
            {/* ══ ВЕРХНЯЯ ПАНЕЛЬ ══════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* Табы */}
                <div style={{
                    display: 'flex', gap: '6px', width: '100%',
                    background: 'rgba(20,16,12,0.65)', borderRadius: '10px',
                    padding: '4px', border: '1px solid rgba(240,192,64,0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}>
                    {([
                        { id: 'ALL',       label: 'ВСЁ' },
                        { id: 'EQUIPMENT', label: 'СНАРЯЖЕНИЕ' },
                        { id: 'RESOURCES', label: 'РЕСУРСЫ' },
                    ] as const).map((tab) => {
                        const active = activeTab === tab.id;
                        const count = tabCounts[tab.id];
                        return (
                            <button
                                key={tab.id}
                                className={isMobile ? "nav-tab-mobile" : ""}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1, padding: '11px 4px', borderRadius: '6px',
                                    background: active ? 'linear-gradient(180deg,#f0c040 0%,#c8960a 100%)' : 'transparent',
                                    border: active ? '1px solid #fffdf7' : '1px solid transparent',
                                    color: active ? '#1a0f00' : 'rgba(255,254,250,0.6)',
                                    fontSize: '11.5px', fontWeight: active ? 900 : 700, cursor: 'pointer',
                                    fontFamily: "'Philosopher', 'Inter', sans-serif", textAlign: 'center',
                                    whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                }}
                            >
                                <span>{tab.label}</span>
                                {count > 0 && (
                                    <span style={{
                                        background: active ? 'rgba(0,0,0,0.2)' : 'rgba(240,192,64,0.2)',
                                        color: active ? '#1a0f00' : '#f0c040',
                                        borderRadius: '10px', padding: '0 5px',
                                        fontSize: '9px', fontWeight: 900, minWidth: '16px', textAlign: 'center',
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Строка поиска + инфо + кнопки */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                    {/* Поиск */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{
                            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '12px', opacity: 0.4, pointerEvents: 'none',
                        }}>🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск по имени или редкости..."
                            style={{
                                width: '100%', padding: '8px 10px 8px 28px',
                                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(240,192,64,0.2)',
                                borderRadius: '8px', color: '#fff', fontSize: '11px',
                                fontFamily: "'Nunito', sans-serif", outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{
                                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer', fontSize: '12px', padding: 0, lineHeight: 1,
                            }}>✕</button>
                        )}
                    </div>

                    {/* Полоса заполнения */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '90px' }}>
                        <div style={{ fontSize: '11px', color: '#fffdf5', fontWeight: 800, fontFamily: "'Philosopher', 'Inter', sans-serif", letterSpacing: '0.5px' }}>
                            СУМКА {inventory.length}/{MAX_SLOTS}
                        </div>
                        <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div style={{
                                height: '100%', borderRadius: '4px',
                                width: `${Math.min(100, bagFill * 100)}%`,
                                background: `linear-gradient(90deg, ${bagColor}cc, ${bagColor})`,
                                transition: 'width 0.3s ease, background 0.3s',
                                boxShadow: `0 0 6px ${bagColor}66`,
                            }} />
                        </div>
                    </div>

                    {/* Продать выбранные (если есть выбор) */}
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleSellSelected}
                            style={{
                                background: 'rgba(168,85,247,0.12)', color: '#c084fc',
                                border: '1px solid rgba(168,85,247,0.35)', borderRadius: '8px',
                                padding: '6px 10px', fontSize: '10px', fontWeight: 900,
                                cursor: 'pointer', fontFamily: "'Cinzel', serif",
                                display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                            }}
                        >
                            <span>✅ {selectedItems.size} шт.</span>
                            <span style={{ opacity: 0.7 }}>+{selectedGold.toLocaleString('ru-RU')} 🪙</span>
                        </button>
                    )}

                    {/* Продать хлам */}
                    <button
                        onClick={handleSellJunk}
                        title={junkItems.length > 0 ? `Продать ${junkItems.length} обычных предметов` : 'Нет обычных предметов для продажи'}
                        style={{
                            background: junkItems.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                            color: junkItems.length > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)',
                            border: `1px solid ${junkItems.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '8px', padding: '9px 12px', fontSize: '11px',
                            fontWeight: 900, cursor: junkItems.length > 0 ? 'pointer' : 'default',
                            fontFamily: "'Cinzel', serif", letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                        }}
                    >
                        <span>🗑️</span>
                        <span>ХЛАМ</span>
                        {junkItems.length > 0 && (
                            <span style={{ opacity: 0.75, fontSize: '9px' }}>+{junkGold.toLocaleString('ru-RU')} 🪙</span>
                        )}
                    </button>

                    {/* Сортировка */}
                    <button
                        onClick={() => {
                            let nextSort: 'TYPE' | 'POWER' | 'RARITY' = 'TYPE';
                            if (sortBy === 'TYPE') nextSort = 'POWER';
                            else if (sortBy === 'POWER') nextSort = 'RARITY';
                            else if (sortBy === 'RARITY') nextSort = 'TYPE';
                            setSortBy(nextSort);
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK || 'SFX_CLICK');
                        }}
                        title="Переключить сортировку"
                        style={{
                            background: 'rgba(240,192,64,0.05)', color: '#f0c040',
                            border: '1px solid rgba(240,192,64,0.25)', borderRadius: '8px',
                            padding: '9px 12px', fontSize: '11px', fontWeight: 900,
                            cursor: 'pointer', fontFamily: "'Cinzel', serif",
                            display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                        }}
                    >
                        <span>⇅</span>
                        <span>{sortBy === 'TYPE' ? 'ТИП' : sortBy === 'POWER' ? 'МОЩЬ' : 'РЕДК.'}</span>
                    </button>
                </div>

                {/* Подсказка про Shift */}
                {selectedItems.size === 0 && mode === 'FULL' && (
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.3px', paddingLeft: '2px' }}>
                        💡 Shift+клик — выделить предметы для массовой продажи &nbsp;·&nbsp; ЛКМ — надеть/снять снаряжение
                    </div>
                )}
            </div>

            {/* ══ СЕТКА ПРЕДМЕТОВ ═════════════════════════════════════════════ */}
            <motion.div
                ref={containerRef}
                onScroll={handleScroll}
                drag={isMobile ? "x" : undefined}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                    if (!isMobile) return;
                    const swipeThreshold = 50;
                    const currentIndex = TABS.indexOf(activeTab);
                    if (info.offset.x < -swipeThreshold) {
                        if (currentIndex < TABS.length - 1) {
                            setActiveTab(TABS[currentIndex + 1]);
                        }
                    } else if (info.offset.x > swipeThreshold) {
                        if (currentIndex > 0) {
                            setActiveTab(TABS[currentIndex - 1]);
                        }
                    }
                }}
                style={{
                    flex: 1,
                    background: 'radial-gradient(circle at 50% 50%, rgba(20, 16, 12, 0.98) 0%, rgba(10, 8, 6, 0.99) 100%)',
                    borderRadius: '16px', border: '1.5px solid rgba(240,192,64,0.3)',
                    padding: mode === 'FULL' ? '20px' : '12px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: gapHeight + 'px',
                    boxShadow: 'inset 0 0 24px rgba(0,0,0,0.95), 0 4px 15px rgba(0,0,0,0.5)',
                    touchAction: isMobile ? 'pan-y' : 'auto',
                }}
                className="leaderboard-scroll"
            >
                <div style={{ height: topSpacerHeight, flexShrink: 0 }} />
                {visibleRows.map((row, rowIndex) => (
                    <div
                        key={startIndex + rowIndex}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: mode === 'FULL' ? 'repeat(5,1fr)' : 'repeat(3,1fr)',
                            gap: gapHeight + 'px',
                            height: rowHeight + 'px',
                            width: '100%',
                            flexShrink: 0,
                        }}
                    >
                        {row.map((element) => {
                            if (element.type === 'ITEM') {
                                const { item, index: i } = element;
                                const data = ITEMS_DATABASE[item.id] as any;
                                if (!data) return null;

                                const equippedHeroId = getHeroByItemId(item.instanceId || item.id);
                                const isEquippedOnCurrent = String(equippedHeroId) === String(selectedHeroId || 'panda');
                                const isEquippedOnOther = equippedHeroId && !isEquippedOnCurrent;
                                const rarity = RARITY_COLORS[String(data?.rarity || 'COMMON')];
                                const instanceId = item.instanceId || item.id;
                                const isSelected = selectedItems.has(instanceId);

                                return (
                                    <div
                                        key={instanceId + i}
                                        style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box' }}
                                        onClick={(e) => {
                                            if (e.shiftKey && !item.isResource) {
                                                toggleSelectItem(instanceId, e);
                                            }
                                        }}
                                    >
                                        <DraggableItem
                                            item={item}
                                            data={data}
                                            rarity={rarity}
                                            isEquippedOnCurrent={isEquippedOnCurrent}
                                            isEquippedOnOther={!!isEquippedOnOther}
                                            equippedHeroId={equippedHeroId}
                                            onItemClick={async (id: string) => {
                                                if (isProcessing) return;
                                                setIsProcessing(true);
                                                if (id === 'season_chest') { handleOpenChest(); setIsProcessing(false); return; }
                                                const executeEquip = async () => {
                                                    if (onItemClick) await onItemClick(id);
                                                    setTimeout(() => setIsProcessing(false), 500);
                                                };
                                                if (isEquippedOnOther) {
                                                    setConfirmData({
                                                        isOpen: true, title: 'ПЕРЕДАЧА ВЕЩИ',
                                                        message: `Предмет надет на ${HEROES_DB.find((h) => h.id === equippedHeroId)?.name || equippedHeroId}. Передать текущему герою?`,
                                                        variant: 'normal', onConfirm: executeEquip,
                                                    });
                                                    setIsProcessing(false);
                                                } else {
                                                    await executeEquip();
                                                }
                                            }}
                                            setGlobalHoveredItem={(id: string | null, x: number, y: number) => {
                                                setHoveredItem(id ? { id, x, y } : null);
                                                propSetGlobalHoveredItem?.(id, x, y);
                                            }}
                                        />
                                        {/* Рамка выделения (Shift) */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute', inset: 0, borderRadius: '8px',
                                                border: '2px solid #c084fc',
                                                boxShadow: '0 0 12px rgba(192,132,252,0.5)',
                                                pointerEvents: 'none', zIndex: 15,
                                            }} />
                                        )}
                                        {/* Галочка выделения */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute', top: '2px', left: '2px',
                                                width: '16px', height: '16px', borderRadius: '4px',
                                                background: '#c084fc', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: '9px', color: '#fff',
                                                fontWeight: 900, zIndex: 16, pointerEvents: 'none',
                                            }}>✓</div>
                                        )}
                                    </div>
                                );
                            } else {
                                const { index: i } = element;
                                return (
                                    <div key={'empty-' + i} style={{
                                        background: 'radial-gradient(circle, rgba(28, 22, 18, 0.4) 0%, rgba(18, 14, 11, 0.6) 100%)',
                                        borderRadius: '8px',
                                        border: '1.5px solid rgba(240, 192, 64, 0.08)',
                                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.85)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: 'rgba(240,192,64,0.04)',
                                        }} />
                                    </div>
                                );
                            }
                        })}
                    </div>
                ))}
                <div style={{ height: bottomSpacerHeight, flexShrink: 0 }} />
            </motion.div>

            {/* Context menu removed */}

            <ConfirmDialog
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
                onConfirm={confirmData.onConfirm}
                title={confirmData.title}
                message={confirmData.message}
                variant={confirmData.variant}
            />

            {hoveredItem && !propSetGlobalHoveredItem && <ItemTooltip item={hoveredItem} />}

            <ChestOpeningOverlay
                isOpening={isOpening}
                showRewardCard={showRewardCard}
                openingResult={openingResult}
                showFlash={showFlash}
                onClose={() => { setIsOpening(false); setShowRewardCard(false); }}
            />
        </div>
    );
};

export default InventoryPanel;
