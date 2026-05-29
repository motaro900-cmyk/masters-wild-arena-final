import React from 'react';
import { motion } from 'framer-motion';
import { ShopItem } from '../../../../configs/ShopConfig';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { rarityTranslation } from './shopHelpers';

interface ShopItemCardProps {
    item: ShopItem;
    isSelected: boolean;
    playerLevel?: number;
    discount?: number;
    onClick: () => void;
}

const getRarityColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
        case 'COMMON':
            return '#b0c4de';
        case 'UNCOMMON':
            return '#4ade80';
        case 'RARE':
            return '#3b82f6';
        case 'EPIC':
            return '#a855f7';
        case 'LEGENDARY':
            return '#f97316';
        case 'MYTHIC':
            return '#ef4444';
        default:
            return '#ffffff';
    }
};

export const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, isSelected, playerLevel, discount = 0, onClick }) => {
    const glow = getRarityColor(item.rarity);
    const isLocked = item.requiredLevel !== undefined && (playerLevel || 1) < item.requiredLevel;

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ y: -6, scale: 1.03 }}
            style={{
                minWidth: '155px',
                flexShrink: 0,
                height: '175px',
                background: isSelected
                    ? `radial-gradient(circle, rgba(240,192,64,0.2) 0%, rgba(20,20,25,0.96) 100%)`
                    : isLocked
                    ? 'linear-gradient(180deg, rgba(25,20,15,0.5) 0%, rgba(15,10,10,0.75) 100%)'
                    : 'linear-gradient(180deg, rgba(30,25,25,0.85) 0%, rgba(15,15,20,0.95) 100%)',
                border: isSelected
                    ? `2.5px solid #f0c040`
                    : discount > 0 && !isLocked
                    ? `1.5px solid #e11d48`
                    : isLocked
                    ? '1.5px solid rgba(240, 192, 64, 0.15)'
                    : `1.5px solid ${glow}44`,
                boxShadow: isSelected
                    ? `0 0 15px #f0c04066`
                    : discount > 0 && !isLocked
                    ? `0 4px 10px rgba(0,0,0,0.6), 0 0 10px rgba(225, 29, 72, 0.4)`
                    : `0 4px 10px rgba(0,0,0,0.5), 0 0 5px ${glow}11`,
                borderRadius: '10px',
                padding: '10px 10px 8px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
            }}
        >
            {discount > 0 && !isLocked && (
                <div
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: '#e11d48',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: 5,
                    }}
                >
                    -{discount}%
                </div>
            )}
            {/* Lock Overlay (Centered Badge) */}
            {isLocked && (
                <div
                    style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
                    <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.9))' }}>🔒</span>
                    <span
                        style={{
                            fontSize: '11px',
                            color: '#ff4d4d',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            letterSpacing: '1px',
                            textShadow: '0 2px 4px #000, 0 0 6px #000',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        LVL {item.requiredLevel}
                    </span>
                </div>
            )}

            {/* Item Rarity Tag */}
            <span
                style={{
                    fontSize: '8px',
                    color: isLocked ? 'rgba(255,255,255,0.4)' : glow,
                    fontWeight: 900,
                    alignSelf: 'flex-start',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                }}
            >
                {(rarityTranslation[item.rarity] || item.rarity).replace(' ПРЕДМЕТ', '')}
            </span>

            {/* Sprite Container — large */}
            <div
                style={{
                    width: '90px',
                    height: '90px',
                    position: 'relative',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLocked ? 0.45 : 1,
                }}
            >
                {item.spriteClass ? (
                    <div
                        className={item.spriteClass}
                        style={{
                            width: '80px',
                            height: '80px',
                            filter: isLocked
                                ? 'grayscale(1) brightness(0.4)'
                                : `drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${glow}66)`,
                        }}
                    />
                ) : (
                    <img
                        src={item.image}
                        onError={(e) => (e.currentTarget.src = AssetsMap.UI.ICON_DAILY_CHEST)}
                        style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'contain',
                            filter: isLocked
                                ? 'grayscale(1) brightness(0.4)'
                                : `drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${glow}66)`,
                        }}
                        alt=""
                    />
                )}
            </div>

            {/* Tiny Item Name */}
            <span
                style={{
                    fontSize: '10px',
                    color: '#e8d5a0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    textAlign: 'center',
                }}
            >
                {item.name}
            </span>
        </motion.div>
    );
};
