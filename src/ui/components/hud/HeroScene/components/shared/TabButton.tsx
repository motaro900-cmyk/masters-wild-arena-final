import { motion } from 'framer-motion';

export const TabButton = ({ active, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
        }}
    >
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <span
            style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '20px',
                fontWeight: 900,
                color: active ? '#fff' : '#c8a870',
            }}
        >
            {label}
        </span>
        {active && (
            <motion.div
                layoutId="activeTab"
                style={{
                    position: 'absolute',
                    bottom: '-15px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#f0c040',
                    boxShadow: '0 0 10px #f0c040',
                }}
            />
        )}
    </button>
);
