import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './ui/sprites.css';
import { GameApp } from './GameApp';
import { GameHUD } from './ui/components/GameHUD';
import { FpsCounter } from './ui/components/hud/FpsCounter';
import { AppConfig } from './configs/AppConfig';
import { useGameStore } from './store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { initVK, getVkUserInfo } from './utils/VKBridge';
import * as PIXI from 'pixi.js';
import { AssetsMap } from './configs/AssetsMap';
import { audioService } from './services/AudioService';
import { ITEMS_DATABASE } from './game/configs/ItemsConfig';

// Ленивая загрузка экранов и сцен для оптимизации размера бандла (Шаг 11)
const ShopScene = React.lazy(() => import('./ui/components/hud/ShopScene').then((m) => ({ default: m.ShopScene })));
const BattlePassScene = React.lazy(() =>
    import('./ui/components/hud/BattlePassScene').then((m) => ({ default: m.BattlePassScene })),
);
const HeroScene = React.lazy(() =>
    import('./ui/components/hud/HeroScene/index').then((m) => ({ default: m.HeroScene })),
);
const IntroScreen = React.lazy(() =>
    import('./ui/components/screens/IntroScreen').then((m) => ({ default: m.IntroScreen })),
);
const CityScreen = React.lazy(() =>
    import('./ui/components/screens/CityScreen').then((m) => ({ default: m.CityScreen })),
);
const ForgeScreen = React.lazy(() =>
    import('./ui/components/screens/ForgeScreen').then((m) => ({ default: m.ForgeScreen })),
);
const AncientsSanctuaryScreen = React.lazy(() =>
    import('./ui/components/screens/AncientsSanctuaryScreen').then((m) => ({ default: m.AncientsSanctuaryScreen })),
);
const BattleScene = React.lazy(() =>
    import('./ui/components/hud/BattleScene').then((m) => ({ default: m.BattleScene })),
);

// Глобальный доступ для отладки
(window as any).audioService = audioService;
(window as any).AssetsMap = AssetsMap;
(window as any).ITEMS_DATABASE = ITEMS_DATABASE;
if (import.meta.env.DEV) {
    (window as any).useGameStore = useGameStore;
}

// [Optimization] Immediate background preload to satisfy browser 'preload' check
// This ensures the preloaded asset in index.html is "used" by the game logic immediately.
PIXI.Assets.backgroundLoad([AssetsMap.BACKGROUNDS.MAIN_MENU]);

// [VK] Global Error Handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        if (e.message && (e.message.includes('ERR_CERT_DATE_INVALID') || e.message.includes('404'))) {
            console.warn('⚠️ Network/Cert error detected. Attempting recovery...');
        }
    });

    // [Migration] Store migrations are handled by Zustand persist migrate() in useGameStore.ts
}

// ─── КОМПОНЕНТЫ ──────────────────────────────────────────────────────────────

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error('ErrorBoundary caught an error', error, errorInfo);
        fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[React UI Error] ${error?.message || 'Unknown Error'}`,
                source: 'ErrorBoundary',
                line: 0,
                col: 0,
                stack: (error?.stack || '') + '\nComponent Stack:\n' + (errorInfo?.componentStack || ''),
            }),
        }).catch(() => {});
    }
    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff4444',
                        textAlign: 'center',
                        padding: '20px',
                        fontFamily: 'sans-serif',
                    }}
                >
                    <h2>Произошла критическая ошибка интерфейса</h2>
                    <p style={{ color: '#aaa', maxWidth: '600px' }}>
                        {this.state.error?.message || 'Неизвестная ошибка'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            marginTop: '20px',
                            cursor: 'pointer',
                            background: '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                        }}
                    >
                        Перезагрузить игру
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── КОМПОНЕНТЫ ──────────────────────────────────────────────────────────────

export const SafeGameLayout = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
    const [scale, setScale] = React.useState(1);
    const [isPortrait, setIsPortrait] = React.useState(
        typeof window !== 'undefined' && window.innerWidth < window.innerHeight,
    );
    const [dismissedRotationWarning, setDismissedRotationWarning] = React.useState(false);

    const { setShowFps, showFps } = useGameStore((state) => ({
        setShowFps: state.setShowFps,
        showFps: state.showFps,
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
                backgroundColor: '#000',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
            }}
        >
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
                }}
            >
                {/* 1. GAME LAYER (PIXI + SCALED CONTENT) */}
                <div
                    className="game-container premium-saturated-panel"
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
                    className="hud-layer premium-saturated-panel"
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
                            <React.Suspense fallback={null}>
                                <SceneSwitcher />
                            </React.Suspense>
                        </div>
                        <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
                            <GameHUD />
                        </div>
                    </div>
                </div>
            </div>
            {showFps && <FpsCounter />}
        </div>
    );
};

export const SceneSwitcher = () => {
    const activeScreen = useGameStore((state) => state.activeScreen);
    return (
        <>
            {activeScreen === 'INTRO' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 11000 }}>
                    <IntroScreen
                        onComplete={() => {
                            useGameStore.setState({ activeScreen: 'MAIN_MENU', showIntro: false });
                        }}
                    />
                </div>
            )}
            {activeScreen === 'CITY' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 9000 }}>
                    <CityScreen />
                </div>
            )}
            <AnimatePresence>
                {activeScreen === 'HEROES' && (
                    <div key="scene-heroes" style={{ position: 'absolute', inset: 0, zIndex: 10000 }}>
                        <HeroScene />
                    </div>
                )}
                {activeScreen === 'SHOP' && (
                    <div key="scene-shop" style={{ position: 'absolute', inset: 0, zIndex: 10100 }}>
                        <ShopScene />
                    </div>
                )}
                {activeScreen === 'BATTLE_PASS' && (
                    <div key="scene-bp" style={{ position: 'absolute', inset: 0, zIndex: 10200 }}>
                        <BattlePassScene onClose={() => useGameStore.getState().setScreen('MAIN_MENU')} />
                    </div>
                )}
                {activeScreen === 'BATTLE' && (
                    <div key="scene-battle" style={{ position: 'absolute', inset: 0, zIndex: 12000 }}>
                        <BattleScene />
                    </div>
                )}
                {activeScreen === 'FORGE' && (
                    <div key="scene-forge" style={{ position: 'absolute', inset: 0, zIndex: 9500 }}>
                        <ForgeScreen />
                    </div>
                )}
                {activeScreen === 'SANCTUARY' && (
                    <div key="scene-sanctuary" style={{ position: 'absolute', inset: 0, zIndex: 9100 }}>
                        <AncientsSanctuaryScreen />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

let isAppInitialized = false;

export const Root = () => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [initError, setInitError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isAppInitialized || !containerRef.current) return;
        isAppInitialized = true;

        const initApp = async () => {
            // [Anti-Grey] Loading Timeout (20s)
            const timeoutId = setTimeout(() => {
                if (!isAppInitialized || (containerRef.current && containerRef.current.children.length === 0)) {
                    console.error('❌ Loading Timeout: App failed to initialize in 20s');
                    setInitError(
                        'Превышено время ожидания загрузки. Пожалуйста, проверьте интернет-соединение и попробуйте снова.',
                    );
                }
            }, 20000);

            try {
                console.log('🏁 Root: Initializing App...');

                // 1. VK Bridge
                try {
                    const vkAvailable = await initVK();
                    console.log('📡 VK Status:', vkAvailable ? 'Connected' : 'Standalone');
                    if (vkAvailable) {
                        const user = await getVkUserInfo();
                        if (user) {
                            const store = useGameStore.getState();
                            store.setVkUser(user);
                            // [Fix] Всегда обновляем аватар из ВК при старте
                            if (user.photo200 || user.photo) {
                                store.updateProfile({ avatar: user.photo200 || user.photo });
                            }
                        }
                    }

                    // Parse referral params (Step 19)
                    const searchParams = new URLSearchParams(window.location.search);
                    const startParam = searchParams.get('vk_start_params') || searchParams.get('start_parameter');
                    if (startParam) {
                        console.log('📌 Found referral start parameter:', startParam);
                        useGameStore.getState().processReferralCode(startParam);
                    }
                } catch (vkErr) {
                    console.warn('⚠️ VK Bridge failed to init, continuing in standalone mode', vkErr);
                }

                // 2. Game Engine
                console.log('🎮 Starting GameEngine...');
                const game = new GameApp();
                await game.init(containerRef.current!);

                clearTimeout(timeoutId); // [Anti-Grey] Success! Cancel timeout
                console.log('✅ Game Ready!');

                const state = useGameStore.getState();
                const { syncService } = await import('./services/SyncService');

                // 3. Audio & Sync Initialization
                if (state.isMuted) {
                    audioService.setMusicVolume(0);
                    audioService.setSFXVolume(0);
                } else {
                    audioService.setMusicVolume(state.musicVolume / 100);
                    audioService.setSFXVolume(state.soundVolume / 100);
                }

                syncService.startAutoSync(60000);
                syncService.subscribeToChat((messages) => {
                    useGameStore.getState().setMessages(messages);
                });
                syncService.subscribeToFriendRequests(state.playerId, (requests) => {
                    useGameStore.getState().setFriendRequests(requests);
                });
                syncService.subscribeToMail(state.playerId, (mails) => {
                    useGameStore.getState().setMail(mails);
                });

                // Гарантируем наличие приветственных сообщений
                const hasWelcome = state.messages.some((m: any) => m.id === 'welcome-1');
                const hasCodex = state.messages.some((m: any) => m.id === 'codex-1');

                if (!hasWelcome || !hasCodex) {
                    const welcomeMsgs = [];
                    if (!hasWelcome)
                        welcomeMsgs.push({
                            id: 'welcome-1',
                            author: 'СИСТЕМА',
                            avatar: '/assets/images/ui/system_icon.png',
                            text: 'Приветствуем в Masters of the Wild! Твой путь к величию начинается здесь. 🐉⚔️',
                            type: 'system',
                            timestamp: Date.now() - 2000,
                            level: 1,
                            rankIcon: '',
                        });
                    if (!hasCodex)
                        welcomeMsgs.push({
                            id: 'codex-1',
                            author: 'КОДЕКС ЧЕСТИ',
                            avatar: '/assets/images/ui/system_icon.png',
                            text: 'Истинная сила — в уважении. Будьте вежливы, не используйте оскорбления и мат. Пусть в чате царит дух честной игры! 🛡️🤝',
                            type: 'system',
                            timestamp: Date.now() - 1000,
                            level: 1,
                            rankIcon: '',
                        });

                    const merged = [...welcomeMsgs, ...state.messages];
                    const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
                    useGameStore.setState({
                        messages: unique.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
                    });
                }

                const MSK_OFFSET = 3 * 60 * 60 * 1000;
                const DAY_MS = 24 * 60 * 60 * 1000;

                const isNewDayMSK = (last: number) => {
                    const nowMSK = Date.now() + MSK_OFFSET;
                    const lastMSK = last + MSK_OFFSET;
                    return Math.floor(nowMSK / DAY_MS) > Math.floor(lastMSK / DAY_MS);
                };

                // [Fix] Направляем игроков на Интро, если обучение не пройдено (пропускаем на localhost для разработчиков)
                const isLocalhost = typeof window !== 'undefined' && 
                    (window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.protocol === 'file:');

                if (isLocalhost) {
                    if (!state.onboardingCompleted || state.name === 'Мастер') {
                        console.log('🛠️ Localhost dev mode: Auto-completing onboarding to speed up dev flow...');
                        useGameStore.setState({
                            onboardingCompleted: true,
                            name: 'Разработчик',
                            activeScreen: 'MAIN_MENU'
                        });
                    }
                } else if (!state.onboardingCompleted) {
                    console.log('👶 New player or Onboarding not completed, forcing Intro...');
                    useGameStore.setState({ activeScreen: 'INTRO' });
                }

                if (isNewDayMSK(state.lastDailyRefresh) || !state.dailyQuests || state.dailyQuests.length === 0) {
                    state.refreshDailyQuests();
                }

                if (!state.weeklyQuests || state.weeklyQuests.length === 0) {
                    state.refreshWeeklyQuests();
                }

                state.updateQuestProgress('LOGIN', 1);

                // Очистка тестовых сообщений
                if (state.messages.some((m: any) => m.author === 'Мастер' && m.text === 'Привет')) {
                    useGameStore.setState({
                        messages: state.messages.filter((m: any) => !(m.author === 'Мастер' && m.text === 'Привет')),
                    });
                }

                // ─── ОБРАБОТКА ПАРАМЕТРОВ ЗАПУСКА (РЕФЕРАЛЫ, ПОДАРКИ) ───
                // [Note] Referral code processing is done once above in the VK Bridge block
                const urlParams = new URLSearchParams(window.location.search);
                const requestId = urlParams.get('request_id');

                if (requestId) {
                    console.log('🎁 Game launched via Request Link:', requestId);
                    setTimeout(() => {
                        useGameStore.getState().addGold(5000);
                        alert('Вы получили подарок от друга: 5,000 золота! 💰');
                    }, 3000);
                }

                // [Optimization] Background refresh check every minute (MSK Aligned)
                const refreshInterval = setInterval(() => {
                    const currentState = useGameStore.getState();
                    if (isNewDayMSK(currentState.lastDailyRefresh)) {
                        console.log('🔄 MSK Midnight: Auto-refreshing daily quests...');
                        currentState.refreshDailyQuests();
                    }
                }, 60000);

                return () => clearInterval(refreshInterval);
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error('❌ Critical Init Error:', err);
                setInitError(err.message || 'Ошибка инициализации ядра игры');
            }
        };

        initApp();
    }, []);

    if (initError) {
        return (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: '#0c0c0c',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff4444',
                    textAlign: 'center',
                    padding: '40px',
                    fontFamily: 'sans-serif',
                }}
            >
                <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Критическая ошибка запуска</h2>
                <div
                    style={{
                        background: 'rgba(255,0,0,0.1)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,0,0,0.2)',
                        marginBottom: '30px',
                        maxWidth: '500px',
                    }}
                >
                    <code style={{ fontSize: '14px', color: '#ff7777', wordBreak: 'break-all' }}>{initError}</code>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '15px 35px',
                        background: '#c8952a',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    ПОПРОБОВАТЬ СНОВА
                </button>
                <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
                    Если ошибка повторяется, проверьте интернет-соединение или попробуйте позже.
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <SafeGameLayout containerRef={containerRef} />
        </ErrorBoundary>
    );
};

// ─── ТОЧКА ВХОДА ─────────────────────────────────────────────────────────────

const rootEl = document.getElementById('root');
if (rootEl) {
    // [HMR Fix] Сохраняем root в window, чтобы не создавать его дважды при обновлении кода
    const g = window as any;
    if (!g.__REACT_ROOT__) {
        g.__REACT_ROOT__ = ReactDOM.createRoot(rootEl);
    }
    g.__REACT_ROOT__.render(<Root />);
}
