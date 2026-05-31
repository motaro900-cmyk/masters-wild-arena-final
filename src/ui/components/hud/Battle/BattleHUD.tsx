import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { getRankInfo } from '../../../../configs/RankSystem';
import { AssetsMap } from '../../../../configs/AssetsMap';

interface BattleHUDProps {
    playerHero: any;
    enemyData: any;
    battleMode: string;
    activePveEnemy: any;
    battleState: any;
    playerPulse: boolean;
    enemyPulse: boolean;
    currentAttacker: 'player' | 'enemy' | null;
    liveLog: Array<{ id: number; text: string; type: string }>;
}

/** Угловая декорация для панели */
const CornerAccent: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; color: string }> = ({ position, color }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        width: '12px',
        height: '12px',
        zIndex: 10,
        ...(position === 'tl' && {
            top: -1,
            left: -1,
            borderTop: `2px solid ${color}`,
            borderLeft: `2px solid ${color}`,
        }),
        ...(position === 'tr' && {
            top: -1,
            right: -1,
            borderTop: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
        }),
        ...(position === 'bl' && {
            bottom: -1,
            left: -1,
            borderBottom: `2px solid ${color}`,
            borderLeft: `2px solid ${color}`,
        }),
        ...(position === 'br' && {
            bottom: -1,
            right: -1,
            borderBottom: `2px solid ${color}`,
            borderRight: `2px solid ${color}`,
        }),
    };
    return <div style={style} />;
};

/** Сочный HP-бар с цветом в зависимости от процента */
const HpBar: React.FC<{
    current: number;
    max: number;
    reverse?: boolean;
    isEnemy?: boolean;
}> = ({ current, max, reverse = false, isEnemy = false }) => {
    const pct = Math.max(0, Math.min(100, (Math.max(0, current) / Math.max(1, max)) * 100));

    let barColor: string;
    let borderColor: string;
    let glowColor: string;

    if (isEnemy) {
        // Red theme for Enemy
        barColor = 'linear-gradient(90deg, #991b1b 0%, #ef4444 50%, #991b1b 100%)';
        borderColor = 'rgba(239,68,68,0.85)';
        glowColor = 'rgba(239,68,68,0.28)';
    } else {
        // Green theme for Player
        barColor = 'linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)';
        borderColor = 'rgba(34,197,94,0.85)';
        glowColor = 'rgba(34,197,94,0.22)';
    }

    return (
        <div
            style={{
                height: '30px',
                background: 'rgba(0,0,0,0.82)',
                border: `2px solid ${borderColor}`,
                borderRadius: '6px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 0 14px ${glowColor}, inset 0 0 10px rgba(0,0,0,0.6)`,
                transition: 'border-color 0.5s, box-shadow 0.5s',
            }}
        >
            {/* Bar fill */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    justifyContent: reverse ? 'flex-end' : 'flex-start',
                    overflow: 'hidden',
                }}
            >
                <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        background: barColor,
                        position: 'relative',
                        overflow: 'hidden',
                        minWidth: 0,
                    }}
                >
                    {/* Top highlight sheen */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '45%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                            pointerEvents: 'none',
                        }}
                    />
                    {/* Moving shimmer */}
                    <motion.div
                        animate={{ x: ['-120%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '35%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                            pointerEvents: 'none',
                        }}
                    />
                </motion.div>
            </div>

            {/* Dividers (decorative tick marks) */}
            {[25, 50, 75].map((tick) => (
                <div
                    key={tick}
                    style={{
                        position: 'absolute',
                        left: `${tick}%`,
                        top: 0,
                        bottom: 0,
                        width: '1.5px',
                        background: 'rgba(255,255,255,0.15)',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Label */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 900,
                    fontFamily: "'Outfit', 'Cinzel', sans-serif",
                    color: '#fff',
                    textShadow: '0 0 5px rgba(0,0,0,1), 1px 1px 3px rgba(0,0,0,1)',
                    letterSpacing: '0.8px',
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
            >
                ❤️ {Math.max(0, current)} / {max}
            </div>
        </div>
    );
};

/** Панель отображения активных дебаффов/эффектов под HP-баром */
const StatusIcons: React.FC<{
    statuses?: Array<{ type: string; stacks: number; duration: number }>;
    isEnemy?: boolean;
}> = ({ statuses = [], isEnemy = false }) => {
    if (!statuses || statuses.length === 0) return null;

    return (
        <div
            style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                justifyContent: isEnemy ? 'flex-end' : 'flex-start',
                position: 'absolute',
                left: isEnemy ? 'auto' : '130px',
                right: isEnemy ? '130px' : 'auto',
                bottom: '-28px', // Positioned below the HP bar
                width: '280px',
                pointerEvents: 'none',
                zIndex: 150,
            }}
        >
            {statuses.map((status, idx) => {
                let emoji = '💫';
                let color = '#FFD700'; // STUN
                let label = 'Оглушение';
                if (status.type === 'BURN') {
                    emoji = '🔥';
                    color = '#FF4500';
                    label = 'Горение';
                } else if (status.type === 'FREEZE') {
                    emoji = '❄️';
                    color = '#00BFFF';
                    label = 'Заморозка';
                } else if (status.type === 'POISON') {
                    emoji = '☠️';
                    color = '#32CD32';
                    label = 'Яд';
                }

                return (
                    <div
                        key={idx}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(15, 8, 4, 0.95)',
                            border: `1.5px solid ${color}`,
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontFamily: 'Outfit, Inter, sans-serif',
                            boxShadow: `0 0 6px ${color}55`,
                            textShadow: '1px 1px 2px #000',
                        }}
                        title={`${label}: ${status.duration} ход.`}
                    >
                        <span style={{ fontSize: '13px' }}>{emoji}</span>
                        <span style={{ fontSize: '11px' }}>{label}</span>
                        {status.stacks > 1 && (
                            <span style={{ color: '#FFD700', fontSize: '11px', fontWeight: '900' }}>
                                x{status.stacks}
                            </span>
                        )}
                        <span style={{ opacity: 0.7, fontSize: '10px', marginLeft: '2px' }}>({status.duration}х)</span>
                    </div>
                );
            })}
        </div>
    );
};

export const BattleHUD: React.FC<BattleHUDProps> = ({
    enemyData,
    battleMode,
    activePveEnemy,
    battleState,
    playerPulse,
    enemyPulse,
    currentAttacker,
    liveLog,
}) => {
    const [timeLeft, setTimeLeft] = React.useState(300); // 5 minutes in seconds

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const playerLevel = useGameStore((s) => s.level) || 1;
    const playerRating = useGameStore((s) => s.rating || s.trophies || 0);
    const playerRank = getRankInfo(playerRating);
    const playerName = useGameStore((s) => s.name) || 'Мастер';
    const rawAvatar = useGameStore((s) => s.avatar);
    const vkUser = useGameStore((s) => s.vkUser);

    const playerAvatar = useMemo(() => {
        if (rawAvatar && rawAvatar.startsWith('http')) return rawAvatar;
        return vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp';
    }, [rawAvatar, vkUser]);

    const activeRankedOpponent = useGameStore((s) => s.activeRankedOpponent);

    const { enemyLevel, enemyRating } = useMemo(() => {
        if (battleMode === 'PVE' && activePveEnemy) {
            const lvl = activePveEnemy.level || 1;
            return { enemyLevel: lvl, enemyRating: Math.max(0, lvl * 180) };
        }
        if (battleMode === 'RANKED' && activeRankedOpponent) {
            return {
                enemyLevel: activeRankedOpponent.level || 1,
                enemyRating: activeRankedOpponent.rating || 0,
            };
        }
        return { enemyLevel: Math.max(1, playerLevel), enemyRating: Math.max(0, playerRating) };
    }, [battleMode, activePveEnemy, playerLevel, playerRating, activeRankedOpponent]);

    const enemyRank = getRankInfo(enemyRating);

    const enemyName = battleMode === 'PVE' && activePveEnemy ? activePveEnemy.name : enemyData.name;
    const lastLog = liveLog.length > 0 ? liveLog[liveLog.length - 1] : null;

    // Enemy Avatar
    const enemyAvatar = useMemo(() => {
        if (battleMode === 'PVE') {
            // PVE mobs image path is usually raw character sprite. Make sure it uses that.
            return enemyData.image || '/assets/images/avatars/енот.webp';
        }
        // PVP enemy hero avatar
        return enemyData.image || '/assets/images/avatars/енот.webp';
    }, [battleMode, enemyData]);

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
            <div
                style={{
                    padding: '20px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    boxSizing: 'border-box',
                    gap: '16px',
                }}
            >
                {/* ══════════════ ПАНЕЛЬ ИГРОКА ══════════════ */}
                <motion.div
                    animate={{ scale: playerPulse ? 1.015 : 1 }}
                    transition={{ duration: 0.12 }}
                    style={{
                        position: 'relative',
                        width: '465px',
                        height: '112px',
                        flexShrink: 0,
                    }}
                >
                    {/* Background Plate */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${AssetsMap.UI.PROFILE_PANEL_BASE})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            filter:
                                currentAttacker === 'player'
                                    ? 'drop-shadow(0 0 15px rgba(240,180,40,0.5))'
                                    : 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                            transition: 'filter 0.3s',
                        }}
                    />

                    {/* Avatar & Frame & Level Badge */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '-18px',
                            top: '-20px',
                            width: '160px',
                            height: '160px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Avatar Image */}
                        <div
                            style={{
                                width: '108px',
                                height: '108px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'translateY(1px)',
                                zIndex: 10,
                            }}
                        >
                            <img
                                src={playerAvatar}
                                alt="Player Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }}
                            />
                        </div>

                        {/* Round Frame */}
                        <img
                            src={AssetsMap.UI.AVATAR_FRAME_NEW}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 20,
                            }}
                            alt="frame"
                        />

                        {/* Level Badge */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-6px', // Lowered from 8px to align exactly over the lower-left empty circle
                                left: '8px', // Shifted left from 112px to cover the frame's badge holder circle
                                width: '40px',
                                height: '40px',
                                zIndex: 30,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {/* Filled circle background to ensure level text stands out and is filled inside */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: '#1a1008',
                                    border: '1.5px solid #d97706',
                                    boxShadow: '0 0 8px rgba(217,119,6,0.3)',
                                }}
                            />
                            <img
                                src={AssetsMap.UI.LVL_BADGE}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    zIndex: 2,
                                }}
                                alt="lvl-bg"
                            />
                            <span
                                style={{
                                    position: 'relative',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '15px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    textShadow: '0 2px 4px rgba(0,0,0,1)',
                                    zIndex: 1,
                                    marginTop: '-1px',
                                }}
                            >
                                {playerLevel}
                            </span>
                        </div>
                    </div>

                    {/* Nickname, Rank, Trophies */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '140px',
                            top: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                color: currentAttacker === 'player' ? '#fcd34d' : '#fff',
                                fontSize: '14px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textShadow: '0 2px 5px rgba(0,0,0,1)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '260px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {/* Индикатор атаки */}
                            {currentAttacker === 'player' && (
                                <motion.div
                                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        background: '#fbbf24',
                                        boxShadow: '0 0 10px #fbbf24',
                                    }}
                                />
                            )}
                            <span>{playerName}</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '2px',
                            }}
                        >
                            <img
                                src={playerRank.icon}
                                alt={playerRank.name}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 0 4px ${playerRank.glow})`,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    fontFamily: "'Outfit', sans-serif",
                                    color: '#ffffff',
                                    textShadow: `0 0 8px rgba(255,255,255,0.45), 0 2px 3px rgba(0,0,0,1)`,
                                    letterSpacing: '0.8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                }}
                            >
                                {playerRank.name} · {playerRating}{' '}
                                <img
                                    src="/assets/images/ui/trophy_premium.webp"
                                    style={{ width: '18px', height: '18px', objectFit: 'contain', marginLeft: '4px' }}
                                    alt=""
                                />
                            </span>
                        </div>
                    </div>

                    {/* HP Bar instead of Exp Bar */}
                    <StatusIcons statuses={battleState.playerStatuses} />
                    <div
                        style={{
                            position: 'absolute',
                            left: '130px',
                            bottom: '5px',
                            width: '280px',
                            height: '35px',
                        }}
                    >
                        <HpBar current={battleState.playerHP} max={battleState.playerMaxHP} />
                    </div>
                </motion.div>

                {/* ══════════════ ЦЕНТР ══════════════ */}
                <div
                    style={{
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: '4px',
                        gap: '8px',
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(160deg, rgba(20, 12, 6, 0.95) 0%, rgba(35, 18, 5, 0.92) 100%)',
                            backdropFilter: 'blur(16px)',
                            border: '2px solid rgba(180, 120, 30, 0.55)',
                            borderRadius: '4px',
                            padding: '10px 28px',
                            position: 'relative',
                            boxShadow: '0 0 20px rgba(0,0,0,0.7), inset 0 0 12px rgba(200,120,20,0.07)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                        }}
                    >
                        <CornerAccent position="tl" color="rgba(240,180,40,0.9)" />
                        <CornerAccent position="tr" color="rgba(240,180,40,0.9)" />
                        <CornerAccent position="bl" color="rgba(240,180,40,0.5)" />
                        <CornerAccent position="br" color="rgba(240,180,40,0.5)" />
                        <div
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '32px',
                                fontWeight: 900,
                                color: '#fcd34d',
                                letterSpacing: '4px',
                                textShadow: '0 0 20px rgba(251,191,36,0.7), 0 2px 8px rgba(0,0,0,1)',
                                lineHeight: 1.1,
                            }}
                        >
                            VS
                        </div>
                        <div
                            style={{
                                fontFamily: "'Russo One', 'Outfit', sans-serif",
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#fef3c7',
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                letterSpacing: '1px',
                            }}
                        >
                            ⏱️ {formatTime(timeLeft)}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {lastLog && (
                            <motion.div
                                key={lastLog.id}
                                initial={{ opacity: 0, y: -6, scale: 0.88 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.88 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                style={{
                                    background: 'rgba(10, 6, 3, 0.82)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(180,120,30,0.3)',
                                    borderRadius: '4px',
                                    padding: '5px 16px',
                                    maxWidth: '260px',
                                    textAlign: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        letterSpacing: '0.3px',
                                        color:
                                            lastLog.type === 'CRIT'
                                                ? '#fcd34d'
                                                : lastLog.type === 'DODGE'
                                                  ? '#94a3b8'
                                                  : lastLog.type === 'BLOCK'
                                                    ? '#38bdf8'
                                                    : lastLog.type === 'STUN' || lastLog.type === 'INSTINCT'
                                                      ? '#c084fc'
                                                      : '#e2d9c8',
                                        textShadow: '0 1px 4px rgba(0,0,0,1)',
                                    }}
                                >
                                    {lastLog.text}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ══════════════ ПАНЕЛЬ ВРАГА ══════════════ */}
                <motion.div
                    animate={{ scale: enemyPulse ? 1.015 : 1 }}
                    transition={{ duration: 0.12 }}
                    style={{
                        position: 'relative',
                        width: '465px',
                        height: '112px',
                        flexShrink: 0,
                    }}
                >
                    {/* Background Plate (MIRRORED) */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url(${AssetsMap.UI.PROFILE_PANEL_BASE})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            transform: 'scaleX(-1)',
                            filter:
                                currentAttacker === 'enemy'
                                    ? 'drop-shadow(0 0 15px rgba(239,68,68,0.5))'
                                    : 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                            transition: 'filter 0.3s',
                        }}
                    />

                    {/* Avatar & Frame & Level Badge (Symmetric to right side) */}
                    <div
                        style={{
                            position: 'absolute',
                            right: '-18px',
                            top: '-20px',
                            width: '160px',
                            height: '160px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Avatar Image */}
                        <div
                            style={{
                                width: '108px',
                                height: '108px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'translateY(1px)',
                                zIndex: 10,
                            }}
                        >
                            <img
                                src={enemyAvatar}
                                alt="Enemy Avatar"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: battleMode === 'PVE' ? 'contain' : 'cover',
                                    transform: 'scale(1.05)',
                                }}
                            />
                        </div>

                        {/* Round Frame */}
                        <img
                            src={AssetsMap.UI.AVATAR_FRAME_NEW}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 20,
                            }}
                            alt="frame"
                        />

                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-6px', // Lowered from 8px to align exactly over the lower-right empty circle
                                right: '8px', // Shifted right from 112px to cover the frame's badge holder circle
                                width: '40px',
                                height: '40px',
                                zIndex: 30,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {/* Filled circle background to ensure level text stands out and is filled inside */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: '#1a1008',
                                    border: '1.5px solid #d97706',
                                    boxShadow: '0 0 8px rgba(217,119,6,0.3)',
                                }}
                            />
                            <img
                                src={AssetsMap.UI.LVL_BADGE}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    zIndex: 2,
                                }}
                                alt="lvl-bg"
                            />
                            <span
                                style={{
                                    position: 'relative',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '15px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    textShadow: '0 2px 4px rgba(0,0,0,1)',
                                    zIndex: 1,
                                    marginTop: '-1px',
                                }}
                            >
                                {enemyLevel}
                            </span>
                        </div>
                    </div>

                    {/* Nickname, Rank, Trophies (Symmetric to right side, text-align: right) */}
                    <div
                        style={{
                            position: 'absolute',
                            right: '140px',
                            top: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                        }}
                    >
                        <div
                            style={{
                                color: currentAttacker === 'enemy' ? '#fca5a5' : '#fff',
                                fontSize: '14px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textShadow: '0 2px 5px rgba(0,0,0,1)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '260px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {/* Индикатор атаки */}
                            {currentAttacker === 'enemy' && (
                                <motion.div
                                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        background: '#ef4444',
                                        boxShadow: '0 0 10px #ef4444',
                                    }}
                                />
                            )}
                            <span>{enemyName}</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '2px',
                            }}
                        >
                            <img
                                src={enemyRank.icon}
                                alt={enemyRank.name}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 0 4px ${enemyRank.glow})`,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    fontFamily: "'Outfit', sans-serif",
                                    color: '#ffffff',
                                    textShadow: `0 0 8px rgba(255,255,255,0.45), 0 2px 3px rgba(0,0,0,1)`,
                                    letterSpacing: '0.8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                }}
                            >
                                {enemyRank.name} · {enemyRating}{' '}
                                <img
                                    src="/assets/images/ui/trophy_premium.webp"
                                    style={{ width: '18px', height: '18px', objectFit: 'contain', marginLeft: '4px' }}
                                    alt=""
                                />
                            </span>
                        </div>
                    </div>

                    {/* HP Bar instead of Exp Bar (Symmetric to right side) */}
                    <StatusIcons statuses={battleState.enemyStatuses} isEnemy />
                    <div
                        style={{
                            position: 'absolute',
                            right: '130px',
                            bottom: '5px',
                            width: '280px',
                            height: '35px',
                        }}
                    >
                        <HpBar current={battleState.enemyHP} max={battleState.enemyMaxHP} reverse isEnemy />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
