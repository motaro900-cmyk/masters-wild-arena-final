import React from 'react';
import { motion } from 'framer-motion';

interface GiftCongratsModalProps {
    rewardClaimed: {
        type: string;
        amount: number;
        isFromChest?: boolean;
        label?: string;
        icon?: string;
    } | null;
    onClose: () => void;
}

export const GiftCongratsModal: React.FC<GiftCongratsModalProps> = ({ rewardClaimed, onClose }) => {
    if (!rewardClaimed) return null;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                borderRadius: '16px',
            }}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'linear-gradient(135deg, #2d1e10 0%, #150a02 100%)',
                    border: '3px solid #f0c040',
                    borderRadius: '24px',
                    padding: '30px 25px',
                    textAlign: 'center',
                    boxShadow: '0 0 50px rgba(240, 192, 64, 0.4)',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#f0c040',
                        fontSize: '24px',
                        margin: '0 0 10px 0',
                    }}
                >
                    {rewardClaimed.isFromChest ? 'СУНДУК ОТКРЫТ!' : 'ПОЗДРАВЛЯЕМ!'}
                </h3>
                <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 15px 0' }}>
                    {rewardClaimed.isFromChest
                        ? 'Внутри сундука оказалась случайная награда:'
                        : 'Вы успешно получили награду:'}
                </p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '20px',
                    }}
                >
                    <img
                        src={rewardClaimed.icon}
                        alt={rewardClaimed.type}
                        style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                    />
                    <span
                        style={{
                            fontSize: '20px',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {`+${rewardClaimed.amount} ${rewardClaimed.label}`}
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        padding: '10px 35px',
                        background: 'linear-gradient(180deg, #f0c040 0%, #8a5a10 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#000',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 'bold',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(240,192,64,0.3)',
                    }}
                >
                    ОТЛИЧНО
                </motion.button>
            </motion.div>
        </div>
    );
};
