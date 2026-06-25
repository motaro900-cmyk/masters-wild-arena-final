import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { getAvatarFrameStyle, getAvatarFramePath, getAvatarImageStyle } from '../../../../configs/ProfileCustomization';
import { HpBar } from './HpBar';
import { StatusIcons } from './StatusIcons';

interface PlayerPanelProps {
    playerPulse: boolean;
    currentAttacker: 'player' | 'enemy' | null;
    playerAvatar: string;
    playerFrame: string;
    vipLevel: number;
    heroLevel: number;
    playerName: string;
    playerRank: { name: string; icon: string; glow: string };
    playerRating: number;
    battleState: {
        playerStatuses: Array<{ type: string; stacks: number; duration: number }>;
        playerHP: number;
        playerMaxHP: number;
        playerShield: number;
    };
}

export const PlayerPanel = React.memo<PlayerPanelProps>(
    ({
        playerPulse,
        currentAttacker,
        playerAvatar,
        playerFrame,
        vipLevel,
        heroLevel,
        playerName,
        playerRank,
        playerRating,
        battleState,
    }) => {
        return (
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
                        <img src={playerAvatar} alt="Player Avatar" style={getAvatarImageStyle(playerAvatar || '')} />
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
                            bottom: '-6px',
                            left: '112px',
                            width: '40px',
                            height: '40px',
                            zIndex: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#1a1008',
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

                {/* HP Bar and Statuses */}
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
        );
    },
);
