import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { ShopItem } from '../../../../configs/ShopConfig';
import { BankItemShowcase } from './BankItemShowcase';
import { getRarityColor } from './shopHelpers';
import { resolveAssetPath } from '../../../../utils/assetPath';

const ItemSilhouette: React.FC<{ color: string; width: number | string; height: number | string }> = ({ color, width, height }) => (
    <div
        style={{
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 'auto',
            pointerEvents: 'none',
        }}
    >
        <svg
            width="60%"
            height="60%"
            viewBox="0 0 64 64"
            fill="none"
            style={{
                filter: `drop-shadow(0 0 15px ${color}88)`,
                opacity: 0.7,
                animation: 'pulse-silhouette-showcase 2s infinite ease-in-out',
            }}
        >
            <style>{`
                @keyframes pulse-silhouette-showcase {
                    0%, 100% { opacity: 0.45; transform: scale(0.95); }
                    50% { opacity: 0.85; transform: scale(1.05); }
                }
            `}</style>
            <path
                d="M32 6 L12 14 V32 C12 46.4 32 58 32 58 C32 58 52 46.4 52 32 V14 L32 6 Z"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="rgba(255, 255, 255, 0.05)"
            />
            <path
                d="M18 18 L46 46 M46 18 L18 46"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="32" cy="32" r="6" stroke={color} strokeWidth="2" fill="#151210" />
        </svg>
    </div>
);

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
    const [localImageError, setLocalImageError] = React.useState(false);
    const [retryCount, setRetryCount] = React.useState(0);
    const [imgSrc, setImgSrc] = React.useState('');

    React.useEffect(() => {
        setSelectedImageLoaded(false);
        setLocalImageError(false);
        setRetryCount(0);
        setImgSrc(resolveAssetPath(selectedItem.image));
    }, [selectedItem.id, selectedItem.image, setSelectedImageLoaded]);

    const handleImageError = () => {
        if (retryCount < 2) {
            setTimeout(() => {
                setRetryCount((prev) => prev + 1);
                setImgSrc(resolveAssetPath(selectedItem.image) + `?retry=${Date.now()}`);
            }, 1000);
        } else if (imgSrc.endsWith('.webp')) {
            setImgSrc(resolveAssetPath(selectedItem.image).replace(/\.webp$/i, '.png'));
            setRetryCount(3);
        } else {
            setLocalImageError(true);
        }
    };

    return (
        <motion.div
            drag={isMobile ? 'x' : undefined}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
                if (!isMobile) return;
                const swipeThreshold = 50;
                const selectedIndex = filteredItems.findIndex((i) => i.id === selectedItem?.id);
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
                flex: isMobile ? 1.0 : 1.4,
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
            {/* Inline CSS Animations to optimize and ensure presence */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes float-item {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes pulse-glow-showcase {
                    0%, 100% { opacity: 0.3; transform: scale(0.95); }
                    50% { opacity: 0.65; transform: scale(1.05); }
                }
            ` }} />

            {/* Decorative Vignette */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
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
                            width: '100%',
                            maxWidth: isMobile ? '340px' : '440px',
                            height: isMobile ? '240px' : '380px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Radial soft glow behind item */}
                        <div
                            style={{
                                position: 'absolute',
                                width: isMobile ? '280px' : '360px',
                                height: isMobile ? '280px' : '360px',
                                borderRadius: '50%',
                                background:
                                    'radial-gradient(circle, ' +
                                    getRarityColor(selectedItem.rarity) +
                                    '1a 0%, transparent 70%)',
                                animation: 'pulse-glow-showcase 4s infinite ease-in-out',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Floating Item Avatar (Large) */}
                        <div
                            style={{
                                zIndex: 5,
                                animation:
                                    isMobile ? undefined : (selectedItem.mainTab === 'SKINS' ? undefined : 'float-item 4s infinite ease-in-out'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0px',
                            }}
                        >
                            {selectedItem.spriteClass ? (
                                <div
                                    className={selectedItem.spriteClass}
                                    style={{
                                        width: isMobile ? '300px' : '340px',
                                        height: isMobile ? '300px' : '340px',
                                        filter: `contrast(1.2) brightness(1.2) drop-shadow(0 0 20px ${getRarityColor(selectedItem.rarity)}cc)`,
                                    }}
                                />
                            ) : (
                                <>
                                    {(!selectedImageLoaded || localImageError) && (
                                        <ItemSilhouette
                                            color={getRarityColor(selectedItem.rarity)}
                                            width={
                                                selectedItem.mainTab === 'SKINS'
                                                    ? isMobile
                                                        ? '320px'
                                                        : '380px'
                                                    : isMobile
                                                      ? '300px'
                                                      : '340px'
                                            }
                                            height={
                                                selectedItem.mainTab === 'SKINS'
                                                    ? isMobile
                                                        ? '320px'
                                                        : '380px'
                                                    : isMobile
                                                      ? '300px'
                                                      : '340px'
                                            }
                                        />
                                    )}
                                    {!localImageError && (
                                        <img
                                            src={imgSrc}
                                            onLoad={() => setSelectedImageLoaded(true)}
                                            onError={handleImageError}
                                            className={`image-fade-in ${selectedImageLoaded ? 'loaded' : ''}`}
                                            style={{
                                                width:
                                                    selectedItem.mainTab === 'SKINS'
                                                        ? isMobile
                                                            ? '320px'
                                                            : '380px'
                                                        : isMobile
                                                          ? '300px'
                                                          : '340px',
                                                height:
                                                    selectedItem.mainTab === 'SKINS'
                                                        ? isMobile
                                                            ? '320px'
                                                            : '380px'
                                                        : isMobile
                                                          ? '300px'
                                                          : '340px',
                                                objectFit: 'contain',
                                                objectPosition: 'center',
                                                filter: `contrast(1.1) brightness(1.15) drop-shadow(0 0 25px ${getRarityColor(selectedItem.rarity)}cc)`,
                                                display: selectedImageLoaded ? 'block' : 'none',
                                            }}
                                            alt=""
                                        />
                                    )}
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
                                backgroundColor: selectedItem.id === item.id ? '#f0c040' : 'rgba(255,255,255,0.2)',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: selectedItem.id === item.id ? '0 0 8px #f0c040, 0 0 3px #f0c040' : 'none',
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
