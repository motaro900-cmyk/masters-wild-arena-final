import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsMap } from '../../../configs/AssetsMap';
import { ResourceBar } from './ResourceBar';
import '../../styles/shop-scene.css';

import { ShopItem } from '../../../configs/ShopConfig';
import { useGameStore } from '../../../store/useGameStore';
import { ITEMS_DATABASE, calculateItemPower } from '../../../game/configs/ItemsConfig';

import { useShopScene } from './ShopScene/useShopScene';
import { SubTabBtn } from './ShopScene/SubTabBtn';
import { BankItemShowcase } from './ShopScene/BankItemShowcase';
import { ShopItemCard } from './ShopScene/ShopItemCard';
import { SidebarBtn } from './ShopScene/SidebarBtn';
import { PurchaseConfirmOverlay } from './ShopScene/PurchaseConfirmOverlay';
import { ShopDetailPanel } from './ShopScene/ShopDetailPanel';

import { getSubTabs, getRarityColor } from './ShopScene/shopHelpers';

export const ShopScene: React.FC = () => {
    const {
        activeMainTab,
        setActiveMainTab,
        activeSubTab,
        setActiveSubTab,
        selectedItem,
        setSelectedItem,
        showConfirm,
        setShowConfirm,
        toastMessage,
        filteredItems,
        isMobile,
        dailyAdWatchesCount,
        playerLevel,
        shopDiscounts,
        exitShop,
        handleItemClick,
        handleBuyTrigger,
        confirmPurchase,
    } = useShopScene();

    const equippedItems = useGameStore((state: any) => state.equippedItems);

    const itemPower = selectedItem ? calculateItemPower(selectedItem) : 0;
    const equippedItemId = selectedItem ? equippedItems?.[selectedItem.subTab] : null;
    const equippedItem = equippedItemId ? ITEMS_DATABASE[equippedItemId] : null;
    const equippedPower = equippedItem ? calculateItemPower(equippedItem) : 0;
    const powerDiff = itemPower - equippedPower;

    const ITEMS_PER_PAGE = 7;
    const [currentPage, setCurrentPage] = React.useState(0);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(0);
        }, 0);
        return () => clearTimeout(timer);
    }, [activeMainTab, activeSubTab]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                exitShop();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [exitShop]);

    const getSectionTitle = (main: string) => {
        switch (main) {
            case 'ARSENAL':
                return 'МАГАЗИН';
            case 'ALCHEMY':
                return 'АЛХИМИЯ';
            case 'SKINS':
                return 'ОБЛИКИ';
            case 'BANK':
                return 'БАНК';
            default:
                return 'МАГАЗИН';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: isMobile ? '100%' : '1920px',
                height: isMobile ? '100%' : '1080px',
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundImage: 'url("' + (isMobile ? AssetsMap.BACKGROUNDS.SHOP.replace('.webp', '_mobile.webp') : AssetsMap.BACKGROUNDS.SHOP) + '")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'rgba(10, 5, 5, 0.45)',
                backgroundBlendMode: 'multiply',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.85), inset 0 0 200px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pointerEvents: 'auto',
            }}
        >
            {/* HEADER BAR */}
            <div
                style={{
                    width: '100%',
                    height: isMobile ? '60px' : '110px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0 20px' : '0 80px',
                    pointerEvents: 'none',
                    borderBottom: '1px solid rgba(240, 192, 64, 0.1)',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
                    <button
                        onClick={exitShop}
                        style={{
                            background: 'rgba(240, 192, 64, 0.1)',
                            border: '1px solid rgba(240, 192, 64, 0.3)',
                            borderRadius: '50%',
                            width: isMobile ? '32px' : '44px',
                            height: isMobile ? '32px' : '44px',
                            color: '#f0c040',
                            fontSize: isMobile ? '14px' : '18px',
                            cursor: 'pointer',
                            marginRight: isMobile ? '10px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 0 10px rgba(240,192,64,0.1)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(240, 192, 64, 0.2)';
                            e.currentTarget.style.borderColor = '#f0c040';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(240, 192, 64, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(240, 192, 64, 0.3)';
                            e.currentTarget.style.color = '#f0c040';
                        }}
                    >
                        ◀
                    </button>
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            color: '#f0c040',
                            fontSize: isMobile ? '20px' : '40px',
                            textShadow: '0 0 20px #000, 0 4px 15px #000',
                            letterSpacing: '4px',
                            whiteSpace: 'nowrap',
                            textTransform: 'uppercase',
                            lineHeight: '1',
                        }}
                    >
                        {getSectionTitle(activeMainTab)}
                    </h2>
                </div>

                <ResourceBar
                    onOpenShop={(tab: string) => {
                        if (tab === 'ENERGY') {
                            setActiveMainTab('BANK');
                            setActiveSubTab('ENERGY');
                        } else {
                            setActiveMainTab('BANK');
                        }
                    }}
                />
            </div>

            {/* MAIN CONTENT SPLIT ROW */}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    padding: isMobile ? '10px 15px 5px 15px' : '20px 80px 10px 80px',
                    gap: isMobile ? '15px' : '40px',
                    maxHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 230px)',
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                {/* LEFT SIDEBAR (CATEGORY SELECTION) */}
                <div
                    style={{
                        width: isMobile ? '180px' : '320px',
                        background: 'rgba(10,8,8,0.85)',
                        borderRadius: '12px',
                        border: '2px solid rgba(240, 192, 64, 0.15)',
                        padding: isMobile ? '8px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <SidebarBtn
                            active={activeMainTab === 'ARSENAL'}
                            onClick={() => setActiveMainTab('ARSENAL')}
                            label="ЭКИПИРОВКА"
                            image={AssetsMap.UI.TAB_ARSENAL}
                            isMobile={isMobile}
                        />
                        <SidebarBtn
                            active={activeMainTab === 'ALCHEMY'}
                            onClick={() => setActiveMainTab('ALCHEMY')}
                            label="АЛХИМИЯ"
                            image={AssetsMap.UI.TAB_ALCHEMY}
                            isMobile={isMobile}
                        />
                        <SidebarBtn
                            active={activeMainTab === 'SKINS'}
                            onClick={() => setActiveMainTab('SKINS')}
                            label="ОБЛИКИ"
                            image={AssetsMap.UI.TAB_SKINS}
                            isMobile={isMobile}
                        />
                        <SidebarBtn
                            active={activeMainTab === 'BANK'}
                            onClick={() => setActiveMainTab('BANK')}
                            label="БАНК"
                            image={AssetsMap.UI.TAB_BANK}
                            isMobile={isMobile}
                        />
                    </div>

                    <div>
                        <button
                            onClick={exitShop}
                            style={{
                                width: '100%',
                                height: isMobile ? '32px' : '50px',
                                background: 'rgba(255,50,50,0.1)',
                                border: '1px solid rgba(255,50,50,0.3)',
                                borderRadius: '8px',
                                color: '#ff6666',
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                fontWeight: 900,
                                fontSize: isMobile ? '11px' : '15px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,50,50,0.2)';
                                e.currentTarget.style.borderColor = 'rgba(255,50,50,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,50,50,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255,50,50,0.3)';
                            }}
                        >
                            ВЕРНУТЬСЯ
                        </button>
                    </div>
                </div>

                {/* RIGHT ACTIONABLE AREA */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        minWidth: 0,
                        overflow: 'hidden',
                        paddingRight: '12px',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* SUB-TABS (ОРУЖИЕ, ЩИТЫ, etc) */}
                    <div
                        style={{
                            display: 'flex',
                            gap: isMobile ? '8px' : '15px',
                            borderBottom: '2px solid rgba(240,192,64,0.15)',
                            paddingBottom: isMobile ? '6px' : '10px',
                            alignItems: 'center',
                            overflowX: 'auto',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {getSubTabs(activeMainTab).map((tab) => (
                            <SubTabBtn
                                key={tab.id}
                                label={tab.label}
                                isActive={activeSubTab === tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                            />
                        ))}
                    </div>

                    {/* MAIN MIDDLE ROW (PEDESTAL & INSPECTION CARD) */}
                    {selectedItem ? (
                        <div style={{ flex: 1, display: 'flex', gap: isMobile ? '15px' : '30px', alignItems: 'stretch', minWidth: 0 }}>
                            {/* CENTRAL SHOWCASE PEDESTAL */}
                            <div
                                style={{
                                    flex: 1.4,
                                    background: 'rgba(15,12,12,0.6)',
                                    border: '1px solid rgba(240,192,64,0.1)',
                                    borderRadius: '16px',
                                    padding: isMobile ? '10px 15px' : '25px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Decorative Vignette */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
                                        pointerEvents: 'none',
                                    }}
                                />

                                {/* MIDDLE ROW: FLOATING PEDESTAL & ITEM */}
                                {selectedItem.mainTab === 'BANK' ? (
                                    <BankItemShowcase
                                        item={selectedItem}
                                        rarityColor={getRarityColor(selectedItem.rarity)}
                                        isMobile={isMobile}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            position: 'relative',
                                            flex: 1,
                                            marginTop: isMobile ? '-10px' : '-15px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                width: isMobile ? '220px' : '450px',
                                                height: isMobile ? '200px' : '400px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {/* Radial soft glow behind item */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    width: isMobile ? '200px' : '400px',
                                                    height: isMobile ? '200px' : '400px',
                                                    borderRadius: '50%',
                                                    background:
                                                        'radial-gradient(circle, ' +
                                                        getRarityColor(selectedItem.rarity) +
                                                        '22 0%, transparent 70%)',
                                                    animation: 'pulse-glow 4s infinite ease-in-out',
                                                }}
                                            />

                                            {/* Pedestal Platform Slab */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: isMobile ? '-10px' : '-15px',
                                                    width: isMobile ? '210px' : '420px',
                                                    height: isMobile ? '40px' : '88px',
                                                    borderRadius: '50%',
                                                    background:
                                                        'linear-gradient(180deg, rgba(35,30,30,0.96) 0%, rgba(10,5,5,0.98) 100%)',
                                                    border: (isMobile ? '1px solid ' : '2px solid ') + getRarityColor(selectedItem.rarity) + '88',
                                                    boxShadow: isMobile
                                                        ? '0 4px 10px rgba(0,0,0,0.8), 0 0 10px ' + getRarityColor(selectedItem.rarity) + '33'
                                                        : '0 8px 25px rgba(0,0,0,0.8), 0 0 15px ' + getRarityColor(selectedItem.rarity) + '33, inset 0 2px 4px rgba(255,255,255,0.15)',
                                                    transform: 'rotateX(65deg)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {/* Inner spinning element */}
                                                <div
                                                    style={{
                                                        width: isMobile ? '170px' : '340px',
                                                        height: isMobile ? '170px' : '340px',
                                                        borderRadius: '50%',
                                                        border: `1.5px dashed ${getRarityColor(selectedItem.rarity)}77`,
                                                        boxShadow: `inset 0 0 15px ${getRarityColor(selectedItem.rarity)}22`,
                                                        animation: 'spin-slow-reverse 12s infinite linear',
                                                    }}
                                                />
                                            </div>

                                            {/* Floating Item Avatar (Large) */}
                                            <div
                                                style={{
                                                    zIndex: 5,
                                                    animation: 'float-item 4s infinite ease-in-out',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: isMobile ? '20px' : '60px',
                                                }}
                                            >
                                                {selectedItem.spriteClass ? (
                                                    <div
                                                        className={selectedItem.spriteClass}
                                                        style={{
                                                            width: isMobile ? '140px' : '320px',
                                                            height: isMobile ? '140px' : '320px',
                                                            filter: `contrast(1.2) brightness(1.2) drop-shadow(0 0 20px ${getRarityColor(selectedItem.rarity)}cc)`,
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={selectedItem.image}
                                                        onError={(e) =>
                                                            (e.currentTarget.src = AssetsMap.UI.ICON_DAILY_CHEST)
                                                        }
                                                        style={{
                                                            width: isMobile ? '140px' : '320px',
                                                            height: isMobile ? '140px' : '320px',
                                                            objectFit: 'contain',
                                                            filter: `contrast(1.2) brightness(1.2) drop-shadow(0 0 20px ${getRarityColor(selectedItem.rarity)}cc)`,
                                                        }}
                                                        alt=""
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                 {/* Dot Indicators for Bottom Shelf items (usually 6) - Hidden on mobile to prevent layout clutter */}
                                 {!isMobile && (
                                     <div style={{ display: 'flex', gap: '8px', zIndex: 10, margin: '5px 0' }}>
                                         {filteredItems.map((item: ShopItem) => (
                                             <button
                                                 key={item.id}
                                                 onClick={() => setSelectedItem(item)}
                                                 style={{
                                                     width: '10px',
                                                     height: '10px',
                                                     minWidth: 'auto',
                                                     minHeight: 'auto',
                                                     borderRadius: '50%',
                                                     backgroundColor:
                                                         selectedItem.id === item.id ? '#f0c040' : 'rgba(255,255,255,0.2)',
                                                     border: 'none',
                                                     cursor: 'pointer',
                                                     padding: 0,
                                                     boxShadow:
                                                         selectedItem.id === item.id
                                                             ? '0 0 8px #f0c040, 0 0 3px #f0c040'
                                                             : 'none',
                                                     transition: 'all 0.2s',
                                                 }}
                                             />
                                         ))}
                                     </div>
                                 )}
                            </div>

                            {/* RIGHT SIDE DETAILED INSPECTION CARD */}
                            <ShopDetailPanel
                                selectedItem={selectedItem}
                                playerLevel={playerLevel}
                                shopDiscounts={shopDiscounts}
                                itemPower={itemPower}
                                equippedItem={equippedItem}
                                powerDiff={powerDiff}
                                handleBuyTrigger={handleBuyTrigger}
                                isMobile={isMobile}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255,255,255,0.4)',
                            }}
                        >
                            Нет доступных товаров в этой категории.
                        </div>
                    )}

                    {/* BOTTOM SHELF (PAGINATED GRID OF ITEMS) */}
                    {(() => {
                        const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
                        const startIndex = currentPage * ITEMS_PER_PAGE;
                        const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 16px',
                                    background: 'linear-gradient(90deg, rgba(30, 20, 15, 0.85) 0%, rgba(15, 10, 10, 0.6) 50%, rgba(30, 20, 15, 0.85) 100%)',
                                    border: '1px solid rgba(240, 192, 64, 0.25)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    textShadow: '0 2px 4px rgba(0,0,0,1)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(4px)',
                                }}>
                                    <span style={{ color: '#f0c040', letterSpacing: '1px' }}>
                                        КАТАЛОГ ТОВАРОВ {(activeMainTab === 'ARSENAL' || activeMainTab === 'ALCHEMY') && <span style={{ color: '#ffcc00', marginLeft: '15px', textShadow: '0 0 10px rgba(255,204,0,0.4), 0 2px 4px rgba(0,0,0,1)' }}>★ АКЦИИ И СКИДКИ ДНЯ ПОКАЗАНЫ ПЕРВЫМИ</span>}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
                                        СТРАНИЦА {currentPage + 1} ИЗ {totalPages || 1}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                                    {/* LEFT ARROW */}
                                    {totalPages > 1 && (
                                        <motion.button
                                            whileHover={currentPage !== 0 ? { scale: 1.1, borderColor: '#f0c040', boxShadow: '0 0 15px rgba(240,192,64,0.5)' } : {}}
                                            whileTap={currentPage !== 0 ? { scale: 0.95 } : {}}
                                            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                            style={{
                                                background:
                                                    currentPage === 0
                                                        ? 'rgba(255,255,255,0.01)'
                                                        : 'linear-gradient(180deg, rgba(45,35,25,0.8) 0%, rgba(20,15,10,0.95) 100%)',
                                                border:
                                                    currentPage === 0
                                                        ? '1.5px solid rgba(255,255,255,0.05)'
                                                        : '2px solid rgba(240, 192, 64, 0.5)',
                                                borderRadius: '50%',
                                                width: isMobile ? '32px' : '48px',
                                                height: isMobile ? '32px' : '48px',
                                                color: currentPage === 0 ? 'rgba(255,255,255,0.15)' : '#f0c040',
                                                fontSize: isMobile ? '14px' : '20px',
                                                cursor: currentPage === 0 ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: currentPage === 0 ? 'none' : '0 4px 10px rgba(0,0,0,0.5), 0 0 10px rgba(240,192,64,0.2)',
                                                transition: 'all 0.2s',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', transform: 'translateX(-1px)' }}>
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </motion.button>
                                    )}

                                    {/* ITEMS CONTAINER */}
                                    <div
                                        style={{
                                            flex: 1,
                                            height: isMobile ? '140px' : '210px',
                                            background: 'rgba(10,8,8,0.7)',
                                            border: '1px solid rgba(240,192,64,0.1)',
                                            borderRadius: '12px',
                                            padding: isMobile ? '6px 10px' : '12px 20px',
                                            display: 'flex',
                                            gap: isMobile ? '8px' : '12px',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {paginatedItems.map((item: ShopItem) => (
                                            <ShopItemCard
                                                key={item.id}
                                                item={item}
                                                isSelected={selectedItem?.id === item.id}
                                                playerLevel={playerLevel}
                                                discount={shopDiscounts?.[item.id]}
                                                onClick={() => handleItemClick(item)}
                                                isMobile={isMobile}
                                            />
                                        ))}
                                    </div>

                                    {/* RIGHT ARROW */}
                                    {totalPages > 1 && (
                                        <motion.button
                                            whileHover={currentPage !== totalPages - 1 ? { scale: 1.1, borderColor: '#f0c040', boxShadow: '0 0 15px rgba(240,192,64,0.5)' } : {}}
                                            whileTap={currentPage !== totalPages - 1 ? { scale: 0.95 } : {}}
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                                            disabled={currentPage === totalPages - 1}
                                            style={{
                                                background:
                                                    currentPage === totalPages - 1
                                                        ? 'rgba(255,255,255,0.01)'
                                                        : 'linear-gradient(180deg, rgba(45,35,25,0.8) 0%, rgba(20,15,10,0.95) 100%)',
                                                border:
                                                    currentPage === totalPages - 1
                                                        ? '1.5px solid rgba(255,255,255,0.05)'
                                                        : '2px solid rgba(240, 192, 64, 0.5)',
                                                borderRadius: '50%',
                                                width: isMobile ? '32px' : '48px',
                                                height: isMobile ? '32px' : '48px',
                                                color:
                                                    currentPage === totalPages - 1
                                                        ? 'rgba(255,255,255,0.15)'
                                                        : '#f0c040',
                                                fontSize: isMobile ? '14px' : '20px',
                                                cursor: currentPage === totalPages - 1 ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow:
                                                    currentPage === totalPages - 1
                                                        ? 'none'
                                                        : '0 4px 10px rgba(0,0,0,0.5), 0 0 10px rgba(240,192,64,0.2)',
                                                transition: 'all 0.2s',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', transform: 'translateX(1px)' }}>
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </motion.button>
                                    )}
                                </div>

                                {/* PAGE DOTS */}
                                {totalPages > 1 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            marginTop: '2px',
                                        }}
                                    >
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentPage(idx)}
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    minWidth: 'auto',
                                                    minHeight: 'auto',
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    backgroundColor:
                                                        idx === currentPage ? '#f0c040' : 'rgba(255,255,255,0.2)',
                                                    transition: 'all 0.2s',
                                                    boxShadow: idx === currentPage ? '0 0 8px #f0c040' : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* BOTTOM BAR WITH REFRESH TIMER & FOOTER BANNERS */}
            <div
                style={{
                    height: isMobile ? '40px' : '80px',
                    borderTop: '1px solid rgba(240, 192, 64, 0.1)',
                    background: 'rgba(5,5,5,0.9)',
                    padding: isMobile ? '0 20px' : '0 80px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10,
                }}
            >
                {/* Countdown timer & Manual Refresh Button */}
                <div style={{ color: '#8a7a6a', fontSize: '12px', fontStyle: 'italic' }}>
                    ✦ Все предметы доступны в полном объёме
                </div>
            </div>

            {/* CONFIRMATION OVERLAYS */}
            <AnimatePresence>
                {showConfirm && selectedItem && (
                    <PurchaseConfirmOverlay
                        item={selectedItem}
                        dailyAdWatchesCount={dailyAdWatchesCount || 0}
                        onCancel={() => setShowConfirm(false)}
                        onConfirm={confirmPurchase}
                    />
                )}
            </AnimatePresence>

            {/* TOAST MESSAGE */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'absolute',
                            top: '120px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(10,20,40,0.95)',
                            border: '1px solid #f59e0b',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: 700,
                            zIndex: 9999,
                            pointerEvents: 'none',
                            boxShadow: '0 0 20px rgba(245,158,11,0.4)',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
