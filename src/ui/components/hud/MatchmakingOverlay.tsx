import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../configs/AssetsMap';

interface MatchmakingOverlayProps {
    onFound: () => void;
    onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({ onFound, onCancel }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        const searchTime = 4000 + Math.random() * 2000;
        const timeout = setTimeout(onFound, searchTime);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [onFound]);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                pointerEvents: 'auto',
                backdropFilter: 'blur(4px)',
            }}
        >
            {/* ПЕРГАМЕНТ ПОИСКА */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    position: 'relative',
                    width: '750px',
                    height: '750px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* ФОН - Тот самый пергамент */}
                <img
                    src={AssetsMap.UI.PANEL_PARCHMENT}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))',
                    }}
                    alt="parchment"
                />

                {/* ДИНАМИЧЕСКИЕ ЭЛЕМЕНТЫ ПОВЕРХ */}
                <div
                    style={{ position: 'relative', zIndex: 1, marginTop: '200px', textAlign: 'center', width: '100%' }}
                >
                    {/* АНИМИРОВАННЫЕ МЕЧИ С СИЯНИЕМ И РАДАРОМ */}
                    <div
                        style={{
                            position: 'relative',
                            marginBottom: '40px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 2.5],
                                opacity: [0.6, 0],
                            }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                width: '100px',
                                height: '100px',
                                border: '2px solid rgba(196,139,59,0.5)',
                                borderRadius: '50%',
                                zIndex: -1,
                            }}
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '150px',
                                height: '150px',
                                background: 'radial-gradient(circle, rgba(196,139,59,0.4) 0%, transparent 70%)',
                                filter: 'blur(15px)',
                                zIndex: -1,
                            }}
                        />
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            style={{ fontSize: '80px', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
                        >
                            ⚔️
                        </motion.div>
                    </div>

                    <h2
                        style={{
                            color: '#451a03',
                            fontSize: '32px',
                            fontWeight: 'bold',
                            fontFamily: "'Cinzel', serif",
                            margin: '0 0 10px 0',
                            letterSpacing: '2px',
                        }}
                    >
                        ПОИСК ПРОТИВНИКА
                    </h2>

                    <p
                        style={{
                            color: '#451a03',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            fontFamily: 'Russo One, sans-serif',
                            margin: 0,
                            opacity: 0.8,
                        }}
                    >
                        ПРОШЛО: <span style={{ color: '#92400e', fontSize: '28px' }}>{seconds}</span> сек.
                    </p>

                    {/* КНОПКА ОТМЕНЫ (СТИЛИЗОВАННАЯ ПОД МЕТАЛЛ) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCancel}
                        style={{
                            marginTop: '100px',
                            padding: '15px 50px',
                            background: 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
                            border: '2px solid #ef4444',
                            borderRadius: '12px',
                            color: '#fee2e2',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.1)',
                            fontFamily: 'Russo One, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}
                    >
                        ОТМЕНИТЬ ПОИСК
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};
