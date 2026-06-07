import { motion } from 'framer-motion';
import { rarityColors } from '../../../constants/roleIcons';
import { ROLE_ICONS } from '../../../constants/roleIcons';
import { audioService } from '../../../../../../../services/AudioService';
import { getSkinsForHero } from '../../../../../../../configs/SkinsConfig';
import { resolveAssetPath } from '../../../../../../../utils/assetPath';
import { RARITY_LABELS, SOURCE_ICONS, deriveStats } from '../utils/heroUtils';

const stoneBrickPattern =
    "url(\"data:image/svg+xml;utf8,<svg width='60' height='40' viewBox='0 0 60 40' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='40' fill='none'/><line x1='0' y1='20' x2='60' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='40' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='30' y1='0' x2='30' y2='20' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='20' x2='0' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='60' y1='20' x2='60' y2='40' stroke='rgba(0,0,0,0.52)' stroke-width='1.5'/><line x1='0' y1='1.5' x2='60' y2='1.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='0' y1='21.5' x2='60' y2='21.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='31.5' y1='0.8' x2='31.5' y2='19.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><line x1='1.5' y1='20.8' x2='1.5' y2='39.5' stroke='rgba(255,255,255,0.15)' stroke-width='1'/><path d='M44,3 L40,7 L42,12 L38,15' stroke='rgba(0,0,0,0.45)' stroke-width='0.8' fill='none'/><path d='M45,3.5 L41,7.5 L43,12.5 L39,15.5' stroke='rgba(255,255,255,0.08)' stroke-width='0.8' fill='none'/><line x1='6' y1='8' x2='20' y2='8' stroke='rgba(0,0,0,0.42)' stroke-width='0.8'/><line x1='6' y1='9' x2='20' y2='9' stroke='rgba(255,255,255,0.08)' stroke-width='0.8'/><path d='M10,23 L13,28 L11,34' stroke='rgba(0,0,0,0.48)' stroke-width='0.9' fill='none'/><path d='M11,23.5 L14,28.5 L12,34.5' stroke='rgba(255,255,255,0.09)' stroke-width='0.9' fill='none'/><path d='M35,33 L48,30 L54,32' stroke='rgba(0,0,0,0.42)' stroke-width='0.8' fill='none'/><path d='M35,34 L48,31 L54,33' stroke='rgba(255,255,255,0.07)' stroke-width='0.8' fill='none'/><circle cx='12' cy='14' r='0.8' fill='rgba(0,0,0,0.45)'/><circle cx='12.5' cy='14.5' r='0.4' fill='rgba(255,255,255,0.08)'/><circle cx='48' cy='26' r='1.2' fill='rgba(0,0,0,0.5)'/><circle cx='48.5' cy='26.5' r='0.6' fill='rgba(255,255,255,0.1)'/></svg>\")";

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
                background: 'rgba(18, 14, 11, 0.92)',
                border: '1.5px solid rgba(240, 192, 64, 0.22)',
                borderRadius: '10px',
                gap: '8px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
                <span
                    style={{
                        fontSize: '10.5px',
                        color: 'rgba(255, 254, 250, 0.6)',
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

// ── HERO DETAIL PANEL ─────────────────────────────────────────────────────────
interface HeroDetailPanelProps {
    hero: any;
    isOwned: boolean;
    isActive: boolean;
    onSelect: () => void;
    onBuy: () => void;
    ownedSkins: string[];
    equippedSkins: Record<string, string>;
    equipSkin: (heroId: string, skinId: string) => void;
    previewSkinId: string | null;
    setPreviewSkinId: (id: string | null) => void;
}

export function HeroDetailPanel({
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
}: HeroDetailPanelProps) {
    const skins = getSkinsForHero(hero.id);
    // Guard: если нет скинов в SkinsConfig — создаём fallback вместо краша
    const defaultSkin = skins.find((s) => s.source === 'default') ||
        skins[0] || {
            id: `${hero.id}_default`,
            name: hero.title || hero.name,
            description: '',
            image: hero.image,
            heroId: hero.id,
            source: 'default' as const,
            sourceLabel: 'По умолчанию',
            rarity: hero.rarity,
        };
    const activeSkinId = equippedSkins?.[hero.id] || defaultSkin.id;
    const previewId = previewSkinId;
    const setPreviewId = setPreviewSkinId;
    const displaySkin = skins.find((s) => s.id === (previewId || activeSkinId)) || skins[0] || defaultSkin;

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
                background: `radial-gradient(circle at 50% 0%, ${color}2d 0%, transparent 65%), ${stoneBrickPattern}, linear-gradient(180deg, rgba(28, 22, 18, 0.99) 0%, rgba(16, 12, 10, 1.0) 100%)`,
                borderLeft: '1px solid rgba(240, 192, 64, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '24px 24px 16px',
                    borderBottom: '1px solid rgba(240, 192, 64, 0.25)',
                    background: 'linear-gradient(180deg, rgba(26, 20, 16, 0.98) 0%, rgba(18, 14, 11, 1.0) 100%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    flexShrink: 0,
                }}
            >
                {/* 1. Name */}
                <div
                    style={{
                        color: '#fdfbf7',
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
                        color:
                            displaySkin && displaySkin.id !== 'default'
                                ? displaySkin.color || color
                                : 'rgba(255, 254, 250, 0.6)',
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
                    <span style={{ color: 'rgba(255, 254, 250, 0.25)', fontSize: '12px' }}>·</span>
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

            {/* Scrollable body */}
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
                {/* Class badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(18, 14, 11, 0.92)',
                        border: `1.5px solid ${roleInfo.color}44`,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
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
                                color: 'rgba(255, 254, 250, 0.5)',
                                fontSize: '9px',
                                fontFamily: "'Nunito', sans-serif",
                                marginTop: '1px',
                            }}
                        >
                            Уникальная роль в сражениях арены
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div>
                    <div
                        style={{
                            fontSize: '9.5px',
                            fontWeight: 900,
                            color: 'rgba(255, 254, 250, 0.4)',
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

                {/* Skins */}
                <div>
                    <div
                        style={{
                            fontSize: '9.5px',
                            fontWeight: 900,
                            color: 'rgba(255, 254, 250, 0.4)',
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
                                color: 'rgba(255, 254, 250, 0.5)',
                                fontWeight: 700,
                                fontSize: '9px',
                                fontFamily: "'Nunito', sans-serif",
                            }}
                        >
                            {skins.filter((s) => ownedSkins.includes(s.id) || s.source === 'default').length}/
                            {skins.length} ОТКРЫТО
                        </span>
                    </div>

                    {/* Skin thumbnails */}
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
                                            : '1.5px solid rgba(240, 192, 64, 0.2)',
                                        background: isSelectedSkin
                                            ? `linear-gradient(135deg, rgba(42, 33, 26, 0.98) 0%, rgba(24, 18, 14, 0.99) 100%)`
                                            : 'linear-gradient(135deg, rgba(24, 19, 16, 0.98) 0%, rgba(16, 13, 11, 0.99) 100%)',
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
                                        src={resolveAssetPath(skin.image)}
                                        style={{
                                            height: '70%',
                                            width: 'auto',
                                            objectFit: 'contain',
                                            filter: skinOwned
                                                ? 'none'
                                                : 'grayscale(0.6) sepia(0.4) brightness(0.85) opacity(0.8)',
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
                                                background:
                                                    'linear-gradient(180deg, rgba(20, 16, 12, 0.25) 0%, rgba(240, 192, 64, 0.1) 100%)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #f5d782 0%, #d59f22 100%)',
                                                    border: '1px solid #fffdf7',
                                                    boxShadow: '0 1px 4px rgba(197, 137, 17, 0.3)',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                <svg width="8" height="10" viewBox="0 0 10 12" fill="none">
                                                    <path
                                                        d="M2.5 4.5V3a2.5 2.5 0 1 1 5 0v1.5M1.5 4.5h7a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z"
                                                        stroke="#fff"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '8px',
                                                    color: '#f0c040',
                                                    fontFamily: "'Nunito', sans-serif",
                                                    fontWeight: 900,
                                                    textAlign: 'center',
                                                    padding: '1px 4px',
                                                    textTransform: 'uppercase',
                                                    background: 'rgba(20, 16, 12, 0.85)',
                                                    border: '1px solid rgba(240, 192, 64, 0.25)',
                                                    borderRadius: '4px',
                                                    letterSpacing: '0.3px',
                                                }}
                                            >
                                                {SOURCE_ICONS[skin.source] || '🏆'} {skin.sourceLabel || 'БП'}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Skin info card */}
                    <div
                        style={{
                            marginTop: '10px',
                            background: 'rgba(18, 14, 11, 0.92)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            border: '1.5px solid rgba(240, 192, 64, 0.25)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div
                            style={{
                                color: displaySkin?.color || '#fdfbf7',
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
                                color: 'rgba(255, 254, 250, 0.7)',
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

            {/* Footer buttons */}
            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: 'auto',
                    flexShrink: 0,
                    padding: '16px 24px 24px',
                    borderTop: '1px solid rgba(240, 192, 64, 0.25)',
                    background: 'linear-gradient(360deg, rgba(14, 11, 9, 0.99) 0%, rgba(20, 16, 13, 0.98) 100%)',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
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
                                    color: 'rgba(255, 254, 250, 0.5)',
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
