import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    isLoading: boolean;
    loadingText: string;
}

/**
 * Полноэкранный загрузочный оверлей с анимацией спиннера
 * и текстом текущего шага инициализации.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, loadingText }) => {
    const [showSlowWarning, setShowSlowWarning] = React.useState(false);

    React.useEffect(() => {
        if (!isLoading) {
            setShowSlowWarning(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowSlowWarning(true);
        }, 15000);

        return () => clearTimeout(timer);
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: '#0c0c0d',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontFamily: "'Cinzel', 'Outfit', sans-serif",
                        zIndex: 999999,
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Радиальный фон */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                                'radial-gradient(circle at center, rgba(30,22,12,0.35) 0%, rgba(10,7,5,0.95) 100%)',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Контент */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 10,
                        }}
                    >
                        {/* Логотип */}
                        <h1
                            style={{
                                fontSize: '36px',
                                fontWeight: 900,
                                letterSpacing: '0.25em',
                                margin: '0 0 40px 0',
                                textTransform: 'uppercase',
                                background: 'linear-gradient(135deg, #ffe082 0%, #c8952a 50%, #ffe082 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 15px rgba(200, 149, 42, 0.4))',
                                textAlign: 'center',
                                fontFamily: "'Cinzel Decorative', serif",
                            }}
                        >
                            Masters of the Wild
                        </h1>

                        {/* Спиннер */}
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                border: '3px solid rgba(200, 149, 42, 0.1)',
                                borderTop: '3px solid #c8952a',
                                animation: 'ls-spin 1.2s linear infinite',
                                marginBottom: '30px',
                                boxShadow: '0 0 15px rgba(200, 149, 42, 0.2)',
                            }}
                        />

                        {/* Статус */}
                        <div
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                fontFamily: "'Outfit', sans-serif",
                                animation: 'ls-pulse 2s infinite ease-in-out',
                            }}
                        >
                            {loadingText}
                        </div>

                        {/* Предупреждение о медленном соединении */}
                        <AnimatePresence>
                            {showSlowWarning && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 0.8, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        marginTop: '20px',
                                        fontSize: '12px',
                                        color: '#ffe082',
                                        letterSpacing: '0.08em',
                                        textAlign: 'center',
                                        maxWidth: '320px',
                                        lineHeight: '1.5',
                                        fontFamily: "'Outfit', sans-serif",
                                        textShadow: '0 0 8px rgba(255, 224, 130, 0.2)',
                                    }}
                                >
                                    Обнаружено медленное соединение. Загрузка ресурсов продолжается, пожалуйста подождите...
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <style>{`
                        @keyframes ls-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes ls-pulse {
                            0%, 100% { opacity: 0.6; }
                            50% { opacity: 1; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
