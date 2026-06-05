import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RotationWarningOverlayProps {
    isPortrait: boolean;
    isMobile: boolean;
    onDismiss: () => void;
}

/**
 * Оверлей «Поверните устройство» — показывается на мобильных
 * в портретном режиме. Можно закрыть кнопкой «Играть в портретном».
 */
export const RotationWarningOverlay: React.FC<RotationWarningOverlayProps> = ({ isPortrait, isMobile, onDismiss }) => {
    return (
        <AnimatePresence>
            {isPortrait && isMobile && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(12px)',
                        backgroundColor: 'rgba(10, 10, 14, 0.9)',
                        color: '#fff',
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        padding: '24px',
                        textAlign: 'center',
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        style={{
                            fontSize: '64px',
                            marginBottom: '20px',
                            animation: 'spin-device 2s ease-in-out infinite',
                        }}
                    >
                        🔄
                    </div>
                    <h2
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #FFE07D 0%, #F59E0B 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: '0 0 12px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}
                    >
                        Поверните устройство
                    </h2>
                    <p
                        style={{
                            fontSize: '16px',
                            color: '#A1A1AA',
                            maxWidth: '300px',
                            lineHeight: 1.5,
                            margin: '0 0 32px 0',
                        }}
                    >
                        Игра создана для горизонтального режима. Пожалуйста, переверните телефон для лучшего игрового
                        опыта.
                    </p>
                    <button
                        onClick={onDismiss}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '2px solid rgba(245, 158, 11, 0.3)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            color: '#FFE07D',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                        }}
                    >
                        Играть в портретном
                    </button>
                    <style>{`
                        @keyframes spin-device {
                            0% { transform: rotate(0deg); }
                            50% { transform: rotate(-90deg); }
                            100% { transform: rotate(0deg); }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
