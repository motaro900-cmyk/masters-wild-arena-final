import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { ShopItem } from '../../../../configs/ShopConfig';
import { BankItemShowcase } from './BankItemShowcase';
import { getRarityColor } from './shopHelpers';

interface ShopShowcasePanelProps {
    selectedItem: ShopItem;
    filteredItems: ShopItem[];
    isMobile: boolean;
    handleItemClick: (item: ShopItem) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    setDirection: (dir: number) => void;
    setSelectedItem: (item: ShopItem) => void;
    selectedImageLoaded: boolean;
    setSelectedImageLoaded: (loaded: boolean) => void;
    ITEMS_PER_PAGE: number;
}

export const ShopShowcasePanel: React.FC<ShopShowcasePanelProps> = ({
    selectedItem,
    filteredItems,
    isMobile,
    handleItemClick,
    currentPage,
    setCurrentPage,
    setDirection,
    setSelectedItem,
    selectedImageLoaded,
    setSelectedImageLoaded,
    ITEMS_PER_PAGE,
}) => {
    return (
        <motion.div
            drag={isMobile ? "x" : undefined}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
                if (!isMobile) return;
                const swipeThreshold = 50;
                const selectedIndex = filteredItems.findIndex(i => i.id === selectedItem?.id);
                if (selectedIndex === -1) return;

                if (info.offset.x < -swipeThreshold) {
                    // Swipe Left -> Next Item
                    if (selectedIndex < filteredItems.length - 1) {
                        const nextItem = filteredItems[selectedIndex + 1];
                        handleItemClick(nextItem);
                        const nextItemPage = Math.floor((selectedIndex + 1) / ITEMS_PER_PAGE);
                        if (nextItemPage !== currentPage) {
                            setDirection(1);
                            setCurrentPage(nextItemPage);
                        }
                    }
                } else if (info.offset.x > swipeThreshold) {
                    // Swipe Right -> Previous Item
                    if (selectedIndex > 0) {
                        const prevItem = filteredItems[selectedIndex - 1];
                        handleItemClick(prevItem);
                        const prevItemPage = Math.floor((selectedIndex - 1) / ITEMS_PER_PAGE);
                        if (prevItemPage !== currentPage) {
                            setDirection(-1);
                            setCurrentPage(prevItemPage);
                        }
                    }
                }
            }}
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
                touchAction: isMobile ? 'pan-y' : 'auto',
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
                            width: isMobile ? '360px' : '380px',
                            height: isMobile ? '320px' : '340px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Radial soft glow behind item */}
                        <div
                            style={{
                                position: 'absolute',
                                width: isMobile ? '320px' : '320px',
                                height: isMobile ? '320px' : '320px',
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
                                bottom: isMobile ? '-12px' : '-15px',
                                width: isMobile ? '340px' : '340px',
                                height: isMobile ? '70px' : '76px',
                                borderRadius: '50%',
                                background:
                                    'linear-gradient(180deg, rgba(35,30,30,0.96) 0%, rgba(10,5,5,0.98) 100%)',
                                border:
                                    (isMobile ? '1px solid ' : '2px solid ') +
                                    getRarityColor(selectedItem.rarity) +
                                    '88',
                                boxShadow: isMobile
                                    ? '0 4px 10px rgba(0,0,0,0.8), 0 0 10px ' +
                                      getRarityColor(selectedItem.rarity) +
                                      '33'
                                    : '0 8px 25px rgba(0,0,0,0.8), 0 0 15px ' +
                                      getRarityColor(selectedItem.rarity) +
                                      '33, inset 0 2px 4px rgba(255,255,255,0.15)',
                                transform: 'rotateX(65deg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {/* Inner spinning element */}
                            <div
                                style={{
                                    width: isMobile ? '280px' : '280px',
                                    height: isMobile ? '280px' : '280px',
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
                                animation: selectedItem.mainTab === 'SKINS' ? undefined : 'float-item 4s infinite ease-in-out',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                marginBottom: selectedItem.mainTab === 'SKINS'
                                    ? (isMobile ? '10px' : '14px')
                                    : (isMobile ? '35px' : '45px'),
                            }}
                        >
                            {selectedItem.spriteClass ? (
                                <div
                                    className={selectedItem.spriteClass}
                                    style={{
                                        width: isMobile ? '300px' : '260px',
                                        height: isMobile ? '300px' : '260px',
                                        filter: `contrast(1.2) brightness(1.2) drop-shadow(0 0 20px ${getRarityColor(selectedItem.rarity)}cc)`,
                                    }}
                                />
                            ) : (
                                <>
                                    {!selectedImageLoaded && <div className="skeleton-placeholder" />}
                                    <img
                                        src={selectedItem.image}
                                        onLoad={() => setSelectedImageLoaded(true)}
                                        onError={(e) =>
                                            (e.currentTarget.src = AssetsMap.UI.ICON_DAILY_CHEST)
                                        }
                                        className={`image-fade-in ${selectedImageLoaded ? 'loaded' : ''}`}
                                        style={{
                                            width: selectedItem.mainTab === 'SKINS'
                                                ? (isMobile ? '340px' : '320px')
                                                : (isMobile ? '300px' : '260px'),
                                            height: selectedItem.mainTab === 'SKINS'
                                                ? (isMobile ? '340px' : '320px')
                                                : (isMobile ? '300px' : '260px'),
                                            objectFit: 'contain',
                                            objectPosition: selectedItem.mainTab === 'SKINS' ? 'bottom center' : 'center',
                                            filter: `contrast(1.1) brightness(1.15) drop-shadow(0 0 25px ${getRarityColor(selectedItem.rarity)}cc)`,
                                        }}
                                        alt=""
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Dot Indicators for Bottom Shelf items (usually 6) */}
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
                                    selectedItem.id === item.id
                                        ? '#f0c040'
                                        : 'rgba(255,255,255,0.2)',
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
        </motion.div>
    );
};
export default ShopShowcasePanel;
