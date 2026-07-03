import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    isLoading: boolean;
    loadingText: string;
}

const GAMEPLAY_TIPS = [
    'Совет: Снаряжение в игре существенно повышает боевую мощь ваших зверей.',
    'Совет: Каждый класс зверей имеет уникальные особенности маны и пассивные эффекты.',
    'Совет: Улучшайте экипировку в Кузнице, чтобы разблокировать дополнительные свойства.',
    'Совет: Погодные условия на арене (дождь, буря) могут менять ход сражения!',
    'Совет: Выполняйте ежедневные задания для быстрого прогресса в Боевом Пропуске.',
    'Совет: Вы можете объединяться с другими игроками в Кланы для общих бонусов.',
    'Совет: Регулярно забирайте награды из календаря подарков, чтобы не упустить золото и кристаллы.',
];

/**
 * Полноэкранный загрузочный оверлей с анимацией спиннера
 * и текстом текущего шага инициализации.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, loadingText }) => {
    const [showSlowWarning, setShowSlowWarning] = React.useState(false);
    const [currentTipIndex, setCurrentTipIndex] = React.useState(0);

    React.useEffect(() => {
        if (!isLoading) {
            setShowSlowWarning(false);
            return;
        }

        const warningTimer = setTimeout(() => {
            setShowSlowWarning(true);
        }, 15000);

        // Cycle through gameplay tips every 2500ms
        const tipTimer = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % GAMEPLAY_TIPS.length);
        }, 3000);

        return () => {
            clearTimeout(warningTimer);
            clearInterval(tipTimer);
        };
    }, [isLoading]);

    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const bgUrl = isMobile
        ? '/assets/images/backgrounds/bg_main_mobile.webp'
        : '/assets/images/backgrounds/bg_main.webp';

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
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
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
                    {/* Размытый темный оверлей для читаемости текста */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                                'radial-gradient(circle at center, rgba(10,8,6,0.85) 0%, rgba(5,4,3,0.98) 100%)',
                            backdropFilter: 'blur(3px)',
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
                            padding: '0 20px',
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
                                marginBottom: '40px',
                            }}
                        >
                            {loadingText}
                        </div>

                        {/* Gameplay Tips */}
                        <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentTipIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 0.8, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        fontSize: '13px',
                                        color: '#FFE07D',
                                        letterSpacing: '0.05em',
                                        textAlign: 'center',
                                        maxWidth: '480px',
                                        lineHeight: '1.6',
                                        fontFamily: "'Outfit', sans-serif",
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {GAMEPLAY_TIPS[currentTipIndex]}
                                </motion.div>
                            </AnimatePresence>
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
                                    Обнаружено медленное соединение. Загрузка ресурсов продолжается, пожалуйста
                                    подождите...
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
