import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopItem } from '../../../../configs/ShopConfig';
import { ShopItemCard } from './ShopItemCard';

interface ShopBottomShelfProps {
    isMobile: boolean;
    activeMainTab: string;
    activeSubTab: string;
    filteredItems: ShopItem[];
    selectedItem: ShopItem;
    playerLevel: number;
    shopDiscounts: any;
    handleItemClick: (item: ShopItem) => void;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    direction: number;
    setDirection: React.Dispatch<React.SetStateAction<number>>;
    ITEMS_PER_PAGE: number;
}

export const ShopBottomShelf: React.FC<ShopBottomShelfProps> = ({
    isMobile,
    activeMainTab,
    filteredItems,
    selectedItem,
    playerLevel,
    shopDiscounts,
    handleItemClick,
    currentPage,
    setCurrentPage,
    direction,
    setDirection,
    ITEMS_PER_PAGE,
}) => {
    const itemsPerPage = isMobile ? 2 : ITEMS_PER_PAGE;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    // Reset page if it exceeds totalPages
    React.useEffect(() => {
        if (currentPage >= totalPages && totalPages > 0) {
            setCurrentPage(0);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 16px',
                    background:
                        'linear-gradient(90deg, rgba(30, 20, 15, 0.85) 0%, rgba(15, 10, 10, 0.6) 50%, rgba(30, 20, 15, 0.85) 100%)',
                    border: '1px solid rgba(240, 192, 64, 0.25)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    textShadow: '0 2px 4px rgba(0,0,0,1)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(4px)',
                }}
            >
                <span style={{ color: '#f0c040', letterSpacing: '1px' }}>
                    КАТАЛОГ ТОВАРОВ{' '}
                    {(activeMainTab === 'ARSENAL' || activeMainTab === 'ALCHEMY') && (
                        <span
                            style={{
                                color: '#ffcc00',
                                marginLeft: '15px',
                                textShadow: '0 0 10px rgba(255,204,0,0.4), 0 2px 4px rgba(0,0,0,1)',
                            }}
                        >
                            ★ АКЦИИ И СКИДКИ
                        </span>
                    )}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
                    СТРАНИЦА {currentPage + 1} ИЗ {totalPages || 1}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0px' : '15px', width: '100%' }}>
                {/* LEFT ARROW (Desktop only) */}
                {totalPages > 1 && !isMobile && (
                    <motion.button
                        whileHover={
                            currentPage !== 0
                                ? {
                                      scale: 1.1,
                                      borderColor: '#f0c040',
                                      boxShadow: '0 0 15px rgba(240,192,64,0.5)',
                                  }
                                : {}
                        }
                        whileTap={currentPage !== 0 ? { scale: 0.95 } : {}}
                        onClick={() => {
                            setDirection(-1);
                            setCurrentPage((prev) => Math.max(0, prev - 1));
                        }}
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
                            width: '48px',
                            height: '48px',
                            minWidth: 'unset',
                            minHeight: 'unset',
                            color: currentPage === 0 ? 'rgba(255,255,255,0.15)' : '#f0c040',
                            fontSize: '20px',
                            cursor: currentPage === 0 ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow:
                                currentPage === 0
                                    ? 'none'
                                    : '0 4px 10px rgba(0,0,0,0.5), 0 0 10px rgba(240,192,64,0.2)',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ display: 'block', transform: 'translateX(-1px)' }}
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.button>
                )}

                {/* ITEMS CONTAINER */}
                <div
                    style={{
                        flex: 1,
                        height: isMobile ? '165px' : '210px',
                        background: 'rgba(10,8,8,0.7)',
                        border: '1px solid rgba(240,192,64,0.1)',
                        borderRadius: '12px',
                        padding: isMobile ? '6px 10px' : '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 0,
                        overflowX: 'hidden',
                        overflowY: 'hidden',
                        position: 'relative',
                        touchAction: 'pan-x',
                    }}
                >
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={{
                                initial: (direction: number) => ({
                                    x: direction > 0 ? 100 : -100,
                                    opacity: 0,
                                }),
                                animate: {
                                    x: 0,
                                    opacity: 1,
                                },
                                exit: (direction: number) => ({
                                    x: direction < 0 ? 100 : -100,
                                    opacity: 0,
                                }),
                            }}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            drag={isMobile ? "x" : undefined}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_, info) => {
                                if (!isMobile) return;
                                const swipeThreshold = 40;
                                if (info.offset.x < -swipeThreshold) {
                                    if (currentPage < totalPages - 1) {
                                        setDirection(1);
                                        setCurrentPage((prev) => prev + 1);
                                    }
                                } else if (info.offset.x > swipeThreshold) {
                                    if (currentPage > 0) {
                                        setDirection(-1);
                                        setCurrentPage((prev) => prev - 1);
                                    }
                                }
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                gap: '16px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                touchAction: 'pan-x',
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
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* RIGHT ARROW (Desktop only) */}
                {totalPages > 1 && !isMobile && (
                    <motion.button
                        whileHover={
                            currentPage !== totalPages - 1
                                ? {
                                      scale: 1.1,
                                      borderColor: '#f0c040',
                                      boxShadow: '0 0 15px rgba(240,192,64,0.5)',
                                  }
                                : {}
                        }
                        whileTap={currentPage !== totalPages - 1 ? { scale: 0.95 } : {}}
                        onClick={() => {
                            setDirection(1);
                            setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
                        }}
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
                            width: '48px',
                            height: '48px',
                            minWidth: 'unset',
                            minHeight: 'unset',
                            color: currentPage === totalPages - 1 ? 'rgba(255,255,255,0.15)' : '#f0c040',
                            fontSize: '20px',
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
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ display: 'block', transform: 'translateX(1px)' }}
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default ShopBottomShelf;
