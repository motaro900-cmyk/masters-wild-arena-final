import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HEROES_DB } from '../../../../../../configs/HeroesConfig';
import { AssetsMap } from '../../../../../../configs/AssetsMap';
import { useGameStore } from '../../../../../../store/useGameStore';
import { ROLE_ICONS, rarityColors } from '../../constants/roleIcons';
import { audioService } from '../../../../../../services/AudioService';

// Rarity labels in Russian
const RARITY_LABELS: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
};

// Rarity glow/border colors matching the reference
const RARITY_BORDER: Record<string, string> = {
    COMMON: 'rgba(255,255,255,0.15)',
    RARE: 'rgba(96,165,250,0.5)',
    EPIC: 'rgba(168,85,247,0.6)',
    LEGENDARY: 'rgba(251,146,60,0.6)',
    MYTHIC: 'rgba(248,113,113,0.6)',
};

const RARITY_GLOW: Record<string, string> = {
    COMMON: 'rgba(255,255,255,0.0)',
    RARE: 'rgba(96,165,250,0.15)',
    EPIC: 'rgba(168,85,247,0.18)',
    LEGENDARY: 'rgba(251,146,60,0.18)',
    MYTHIC: 'rgba(248,113,113,0.2)',
};

export const HeroList = ({ ownedHeroes, selectedHeroId, onBuyClick }: any) => {
    const { setSelectedHeroId } = useGameStore((s: any) => ({
        setSelectedHeroId: s.setSelectedHeroId,
    }));

    const [subTab, setSubTab] = useState<'ALL' | 'OWNED'>('ALL');
    const [classFilter, setClassFilter] = useState<string>('ALL');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filteredHeroes = HEROES_DB.filter((hero) => {
        if (subTab === 'OWNED' && !ownedHeroes.includes(hero.id)) return false;
        if (classFilter !== 'ALL' && hero.role !== classFilter) return false;
        return true;
    }).sort((a, b) => {
        // Owned heroes always come first in 'ALL' tab
        if (subTab === 'ALL') {
            const aOwned = ownedHeroes.includes(a.id) ? 0 : 1;
            const bOwned = ownedHeroes.includes(b.id) ? 0 : 1;
            return aOwned - bOwned;
        }
        return 0;
    });

    return (
        <motion.div
            key="hero-list-v3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                /* fill all available height in flex-column parent */
                flex: 1,
                minHeight: 0,
                padding: '28px 44px 20px 44px',
                gap: '18px',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            {/* ── TOP FILTER BAR ── */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    zIndex: 10,
                }}
            >
                {/* Subtab switcher: МОИ ГЕРОИ / ВСЕ ГЕРОИ */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(12, 10, 6, 0.7)',
                        border: '1px solid rgba(240, 192, 64, 0.2)',
                        borderRadius: '10px',
                        padding: '5px',
                        gap: '4px',
                    }}
                >
                    {(
                        [
                            { id: 'ALL', label: 'ВСЕ ГЕРОИ' },
                            { id: 'OWNED', label: 'МОИ ГЕРОИ' },
                        ] as const
                    ).map((tab) => {
                        const isActive = subTab === tab.id;
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setSubTab(tab.id);
                                    audioService.playSFX('SFX_CLICK');
                                }}
                                style={{
                                    padding: '9px 22px',
                                    background: isActive ? '#f0c040' : 'transparent',
                                    border: 'none',
                                    borderRadius: '7px',
                                    color: isActive ? '#1a1200' : 'rgba(255,255,255,0.55)',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    letterSpacing: '0.8px',
                                    transition: 'all 0.18s ease',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {tab.label}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Right side: Class filter + view toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Class dropdown */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <select
                            value={classFilter}
                            onChange={(e) => {
                                setClassFilter(e.target.value);
                                audioService.playSFX('SFX_CLICK');
                            }}
                            style={{
                                padding: '9px 32px 9px 16px',
                                background: 'rgba(12, 10, 6, 0.7)',
                                border: '1px solid rgba(240, 192, 64, 0.2)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '13px',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: 'pointer',
                                letterSpacing: '0.8px',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23f0c040' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                            }}
                        >
                            <option value="ALL">ВСЕ КЛАССЫ</option>
                            <option value="WARRIOR">ВОИН</option>
                            <option value="TANK">ТАНК</option>
                            <option value="ASSASSIN">УБИЙЦА</option>
                        </select>
                    </div>

                    {/* Grid / List view toggle icons */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '3px',
                            background: 'rgba(12, 10, 6, 0.7)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '4px',
                        }}
                    >
                        {/* Grid icon (active) */}
                        <div
                            style={{
                                width: '34px',
                                height: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(240, 192, 64, 0.18)',
                                borderRadius: '7px',
                                cursor: 'default',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#f0c040" />
                                <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#f0c040" />
                                <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#f0c040" />
                                <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#f0c040" />
                            </svg>
                        </div>
                        {/* List icon (inactive) */}
                        <div
                            style={{
                                width: '34px',
                                height: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '7px',
                                cursor: 'default',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <rect x="1" y="3" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.35)" />
                                <rect x="1" y="7.75" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.35)" />
                                <rect x="1" y="12.5" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.35)" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── HERO GRID ── */}
            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 280px))',
                    gridAutoRows: 'minmax(0, 1fr)',
                    gap: '20px',
                    justifyContent: 'center',
                    /* Overflow visible so hovered/scaled cards are not clipped */
                    overflowY: 'auto',
                    overflowX: 'visible',
                    /* Padding gives room for scale(1.03) and translations on all sides */
                    padding: '24px 20px 24px 20px',
                    marginLeft: '-20px',
                    marginRight: '-20px',
                    alignContent: 'start',
                }}
                className="custom-scrollbar"
            >
                <AnimatePresence>
                    {filteredHeroes.map((hero, index) => {
                        const isOwned = ownedHeroes.includes(hero.id);
                        const isActive = selectedHeroId === hero.id;
                        const color = rarityColors[hero.rarity] || '#ffffff';
                        const rarityBorder = RARITY_BORDER[hero.rarity] || 'rgba(255,255,255,0.1)';
                        const rarityGlow = RARITY_GLOW[hero.rarity] || 'transparent';
                        const rarityLabel = RARITY_LABELS[hero.rarity] || hero.rarity;
                        const roleInfo = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

                        // Precise scaling & offset adjustments to align feet and keep heads within safe margin
                        const portraitAdjustments: Record<string, { scale: number; offsetY: number }> = {
                            panda: { scale: 0.95, offsetY: 4 },
                            raccoon: { scale: 0.90, offsetY: 2 },
                            default: { scale: 0.92, offsetY: 0 },
                        };
                        const adj = portraitAdjustments[hero.id] || portraitAdjustments.default;

                        return (
                            <motion.div
                                key={hero.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.90 }}
                                transition={{ duration: 0.22, delay: index * 0.03 }}
                                whileHover={{ y: -6, scale: 1.01 }}
                                onHoverStart={() => setHoveredId(hero.id)}
                                onHoverEnd={() => setHoveredId(null)}
                                onClick={() => {
                                    if (isOwned) {
                                        setSelectedHeroId(hero.id);
                                        audioService.playSFX('SFX_CLICK');
                                    } else {
                                        onBuyClick(hero);
                                    }
                                }}
                                style={{
                                    position: 'relative',
                                    zIndex: hoveredId === hero.id ? 50 : 1,
                                    background: isOwned
                                        ? `linear-gradient(180deg, rgba(26,21,32,0.95) 0%, ${color}16 60%, ${color}08 100%)`
                                        : 'linear-gradient(180deg, rgba(17,16,21,0.95) 0%, rgba(26,21,32,0.95) 100%)',
                                    border: isActive ? '2px solid #f0c040' : `1.5px solid ${rarityBorder}`,
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: isActive
                                        ? `0 0 35px rgba(240,192,64,0.35), 0 12px 30px rgba(0,0,0,0.85)`
                                        : hoveredId === hero.id
                                          ? `0 10px 25px ${rarityGlow}, 0 12px 28px rgba(0,0,0,0.8)`
                                          : isOwned
                                            ? `0 0 20px ${rarityGlow}, 0 6px 18px rgba(0,0,0,0.65)`
                                            : '0 4px 14px rgba(0,0,0,0.55)',
                                    transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease',
                                    aspectRatio: '3/4',
                                }}
                            >
                                {/* Active golden glow rim at top */}
                                {isActive && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: 'linear-gradient(90deg, transparent, #f0c040, transparent)',
                                            zIndex: 10,
                                        }}
                                    />
                                )}

                                {/* Role badge — top left */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        background: 'rgba(0,0,0,0.65)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: '6px',
                                        padding: '3px 8px',
                                        fontSize: '10px',
                                        color: roleInfo.color,
                                        zIndex: 5,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 700,
                                        letterSpacing: '0.3px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                    }}
                                >
                                    {roleInfo.icon} {roleInfo.label}
                                </div>

                                {/* Ownership indicator — top right */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        background: isOwned
                                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                            : 'rgba(0,0,0,0.7)',
                                        border: isOwned
                                            ? '1.5px solid rgba(255,255,255,0.3)'
                                            : '1.5px solid rgba(255,255,255,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: isOwned ? '13px' : '11px',
                                        zIndex: 5,
                                        boxShadow: isOwned ? '0 2px 8px rgba(34,197,94,0.4)' : 'none',
                                    }}
                                >
                                    {isOwned ? (
                                        <span style={{ color: '#fff', lineHeight: 1 }}>✓</span>
                                    ) : (
                                        <span style={{ filter: 'grayscale(0.3)', lineHeight: 1 }}>🔒</span>
                                    )}
                                </div>

                                {/* Hero portrait area */}
                                <div
                                    style={{
                                        flex: 1,
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        width: '100%',
                                        paddingTop: '24px',
                                    }}
                                >
                                    {/* Rarity radial glow behind the character */}
                                    {isOwned && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: `radial-gradient(circle at 50% 35%, ${color}20 0%, transparent 70%)`,
                                                zIndex: 1,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}
                                    <img
                                        src={hero.image}
                                        style={{
                                            height: `${100 * adj.scale}%`,
                                            width: 'auto',
                                            objectFit: 'contain',
                                            transform: `translateY(${adj.offsetY}px)`,
                                            transformOrigin: 'bottom center',
                                            zIndex: 2,
                                            filter: isOwned ? 'none' : 'grayscale(0.8) brightness(0.35)',
                                            transition: 'filter 0.3s/transform 0.3s ease',
                                            userSelect: 'none',
                                        }}
                                        alt={hero.name}
                                        draggable={false}
                                    />
                                </div>

                                {/* Info block at the bottom */}
                                <div
                                    style={{
                                        padding: '12px 14px 14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(10, 10, 14, 0.92)',
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                        flexShrink: 0,
                                        zIndex: 5,
                                    }}
                                >
                                    {/* Name */}
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontSize: '15px',
                                            fontWeight: 900,
                                            fontFamily: "'Cinzel', serif",
                                            letterSpacing: '0.3px',
                                            textAlign: 'center',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {hero.name}
                                    </div>

                                    {/* Rarity */}
                                    <div
                                        style={{
                                            color: color,
                                            fontSize: '10px',
                                            fontWeight: 900,
                                            letterSpacing: '1.5px',
                                            textTransform: 'uppercase',
                                            textAlign: 'center',
                                            fontFamily: "'Nunito', sans-serif",
                                        }}
                                    >
                                        {rarityLabel}
                                    </div>

                                    {/* Action row */}
                                    <div style={{ width: '100%', marginTop: '2px' }}>
                                        {isOwned ? (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    padding: '7px 0',
                                                    background: isActive
                                                        ? 'rgba(34,197,94,0.12)'
                                                        : 'rgba(255,255,255,0.04)',
                                                    border: isActive
                                                        ? '1px solid rgba(34,197,94,0.6)'
                                                        : '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '8px',
                                                    color: isActive ? '#4ade80' : 'rgba(255,255,255,0.38)',
                                                    fontSize: '10px',
                                                    fontWeight: 900,
                                                    textAlign: 'center',
                                                    letterSpacing: '1px',
                                                    fontFamily: "'Cinzel', serif",
                                                }}
                                            >
                                                {isActive ? 'АКТИВЕН ДЛЯ БОЯ' : 'КЛИКНИТЕ ДЛЯ ВЫБОРА'}
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    padding: '7px 0',
                                                    background: 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)',
                                                    borderRadius: '8px',
                                                    color: '#1a0f00',
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    textAlign: 'center',
                                                    letterSpacing: '0.5px',
                                                    fontFamily: "'Cinzel', serif",
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '5px',
                                                    boxShadow: '0 2px 8px rgba(240,192,64,0.3)',
                                                }}
                                            >
                                                <img
                                                    src={
                                                        hero.unlockType === 'gold'
                                                            ? AssetsMap.UI.ICON_GOLD_FULL
                                                            : AssetsMap.UI.ICON_ALMAZ_FULL
                                                    }
                                                    style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                                                    alt=""
                                                />
                                                {hero.unlockCost.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredHeroes.length === 0 && (
                    <div
                        style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '80px 0',
                            gap: '16px',
                        }}
                    >
                        <div style={{ fontSize: '48px', opacity: 0.3 }}>⚔️</div>
                        <div
                            style={{
                                color: 'rgba(255,255,255,0.3)',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '16px',
                                fontWeight: 700,
                                letterSpacing: '2px',
                                textAlign: 'center',
                            }}
                        >
                            НЕТ ГЕРОЕВ В ЭТОЙ КАТЕГОРИИ
                        </div>
                    </div>
                )}
            </div>

            {/* ── COLLECTION COUNTER ── */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0,
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        width: '30px',
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.5))',
                    }}
                />
                <span
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '2px',
                    }}
                >
                    Коллекция: {ownedHeroes.length}/{HEROES_DB.length}
                </span>
                <div
                    style={{
                        width: '30px',
                        height: '1px',
                        background: 'linear-gradient(90deg, rgba(240,192,64,0.5), transparent)',
                    }}
                />
            </div>
        </motion.div>
    );
};
