import { PixiApp, ResolutionType, IPixiAppConfig } from './engine/core/PixiApp';
import { AssetLoader } from './engine/systems/AssetLoader';
import { EffectsManager } from './engine/systems/EffectsManager';
import { useGameStore } from './store/useGameStore';

export class GameApp {
    private pixiApp: PixiApp;
    private assetLoader: AssetLoader;
    private storeUnsubscribe?: () => void;

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
                if (state.isPowerSaving !== prevState.isPowerSaving) {
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
            (async () => {
                try {
                    const { playerSnapshotService } = await import('./services/PlayerSnapshotService');
                    const summary = await playerSnapshotService.syncOnLogin();
                    if (summary) {
                        console.log('📬 Loaded offline PvP defense summary:', summary);

                        // 1. Сохраняем в стор для показа во всплывающем окне (Убрано по запросу: отчет теперь только в почте)
                        // useGameStore.setState({ offlineSummary: summary });

                        // 2. Создаем письмо во входящие почты
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
            })();

            console.log('✅ Game Engine Ready!');
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
    }

    private applyPerformanceSettings(isPowerSaving: boolean, isMobile: boolean = false): void {
        try {
            const app = this.pixiApp.getApp();
            if (app && app.ticker) {
                // Hard cap: PixiJS never renders above 60 FPS regardless of monitor Hz.
                // 180 FPS in PixiJS on mobile = guaranteed overheating.
                // isPowerSaving drops the cap to 30 FPS on any device.
                const cap = isPowerSaving ? 30 : 60;
                app.ticker.maxFPS = cap;
                console.log(
                    `🔋 Performance: ${isMobile ? 'Mobile' : 'Desktop'}, Power Saving: ${isPowerSaving ? 'ON' : 'OFF'} → maxFPS = ${cap}`,
                );
            }
        } catch {
            console.warn('⚠️ Could not apply performance settings yet (engine not ready)');
        }
    }

    private handleScreenTicker(activeScreen: string): void {
        try {
            const app = this.pixiApp.getApp();
            if (!app || !app.ticker) return;

            const staticScreens = ['MAIN_MENU', 'SHOP', 'HEROES', 'BATTLE_PASS', 'FORGE', 'SANCTUARY', 'INTRO', 'CITY'];

            if (staticScreens.includes(activeScreen)) {
                app.ticker.stop();
                console.log(`⏸️ Static screen detected: ${activeScreen}. Stopped Pixi Ticker.`);
            } else {
                app.ticker.start();
                console.log(`▶️ Animated screen detected: ${activeScreen}. Started Pixi Ticker.`);
            }
        } catch {
            console.warn('⚠️ Could not handle screen ticker yet (engine not ready)');
        }
    }

    public destroy(): void {
        this.storeUnsubscribe?.();
        this.pixiApp.destroy();
    }
}

export default GameApp;
