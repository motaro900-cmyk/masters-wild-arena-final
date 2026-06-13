import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { AppConfig } from '../../configs/AppConfig';
import { audioService } from '../../services/AudioService';
import { AssetsMap } from '../../configs/AssetsMap';
import { SceneSwitcher } from '../components/SceneSwitcher';
import { GameHUD } from '../components/GameHUD';
import { ItemBuilder } from '../../components/dev/ItemBuilder';

export const SafeGameLayout = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
    const [scale, setScale] = React.useState(1);
    const [isPortrait, setIsPortrait] = React.useState(
        typeof window !== 'undefined' && window.innerWidth < window.innerHeight,
    );
    const [dismissedRotationWarning, setDismissedRotationWarning] = React.useState(false);
    const [showItemBuilder, setShowItemBuilder] = React.useState(false);

    const isDev =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const { setShowFps, isBanned, banReason, banUntil, sessionConflict, graphicsQuality } = useGameStore((state) => ({
        setShowFps: state.setShowFps,
        isBanned: state.isBanned,
        banReason: state.banReason,
        banUntil: state.banUntil,
        sessionConflict: state.sessionConflict,
        graphicsQuality: state.graphicsQuality,
    }));

    React.useEffect(() => {
        const handleResize = () => {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const gw = AppConfig.GAME_WIDTH;
            const gh = AppConfig.GAME_HEIGHT;

            const portrait = sw < sh;
            setIsPortrait(portrait);

            // Use width-based scale on mobile (portrait) or standard fit-scale on landscape (PC)
            const s = portrait ? sw / gw : Math.min(sw / gw, sh / gh);
            setScale(s);

            // [Mobile Fix]: Force scroll to top to hide address bar
            window.scrollTo(0, 0);
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'F8') setShowFps(!useGameStore.getState().showFps);
        };

        const handleFirstInteraction = () => {
            audioService.resumeContext();
            const state = useGameStore.getState();
            if (AssetsMap?.AUDIO?.MUSIC_LIST && !audioService.isPlaying() && !state.isMuted) {
                audioService.playPlaylist(AssetsMap.AUDIO.MUSIC_LIST);
            }
            // Remove listener after first interaction
            window.removeEventListener('pointerdown', handleFirstInteraction);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        window.addEventListener('keydown', handleKey);
        window.addEventListener('pointerdown', handleFirstInteraction);
        handleResize();

        // ─── Global energy regeneration timer ───────────────────────────────
        // Runs every 10 seconds to keep energy up-to-date on all screens
        const energyTimer = setInterval(() => {
            const s = useGameStore.getState();
            if (typeof s.regenerateEnergy === 'function') s.regenerateEnergy();
            if (typeof s.resetDailyCounters === 'function') s.resetDailyCounters();
        }, 10_000);

        // Run once immediately on mount to apply offline regen
        const s = useGameStore.getState();
        if (typeof s.regenerateEnergy === 'function') s.regenerateEnergy();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('pointerdown', handleFirstInteraction);
            clearInterval(energyTimer);
        };
    }, [setShowFps]);

    const isMobile = useGameStore((state) => state.isMobile);

    return (
        <div
            className={isMobile ? 'is-mobile' : 'is-pc'}
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0a0806',
                backgroundImage: `radial-gradient(circle, rgba(12, 9, 7, 0.4) 0%, rgba(5, 4, 3, 0.98) 100%), url(${
                    isMobile ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE : AssetsMap.BACKGROUNDS.MAIN_MENU
                })`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
            }}
        >
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
                                Чтобы защитить ваш прогресс, сохранение данных на этом устройстве было заблокировано. Пожалуйста, перезапустите игру.
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

            {/* Unified 1920x1080 Scaled Container */}
            <div
                className="game-scale-wrapper"
                style={{
                    width: `${AppConfig.GAME_WIDTH}px`,
                    height: `${AppConfig.GAME_HEIGHT}px`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    filter:
                        graphicsQuality === 'ULTRA'
                            ? 'contrast(1.04) saturate(1.08) brightness(0.97)'
                            : graphicsQuality === 'MEDIUM'
                              ? 'contrast(1.02) saturate(1.03) brightness(0.99)'
                              : 'none',
                }}
            >
                {/* 1. GAME LAYER (PIXI + SCALED CONTENT) */}
                <div
                    className="game-container"
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundImage: `url(${
                            isMobile ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE : AssetsMap.BACKGROUNDS.MAIN_MENU
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#0c0c0c',
                        boxShadow: '0 0 100px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        zIndex: 1,
                        pointerEvents: 'auto',
                    }}
                >
                    <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} />
                </div>

                {/* 2. HUD LAYER (LIQUID / ADAPTIVE) */}
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
                </div>
            </div>
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
