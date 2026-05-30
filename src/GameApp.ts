import { PixiApp, ResolutionType, IPixiAppConfig } from './engine/core/PixiApp';
import { AssetLoader } from './engine/systems/AssetLoader';
import { EffectsManager } from './engine/systems/EffectsManager';
import { SceneManager } from './engine/core/SceneManager';
import { MainScreen } from './ui/screens/MainScreen';
import { useGameStore } from './store/useGameStore';
import { syncService } from './services/SyncService';

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

            const state = useGameStore.getState();
            const quality = state.graphicsQuality;

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
                powerPreference: 'high-performance',
            };

            this.storeUnsubscribe = useGameStore.subscribe((state: any, prevState: any) => {
                if (state.graphicsQuality !== prevState.graphicsQuality) {
                    console.log('📈 Quality changed to:', state.graphicsQuality);
                }
                if (state.isPowerSaving !== prevState.isPowerSaving) {
                    this.applyPerformanceSettings(state.isPowerSaving);
                }
            });

            await this.pixiApp.init(config, container);
            this.applyPerformanceSettings(state.isPowerSaving);
            await this.loadAssets();

            const sceneManager = SceneManager.getInstance();
            sceneManager.switchScene(new MainScreen());

            // Запускаем синхронизацию данных с Firebase
            syncService.startAutoSync();

            // Запускаем синхронизацию снимка игрока и оффлайн результатов
            (async () => {
                try {
                    const { playerSnapshotService } = await import('./services/PlayerSnapshotService');
                    const summary = await playerSnapshotService.syncOnLogin();
                    if (summary) {
                        console.log('📬 Loaded offline PvP defense summary:', summary);
                        
                        // 1. Сохраняем в стор для показа во всплывающем окне
                        useGameStore.setState({ offlineSummary: summary });

                        // 2. Создаем письмо во входящие почты
                        const newMail = {
                            id: `offline_summary_${Date.now()}`,
                            tab: 'INBOX',
                            type: 'SYSTEM',
                            from: 'ВЕСТНИК АРЕНЫ',
                            subject: 'ОТЧЕТ О ЗАЩИТЕ АРЕНЫ',
                            body: `Пока вас не было в игре, на вашего героя нападали другие игроки!\n\n` +
                                  `⚔️ Всего нападений: ${summary.totalAttacks}\n` +
                                  `✅ Успешная защита: ${summary.wins}\n` +
                                  `❌ Поражение защитников: ${summary.losses}\n\n` +
                                  `Итоговое изменение рейтинга: ${summary.totalCupsChange >= 0 ? '+' : ''}${summary.totalCupsChange} 🏆\n` +
                                  `Получено золота за успешные бои: +${summary.totalGoldChange} 💰\n\n` +
                                  `Детали боев:\n` +
                                  summary.attacks.map((a, idx) => {
                                      const icon = a.defenderResult === 'WIN' ? '✅' : '❌';
                                      const text = a.defenderResult === 'WIN' ? 'победил!' : 'проиграл.';
                                      const cups = a.cupsChange >= 0 ? `+${a.cupsChange}` : `${a.cupsChange}`;
                                      const gold = a.goldChange > 0 ? ` (+${a.goldChange} 💰)` : '';
                                      return `${idx + 1}. ${icon} ${a.attackerName} (${a.attackerRating} 🏆) — ваш герой ${text} (${cups} 🏆${gold})`;
                                  }).join('\n'),
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

    private async loadAssets(): Promise<void> {
        const manifest = AssetLoader.createGameManifest();
        await this.assetLoader.loadAssets(manifest);
    }

    private applyPerformanceSettings(isPowerSaving: boolean): void {
        try {
            const app = this.pixiApp.getApp();
            if (app && app.ticker) {
                // Если энергосбережение включено - лочим на 30 FPS, иначе - снимаем лимит (0)
                app.ticker.maxFPS = isPowerSaving ? 30 : 0;
                console.log(`🔋 Power Saving: ${isPowerSaving ? 'ON (30 FPS)' : 'OFF (Max FPS)'}`);
            }
        } catch {
            console.warn('⚠️ Could not apply performance settings yet (engine not ready)');
        }
    }

    public destroy(): void {
        this.storeUnsubscribe?.();
        this.pixiApp.destroy();
    }
}

export default GameApp;
