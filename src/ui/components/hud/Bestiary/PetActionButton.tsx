import React from 'react';
import { motion } from 'framer-motion';

interface PetActionButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    colorScheme?: 'gold' | 'green' | 'red';
}

export const PetActionButton: React.FC<PetActionButtonProps> = ({
    onClick,
    disabled,
    children,
    colorScheme = 'gold',
}) => {
    const goldGrad = 'linear-gradient(180deg, #eab308 0%, #ca8a04 50%, #854d0e 100%)';
    const greenGrad = 'linear-gradient(180deg, #10b981 0%, #059669 50%, #065f46 100%)';
    const redGrad = 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)';

    const baseColor = colorScheme === 'gold' ? '#eab308' : colorScheme === 'green' ? '#10b981' : '#ef4444';

    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.04, boxShadow: `0 0 25px ${baseColor}66` }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            onClick={disabled ? undefined : onClick}
            style={{
                flex: 1,
                height: '65px',
                background: disabled
                    ? 'linear-gradient(180deg, #2b1d11 0%, #1a1008 100%)'
                    : colorScheme === 'gold'
                      ? goldGrad
                      : colorScheme === 'green'
                        ? greenGrad
                        : redGrad,
                border: `3px solid ${disabled ? '#4a3219' : '#fef08a'}`,
                borderRadius: '18px',
                color: disabled ? '#8a5a2a' : '#fff',
                fontSize: '15px',
                fontWeight: 900,
                cursor: disabled ? 'not-allowed' : 'pointer',
                letterSpacing: '2px',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                boxShadow: disabled ? 'none' : '0 6px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Philosopher', sans-serif",
                textTransform: 'uppercase',
            }}
        >
            {/* Top glass reflection highlight */}
            {!disabled && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '50%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                        pointerEvents: 'none',
                    }}
                />
            )}
            {children}
        </motion.button>
    );
};
