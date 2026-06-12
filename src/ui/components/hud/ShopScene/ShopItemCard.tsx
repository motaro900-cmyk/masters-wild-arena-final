import React from 'react';
import { motion } from 'framer-motion';
import { ShopItem } from '../../../../configs/ShopConfig';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { rarityTranslation } from './shopHelpers';
import { resolveAssetPath } from '../../../../utils/assetPath';

interface ShopItemCardProps {
    item: ShopItem;
    isSelected: boolean;
    playerLevel?: number;
    discount?: number;
    onClick: () => void;
    isMobile?: boolean;
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

export const ShopItemCard: React.FC<ShopItemCardProps> = React.memo(({
    item,
    isSelected,
    playerLevel,
    discount = 0,
    onClick,
    isMobile = false,
}) => {
    const glow = getRarityColor(item.rarity);
    const isLocked = item.requiredLevel !== undefined && (playerLevel || 1) < item.requiredLevel;
    const isStarterPack = item.id === 'starter_pack';

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ y: -6, scale: 1.03 }}
            style={{
                width: isMobile ? '130px' : '155px',
                maxWidth: isMobile ? '130px' : '155px',
                minWidth: isMobile ? '130px' : '155px',
                boxSizing: 'border-box',
                flexShrink: 0,
                height: isMobile ? '150px' : '175px',
                background: isSelected
                    ? (isMobile
                        ? `radial-gradient(circle, rgba(240,192,64,0.25) 0%, rgba(20,15,15,0.98) 100%)`
                        : `radial-gradient(circle, rgba(240,192,64,0.2) 0%, rgba(20,20,25,0.96) 100%)`)
                    : isLocked
                      ? (isMobile
                          ? 'linear-gradient(180deg, rgba(35,25,20,0.95) 0%, rgba(20,15,15,0.98) 100%)'
                          : 'linear-gradient(180deg, rgba(25,20,15,0.5) 0%, rgba(15,10,10,0.75) 100%)')
                      : (isMobile
                          ? 'linear-gradient(180deg, rgba(40,35,35,0.96) 0%, rgba(20,20,25,0.98) 100%)'
                          : 'linear-gradient(180deg, rgba(30,25,25,0.85) 0%, rgba(15,15,20,0.95) 100%)'),
                border: isSelected
                    ? `2.5px solid #f0c040`
                    : discount > 0 && !isLocked
                      ? (isMobile ? `2px solid #e11d48` : `1.5px solid #e11d48`)
                      : isLocked
                        ? (isMobile ? '1.5px solid rgba(240, 192, 64, 0.25)' : '1.5px solid rgba(240, 192, 64, 0.15)')
                        : (isMobile ? `2px solid ${glow}66` : `1.5px solid ${glow}44`),
                boxShadow: isSelected
                    ? `0 0 15px #f0c04066`
                    : discount > 0 && !isLocked
                      ? `0 4px 10px rgba(0,0,0,0.6), 0 0 10px rgba(225, 29, 72, 0.4)`
                      : `0 4px 10px rgba(0,0,0,0.5), 0 0 5px ${glow}11`,
                borderRadius: '10px',
                padding: isMobile ? '8px 8px 6px 8px' : '10px 10px 8px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                animation: isStarterPack && !isLocked
                    ? (isSelected ? 'starter-pack-pulse-selected 2s infinite ease-in-out' : 'starter-pack-pulse 2s infinite ease-in-out')
                    : undefined,
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
            {item.badge && !isLocked && (
                <div
                    style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        background: item.badge === 'СПЕЦПРЕДЛОЖЕНИЕ'
                            ? 'linear-gradient(90deg, #f43f5e, #ec4899)'
                            : item.badge === 'ЛУЧШАЯ ЦЕНА'
                              ? 'linear-gradient(90deg, #eab308, #e879f9)'
                              : '#10b981',
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: 5,
                        letterSpacing: '0.5px',
                        fontFamily: "'Cinzel', 'Philosopher', serif",
                    }}
                >
                    {item.badge}
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
                    marginTop: item.badge && !isLocked ? (isMobile ? '12px' : '16px') : '0px',
                    zIndex: 2,
                }}
            >
                {(rarityTranslation[item.rarity] || item.rarity).replace(' ПРЕДМЕТ', '')}
            </span>

            {/* Sprite Container — large */}
            <div
                style={{
                    width: isMobile ? '70px' : '90px',
                    height: isMobile ? '70px' : '90px',
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
                            width: isMobile ? '60px' : '80px',
                            height: isMobile ? '60px' : '80px',
                            filter: isLocked
                                ? 'grayscale(1) brightness(0.4)'
                                : `drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${glow}66)`,
                        }}
                    />
                ) : (
                    <img
                        src={resolveAssetPath(item.image)}
                        onError={(e) => (e.currentTarget.src = AssetsMap.UI.ICON_DAILY_CHEST)}
                        style={{
                            width: isMobile ? '60px' : '80px',
                            height: isMobile ? '60px' : '80px',
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
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#e8d5a0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: isMobile ? 800 : 700,
                    textAlign: 'center',
                }}
            >
                {item.name}
            </span>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.playerLevel === nextProps.playerLevel &&
        prevProps.discount === nextProps.discount &&
        prevProps.isMobile === nextProps.isMobile &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.priceGold === nextProps.item.priceGold &&
        prevProps.item.priceGem === nextProps.item.priceGem &&
        prevProps.item.requiredLevel === nextProps.item.requiredLevel
    );
});
