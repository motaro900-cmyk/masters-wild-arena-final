import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';

type RewardType = 'GOLD' | 'CRYSTAL' | 'ENERGY' | 'MEGA_CHEST';

interface StreakReward {
    day: number;
    type: RewardType;
    amount: number;
    label: string;
}

const STREAK_REWARDS: StreakReward[] = [
    { day: 1, type: 'GOLD', amount: 100, label: '100 Золота' },
    { day: 2, type: 'CRYSTAL', amount: 10, label: '10 Алмазов' },
    { day: 3, type: 'ENERGY', amount: 25, label: '25 Энергии' },
    { day: 4, type: 'GOLD', amount: 500, label: '500 Золота' },
    { day: 5, type: 'CRYSTAL', amount: 20, label: '20 Алмазов' },
    { day: 6, type: 'ENERGY', amount: 50, label: '50 Энергии' },
    { day: 7, type: 'MEGA_CHEST', amount: 0, label: 'Супер Награда' },
];

const getRewardIcon = (type: RewardType) => {
    switch (type) {
        case 'GOLD':
            return AssetsMap.UI.ICON_GOLD_FULL;
        case 'CRYSTAL':
            return AssetsMap.UI.ICON_ALMAZ_FULL;
        case 'ENERGY':
            return AssetsMap.UI.ICON_ENERGY_FULL;
        case 'MEGA_CHEST':
            return AssetsMap.UI.ICON_DAILY_CHEST;
    }
};

const getRewardAura = (type: RewardType) => {
    switch (type) {
        case 'GOLD':
            return 'radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0) 70%)';
        case 'CRYSTAL':
            return 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0) 70%)';
        case 'ENERGY':
            return 'radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0) 70%)';
        case 'MEGA_CHEST':
            return 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(251, 191, 36, 0) 70%)';
    }
};

interface DailyCalendarTabProps {
    streak: number;
    claimedToday: boolean;
    isClaiming: boolean;
    isMobile: boolean;
    timeLeft: string;
    handleClaim: (double: boolean) => Promise<void>;
}

export const DailyCalendarTab: React.FC<DailyCalendarTabProps> = ({
    streak,
    claimedToday,
    isClaiming,
    isMobile,
    timeLeft,
    handleClaim,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '100%',
                flex: 1,
                padding: isMobile ? '8px 4px 10px' : '16px 12px 20px',
                boxSizing: 'border-box',
            }}
        >
            <style>{`
                @keyframes cardPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(250, 204, 21, 0.25); }
                    50% { box-shadow: 0 0 35px rgba(250, 204, 21, 0.85); }
                }
                @keyframes shimmerBorder {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 300% 50%; }
                }
                @keyframes doubleBtnGlow {
                    0%, 100% { box-shadow: 0 6px 20px rgba(229, 169, 16, 0.3); filter: brightness(1); }
                    50% { box-shadow: 0 8px 32px rgba(229, 169, 16, 0.75); filter: brightness(1.15); }
                }
                @keyframes auraPulse {
                    0%, 100% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.12); opacity: 1; }
                }
            `}</style>

            {/* Header Section (Correct Literary Russian) */}
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '6px' : '14px' }}>
                <h3
                    style={{
                        margin: 0,
                        color: '#FFE07D',
                        fontFamily: "'Cinzel', serif",
                        fontSize: isMobile ? '16px' : '26px',
                        fontWeight: 900,
                        textShadow: '0 2px 6px rgba(0,0,0,0.95)',
                        letterSpacing: '2px',
                    }}
                >
                    КАЛЕНДАРЬ НАГРАД
                </h3>
                <p
                    style={{
                        margin: '6px 0 0',
                        color: '#dfc08a',
                        fontSize: isMobile ? '10px' : '13px',
                        fontWeight: 700,
                        fontFamily: "'Montserrat', sans-serif",
                        opacity: 0.95,
                        textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                    }}
                >
                    Заходите в игру каждый день! Пропуск дня сбрасывает серию наград к первому дню.
                </p>
            </div>

            {/* Showcase Tray (Gamedev-style container slot for cards) */}
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: isMobile ? '5px' : '14px',
                    justifyContent: 'center',
                    alignItems: 'stretch',
                    width: '100%',
                    maxWidth: '1020px',
                    background: 'rgba(28, 18, 10, 0.72)',
                    border: '2px solid rgba(229, 169, 16, 0.38)',
                    borderRadius: '24px',
                    padding: isMobile ? '10px 6px' : '18px 20px',
                    boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.95), 0 8px 30px rgba(0, 0, 0, 0.55)',
                    boxSizing: 'border-box',
                    margin: isMobile ? '8px 0' : '10px 0',
                }}
            >


                {STREAK_REWARDS.map((rewardItem) => {
                    const isCurrent = rewardItem.day === streak && !claimedToday;
                    const isClaimed = rewardItem.day < streak || (rewardItem.day === streak && claimedToday);
                    const isLocked = rewardItem.day > streak;
                    const isDay7 = rewardItem.day === 7;

                    // Large AAA sizes to utilize window height (Taller cards: 280px on PC, 230px on Mobile)
                    const cardFlex = isDay7 ? '1.6' : '1';
                    const cardHeight = isMobile ? '230px' : '280px';

                    const cardBg = isDay7
                        ? isCurrent
                            ? 'linear-gradient(180deg, #4d351b 0%, #1e1104 100%)'
                            : isClaimed
                              ? 'linear-gradient(180deg, rgba(30, 20, 10, 0.45) 0%, rgba(15, 10, 5, 0.7) 100%)'
                              : 'linear-gradient(180deg, #352618 0%, #17100a 100%)'
                        : isCurrent
                          ? 'linear-gradient(180deg, #452e15 0%, #1c1004 100%)'
                          : isLocked
                            ? 'linear-gradient(180deg, rgba(20, 14, 10, 0.25) 0%, rgba(10, 7, 3, 0.45) 100%)'
                            : 'linear-gradient(180deg, rgba(42, 28, 17, 0.45) 0%, rgba(18, 12, 6, 0.7) 100%)';

                    const cardBorder = isCurrent
                        ? 'none'
                        : isDay7
                          ? '2px dashed rgba(250, 204, 21, 0.75)'
                          : isLocked
                            ? '1px solid rgba(255, 255, 255, 0.04)'
                            : '1px solid rgba(255, 255, 255, 0.14)';

                    const titleColor = isCurrent
                        ? '#ffd700'
                        : isDay7
                          ? '#ffd700'
                          : isClaimed
                            ? '#dfc08a'
                            : isLocked
                              ? '#9a8d80'
                              : '#dcd3c8';

                    return (
                        <div
                            key={rewardItem.day}
                            style={{
                                position: 'relative',
                                flex: cardFlex,
                                height: cardHeight,
                                boxSizing: 'border-box',
                                transition: 'all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                borderRadius: '16px',
                                padding: isCurrent ? '2.5px' : '0px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: isCurrent ? 'cardPulse 2.5s infinite ease-in-out' : 'none',
                                zIndex: 2,
                            }}
                        >
                            {/* Animated shimmering border gradient for current active day */}
                            {isCurrent && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '16px',
                                        background: 'linear-gradient(90deg, #ffe57f, #e5a910, #8c6300, #ffe57f)',
                                        backgroundSize: '300% 100%',
                                        animation: 'shimmerBorder 3s linear infinite',
                                        zIndex: 1,
                                    }}
                                />
                            )}

                            {/* Inner Card Container */}
                            <div
                                style={{
                                    position: isCurrent ? 'absolute' : 'relative',
                                    inset: isCurrent ? '2.5px' : '0px',
                                    width: isCurrent ? 'calc(100% - 5px)' : '100%',
                                    height: isCurrent ? 'calc(100% - 5px)' : '100%',
                                    background: cardBg,
                                    border: cardBorder,
                                    borderRadius: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: isMobile ? '12px 4px' : '26px 8px',
                                    boxSizing: 'border-box',
                                    zIndex: 2,
                                    boxShadow: isCurrent ? 'inset 0 0 25px rgba(250, 204, 21, 0.28)' : 'none',
                                }}
                            >
                                {/* Lock Indicator overlay */}
                                {isLocked && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '6px',
                                            right: '6px',
                                            width: isMobile ? '16px' : '22px',
                                            height: isMobile ? '16px' : '22px',
                                            borderRadius: '50%',
                                            background: 'rgba(15, 8, 3, 0.92)',
                                            border: '1px solid rgba(251, 191, 36, 0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: isMobile ? '8px' : '11px',
                                            zIndex: 3,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        🔒
                                    </div>
                                )}

                                {/* Available active badge indicator */}
                                {isCurrent && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isMobile ? '-8px' : '-11px',
                                            background: 'linear-gradient(180deg, #fff275 0%, #e5a910 100%)',
                                            border: '1px solid #ffffff',
                                            borderRadius: '8px',
                                            padding: '2px 8px',
                                            fontSize: isMobile ? '8px' : '10px',
                                            fontWeight: 950,
                                            color: '#1a0d00',
                                            letterSpacing: '1px',
                                            boxShadow: '0 3px 8px rgba(229, 169, 16, 0.45)',
                                            zIndex: 3,
                                            fontFamily: "'Cinzel', serif",
                                            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                                        }}
                                    >
                                        ДАР
                                    </div>
                                )}

                                {/* Decorative day plate */}
                                <div
                                    style={{
                                        background: 'rgba(20, 10, 5, 0.65)',
                                        border: '1px solid rgba(229, 169, 16, 0.3)',
                                        borderRadius: '6px',
                                        padding: isMobile ? '1px 6px' : '3px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: isMobile ? '2px' : '4px',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: isMobile ? '10px' : '14px',
                                            color: titleColor,
                                            fontWeight: 900,
                                            letterSpacing: '1.2px',
                                            textShadow: '0 2px 3px rgba(0,0,0,0.95)',
                                        }}
                                    >
                                        ДЕНЬ {rewardItem.day}
                                    </span>
                                </div>

                                {/* Central Reward Icon with Ambient Pulsing Glow Aura */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
                                    {!isLocked && !isClaimed && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: isDay7 ? '130px' : '85px',
                                                height: isDay7 ? '130px' : '85px',
                                                background: getRewardAura(rewardItem.type),
                                                borderRadius: '50%',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                                animation: 'auraPulse 3s infinite ease-in-out',
                                            }}
                                        />
                                    )}

                                    <motion.img
                                        src={getRewardIcon(rewardItem.type)}
                                        alt={rewardItem.type}
                                        animate={isCurrent || (isDay7 && !isClaimed) ? { y: [0, -6, 0] } : {}}
                                        transition={{
                                            duration: 2.2,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            width: isDay7
                                                ? isMobile ? '60px' : '110px'
                                                : isMobile ? '42px' : '72px',
                                            height: isDay7
                                                ? isMobile ? '60px' : '110px'
                                                : isMobile ? '42px' : '72px',
                                            objectFit: 'contain',
                                            filter: isLocked
                                                ? 'brightness(0.45) saturate(0.45)'
                                                : isCurrent
                                                  ? 'drop-shadow(0 0 18px rgba(255, 215, 0, 0.48)) drop-shadow(0 4px 8px rgba(0,0,0,0.85))'
                                                  : 'drop-shadow(0 4px 8px rgba(0,0,0,0.75))',
                                            zIndex: 2,
                                        }}
                                    />
                                </div>

                                {/* Reward Amount Text */}
                                <span
                                    style={{
                                        fontSize: isMobile ? '9px' : '14px',
                                        color: isCurrent
                                            ? '#ffe07d'
                                            : isDay7
                                              ? '#ffd700'
                                              : isLocked
                                                ? '#8e8275'
                                                : '#efede8',
                                        fontWeight: 800,
                                        textAlign: 'center',
                                        letterSpacing: '0.2px',
                                        textShadow: '0 2px 3px rgba(0,0,0,0.95)',
                                        fontFamily: "'Montserrat', sans-serif",
                                        marginBottom: isMobile ? '2px' : '8px',
                                    }}
                                >
                                    {rewardItem.label}
                                </span>
                            </div>

                            {/* Claimed overlay with checkmark */}
                            {isClaimed && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(12, 6, 2, 0.64)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        backdropFilter: 'blur(1.5px)',
                                        border: '1px solid rgba(255, 215, 0, 0.12)',
                                    }}
                                >
                                    <svg
                                        width={isMobile ? '22' : '32'}
                                        height={isMobile ? '22' : '32'}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#ffd700"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span
                                        style={{
                                            fontSize: isMobile ? '8px' : '10px',
                                            color: '#ffd700',
                                            fontWeight: 900,
                                            marginTop: '6px',
                                            letterSpacing: '1px',
                                            fontFamily: "'Cinzel', serif",
                                            textShadow: '0 2px 3px rgba(0,0,0,0.98)',
                                        }}
                                    >
                                        ПОЛУЧЕНО
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Panel Wrapper */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '10px' : '14px',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginTop: 'auto',
                }}
            >
                {/* Streak Stats Panel to fill vertical space */}
                {!isMobile && (
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '650px',
                            padding: '12px 20px',
                            background: 'rgba(20, 10, 5, 0.45)',
                            border: '1.5px solid rgba(229, 169, 16, 0.22)',
                            borderRadius: '12px',
                            textAlign: 'center',
                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.85)',
                            marginBottom: '4px',
                        }}
                    >
                        <span style={{ color: '#dfc08a', fontSize: '13px', fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
                            Текущая серия: <span style={{ color: '#ffd700', fontWeight: 900 }}>{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</span> подряд. Получено подарков в цикле: <span style={{ color: '#ffd700', fontWeight: 900 }}>{claimedToday ? streak : streak - 1} / 7</span>
                        </span>
                    </div>
                )}

                {!claimedToday ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0 10px',
                        }}
                    >
                        {/* Single Gold Premium Claim Button */}
                        <motion.button
                            whileHover={{ scale: isClaiming ? 1 : 1.02 }}
                            whileTap={{ scale: isClaiming ? 1 : 0.98 }}
                            onClick={() => handleClaim(false)}
                            disabled={isClaiming}
                            style={{
                                width: isMobile ? '240px' : '420px',
                                height: isMobile ? '50px' : '64px',
                                background: 'linear-gradient(180deg, #ffe082 0%, #d4af37 40%, #8c6300 100%)',
                                border: '2px solid #fff2a3',
                                borderRadius: '14px',
                                color: '#211000',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 950,
                                fontSize: isMobile ? '13px' : '18px',
                                cursor: isClaiming ? 'default' : 'pointer',
                                letterSpacing: '2px',
                                opacity: isClaiming ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
                            }}
                        >
                            <span>ЗАБРАТЬ НАГРАДУ</span>
                        </motion.button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <p
                            style={{
                                color: '#b5a695',
                                fontSize: isMobile ? '11px' : '13px',
                                margin: 0,
                                fontWeight: 700,
                                textShadow: '0 1.5px 3px rgba(0,0,0,0.95)',
                                fontFamily: "'Montserrat', sans-serif",
                            }}
                        >
                            Вы уже забрали сегодняшнюю награду!
                        </p>
                        
                        {/* Styled Cooldown Plaque */}
                        <div
                            style={{
                                padding: '8px 24px',
                                background: 'linear-gradient(180deg, #1f140a 0%, #0d0804 100%)',
                                borderRadius: '12px',
                                border: '1.5px solid rgba(229, 169, 16, 0.55)',
                                display: 'inline-flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.9)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: isMobile ? '9px' : '11px',
                                    color: '#dfc08a',
                                    fontWeight: 900,
                                    letterSpacing: '1px',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                СЛЕДУЮЩИЙ ПОДАРОК ЧЕРЕЗ:
                            </span>
                            <span
                                style={{
                                    fontSize: isMobile ? '13px' : '16px',
                                    fontFamily: "'Outfit', 'Nunito', sans-serif",
                                    color: '#ffffff',
                                    fontWeight: 900,
                                    letterSpacing: '0.5px',
                                    textShadow: '0 0 5px rgba(255,255,255,0.2)',
                                }}
                            >
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
