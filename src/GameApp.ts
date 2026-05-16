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
        } catch (e) {
            console.warn('⚠️ Could not apply performance settings yet (engine not ready)');
        }
    }

    public destroy(): void {
        this.storeUnsubscribe?.();
        this.pixiApp.destroy();
    }
}

export default GameApp;
