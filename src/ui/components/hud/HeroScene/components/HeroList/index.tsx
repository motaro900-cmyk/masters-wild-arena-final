import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HEROES_DB } from '../../../../../../configs/HeroesConfig';
import { useGameStore } from '../../../../../../store/useGameStore';
import { ROLE_ICONS, rarityColors } from '../../constants/roleIcons';
import { audioService } from '../../../../../../services/AudioService';
import { getSkinsForHero } from '../../../../../../configs/SkinsConfig';

const RARITY_LABELS: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
};

const RARITY_GLOWS: Record<string, string> = {
    COMMON: 'rgba(160, 160, 160, 0.15)',
    RARE: 'rgba(59, 130, 246, 0.25)',
    EPIC: 'rgba(168, 85, 247, 0.35)',
    LEGENDARY: 'rgba(245, 158, 11, 0.45)',
    MYTHIC: 'rgba(239, 68, 68, 0.55)',
};

const SOURCE_ICONS: Record<string, string> = {
    default: '🎁',
    battle_pass: '🏆',
    shop: '🛒',
    achievement: '🏅',
    event: '🌟',
};

function deriveStats(stats: { strength: number; agility: number; stamina: number; intelligence: number }) {
    return {
        hp: stats.stamina * 10,
        attack: stats.strength * 2,
        defense: Math.round(stats.stamina * 0.5),
        speed: Math.round((1 + stats.agility * 0.05) * 100) / 100,
        crit: Math.round(stats.agility * 0.5),
    };
}

// ── COMPACT HERO CARD (Left Grid) ───────────────────────────────────────────
function HeroCard({ hero, isOwned, isActive, isSelected, activeSkin, onClick }: any) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        const rX = -(mouseY / height) * 12; // Max 12 degrees
        const rY = (mouseX / width) * 12;
        setTilt({ x: rX, y: rY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const activeRarity = activeSkin && activeSkin.id !== 'default' ? activeSkin.rarity : hero.rarity;
    const activeName = activeSkin && activeSkin.id !== 'default' ? activeSkin.name : hero.name;
    const activeSkinImage = activeSkin ? activeSkin.image : hero.image;

    const color = rarityColors[activeRarity] || '#fff';
    const glow = RARITY_GLOWS[activeRarity] || 'rgba(0,0,0,0)';
    const roleInfo = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                position: 'relative',
                background: isSelected
                    ? `linear-gradient(180deg, rgba(20, 16, 14, 0.98) 0%, ${color}1e 100%)`
                    : `linear-gradient(180deg, rgba(14, 12, 10, 0.95) 0%, rgba(20, 16, 14, 0.98) 100%)`,
                border: isSelected
                    ? `2px solid ${color}`
                    : isActive
                      ? '2.5px solid #f0c040'
                      : `1px solid rgba(255, 255, 255, 0.08)`,
                borderRadius: '16px',
                cursor: 'pointer',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                boxShadow: isSelected
                    ? `0 0 20px ${glow}, 0 8px 24px rgba(0, 0, 0, 0.8)`
                    : '0 4px 12px rgba(0, 0, 0, 0.6)',
                transformStyle: 'preserve-3d',
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.08s ease-out, box-shadow 0.22s, border-color 0.22s',
                display: 'flex',
                flexDirection: 'column',
                height: '330px',
            }}
        >
            {/* Background Rarity Glow inside Card */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: isSelected
                        ? `radial-gradient(circle at 50% 30%, ${color}1a 0%, transparent 70%)`
                        : 'none',
                    pointerEvents: 'none',
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
                    background: 'radial-gradient(circle at 50% 70%, rgba(0,0,0,0.65) 0%, rgba(10,8,7,0.3) 100%)',
                }}
            >
                <img
                    src={activeSkinImage}
                    style={{
                        height: '88%',
                        width: 'auto',
                        objectFit: 'contain',
                        zIndex: 2,
                        userSelect: 'none',
                        filter: isOwned ? 'none' : 'grayscale(1) brightness(0.25)',
                    }}
                    alt={activeName}
                    draggable={false}
                />

                {/* Pedestal ring under character */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-10px',
                        width: '120px',
                        height: '30px',
                        borderRadius: '50%',
                        background: `radial-gradient(ellipse, ${color}2a 0%, transparent 70%)`,
                        zIndex: 1,
                    }}
                />
            </div>

            {/* Card Footer */}
            <div
                style={{
                    padding: '12px 14px',
                    background: 'rgba(6,5,4,0.95)',
                    borderTop: `1px solid ${isSelected ? color + '33' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                }}
            >
                {/* 1. Name */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
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
                        <span style={{ fontSize: '12px', opacity: 0.5 }}>🔒</span>
                    )}
                </div>

                {/* 2. Skin / Appearance name */}
                <div
                    style={{
                        color: activeSkin && activeSkin.id !== 'default' ? activeSkin.color || color : '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: "'Nunito', sans-serif",
                        opacity: activeSkin && activeSkin.id !== 'default' ? 1 : 0.7,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '1px',
                    }}
                >
                    {activeSkin && activeSkin.id !== 'default' ? activeSkin.name : hero.title}
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

                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>·</span>

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
}

// ── STAT BOX ROW ─────────────────────────────────────────────────────────────
function StatBoxRow({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                gap: '8px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
                <span
                    style={{
                        fontSize: '10.5px',
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}
                >
                    {label}
                </span>
            </div>
            <span
                style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    fontFamily: "'Nunito', sans-serif",
                    color: color,
                }}
            >
                {value}
            </span>
        </div>
    );
}

function HeroDetailPanel({
    hero,
    isOwned,
    isActive,
    onSelect,
    onBuy,
    ownedSkins,
    equippedSkins,
    equipSkin,
    previewSkinId,
    setPreviewSkinId,
}: any) {
    const skins = getSkinsForHero(hero.id);
    const defaultSkin = skins.find((s) => s.source === 'default') || skins[0];
    const activeSkinId = equippedSkins?.[hero.id] || defaultSkin.id;
    const previewId = previewSkinId;
    const setPreviewId = setPreviewSkinId;
    const displaySkin = skins.find((s) => s.id === (previewId || activeSkinId)) || skins[0];

    const activeRarity = displaySkin ? displaySkin.rarity : hero.rarity;
    const color = rarityColors[activeRarity] || '#fff';
    const roleInfo = ROLE_ICONS[hero.role] || ROLE_ICONS.WARRIOR;
    const derived = deriveStats(hero.stats);

    return (
        <motion.div
            key={hero.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
                width: '100%',
                height: '100%',
                background: `radial-gradient(circle at 50% 0%, ${color}0c 0%, transparent 60%), linear-gradient(135deg, rgba(20, 16, 14, 0.95) 0%, rgba(10, 8, 7, 0.99) 100%)`,
                backdropFilter: 'blur(18px)',
                borderLeft: '1px solid rgba(240, 192, 64, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '24px 24px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    flexShrink: 0,
                }}
            >
                {/* 1. Name */}
                <div
                    style={{
                        color: '#fff',
                        fontSize: '28px',
                        fontWeight: 900,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '0.8px',
                        lineHeight: 1.15,
                    }}
                >
                    {hero.name}
                </div>

                {/* 2. Skin */}
                <div
                    style={{
                        color: displaySkin && displaySkin.id !== 'default' ? displaySkin.color || color : '#fff',
                        fontSize: '13px',
                        fontWeight: 800,
                        fontFamily: "'Nunito', sans-serif",
                        marginTop: '4px',
                        opacity: displaySkin && displaySkin.id !== 'default' ? 1 : 0.7,
                    }}
                >
                    {displaySkin && displaySkin.id !== 'default' ? displaySkin.name : hero.title}
                </div>

                {/* 3. Rarity & Class */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                        style={{
                            color,
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontFamily: "'Nunito', sans-serif",
                            background: `${color}15`,
                            border: `1px solid ${color}33`,
                            padding: '2px 7px',
                            borderRadius: '6px',
                        }}
                    >
                        {RARITY_LABELS[activeRarity]}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>·</span>
                    <span
                        style={{
                            color: roleInfo.color,
                            fontSize: '10.5px',
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {roleInfo.icon} {roleInfo.label}
                    </span>
                </div>
            </div>

            <div
                className="custom-scrollbar"
                style={{
                    flex: 1,
                    padding: '20px 24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: `${roleInfo.bg}44`,
                        border: `1px solid ${roleInfo.color}33`,
                        padding: '10px 14px',
                        borderRadius: '12px',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>{roleInfo.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                            style={{
                                color: roleInfo.color,
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.8px',
                            }}
                        >
                            КЛАСС: {roleInfo.label}
                        </span>
                        <span
                            style={{
                                color: 'rgba(255, 255, 255, 0.35)',
                                fontSize: '9px',
                                fontFamily: "'Nunito', sans-serif",
                                marginTop: '1px',
                            }}
                        >
                            Уникальная роль в сражениях арены
                        </span>
                    </div>
                </div>
                <div>
                    <div
                        style={{
                            fontSize: '9.5px',
                            fontWeight: 900,
                            color: 'rgba(255,255,255,0.22)',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.8px',
                            marginBottom: '10px',
                        }}
                    >
                        ХАРАКТЕРИСТИКИ
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <StatBoxRow icon="❤️" label="Здоровье" value={derived.hp} color="#f87171" />
                        <StatBoxRow icon="⚔️" label="Атака" value={derived.attack} color="#fb923c" />
                        <StatBoxRow icon="🛡️" label="Защита" value={derived.defense} color="#60a5fa" />
                        <StatBoxRow icon="💨" label="Скорость" value={derived.speed} color="#34d399" />
                        <StatBoxRow icon="💥" label="Крит. шанс" value={`${derived.crit}%`} color="#f59e0b" />
                    </div>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <div>
                    <div
                        style={{
                            fontSize: '9.5px',
                            fontWeight: 900,
                            color: 'rgba(255,255,255,0.22)',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.8px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>ОБЛИКИ</span>
                        <span
                            style={{
                                color: 'rgba(255,255,255,0.25)',
                                fontWeight: 700,
                                fontSize: '9px',
                                fontFamily: "'Nunito', sans-serif",
                            }}
                        >
                            {skins.filter((s) => ownedSkins.includes(s.id) || s.source === 'default').length}/
                            {skins.length} ОТКРЫТО
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {skins.map((skin: any) => {
                            const skinOwned = ownedSkins.includes(skin.id) || skin.source === 'default';
                            const isActiveSkin = activeSkinId === skin.id;
                            const isSelectedSkin = previewId ? previewId === skin.id : isActiveSkin;
                            const sc = rarityColors[skin.rarity] || '#fff';
                            return (
                                <motion.div
                                    key={skin.id}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setPreviewId(skin.id);
                                        audioService.playSFX('SFX_CLICK');
                                    }}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        border: isSelectedSkin
                                            ? `2px solid ${sc}`
                                            : '1.5px solid rgba(255,255,255,0.08)',
                                        background: isSelectedSkin ? `${sc}12` : 'rgba(6,5,4,0.7)',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: isSelectedSkin ? `0 0 10px ${sc}33` : 'none',
                                        transition: 'border-color 0.15s, box-shadow 0.15s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <img
                                        src={skin.image}
                                        style={{
                                            height: '70%',
                                            width: 'auto',
                                            objectFit: 'contain',
                                            filter: skinOwned ? 'none' : 'grayscale(1) brightness(0.2)',
                                        }}
                                        alt={skin.name}
                                        draggable={false}
                                    />
                                    {isActiveSkin && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '6px',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: sc,
                                                boxShadow: `0 0 6px ${sc}`,
                                            }}
                                        />
                                    )}
                                    {!skinOwned && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(0, 0, 0, 0.4)',
                                            }}
                                        >
                                            <span style={{ fontSize: '18px', marginBottom: '2px' }}>🔒</span>
                                            <span
                                                style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontFamily: "'Nunito', sans-serif",
                                                    fontWeight: 800,
                                                    textAlign: 'center',
                                                    padding: '0 2px',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {SOURCE_ICONS[skin.source] || '🏆'} БП
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                    <div
                        style={{
                            marginTop: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            border: '1px solid rgba(255,255,255,0.04)',
                        }}
                    >
                        <div
                            style={{
                                color: displaySkin?.color || '#fff',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>{displaySkin?.name}</span>
                            <span
                                style={{
                                    fontSize: '8px',
                                    fontWeight: 900,
                                    color: rarityColors[displaySkin?.rarity] || '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                {RARITY_LABELS[displaySkin?.rarity]}
                            </span>
                        </div>
                        <p
                            style={{
                                margin: '4px 0 0',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '9.5px',
                                fontFamily: "'Nunito', sans-serif",
                                lineHeight: 1.4,
                            }}
                        >
                            {displaySkin?.description}
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: 'auto',
                    flexShrink: 0,
                    padding: '16px 24px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {isOwned ? (
                    activeSkinId !== displaySkin.id ? (
                        ownedSkins.includes(displaySkin.id) || displaySkin.source === 'default' ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    equipSkin(hero.id, displaySkin.id);
                                    audioService.playSFX('SFX_CLICK');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1.5px',
                                    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}
                            >
                                ✨ НАДЕТЬ ОБЛИК
                            </motion.button>
                        ) : (
                            <div
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1.5px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '10px',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}
                            >
                                🔒 ОБЛИК ЗАБЛОКИРОВАН
                            </div>
                        )
                    ) : isActive ? (
                        <div
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                background: 'rgba(34, 197, 94, 0.12)',
                                border: '1.5px solid rgba(34, 197, 94, 0.45)',
                                borderRadius: '10px',
                                color: '#4ade80',
                                fontSize: '13px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1.5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            ✦ АКТИВЕН ДЛЯ БОЯ
                        </div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onSelect}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                background: 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#1a0f00',
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1.5px',
                                boxShadow: '0 4px 14px rgba(240,192,64,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            ВЫБРАТЬ ГЕРОЯ
                        </motion.button>
                    )
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                            <span
                                style={{
                                    color: 'rgba(255,255,255,0.35)',
                                    fontSize: '8px',
                                    fontWeight: 800,
                                    fontFamily: "'Nunito', sans-serif",
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                }}
                            >
                                СТОИМОСТЬ
                            </span>
                            <span
                                style={{
                                    color: hero.unlockType === 'diamonds' ? '#c084fc' : '#facc15',
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    fontFamily: "'Nunito', sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                {hero.unlockType === 'diamonds' ? '💎' : '🪙'} {hero.unlockCost}
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onBuy}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                background:
                                    hero.unlockType === 'diamonds'
                                        ? 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)'
                                        : 'linear-gradient(180deg, #f0c040 0%, #c8960a 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: hero.unlockType === 'diamonds' ? '#fff' : '#1a0f00',
                                fontSize: '13px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                boxShadow:
                                    hero.unlockType === 'diamonds'
                                        ? '0 4px 14px rgba(168,85,247,0.35)'
                                        : '0 4px 14px rgba(240,192,64,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            🔓 РАЗБЛОКИРОВАТЬ
                        </motion.button>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ── MAIN EXPORT COMPONENT ────────────────────────────────────────────────────
export const HeroList = ({ ownedHeroes, selectedHeroId, onBuyClick, onHeroClick }: any) => {
    const { setSelectedHeroId, ownedSkins, equippedSkins, equipSkin, setHeroGalleryId } = useGameStore((s: any) => ({
        setSelectedHeroId: s.setSelectedHeroId,
        ownedSkins: (s.ownedSkins as string[]) || ['default'],
        equippedSkins: (s.equippedSkins as Record<string, string>) || {},
        equipSkin: s.equipSkin,
        setHeroGalleryId: s.setHeroGalleryId,
    }));

    const [subTab, setSubTab] = useState<'ALL' | 'OWNED'>('ALL');
    const [classFilter, setClassFilter] = useState<string>('ALL');
    const [focusedId, setFocusedId] = useState<string>(selectedHeroId || HEROES_DB[0].id);
    const [previewSkinId, setPreviewSkinId] = useState<string | null>(null);

    const handleFocusHero = (heroId: string) => {
        setFocusedId(heroId);
        setPreviewSkinId(null);
    };

    const filteredHeroes = HEROES_DB.filter((hero) => {
        if (subTab === 'OWNED' && !ownedHeroes.includes(hero.id)) return false;
        if (classFilter !== 'ALL' && hero.role !== classFilter) return false;
        return true;
    }).sort((a, b) => {
        if (subTab === 'ALL') {
            return (ownedHeroes.includes(a.id) ? 0 : 1) - (ownedHeroes.includes(b.id) ? 0 : 1);
        }
        return 0;
    });

    const focusedHero = HEROES_DB.find((h) => h.id === focusedId) || filteredHeroes[0];
    const isFocusedOwned = ownedHeroes.includes(focusedHero?.id);
    const isFocusedActive = selectedHeroId === focusedHero?.id;

    const handleSelectHero = (hero: any) => {
        setSelectedHeroId(hero.id);
        if (onHeroClick) {
            onHeroClick(hero);
        } else {
            setHeroGalleryId(hero.id);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* ══════════ LEFT COLUMN: SELECTION ══════════ */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(10, 8, 7, 0.35)',
                    overflow: 'hidden',
                }}
            >
                {/* Filters */}
                <div
                    style={{
                        padding: '16px 14px 12px',
                        flexShrink: 0,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(6, 5, 4, 0.85)',
                            border: '1px solid rgba(240, 192, 64, 0.18)',
                            borderRadius: '10px',
                            padding: '4px',
                            gap: '4px',
                        }}
                    >
                        {(['ALL', 'OWNED'] as const).map((t) => (
                            <motion.button
                                key={t}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setSubTab(t);
                                    audioService.playSFX('SFX_CLICK');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    background: subTab === t ? '#f0c040' : 'transparent',
                                    border: 'none',
                                    borderRadius: '7px',
                                    color: subTab === t ? '#1a1200' : 'rgba(255, 255, 255, 0.45)',
                                    fontSize: '9.5px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    letterSpacing: '0.5px',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {t === 'ALL' ? 'ВСЕ ГЕРОИ' : 'МОИ ГЕРОИ'}
                            </motion.button>
                        ))}
                    </div>

                    <select
                        value={classFilter}
                        onChange={(e) => {
                            setClassFilter(e.target.value);
                            audioService.playSFX('SFX_CLICK');
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 28px 8px 12px',
                            background: 'rgba(6, 5, 4, 0.85)',
                            border: '1px solid rgba(240, 192, 64, 0.18)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '10.5px',
                            fontWeight: 700,
                            outline: 'none',
                            cursor: 'pointer',
                            letterSpacing: '0.5px',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23f0c040' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                        }}
                    >
                        <option value="ALL">ВСЕ КЛАССЫ</option>
                        <option value="WARRIOR">ВОИН</option>
                        <option value="TANK">ТАНК</option>
                        <option value="ASSASSIN">УБИЙЦА</option>
                        <option value="MAGE">МАГ</option>
                        <option value="SUPPORT">ПОДДЕРЖКА</option>
                    </select>
                </div>

                {/* Heroes Grid Scroll List */}
                <div
                    className="custom-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '20px',
                            alignContent: 'start',
                        }}
                    >
                        <AnimatePresence>
                            {filteredHeroes.map((hero, idx) => {
                                const isOwned = ownedHeroes.includes(hero.id);
                                const heroSkins = getSkinsForHero(hero.id);
                                const defaultSkin = heroSkins.find((s) => s.source === 'default') || heroSkins[0];
                                const activeSkinId = equippedSkins?.[hero.id] || defaultSkin.id;
                                const displaySkinId =
                                    focusedId === hero.id && previewSkinId ? previewSkinId : activeSkinId;
                                const activeSkin = heroSkins.find((s) => s.id === displaySkinId);
                                return (
                                    <motion.div
                                        key={hero.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.02 }}
                                    >
                                        <HeroCard
                                            hero={hero}
                                            isOwned={isOwned}
                                            isActive={selectedHeroId === hero.id}
                                            isSelected={focusedId === hero.id}
                                            activeSkin={activeSkin}
                                            onClick={() => {
                                                handleFocusHero(hero.id);
                                                audioService.playSFX('SFX_CLICK');
                                                if (onHeroClick) onHeroClick(hero);
                                                else setHeroGalleryId(hero.id);
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {filteredHeroes.length === 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '80px 0',
                                gap: '12px',
                            }}
                        >
                            <div style={{ fontSize: '32px', opacity: 0.2 }}>⚔️</div>
                            <div
                                style={{
                                    color: 'rgba(255,255,255,0.2)',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    letterSpacing: '1px',
                                }}
                            >
                                НЕТ ГЕРОЕВ
                            </div>
                        </div>
                    )}
                </div>

                {/* Collection counter / progress indicator */}
                <div
                    style={{
                        padding: '14px',
                        flexShrink: 0,
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        background: 'rgba(6, 5, 4, 0.8)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '9.5px',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 700,
                            letterSpacing: '1px',
                            marginBottom: '6px',
                        }}
                    >
                        <span>КОЛЛЕКЦИЯ ГЕРОЕВ</span>
                        <span>
                            {ownedHeroes.length} / {HEROES_DB.length}
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div
                        style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${(ownedHeroes.length / HEROES_DB.length) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #c8960a, #f0c040)',
                                boxShadow: '0 0 6px #f0c040',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ══════════ RIGHT COLUMN: DETAILED VIEW ══════════ */}
            <div style={{ width: '420px', flexShrink: 0, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {focusedHero ? (
                        <HeroDetailPanel
                            key={focusedHero.id}
                            hero={focusedHero}
                            isOwned={isFocusedOwned}
                            isActive={isFocusedActive}
                            ownedSkins={ownedSkins}
                            equippedSkins={equippedSkins}
                            equipSkin={equipSkin}
                            previewSkinId={previewSkinId}
                            setPreviewSkinId={setPreviewSkinId}
                            onSelect={() => handleSelectHero(focusedHero)}
                            onBuy={() => onBuyClick(focusedHero)}
                        />
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255,255,255,0.2)',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            ВЫБЕРИТЕ ГЕРОЯ ДЛЯ ПРОСМОТРА
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
