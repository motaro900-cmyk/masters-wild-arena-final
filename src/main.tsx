import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './ui/sprites.css';
import { GameApp } from './GameApp';
import { GameHUD } from './ui/components/GameHUD';
import { FpsCounter } from './ui/components/hud/FpsCounter';
import { AppConfig } from './configs/AppConfig';
import { useGameStore } from './store/useGameStore';
import { AnimatePresence } from 'framer-motion';
import { initVK, getVkUserInfo } from './utils/VKBridge';
import * as PIXI from 'pixi.js';
import { AssetsMap } from './configs/AssetsMap';
import { audioService } from './services/AudioService';
import { ITEMS_DATABASE } from './game/configs/ItemsConfig';
import { ItemBuilder } from './components/dev/ItemBuilder';
import { initTelemetry } from './services/TelemetryService';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { BannedOverlay } from './ui/components/BannedOverlay';
import { RotationWarningOverlay } from './ui/components/RotationWarningOverlay';
import { NotInVkScreen } from './ui/components/NotInVkScreen';
import { LoadingScreen } from './ui/components/LoadingScreen';
import { InitErrorScreen } from './ui/components/InitErrorScreen';

import { lazyWithRetry } from './utils/LazyWithRetry';

// Инициализация Sentry
initTelemetry();

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
PIXI.Assets.backgroundLoad([AssetsMap.BACKGROUNDS.MAIN_MENU]);

// [VK] Global Error Handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        if (e.message && (e.message.includes('ERR_CERT_DATE_INVALID') || e.message.includes('404'))) {
            console.warn('⚠️ Network/Cert error detected. Attempting recovery...');
        }
    });
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
            window.removeEventListener('pointerdown', handleFirstInteraction);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        window.addEventListener('keydown', handleKey);
        window.addEventListener('pointerdown', handleFirstInteraction);
        handleResize();

        // ─── Global energy regeneration timer ───────────────────────────────
        const energyTimer = setInterval(() => {
            const s = useGameStore.getState();
            if (typeof s.regenerateEnergy === 'function') s.regenerateEnergy();
            if (typeof s.resetDailyCounters === 'function') s.resetDailyCounters();
        }, 10_000);

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
            <BannedOverlay />

            {/* 🔄 Screen Rotation Warning Overlay */}
            <RotationWarningOverlay
                isPortrait={isPortrait}
                isMobile={isMobile}
                onDismiss={() => setDismissedRotationWarning(true)}
            />

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
let refreshInterval: any = null;

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
        let unsubLeaderboard: (() => void) | null = null;

        const initApp = async () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
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

                // 2. Load Player Data from Firebase
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

                const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
                console.log('🔍 Checking Firebase profile for:', userId);
                try {
                    const fbProfile = await syncService.loadPlayerData(userId);
                    if (fbProfile) {
                        console.log('💾 Found remote profile, restoring state...', fbProfile.name);
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
                        console.log('🛠️ Localhost detected: Auto-logging in as \"Разработчик\"');
                        useGameStore.setState({
                            name: 'Разработчик',
                            onboardingCompleted: true,
                            activeScreen: 'MAIN_MENU',
                        });
                        syncService.syncPlayerData();
                    }
                }

                const updatedState = useGameStore.getState();

                // 3. Game Engine
                setLoadingText('Инициализация графического ядра Pixi...');
                console.log('🎮 Starting GameEngine...');
                const game = new GameApp();
                await game.init(containerRef.current!);

                clearTimeout(timeoutId);
                console.log('✅ Game Ready!');

                // 4. Audio & Sync Initialization
                if (updatedState.isMuted) {
                    audioService.setMusicVolume(0);
                    audioService.setSFXVolume(0);
                } else {
                    audioService.setMusicVolume(updatedState.musicVolume / 100);
                    audioService.setSFXVolume(updatedState.soundVolume / 100);
                }

                syncService.startAutoSync(60000);

                // Слушатель смены экранов
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
                unsubLeaderboard = syncService.subscribeToGlobalLeaders(10, (leaders) => {
                    useGameStore.getState().setLeaderboard(leaders);
                });
                const prefixedId = SyncService.getPrefixedUserId(updatedState.vkUser, updatedState.playerId);
                unsubFriends = syncService.subscribeToFriendRequests(prefixedId, (requests) => {
                    useGameStore.getState().setFriendRequests(requests);
                });
                unsubMail = syncService.subscribeToMail(prefixedId, (mails) => {
                    useGameStore.getState().setMail(mails);
                });

                // Подписка на собственный профиль (admin commands: kick, ban, resources)
                let lastAppliedAdminVersion: number | null = null;
                unsubProfile = syncService.subscribeToOwnProfile(userId, (dbData) => {
                    if (!dbData) return;

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

                    if (dbData.status === 'KICKED') {
                        syncService.updateRemotePlayerData(userId, { status: 'OFFLINE' }).catch(() => {});
                        alert('Соединение разорвано: Вы были отключены администратором (KICKED).');
                        window.location.reload();
                        return;
                    }

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
                                'gold', 'crystals', 'level', 'rating', 'trophies',
                                'inventory', 'heroEquipment', 'ownedSkins', 'shards',
                                'ownedHeroes', 'energy', 'maxEnergy',
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
                                console.log('[SyncService] Admin updated player state, applying changes:', updatePayload);
                                useGameStore.setState(updatePayload);
                            }
                        } catch (e) {
                            console.error('[SyncService] Error parsing own profile JSON update:', e);
                        }
                    }
                });

                // Приветственные сообщения (только первый вход)
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

                if (!updatedState.onboardingCompleted) {
                    console.log('👶 New player or Onboarding not completed, forcing tutorial...');
                    if (!updatedState.name || updatedState.name === 'Мастер') {
                        useGameStore.setState({ activeScreen: 'INTRO' });
                    }
                }

                const finalState = useGameStore.getState();
                if (finalState.checkPetDailyReward) {
                    finalState.checkPetDailyReward();
                }

                if (!finalState.dailyQuests || finalState.dailyQuests.length === 0) {

                    finalState.refreshDailyQuests();
                }
                if (!finalState.weeklyQuests || finalState.weeklyQuests.length === 0) {
                    finalState.refreshWeeklyQuests();
                } else {
                    const lastReset = finalState.lastWeeklyQuestReset || 0;
                    const now = Date.now();
                    const msInWeek = 7 * 24 * 60 * 60 * 1000;
                    if (now - lastReset >= msInWeek) {
                        finalState.refreshWeeklyQuests();
                    }
                }

                finalState.updateQuestProgress('LOGIN', 1);

                // Очистка тестовых сообщений
                if (state.messages.some((m: any) => m.author === 'Мастер' && m.text === 'Привет')) {
                    useGameStore.setState({
                        messages: state.messages.filter((m: any) => !(m.author === 'Мастер' && m.text === 'Привет')),
                    });
                }

                // ─── ОБРАБОТКА ПАРАМЕТРОВ ЗАПУСКА (РЕФЕРАЛЫ, ПОДАРКИ) ───
                const urlParams = new URLSearchParams(window.location.search);
                const requestId = urlParams.get('request_id');
                if (requestId) {
                    console.log('🎁 Game launched via Request Link:', requestId);
                    setTimeout(() => {
                        useGameStore.getState().addGold(5000);
                        alert('Вы получили подарок от друга: 5,000 золота! 💰');
                    }, 3000);
                }

                // [Optimization] Background refresh check every minute
                refreshInterval = setInterval(() => {
                    const currentState = useGameStore.getState();
                    if (isNewDayMSK(currentState.lastDailyRefresh)) {
                        console.log('🔄 MSK Midnight: Auto-refreshing daily quests...');
                        currentState.refreshDailyQuests();
                    }
                    if (currentState.checkPetDailyReward) {
                        currentState.checkPetDailyReward();
                    }
                    const lastReset = currentState.lastWeeklyQuestReset || 0;

                    const now = Date.now();
                    const msInWeek = 7 * 24 * 60 * 60 * 1000;
                    if (now - lastReset >= msInWeek) {
                        console.log('🔄 Auto-refreshing weekly quests...');
                        currentState.refreshWeeklyQuests();
                    }
                }, 60000);

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
            if (unsubLeaderboard) unsubLeaderboard();
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, []);

    if (notInVk) return <NotInVkScreen />;
    if (initError) return <InitErrorScreen error={initError} />;

    return (
        <ErrorBoundary>
            <SafeGameLayout containerRef={containerRef} />
            <LoadingScreen isLoading={isAppLoading} loadingText={loadingText} />
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
