import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './ui/sprites.css';
import { useGameStore } from './store/useGameStore';
import { AssetsMap } from './configs/AssetsMap';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { NotInVkScreen } from './ui/components/NotInVkScreen';
import { LoadingScreen } from './ui/components/LoadingScreen';
import { InitErrorScreen } from './ui/components/InitErrorScreen';
import { StandaloneWebHUD } from './ui/components/StandaloneWebHUD';
import { PortalPage } from './portal/PortalPage';
// SafeGameLayout is lazily loaded to prevent HUD components (GameHUD, framer-motion ~129 kB)
// from pulling into the startup bundle. It only renders when bootState === 'READY'.
const SafeGameLayout = React.lazy(() =>
    import('./ui/layouts/SafeGameLayout').then((m) => ({ default: m.SafeGameLayout })),
);
import { AppConfig } from './configs/AppConfig';
import { bootController, BootState } from './bootstrap/BootController';

const UpdateModal: React.FC = () => {
    const [isReloading, setIsReloading] = React.useState(false);

    const handleReload = () => {
        setIsReloading(true);
        const url = new URL(window.location.href);
        url.searchParams.set('t', Date.now().toString());
        window.location.href = url.toString();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(5, 4, 3, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Outfit', 'Cinzel', sans-serif",
            }}
        >
            <div
                style={{
                    width: 'min(420px, 94vw)',
                    padding: '35px 25px',
                    background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.95) 0%, rgba(15, 10, 5, 0.98) 100%)',
                    border: '2px solid #d4af37',
                    borderRadius: '16px',
                    boxShadow: '0 0 40px rgba(212, 175, 55, 0.25), inset 0 0 20px rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'fadeInScale 0.3s ease-out forwards',
                }}
            >
                <div
                    style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(0,0,0,0) 70%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
                    }}
                >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(212,175,55,0.2)"/></svg>
                </div>

                <h2
                    style={{
                        margin: '0 0 12px 0',
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#FFE07D',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: "'Cinzel', 'Philosopher', serif",
                    }}
                >
                    Обновление игры
                </h2>

                <p
                    style={{
                        margin: '0 0 25px 0',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#b5a695',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                >
                    Выпущена новая версия <b>Masters of the Wild</b>!<br />
                    Пожалуйста, обновите игру, чтобы получить последние изменения и продолжить играть.
                </p>

                <button
                    onClick={handleReload}
                    disabled={isReloading}
                    onMouseEnter={(e) => {
                        if (isReloading) return;
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                        if (isReloading) return;
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.4)';
                    }}
                    style={{
                        width: '100%',
                        padding: '14px 0',
                        background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                        border: '2.5px solid #fcd34d',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: 900,
                        cursor: isReloading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 8px 16px rgba(245, 158, 11, 0.4)',
                        fontFamily: "'Cinzel', 'Philosopher', serif",
                        letterSpacing: '1.5px',
                        opacity: isReloading ? 0.7 : 1,
                    }}
                >
                    {isReloading ? 'ОБНОВЛЕНИЕ...' : 'ОБНОВИТЬ ИГРУ'}
                </button>

                <style>{`
                    @keyframes fadeInScale {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export const Root = () => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const checkInitialViewMode = (): 'PORTAL' | 'GAME' => {
        if (typeof window === 'undefined') return 'PORTAL';
        const params = new URLSearchParams(window.location.search);
        if (
            params.has('play') ||
            params.has('duel') ||
            params.has('vk_user_id') ||
            params.has('viewer_id') ||
            params.has('tgWebAppStartParam')
        ) {
            return 'GAME';
        }
        return 'PORTAL';
    };

    const [viewMode, setViewMode] = React.useState<'PORTAL' | 'GAME'>(checkInitialViewMode);
    const [bootState, setBootState] = React.useState<BootState>(bootController.getState());
    const [initError, setInitError] = React.useState<string | null>(null);
    const [notInVk, setNotInVk] = React.useState(false);
    const [loadingText, setLoadingText] = React.useState('Инициализация приложения...');
    const [showUpdateModal, setShowUpdateModal] = React.useState(false);
    const isUpdatePendingRef = React.useRef(false);
    const [scale, setScale] = React.useState(1);
    const [rotated, setRotated] = React.useState(false);
    const isMobile =
        useGameStore((state: any) => state.isMobile) ||
        (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) ||
        (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidOrIOS =
        typeof navigator !== 'undefined' &&
        (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints > 0 && /Linux|Macintosh/i.test(navigator.platform)));
    const graphicsQuality = useGameStore((state: any) => state.graphicsQuality) || 'ULTRA';

    // Toggle is-mobile body class for global CSS adaptations
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.classList.toggle('is-mobile', isMobile);
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.body.classList.remove('is-mobile');
            }
        };
    }, [isMobile]);

    // Toggle portal-mode body class for smooth scrolling vs game canvas lock
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            const isPortal = viewMode === 'PORTAL';
            document.body.classList.toggle('portal-mode', isPortal);
            document.documentElement.classList.toggle('portal-mode', isPortal);
            const root = document.getElementById('root');
            if (root) root.classList.toggle('portal-mode', isPortal);
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.body.classList.remove('portal-mode');
                document.documentElement.classList.remove('portal-mode');
                const root = document.getElementById('root');
                if (root) root.classList.remove('portal-mode');
            }
        };
    }, [viewMode]);

    // Subscribe to boot controller changes
    React.useEffect(() => {
        const unsub = bootController.subscribe((state) => {
            setBootState(state);
            const err = bootController.getErrorText();
            if (err) setInitError(err);
        });
        return unsub;
    }, []);

    // Resize handler (throttled with rAF)
    React.useEffect(() => {
        let rafId: number | null = null;
        const handleResize = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                const sw = window.innerWidth;
                const sh = window.innerHeight;
                const gw = AppConfig.GAME_WIDTH;
                const gh = AppConfig.GAME_HEIGHT;
                const portrait = sw < sh;
                const isMobileDevice =
                    typeof navigator !== 'undefined' &&
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                let s: number;
                let isRotated = false;

                if (portrait && isMobileDevice) {
                    s = Math.min(sh / gw, sw / gh);
                    isRotated = true;
                } else {
                    s = Math.min(sw / gw, sh / gh);
                }

                setScale(s);
                setRotated(isRotated);
                window.scrollTo(0, 0);
            });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        handleResize();

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    const checkUpdate = React.useCallback(async () => {
        try {
            const clientBuildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;
            if (clientBuildTime === 0) return;

            const res = await fetch('./version.json?t=' + Date.now());
            if (!res.ok) return;
            const data = await res.json();

            if (data && typeof data.buildTime === 'number' && data.buildTime > clientBuildTime) {
                console.log(
                    `[Update Checker] New version detected on server: ${data.buildTime} (Client: ${clientBuildTime})`,
                );
                const isReady = bootController.isReady();
                const currentScreen = isReady ? useGameStore.getState().activeScreen : 'INTRO';
                if (currentScreen === 'BATTLE') {
                    isUpdatePendingRef.current = true;
                } else {
                    setShowUpdateModal(true);
                }
            }
        } catch (e) {
            // Fail silently
        }
    }, []);

    // Check updates periodically
    React.useEffect(() => {
        const initialTimeout = setTimeout(() => {
            checkUpdate();
        }, 10000);

        const intervalId = setInterval(() => {
            checkUpdate();
        }, 60000);

        const handleFocus = () => {
            checkUpdate();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkUpdate]);

    // Check updates when leaving battle
    React.useEffect(() => {
        if (bootState !== 'READY') return;
        const unsub = useGameStore.subscribe((state: any) => {
            if (isUpdatePendingRef.current && state.activeScreen !== 'BATTLE') {
                setShowUpdateModal(true);
            }
        });
        return unsub;
    }, [bootState]);

    // [VK Back Button] popstate interception
    React.useEffect(() => {
        const handleBrowserBack = (event: PopStateEvent) => {
            event.preventDefault();
            if (bootState !== 'READY') return;
            const currentScreen = useGameStore.getState().activeScreen;
            if (currentScreen !== 'CITY' && currentScreen !== 'INTRO' && currentScreen !== 'MAIN_MENU') {
                useGameStore.setState({ activeScreen: 'CITY' });
                window.history.pushState({ page: 'game' }, '');
            }
        };

        window.addEventListener('popstate', handleBrowserBack);
        window.history.pushState({ page: 'game' }, '');

        return () => {
            window.removeEventListener('popstate', handleBrowserBack);
        };
    }, [bootState]);

    const handleRetry = React.useCallback(() => {
        if (viewMode !== 'GAME') return;
        if (!containerRef.current) return;
        if (bootController.isReady()) return;
        setInitError(null);
        bootController.reset();
        bootController.start(containerRef.current, setLoadingText, setInitError, setNotInVk).catch(() => {});
    }, []);

    // Start BootController
    React.useEffect(() => {
        if (viewMode !== 'GAME') return;
        if (!containerRef.current) return;
        if (bootController.isReady()) return;
        bootController.start(containerRef.current, setLoadingText, setInitError, setNotInVk).catch(() => {});
    }, [viewMode]);

    const handleLaunchGame = (heroId?: string) => {
        if (heroId) {
            const store: any = useGameStore.getState();
            store.setSelectedHeroId?.(heroId);
        }
        const url = new URL(window.location.href);
        url.searchParams.set('play', '1');
        window.history.pushState({}, '', url.toString());
        setViewMode('GAME');
    };

    const handleBackToPortal = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('play');
        url.searchParams.delete('duel');
        window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
        setViewMode('PORTAL');
    };

    if (viewMode === 'PORTAL') {
        return (
            <ErrorBoundary>
                <PortalPage
                    onLaunchGame={() => handleLaunchGame()}
                    onSelectAndPlay={(id) => handleLaunchGame(id)}
                    onChallengePlayer={(_name) => handleLaunchGame()}
                    isGameActive={false}
                />
            </ErrorBoundary>
        );
    }

    if (notInVk) return <NotInVkScreen />;
    if (initError || bootState === 'FAILED')
        return <InitErrorScreen error={initError || 'Ошибка инициализации игры'} onRetry={handleRetry} />;

    const isAppLoading = bootState !== 'READY';

    return (
        <ErrorBoundary>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#050403',
                    overflow: 'hidden',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    zIndex: 1,
                }}
            >
                {/* Ambient Reactive Glow Backdrop (fills letterbox/pillarbox areas) */}
                {!isMobile && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-8%',
                            width: '116%',
                            height: '116%',
                            backgroundImage: `url(${
                                isMobile ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE : AssetsMap.BACKGROUNDS.MAIN_MENU
                            })`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(70px) saturate(2) brightness(0.35)',
                            opacity: 0.6,
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    />
                )}

                <div
                    className="game-scale-wrapper"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: AppConfig.GAME_WIDTH,
                        height: AppConfig.GAME_HEIGHT,
                        transform: rotated
                            ? `translate(-50%, -50%) rotate(90deg) scale(${scale})`
                            : `translate(-50%, -50%) scale(${scale})`,
                        transformOrigin: 'center center',
                        flexShrink: 0,
                        boxShadow: '0 0 100px rgba(0, 0, 0, 0.9)',
                        backgroundImage: `url(${
                            isMobile ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE : AssetsMap.BACKGROUNDS.MAIN_MENU
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#050403',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        filter:
                            !isMobile && !isAndroidOrIOS && graphicsQuality === 'ULTRA'
                                ? 'contrast(1.08) saturate(1.15) brightness(1.02)'
                                : !isMobile && !isAndroidOrIOS && graphicsQuality === 'MEDIUM'
                                  ? 'contrast(1.04) saturate(1.06) brightness(1.01)'
                                  : 'none',
                    }}
                >
                    {/* Pixi Canvas attaches to this ref */}
                    <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} />

                    {/* React HUD layer mounts ONLY when BootController is READY */}
                    {bootState === 'READY' && (
                        <React.Suspense fallback={null}>
                            <SafeGameLayout isMobile={isMobile} isPortrait={rotated} />
                        </React.Suspense>
                    )}
                </div>
            </div>

            <LoadingScreen isLoading={isAppLoading} loadingText={loadingText} />
            {showUpdateModal && <UpdateModal />}
            <StandaloneWebHUD onBackToPortal={handleBackToPortal} />
        </ErrorBoundary>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) {
    const g = window as any;
    if (!g.__REACT_ROOT__) {
        g.__REACT_ROOT__ = ReactDOM.createRoot(rootEl);
    }
    g.__REACT_ROOT__.render(<Root />);
}
