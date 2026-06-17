import { PixiApp, ResolutionType, IPixiAppConfig } from './engine/core/PixiApp';
import { AssetLoader } from './engine/systems/AssetLoader';
import { EffectsManager } from './engine/systems/EffectsManager';
import { useGameStore } from './store/useGameStore';
import { sendPerformanceReport } from './services/TelemetryService';

export class GameApp {
    private pixiApp: PixiApp;
    private assetLoader: AssetLoader;
    private storeUnsubscribe?: () => void;
    private fpsIntervalId?: any;

    private performanceSamples: number[] = [];
    private performanceStartTime: number = Date.now();
    private performanceReportSent = false;
    private performanceWatchdogChecked = false;
    private stressTestSamples: number[] = [];
    private isStressTestDone = false;

    constructor() {
        this.pixiApp = PixiApp.getInstance();
        this.assetLoader = AssetLoader.getInstance();
        EffectsManager.getInstance();
    }

    public async init(container?: HTMLElement): Promise<void> {
        try {
            console.log('🎮 Initializing Game Engine...');

            let state = useGameStore.getState();
            if (!state.hasCustomSettings) {
                const isMobile = state.isMobile;
                let autoGraphics = 'LOW';
                let autoPowerSaving = isMobile;
                let autoParticles = 'LOW';
                let autoGlow = true;

                if (isMobile) {
                    autoPowerSaving = true;
                    autoGraphics = 'LOW';
                    autoParticles = 'LOW';
                    autoGlow = false;
                } else {
                    const memory = typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory || 4) : 4;
                    if (memory >= 8) {
                        autoGraphics = 'ULTRA';
                        autoParticles = 'HIGH';
                        autoGlow = true;
                    } else if (memory >= 4) {
                        autoGraphics = 'MEDIUM';
                        autoParticles = 'HIGH';
                        autoGlow = true;
                    } else {
                        autoGraphics = 'LOW';
                        autoParticles = 'LOW';
                        autoGlow = false;
                    }
                }

                useGameStore.setState({
                    graphicsQuality: autoGraphics,
                    isPowerSaving: autoPowerSaving,
                    particlesQuality: autoParticles,
                    glowEnabled: autoGlow,
                });

                state = useGameStore.getState();
                console.log(`🤖 Auto-detected graphics for ${isMobile ? 'mobile' : 'desktop'} (memory: ${typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : 'unknown'}GB):`, {
                    graphicsQuality: autoGraphics,
                    isPowerSaving: autoPowerSaving,
                    particlesQuality: autoParticles,
                    glowEnabled: autoGlow
                });
            }

            const quality = state.graphicsQuality;

            const isIOS =
                typeof navigator !== 'undefined' &&
                (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

            const config: IPixiAppConfig = {
                width: 1920,
                height: 1080,
                resolution:
                    quality === 'ULTRA'
                        ? ResolutionType.HIGH
                        : quality === 'MEDIUM'
                          ? ResolutionType.MEDIUM
                          : ResolutionType.LOW,
                background: '#000000',
                antialias: quality !== 'LOW',
                powerPreference: isIOS ? 'default' : 'high-performance',
            };

            this.storeUnsubscribe = useGameStore.subscribe((state: any, prevState: any) => {
                if (state.graphicsQuality !== prevState.graphicsQuality) {
                    console.log('📈 Quality changed to:', state.graphicsQuality);
                    const quality = state.graphicsQuality;
                    const resType =
                        quality === 'ULTRA'
                            ? ResolutionType.HIGH
                            : quality === 'MEDIUM'
                              ? ResolutionType.MEDIUM
                              : ResolutionType.LOW;
                    this.pixiApp.setResolution(resType);
                }
                if (state.isPowerSaving !== prevState.isPowerSaving || state.fpsCap !== prevState.fpsCap) {
                    this.applyPerformanceSettings(state.isPowerSaving, state.isMobile);
                }
                if (state.level !== prevState.level) {
                    this.loadItemSpritesForLevel(state.level);
                }
                if (state.activeScreen !== prevState.activeScreen) {
                    this.handleScreenTicker(state.activeScreen);
                }
            });

            await this.pixiApp.init(config, container);
            this.applyPerformanceSettings(state.isPowerSaving, state.isMobile);
            this.handleScreenTicker(state.activeScreen);
            await this.loadAssets();

            // Dynamically import engine-only modules so Vite can code-split them
            // into a separate chunk instead of forcing them into the main vendor bundle.
            // Previously, static imports here prevented Rollup from splitting
            // SceneManager and MainScreen out of index-B_bxP53D.js (1.87 MB).
            const [{ SceneManager }, { MainScreen }] = await Promise.all([
                import('./engine/core/SceneManager'),
                import('./ui/screens/MainScreen'),
            ]);
            SceneManager.getInstance().switchScene(new MainScreen());

            // NOTE: startAutoSync вызывается только в main.tsx, убрано дублирование отсюда

            // Запускаем синхронизацию снимка игрока и оффлайн результатов
            try {
                const { playerSnapshotService } = await import('./services/PlayerSnapshotService');
                const summary = await playerSnapshotService.syncOnLogin();
                if (summary) {
                    console.log('📬 Loaded offline PvP defense summary:', summary);

                    const newMail = {
                        id: `offline_summary_${Date.now()}`,
                        tab: 'INBOX',
                        type: 'SYSTEM',
                        from: 'ВЕСТНИК АРЕНЫ',
                        subject: 'ОТЧЕТ О ЗАЩИТЕ АРЕНЫ',
                        body:
                            `Пока вас не было в игре, на вашего героя нападали другие игроки!\n\n` +
                            `⚔️ Всего нападений: ${summary.totalAttacks}\n` +
                            `✅ Успешная защита: ${summary.wins}\n` +
                            `❌ Поражение защитников: ${summary.losses}\n\n` +
                            `Итоговое изменение рейтинга: ${summary.totalCupsChange >= 0 ? '+' : ''}${summary.totalCupsChange} 🏆\n` +
                            `Получено золота за успешные бои: +${summary.totalGoldChange} 💰\n\n` +
                            `Детали боев:\n` +
                            summary.attacks
                                .map((a, idx) => {
                                    const icon = a.defenderResult === 'WIN' ? '✅' : '❌';
                                    const text = a.defenderResult === 'WIN' ? 'победил!' : 'проиграл.';
                                    const cups = a.cupsChange >= 0 ? `+${a.cupsChange}` : `${a.cupsChange}`;
                                    const gold = a.goldChange > 0 ? ` (+${a.goldChange} 💰)` : '';
                                    return `${idx + 1}. ${icon} ${a.attackerName} (${a.attackerRating} 🏆) — ваш герой ${text} (${cups} 🏆${gold})`;
                                })
                                .join('\n'),
                        date: 'СЕГОДНЯ',
                        isRead: false,
                        isStarred: false,
                    };

                    const currentMail = useGameStore.getState().mail || [];
                    useGameStore.setState({
                        mail: [newMail, ...currentMail],
                    });
                }
            } catch (err) {
                console.error('Failed to sync snapshot or offline results:', err);
            }

            console.log('✅ Game Engine Ready!');

            // Auto-degradation FPS monitor setup
            let fpsSamples: number[] = [];
            this.performanceStartTime = Date.now();
            this.performanceSamples = [];
            this.stressTestSamples = [];
            this.performanceReportSent = false;
            this.performanceWatchdogChecked = false;

            const isStressTestTested = localStorage.getItem('firstLaunchStressTested') === 'true';
            this.isStressTestDone = isStressTestTested;

            this.fpsIntervalId = setInterval(() => {
                try {
                    const app = this.pixiApp.getApp();
                    if (!app || !app.ticker || !app.ticker.started) {
                        fpsSamples = [];
                        return;
                    }

                    const currentFps = app.ticker.FPS;
                    fpsSamples.push(currentFps);
                    this.performanceSamples.push(currentFps);

                    // 1. Stress test in first 10 seconds of first launch
                    if (!this.isStressTestDone) {
                        this.stressTestSamples.push(currentFps);
                        if (this.stressTestSamples.length >= 10) {
                            this.isStressTestDone = true;
                            localStorage.setItem('firstLaunchStressTested', 'true');
                            
                            const avgStressFps = this.stressTestSamples.reduce((a, b) => a + b, 0) / this.stressTestSamples.length;
                            let autoGraphics = 'MEDIUM';
                            let autoParticles: 'LOW' | 'HIGH' = 'HIGH';
                            let autoGlow = true;
                            let autoArenaBg: 'LOW' | 'HIGH' = 'HIGH';

                            if (avgStressFps > 55) {
                                autoGraphics = 'ULTRA';
                                autoParticles = 'HIGH';
                                autoGlow = true;
                                autoArenaBg = 'HIGH';
                            } else if (avgStressFps >= 35) {
                                autoGraphics = 'MEDIUM';
                                autoParticles = 'HIGH';
                                autoGlow = true;
                                autoArenaBg = 'HIGH';
                            } else {
                                autoGraphics = 'LOW';
                                autoParticles = 'LOW';
                                autoGlow = false;
                                autoArenaBg = 'LOW';
                            }

                            console.log(`📊 First Launch Stress Test Result: Avg FPS: ${avgStressFps.toFixed(1)} -> Setting quality to ${autoGraphics}`);
                            useGameStore.setState({
                                graphicsQuality: autoGraphics,
                                particlesQuality: autoParticles,
                                glowEnabled: autoGlow,
                                arenaBgQuality: autoArenaBg
                            });
                        }
                    }

                    // 2. Sentry performance report after 45 seconds
                    const secondsElapsed = Math.floor((Date.now() - this.performanceStartTime) / 1000);
                    if (secondsElapsed >= 45 && !this.performanceReportSent) {
                        this.performanceReportSent = true;
                        
                        const avgFPS = Math.round(this.performanceSamples.reduce((a, b) => a + b, 0) / this.performanceSamples.length);
                        const minFPS = Math.round(Math.min(...this.performanceSamples));
                        
                        // Count frame drops (FPS < 40 in our case)
                        const frameDrops = this.performanceSamples.filter(fps => fps < 40).length;
                        
                        // Check memory pressure
                        let memoryPressure = false;
                        let memoryUsedMb = 0;
                        const perfMem = (window.performance as any)?.memory;
                        if (perfMem) {
                            memoryUsedMb = Math.round(perfMem.usedJSHeapSize / 1024 / 1024);
                            memoryPressure = (perfMem.usedJSHeapSize / perfMem.jsHeapSizeLimit) > 0.8;
                        }

                        sendPerformanceReport({
                            avgFPS,
                            minFPS,
                            frameDrops,
                            memoryPressure,
                            memoryUsedMb
                        });
                    }

                    // 3. Performance Watchdog at 60 seconds
                    if (secondsElapsed >= 60 && !this.performanceWatchdogChecked) {
                        this.performanceWatchdogChecked = true;
                        
                        const avgWatchdogFps = this.performanceSamples.reduce((a, b) => a + b, 0) / this.performanceSamples.length;
                        const state = useGameStore.getState();

                        if (!state.hasCustomSettings && avgWatchdogFps < 25) {
                            console.warn(`⚠️ Performance Watchdog: Avg FPS ${avgWatchdogFps.toFixed(1)} < 25 over first 60s. Forcing LOW quality.`);
                            
                            useGameStore.setState({
                                graphicsQuality: 'LOW',
                                particlesQuality: 'LOW',
                                glowEnabled: false,
                                arenaBgQuality: 'LOW'
                            });

                            const lang = state.language || 'RU';
                            const msg = lang === 'RU'
                                ? 'Производительность вашего устройства оказалась ниже ожидаемой. Настройки графики оптимизированы для плавности.'
                                : 'Your device performance is lower than expected. Graphics settings optimized for smoothness.';
                            state.showAlert(msg);
                        }
                    }

                    // 4. Continuous auto-degradation checks (every 5 seconds)
                    if (fpsSamples.length >= 5) {
                        const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
                        fpsSamples = [];

                        const state = useGameStore.getState();
                        if (!state.hasCustomSettings && avgFps < 24) {
                            const currentQuality = state.graphicsQuality;
                            let nextQuality: string | null = null;
                            if (currentQuality === 'ULTRA') {
                                nextQuality = 'MEDIUM';
                            } else if (currentQuality === 'MEDIUM') {
                                nextQuality = 'LOW';
                            }

                            if (nextQuality) {
                                console.log(`📉 Auto-degrading graphics quality from ${currentQuality} to ${nextQuality} due to low average FPS: ${avgFps.toFixed(1)}`);
                                useGameStore.setState({ graphicsQuality: nextQuality });

                                const lang = state.language || 'RU';
                                const msg = lang === 'RU'
                                    ? 'Качество графики снижено для стабильной работы'
                                    : 'Graphics quality lowered for stable performance';
                                state.showAlert(msg);
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Error in FPS auto-degradation monitor:', err);
                }
            }, 1000);
        } catch (error) {
            console.error('❌ Engine Initialization Error:', error);
            throw error;
        }
    }

    private loadedLevelRanges = new Set<string>();

    private async loadItemSpritesForLevel(playerLevel: number): Promise<void> {
        const rangesToLoad: string[] = ['1-20']; // Levels 1-20 are always loaded
        if (playerLevel >= 18) rangesToLoad.push('21-40');
        if (playerLevel >= 38) rangesToLoad.push('41-60');
        if (playerLevel >= 58) rangesToLoad.push('61-80');

        const newRanges = rangesToLoad.filter((r) => !this.loadedLevelRanges.has(r));
        if (newRanges.length === 0) return;

        // Fetch all item configurations
        const { ITEMS_DATABASE } = await import('./game/configs/items/index');
        const itemsToLoad: string[] = [];

        Object.values(ITEMS_DATABASE).forEach((item: any) => {
            if (!item.image) return;
            if (item.requiredLevel === undefined) return; // Skip items without a level (like skins/consumables) from preloading queue
            const lvl = item.requiredLevel;

            // Check if level matches the newly unlocked ranges
            const isMatch = newRanges.some((range) => {
                if (range === '1-20' && lvl <= 20) return true;
                if (range === '21-40' && lvl >= 21 && lvl <= 40) return true;
                if (range === '41-60' && lvl >= 41 && lvl <= 60) return true;
                if (range === '61-80' && lvl >= 61 && lvl <= 80) return true;
                return false;
            });

            if (isMatch) {
                itemsToLoad.push(item.image);
            }
        });

        if (itemsToLoad.length > 0) {
            console.log(`[GameApp] Preloading ${itemsToLoad.length} item sprites for ranges:`, newRanges);
            await this.assetLoader.loadAssets(itemsToLoad);
            newRanges.forEach((r) => this.loadedLevelRanges.add(r));
        }
    }

    private async loadAssets(): Promise<void> {
        const manifest = AssetLoader.createGameManifest();
        await this.assetLoader.loadAssets(manifest);

        // Lazy load item sprites based on current player level (non-blocking)
        const currentLevel = useGameStore.getState().level || 1;
        this.loadItemSpritesForLevel(currentLevel).catch((err) => {
            console.error('❌ Background item sprite preloading failed:', err);
        });

        // Background preload next-scene textures and arena assets
        try {
            this.assetLoader.startBackgroundPreload();
        } catch (err) {
            console.error('❌ Background general asset preloading failed:', err);
        }
    }

    private applyPerformanceSettings(isPowerSaving: boolean, isMobile: boolean = false): void {
        try {
            const app = this.pixiApp.getApp();
            if (app && app.ticker) {
                const storeState = useGameStore.getState();
                const storeCap = storeState.fpsCap || 60;
                // isPowerSaving forces cap to 30, otherwise use user's fpsCap setting
                const cap = isPowerSaving ? Math.min(30, storeCap) : storeCap;
                app.ticker.maxFPS = cap;
                console.log(
                    `🔋 Performance: ${isMobile ? 'Mobile' : 'Desktop'}, Power Saving: ${isPowerSaving ? 'ON' : 'OFF'}, Target Cap: ${storeCap} → maxFPS = ${cap}`,
                );
            }
        } catch {
            console.warn('⚠️ Could not apply performance settings yet (engine not ready)');
        }
    }

    private handleScreenTicker(_activeScreen: string): void {
        try {
            const app = this.pixiApp.getApp();
            if (!app || !app.ticker) return;

            // If the document is hidden, do not start the ticker to respect background execution rules
            if (typeof document !== 'undefined' && document.hidden) {
                return;
            }

            // Always keep the PixiJS ticker running to allow smooth transitions, background animations, particles,
            // and continuous, responsive FPS counter updates (e.g. capped at 30/60 FPS based on power saving mode).
            app.ticker.start();
        } catch {
            console.warn('⚠️ Could not handle screen ticker yet (engine not ready)');
        }
    }

    public destroy(): void {
        if (this.fpsIntervalId) {
            clearInterval(this.fpsIntervalId);
            this.fpsIntervalId = undefined;
        }
        this.storeUnsubscribe?.();
        this.pixiApp.destroy();
    }
}

export default GameApp;
