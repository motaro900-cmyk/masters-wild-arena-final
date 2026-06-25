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
    { day: 1, type: 'GOLD', amount: 500, label: '500 Золота' },
    { day: 2, type: 'CRYSTAL', amount: 5, label: '5 Алмазов' },
    { day: 3, type: 'ENERGY', amount: 25, label: '25 Энергии' },
    { day: 4, type: 'GOLD', amount: 1500, label: '1500 Золота' },
    { day: 5, type: 'CRYSTAL', amount: 10, label: '10 Алмазов' },
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
        <>
            <p
                style={{
                    color: '#dfc08a',
                    fontSize: '14px',
                    margin: '0 0 12px 0',
                    textAlign: 'center',
                    fontWeight: 800,
                    textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                    letterSpacing: '0.5px',
                }}
            >
                Заходи в игру каждый день, чтобы забирать более ценные дары!
            </p>

            {/* Calendar Grid Scroll Container */}
            <div
                className="daily-calendar-scroll-container"
                style={{
                    width: '100%',
                    maxHeight: isMobile ? '230px' : 'none',
                    overflowY: isMobile ? 'auto' : 'visible',
                    paddingRight: isMobile ? '8px' : '0px',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 220px)',
                        gap: '12px',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        width: '100%',
                        maxWidth: '920px',
                    }}
                >
                {STREAK_REWARDS.map((rewardItem) => {
                    const isCurrent = rewardItem.day === streak && !claimedToday;
                    const isClaimed = rewardItem.day < streak || (rewardItem.day === streak && claimedToday);
                    const isLocked = rewardItem.day > streak;
                    const isDay7 = rewardItem.day === 7;

                    const cardBg = isDay7
                        ? 'linear-gradient(135deg, rgba(65, 45, 20, 0.98) 0%, rgba(25, 15, 5, 1) 100%)'
                        : isCurrent
                          ? 'linear-gradient(135deg, rgba(60, 42, 18, 0.98) 0%, rgba(20, 12, 4, 1) 100%)'
                          : isLocked
                            ? 'linear-gradient(135deg, rgba(20, 14, 10, 0.25) 0%, rgba(10, 7, 3, 0.45) 100%)'
                            : 'linear-gradient(135deg, rgba(30, 20, 12, 0.45) 0%, rgba(15, 10, 5, 0.7) 100%)';

                    const cardBorder = isCurrent
                        ? 'none'
                        : isDay7
                          ? '2px dashed rgba(250, 204, 21, 0.55)'
                          : isLocked
                            ? '1.5px solid rgba(255, 255, 255, 0.03)'
                            : '1.5px solid rgba(255, 255, 255, 0.08)';

                    const titleColor = isCurrent
                        ? '#ffd700'
                        : isDay7
                          ? '#ffd700'
                          : isClaimed
                            ? '#dfc08a'
                            : isLocked
                              ? '#635c54'
                              : '#8e867e';

                    return (
                        <div
                            key={rewardItem.day}
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: isMobile ? '100px' : '170px',
                                gridColumn: isDay7 ? 'span 2' : 'auto',
                                boxSizing: 'border-box',
                                opacity: 1,
                                transition: 'all 0.22s ease',
                                borderRadius: '16px',
                                padding: isCurrent ? '2px' : '0px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isDay7 && !isClaimed ? '0 0 20px rgba(168, 85, 247, 0.22)' : 'none',
                            }}
                        >
                            {/* Shimmer Border for Active Current Day */}
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
                                        boxShadow: '0 0 25px rgba(240, 192, 64, 0.45)',
                                    }}
                                />
                            )}

                            {/* Card inner body */}
                            <div
                                style={{
                                    position: isCurrent ? 'absolute' : 'relative',
                                    inset: isCurrent ? '2px' : '0px',
                                    width: isCurrent ? 'calc(100% - 4px)' : '100%',
                                    height: isCurrent ? 'calc(100% - 4px)' : '100%',
                                    background: cardBg,
                                    border: cardBorder,
                                    borderRadius: '14px',
                                    display: 'flex',
                                    flexDirection: isMobile ? 'row' : 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: isMobile ? '8px 16px' : '16px 12px 14px 12px',
                                    boxSizing: 'border-box',
                                    zIndex: 2,
                                    overflow: 'visible',
                                    boxShadow: isCurrent
                                        ? 'inset 0 0 15px rgba(240, 192, 64, 0.2)'
                                        : isLocked
                                          ? 'none'
                                          : 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
                                }}
                            >
                                {/* Lock icon overlay for locked items */}
                                {isLocked && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'rgba(20, 10, 5, 0.9)',
                                            border: '1.5px solid rgba(251, 191, 36, 0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            zIndex: 3,
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.65)',
                                        }}
                                    >
                                        🔒
                                    </div>
                                )}

                                {/* Active badge overlay */}
                                {isCurrent && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-9px',
                                            background: 'linear-gradient(180deg, #ffd700 0%, #d4af37 100%)',
                                            border: '1px solid #ffffff',
                                            borderRadius: '8px',
                                            padding: '2px 9px',
                                            fontSize: '9px',
                                            fontWeight: 900,
                                            color: '#1a0d00',
                                            letterSpacing: '1px',
                                            boxShadow: '0 4px 10px rgba(212, 175, 55, 0.45)',
                                            zIndex: 3,
                                            textTransform: 'uppercase',
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        ДОСТУПНО
                                    </div>
                                )}

                                {isMobile ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                                        <motion.img
                                            src={getRewardIcon(rewardItem.type)}
                                            alt={rewardItem.type}
                                            animate={isCurrent || (isDay7 && !isClaimed) ? { y: [0, -4, 0] } : {}}
                                            transition={
                                                isCurrent || (isDay7 && !isClaimed)
                                                    ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                                                    : {}
                                            }
                                            style={{
                                                width: isDay7 ? '64px' : '54px',
                                                height: isDay7 ? '64px' : '54px',
                                                objectFit: 'contain',
                                                filter: isLocked
                                                    ? 'brightness(0.65) saturate(0.85)'
                                                    : `drop-shadow(0 4px 8px rgba(0,0,0,0.5))`,
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                            <span
                                                style={{
                                                    fontFamily: "'Cinzel', serif",
                                                    fontSize: '14px',
                                                    color: titleColor,
                                                    fontWeight: 900,
                                                    letterSpacing: '1px',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                                                }}
                                            >
                                                ДЕНЬ {rewardItem.day}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '13px',
                                                    color: isCurrent
                                                        ? '#ffe259'
                                                        : isDay7
                                                          ? '#ffd700'
                                                          : '#ffffff',
                                                    fontWeight: isCurrent || isDay7 ? 900 : 700,
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                                }}
                                            >
                                                {rewardItem.label}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: '13px',
                                                color: titleColor,
                                                fontWeight: 900,
                                                letterSpacing: '1.2px',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 5px rgba(0,0,0,0.8)',
                                                zIndex: 2,
                                            }}
                                        >
                                            ДЕНЬ {rewardItem.day}
                                        </span>
                                        <motion.img
                                            src={getRewardIcon(rewardItem.type)}
                                            alt={rewardItem.type}
                                            animate={isCurrent || (isDay7 && !isClaimed) ? { y: [0, -5, 0] } : {}}
                                            transition={
                                                isCurrent || (isDay7 && !isClaimed)
                                                    ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                                                    : {}
                                            }
                                            style={{
                                                width: isDay7 ? '72px' : '48px',
                                                height: isDay7 ? '72px' : '48px',
                                                objectFit: 'contain',
                                                filter: isLocked
                                                    ? 'brightness(0.65) saturate(0.85)'
                                                    : 'drop-shadow(0 4px 8px rgba(0,0,0,0.65))',
                                                zIndex: 2,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                color: isCurrent
                                                    ? '#ffe259'
                                                    : isDay7
                                                      ? '#ffe259'
                                                      : isLocked
                                                        ? '#837a71'
                                                        : '#d1c5b8',
                                                fontWeight: 900,
                                                textAlign: 'center',
                                                letterSpacing: '0.8px',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                                                zIndex: 2,
                                            }}
                                        >
                                            {rewardItem.label}
                                        </span>
                                    </>
                                )}
                            </div>
                            {isClaimed && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(10, 5, 0, 0.45)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        backdropFilter: 'blur(1.5px)',
                                        border: '1.5px solid rgba(255, 215, 0, 0.1)',
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                    >
                                        <svg
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#ffe57f"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))' }}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </motion.div>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            color: '#ffe57f',
                                            fontWeight: 955,
                                            marginTop: '8px',
                                            letterSpacing: '1.5px',
                                            fontFamily: "'Cinzel', serif",
                                            textShadow: '0 2px 4px rgba(0,0,0,0.98)',
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
            </div>

            {/* Bottom Actions */}
            <div
                style={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '15px',
                }}
            >
                {!claimedToday ? (
                    <div
                        style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            padding: '0 20px',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Symmetrical Regular Button */}
                        <motion.button
                            whileHover={{ scale: 1.03, y: -0.5 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleClaim(false)}
                            disabled={isClaiming}
                            style={{
                                flex: 1,
                                maxWidth: '280px',
                                height: '50px',
                                padding: '0 24px',
                                background:
                                    'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                border: '1.5px solid rgba(223, 192, 138, 0.45)',
                                borderRadius: '10px',
                                color: '#dfc08a',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 900,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                                letterSpacing: '1px',
                                transition: 'all 0.15s ease',
                                opacity: isClaiming ? 0.6 : 1,
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                                if (isClaiming) return;
                                e.currentTarget.style.background = 'rgba(223, 192, 138, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(223, 192, 138, 0.8)';
                                e.currentTarget.style.color = '#ffd700';
                            }}
                            onMouseLeave={(e) => {
                                if (isClaiming) return;
                                e.currentTarget.style.background =
                                    'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)';
                                e.currentTarget.style.borderColor = 'rgba(223, 192, 138, 0.45)';
                                e.currentTarget.style.color = '#dfc08a';
                            }}
                        >
                            ОБЫЧНАЯ НАГРАДА
                        </motion.button>

                        {/* Premium Symmetrical Double Reward Button */}
                        <motion.button
                            whileHover={{ scale: 1.03, y: -0.5, boxShadow: '0 6px 20px rgba(240, 192, 64, 0.35)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleClaim(true)}
                            disabled={isClaiming}
                            style={{
                                flex: 1,
                                maxWidth: '280px',
                                height: '50px',
                                padding: '0 24px',
                                background: 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)',
                                border: '1.5px solid #ffd700',
                                borderRadius: '10px',
                                color: '#1a0d00',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 900,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(240, 192, 64, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
                                letterSpacing: '1px',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textShadow: '0 0.5px 1px rgba(255,255,255,0.2)',
                                opacity: isClaiming ? 0.6 : 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ marginRight: '6px', flexShrink: 0, color: '#1a0d00' }}
                            >
                                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7.5v-3l5 1.5-5 1.5z" />
                            </svg>
                            <span>ДВОЙНАЯ НАГРАДА (X2)</span>
                        </motion.button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <p
                            style={{
                                color: '#b5a695',
                                fontSize: '13.5px',
                                margin: 0,
                                fontWeight: 800,
                                textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                            }}
                        >
                            Вы уже забрали сегодняшнюю награду!
                        </p>
                        <div
                            style={{
                                padding: '8px 28px',
                                background:
                                    'linear-gradient(180deg, rgba(30, 20, 10, 0.95) 0%, rgba(15, 10, 5, 0.99) 100%)',
                                borderRadius: '10px',
                                border: '1.5px solid rgba(240,192,64,0.35)',
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxShadow: 'inset 0 0 12px rgba(0,0,0,0.85)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '10px',
                                    color: '#dfc08a',
                                    fontWeight: 900,
                                    opacity: 0.9,
                                    letterSpacing: '0.8px',
                                    textShadow: '0 1px 2px #000',
                                }}
                            >
                                СЛЕДУЮЩАЯ НАГРАДА ЧЕРЕЗ:
                            </span>
                            <span
                                style={{
                                    fontSize: '19px',
                                    fontFamily: "'Cinzel', serif",
                                    color: '#ffffff',
                                    fontWeight: 955,
                                    marginTop: '3px',
                                    letterSpacing: '1px',
                                    textShadow: '0 0 8px rgba(255,255,255,0.25)',
                                }}
                            >
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
