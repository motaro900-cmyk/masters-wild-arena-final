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
import { SidebarBtn } from './ShopScene/SidebarBtn';
import { PurchaseConfirmOverlay } from './ShopScene/PurchaseConfirmOverlay';
import { ShopDetailPanel } from './ShopScene/ShopDetailPanel';
import { PurchaseSuccessModal } from './ShopScene/PurchaseSuccessModal';
import { getSubTabs } from './ShopScene/shopHelpers';

// Import subcomponents
import { ShopShowcasePanel } from './ShopScene/ShopShowcasePanel';
import { ShopBottomShelf } from './ShopScene/ShopBottomShelf';

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
        isMobile: isMobileFromStore,
        playerLevel,
        shopDiscounts,
        exitShop,
        handleItemClick,
        handleBuyTrigger,
        confirmPurchase,
        successModal,
        setSuccessModal,
        dailyAdWatchesCount,
    } = useShopScene();

    const [isMobile, setIsMobile] = React.useState(isMobileFromStore);
    const [selectedImageLoaded, setSelectedImageLoaded] = React.useState(false);

    React.useEffect(() => {
        setSelectedImageLoaded(false);
    }, [selectedItem?.id, selectedItem?.image]);

    React.useEffect(() => {
        const checkLayout = () => {
            const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
            setIsMobile(isMobileFromStore || isSmallScreen);
        };
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, [isMobileFromStore]);

    const equippedItems = useGameStore((state: any) => state.heroEquipment?.[state.selectedHeroId || 'panda'] || {});

    const itemPower = selectedItem ? calculateItemPower(selectedItem) : 0;
    const equippedItemId = selectedItem ? equippedItems?.[selectedItem.subTab] : null;
    const equippedItem = equippedItemId ? ITEMS_DATABASE[equippedItemId] : null;
    const equippedPower = equippedItem ? calculateItemPower(equippedItem) : 0;
    const powerDiff = itemPower - equippedPower;

    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = React.useState(0);
    const [direction, setDirection] = React.useState(0);

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
                backgroundImage:
                    'url("' +
                    (isMobile
                        ? AssetsMap.BACKGROUNDS.SHOP.replace('.webp', '_mobile.webp')
                        : AssetsMap.BACKGROUNDS.SHOP) +
                    '")',
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
                    position: 'relative',
                    zIndex: 10000,
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
                            borderRadius: '12px',
                            width: isMobile ? '44px' : '54px',
                            height: isMobile ? '44px' : '54px',
                            color: '#f0c040',
                            fontSize: isMobile ? '16px' : '22px',
                            cursor: 'pointer',
                            marginRight: isMobile ? '12px' : '20px',
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
                    maxHeight: isMobile ? 'calc(100% - 120px)' : 'calc(100% - 230px)',
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                {/* LEFT SIDEBAR (CATEGORY SELECTION) */}
                <div
                    style={{
                        width: isMobile ? '210px' : '320px',
                        background: 'rgba(10,8,8,0.85)',
                        borderRadius: '12px',
                        border: '2px solid rgba(240, 192, 64, 0.15)',
                        padding: isMobile ? '8px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
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
                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                        <div
                            className="no-scrollbar"
                            style={{
                                display: 'flex',
                                gap: isMobile ? '8px' : '15px',
                                borderBottom: 'none',
                                paddingBottom: isMobile ? '6px' : '10px',
                                alignItems: 'center',
                                overflowX: 'auto',
                                whiteSpace: 'nowrap',
                                scrollbarWidth: 'none',
                            }}
                        >
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            {getSubTabs(activeMainTab).map((tab) => (
                                <SubTabBtn
                                    key={tab.id}
                                    label={tab.label}
                                    isActive={activeSubTab === tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    isMobile={isMobile}
                                />
                            ))}
                        </div>
                        {isMobile && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: '6px',
                                width: '35px',
                                background: 'linear-gradient(to right, rgba(10,8,8,0) 0%, rgba(10,8,8,0.95) 100%)',
                                pointerEvents: 'none',
                                zIndex: 10,
                            }} />
                        )}
                    </div>

                    {/* MAIN MIDDLE ROW (PEDESTAL & INSPECTION CARD) */}
                    {selectedItem ? (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                gap: isMobile ? '15px' : '30px',
                                alignItems: 'stretch',
                                minWidth: 0,
                            }}
                        >
                            {/* CENTRAL SHOWCASE PEDESTAL */}
                            <ShopShowcasePanel
                                selectedItem={selectedItem}
                                filteredItems={filteredItems}
                                isMobile={isMobile}
                                handleItemClick={handleItemClick}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                setDirection={setDirection}
                                setSelectedItem={setSelectedItem}
                                selectedImageLoaded={selectedImageLoaded}
                                setSelectedImageLoaded={setSelectedImageLoaded}
                                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                            />

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
                                justifyCenter: 'center',
                                color: 'rgba(255,255,255,0.4)',
                            }}
                        >
                            Нет доступных товаров в этой категории.
                        </div>
                    )}

                    {/* BOTTOM SHELF (PAGINATED GRID OF ITEMS) */}
                    {selectedItem && (
                        <ShopBottomShelf
                            isMobile={isMobile}
                            activeMainTab={activeMainTab}
                            activeSubTab={activeSubTab}
                            filteredItems={filteredItems}
                            selectedItem={selectedItem}
                            playerLevel={playerLevel}
                            shopDiscounts={shopDiscounts}
                            handleItemClick={handleItemClick}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            direction={direction}
                            setDirection={setDirection}
                            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                        />
                    )}
                </div>
            </div>

            {/* OVERLAYS & MODALS */}
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

            <PurchaseSuccessModal
                isOpen={!!successModal}
                itemName={successModal?.itemName || ''}
                crystalsAmount={successModal?.crystalsAmount || 0}
                onClose={() => setSuccessModal(null)}
            />

            {/* TOAST MESSAGE */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
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

export default ShopScene;
