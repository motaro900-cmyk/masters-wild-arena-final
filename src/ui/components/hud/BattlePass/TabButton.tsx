import React from 'react';
import { motion } from 'framer-motion';

export const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    icon: string;
}> = ({ active, onClick, label, icon }) => (
    <motion.button
        onClick={onClick}
        whileHover={{
            background: active ? 'linear-gradient(180deg, #f0c040 0%, #b8860b 100%)' : 'rgba(92, 64, 51, 0.25)',
        }}
        style={{
            padding: '10px 25px',
            borderRadius: '6px',
            border: active ? '2px solid #ffd700' : '2px solid transparent',
            background: active ? 'linear-gradient(180deg, #f0c040 0%, #b8860b 100%)' : 'transparent',
            color: active ? '#1a0d00' : '#c8a870',
            fontWeight: 900,
            fontSize: '14px',
            fontFamily: "'Cinzel', serif",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: active ? '0 0 15px rgba(240, 192, 64, 0.4)' : 'none',
            textShadow: active ? '0 1px 0 rgba(255, 255, 255, 0.4)' : 'none',
        }}
    >
        {icon.startsWith('sprite-') ? (
            <div className={icon} style={{ width: '24px', height: '24px', backgroundSize: '300% 100%' }} />
        ) : (
            <span style={{ fontSize: '18px' }}>{icon}</span>
        )}
        {label}
    </motion.button>
);
