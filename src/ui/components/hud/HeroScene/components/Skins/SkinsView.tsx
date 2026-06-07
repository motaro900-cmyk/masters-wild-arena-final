import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../../../store/useGameStore';
import { getSkinsForHero, ISkinConfig } from '../../../../../../configs/SkinsConfig';
import { rarityColors } from '../../constants/roleIcons';
import { audioService } from '../../../../../../services/AudioService';
import { resolveAssetPath } from '../../../../../../utils/assetPath';

const RARITY_LABELS: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
};

const SOURCE_ICONS: Record<string, string> = {
    default: '🎁',
    battle_pass: '🏆',
    shop: '🛒',
    achievement: '🏅',
    event: '🌟',
};

export const SkinsView = ({ hero }: { hero: any }) => {
    const { ownedSkins, equippedSkins, equipSkin } = useGameStore((s: any) => ({
        ownedSkins: s.ownedSkins as string[],
        equippedSkins: s.equippedSkins as Record<string, string>,
        equipSkin: s.equipSkin,
    }));

    const skins = getSkinsForHero(hero.id);
    const activeSkinId = equippedSkins?.[hero.id] || 'default';
    const [previewSkin, setPreviewSkin] = useState<ISkinConfig | null>(null);

    // Which skin to show in big preview: hovered or currently equipped
    const displaySkin = previewSkin || skins.find((s) => s.id === activeSkinId) || skins[0];

    return (
        <div
            style={{
                display: 'flex',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* ── LEFT: BIG PREVIEW ── */}
            <div
                style={{
                    width: '340px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    padding: '24px 20px',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    background: 'linear-gradient(180deg, rgba(10,8,5,0.0) 0%, rgba(10,8,5,0.7) 100%)',
                }}
            >
                {/* Rarity glow bg */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(ellipse at 50% 40%, ${rarityColors[displaySkin?.rarity] || '#fff'}18 0%, transparent 65%)`,
                        pointerEvents: 'none',
                    }}
                />

                {/* Hero Portrait */}
                <AnimatePresence mode="wait">
                    <motion.img
                        key={displaySkin?.id}
                        src={resolveAssetPath(displaySkin?.image || '')}
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -6 }}
                        transition={{ duration: 0.22 }}
                        style={{
                            height: '72%',
                            width: 'auto',
                            objectFit: 'contain',
                            zIndex: 2,
                            position: 'absolute',
                            bottom: '130px',
                            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))',
                        }}
                        alt={displaySkin?.name}
                    />
                </AnimatePresence>

                {/* Skin info card below portrait */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 3,
                        width: '100%',
                        background: 'linear-gradient(180deg, #100d0a 0%, #080605 100%)',
                        border: `1px solid ${rarityColors[displaySkin?.rarity] || 'rgba(255,255,255,0.1)'}44`,
                        borderRadius: '16px',
                        padding: '16px 18px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                        }}
                    >
                        <span
                            style={{
                                color: displaySkin?.color || '#fff',
                                fontSize: '16px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '0.5px',
                            }}
                        >
                            {displaySkin?.name}
                        </span>
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 900,
                                fontFamily: "'Nunito', sans-serif",
                                color: rarityColors[displaySkin?.rarity] || '#fff',
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                            }}
                        >
                            {RARITY_LABELS[displaySkin?.rarity] || ''}
                        </span>
                    </div>

                    <div
                        style={{
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: '11px',
                            fontFamily: "'Nunito', sans-serif",
                            lineHeight: 1.5,
                            marginBottom: '10px',
                        }}
                    >
                        {displaySkin?.description}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.3)',
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                        }}
                    >
                        <span>{SOURCE_ICONS[displaySkin?.source || 'default']}</span>
                        <span>{displaySkin?.sourceLabel}</span>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: SKIN GRID ── */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: '28px 36px',
                    gap: '20px',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: '3px',
                            height: '28px',
                            background: 'linear-gradient(180deg, #f0c040, rgba(240,192,64,0.3))',
                            borderRadius: '2px',
                        }}
                    />
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '22px',
                            fontWeight: 900,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                        }}
                    >
                        ОБЛИК
                    </span>
                    <span
                        style={{
                            color: 'rgba(255,255,255,0.25)',
                            fontSize: '13px',
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 600,
                            marginLeft: '4px',
                        }}
                    >
                        {skins.filter((s) => ownedSkins.includes(s.id) || s.source === 'default').length}/{skins.length}{' '}
                        получено
                    </span>
                </div>

                {/* Skin cards grid */}
                <div
                    className="custom-scrollbar"
                    style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 210px))',
                        gap: '16px',
                        overflowY: 'auto',
                        alignContent: 'start',
                        paddingBottom: '16px',
                    }}
                >
                    {skins.map((skin, i) => {
                        const isOwned = ownedSkins.includes(skin.id) || skin.source === 'default';
                        const isActive = activeSkinId === skin.id;
                        const isHovered = previewSkin?.id === skin.id;
                        const color = rarityColors[skin.rarity] || '#fff';

                        return (
                            <motion.div
                                key={skin.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                onHoverStart={() => setPreviewSkin(skin)}
                                onHoverEnd={() => setPreviewSkin(null)}
                                onClick={() => {
                                    if (!isOwned) return;
                                    equipSkin(hero.id, skin.id);
                                    audioService.playSFX('SFX_CLICK');
                                }}
                                style={{
                                    position: 'relative',
                                    background: isActive
                                        ? `linear-gradient(180deg, rgba(20,16,10,0.97) 0%, ${color}18 100%)`
                                        : 'linear-gradient(180deg, rgba(14,12,10,0.97) 0%, rgba(20,16,10,0.97) 100%)',
                                    border: isActive
                                        ? `2px solid ${color}`
                                        : isHovered
                                          ? `1.5px solid ${color}88`
                                          : '1.5px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    cursor: isOwned ? 'pointer' : 'default',
                                    boxShadow: isActive
                                        ? `0 0 24px ${color}44, 0 8px 20px rgba(0,0,0,0.8)`
                                        : isHovered
                                          ? `0 6px 16px ${color}22, 0 8px 18px rgba(0,0,0,0.7)`
                                          : '0 4px 12px rgba(0,0,0,0.55)',
                                    transition: 'box-shadow 0.2s, border-color 0.2s',
                                    aspectRatio: '3/4',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Active top glow line */}
                                {isActive && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                                            zIndex: 5,
                                        }}
                                    />
                                )}

                                {/* Lock / active badge */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: isActive
                                            ? `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`
                                            : isOwned
                                              ? 'rgba(34,197,94,0.85)'
                                              : 'rgba(0,0,0,0.7)',
                                        border: '1.5px solid rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        zIndex: 5,
                                    }}
                                >
                                    {isActive ? '✦' : isOwned ? '✓' : '🔒'}
                                </div>

                                {/* Preview image */}
                                <div
                                    style={{
                                        flex: 1,
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: isOwned
                                                ? `radial-gradient(circle at 50% 30%, ${color}20 0%, transparent 70%)`
                                                : 'none',
                                        }}
                                    />
                                    <img
                                        src={resolveAssetPath(skin.image)}
                                        style={{
                                            height: '90%',
                                            width: 'auto',
                                            objectFit: 'contain',
                                            zIndex: 2,
                                            filter: isOwned ? 'none' : 'grayscale(1) brightness(0.25)',
                                            transition: 'filter 0.3s',
                                        }}
                                        alt={skin.name}
                                        draggable={false}
                                    />
                                </div>

                                {/* Card footer */}
                                <div
                                    style={{
                                        padding: '10px 12px 12px',
                                        background: 'rgba(6,5,8,0.95)',
                                        borderTop: `1px solid ${isActive ? color + '44' : 'rgba(255,255,255,0.05)'}`,
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            color: skin.color || '#fff',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            fontFamily: "'Cinzel', serif",
                                            letterSpacing: '0.3px',
                                            marginBottom: '3px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {skin.name}
                                    </div>
                                    <div
                                        style={{
                                            color: color,
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            fontFamily: "'Nunito', sans-serif",
                                            letterSpacing: '1.5px',
                                            textTransform: 'uppercase',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        {RARITY_LABELS[skin.rarity]}
                                    </div>

                                    {/* Source badge */}
                                    <div
                                        style={{
                                            fontSize: '9px',
                                            color: 'rgba(255,255,255,0.35)',
                                            fontFamily: "'Nunito', sans-serif",
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <span>{SOURCE_ICONS[skin.source]}</span>
                                        <span
                                            style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {skin.sourceLabel}
                                        </span>
                                    </div>

                                    {/* Action button */}
                                    {isOwned ? (
                                        <div
                                            style={{
                                                padding: '6px 0',
                                                borderRadius: '8px',
                                                textAlign: 'center',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                fontFamily: "'Cinzel', serif",
                                                letterSpacing: '0.8px',
                                                background: isActive ? `${color}22` : 'rgba(255,255,255,0.05)',
                                                border: isActive
                                                    ? `1px solid ${color}66`
                                                    : '1px solid rgba(255,255,255,0.08)',
                                                color: isActive ? color : 'rgba(255,255,255,0.45)',
                                                cursor: isActive ? 'default' : 'pointer',
                                            }}
                                        >
                                            {isActive ? '✦ НАДЕТ' : 'НАДЕТЬ'}
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                padding: '6px 0',
                                                borderRadius: '8px',
                                                textAlign: 'center',
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                fontFamily: "'Nunito', sans-serif",
                                                color: 'rgba(255,255,255,0.2)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                background: 'rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            🔒 НЕ ПОЛУЧЕН
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
