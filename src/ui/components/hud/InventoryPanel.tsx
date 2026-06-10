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
import { RARITY_COLORS } from '../../../configs/RarityConfig';

const stoneBrickPattern =
    "url(\"data:image/svg+xml;utf8,<svg width='60' height='40' viewBox='0 0 60 40' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='40' fill='none'/><line x1='0' y1='20' x2='60' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='40' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='30' y1='0' x2='30' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='20' x2='0' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='60' y1='20' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='1.5' x2='60' y2='1.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='0' y1='21.5' x2='60' y2='21.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='31.5' y1='0.8' x2='31.5' y2='19.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='1.5' y1='20.8' x2='1.5' y2='39.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/></svg>\")";

interface InventoryPanelProps {
    onItemClick?: (id: string) => void;
    mode?: 'FULL' | 'COMPACT';
    setGlobalHoveredItem?: (id: string | null, x: number, y: number) => void;
}

// ─── Context menu ─────────────────────────────────────────────────────────────
interface ContextMenu {
    x: number;
    y: number;
    item: any;
    data: any;
    isEquipped: boolean;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ mode = 'FULL', onItemClick, setGlobalHoveredItem }) => {
    const {
        inventory, sellItem, equippedItems, getHeroByItemId,
        selectedHeroId, openSeasonChest,
        coal, steel_bars, runic_shards, ancient_compass,
        astral_crystal, void_sphere, golden_sprout, dragon_scale, lava_heart,
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<'ALL' | 'EQUIPMENT' | 'POTIONS' | 'RESOURCES'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'RARITY'>('POWER');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredItem, setHoveredItem] = useState<{ id: string; x: number; y: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

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

    // ── Filtered + searched items ─────────────────────────────────────────────
    const filteredItems = useMemo(() => {
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

        let items: any[] = [];
        if (activeTab === 'RESOURCES') {
            items = resourceItems;
        } else if (activeTab === 'EQUIPMENT') {
            items = inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL');
        } else if (activeTab === 'POTIONS') {
            items = inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ALCHEMY' && (ITEMS_DATABASE[item.id] as any)?.subTab !== 'RESOURCES');
        } else {
            const normalItems = inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.subTab !== 'RESOURCES');
            items = [...normalItems, ...resourceItems];
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter((item) => {
                const data = ITEMS_DATABASE[item.id] as any;
                return (
                    (data?.name || item.id).toLowerCase().includes(q) ||
                    (data?.rarity || '').toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q)
                );
            });
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
            }
            return rarityOrder[dataB.rarity] - rarityOrder[dataA.rarity];
        });
    }, [inventory, activeTab, sortBy, searchQuery, coal, steel_bars, runic_shards, ancient_compass, astral_crystal, void_sphere, golden_sprout, dragon_scale, lava_heart]);

    // ── Tab counts ────────────────────────────────────────────────────────────
    const tabCounts = useMemo(() => ({
        ALL: inventory.length,
        EQUIPMENT: inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ARSENAL').length,
        POTIONS: inventory.filter((item: any) => (ITEMS_DATABASE[item.id] as any)?.mainTab === 'ALCHEMY' && (ITEMS_DATABASE[item.id] as any)?.subTab !== 'RESOURCES').length,
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

    // ── Context menu ──────────────────────────────────────────────────────────
    const handleContextMenu = (e: React.MouseEvent, item: any, data: any, isEquipped: boolean) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item, data, isEquipped });
    };

    const closeContextMenu = () => setContextMenu(null);

    // ── Bag fill color ────────────────────────────────────────────────────────
    const bagFill = inventory.length / MAX_SLOTS;
    const bagColor = bagFill > 0.9 ? '#ef4444' : bagFill > 0.75 ? '#f59e0b' : '#4ade80';

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}
            onClick={closeContextMenu}
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
                        { id: 'POTIONS',   label: 'АЛХИМИЯ' },
                        { id: 'RESOURCES', label: 'РЕСУРСЫ' },
                    ] as const).map((tab) => {
                        const active = activeTab === tab.id;
                        const count = tabCounts[tab.id];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: '8px 4px', borderRadius: '6px',
                                    background: active ? 'linear-gradient(180deg,#f0c040 0%,#c8960a 100%)' : 'transparent',
                                    border: active ? '1px solid #fffdf7' : '1px solid transparent',
                                    color: active ? '#1a0f00' : 'rgba(255,254,250,0.6)',
                                    fontSize: '11px', fontWeight: 900, cursor: 'pointer',
                                    fontFamily: "'Cinzel', serif", textAlign: 'center',
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
                                width: '100%', padding: '6px 10px 6px 28px',
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
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: '0.5px' }}>
                            СУМКА {inventory.length}/{MAX_SLOTS}
                        </div>
                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div style={{
                                height: '100%', borderRadius: '3px',
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
                            borderRadius: '8px', padding: '6px 10px', fontSize: '10px',
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
                        onClick={() => { setSortBy(sortBy === 'POWER' ? 'RARITY' : 'POWER'); audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK || 'SFX_CLICK'); }}
                        title="Переключить сортировку"
                        style={{
                            background: 'rgba(240,192,64,0.05)', color: '#f0c040',
                            border: '1px solid rgba(240,192,64,0.25)', borderRadius: '8px',
                            padding: '6px 10px', fontSize: '10px', fontWeight: 900,
                            cursor: 'pointer', fontFamily: "'Cinzel', serif",
                            display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                        }}
                    >
                        <span>⇅</span>
                        <span>{sortBy === 'POWER' ? 'МОЩЬ' : 'РЕДК.'}</span>
                    </button>
                </div>

                {/* Подсказка про Shift */}
                {selectedItems.size === 0 && mode === 'FULL' && (
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.3px', paddingLeft: '2px' }}>
                        💡 Shift+клик — выделить предметы для массовой продажи &nbsp;·&nbsp; ПКМ на предмет — контекстное меню
                    </div>
                )}
            </div>

            {/* ══ СЕТКА ПРЕДМЕТОВ ═════════════════════════════════════════════ */}
            <div
                style={{
                    flex: 1,
                    background: `${stoneBrickPattern}, linear-gradient(180deg,rgba(22,18,15,0.98) 0%,rgba(14,11,9,0.99) 100%)`,
                    borderRadius: '16px', border: '1.5px solid rgba(240,192,64,0.3)',
                    padding: mode === 'FULL' ? '20px' : '12px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: mode === 'FULL' ? 'repeat(6,1fr)' : 'repeat(3,1fr)',
                    gridAutoRows: mode === 'FULL' ? '90px' : '100px',
                    gap: mode === 'FULL' ? '12px' : '10px',
                    boxShadow: 'inset 0 0 24px rgba(0,0,0,0.95), 0 4px 15px rgba(0,0,0,0.5)',
                    alignContent: 'start',
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
                    const instanceId = item.instanceId || item.id;
                    const isSelected = selectedItems.has(instanceId);

                    return (
                        <div
                            key={instanceId + i}
                            style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box' }}
                            onContextMenu={(e) => !item.isResource && handleContextMenu(e, item, data, !!isEquippedOnCurrent)}
                            onClick={(e) => { if (e.shiftKey && !item.isResource) toggleSelectItem(instanceId, e); }}
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
                                    setGlobalHoveredItem?.(id, x, y);
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
                })}

                {/* Пустые слоты */}
                {Array.from({ length: Math.max(0, (mode === 'FULL' ? 18 : 9) - filteredItems.length) }).map((_, i) => (
                    <div key={'empty-' + i} style={{
                        background: 'radial-gradient(circle at 50% 50%,rgba(12,9,7,0.95) 0%,rgba(20,16,13,0.98) 100%)',
                        borderRadius: '12px', border: '1.5px solid rgba(240,192,64,0.12)',
                        boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: 'rgba(240,192,64,0.08)',
                        }} />
                    </div>
                ))}
            </div>

            {/* ══ КОНТЕКСТНОЕ МЕНЮ ════════════════════════════════════════════ */}
            {contextMenu && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        left: Math.min(contextMenu.x, window.innerWidth - 180),
                        top: Math.min(contextMenu.y, window.innerHeight - 160),
                        zIndex: 99999,
                        background: 'rgba(14,11,8,0.98)',
                        border: '1px solid rgba(240,192,64,0.3)',
                        borderRadius: '12px',
                        padding: '6px',
                        minWidth: '170px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
                    }}
                >
                    {/* Имя предмета */}
                    <div style={{
                        padding: '6px 10px 8px',
                        fontSize: '11px', fontWeight: 900, color: '#f0c040',
                        fontFamily: "'Cinzel', serif",
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        marginBottom: '4px',
                    }}>
                        {contextMenu.data?.name || contextMenu.item.id}
                    </div>

                    {/* Надеть / Снять */}
                    {!contextMenu.item.isResource && contextMenu.item.id !== 'season_chest' && (
                        <CtxBtn
                            icon={contextMenu.isEquipped ? '🔓' : '⚔️'}
                            label={contextMenu.isEquipped ? 'Снять' : 'Надеть'}
                            color="#f0c040"
                            onClick={() => {
                                onItemClick?.(contextMenu.item.instanceId || contextMenu.item.id);
                                closeContextMenu();
                            }}
                        />
                    )}

                    {/* Продать */}
                    {!contextMenu.item.isResource && !contextMenu.isEquipped && (
                        <CtxBtn
                            icon="🪙"
                            label={`Продать за ${getSellPrice(contextMenu.item).toLocaleString('ru-RU')}`}
                            color="#ef4444"
                            onClick={() => {
                                setConfirmData({
                                    isOpen: true, title: 'ПРОДАТЬ ПРЕДМЕТ',
                                    message: `Продать «${contextMenu.data?.name || contextMenu.item.id}» за ${getSellPrice(contextMenu.item).toLocaleString('ru-RU')} 🪙?`,
                                    variant: 'danger',
                                    onConfirm: () => sellItem(contextMenu.item.instanceId || contextMenu.item.id),
                                });
                                closeContextMenu();
                            }}
                        />
                    )}

                    {/* Выделить (для массовой продажи) */}
                    {!contextMenu.item.isResource && !contextMenu.isEquipped && (
                        <CtxBtn
                            icon="✅"
                            label={selectedItems.has(contextMenu.item.instanceId || contextMenu.item.id) ? 'Снять выделение' : 'Выделить для продажи'}
                            color="#c084fc"
                            onClick={() => {
                                const id = contextMenu.item.instanceId || contextMenu.item.id;
                                setSelectedItems(prev => {
                                    const next = new Set(prev);
                                    if (next.has(id)) next.delete(id); else next.add(id);
                                    return next;
                                });
                                closeContextMenu();
                            }}
                        />
                    )}

                    {/* Закрыть */}
                    <CtxBtn icon="✕" label="Закрыть" color="rgba(255,255,255,0.35)" onClick={closeContextMenu} />
                </div>
            )}

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
                onClose={() => { setIsOpening(false); setShowRewardCard(false); }}
            />
        </div>
    );
};

// ─── Context menu button ───────────────────────────────────────────────────────
const CtxBtn: React.FC<{ icon: string; label: string; color: string; onClick: () => void }> = ({ icon, label, color, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '8px 10px', borderRadius: '8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color, fontSize: '11px', fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            textAlign: 'left' as const, transition: 'background 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
        <span style={{ width: '16px', textAlign: 'center' }}>{icon}</span>
        <span>{label}</span>
    </button>
);
