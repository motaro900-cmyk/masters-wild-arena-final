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
    headerExtra?: React.ReactNode;
}

export const BaseWindow: React.FC<BaseWindowProps> = ({
    title,
    isOpen,
    onClose,
    children,
    width = '850px',
    headerExtra,
}) => {
    const uiTheme = useGameStore((state) => state.uiTheme);
    const isLight = uiTheme === 'LIGHT';

    // Цветовая схема окна
    const theme = {
        bg: isLight ? '#f5e6c8' : '#2a1b0a',
        pattern: isLight
            ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 2px, transparent 4px)'
            : 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)',
        border: isLight ? '#a67c52' : '#c48b3b',
        headerBg: isLight
            ? 'linear-gradient(180deg, #d2b48c 0%, #b8860b 100%)'
            : 'linear-gradient(180deg, #451a03 0%, #1a0a05 100%)',
        titleColor: isLight ? '#4a3219' : '#fef3c7',
        shadow: isLight ? '0 10px 40px rgba(0,0,0,0.3)' : '0 0 50px rgba(0,0,0,1), inset 0 0 40px rgba(0,0,0,0.8)',
    };

    const isMobile = useGameStore((state) => state.isMobile);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="BaseWindow"
                    style={{
                        width: isMobile ? '1800px' : width,
                        height: isMobile ? '1000px' : 'auto',
                        minHeight: isMobile ? '0' : '500px',
                        background: theme.bg,
                        backgroundImage: theme.pattern,
                        border: `4px solid ${theme.border}`,
                        borderRadius: isMobile ? '24px' : '20px',
                        boxShadow: theme.shadow,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Заголовок окна */}
                    <div
                        style={{
                            height: '70px',
                            background: theme.headerBg,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 30px',
                            justifyContent: 'space-between',
                            borderBottom: `2px solid ${theme.border}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <h2
                                style={{
                                    color: theme.titleColor,
                                    fontSize: '28px',
                                    fontFamily: "'Philosopher', serif",
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                }}
                            >
                                {title}
                            </h2>
                            {headerExtra}
                        </div>

                        <button
                            onClick={() => {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                onClose();
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: theme.titleColor,
                                opacity: 0.7,
                            }}
                        >
                            <X size={32} />
                        </button>
                    </div>

                    {/* Контент окна */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
