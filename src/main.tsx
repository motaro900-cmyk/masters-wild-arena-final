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
import { ItemBuilder } from './components/dev/ItemBuilder';
import * as Sentry from '@sentry/react';

// Инициализация Sentry для отслеживания ошибок на клиенте
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
    console.log('[Sentry] Telemetry initialized successfully.');
} else {
    console.warn('[Sentry] DSN is not provided. Remote error monitoring is disabled.');
}

import { lazyWithRetry } from './utils/LazyWithRetry';

// Ленивая загрузка экранов и сцен для оптимизации размера бандла (Шаг 11)
const ShopScene = lazyWithRetry(() => import('./ui/components/hud/ShopScene').then((m) => ({ default: m.ShopScene })));
const BattlePassScene = lazyWithRetry(() =>
    import('./ui/components/hud/BattlePassScene').then((m) => ({ default: m.BattlePassScene })),
);
const HeroScene = lazyWithRetry(() =>
    import('./ui/components/hud/HeroScene/index').then((m) => ({ default: m.HeroScene })),
);
import { AncientsSanctuaryScreen } from './ui/components/screens/AncientsSanctuaryScreen';

const IntroScreen = lazyWithRetry(() =>
    import('./ui/components/screens/IntroScreen').then((m) => ({ default: m.IntroScreen })),
);
const CityScreen = lazyWithRetry(() =>
    import('./ui/components/screens/CityScreen').then((m) => ({ default: m.CityScreen })),
);
const ForgeScreen = lazyWithRetry(() =>
    import('./ui/components/screens/ForgeScreen').then((m) => ({ default: m.ForgeScreen })),
);
const BattleScene = lazyWithRetry(() =>
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
        Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo?.componentStack,
                source: 'ErrorBoundary',
            },
        });
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
    const [showItemBuilder, setShowItemBuilder] = React.useState(false);

    const isDev =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const { setShowFps, showFps, isBanned, banReason, banUntil } = useGameStore((state) => ({
        setShowFps: state.setShowFps,
        showFps: state.showFps,
        isBanned: state.isBanned,
        banReason: state.banReason,
        banUntil: state.banUntil,
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
    const [notInVk, setNotInVk] = React.useState(false);
    const [isAppLoading, setIsAppLoading] = React.useState(true);
    const [loadingText, setLoadingText] = React.useState('Инициализация приложения...');

    React.useEffect(() => {
        if (isAppInitialized || !containerRef.current) return;
        isAppInitialized = true;

        let unsubChat: (() => void) | null = null;
        let unsubFriends: (() => void) | null = null;
        let unsubMail: (() => void) | null = null;
        let unsubProfile: (() => void) | null = null;
        let refreshInterval: any = null;

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
                setLoadingText('Подключение к VK Bridge...');

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

                // 2. Load Player Data from Firebase first to prevent overwrite with default values
                setLoadingText('Загрузка профиля игрока...');
                const { syncService, SyncService } = await import('./services/SyncService');
                let state = useGameStore.getState();

                const isLocalhost =
                    typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.') ||
                        window.location.hostname.endsWith('.local') ||
                        window.location.protocol === 'file:');

                if (!isLocalhost && !state.vkUser) {
                    console.warn('❌ Blocked access: Guest access is forbidden in production.');
                    clearTimeout(timeoutId);
                    setNotInVk(true);
                    return;
                }

                // Try to load player data from Firebase before checking onboarding status
                const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
                console.log('🔍 Checking Firebase profile for:', userId);
                try {
                    const fbProfile = await syncService.loadPlayerData(userId);
                    if (fbProfile) {
                        console.log('💾 Found remote profile, restoring state...', fbProfile.name);

                        // Если в загруженном состоянии activeScreen равен 'INTRO', но при этом
                        // onboardingCompleted равен true, принудительно переводим на 'MAIN_MENU'
                        const restoredName = fbProfile.name;
                        const onboardingDone = fbProfile.onboardingCompleted;

                        const stateToRestore = { ...fbProfile };
                        if (stateToRestore.status === 'BANNED') {
                            stateToRestore.isBanned = true;
                        }
                        if (onboardingDone && restoredName && restoredName !== 'Мастер') {
                            stateToRestore.activeScreen = 'MAIN_MENU';
                        }

                        useGameStore.setState(stateToRestore);
                        state = useGameStore.getState();

                        // Если имя всё ещё дефолтное "Мастер" — игрок не прошёл регистрацию.
                        // Сбрасываем onboarding чтобы показать обучение заново.
                        if (!restoredName || restoredName === 'Мастер') {
                            console.log('⚠️ Default name detected after restore — resetting onboarding.');
                            useGameStore.setState({
                                onboardingCompleted: false,
                                tutorialStep: 0,
                                activeScreen: 'INTRO',
                            });
                        }
                    } else {
                        console.log('👶 No remote profile found in Firestore. Resetting onboarding for new player.');
                        useGameStore.setState({
                            name: 'Мастер',
                            onboardingCompleted: false,
                            tutorialStep: 0,
                            activeScreen: 'INTRO',
                            gold: 300,
                            crystals: 50,
                            level: 1,
                            rating: 0,
                            vipLevel: 0,
                            vipEndTime: 0,
                            inventory: [],
                            heroEquipment: {},
                        });
                    }
                } catch (loadErr) {
                    console.error('❌ Failed to load remote profile:', loadErr);
                }

                state = useGameStore.getState();
                if (isLocalhost) {
                    const localState = useGameStore.getState();
                    if (!localState.name || localState.name === 'Мастер') {
                        console.log('🛠️ Localhost detected: Auto-logging in as "Разработчик"');
                        useGameStore.setState({
                            name: 'Разработчик',
                            onboardingCompleted: true,
                            activeScreen: 'MAIN_MENU',
                        });
                        syncService.syncPlayerData();
                    }
                }

                // Get the updated state after restoring from Firebase
                const updatedState = useGameStore.getState();

                // 3. Game Engine
                setLoadingText('Инициализация графического ядра Pixi...');
                console.log('🎮 Starting GameEngine...');
                const game = new GameApp();
                await game.init(containerRef.current!);

                clearTimeout(timeoutId); // [Anti-Grey] Success! Cancel timeout
                console.log('✅ Game Ready!');

                // 3. Audio & Sync Initialization
                if (updatedState.isMuted) {
                    audioService.setMusicVolume(0);
                    audioService.setSFXVolume(0);
                } else {
                    audioService.setMusicVolume(updatedState.musicVolume / 100);
                    audioService.setSFXVolume(updatedState.soundVolume / 100);
                }

                syncService.startAutoSync(60000);

                // Слушатель смены экранов для Spectator Mode логов в реальном времени
                let lastScreen = useGameStore.getState().activeScreen;
                useGameStore.subscribe((state: any) => {
                    if (state.activeScreen && state.activeScreen !== lastScreen) {
                        const screenNames: Record<string, string> = {
                            INTRO: 'Вступление / Выбор имени',
                            CITY: 'Город',
                            HEROES: 'Герои (Снаряжение)',
                            SHOP: 'Магазин',
                            BATTLE_PASS: 'Боевой Пропуск',
                            BATTLE: 'Арена сражений',
                            FORGE: 'Кузница',
                            SANCTUARY: 'Святилище Древних',
                            MAIN_MENU: 'Главное меню',
                        };
                        const name = screenNames[state.activeScreen] || state.activeScreen;
                        lastScreen = state.activeScreen;
                        syncService.logPlayerAction(`Перешёл на экран: ${name}`);
                        syncService.debouncedSync();
                    }
                });

                unsubChat = syncService.subscribeToChat((messages) => {
                    useGameStore.getState().setMessages(messages);
                });
                unsubFriends = syncService.subscribeToFriendRequests(updatedState.playerId, (requests) => {
                    useGameStore.getState().setFriendRequests(requests);
                });
                unsubMail = syncService.subscribeToMail(updatedState.playerId, (mails) => {
                    useGameStore.getState().setMail(mails);
                });

                // Подписка на собственный профиль для мгновенного выполнения команд админа (кик, бан, ресурсы)
                let lastAppliedAdminVersion: number | null = null;
                unsubProfile = syncService.subscribeToOwnProfile(userId, (dbData) => {
                    if (!dbData) return;

                    // 1. Проверка бана
                    if (dbData.status === 'BANNED') {
                        useGameStore.setState({
                            isBanned: true,
                            banReason: dbData.banReason || 'Нарушение правил игры',
                            banUntil: dbData.banUntil || '',
                        });
                        return;
                    } else {
                        useGameStore.setState({ isBanned: false });
                    }

                    // 2. Проверка кика
                    if (dbData.status === 'KICKED') {
                        syncService.updateRemotePlayerData(userId, { status: 'OFFLINE' }).catch(() => {});
                        alert('Соединение разорвано: Вы были отключены администратором (KICKED).');
                        window.location.reload();
                        return;
                    }

                    // 3. Синхронизация изменений ресурсов и обликов
                    const fullStateStr = dbData.fullStateJSON || dbData.полноеСостояниеJSON;
                    if (fullStateStr) {
                        try {
                            const dbAdminVersion = Number(dbData.adminVersion || 0);
                            if (lastAppliedAdminVersion === null) {
                                lastAppliedAdminVersion = dbAdminVersion;
                            } else if (dbAdminVersion <= lastAppliedAdminVersion) {
                                return;
                            } else {
                                lastAppliedAdminVersion = dbAdminVersion;
                            }

                            const parsed = JSON.parse(fullStateStr);
                            const currentState = useGameStore.getState();

                            let hasChanges = false;
                            const updatePayload: any = {};

                            const trackedFields = [
                                'gold',
                                'crystals',
                                'level',
                                'rating',
                                'trophies',
                                'inventory',
                                'heroEquipment',
                                'ownedSkins',
                                'shards',
                                'ownedHeroes',
                                'energy',
                                'maxEnergy',
                            ];

                            for (const field of trackedFields) {
                                if (parsed[field] !== undefined) {
                                    const localVal = currentState[field];
                                    const remoteVal = parsed[field];

                                    if (typeof remoteVal === 'object') {
                                        if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
                                            updatePayload[field] = remoteVal;
                                            hasChanges = true;
                                        }
                                    } else {
                                        if (localVal !== remoteVal) {
                                            updatePayload[field] = remoteVal;
                                            hasChanges = true;
                                        }
                                    }
                                }
                            }

                            if (hasChanges) {
                                console.log(
                                    '[SyncService] Admin updated player state, applying changes:',
                                    updatePayload,
                                );
                                useGameStore.setState(updatePayload);
                            }
                        } catch (e) {
                            console.error('[SyncService] Error parsing own profile JSON update:', e);
                        }
                    }
                });

                // Гарантируем наличие приветственных сообщений (только один раз при первом входе)
                const welcomeKey = `seen_welcome_msgs_${updatedState.playerId}`;
                const hasSeenWelcome = localStorage.getItem(welcomeKey);
                const hasWelcome = hasSeenWelcome ? true : updatedState.messages.some((m: any) => m.id === 'welcome-1');
                const hasCodex = hasSeenWelcome ? true : updatedState.messages.some((m: any) => m.id === 'codex-1');

                if (!hasSeenWelcome && (!hasWelcome || !hasCodex)) {
                    localStorage.setItem(welcomeKey, 'true');
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

                    const merged = [...welcomeMsgs, ...updatedState.messages];
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

                // [Fix] Направляем игроков на Интро, если обучение не пройдено
                // На localhost обучение тоже работает — для тестирования
                // Чтобы пропустить обучение вручную в DevTools:
                //   useGameStore.setState({ onboardingCompleted: true })
                if (!updatedState.onboardingCompleted) {
                    console.log('👶 New player or Onboarding not completed, forcing tutorial...');
                    // Если имя не задано — сначала Intro, потом Tutorial
                    if (!updatedState.name || updatedState.name === 'Мастер') {
                        useGameStore.setState({ activeScreen: 'INTRO' });
                    }
                    // tutorialStep остаётся 0, TutorialOverlay сам покажется поверх игры
                }

                const finalState = useGameStore.getState();
                if (!finalState.dailyQuests || finalState.dailyQuests.length === 0) {
                    finalState.refreshDailyQuests();
                }

                if (!finalState.weeklyQuests || finalState.weeklyQuests.length === 0) {
                    finalState.refreshWeeklyQuests();
                }

                finalState.updateQuestProgress('LOGIN', 1);

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
                refreshInterval = setInterval(() => {
                    const currentState = useGameStore.getState();
                    if (isNewDayMSK(currentState.lastDailyRefresh)) {
                        console.log('🔄 MSK Midnight: Auto-refreshing daily quests...');
                        currentState.refreshDailyQuests();
                    }
                }, 60000);

                // Загрузка полностью завершена
                setIsAppLoading(false);
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error('❌ Critical Init Error:', err);
                setInitError(err.message || 'Ошибка инициализации ядра игры');
            }
        };

        initApp();

        return () => {
            if (unsubChat) unsubChat();
            if (unsubFriends) unsubFriends();
            if (unsubMail) unsubMail();
            if (unsubProfile) unsubProfile();
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, []);

    if (notInVk) {
        return (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    backgroundImage: `url(${AssetsMap.BACKGROUNDS.MAIN_MENU})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#0c0c0c',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '24px',
                    fontFamily: "'Cinzel', serif",
                    position: 'fixed',
                    top: 0,
                    left: 0,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        background: 'rgba(10, 7, 5, 0.9)',
                        backdropFilter: 'blur(30px)',
                        padding: '40px 60px',
                        borderRadius: '30px',
                        border: '1.5px solid rgba(200,149,42,0.6)',
                        boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(200,149,42,0.15)',
                        maxWidth: '650px',
                    }}
                >
                    <div
                        style={{
                            color: '#ffd700',
                            fontSize: '16px',
                            letterSpacing: '0.4em',
                            marginBottom: '15px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Вход ограничен
                    </div>
                    <h2
                        style={{
                            fontSize: '32px',
                            margin: '0 0 20px 0',
                            lineHeight: 1.2,
                            fontFamily: "'Cinzel Decorative', serif",
                        }}
                    >
                        Игра доступна только во ВКонтакте
                    </h2>
                    <p
                        style={{
                            fontSize: '18px',
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.8)',
                            marginBottom: '35px',
                        }}
                    >
                        Для игры в <strong style={{ color: '#ffd700' }}>Masters of the Wild</strong> используйте
                        официальное мини-приложение ВКонтакте. Гостевой доступ к веб-версии отключен разработчиком.
                    </p>
                    <button
                        onClick={() => window.open('https://vk.com/app52446645', '_blank')}
                        style={{
                            padding: '16px 45px',
                            background: 'linear-gradient(135deg, #ffe082, #c8952a)',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#1a0e05',
                            cursor: 'pointer',
                            letterSpacing: '0.15em',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            transition: 'transform 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        ИГРАТЬ В ВК
                    </button>
                </div>
            </div>
        );
    }

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
            
            {/* Premium Loading Overlay */}
            <AnimatePresence>
                {isAppLoading && (
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
                        {/* Background decorative elements */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(circle at center, rgba(30,22,12,0.35) 0%, rgba(10,7,5,0.95) 100%)',
                                pointerEvents: 'none',
                            }}
                        />
                        
                        {/* Circular pulsing container */}
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
                            {/* Glowing Logo Text */}
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

                            {/* Premium Loader Ring */}
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    border: '3px solid rgba(200, 149, 42, 0.1)',
                                    borderTop: '3px solid #c8952a',
                                    animation: 'spin 1.2s linear infinite',
                                    marginBottom: '30px',
                                    boxShadow: '0 0 15px rgba(200, 149, 42, 0.2)',
                                }}
                            />

                            {/* Loading Status Text */}
                            <div
                                style={{
                                    fontSize: '14px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Outfit', sans-serif",
                                    animation: 'pulse 2s infinite ease-in-out',
                                }}
                            >
                                {loadingText}
                            </div>
                        </div>

                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes pulse {
                                0%, 100% { opacity: 0.6; }
                                50% { opacity: 1; }
                            }
                        `}</style>
                    </motion.div>
                )}
            </AnimatePresence>
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
