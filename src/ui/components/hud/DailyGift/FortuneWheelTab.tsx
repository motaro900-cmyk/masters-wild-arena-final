import React from 'react';
import { motion } from 'framer-motion';
import { WHEEL_REWARDS, getSectorBg } from '../DailyGiftWindow';

interface FortuneWheelTabProps {
    isMobile: boolean;
    isSpinning: boolean;
    isFreeSpinAvailable: boolean;
    wheelRotation: number;
    handleSpinWheel: () => void;
    wheelTimeLeft: string;
}

export const FortuneWheelTab: React.FC<FortuneWheelTabProps> = ({
    isMobile,
    isSpinning,
    isFreeSpinAvailable,
    wheelRotation,
    handleSpinWheel,
    wheelTimeLeft,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                gap: '16px',
            }}
        >
            <p style={{
                color: '#dfc08a',
                fontSize: '14.5px',
                margin: 0,
                textAlign: 'center',
                fontWeight: 800,
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                letterSpacing: '0.5px'
            }}>
                Испытай свою удачу! Раз в сутки вращение абсолютно бесплатно.
            </p>

            {/* Double gold bezel container with flashing light bulbs */}
            <div
                style={{
                    position: 'relative',
                    width: '344px',
                    height: '344px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, #3d2719 50%, #1c0f08 100%)',
                    border: '6px solid #ffd700',
                    borderRadius: '50%',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.95), 0 0 25px rgba(212, 175, 55, 0.4), inset 0 0 15px rgba(0,0,0,0.6)',
                    boxSizing: 'border-box',
                }}
            >
                {/* Bulbs on Bezel */}
                {Array.from({ length: 16 }).map((_, idx) => {
                    const angle = (idx * 360) / 16;
                    const radius = 162; // aligned perfectly on the golden frame ring
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    return (
                        <div
                            key={`bulb-${idx}`}
                            style={{
                                position: 'absolute',
                                top: `calc(50% + ${y}px - 4px)`,
                                left: `calc(50% + ${x}px - 4px)`,
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#ffd700',
                                boxShadow: '0 0 6px #ffd700',
                                zIndex: 11,
                                animation: `bulbFlash 1.8s infinite`,
                                animationDelay: `${idx * 0.11}s`,
                                pointerEvents: 'none',
                            }}
                        />
                    );
                })}

                {/* Wiggling Pointer pin at the top */}
                <motion.div
                    animate={isSpinning ? {
                        rotate: [0, -14, 12, -9, 6, -3, 0],
                    } : { rotate: 0 }}
                    transition={isSpinning ? {
                        duration: 0.32,
                        repeat: 12,
                        ease: 'easeOut',
                    } : {}}
                    style={{
                        position: 'absolute',
                        top: '-14px',
                        left: '50%',
                        transformOrigin: '50% 0%',
                        zIndex: 13,
                        width: '24px',
                        height: '32px',
                        background: 'linear-gradient(180deg, #ffe57f 0%, #d4af37 50%, #8c6300 100%)',
                        clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                        filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.75))',
                        borderTop: '2px solid #fff',
                    }}
                />

                {/* Outer Wheel container */}
                <motion.div
                    style={{
                        width: '304px',
                        height: '304px',
                        borderRadius: '50%',
                        border: '3px solid #d4af37',
                        boxShadow: 'inset 0 0 25px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.5)',
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#1c1c1c',
                    }}
                    animate={{ rotate: wheelRotation }}
                    transition={isSpinning ? { duration: 4, ease: [0.1, 0.7, 0.2, 1] } : { duration: 0 }}
                >
                    {/* Sectors background segments */}
                    {WHEEL_REWARDS.map((reward, i) => (
                        <div
                            key={`seg-${i}`}
                            style={{
                                position: 'absolute',
                                width: '152px',
                                height: '152px',
                                transformOrigin: '100% 100%',
                                left: 0,
                                top: 0,
                                transform: `rotate(${i * 45}deg) skewY(45deg)`,
                                background: getSectorBg(reward.type, i),
                                border: '1px solid rgba(212, 175, 55, 0.15)',
                            }}
                        />
                    ))}

                    {/* Reward Content labels positioned at center of each segment */}
                    {WHEEL_REWARDS.map((reward, i) => {
                        const angle = i * 45 + 22.5; // Offset by 22.5 to center in 45deg sector
                        return (
                            <div
                                key={`label-${i}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    width: '90px',
                                    height: '152px',
                                    transformOrigin: '50% 100%',
                                    transform: `translateX(-50%) rotate(${angle}deg)`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    paddingTop: '20px',
                                    zIndex: 2,
                                }}
                            >
                                <img
                                    src={reward.icon}
                                    alt={reward.type}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.95))',
                                        marginBottom: '2px',
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '11px',
                                        color: '#ffffff',
                                        fontWeight: 900,
                                        fontFamily: "'Cinzel', serif",
                                        letterSpacing: '0.5px',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.98)',
                                    }}
                                >
                                    {reward.amount}
                                </span>
                                <span
                                    style={{
                                        fontSize: '8px',
                                        color: '#dfc08a',
                                        fontWeight: 800,
                                        letterSpacing: '0.8px',
                                        textShadow: '0 1.5px 3px rgba(0,0,0,0.95)',
                                        opacity: 0.9,
                                        marginTop: '1px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {reward.type === 'GOLD' ? 'золото' : reward.type === 'CRYSTAL' ? 'алмазы' : 'энергия'}
                                </span>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Spinning center core click pin */}
                <motion.div
                    whileHover={{ scale: isSpinning ? 1 : 1.05 }}
                    whileTap={{ scale: isSpinning ? 1 : 0.95 }}
                    onClick={isSpinning ? undefined : handleSpinWheel}
                    style={{
                        position: 'absolute',
                        zIndex: 14,
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)',
                        border: '3px solid #ffd700',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSpinning ? 'default' : 'pointer',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            color: '#1c1002',
                            fontWeight: 950,
                            fontSize: '14.5px',
                            letterSpacing: '0.8px',
                            textShadow: '0 0.5px 1px rgba(255,255,255,0.25)',
                        }}
                    >
                        SPIN
                    </span>
                </motion.div>
            </div>

            {/* Wheel Info & Manual Spin button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                {isFreeSpinAvailable ? (
                    <motion.button
                        whileHover={{ scale: 1.05, y: -1, boxShadow: '0 8px 25px rgba(240,192,64,0.45)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSpinWheel}
                        disabled={isSpinning}
                        style={{
                            padding: '14px 60px',
                            background: 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)',
                            border: '2px solid #ffd700',
                            borderRadius: '12px',
                            color: '#1c1002',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 950,
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 6px 20px rgba(240,192,64,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
                            letterSpacing: '1.8px',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        БЕСПЛАТНЫЙ СПИН
                    </motion.button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <p style={{ color: '#b5a695', fontSize: '13.5px', margin: 0, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                            Вы уже крутили колесо сегодня!
                        </p>
                        {wheelTimeLeft && (
                            <div
                                style={{
                                    padding: '8px 28px',
                                    background: 'linear-gradient(180deg, rgba(30, 20, 10, 0.95) 0%, rgba(15, 10, 5, 0.99) 100%)',
                                    borderRadius: '10px',
                                    border: '1.5px solid rgba(240,192,64,0.35)',
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 'inset 0 0 12px rgba(0,0,0,0.85)',
                                }}
                            >
                                <span style={{ fontSize: '10px', color: '#dfc08a', fontWeight: 900, opacity: 0.9, letterSpacing: '0.8px', textShadow: '0 1px 2px #000' }}>
                                    БЕСПЛАТНЫЙ СПИН ЧЕРЕЗ:
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
                                    {wheelTimeLeft}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
