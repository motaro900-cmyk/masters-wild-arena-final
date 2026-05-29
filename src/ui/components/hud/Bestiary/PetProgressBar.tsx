import React from 'react';
import { motion } from 'framer-motion';

interface PetProgressBarProps {
    value: number;
    max: number;
    color: string;
}

export const PetProgressBar: React.FC<PetProgressBarProps> = ({ value, max, color }) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div
            style={{
                height: '18px',
                width: '100%',
                backgroundColor: '#0c0a09',
                borderRadius: '9px',
                border: '2px solid #3e2b18',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)',
            }}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    boxShadow: `0 0 15px ${color}aa`,
                    borderRadius: '7px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Shining moving shimmer line overlay */}
                <div
                    className="shimmer-effect"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background:
                            'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                        width: '100%',
                        height: '100%',
                        animation: 'shimmer 2.5s infinite linear',
                    }}
                />
            </motion.div>
        </div>
    );
};
