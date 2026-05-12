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
import { HeroScene } from './ui/components/hud/HeroScene';
import { AnimatePresence } from 'framer-motion';
import { FpsCounter } from './ui/components/hud/FpsCounter';
import { IntroScreen } from './ui/components/screens/IntroScreen';
import { CityScreen } from './ui/components/screens/CityScreen';
import { initVK, getVkUserInfo } from './utils/VKBridge';

// [VK] Global Error Handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        if (e.message && (e.message.includes('ERR_CERT_DATE_INVALID') || e.message.includes('404'))) {
            console.warn('⚠️ Network/Cert error detected. Attempting recovery...');
        }
    });
}

// ─── КОМПОНЕНТЫ ──────────────────────────────────────────────────────────────

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
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
                <div style={{
                    width: '100vw', height: '100vh', backgroundColor: '#000',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#ff4444', textAlign: 'center', padding: '20px', fontFamily: 'sans-serif'
                }}>
                    <h2>Произошла критическая ошибка интерфейса</h2>
                    <p style={{ color: '#aaa', maxWidth: '600px' }}>{this.state.error?.message || 'Неизвестная ошибка'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '12px 24px', marginTop: '20px', cursor: 'pointer', background: '#333', color: '#fff', border: 'none', borderRadius: '8px' }}
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

const SafeGameLayout = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
    const [scale, setScale] = React.useState(1);
    const { showFps, setShowFps } = useGameStore(state => ({
        showFps: state.showFps,
        setShowFps: state.setShowFps
    }));

    React.useEffect(() => {
        const handleResize = () => {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const gw = AppConfig.GAME_WIDTH;
            const gh = AppConfig.GAME_HEIGHT;

            const s = Math.min(sw / gw, sh / gh);
            setScale(s);
            window.scrollTo(0, 0);
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'F8') setShowFps(!showFps);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        window.addEventListener('keydown', handleKey);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            window.removeEventListener('keydown', handleKey);
        };
    }, [showFps, setShowFps]);


    return (
        <div style={{
            width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#000', overflow: 'hidden',
            position: 'fixed', top: 0, left: 0 // Prevent scrolling of body
        }}>
            <div style={{
                width: `${AppConfig.GAME_WIDTH}px`, height: `${AppConfig.GAME_HEIGHT}px`,
                transform: `scale(${scale})`, transformOrigin: 'center center',
                position: 'relative', flexShrink: 0,
                backgroundColor: '#0c0c0c', boxShadow: '0 0 100px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }}>
                <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
                    <GameHUD />
                </div>
                {showFps && <FpsCounter />}
                <SceneSwitcher />
            </div>

        </div>
    );
};

const SceneSwitcher = () => {
    const activeScreen = useGameStore(state => state.activeScreen);
    return (
        <>
            {activeScreen === 'INTRO' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 11000 }}>
                    <IntroScreen onComplete={() => {
                        useGameStore.setState({ activeScreen: 'MAIN_MENU', showIntro: false });
                    }} />
                </div>
            )}
            {activeScreen === 'CITY' && <div style={{ position: 'absolute', inset: 0, zIndex: 9000 }}><CityScreen /></div>}
            <AnimatePresence>
                {activeScreen === 'HEROES' && <div key="scene-heroes" style={{ position: 'absolute', inset: 0, zIndex: 400 }}><HeroScene /></div>}
                {activeScreen === 'SHOP' && <div key="scene-shop" style={{ position: 'absolute', inset: 0, zIndex: 500 }}><ShopScene /></div>}
                {activeScreen === 'BATTLE_PASS' && <div key="scene-bp" style={{ position: 'absolute', inset: 0, zIndex: 600 }}><BattlePassScene onClose={() => useGameStore.getState().setScreen('MAIN_MENU')} /></div>}
            </AnimatePresence>
        </>
    );
};


const Root = () => {
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
                    setInitError('Превышено время ожидания загрузки. Пожалуйста, проверьте интернет-соединение и попробуйте снова.');
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
                        if (user) useGameStore.getState().setVkUser(user);
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
                if (Date.now() - state.lastDailyRefresh > 86_400_000 || !state.dailyQuests || state.dailyQuests.length === 0) {
                    state.refreshDailyQuests();
                }
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
            <div style={{
                width: '100vw', height: '100vh', backgroundColor: '#0c0c0c',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#ff4444', textAlign: 'center', padding: '40px', fontFamily: 'sans-serif'
            }}>
                <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Критическая ошибка запуска</h2>
                <div style={{
                    background: 'rgba(255,0,0,0.1)', padding: '20px', borderRadius: '12px',
                    border: '1px solid rgba(255,0,0,0.2)', marginBottom: '30px', maxWidth: '500px'
                }}>
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
                        transition: 'transform 0.2s'
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
    ReactDOM.createRoot(rootEl).render(<Root />);
}