import React from 'react';
import { motion } from 'framer-motion';

export const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    icon?: string;
    hasNotification?: boolean;
}> = ({ active, onClick, label, icon, hasNotification }) => (
    <motion.button
        onClick={onClick}
        whileHover={{
            scale: 1.03,
            boxShadow: active ? '0 0 20px rgba(153, 27, 27, 0.5)' : '0 0 15px rgba(240, 192, 64, 0.2)',
        }}
        whileTap={{ scale: 0.97 }}
        style={{
            padding: '10px 30px',
            borderRadius: '6px',
            border: active ? '2px solid #b8860b' : '2px solid #3d2314',
            background: active
                ? 'linear-gradient(180deg, #851c1c 0%, #450a0a 100%)'
                : 'linear-gradient(180deg, #2a1b14 0%, #150f0c 100%)',
            color: active ? '#ffffff' : '#c8a870',
            fontWeight: 900,
            fontSize: '14px',
            fontFamily: "'Cinzel', serif",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: active
                ? '0 5px 15px rgba(0, 0, 0, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.2)'
                : '0 4px 10px rgba(0, 0, 0, 0.3)',
            textShadow: '0 1.5px 2px rgba(0,0,0,0.8)',
            position: 'relative',
        }}
    >
        {icon &&
            (icon.startsWith('sprite-') ? (
                <div
                    className={icon}
                    style={{ width: '24px', height: '24px', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }}
                />
            ) : (
                <span style={{ fontSize: '18px' }}>{icon}</span>
            ))}
        {label}

        {hasNotification && (
            <div
                style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '1.5px solid #fff',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                }}
            >
                1
            </div>
        )}
    </motion.button>
);
