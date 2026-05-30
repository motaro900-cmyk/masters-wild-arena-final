import { motion } from 'framer-motion';
import { useState } from 'react';

interface StatCardProps {
    label: string;
    value: number;
    base: number;
    icon: string;
    color: string;
    max: number;
    tooltip: string;
    suffix?: string;
}

export const StatCard = ({ label, value, base, icon, color, max, tooltip, suffix = '' }: StatCardProps) => {
    const [hovered, setHovered] = useState(false);

    const valNum = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    const baseNum = typeof base === 'number' ? base : parseFloat(String(base)) || 0;
    const bonus = Math.round(valNum - baseNum);

    const displayVal = Math.round(valNum);
    const formattedValue = `${displayVal.toLocaleString()}${suffix}`;
    const fillPercent = Math.min(100, (valNum / Math.max(1, max)) * 100);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                background: hovered
                    ? `linear-gradient(135deg, rgba(45,45,55,0.75) 0%, rgba(25,25,35,0.95) 100%)`
                    : `linear-gradient(135deg, rgba(30,30,38,0.55) 0%, rgba(15,15,22,0.85) 100%)`,
                borderRadius: '16px',
                padding: '16px 18px 16px 22px',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflow: 'hidden',
                boxShadow: hovered
                    ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}44`
                    : '0 4px 16px rgba(0,0,0,0.35)',
                transition: 'all 0.2s ease',
                cursor: 'default',
            }}
        >
            {/* Left accent bar */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '8px',
                bottom: '8px',
                width: hovered ? '4px' : '3px',
                background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
                borderRadius: '0 4px 4px 0',
                boxShadow: hovered ? `0 0 12px ${color}` : `0 0 6px ${color}66`,
                transition: 'all 0.2s ease',
            }} />

            {/* Subtle radial glow on hover */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: hovered
                    ? `radial-gradient(ellipse at 0% 50%, ${color}10 0%, transparent 55%)`
                    : 'none',
                pointerEvents: 'none',
                transition: 'all 0.3s ease',
            }} />

            {/* Top row: icon + label + value */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Emoji icon */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${color}25 0%, ${color}0d 100%)`,
                    border: `1px solid ${color}${hovered ? '66' : '44'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '24px',
                    lineHeight: 1,
                    boxShadow: hovered ? `0 0 16px ${color}33, inset 0 0 10px ${color}11` : 'none',
                    transition: 'all 0.2s ease',
                }}>
                    {icon}
                </div>

                {/* Label + desc */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        color: color,
                        fontSize: '12px',
                        fontWeight: 900,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        textShadow: hovered ? `0 0 16px ${color}88` : 'none',
                        transition: 'text-shadow 0.2s ease',
                        marginBottom: '3px',
                    }}>
                        {label}
                    </div>
                    <div style={{
                        color: 'rgba(255,255,255,0.38)',
                        fontSize: '11px',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}>
                        {tooltip}
                    </div>
                </div>

                {/* Value block */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '1px',
                    flexShrink: 0,
                    minWidth: '60px',
                }}>
                    <span style={{
                        color: '#ffffff',
                        fontSize: '26px',
                        fontWeight: 900,
                        fontFamily: "'Inter', 'Outfit', sans-serif",
                        lineHeight: 1,
                        letterSpacing: '-0.5px',
                        textShadow: hovered ? `0 0 20px ${color}55` : '0 2px 8px rgba(0,0,0,0.5)',
                        transition: 'text-shadow 0.2s ease',
                    }}>
                        {formattedValue}
                    </span>
                    {bonus > 0 ? (
                        <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                color: '#4ade80',
                                fontSize: '11px',
                                fontWeight: 800,
                                lineHeight: 1,
                                filter: 'drop-shadow(0 0 4px rgba(74,222,128,0.5))',
                            }}
                        >
                            +{bonus}{suffix}
                        </motion.span>
                    ) : (
                        <span style={{ height: '11px' }} />
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(0,0,0,0.55)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    {/* Track glow */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${fillPercent}%`,
                        background: color,
                        opacity: 0.12,
                        filter: 'blur(3px)',
                    }} />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{
                            height: '100%',
                            background: `linear-gradient(90deg, ${color}aa 0%, ${color} 100%)`,
                            borderRadius: '3px',
                            boxShadow: `0 0 8px ${color}88`,
                            position: 'relative',
                        }}
                    >
                        {/* Sheen */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                            borderRadius: '3px',
                        }} />
                    </motion.div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.2)',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                }}>
                    <span>0</span>
                    <span>{max.toLocaleString()} MAX</span>
                </div>
            </div>
        </div>
    );
};
