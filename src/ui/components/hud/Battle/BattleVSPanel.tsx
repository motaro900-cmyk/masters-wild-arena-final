import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerAccent } from './CornerAccent';

interface BattleVSPanelProps {
    timeLeft: number;
    lastLog: { id: number; text: string; type: string } | null;
    scale: number;
    formatTime: (seconds: number) => string;
}

export const BattleVSPanel = React.memo<BattleVSPanelProps>(({
    timeLeft,
    lastLog,
    scale,
    formatTime,
}) => {
    return (
        <div
            style={{
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '4px',
                gap: '8px',
                minWidth: 0,
            }}
        >
            <motion.div
                animate={{
                    y: [0, -4, 0],
                    boxShadow: [
                        '0 0 20px rgba(0,0,0,0.7), 0 0 10px rgba(251,191,36,0.1)',
                        '0 0 25px rgba(0,0,0,0.7), 0 0 20px rgba(251,191,36,0.35)',
                        '0 0 20px rgba(0,0,0,0.7), 0 0 10px rgba(251,191,36,0.1)',
                    ],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background: 'linear-gradient(160deg, rgba(20, 12, 6, 0.72) 0%, rgba(35, 18, 5, 0.68) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(251, 191, 36, 0.45)',
                    borderRadius: '12px',
                    padding: '10px 28px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                }}
            >
                <CornerAccent position="tl" color="rgba(240,180,40,0.9)" />
                <CornerAccent position="tr" color="rgba(240,180,40,0.9)" />
                <CornerAccent position="bl" color="rgba(240,180,40,0.5)" />
                <CornerAccent position="br" color="rgba(240,180,40,0.5)" />
                <div
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '32px',
                        fontWeight: 900,
                        color: '#fcd34d',
                        letterSpacing: '4px',
                        textShadow: '0 0 20px rgba(251,191,36,0.7), 0 2px 8px rgba(0,0,0,1)',
                        lineHeight: 1.1,
                    }}
                >
                    VS
                </div>
                <div
                    style={{
                        fontFamily: "'Russo One', 'Outfit', sans-serif",
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#fef3c7',
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        letterSpacing: '1px',
                    }}
                >
                    ⏱️ {formatTime(timeLeft)}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {lastLog && (
                    <motion.div
                        key={lastLog.id}
                        initial={{ opacity: 0, y: -6, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.88 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        style={{
                            background: 'rgba(10, 6, 3, 0.82)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(180,120,30,0.3)',
                            borderRadius: `${Math.round(4 / scale)}px`,
                            padding: `${Math.round(5 / scale)}px ${Math.round(16 / scale)}px`,
                            maxWidth: `${Math.min(260 / scale, window.innerWidth - 40)}px`,
                            textAlign: 'center',
                        }}
                    >
                        <span
                            style={{
                                fontSize: `${Math.max(12 / scale, 13)}px`,
                                fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif",
                                letterSpacing: '0.3px',
                                color:
                                    lastLog.type === 'CRIT'
                                        ? '#fcd34d'
                                        : lastLog.type === 'DODGE'
                                          ? '#94a3b8'
                                          : lastLog.type === 'BLOCK'
                                            ? '#38bdf8'
                                            : lastLog.type === 'STUN' || lastLog.type === 'INSTINCT'
                                              ? '#c084fc'
                                              : '#e2d9c8',
                                textShadow: '0 1px 4px rgba(0,0,0,1)',
                            }}
                        >
                            {lastLog.text}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
