import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { rarityColors } from '../../../constants/roleIcons';
import { ROLE_ICONS } from '../../../constants/roleIcons';
import { resolveAssetPath } from '../../../../../../../utils/assetPath';
import { RARITY_LABELS, RARITY_GLOWS } from '../utils/heroUtils';
import { useGameStore } from '../../../../../../../store/useGameStore';
import { getRankInfo } from '../../../../../../../configs/RankSystem';
import { AssetsMap } from '../../../../../../../configs/AssetsMap';
const stoneBrickPattern =
    "url(\"data:image/svg+xml;utf8,<svg width='60' height='40' viewBox='0 0 60 40' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='40' fill='none'/><line x1='0' y1='20' x2='60' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='40' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='30' y1='0' x2='30' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='20' x2='0' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='60' y1='20' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='1.5' x2='60' y2='1.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='0' y1='21.5' x2='60' y2='21.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='31.5' y1='0.8' x2='31.5' y2='19.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='1.5' y1='20.8' x2='1.5' y2='39.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><path d='M44,3 L40,7 L42,12 L38,15' stroke='rgba(0,0,0,0.45)' stroke-width='0.8' fill='none'/><path d='M45,3.5 L41,7.5 L43,12.5 L39,15.5' stroke='rgba(255,255,255,0.08)' stroke-width='0.8' fill='none'/><line x1='6' y1='8' x2='20' y2='8' stroke='rgba(0,0,0,0.42)' stroke-width='0.8'/><line x1='6' y1='9' x2='20' y2='9' stroke='rgba(255,255,255,0.08)' stroke-width='0.8'/><path d='M10,23 L13,28 L11,34' stroke='rgba(0,0,0,0.48)' stroke-width='0.9' fill='none'/><path d='M11,23.5 L14,28.5 L12,34.5' stroke='rgba(255,255,255,0.09)' stroke-width='0.9' fill='none'/><path d='M35,33 L48,30 L54,32' stroke='rgba(0,0,0,0.42)' stroke-width='0.8' fill='none'/><path d='M35,34 L48,31 L54,33' stroke='rgba(255,255,255,0.07)' stroke-width='0.8' fill='none'/><circle cx='12' cy='14' r='0.8' fill='rgba(0,0,0,0.45)'/><circle cx='12.5' cy='14.5' r='0.4' fill='rgba(255,255,255,0.08)'/><circle cx='48' cy='26' r='1.2' fill='rgba(0,0,0,0.5)'/><circle cx='48.5' cy='26.5' r='0.6' fill='rgba(255,255,255,0.1)'/></svg>\")";

interface HeroCardProps {
    hero: any;
    isOwned: boolean;
    isActive: boolean;
    isSelected: boolean;
    activeSkin: any;
    onClick: () => void;
}

export const HeroCard = memo(function HeroCard({
    hero,
    isOwned,
    isActive,
    isSelected,
    activeSkin,
    onClick,
}: HeroCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const rating = useGameStore((state) => state.rating);
    const crystals = useGameStore((state) => state.crystals);
    const gold = useGameStore((state) => state.gold);

    const hasEnoughTrophies = !hero.requiredTrophies || rating >= hero.requiredTrophies;
    const hasEnoughGold = !hero.unlockGoldCost || gold >= hero.unlockGoldCost;
    const hasEnoughDiamonds = !hero.unlockCost || crystals >= hero.unlockCost;

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const isDefaultSkin = !activeSkin || activeSkin.id === 'default' || activeSkin.id.endsWith('_default');
    const activeRarity = !isDefaultSkin ? activeSkin.rarity : hero.rarity;
    const activeName = !isDefaultSkin ? activeSkin.name : hero.name;
    const activeSkinImage = activeSkin ? activeSkin.image : hero.image;

    useEffect(() => {
        setImageLoaded(false);
    }, [activeSkinImage]);

    const color = rarityColors[activeRarity] || '#fff';
    const glow = RARITY_GLOWS[activeRarity] || 'rgba(0,0,0,0)';
    const roleInfo = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

    return (
        <motion.div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -6 }}
            whileTap={{ y: -2 }}
            onClick={onClick}
            style={{
                position: 'relative',
                background: isSelected
                    ? `linear-gradient(135deg, rgba(48, 38, 30, 0.98) 0%, ${color}36 100%)`
                    : isHovered
                      ? `linear-gradient(135deg, rgba(42, 33, 26, 0.98) 0%, rgba(28, 22, 18, 0.98) 100%)`
                      : `linear-gradient(135deg, rgba(32, 25, 20, 0.98) 0%, rgba(20, 16, 13, 0.98) 100%)`,
                border: isSelected
                    ? `2.5px solid ${color}`
                    : isActive
                      ? '2.5px solid #f0c040'
                      : isHovered
                        ? `1.5px solid ${color}`
                        : `1.5px solid rgba(240, 192, 64, 0.22)`,
                borderRadius: '16px',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: isSelected
                    ? `0 0 25px ${glow}, 0 12px 30px rgba(0, 0, 0, 0.75), inset 0 0 12px ${color}33`
                    : isHovered
                      ? `0 0 18px ${glow}, 0 8px 24px rgba(0, 0, 0, 0.55)`
                      : '0 4px 15px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.2s ease-out, box-shadow 0.22s, border-color 0.22s, background 0.22s',
                display: 'flex',
                flexDirection: 'column',
                height: '330px',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
            }}
        >
            {/* Background Rarity Glow inside Card */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: isSelected
                        ? `radial-gradient(circle at 50% 30%, ${color}2c 0%, transparent 75%)`
                        : isHovered
                          ? `radial-gradient(circle at 50% 30%, ${color}1c 0%, transparent 70%)`
                          : 'none',
                    pointerEvents: 'none',
                    transition: 'background 0.22s ease-out',
                }}
            />

            {/* Top Border Glow Highlight if active combat hero */}
            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
                        zIndex: 5,
                    }}
                />
            )}

            {/* Character Artwork Frame */}
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: `radial-gradient(circle at 50% 65%, ${color}3a 0%, transparent 85%), ${stoneBrickPattern}, linear-gradient(180deg, rgba(38, 30, 25, 0.95) 0%, rgba(18, 14, 11, 0.98) 100%)`,
                    borderBottom: '1.5px solid rgba(240, 192, 64, 0.22)',
                }}
            >
                {/* Ambient backlighting aura behind character model */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '15%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
                        filter: 'blur(14px)',
                        zIndex: 1,
                        pointerEvents: 'none',
                        opacity: isOwned ? 1 : 0.7,
                        transition: 'opacity 0.22s ease, background 0.22s ease',
                    }}
                />

                {!imageLoaded && (
                    <div
                        className="skeleton-placeholder"
                        style={{
                            width: '120px',
                            height: '180px',
                            bottom: '10%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            position: 'absolute',
                            borderRadius: '16px',
                            zIndex: 1,
                        }}
                    />
                )}
                <img
                    src={resolveAssetPath(activeSkinImage)}
                    onLoad={() => setImageLoaded(true)}
                    style={{
                        height: '90%',
                        width: 'auto',
                        objectFit: 'contain',
                        zIndex: 2,
                        userSelect: 'none',
                        filter: isOwned ? 'none' : 'brightness(0.2) grayscale(1.0)',
                        transform: isHovered ? 'scale(1.04) translateY(-2px)' : 'scale(1) translateY(0)',
                        transition:
                            'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.25s, opacity 0.2s ease-in-out',
                        opacity: imageLoaded ? 1 : 0,
                    }}
                    alt={activeName}
                    draggable={false}
                />

                {!isOwned && (
                    <>
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(10, 8, 6, 0.65)',
                                backdropFilter: 'blur(1px)',
                                zIndex: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '16px',
                                pointerEvents: 'none',
                            }}
                        >
                            {/* Centered Large Gold/Bronze Lock */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '50%',
                                    background: 'rgba(20, 16, 12, 0.95)',
                                    border: '2px solid #f0c040',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.9), 0 0 15px rgba(240, 192, 64, 0.45)',
                                }}
                            >
                                <svg width="20" height="22" viewBox="0 0 12 14" fill="none">
                                    <path
                                        d="M3.5 5.5V3.5C3.5 2.12 4.62 1 6 1C7.38 1 8.5 2.12 8.5 3.5V5.5"
                                        stroke="#fdfbf7"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <rect x="2" y="5.5" width="8" height="6.5" rx="1.5" fill="#f0c040" />
                                    <circle cx="6" cy="8.2" r="0.8" fill="#1c1612" />
                                    <path d="M6 9V10.5" stroke="#1c1612" strokeWidth="1" strokeLinecap="round" />
                                </svg>
                            </div>

                            {/* Requirements box */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(18, 14, 11, 0.94)',
                                    border: '1.5px solid rgba(240, 192, 64, 0.45)',
                                    borderRadius: '12px',
                                    padding: '8px 14px',
                                    width: '90%',
                                    maxWidth: '220px',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '9px',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        color: '#f0c040',
                                        letterSpacing: '1px',
                                        textAlign: 'center',
                                    }}
                                >
                                    ДЛЯ ОТКРЫТИЯ ТРЕБУЕТСЯ:
                                </span>

                                {hero.requiredTrophies && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            fontFamily: "'Nunito', sans-serif",
                                            color: hasEnoughTrophies ? '#fff' : '#ef4444',
                                        }}
                                    >
                                        <span>Ранг {getRankInfo(hero.requiredTrophies).name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <span>({hero.requiredTrophies}</span>
                                            <img
                                                src={resolveAssetPath(AssetsMap.UI.TROPHY_PREMIUM)}
                                                style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                                                alt=""
                                            />
                                            <span>)</span>
                                        </div>
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        marginTop: '2px',
                                        paddingTop: '6px',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                        width: '100%',
                                    }}
                                >
                                    {hero.unlockGoldCost && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                color: hasEnoughGold ? '#facc15' : '#ef4444',
                                            }}
                                        >
                                            <img
                                                src={resolveAssetPath(AssetsMap.UI.ICON_GOLD_FULL)}
                                                style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                                                alt=""
                                            />
                                            <span>{hero.unlockGoldCost.toLocaleString('ru-RU')}</span>
                                        </div>
                                    )}
                                    {hero.unlockGoldCost > 0 && hero.unlockCost > 0 && (
                                        <span
                                            style={{
                                                fontSize: '8px',
                                                fontWeight: 900,
                                                color: 'rgba(255,255,255,0.3)',
                                                letterSpacing: '0.5px',
                                            }}
                                        >
                                            ИЛИ
                                        </span>
                                    )}
                                    {hero.unlockCost > 0 && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                color: hasEnoughDiamonds ? '#c084fc' : '#fb7185',
                                            }}
                                        >
                                            <img
                                                src={resolveAssetPath(AssetsMap.UI.ICON_ALMAZ_FULL)}
                                                style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                                                alt=""
                                            />
                                            <span>{hero.unlockCost}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Pedestal ring under character */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-10px',
                        width: '120px',
                        height: '30px',
                        borderRadius: '50%',
                        background: `radial-gradient(ellipse, ${color}55 0%, transparent 75%)`,
                        zIndex: 1,
                        transition: 'background 0.22s',
                    }}
                />
            </div>

            {/* Card Footer */}
            <div
                style={{
                    padding: '12px 14px',
                    background: 'linear-gradient(180deg, rgba(20, 16, 12, 0.95) 0%, rgba(14, 11, 8, 0.98) 100%)',
                    borderTop: `1.5px solid ${isSelected ? color + '66' : isHovered ? color + '33' : 'rgba(240, 192, 64, 0.25)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'border-color 0.22s, background 0.22s',
                }}
            >
                {/* 1. Name */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span
                        style={{
                            color: '#fffdf9',
                            fontSize: '16.5px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '0.7px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        }}
                    >
                        {hero.name}
                    </span>

                    {/* Status Badge */}
                    {isOwned ? (
                        isActive ? (
                            <span
                                style={{
                                    color: '#4ade80',
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    borderRadius: '5px',
                                    padding: '1px 4px',
                                    fontFamily: "'Nunito', sans-serif",
                                    letterSpacing: '0.3px',
                                }}
                            >
                                АКТИВ
                            </span>
                        ) : null
                    ) : (
                        <span
                            style={{
                                color: '#f0c040',
                                fontSize: '9px',
                                fontWeight: 900,
                                background: 'rgba(240, 192, 64, 0.1)',
                                border: '1px solid rgba(240, 192, 64, 0.3)',
                                borderRadius: '5px',
                                padding: '1px 5px',
                                fontFamily: "'Nunito', sans-serif",
                                letterSpacing: '0.5px',
                            }}
                        >
                            ЗАБЛОК.
                        </span>
                    )}
                </div>

                {/* 2. Skin / Appearance name */}
                <div
                    style={{
                        color: !isDefaultSkin ? activeSkin.color || color : 'rgba(255, 254, 250, 0.65)',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: "'Nunito', sans-serif",
                        opacity: !isDefaultSkin ? 1 : 0.7,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '1px',
                    }}
                >
                    {!isDefaultSkin ? activeSkin.name : hero.title}
                </div>

                {/* 3. Rarity & Class */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                    }}
                >
                    <span
                        style={{
                            color,
                            fontSize: '9px',
                            fontWeight: 900,
                            fontFamily: "'Nunito', sans-serif",
                            letterSpacing: '1.2px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {RARITY_LABELS[activeRarity]}
                    </span>

                    <span style={{ color: 'rgba(255, 254, 250, 0.25)', fontSize: '10px' }}>·</span>

                    <span
                        style={{
                            color: roleInfo.color,
                            fontSize: '9.5px',
                            fontWeight: 800,
                            fontFamily: "'Nunito', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {roleInfo.icon} {roleInfo.label}
                    </span>
                </div>
            </div>
        </motion.div>
    );
});
