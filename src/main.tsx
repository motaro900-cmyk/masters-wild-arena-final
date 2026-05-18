import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './ui/sprites.css';
import { GameApp } from './GameApp';
import { GameHUD } from './ui/components/GameHUD';
import { AppConfig } from './configs/AppConfig';
import { useGameStore } from './store/useGameStore';
import { ShopScene } from './ui/components/hud/ShopScene';
import { BattlePassScene } from './ui/components/hud/BattlePassScene';
import { HeroScene } from './ui/components/hud/HeroScene/index';
import { AnimatePresence } from 'framer-motion';
import { FpsCounter } from './ui/components/hud/FpsCounter';
import { IntroScreen } from './ui/components/screens/IntroScreen';
import { CityScreen } from './ui/components/screens/CityScreen';
import { ForgeScreen } from './ui/components/screens/ForgeScreen';
import { BattleScene } from './ui/components/hud/BattleScene';
import { initVK, getVkUserInfo } from './utils/VKBridge';
import * as PIXI from 'pixi.js';
import { AssetsMap } from './configs/AssetsMap';
import { audioService } from './services/AudioService';

// Глобальный доступ для отладки
(window as any).audioService = audioService;
(window as any).AssetsMap = AssetsMap;

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

    // [Hard Reset] Гарантированный сброс для версии 23
    const RESET_KEY = 'forced_reset_v23_final';
    if (!localStorage.getItem(RESET_KEY)) {
        localStorage.clear();
        localStorage.setItem(RESET_KEY, 'true');
        window.location.reload();
    }
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
    const { showFps, setShowFps } = useGameStore((state) => ({
        showFps: state.showFps,
        setShowFps: state.setShowFps,
    }));

    React.useEffect(() => {
        const handleResize = () => {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const gw = AppConfig.GAME_WIDTH;
            const gh = AppConfig.GAME_HEIGHT;

            // Use width-based scale on mobile (portrait) or standard fit-scale on landscape (PC)
            const isPortrait = sw < sh;
            const s = isPortrait ? sw / gw : Math.min(sw / gw, sh / gh);

            setScale(s);

            // [Mobile Fix]: Force scroll to top to hide address bar
            window.scrollTo(0, 0);
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'F8') setShowFps(!showFps);
        };

        const handleFirstInteraction = () => {
            audioService.resumeContext();
            if (AssetsMap?.AUDIO?.MUSIC_LIST && !audioService.isPlaying()) {
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

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('pointerdown', handleFirstInteraction);
        };
    }, [showFps, setShowFps]);

    const isMobile = useGameStore((state) => state.isMobile);
    const isPortrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight;

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
            {/* Unified 1920x1080 Scaled Container */}
            <div
                className="game-scale-wrapper"
                style={{
                    width: `${AppConfig.GAME_WIDTH}px`,
                    height: `${AppConfig.GAME_HEIGHT}px`,
                    position: 'absolute',
                    top: isPortrait ? 0 : '50%',
                    left: isPortrait ? 0 : '50%',
                    transform: isPortrait ? `scale(${scale})` : `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: isPortrait ? 'top left' : 'center center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
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
                    {showFps && <FpsCounter />}
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
                            <SceneSwitcher />
                        </div>
                        <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
                            <GameHUD />
                        </div>
                    </div>
                </div>
            </div>
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
                    <div key="scene-heroes" style={{ position: 'absolute', inset: 0, zIndex: 400 }}>
                        <HeroScene />
                    </div>
                )}
                {activeScreen === 'SHOP' && (
                    <div key="scene-shop" style={{ position: 'absolute', inset: 0, zIndex: 500 }}>
                        <ShopScene />
                    </div>
                )}
                {activeScreen === 'BATTLE_PASS' && (
                    <div key="scene-bp" style={{ position: 'absolute', inset: 0, zIndex: 600 }}>
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
            </AnimatePresence>
        </>
    );
};

export const Root = () => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const initialized = React.useRef(false);
    const [initError, setInitError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (initialized.current || !containerRef.current) return;
        initialized.current = true;

        const initApp = async () => {
            // [Anti-Grey] Loading Timeout (20s)
            const timeoutId = setTimeout(() => {
                if (!initialized.current || (containerRef.current && containerRef.current.children.length === 0)) {
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
                            if (user.photo_200 || user.photo) {
                                store.updateProfile({ avatar: user.photo_200 || user.photo });
                            }
                        }
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
                audioService.setMusicVolume(state.musicVolume / 100);
                audioService.setSFXVolume(state.soundVolume / 100);

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

                // [FORCE RESET] Принудительный сброс для версии 18
                if (state.level === 80 || state.rating === 11000) {
                    console.log('🧹 Force Resetting legacy test data...');
                    useGameStore.setState({
                        level: 1,
                        rating: 0,
                        exp: 0,
                        gold: 100000,
                        crystals: 100000,
                        title: 'Странник',
                    });
                }

                // [Fix] Направляем игроков на Интро, если обучение не пройдено
                if (!state.onboardingCompleted) {
                    console.log('👶 New player or Onboarding not completed, forcing Intro...');
                    useGameStore.setState({ activeScreen: 'INTRO' });
                }

                if (isNewDayMSK(state.lastDailyRefresh) || !state.dailyQuests || state.dailyQuests.length === 0) {
                    state.refreshDailyQuests();
                }

                state.updateQuestProgress('LOGIN', 1);

                // Очистка тестовых сообщений
                if (state.messages.some((m: any) => m.author === 'Мастер' && m.text === 'Привет')) {
                    useGameStore.setState({
                        messages: state.messages.filter((m: any) => !(m.author === 'Мастер' && m.text === 'Привет')),
                    });
                }

                // ─── ОБРАБОТКА ПАРАМЕТРОВ ЗАПУСКА (РЕФЕРАЛЫ, ПОДАРКИ) ───
                const urlParams = new URLSearchParams(window.location.search);
                const startParam = urlParams.get('vk_start_params') || urlParams.get('start_parameter');
                const requestId = urlParams.get('request_id');

                if (requestId) {
                    console.log('🎁 Game launched via Request Link:', requestId);
                    setTimeout(() => {
                        useGameStore.getState().addGold(5000);
                        alert('Вы получили подарок от друга: 5,000 золота! 💰');
                    }, 3000);
                }

                if (startParam) {
                    console.log('🔗 Game launched via Referral Link:', startParam);
                    // startParam обычно содержит ID пригласившего, например "ref_12345"
                    if (startParam.startsWith('ref_')) {
                        const inviterId = startParam.split('_')[1];
                        if (inviterId !== state.playerId) {
                            setTimeout(() => {
                                useGameStore.getState().addCrystals(100);
                                alert('Вы зашли по приглашению друга! Вам начислено 100 кристаллов. 💎');
                            }, 4000);
                        }
                    }
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
