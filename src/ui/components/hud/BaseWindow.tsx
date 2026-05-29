import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

interface BaseWindowProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
    height?: string;
    headerExtra?: React.ReactNode;
}

/** Угловая декорация для рамы окна */
const CornerAccent: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; color: string }> = ({ position, color }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        width: '18px',
        height: '18px',
        zIndex: 20,
        pointerEvents: 'none',
        ...(position === 'tl' && { top: -2, left: -2, borderTop: `3px solid ${color}`, borderLeft: `3px solid ${color}` }),
        ...(position === 'tr' && { top: -2, right: -2, borderTop: `3px solid ${color}`, borderRight: `3px solid ${color}` }),
        ...(position === 'bl' && { bottom: -2, left: -2, borderBottom: `3px solid ${color}`, borderLeft: `3px solid ${color}` }),
        ...(position === 'br' && { bottom: -2, right: -2, borderBottom: `3px solid ${color}`, borderRight: `3px solid ${color}` }),
    };
    return <div style={style} />;
};

export const BaseWindow: React.FC<BaseWindowProps> = ({
    title,
    isOpen,
    onClose,
    children,
    width = '850px',
    height = 'auto',
    headerExtra,
}) => {
    const uiTheme = useGameStore((state) => state.uiTheme);
    const isLight = uiTheme === 'LIGHT';

    // Цветовая схема окна
    const theme = {
        bg: isLight
            ? 'var(--panel-parchment)'
            : 'linear-gradient(165deg, rgba(20, 13, 7, 0.98) 0%, rgba(30, 16, 7, 0.96) 50%, rgba(12, 7, 3, 0.99) 100%)',
        pattern: isLight
            ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 2px, transparent 4px)'
            : 'none',
        border: isLight ? 'var(--border-gold-mid)' : 'rgba(235, 185, 55, 0.7)',
        headerBg: isLight
            ? 'linear-gradient(180deg, #d2b48c 0%, #b8860b 100%)'
            : 'linear-gradient(180deg, rgba(40, 24, 10, 0.95) 0%, rgba(20, 12, 5, 0.98) 100%)',
        titleColor: isLight ? '#4a3219' : '#f5d37a',
        shadow: isLight
            ? '0 10px 40px rgba(0,0,0,0.3)'
            : '0 0 45px rgba(0, 0, 0, 0.95), 0 10px 60px rgba(0, 0, 0, 0.85), inset 0 0 25px rgba(251, 191, 36, 0.05)',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ scale: 0.88, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.88, opacity: 0, y: 15 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                    className="BaseWindow"
                    style={{
                        width: width,
                        height: height,
                        minHeight: '520px',
                        background: theme.bg,
                        ...(theme.pattern !== 'none' && { backgroundImage: theme.pattern }),
                        border: isLight ? `4px solid ${theme.border}` : `2px solid ${theme.border}`,
                        borderRadius: '12px',
                        boxShadow: theme.shadow,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        pointerEvents: 'auto',
                        backdropFilter: isLight ? 'none' : 'blur(16px)',
                    }}
                >
                    {/* Угловые акценты (только в темной теме) */}
                    {!isLight && (
                        <>
                            <CornerAccent position="tl" color="#fbbf24" />
                            <CornerAccent position="tr" color="#fbbf24" />
                            <CornerAccent position="bl" color="rgba(251,191,36,0.5)" />
                            <CornerAccent position="br" color="rgba(251,191,36,0.5)" />
                        </>
                    )}

                    {/* Заголовок окна */}
                    <div
                        style={{
                            height: '75px',
                            background: theme.headerBg,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 28px',
                            justifyContent: 'space-between',
                            borderBottom: `2.5px solid ${isLight ? theme.border : 'rgba(235, 185, 55, 0.45)'}`,
                            position: 'relative',
                            zIndex: 15,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <h2
                                style={{
                                    color: theme.titleColor,
                                    fontSize: '28px',
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    fontWeight: 900,
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '2.5px',
                                    textShadow: isLight ? 'none' : '0 2px 10px rgba(0,0,0,0.8), 0 0 15px rgba(251,191,36,0.25)',
                                }}
                            >
                                {title}
                            </h2>
                            {headerExtra}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: theme.titleColor,
                                opacity: 0.8,
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                        >
                            <X size={30} style={{ filter: isLight ? 'none' : 'drop-shadow(0 0 4px rgba(251,191,36,0.3))' }} />
                        </motion.button>
                    </div>

                    {/* Декоративная тонкая полоска под хедером */}
                    {!isLight && (
                        <div style={{
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.4), transparent)',
                            width: '100%',
                            position: 'absolute',
                            top: '75px',
                            zIndex: 16
                        }} />
                    )}

                    {/* Контент окна */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
