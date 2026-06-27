import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { WHEEL_REWARDS, getSectorBg } from '../DailyGiftWindow';

interface FortuneWheelTabProps {
    isMobile: boolean;
    isSpinning: boolean;
    isFreeSpinAvailable: boolean;
    targetSectorIndex: number;
    handleSpinWheel: () => void;
    wheelTimeLeft: string;
}

const getRewardAura = (type: string) => {
    switch (type) {
        case 'GOLD':
            return 'radial-gradient(circle, rgba(255, 215, 0, 0.22) 0%, rgba(255, 215, 0, 0) 70%)';
        case 'CRYSTAL':
            return 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(168, 85, 247, 0) 70%)';
        case 'ENERGY':
            return 'radial-gradient(circle, rgba(34, 197, 94, 0.22) 0%, rgba(34, 197, 94, 0) 70%)';
        default:
            return 'none';
    }
};

export const FortuneWheelTab: React.FC<FortuneWheelTabProps> = ({
    isMobile,
    isSpinning,
    isFreeSpinAvailable,
    targetSectorIndex,
    handleSpinWheel,
    wheelTimeLeft,
}) => {
    const controls = useAnimation();
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportWidth, setViewportWidth] = useState(0);

    // Number of array repetitions in the reel spinner track
    const REPETITIONS = 12;
    const spinnerItems = Array.from({ length: REPETITIONS }).flatMap((_, repIdx) =>
        WHEEL_REWARDS.map((reward, rewardIdx) => ({
            ...reward,
            uniqueId: `${repIdx}-${rewardIdx}`,
            originalIdx: rewardIdx,
        }))
    );

    // Taller drum heights (height: 360px on PC, cards: 180x280px)
    const CARD_WIDTH = isMobile ? 125 : 180;
    const CARD_HEIGHT = isMobile ? 175 : 280;
    const CARD_GAP = 14;
    const CARD_OUTER_WIDTH = CARD_WIDTH + CARD_GAP;

    // Track measuring of viewport container
    useEffect(() => {
        if (viewportRef.current) {
            setViewportWidth(viewportRef.current.offsetWidth);
        }
        const handleResize = () => {
            if (viewportRef.current) {
                setViewportWidth(viewportRef.current.offsetWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scroll animation logic
    useEffect(() => {
        if (viewportWidth === 0) return;

        if (isSpinning) {
            // 1. Reset instantly to start position in the 1st repetition
            const startIndex = 8 + targetSectorIndex;
            const startX = viewportWidth / 2 - (startIndex * CARD_OUTER_WIDTH + CARD_WIDTH / 2);
            controls.set({ x: startX });

            // 2. Animate to target position in the 8th repetition
            const targetIndex = 8 * 8 + targetSectorIndex;
            const targetX = viewportWidth / 2 - (targetIndex * CARD_OUTER_WIDTH + CARD_WIDTH / 2);

            controls.start({
                x: targetX,
                transition: {
                    duration: 4.1, // Matches the timeout in handleSpinWheel
                    ease: [0.08, 0.82, 0.16, 1], // Custom slow-down deceleration
                },
            });
        } else {
            // When idle, center on the reward in a middle repetition
            const defaultIndex = 4 * 8 + targetSectorIndex;
            const targetX = viewportWidth / 2 - (defaultIndex * CARD_OUTER_WIDTH + CARD_WIDTH / 2);
            controls.set({ x: targetX });
        }
    }, [isSpinning, targetSectorIndex, viewportWidth, controls, isMobile, CARD_OUTER_WIDTH, CARD_WIDTH]);

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
                @keyframes bulbFlash {
                    0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 1px rgba(255, 215, 0, 0.2)); }
                    50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.95)) brightness(1.3); }
                }
                @keyframes wheelBtnGlow {
                    0%, 100% { box-shadow: 0 6px 20px rgba(229, 169, 16, 0.3); filter: brightness(1); }
                    50% { box-shadow: 0 8px 32px rgba(229, 169, 16, 0.75); filter: brightness(1.15); }
                }
                @keyframes indicatorPulse {
                    0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5)); }
                    50% { filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.95)); }
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
                    РУЛЕТКА УДАЧИ
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
                    Испытайте свою удачу! Раз в сутки вращение барабана абсолютно бесплатно.
                </p>
            </div>

            {/* Horizontal reel spinner container (Showcase Tray) */}
            <div
                ref={viewportRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1020px',
                    height: isMobile ? '230px' : '360px',
                    background: 'rgba(20, 12, 6, 0.85)',
                    border: '3px solid rgba(229, 169, 16, 0.45)',
                    borderRadius: '24px',
                    boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.95), 0 8px 30px rgba(0, 0, 0, 0.6)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    margin: isMobile ? '8px 0' : '14px 0',
                }}
            >
                {/* Flashing bulbs on top and bottom frame borders */}
                {Array.from({ length: isMobile ? 12 : 16 }).map((_, idx) => {
                    const count = isMobile ? 12 : 16;
                    const percentage = (idx * 100) / (count - 1);
                    return (
                        <React.Fragment key={`bulb-pair-${idx}`}>
                            {/* Top Bulb */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: `${percentage}%`,
                                    transform: 'translateX(-50%)',
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: '#ffd700',
                                    zIndex: 11,
                                    animation: 'bulbFlash 1.6s infinite',
                                    animationDelay: `${idx * 0.11}s`,
                                    pointerEvents: 'none',
                                }}
                            />
                            {/* Bottom Bulb */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: `${percentage}%`,
                                    transform: 'translateX(-50%)',
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: '#ffd700',
                                    zIndex: 11,
                                    animation: 'bulbFlash 1.6s infinite',
                                    animationDelay: `${idx * 0.11}s`,
                                    pointerEvents: 'none',
                                }}
                            />
                        </React.Fragment>
                    );
                })}

                {/* Left & Right gradient black overlay fade */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, #0d0603 0%, rgba(13, 6, 3, 0) 18%, rgba(13, 6, 3, 0) 82%, #0d0603 100%)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />

                {/* Center selector pointer indicator */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: 'linear-gradient(180deg, #ffd700, #ffe57f, #d4af37, #ffd700)',
                        transform: 'translateX(-50%)',
                        zIndex: 12,
                        boxShadow: '0 0 15px rgba(255, 215, 0, 0.95)',
                        pointerEvents: 'none',
                        animation: 'indicatorPulse 2s infinite ease-in-out',
                    }}
                >
                    {/* Top Triangle Arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '13px solid transparent',
                            borderRight: '13px solid transparent',
                            borderTop: '15px solid #ffd700',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))',
                        }}
                    />
                    {/* Bottom Triangle Arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '13px solid transparent',
                            borderRight: '13px solid transparent',
                            borderBottom: '15px solid #ffd700',
                            filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.85))',
                        }}
                    />
                </div>

                {/* Scrolling Track */}
                <motion.div
                    animate={controls}
                    style={{
                        display: 'flex',
                        gap: `${CARD_GAP}px`,
                        alignItems: 'center',
                        height: '100%',
                        boxSizing: 'border-box',
                        willChange: 'transform',
                        padding: '0 20px',
                    }}
                >
                    {spinnerItems.map((reward, index) => {
                        const isCenterItem =
                            index === (isSpinning ? 8 * 8 + targetSectorIndex : 4 * 8 + targetSectorIndex);

                        const cardBg = getSectorBg(reward.type, reward.originalIdx);

                        return (
                            <div
                                key={reward.uniqueId}
                                style={{
                                    width: `${CARD_WIDTH}px`,
                                    height: `${CARD_HEIGHT}px`,
                                    flexShrink: 0,
                                    borderRadius: '16px',
                                    border: isCenterItem
                                        ? '2.5px solid #ffd700'
                                        : '1px solid rgba(255, 255, 255, 0.12)',
                                    background: cardBg,
                                    boxShadow: isCenterItem
                                        ? '0 0 25px rgba(250, 204, 21, 0.4), inset 0 0 15px rgba(250, 204, 21, 0.25)'
                                        : 'inset 0 0 15px rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: isMobile ? '12px 6px' : '22px 8px',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                    position: 'relative',
                                }}
                            >
                                {/* Active Card Glowing Aura */}
                                {isCenterItem && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: isMobile ? '90px' : '130px',
                                            height: isMobile ? '90px' : '130px',
                                            background: getRewardAura(reward.type),
                                            borderRadius: '50%',
                                            pointerEvents: 'none',
                                            zIndex: 1,
                                            animation: 'auraPulse 2.5s infinite ease-in-out',
                                        }}
                                    />
                                )}

                                {/* Inner Frame Plate */}
                                <div
                                    style={{
                                        background: 'rgba(20, 10, 5, 0.55)',
                                        border: '1px solid rgba(229, 169, 16, 0.25)',
                                        borderRadius: '6px',
                                        padding: '1px 8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 2,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: isMobile ? '8.5px' : '11px',
                                            color: isCenterItem ? '#ffd700' : '#dfc08a',
                                            fontWeight: 900,
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        НАГРАДА
                                    </span>
                                </div>

                                <img
                                    src={reward.icon}
                                    alt={reward.type}
                                    style={{
                                        width: isMobile ? '52px' : '92px',
                                        height: isMobile ? '52px' : '92px',
                                        objectFit: 'contain',
                                        filter: isCenterItem
                                            ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.45)) drop-shadow(0 4px 8px rgba(0,0,0,0.85))'
                                            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.75))',
                                        zIndex: 2,
                                    }}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', zIndex: 2 }}>
                                    <span
                                        style={{
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: isMobile ? '20px' : '26px',
                                            color: '#ffffff',
                                            fontWeight: 950,
                                            letterSpacing: '0.5px',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.98)',
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {reward.amount}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: isMobile ? '10px' : '12px',
                                            color: '#dfc08a',
                                            fontWeight: 800,
                                            letterSpacing: '0.8px',
                                            textShadow: '0 1.5px 3px rgba(0,0,0,0.95)',
                                            textTransform: 'uppercase',
                                            opacity: 0.95,
                                        }}
                                    >
                                        {reward.type === 'GOLD'
                                            ? 'золото'
                                            : reward.type === 'CRYSTAL'
                                              ? 'алмазы'
                                              : 'энергия'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Bottom Actions Spin button / Timer countdown */}
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
                {/* Decorative rules banner to close vertical empty space */}
                {!isMobile && (
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '750px',
                            padding: '14px 22px',
                            background: 'rgba(20, 10, 5, 0.45)',
                            border: '1.5px solid rgba(229, 169, 16, 0.22)',
                            borderRadius: '16px',
                            textAlign: 'center',
                            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.85)',
                            marginBottom: '4px',
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: '#dfc08a',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                fontFamily: "'Montserrat', sans-serif",
                            }}
                        >
                            Каждые 24 часа вам доступно одно бесплатное вращение Рулетки Удачи. Выигранные награды (Золото, Алмазы или Энергия) мгновенно зачисляются на ваш баланс. Испытайте фортуну!
                        </p>
                    </div>
                )}

                {isFreeSpinAvailable ? (
                    <motion.button
                        whileHover={{ scale: isSpinning ? 1 : 1.02 }}
                        whileTap={{ scale: isSpinning ? 1 : 0.98 }}
                        onClick={handleSpinWheel}
                        disabled={isSpinning}
                        style={{
                            width: isMobile ? '240px' : '380px',
                            height: isMobile ? '50px' : '76px',
                            background: 'linear-gradient(180deg, #ffe082 0%, #d4af37 40%, #8c6300 100%)',
                            border: '2px solid #fff2a3',
                            borderRadius: '14px',
                            color: '#211000',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 950,
                            fontSize: isMobile ? '14px' : '18px',
                            cursor: isSpinning ? 'default' : 'pointer',
                            letterSpacing: '2px',
                            opacity: isSpinning ? 0.6 : 1,
                            animation: isSpinning ? 'none' : 'wheelBtnGlow 2.5s infinite ease-in-out',
                        }}
                    >
                        ВРАЩАТЬ БЕСПЛАТНО
                    </motion.button>
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
                            Вы уже крутили рулетку сегодня!
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
                                СЛЕДУЮЩИЙ СПИН ЧЕРЕЗ:
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
                                {wheelTimeLeft}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
