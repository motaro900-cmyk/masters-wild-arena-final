import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './ui/sprites.css';
import { GameApp } from './GameApp';
import { useGameStore } from './store/useGameStore';
import { initTelemetry } from './services/TelemetryService';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { NotInVkScreen } from './ui/components/NotInVkScreen';
import { LoadingScreen } from './ui/components/LoadingScreen';
import { InitErrorScreen } from './ui/components/InitErrorScreen';
import { SafeGameLayout } from './ui/layouts/SafeGameLayout';

import { initFirebaseProfile } from './bootstrap/initFirebaseProfile';
import { initSubscriptions } from './bootstrap/initSubscriptions';
import { initGameSystems, setupReferralAndGifts } from './bootstrap/initGameSystems';

import { AssetsMap } from './configs/AssetsMap';
import { audioService } from './services/AudioService';
import { ITEMS_DATABASE } from './game/configs/ItemsConfig';
import { initVK, getVkUserInfo, isVkMiniApp } from './utils/VKBridge';

// Инициализируем флаги загрузки в хранилище перед запуском
useGameStore.setState({
    isVKReady: false,
    isFirebaseReady: false,
});

// Глобальный доступ для отладки
(window as any).audioService = audioService;
(window as any).AssetsMap = AssetsMap;
(window as any).ITEMS_DATABASE = ITEMS_DATABASE;
if (import.meta.env.DEV) {
    (window as any).useGameStore = useGameStore;
}


// [VK] Global Error Handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        if (e.message && (e.message.includes('ERR_CERT_DATE_INVALID') || e.message.includes('404'))) {
            console.warn('⚠️ Network/Cert error detected. Attempting recovery...');
        }
    });
}

let isAppInitialized = false;
let refreshInterval: any = null;

const UpdateModal: React.FC = () => {
    const [isReloading, setIsReloading] = React.useState(false);

    const handleReload = () => {
        setIsReloading(true);
        window.location.reload();
    };

    return (
        <div style={{
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
        }}>
            <div style={{
                width: '420px',
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
            }}>
                <div style={{
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
                }}>
                    <span style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🛡️</span>
                </div>

                <h2 style={{
                    margin: '0 0 12px 0',
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#FFE07D',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: "'Cinzel', serif",
                }}>
                    Обновление игры
                </h2>

                <p style={{
                    margin: '0 0 25px 0',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#b5a695',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
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
                        fontFamily: "'Cinzel', serif",
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
    const [initError, setInitError] = React.useState<string | null>(null);
    const [notInVk, setNotInVk] = React.useState(false);
    const [isAppLoading, setIsAppLoading] = React.useState(true);
    const [loadingText, setLoadingText] = React.useState('Инициализация приложения...');
    const [showUpdateModal, setShowUpdateModal] = React.useState(false);
    const isUpdatePendingRef = React.useRef(false);

    const checkUpdate = React.useCallback(async () => {
        try {
            const clientBuildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;
            if (clientBuildTime === 0) return;

            const res = await fetch('./version.json?t=' + Date.now());
            if (!res.ok) return;
            const data = await res.json();

            if (data && typeof data.buildTime === 'number' && data.buildTime > clientBuildTime) {
                console.log(`[Update Checker] New version detected on server: ${data.buildTime} (Client: ${clientBuildTime})`);
                const currentScreen = useGameStore.getState().activeScreen;
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
        const unsub = useGameStore.subscribe((state: any) => {
            if (isUpdatePendingRef.current && state.activeScreen !== 'BATTLE') {
                setShowUpdateModal(true);
            }
        });
        return unsub;
    }, []);

    // [VK Back Button] Intercept browser/mouse Back button to prevent frame exit
    React.useEffect(() => {
        const handleBrowserBack = (event: PopStateEvent) => {
            event.preventDefault();
            const currentScreen = useGameStore.getState().activeScreen;
            if (currentScreen !== 'CITY' && currentScreen !== 'INTRO' && currentScreen !== 'MAIN_MENU') {
                useGameStore.setState({ activeScreen: 'CITY' });
                // Re-push fake state to keep the loop intact for future Back button clicks
                window.history.pushState({ page: 'game' }, '');
            }
        };

        window.addEventListener('popstate', handleBrowserBack);
        // Initialize the first state
        window.history.pushState({ page: 'game' }, '');

        return () => {
            window.removeEventListener('popstate', handleBrowserBack);
        };
    }, []);

    React.useEffect(() => {
        if (isAppInitialized || !containerRef.current) return;
        isAppInitialized = true;

        let activeUnsubs: (() => void)[] = [];
        let isDestroyed = false;

        const initApp = async () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
            
            // Timeout: 90s for mobile, 60s for desktop
            const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const timeoutMs = isMobileDevice ? 90000 : 60000;

            const currentStepRef = { current: 'Инициализация...' };
            const setStepText = (text: string) => {
                currentStepRef.current = text;
                setLoadingText(text);
            };

            const timeoutId = setTimeout(() => {
                if (isAppLoading) {
                    console.error(`❌ Loading Timeout: App failed to initialize in ${timeoutMs / 1000}s. Last step: ${currentStepRef.current}`);
                    setInitError(
                        `Превышено время ожидания загрузки (последнее действие: ${currentStepRef.current}). Пожалуйста, проверьте интернет-соединение и попробуйте снова.`,
                    );
                }
            }, timeoutMs);

            let timeOffset = 0;
            try {
                console.log('🏁 Root: Initializing App...');
                
                // 1. VK Bridge initialization (the absolute first call, before Sentry / initTelemetry and any fetch)
                setStepText('Подключение к VK Bridge...');
                await initVK();

                // 2. Initialize Sentry telemetry immediately after VK init
                try {
                    initTelemetry();
                } catch (telemetryErr) {
                    console.error('Failed to initialize telemetry:', telemetryErr);
                }

                // Define early calibration and auth helper tasks
                const calibrateTime = async () => {
                    try {
                        const start = Date.now();
                        try {
                            // /api/time is a minimal endpoint that just returns { serverTime: ms }
                            // No VK params needed — unlike /api/verify-sign which expects vk_* params
                            const response = await fetch('/api/time', {
                                method: 'GET',
                                cache: 'no-cache',
                                signal: AbortSignal.timeout(3000),
                            });
                            if (response.ok) {
                                const data = await response.json();
                                if (data.serverTime) {
                                    const latency = (Date.now() - start) / 2;
                                    timeOffset = data.serverTime + latency - Date.now();
                                    console.log('🕒 Server time offset calibrated (ms):', timeOffset);
                                    const { TimeService } = await import('./utils/TimeService');
                                    TimeService.setOffset(timeOffset);
                                    return;
                                }
                            }
                        } catch {
                            // Silently ignore — will fallback to local clock
                        }
                        console.log('🕒 Using local device clock (server time unavailable)');
                    } catch {
                        // Silently ignore — timeOffset stays 0 (local clock)
                    }
                };

                const loadVkProfileAndVerify = async () => {
                    const isLocalhostEarly =
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.') ||
                        window.location.hostname.endsWith('.local') ||
                        window.location.protocol === 'file:';

                    if (!isLocalhostEarly) {
                        // 🔒 Verify signature
                        try {
                            const searchParams = window.location.search;
                            if (searchParams) {
                                const response = await fetch(`/api/verify-sign${searchParams}`);
                                if (!response.ok) {
                                    throw new Error(`Server returned status ${response.status}`);
                                }
                                const data = await response.json();
                                if (data && data.valid === false) {
                                    throw new Error('Invalid signature');
                                }
                            } else if (isVkMiniApp()) {
                                throw new Error('Launch parameters are missing');
                            }
                        } catch (err) {
                            console.error('🔒 Security verification failed:', err);
                            throw new Error(
                                'Ошибка безопасности: проверка подписи параметров запуска не удалась. Пожалуйста, перезапустите игру из официального приложения ВКонтакте.'
                            );
                        }

                        // Load VK profile
                        try {
                            const user = await getVkUserInfo();
                            if (user) {
                                const store = useGameStore.getState();
                                store.setVkUser(user);
                                if (user.photo200 || user.photo) {
                                    store.updateProfile({ avatar: user.photo200 || user.photo });
                                }
                                console.log('✅ VK User loaded:', user.firstName);
                            } else if (isVkMiniApp()) {
                                console.warn('🔄 VK User Info retry in 2s...');
                                await new Promise((r) => setTimeout(r, 2000));
                                const retryUser = await getVkUserInfo();
                                if (retryUser) {
                                    const store = useGameStore.getState();
                                    store.setVkUser(retryUser);
                                    if (retryUser.photo200 || retryUser.photo) {
                                        store.updateProfile({ avatar: retryUser.photo200 || retryUser.photo });
                                    }
                                    console.log('✅ VK User loaded (retry):', retryUser.firstName);
                                }
                            }
                        } catch (vkErr) {
                            console.warn('⚠️ VK Bridge user fetch failed, continuing in standalone mode', vkErr);
                        }
                    } else {
                        console.log('🛠️ Localhost detected — skipping signature verification and VK user loading');
                    }
                };

                // 3. Run calibration and VK profile fetching in parallel
                setStepText('Загрузка конфигурации и авторизация...');
                await Promise.all([
                    calibrateTime(),
                    loadVkProfileAndVerify()
                ]);

                // 4. Resolve prefixed userId
                const { SyncService } = await import('./services/SyncService');
                const state = useGameStore.getState();
                let playerId = state.playerId;
                if (!playerId || playerId === 'undefined' || playerId === 'null' || playerId === 'GUEST-undefined' || playerId.includes('undefined') || playerId.includes('null')) {
                    const guestId = `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    playerId = guestId;
                    useGameStore.setState({ playerId: guestId });
                }
                const userId = SyncService.getPrefixedUserId(state.vkUser, playerId);
                if (!userId || userId === 'GUEST-undefined' || userId.includes('undefined') || userId.includes('null')) {
                    console.error('[Assert] Invalid userId resolved:', userId);
                    const fallbackGuestId = `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    useGameStore.setState({ playerId: fallbackGuestId });
                    throw new Error('Assertion failed: userId is invalid/undefined');
                }

                // 5. Initialize Game Systems
                initGameSystems(timeOffset);

                // 6. Initialize Pixi engine
                setStepText('Инициализация графического ядра Pixi...');
                console.log('🎮 Starting GameEngine...');
                const game = new GameApp();
                await game.init(containerRef.current!);

                // 7. Hide Loading Screen (Stage 1 Complete)
                setIsAppLoading(false);
                clearTimeout(timeoutId);
                useGameStore.setState({ 
                    isVKReady: true,
                    profileStatus: 'loaded'
                });
                console.log('✅ Stage 1 complete! Main UI displayed.');

                // 8. Run Stage 2 in the background
                (async () => {
                    try {
                        console.log('🔄 Stage 2: Starting background Firebase loading...');
                        const profileRes = await initFirebaseProfile(timeoutId, setInitError, setNotInVk, setStepText);
                        if (!profileRes) {
                            console.warn('⚠️ Stage 2 aborted or failed.');
                            return;
                        }

                        const isLocalhost =
                            typeof window !== 'undefined' &&
                            (window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1' ||
                                window.location.hostname.startsWith('192.168.') ||
                                window.location.hostname.startsWith('10.') ||
                                window.location.hostname.endsWith('.local') ||
                                window.location.protocol === 'file:');

                        const currentState = useGameStore.getState();

                        if (isLocalhost) {
                            if (!currentState.name || currentState.name === 'Мастер') {
                                console.log('🛠️ Localhost detected: Auto-logging in as "Разработчик"');
                                useGameStore.setState({
                                    name: 'Разработчик',
                                    onboardingCompleted: true,
                                    activeScreen: 'MAIN_MENU',
                                });
                                const { syncService } = await import('./services/SyncService');
                                syncService.syncPlayerData();
                            }
                        }

                        // Check for pendingPurchase
                        if (typeof window !== 'undefined') {
                            const pendingRaw = localStorage.getItem('pendingPurchase');
                            if (pendingRaw) {
                                try {
                                    const pending = JSON.parse(pendingRaw);
                                    const amount = Number(pending.amount);
                                    const packId = pending.item;
                                    if (amount > 0 && packId) {
                                        console.log(`🔄 Found pending purchase: ${packId} (+${amount} crystals). Recovering...`);
                                        const store = useGameStore.getState();
                                        const { syncService: recoverySync } = await import('./services/SyncService');
                                        if (packId === 'starter_pack') {
                                            const now = Date.now();
                                            const currentEndTime = store.vipEndTime && store.vipEndTime > now ? store.vipEndTime : now;
                                            const newEndTime = currentEndTime + 3 * 24 * 60 * 60 * 1000;
                                            const premiumBonus = store.isPremium ? 15 : 0;
                                            const maxEnergy = 50 + Math.max(premiumBonus, 15);
                                            useGameStore.setState({
                                                crystals: (store.crystals || 0) + 200,
                                                vipLevel: 1,
                                                maxEnergy: maxEnergy,
                                                vipEndTime: newEndTime,
                                                hasBoughtStarterPack: true,
                                            });
                                            localStorage.setItem('vipEndTime', newEndTime.toString());
                                        } else {
                                            store.addCrystals(amount);
                                        }
                                        recoverySync.logPlayerAction(`Восстановлена покупка: ${packId} (+${amount} 💎)`);
                                        await recoverySync.syncPlayerData();
                                        localStorage.removeItem('pendingPurchase');
                                        console.log('✅ Pending purchase successfully recovered and synced.');
                                    }
                                } catch (e) {
                                    console.error('Failed to parse or recover pendingPurchase:', e);
                                }
                            }
                        }

                        const updatedState = useGameStore.getState();
                        if (updatedState.isMuted) {
                            audioService.setMusicVolume(0);
                            audioService.setSFXVolume(0);
                        } else {
                            audioService.setMusicVolume(updatedState.musicVolume / 100);
                            audioService.setSFXVolume(updatedState.soundVolume / 100);
                        }

                        const { syncService, SyncService } = await import('./services/SyncService');
                        syncService.startAutoSync(60000);

                        // Subscribe to screen changes for analytics logging
                        let lastScreen = useGameStore.getState().activeScreen;
                        const unsubScreenChange = useGameStore.subscribe((state: any) => {
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

                                // [VK Back Button] Push state to enable popstate interception on back button click
                                if (state.activeScreen !== 'INTRO' && state.activeScreen !== 'MAIN_MENU') {
                                    window.history.pushState({ page: 'game', screen: state.activeScreen }, '');
                                }
                            }
                        });
                        activeUnsubs.push(unsubScreenChange);

                        if (isDestroyed) return;

                        // Setup Live Subscriptions
                        const prefixedId = SyncService.getPrefixedUserId(updatedState.vkUser, updatedState.playerId);
                        const subRes = await initSubscriptions(userId, prefixedId);
                        activeUnsubs.push(subRes.unsubChat);
                        activeUnsubs.push(subRes.unsubLeaderboard);
                        activeUnsubs.push(subRes.unsubFriends);
                        activeUnsubs.push(subRes.unsubMail);
                        activeUnsubs.push(subRes.unsubPrivateChat);
                        activeUnsubs.push(subRes.unsubProfile);

                        // Setup referrals and claim gifts
                        setupReferralAndGifts();

                        // Midnight and quest polling timer
                        const MSK_OFFSET = 3 * 60 * 60 * 1000;
                        const DAY_MS = 24 * 60 * 60 * 1000;
                        const isNewDayMSK = (last: number) => {
                            const nowMSK = Date.now() + timeOffset + MSK_OFFSET;
                            const lastMSK = last + MSK_OFFSET;
                            return Math.floor(nowMSK / DAY_MS) > Math.floor(lastMSK / DAY_MS);
                        };

                        // === БАГ #3 FIX: Immediately check and refresh quests on login ===
                        // Don't wait for the 60s polling — check right away after profile loads
                        {
                            const stateAfterLoad = useGameStore.getState();
                            const hasEmptyDailyQuests = !stateAfterLoad.dailyQuests || stateAfterLoad.dailyQuests.length === 0;
                            const dayChangedSinceLastRefresh = isNewDayMSK(stateAfterLoad.lastDailyRefresh || 0);
                            if (hasEmptyDailyQuests || dayChangedSinceLastRefresh) {
                                console.log(`🔄 Login check: refreshing daily quests (empty=${hasEmptyDailyQuests}, newDay=${dayChangedSinceLastRefresh})`);
                                stateAfterLoad.refreshDailyQuests?.();
                            }
                            const lastWeeklyReset = stateAfterLoad.lastWeeklyQuestReset || 0;
                            const msInWeek = 7 * 24 * 60 * 60 * 1000;
                            const hasEmptyWeeklyQuests = !stateAfterLoad.weeklyQuests || stateAfterLoad.weeklyQuests.length === 0;
                            if (hasEmptyWeeklyQuests || (Date.now() + timeOffset - lastWeeklyReset >= msInWeek)) {
                                console.log(`🔄 Login check: refreshing weekly quests`);
                                stateAfterLoad.refreshWeeklyQuests?.();
                            }
                            stateAfterLoad.checkPetDailyReward?.();
                        }

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

                            const now = Date.now() + timeOffset;
                            const msInWeek = 7 * 24 * 60 * 60 * 1000;
                            if (now - lastReset >= msInWeek) {
                                console.log('🔄 Auto-refreshing weekly quests...');
                                currentState.refreshWeeklyQuests();
                            }
                        }, 60000);

                        // Set Firebase ready
                        useGameStore.setState({ isFirebaseReady: true });
                        console.log('✅ Stage 2 complete: Firebase profile successfully loaded.');
                    } catch (fbErr: any) {
                        console.error('❌ Stage 2 background sync failed:', fbErr);
                    }
                })();
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error('❌ Critical Init Error:', err);
                setInitError(err.message || 'Ошибка инициализации ядра игры');
            }
        };

        initApp();

        return () => {
            isDestroyed = true;
            activeUnsubs.forEach(unsub => unsub());
            if (refreshInterval) clearInterval(refreshInterval);
            import('./services/SyncService').then(({ syncService }) => {
                syncService.stopAutoSync();
            });
        };
    }, []);

    const isFirebaseReady = useGameStore((state: any) => state.isFirebaseReady);

    if (notInVk) return <NotInVkScreen />;
    if (initError) return <InitErrorScreen error={initError} />;

    return (
        <ErrorBoundary>
            <SafeGameLayout containerRef={containerRef} />
            <LoadingScreen isLoading={isAppLoading} loadingText={loadingText} />
            {!isFirebaseReady && !isAppLoading && (
                <div id="firebase-sync-spinner" style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgba(15, 12, 10, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    color: '#FFE07D',
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    pointerEvents: 'none'
                }}>
                    <div className="corner-spinner-circle" style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid rgba(245, 158, 11, 0.1)',
                        borderTopColor: '#FFE07D',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span>Синхронизация профиля...</span>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
            {showUpdateModal && <UpdateModal />}
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
