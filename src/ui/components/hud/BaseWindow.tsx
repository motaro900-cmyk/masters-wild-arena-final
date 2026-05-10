import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';

interface BaseWindowProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}

export const BaseWindow: React.FC<BaseWindowProps> = ({ title, isOpen, onClose, children, width = '850px' }) => {
    const uiTheme = useGameStore(state => state.uiTheme);
    const isLight = uiTheme === 'LIGHT';

    // Цветовые схемы тем
    const theme = {
        bg: isLight ? '#f5e6c8' : '#2a1b0a',
        pattern: isLight 
            ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 2px, transparent 4px)'
            : 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)',
        border: isLight ? '#a67c52' : '#c48b3b',
        headerBg: isLight ? 'linear-gradient(180deg, #d2b48c 0%, #b8860b 100%)' : 'linear-gradient(180deg, #451a03 0%, #1a0a05 100%)',
        titleColor: isLight ? '#4a3219' : '#fef3c7',
        shadow: isLight ? '0 10px 40px rgba(0,0,0,0.3)' : '0 0 50px rgba(0,0,0,1), inset 0 0 40px rgba(0,0,0,0.8)'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{ 
                        width: width, 
                        minHeight: '500px',
                        background: theme.bg,
                        backgroundImage: theme.pattern,
                        border: `4px solid ${theme.border}`,
                        borderRadius: '20px',
                        boxShadow: theme.shadow,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* ЗАГОЛОВОК */}
                    <div style={{ 
                        height: '70px', 
                        background: theme.headerBg,
                        borderBottom: `2px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 25px'
                    }}>
                        <h2 className="font-fantasy" style={{ 
                            color: theme.titleColor, 
                            fontSize: '32px', 
                            margin: 0, 
                            textShadow: isLight ? 'none' : '2px 2px 4px black' 
                        }}>
                            {title}
                        </h2>
                        <button 
                            onClick={onClose}
                            style={{ 
                                background: isLight ? '#a67c52' : '#ef4444', 
                                border: `2px solid ${isLight ? '#5d4037' : '#f87171'}`, 
                                color: 'white', 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* КОНТЕНТ */}
                    <div style={{ 
                        flex: 1, 
                        padding: '30px', 
                        overflowY: 'auto',
                        color: isLight ? '#4a3219' : '#e8d8a8' // Цвет текста контента
                    }} className="custom-scrollbar">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
