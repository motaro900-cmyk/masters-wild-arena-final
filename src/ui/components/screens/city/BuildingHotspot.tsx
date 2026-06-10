import React from 'react';
import { motion } from 'framer-motion';

interface HotspotProps {
    x: string;
    y: string;
    label: string;
    onClick: () => void;
}

export const BuildingHotspot: React.FC<HotspotProps> = ({ x, y, label, onClick }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 5,
            }}
        >
            {/* Marker / Glow */}
            <div
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(240,192,64,0.6) 0%, transparent 70%)',
                    border: '2px solid rgba(240,192,64,0.4)',
                    boxShadow: '0 0 20px rgba(240,192,64,0.3)',
                    animation: 'pulse 2s infinite ease-in-out',
                }}
            />

            {/* Label */}
            <div
                style={{
                    background: 'rgba(15, 10, 5, 0.85)',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: '1px solid #c8a870',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
            `}</style>
        </motion.div>
    );
};
