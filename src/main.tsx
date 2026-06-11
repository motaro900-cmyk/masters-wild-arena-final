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

import { initVKProfile } from './bootstrap/initVKProfile';
import { initFirebaseProfile } from './bootstrap/initFirebaseProfile';
import { initSubscriptions } from './bootstrap/initSubscriptions';
import { initGameSystems, setupReferralAndGifts } from './bootstrap/initGameSystems';

import * as PIXI from 'pixi.js';
import { AssetsMap } from './configs/AssetsMap';
import { audioService } from './services/AudioService';
import { ITEMS_DATABASE } from './game/configs/ItemsConfig';

// Инициализация Sentry
initTelemetry();

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

let isAppInitialized = false;
let refreshInterval: any = null;

export const Root = () => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [initError, setInitError] = React.useState<string | null>(null);
    const [notInVk, setNotInVk] = React.useState(false);
    const [isAppLoading, setIsAppLoading] = React.useState(true);
    const [loadingText, setLoadingText] = React.useState('Инициализация приложения...');

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
            
            // Timeout after 40s
            const timeoutId = setTimeout(() => {
                if (isAppLoading) {
                    console.error('❌ Loading Timeout: App failed to initialize in 40s');
                    setInitError(
                        'Превышено время ожидания загрузки. Пожалуйста, проверьте интернет-соединение и попробуйте снова.',
                    );
                }
            }, 40000);

            let timeOffset = 0;
            try {
                console.log('🏁 Root: Initializing App...');
                setLoadingText('Калибровка времени...');
                try {
                    const start = Date.now();
                    const response = await fetch(window.location.origin + window.location.pathname, {
                        method: 'HEAD',
                        cache: 'no-cache',
                    });
                    const serverDateStr = response.headers.get('date');
                    if (serverDateStr) {
                        const serverTime = new Date(serverDateStr).getTime();
                        const latency = (Date.now() - start) / 2;
                        timeOffset = serverTime + latency - Date.now();
                        console.log('🕒 Secure server time offset calibrated (ms):', timeOffset);
                        const { TimeService } = await import('./utils/TimeService');
                        TimeService.setOffset(timeOffset);
                    }
                } catch (timeError) {
                    console.warn('Failed to fetch server time offset, using local device clock:', timeError);
                }

                // 1. VK Bridge initialization
                setLoadingText('Подключение к VK Bridge...');
                await initVKProfile();

                // 2. Firebase Profile initialization
                setLoadingText('Загрузка профиля игрока...');
                const profileRes = await initFirebaseProfile(timeoutId, setInitError, setNotInVk, setLoadingText);
                if (!profileRes) {
                    return; // Stopped early due to error/not-in-vk
                }

                const { userId } = profileRes;
                let state = useGameStore.getState();

                const isLocalhost =
                    typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.') ||
                        window.location.hostname.endsWith('.local') ||
                        window.location.protocol === 'file:');

                if (isLocalhost) {
                    if (!state.name || state.name === 'Мастер') {
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

                useGameStore.setState({ profileStatus: 'loaded' });

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

                // 3. Game Systems
                initGameSystems(timeOffset);

                // 4. Pixi engine
                setLoadingText('Инициализация графического ядра Pixi...');
                console.log('🎮 Starting GameEngine...');
                const game = new GameApp();
                await game.init(containerRef.current!);

                clearTimeout(timeoutId);
                console.log('✅ Game Ready!');

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

                // 5. Setup Live Subscriptions
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

                setIsAppLoading(false);
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
