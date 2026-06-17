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
            onClick={onClose}
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.82)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                borderRadius: '16px',
                cursor: 'pointer',
            }}
        >
            <style>{`
                @keyframes rotateModalRays {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            <motion.div
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 18 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, #382414 0%, #170c03 100%)',
                    border: '3px solid #ffd700',
                    borderRadius: '24px',
                    padding: '36px 30px',
                    textAlign: 'center',
                    boxShadow: '0 15px 45px rgba(0, 0, 0, 0.98), 0 0 30px rgba(240, 192, 64, 0.45), inset 0 0 20px rgba(240, 192, 64, 0.15)',
                    maxWidth: '420px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Golden background rays for super chest claims */}
                {rewardClaimed.isFromChest && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '450px',
                            height: '450px',
                            transformOrigin: '50% 50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'repeating-conic-gradient(from 0deg, rgba(255,215,0,0.06) 0deg 20deg, transparent 20deg 40deg)',
                            borderRadius: '50%',
                            animation: 'rotateModalRays 30s linear infinite',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                )}

                <h3
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#ffd700',
                        fontSize: '26px',
                        fontWeight: 950,
                        margin: '0 0 12px 0',
                        letterSpacing: '2px',
                        textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 6px rgba(240,192,64,0.3)',
                        zIndex: 2,
                    }}
                >
                    {rewardClaimed.isFromChest ? 'СУНДУК ОТКРЫТ!' : 'ПОЗДРАВЛЯЕМ!'}
                </h3>
                
                <p style={{ 
                    color: '#dfc08a', 
                    fontSize: '14.5px', 
                    margin: '0 0 24px 0',
                    fontWeight: 700,
                    textShadow: '0 1.5px 3px rgba(0,0,0,0.95)',
                    zIndex: 2,
                }}>
                    {rewardClaimed.isFromChest
                        ? 'Внутри сундука оказалась случайная награда:'
                        : 'Вы успешно получили награду:'}
                </p>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '14px',
                        marginBottom: '28px',
                        zIndex: 2,
                    }}
                >
                    <motion.img
                        src={rewardClaimed.icon}
                        alt={rewardClaimed.type}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ 
                            width: '84px', 
                            height: '84px', 
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 15px rgba(255,215,0,0.45))',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '22px',
                            color: '#ffffff',
                            fontWeight: 950,
                            fontFamily: "'Cinzel', serif",
                            textShadow: '0 2px 6px rgba(0,0,0,0.98), 0 0 8px rgba(255,255,255,0.45)',
                            letterSpacing: '1px',
                        }}
                    >
                        {`+${rewardClaimed.amount} ${rewardClaimed.label}`}
                    </span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, y: -1, boxShadow: '0 6px 20px rgba(240,192,64,0.45)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        padding: '11px 40px',
                        background: 'linear-gradient(180deg, #ffe57f 0%, #e5a910 40%, #8c6300 100%)',
                        border: '2px solid #ffd700',
                        borderRadius: '12px',
                        color: '#1c1002',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 950,
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(240,192,64,0.3)',
                        letterSpacing: '1.5px',
                        zIndex: 2,
                    }}
                >
                    ОТЛИЧНО
                </motion.button>
            </motion.div>
        </div>
    );
};
