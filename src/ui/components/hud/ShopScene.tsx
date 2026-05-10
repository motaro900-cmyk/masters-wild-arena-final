import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { ALL_SHOP_ITEMS, ShopItem } from '../../../configs/ShopConfig';

import { WEAPONS_DB, HELMS_DB, ARMOR_DB, SHIELDS_DB, IEquipmentStats } from '../../../game/configs/ItemsConfig';
import { audioService } from '../../../services/AudioService';

type MainTab = 'ARSENAL' | 'ALCHEMY' | 'BANK' | 'SKINS';
type SubTab = 'ALL' | 'WEAPONS' | 'HELMETS' | 'ARMOR' | 'SHIELDS' | 'POTIONS' | 'GOLD' | 'GEMS' | 'ENERGY';

/**
 * ShopScene (v6.2) - AAA Premium Storefront with Confirmation Modal
 */

const getRarityColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
        case 'COMMON': return '#a0a0a0';
        case 'RARE': return '#3b82f6';
        case 'EPIC': return '#a855f7';
        case 'MYTHIC': return '#ef4444';
        case 'LEGENDARY': return '#f59e0b';
        default: return '#fff';
    }
};

const getItemStats = (item: ShopItem): IEquipmentStats | null => {
    const id = String(item.id);
    if (item.subTab === 'WEAPONS') return WEAPONS_DB[id] || null;
    if (item.subTab === 'HELMETS') return HELMS_DB[id] || null;
    if (item.subTab === 'ARMOR') return ARMOR_DB[id] || null;
    if (item.subTab === 'SHIELDS') return SHIELDS_DB[id] || null;
    return null;
};

export const ShopScene: React.FC = () => {
    const {
        gold,
        crystals,
        energy,
        maxEnergy,
        addGold,
        addCrystals,
        addEnergy,
        inventory,
        equipWeapon,
        equipHelm,
        equipArmor,
        equipShield,
        equippedWeaponId,
        equippedHelmId,
        equippedArmorId,
        equippedShieldId,
        shopInitialTab,
        goToMainMenu
    } = useGameStore();

    const [activeMainTab, setActiveMainTab] = useState<MainTab>((shopInitialTab as MainTab) || 'ARSENAL');
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('ALL');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (shopInitialTab) {
            setActiveMainTab(shopInitialTab as MainTab);
        }
    }, [shopInitialTab]);

    useEffect(() => {
        setActiveSubTab('ALL');
    }, [activeMainTab]);

    const getSectionTitle = (main: MainTab) => {
        switch (main) {
            case 'ARSENAL': return 'ЭКИПИРОВКА';
            case 'ALCHEMY': return 'МАГИЧЕСКАЯ ЛАВКА';
            case 'SKINS': return 'ГАРДЕРОБ ГЕРОЯ';
            case 'BANK': return 'КОРОЛЕВСКИЙ БАНК';
            default: return 'МАГАЗИН';
        }
    };

    const filteredItems = ALL_SHOP_ITEMS.filter(item =>
        item.mainTab === activeMainTab &&
        (activeSubTab === 'ALL' || item.subTab === activeSubTab)
    );

    const handleEquip = (item: ShopItem) => {
        const id = String(item.id);
        if (item.subTab === 'WEAPONS') equipWeapon(id);
        else if (item.subTab === 'HELMETS') equipHelm(id);
        else if (item.subTab === 'ARMOR') equipArmor(id);
        else if (item.subTab === 'SHIELDS') equipShield(id);
    };

    const handleItemClick = (item: ShopItem) => {
        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        const itemInInventory = inventory.find((i: any) => String(i.id) === String(item.id));
        if (itemInInventory) {
            handleEquip(item);
            return;
        }
        setSelectedItem(item);
        setShowConfirm(true);
    };

    const confirmPurchase = (currency: 'gold' | 'gem') => {
        if (!selectedItem) return;
        const item = selectedItem;

        setIsProcessing(true);
        setShowConfirm(false);

        setTimeout(() => {
            const success = useGameStore.getState().buyItem(String(item.id), currency);
            
            if (success) {
                audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                // SPECIAL HANDLING FOR BANK (CURRENCY) ITEMS
                if (item.mainTab === 'BANK') {
                    const amount = item.amount || 0;
                    if (item.subTab === 'GOLD') addGold(amount);
                    else if (item.subTab === 'GEMS') addCrystals(amount);
                    else if (item.subTab === 'ENERGY') addEnergy(amount);
                }
            } else {
                audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            }

            setIsProcessing(false);
            setSelectedItem(null);
        }, 800);
    };


    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                width: '1920px', height: '1080px', position: 'fixed', top: 0, left: 0,
                backgroundImage: `url("${AssetsMap.BACKGROUNDS.SHOP}")`, backgroundSize: 'cover', backgroundPosition: 'center',
                zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
        >
            {/* TOP BAR: Title & Resources Area */}
            <div style={{
                width: '100%', height: '120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0 80px', pointerEvents: 'none'
            }}>
                {/* THE BIG TITLE */}
                <h2 style={{
                    margin: 0,
                    fontFamily: "'Cinzel', serif",
                    color: '#f0c040',
                    fontSize: '44px',
                    textShadow: '0 0 20px #000, 0 4px 15px #000, 0 0 40px rgba(240,192,64,0.3)',
                    letterSpacing: '4px',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    lineHeight: '1',
                    pointerEvents: 'auto'
                }}>
                    {getSectionTitle(activeMainTab)}
                </h2>

                {/* SHOP CURRENCY (Full Trio: Energy, Gold, Gems) */}
                <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
                    <ResourceBadge
                        value={`${energy}/${maxEnergy}`}
                        bg={AssetsMap.UI.BAR_ENERGY}
                        onPlusClick={() => {}}
                    />
                    <ResourceBadge
                        value={gold}
                        bg={AssetsMap.UI.BAR_GOLD}
                        onPlusClick={() => setActiveMainTab('BANK')}
                    />
                    <ResourceBadge
                        value={crystals}
                        bg={AssetsMap.UI.BAR_GEM}
                        onPlusClick={() => setActiveMainTab('BANK')}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, padding: '20px 80px 60px 80px', gap: '50px' }}>

                {/* SIDEBAR NAVIGATION */}
                <div style={{
                    width: '380px', height: '800px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '12px',
                    border: '2px solid rgba(240, 192, 64, 0.2)',
                    padding: '30px', display: 'flex', flexDirection: 'column',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute', top: '50px', left: '25px', right: '25px', bottom: '30px',
                        zIndex: 1,
                        display: 'flex', flexDirection: 'column', gap: '15px', padding: '40px 20px'
                    }}>
                        <SidebarBtn active={activeMainTab === 'ARSENAL'} onClick={() => setActiveMainTab('ARSENAL')} label="ЭКИПИРОВКА" image={AssetsMap.UI.TAB_ARSENAL} />
                        <SidebarBtn active={activeMainTab === 'ALCHEMY'} onClick={() => setActiveMainTab('ALCHEMY')} label="АЛХИМИЯ" image={AssetsMap.UI.TAB_ALCHEMY} />
                        <SidebarBtn active={activeMainTab === 'SKINS'} onClick={() => setActiveMainTab('SKINS')} label="ОБЛИКИ" image={AssetsMap.UI.TAB_SKINS} />
                        <SidebarBtn active={activeMainTab === 'BANK'} onClick={() => setActiveMainTab('BANK')} label="БАНК" image={AssetsMap.UI.TAB_BANK} />

                        <div style={{ marginTop: 'auto', padding: '0 10px' }}>
                            <button
                                onClick={goToMainMenu}
                                style={{
                                    width: '100%', height: '55px', background: 'rgba(255,50,50,0.1)',
                                    border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px',
                                    color: '#ff6666', fontFamily: "'Cinzel', serif", fontWeight: 900,
                                    fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            >
                                ВЕРНУТЬСЯ
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* SECTION HEADER & SUBTABS (v4.0 - Clean & Stable) */}
                    <div style={{
                        position: 'relative',
                        height: '60px',
                        borderBottom: '2px solid rgba(240,192,64,0.3)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {/* SUBTABS - LEFT ALIGNED */}
                        <div style={{
                            display: 'flex',
                            gap: '5px',
                            justifyContent: 'flex-start',
                            flex: 1
                        }}>
                            {getSubTabs(activeMainTab).map(tab => (
                                <SubTabBtn
                                    key={tab.id}
                                    active={activeSubTab === tab.id}
                                    onClick={() => setActiveSubTab(tab.id as SubTab)}
                                    label={tab.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ITEMS GRID WITH CUSTOM SCROLLBAR */}
                    <div
                        className="custom-scrollbar"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            paddingRight: '20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '30px',
                            alignContent: 'start',
                            maxHeight: '750px' // Hard limit to ensure scrollbar appears
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item) => (
                                <ShopItemCard
                                    key={String(item.id)}
                                    item={item}
                                    inventory={inventory}
                                    equippedWeaponId={equippedWeaponId}
                                    equippedHelmId={equippedHelmId}
                                    equippedArmorId={equippedArmorId}
                                    equippedShieldId={equippedShieldId}
                                    onBuy={() => handleItemClick(item)}
                                    onSelect={() => handleItemClick(item)}
                                    isProcessing={isProcessing}
                                    glowColor={getRarityColor(item.rarity)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION MODAL (v1.0) */}
            <AnimatePresence>
                {showConfirm && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 3000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '900px', height: '600px',
                                background: 'rgba(20,20,25,0.95)',
                                borderRadius: '24px',
                                border: `2px solid ${getRarityColor(selectedItem.rarity)}88`,
                                boxShadow: `0 0 50px ${getRarityColor(selectedItem.rarity)}33, inset 0 0 30px rgba(0,0,0,0.8)`,
                                display: 'flex', overflow: 'hidden', position: 'relative'
                            }}
                        >
                            {/* LEFT SIDE: PREVIEW */}
                            <div style={{
                                flex: 1, background: `radial-gradient(circle at center, ${getRarityColor(selectedItem.rarity)}22 0%, transparent 70%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                            }}>
                                <img
                                    src={selectedItem.image}
                                    style={{
                                        width: '400px', height: '400px', objectFit: 'contain',
                                        filter: (selectedItem.id.toString().includes('starter') || ['pan', 'stick', 'broken_sword', 'rusty_dagger', 'sling', 'bandana', 'ragged_tunic', 'dented_buckler', 'iron_helm', 'forest_hood', 'bone_mask', 'chainmail', 'spiked_leather', 'hunter_furs', 'steel_shield', 'bone_shield', 'plank_shield'].includes(selectedItem.id.toString())) ? 'url(#remove-white)' : 'none'
                                    }}
                                    alt=""
                                />

                                <div style={{ position: 'absolute', top: '30px', left: '30px' }}>
                                    <div style={{ padding: '5px 15px', background: getRarityColor(selectedItem.rarity), borderRadius: '4px', fontSize: '12px', fontWeight: 900, color: '#fff', fontFamily: "'Cinzel', serif" }}>
                                        {selectedItem.rarity}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: INFO */}
                            <div style={{ flex: 1.2, padding: '50px', display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#fff', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>{selectedItem.name}</h2>
                                <p style={{ color: '#c8a870', fontSize: '18px', margin: '0 0 30px 0', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>{selectedItem.desc}</p>

                                {/* STATS AREA */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {(() => {
                                        const stats = getItemStats(selectedItem);
                                        if (!stats) return <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Этот предмет не дает прямых боевых бонусов.</p>;
                                        return (
                                            <>
                                                {stats.attackBonus && <StatItem label="АТАКА" value={stats.attackBonus} icon="⚔️" color="#f97316" />}
                                                {stats.defenseBonus && <StatItem label="ЗАЩИТА" value={stats.defenseBonus} icon="🛡️" color="#3b82f6" />}
                                                {stats.hpBonus && <StatItem label="ЗДОРОВЬЕ" value={stats.hpBonus} icon="❤️" color="#ef4444" />}
                                                {stats.critBonus && <StatItem label="КРИТ" value={`${Math.round(stats.critBonus * 100)}%`} icon="🎯" color="#a855f7" />}
                                                {stats.speedBonus && <StatItem label="СКОРОСТЬ" value={stats.speedBonus > 0 ? `+${stats.speedBonus}` : stats.speedBonus} icon="⚡" color="#fcd34d" />}
                                            </>
                                        );
                                    })()}
                                </div>

                                {selectedItem.flavor && (
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontStyle: 'italic', margin: '20px 0' }}>
                                        "{selectedItem.flavor}"
                                    </p>
                                )}

                                {/* ACTION BUTTONS */}
                                <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        style={{ flex: 1, height: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontWeight: 900, cursor: 'pointer', fontFamily: "'Cinzel', serif" }}
                                    >
                                        ОТМЕНА
                                    </button>
                                    {selectedItem.priceGold !== undefined && (
                                        <button
                                            onClick={() => confirmPurchase('gold')}
                                            style={{
                                                flex: 1.5, height: '60px',
                                                background: 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)',
                                                border: 'none', borderRadius: '8px',
                                                color: '#1a0f00', fontWeight: 900, fontSize: '20px',
                                                cursor: 'pointer', fontFamily: "'Cinzel', serif",
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                            }}
                                        >
                                            {selectedItem.priceGold}
                                            <img src={AssetsMap.UI.ICON_GOLD_FULL} style={{ width: 25 }} alt="" />
                                        </button>
                                    )}
                                    {selectedItem.priceGem !== undefined && (
                                        <button
                                            onClick={() => confirmPurchase('gem')}
                                            style={{
                                                flex: 1.5, height: '60px',
                                                background: 'linear-gradient(180deg, #00ffff 0%, #008888 100%)',
                                                border: 'none', borderRadius: '8px',
                                                color: '#000', fontWeight: 900, fontSize: '20px',
                                                cursor: 'pointer', fontFamily: "'Cinzel', serif",
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                            }}
                                        >
                                            {selectedItem.priceGem}
                                            <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: 25 }} alt="" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const StatItem: React.FC<{ label: string, value: any, icon: string, color: string }> = ({ label, value, icon, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '20px', width: '30px' }}>{icon}</span>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 800 }}>{label}</span>
                <span style={{ color: color, fontSize: '14px', fontWeight: 900 }}>{value}</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                <motion.div
                    initial={{ width: 0 }} animate={{ width: '60%' }}
                    style={{ height: '100%', background: color, borderRadius: '2px', boxShadow: `0 0 10px ${color}aa` }}
                />
            </div>
        </div>
    </div>
);

const SidebarBtn: React.FC<{ active: boolean, onClick: () => void, label: string, image: string }> = ({ active, onClick, label, image }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ x: 5, color: '#fff' }}
        style={{
            width: '100%', height: '80px', background: 'transparent',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: '10px', gap: '15px',
            position: 'relative', zIndex: 10,
            color: active ? '#ffd700' : '#c8a870',
            fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: '18px',
            letterSpacing: '1px', textTransform: 'uppercase',
            borderLeft: active ? '3px solid #f0c040' : '3px solid transparent',
            transition: 'all 0.3s'
        }}
    >
        <div style={{
            width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden',
            boxShadow: active ? '0 0 15px rgba(240,192,64,0.4)' : 'none',
            border: active ? '1px solid #f0c040' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s'
        }}>
            <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: active ? 'none' : 'grayscale(0.5) brightness(0.7)' }} alt="" />
        </div>
        {label}
    </motion.button>
);

const getSubTabs = (main: MainTab) => {
    switch (main) {
        case 'ARSENAL': return [{ id: 'ALL', label: 'ВСЁ' }, { id: 'WEAPONS', label: 'ОРУЖИЕ' }, { id: 'HELMETS', label: 'ШЛЕМЫ' }, { id: 'ARMOR', label: 'БРОНЯ' }, { id: 'SHIELDS', label: 'ЩИТЫ' }];
        case 'ALCHEMY': return [{ id: 'ALL', label: 'ВСЁ' }, { id: 'POTIONS', label: 'ЗЕЛЬЯ' }];
        case 'BANK': return [
            { id: 'ALL', label: 'ВСЁ' },
            { id: 'GOLD', label: 'ЗОЛОТО' },
            { id: 'GEMS', label: 'АЛМАЗЫ' },
            { id: 'ENERGY', label: 'ЭНЕРГИЯ' }
        ];
        case 'SKINS': return [{ id: 'ALL', label: 'ОБЛИКИ' }];
        default: return [];
    }
};

interface ShopItemCardProps {
    item: ShopItem;
    inventory: any[];
    equippedWeaponId: string | null;
    equippedHelmId: string | null;
    equippedArmorId: string | null;
    equippedShieldId: string | null;
    onBuy: () => void;
    onSelect: () => void;
    isProcessing: boolean;
    glowColor: string;
}

const ShopItemCard = React.forwardRef((props: ShopItemCardProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const { item, inventory, equippedWeaponId, equippedHelmId, equippedArmorId, equippedShieldId, onBuy, onSelect, isProcessing, glowColor } = props;
    const isEquipped =
        (item.subTab === 'WEAPONS' && String(item.id) === String(equippedWeaponId)) ||
        (item.subTab === 'HELMETS' && String(item.id) === String(equippedHelmId)) ||
        (item.subTab === 'ARMOR' && String(item.id) === String(equippedArmorId)) ||
        (item.subTab === 'SHIELDS' && String(item.id) === String(equippedShieldId));

    const getItemValueDisplay = () => {
        if (item.mainTab === 'BANK') {
            const icon = item.subTab === 'GOLD' ? '🪙' : item.subTab === 'GEMS' ? '💎' : '⚡';
            return `+${(item.amount || 0).toLocaleString()} ${icon}`;
        }
        if (item.mainTab === 'ALCHEMY') {
            // Short version for the badge
            if (item.id === 'p1') return '+500 HP';
            if (item.id === 'p2') return '+10% АТК';
            if (item.id === 'p3') return '+15% ЗАЩ';
            if (item.id === 'p4') return '+20% КРИТ';
            if (item.id === 'p5') return '+15% СКОР';
            return 'BUFF';
        }
        const stats = getItemStats(item);
        if (stats) {
            if (stats.attackBonus) return `+${stats.attackBonus} АТК`;
            if (stats.defenseBonus) return `+${stats.defenseBonus} ЗАЩ`;
        }
        return null;
    };

    const valueDisplay = getItemValueDisplay();

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            whileHover={{ y: -10, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
            onClick={onSelect}
            style={{
                width: '220px', height: '340px',
                backgroundImage: `url("${AssetsMap.BACKGROUNDS.SHOP_ITEM_FRAME}")`, backgroundSize: '100% 100%',
                padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative',
                background: `radial-gradient(circle at center, rgba(45, 45, 60, 0.8) 0%, rgba(10, 10, 15, 0.95) 100%)`,
                border: `1px solid ${glowColor}33`, borderRadius: '12px',
                boxShadow: `0 8px 20px rgba(0,0,0,0.6), 0 0 10px ${glowColor}11`,
                cursor: 'pointer', overflow: 'hidden'
            }}
        >
            {valueDisplay && (
                <div style={{ 
                    position: 'absolute', top: '12px', left: '12px', zIndex: 10,
                    background: 'rgba(0,0,0,0.85)', border: `1px solid ${glowColor}aa`,
                    padding: '4px 10px', borderRadius: '4px',
                    color: '#fff', fontSize: '10px', fontWeight: 900, fontFamily: "'Cinzel', serif",
                    boxShadow: `0 0 12px ${glowColor}66`,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    textShadow: '0 0 5px rgba(0,0,0,0.5)',
                    maxWidth: '85px', textAlign: 'center'
                }}>
                    {valueDisplay}
                </div>
            )}
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${glowColor}11 0%, transparent 50%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: `linear-gradient(135deg, ${glowColor}dd, ${glowColor}88)`, borderRadius: '3px', boxShadow: `0 0 8px ${glowColor}66`, border: '1px solid rgba(255,255,255,0.3)', zIndex: 10 }}>
                <div style={{ width: '4px', height: '4px', backgroundColor: '#fff', transform: 'rotate(45deg)', boxShadow: '0 0 5px #fff' }} />
                <span style={{ fontSize: '9px', color: '#fff', fontFamily: "'Cinzel', serif", fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.rarity}</span>
            </div>
            <div style={{ width: '150px', height: '150px', marginTop: '10px', backgroundImage: `url("${AssetsMap.BACKGROUNDS.SHOP_GRID_FRAME}")`, backgroundSize: '100% 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `radial-gradient(circle, ${glowColor}55 0%, rgba(10,10,15,0.9) 100%)`, boxShadow: `inset 0 0 20px ${glowColor}33, 0 0 15px rgba(0,0,0,0.5)`, border: `1px solid ${glowColor}44`, borderRadius: '8px', overflow: 'hidden' }}>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', width: '120px', height: '120px', background: `radial-gradient(circle, ${glowColor}66 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(10px)' }} />
                <img src={item.image} style={{ width: '135px', height: '135px', objectFit: 'contain', zIndex: 2, filter: `contrast(1.2) brightness(1.15) saturate(1.2) drop-shadow(0 0 5px ${glowColor}aa) drop-shadow(0 4px 8px rgba(0,0,0,0.8))` }} alt="" />
            </div>
            <h3 style={{ fontFamily: "'Cinzel', serif", color: '#f0f0f0', fontSize: '15px', textAlign: 'center', margin: '15px 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px', height: '40px', display: 'flex', alignItems: 'center' }}>{item.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: 'auto', width: '100%', paddingBottom: '5px' }}>
                {item.priceGold !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#f0c040', fontFamily: "'Cinzel', serif", textShadow: '0 0 10px rgba(240,192,64,0.3)' }}>{item.priceGold}</span>
                        <img src={AssetsMap.UI.ICON_GOLD_FULL} style={{ width: 22 }} alt="" />
                    </div>
                )}
                {item.priceGem !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#00ffff', fontFamily: "'Cinzel', serif", textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>{item.priceGem}</span>
                        <img src={AssetsMap.UI.ICON_ALMAZ_FULL} style={{ width: 22 }} alt="" />
                    </div>
                )}
            </div>
            <motion.button
                onClick={(e) => { e.stopPropagation(); onBuy(); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                style={{ marginTop: '10px', width: '100%', height: '38px', background: 'linear-gradient(180deg, #f0c040 0%, #a67c00 100%)', border: '1px solid #ffdf00', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontWeight: 900, color: '#1a0f00', fontSize: '13px', boxShadow: '0 4px 8px rgba(0,0,0,0.4)', textTransform: 'uppercase', position: 'relative', overflow: 'hidden' }}
            >
                <motion.div animate={{ left: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }} style={{ position: 'absolute', top: 0, width: '30px', height: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-25deg)' }} />
                {isProcessing ? '...' : (inventory.some(i => String(i.id) === String(item.id)) ? (isEquipped ? 'OK' : 'ЭКИПИРОВАТЬ') : 'КУПИТЬ')}
            </motion.button>
        </motion.div>
    );
});

const SubTabBtn: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
    <div style={{ position: 'relative', width: '180px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.button
            onClick={onClick}
            whileHover={{ y: -2 }}
            style={{
                width: '100%', height: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative', zIndex: 10,
                color: active ? '#ffd700' : '#e0d0b0',
                fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: '15px', textTransform: 'uppercase',
                textShadow: active
                    ? '0px 1px 2px #000, 0px -1px 2px #000, 1px 0px 2px #000, -1px 0px 2px #000, 0 0 15px rgba(240,192,64,0.8)'
                    : '0px 1px 2px #000, 0px -1px 2px #000, 1px 0px 2px #000, -1px 0px 2px #000',
                letterSpacing: '1px',
                transition: 'all 0.3s'
            }}
        >
            {label}
        </motion.button>
        {active && (
            <motion.div
                layoutId="activeSubTab"
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url("${AssetsMap.BACKGROUNDS.SHOP_BANNER_RED}")`,
                    backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                    zIndex: 5, filter: 'brightness(1.3) drop-shadow(0 0 20px rgba(255,0,0,0.5))',
                }}
            />
        )}
    </div>
);

const ResourceBadge: React.FC<{ value: number | string, bg: string, onPlusClick: () => void }> = ({ value, bg, onPlusClick }) => (
    <div style={{
        width: '170px', height: '38px', position: 'relative', display: 'flex', alignItems: 'center'
    }}>
        <img src={bg} style={{ position: 'absolute', width: '100%', height: '100%' }} alt="" />
        <span style={{
            color: '#fff', fontSize: '15px', fontWeight: 900, flex: 1, textAlign: 'center',
            fontFamily: "'Cinzel', serif", textShadow: '0 1px 3px #000', position: 'relative', zIndex: 2,
            paddingLeft: '35px', paddingRight: '35px'
        }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <div
            onClick={onPlusClick}
            style={{
                position: 'absolute', right: '0',
                width: '45px', height: '100%', cursor: 'pointer',
                zIndex: 3
            }}
        />
    </div>
);

