import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { getRankInfo } from '../../../../configs/RankSystem';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { getAvatarFrameStyle, getAvatarFramePath, getAvatarImageStyle } from '../../../../configs/ProfileCustomization';

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
const CornerAccent = React.memo<{ position: 'tl' | 'tr' | 'bl' | 'br'; color: string }>(({ position, color }) => {
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
});

/** Сочный HP-бар с цветом в зависимости от процента */
const HpBar = React.memo<{
    current: number;
    max: number;
    reverse?: boolean;
    isEnemy?: boolean;
    shield?: number;
}>(({ current, max, reverse = false, isEnemy = false, shield = 0 }) => {
    const pct = Math.max(0, Math.min(100, (Math.max(0, current) / Math.max(1, max)) * 100));
    const shieldPct = Math.max(0, Math.min(100 - pct, (shield / Math.max(1, max)) * 100));

    let barColor: string;
    let borderColor: string;
    let glowColor: string;

    if (isEnemy) {
        // Red theme for Enemy
        barColor = 'linear-gradient(90deg, #b91c1c 0%, #f87171 50%, #b91c1c 100%)';
        borderColor = 'rgba(248,113,113,0.85)';
        glowColor = 'rgba(248,113,113,0.4)';
    } else {
        // Green theme for Player
        barColor = 'linear-gradient(90deg, #15803d 0%, #4ade80 50%, #15803d 100%)';
        borderColor = 'rgba(74,222,128,0.85)';
        glowColor = 'rgba(74,222,128,0.35)';
    }

    return (
        <div
            style={{
                height: '30px',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                border: `2px solid ${borderColor}`,
                borderRadius: '10px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 0 16px ${glowColor}, inset 0 0 12px rgba(0,0,0,0.8)`,
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
                {shield > 0 && (
                    <motion.div
                        animate={{ width: `${shieldPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 50%, #0284c7 100%)',
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
                                background:
                                    'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                                pointerEvents: 'none',
                            }}
                        />
                    </motion.div>
                )}
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
                ❤️ {Math.max(0, current)} {shield > 0 ? `[+🛡️ ${shield}]` : ''} / {max}
            </div>
        </div>
    );
});

/** Панель отображения активных дебаффов/эффектов под HP-баром */
const StatusIcons = React.memo<{
    statuses?: Array<{ type: string; stacks: number; duration: number }>;
    isEnemy?: boolean;
}>(({ statuses = [], isEnemy = false }) => {
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
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.08 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(15, 8, 4, 0.65)',
                            backdropFilter: 'blur(8px)',
                            border: `1.5px solid ${color}`,
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontFamily: 'Outfit, Inter, sans-serif',
                            boxShadow: `0 0 8px ${color}66, inset 0 0 10px rgba(0,0,0,0.5)`,
                            textShadow: '1px 1px 2px #000',
                            cursor: 'help',
                            transition: 'box-shadow 0.3s',
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
                    </motion.div>
                );
            })}
        </div>
    );
});

export const BattleHUD = React.memo<BattleHUDProps>(({
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
    const [scale, setScale] = React.useState(1);

    React.useEffect(() => {
        const updateScale = () => {
            const container = document.getElementById('game-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                setScale(rect.width / 1920 || 1);
            } else {
                const widthScale = window.innerWidth / 1920;
                const heightScale = window.innerHeight / 1080;
                setScale(Math.min(widthScale, heightScale) || 1);
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();
        const timer = setTimeout(updateScale, 500);

        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, []);

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

    const selectedHeroId = useGameStore((s) => s.selectedHeroId) || 'panda';
    const heroes = useGameStore((s) => s.heroes) || {};
    const heroLevel = heroes[selectedHeroId]?.level || 1;
    const playerRating = useGameStore((s) => s.rating || s.trophies || 0);
    const playerRank = getRankInfo(playerRating);
    const playerName = useGameStore((s) => s.name) || 'Мастер';
    const rawAvatar = useGameStore((s) => s.avatar);
    const vkUser = useGameStore((s) => s.vkUser);
    const playerFrame = useGameStore((s) => s.frame) || 'default';
    const vipLevel = useGameStore((s) => s.vipLevel) || 0;

    const playerAvatar = useMemo(() => {
        if (rawAvatar && !rawAvatar.startsWith('sprite:')) return rawAvatar;
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
        return { enemyLevel: Math.max(1, heroLevel), enemyRating: Math.max(0, playerRating) };
    }, [battleMode, activePveEnemy, heroLevel, playerRating, activeRankedOpponent]);

    const enemyRank = getRankInfo(enemyRating);

    const enemyName = battleMode === 'PVE' && activePveEnemy ? activePveEnemy.name : enemyData.name;
    const lastLog = liveLog.length > 0 ? liveLog[liveLog.length - 1] : null;

    // Enemy Avatar
    const enemyAvatar = useMemo(() => {
        if (battleMode === 'PVE') {
            // PVE mobs image path is usually raw character sprite. Make sure it uses that.
            return enemyData.image || '/assets/images/avatars/wolf.webp';
        }
        // PVP enemy hero avatar
        return enemyData.image || '/assets/images/avatars/wolf.webp';
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
                    animate={{
                        scale: playerPulse ? 1.025 : currentAttacker === 'player' ? 1.01 : 1,
                        boxShadow:
                            currentAttacker === 'player'
                                ? [
                                      '0 0 20px rgba(240, 180, 40, 0.15)',
                                      '0 0 30px rgba(240, 180, 40, 0.45)',
                                      '0 0 20px rgba(240, 180, 40, 0.15)',
                                  ]
                                : '0 4px 20px rgba(0, 0, 0, 0.4)',
                    }}
                    transition={{
                        scale: { duration: 0.12 },
                        boxShadow: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                    }}
                    style={{
                        position: 'relative',
                        width: '465px',
                        height: '112px',
                        flexShrink: 0,
                        borderRadius: '20px',
                    }}
                >
                    {/* Glassmorphic Backing */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '4px',
                            background: 'rgba(15, 8, 4, 0.45)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
                            zIndex: -1,
                        }}
                    />

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
                            opacity: 0.85,
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
                        <motion.div
                            animate={
                                currentAttacker === 'player'
                                    ? {
                                          boxShadow: [
                                              '0 0 15px rgba(251,191,36,0.3)',
                                              '0 0 25px rgba(251,191,36,0.7)',
                                              '0 0 15px rgba(251,191,36,0.3)',
                                          ],
                                      }
                                    : {}
                            }
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{
                                width: '108px',
                                height: '108px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'translateY(1px)',
                                zIndex: 10,
                                border:
                                    currentAttacker === 'player'
                                        ? '2.5px solid #fbbf24'
                                        : '2.5px solid rgba(255,255,255,0.15)',
                                transition: 'border 0.3s',
                            }}
                        >
                            <img
                                src={playerAvatar}
                                alt="Player Avatar"
                                style={getAvatarImageStyle(playerAvatar || '')}
                            />
                        </motion.div>

                        {/* VIP / Custom Аура (Свечение) */}
                        {(() => {
                            const frameStyle = getAvatarFrameStyle(playerFrame);
                            if (frameStyle.glowClass) {
                                return (
                                    <div
                                        className={frameStyle.glowClass}
                                        style={{
                                            position: 'absolute',
                                            width: '84px',
                                            height: '84px',
                                            borderRadius: '50%',
                                            transform: 'translateY(1px)',
                                            pointerEvents: 'none',
                                            zIndex: 15,
                                        }}
                                    />
                                );
                            } else if (vipLevel > 0) {
                                return (
                                    <div
                                        className="vip-avatar-glow"
                                        style={{
                                            position: 'absolute',
                                            width: '84px',
                                            height: '84px',
                                            borderRadius: '50%',
                                            transform: 'translateY(1px)',
                                            pointerEvents: 'none',
                                            zIndex: 15,
                                        }}
                                    />
                                );
                            }
                            return null;
                        })()}

                        {/* Round Frame */}
                        <img
                            src={getAvatarFramePath(playerFrame)}
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
                                {heroLevel}
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
                            <span>
                                {playerName}{' '}
                                <span
                                    style={{
                                        color: '#a1a1aa',
                                        fontSize: '12px',
                                        textTransform: 'none',
                                        marginLeft: '6px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Lv.{heroLevel}
                                </span>
                            </span>
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
                        <HpBar
                            current={battleState.playerHP}
                            max={battleState.playerMaxHP}
                            shield={battleState.playerShield}
                        />
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
                    <motion.div
                        animate={{
                            y: [0, -4, 0],
                            boxShadow: [
                                '0 0 20px rgba(0,0,0,0.7), 0 0 10px rgba(251,191,36,0.1)',
                                '0 0 25px rgba(0,0,0,0.7), 0 0 20px rgba(251,191,36,0.35)',
                                '0 0 20px rgba(0,0,0,0.7), 0 0 10px rgba(251,191,36,0.1)',
                            ],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{
                            background: 'linear-gradient(160deg, rgba(20, 12, 6, 0.72) 0%, rgba(35, 18, 5, 0.68) 100%)',
                            backdropFilter: 'blur(16px)',
                            border: '1.5px solid rgba(251, 191, 36, 0.45)',
                            borderRadius: '12px',
                            padding: '10px 28px',
                            position: 'relative',
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
                    </motion.div>

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
                                    borderRadius: `${Math.round(4 / scale)}px`,
                                    padding: `${Math.round(5 / scale)}px ${Math.round(16 / scale)}px`,
                                    maxWidth: `${Math.min(260 / scale, window.innerWidth - 40)}px`,
                                    textAlign: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: `${Math.max(12 / scale, 13)}px`,
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
                {/* ══════════════ ПАНЕЛЬ ВРАГА ══════════════ */}
                <motion.div
                    animate={{
                        scale: enemyPulse ? 1.025 : currentAttacker === 'enemy' ? 1.01 : 1,
                        boxShadow:
                            currentAttacker === 'enemy'
                                ? [
                                      '0 0 20px rgba(239, 68, 68, 0.15)',
                                      '0 0 30px rgba(239, 68, 68, 0.45)',
                                      '0 0 20px rgba(239, 68, 68, 0.15)',
                                  ]
                                : '0 4px 20px rgba(0, 0, 0, 0.4)',
                    }}
                    transition={{
                        scale: { duration: 0.12 },
                        boxShadow: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                    }}
                    style={{
                        position: 'relative',
                        width: '465px',
                        height: '112px',
                        flexShrink: 0,
                        borderRadius: '20px',
                    }}
                >
                    {/* Glassmorphic Backing */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '4px',
                            background: 'rgba(15, 8, 4, 0.45)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
                            zIndex: -1,
                        }}
                    />

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
                            opacity: 0.85,
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
                        <motion.div
                            animate={
                                currentAttacker === 'enemy'
                                    ? {
                                          boxShadow: [
                                              '0 0 15px rgba(239,68,68,0.3)',
                                              '0 0 25px rgba(239,68,68,0.7)',
                                              '0 0 15px rgba(239,68,68,0.3)',
                                          ],
                                      }
                                    : {}
                            }
                            transition={{ repeat: Infinity, duration: 1.5 }}
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
                                border:
                                    currentAttacker === 'enemy'
                                        ? '2.5px solid #ef4444'
                                        : '2.5px solid rgba(255,255,255,0.15)',
                                transition: 'border 0.3s',
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
                        </motion.div>

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
                            <span>
                                <span
                                    style={{
                                        color: '#a1a1aa',
                                        fontSize: '12px',
                                        textTransform: 'none',
                                        marginRight: '6px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Lv.{enemyLevel}
                                </span>
                                {enemyName}
                            </span>
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
});
