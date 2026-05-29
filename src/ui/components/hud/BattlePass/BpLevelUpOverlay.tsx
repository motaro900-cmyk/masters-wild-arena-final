import React from 'react';
import { motion } from 'framer-motion';

export const BpLevelUpOverlay: React.FC<{ level: number; onClose: () => void }> = ({ level, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 3000,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                backdropFilter: 'blur(15px)',
            }}
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(240,192,64,0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <motion.div
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 15 } }}
                    style={{
                        fontSize: '120px',
                        filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.6))',
                        marginBottom: '20px',
                    }}
                >
                    👑
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                    style={{
                        fontFamily: "'Cinzel', serif",
                        color: '#f0c040',
                        fontSize: '54px',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '6px',
                        textShadow: '0 0 20px rgba(240,192,64,0.5), 0 4px 10px #000',
                    }}
                >
                    Уровень Повышен!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.4 } }}
                    style={{
                        fontSize: '20px',
                        color: 'rgba(255,255,255,0.7)',
                        margin: '10px 0 40px 0',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                    }}
                >
                    Боевой Пропуск Сезон 1
                </motion.p>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, transition: { delay: 0.5, type: 'spring' } }}
                    style={{
                        width: '180px',
                        height: '180px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #2a2a30 0%, #15151b 100%)',
                        border: '6px solid #f0c040',
                        boxShadow: '0 0 40px rgba(240,192,64,0.4), inset 0 0 20px rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        marginBottom: '50px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.4)',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                        }}
                    >
                        Уровень
                    </span>
                    <span
                        style={{
                            fontSize: '72px',
                            fontWeight: 900,
                            color: '#f0c040',
                            lineHeight: 1,
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {level}
                    </span>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.7 } }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                        padding: '15px 50px',
                        background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                        border: '2px solid #ffffff',
                        borderRadius: '8px',
                        color: '#1a0d00',
                        fontWeight: 900,
                        fontSize: '18px',
                        fontFamily: "'Cinzel', serif",
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(240,192,64,0.4), inset 0 0 8px rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}
                >
                    Отлично
                </motion.button>
            </div>
        </motion.div>
    );
};
