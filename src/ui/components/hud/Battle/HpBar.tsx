import React from 'react';
import { motion } from 'framer-motion';

interface HpBarProps {
    current: number;
    max: number;
    reverse?: boolean;
    isEnemy?: boolean;
    shield?: number;
}

/** Сочный HP-бар с цветом в зависимости от процента */
export const HpBar = React.memo<HpBarProps>(({ current, max, reverse = false, isEnemy = false, shield = 0 }) => {
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
                        transition: 'width 0.4s ease-out',
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
                            transition: 'width 0.4s ease-out',
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
