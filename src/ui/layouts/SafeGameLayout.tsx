import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { SceneSwitcher } from '../components/SceneSwitcher';
import { GameHUD } from '../components/GameHUD';
import { ItemBuilder } from '../../components/dev/ItemBuilder';

interface SafeGameLayoutProps {
    isPortrait?: boolean;
    isMobile?: boolean;
}

export const SafeGameLayout = ({ isPortrait = false, isMobile = false }: SafeGameLayoutProps) => {
    React.useEffect(() => {
        console.log('[METRIC] FIRST_INTERACTIVE', performance.now());
    }, []);

    const [dismissedRotationWarning, setDismissedRotationWarning] = React.useState(false);
    const [showItemBuilder, setShowItemBuilder] = React.useState(false);

    const isDev =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const { isBanned, banReason, banUntil, sessionConflict, graphicsQuality } = useGameStore((state) => ({
        isBanned: state.isBanned,
        banReason: state.banReason,
        banUntil: state.banUntil,
        sessionConflict: state.sessionConflict,
        graphicsQuality: state.graphicsQuality,
    }));

    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'F8') {
                const store = useGameStore.getState();
                if (typeof store.setShowFps === 'function') {
                    store.setShowFps(!store.showFps);
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => {
            window.removeEventListener('keydown', handleKey);
        };
    }, []);

    React.useEffect(() => {
        // ─── Global energy regeneration timer ───────────────────────────────
        const energyTimer = setInterval(() => {
            const s = useGameStore.getState();
            if (typeof s.regenerateEnergy === 'function') s.regenerateEnergy();
            if (typeof s.resetDailyCounters === 'function') s.resetDailyCounters();
        }, 10_000);

        // Run once immediately on mount to apply offline regen
        const s = useGameStore.getState();
        if (typeof s.regenerateEnergy === 'function') s.regenerateEnergy();

        return () => {
            clearInterval(energyTimer);
        };
    }, []);

    React.useEffect(() => {
        if (graphicsQuality === 'LOW') {
            document.body.classList.add('graphics-low');
        } else {
            document.body.classList.remove('graphics-low');
        }
        return () => {
            document.body.classList.remove('graphics-low');
        };
    }, [graphicsQuality]);

    return (
        <div
            className="hud-layer"
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 100,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                    <React.Suspense
                        fallback={
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    width: '100%',
                                    backgroundColor: '#0a0806',
                                    color: '#f5d37a',
                                    fontWeight: 'bold',
                                    fontSize: '20px',
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    pointerEvents: 'auto',
                                }}
                            >
                                Загрузка локации...
                            </div>
                        }
                    >
                        <SceneSwitcher />
                    </React.Suspense>
                </div>
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
                    <GameHUD />
                </div>
            </div>

            {/* ⚠️ Session Conflict Overlay */}
            <AnimatePresence>
                {sessionConflict && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 999999,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(20px)',
                            backgroundColor: 'rgba(10, 8, 6, 0.96)',
                            color: '#fff',
                            fontFamily: "'Outfit', 'Inter', sans-serif",
                            padding: '24px',
                            textAlign: 'center',
                            pointerEvents: 'auto',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '80px',
                                marginBottom: '20px',
                                filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.4))',
                                animation: 'pulseConflict 2s infinite',
                            }}
                        >
                            ⚠️
                        </div>
                        <h2
                            style={{
                                fontSize: '30px',
                                fontWeight: 900,
                                background: 'linear-gradient(135deg, #FFE07D 0%, #F59E0B 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: '0 0 16px 0',
                                textTransform: 'uppercase',
                                letterSpacing: '2.5px',
                            }}
                        >
                            СЕССИЯ ПРЕРВАНА
                        </h2>
                        <div
                            style={{
                                background: 'rgba(245, 158, 11, 0.04)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '16px',
                                padding: '24px 30px',
                                maxWidth: '520px',
                                marginBottom: '32px',
                                boxShadow: 'inset 0 0 15px rgba(245,158,11,0.02)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '16px',
                                    color: '#FFE07D',
                                    margin: '0 0 12px 0',
                                    fontWeight: 700,
                                    lineHeight: 1.5,
                                }}
                            >
                                Обнаружен одновременный вход с другого устройства или вкладки браузера.
                            </p>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#A1A1AA',
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                Чтобы защитить ваш прогресс, сохранение данных на этом устройстве было заблокировано.
                                Пожалуйста, перезапустите игру.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '14px 32px',
                                borderRadius: '12px',
                                border: '2px solid rgba(245, 158, 11, 0.35)',
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                color: '#FFE07D',
                                fontWeight: 800,
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.22)';
                                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
                                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                            }}
                        >
                            ОБНОВИТЬ ИГРУ
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🚫 Banned Overlay */}
            <AnimatePresence>
                {isBanned && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 999999,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(20px)',
                            backgroundColor: 'rgba(15, 5, 5, 0.95)',
                            color: '#fff',
                            fontFamily: "'Outfit', 'Inter', sans-serif",
                            padding: '24px',
                            textAlign: 'center',
                            pointerEvents: 'auto',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '80px',
                                marginBottom: '20px',
                                filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))',
                            }}
                        >
                            🚫
                        </div>
                        <h2
                            style={{
                                fontSize: '32px',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: '0 0 12px 0',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                            }}
                        >
                            ВАШ АККАУНТ ЗАБЛОКИРОВАН
                        </h2>
                        <div
                            style={{
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                padding: '20px',
                                maxWidth: '500px',
                                marginBottom: '32px',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '16px',
                                    color: '#FCA5A5',
                                    margin: '0 0 10px 0',
                                    fontWeight: 'bold',
                                }}
                            >
                                Причина: {banReason || 'Нарушение правил игры'}
                            </p>
                            {banUntil && (
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: '#F87171',
                                        margin: 0,
                                    }}
                                >
                                    Блокировка действует до: {banUntil === 'perm' ? 'Перманентно (навсегда)' : banUntil}
                                </p>
                            )}
                        </div>
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#71717A',
                                maxWidth: '400px',
                                lineHeight: 1.5,
                            }}
                        >
                            Если вы считаете, что блокировка была выдана по ошибке, обратитесь в поддержку игры или
                            напишите разработчикам.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🔄 Screen Rotation Warning Overlay */}
            <AnimatePresence>
                {isPortrait && isMobile && !dismissedRotationWarning && (
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
                            Игра создана для горизонтального режима. Пожалуйста, переверните телефон для лучшего
                            игрового опыта.
                        </p>
                        <button
                            onClick={() => setDismissedRotationWarning(true)}
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

            {isDev && (
                <>
                    <button
                        onClick={() => setShowItemBuilder(true)}
                        style={{
                            position: 'fixed',
                            bottom: '10px',
                            left: '10px',
                            zIndex: 999999,
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                            color: '#f0c040',
                            border: '1px solid rgba(240, 192, 64, 0.4)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                            pointerEvents: 'auto',
                        }}
                    >
                        🛠️ Item Builder
                    </button>
                    {showItemBuilder && <ItemBuilder onClose={() => setShowItemBuilder(false)} />}
                </>
            )}
        </div>
    );
};
