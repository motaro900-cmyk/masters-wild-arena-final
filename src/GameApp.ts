import { PixiApp, ResolutionType, IPixiAppConfig } from './engine/core/PixiApp';
import { AssetLoader } from './engine/systems/AssetLoader';
import { EffectsManager } from './engine/systems/EffectsManager';
import { SceneManager } from './engine/core/SceneManager';
import { MainScreen } from './ui/screens/MainScreen';

export class GameApp {
    private pixiApp: PixiApp;
    private assetLoader: AssetLoader;
    
    constructor() {
        this.pixiApp = PixiApp.getInstance();
        this.assetLoader = AssetLoader.getInstance();
        EffectsManager.getInstance();
    }

    public async init(container?: HTMLElement): Promise<void> {
        try {
            console.log('🎮 Initializing Game Engine...');

            const config: IPixiAppConfig = {
                width: 1920,
                height: 1080,
                resolution: ResolutionType.MEDIUM,
                background: '#000000',
                antialias: true,
                powerPreference: 'high-performance'
            };

            await this.pixiApp.init(config, container);
            await this.loadAssets();

            const sceneManager = SceneManager.getInstance();
            sceneManager.switchScene(new MainScreen());

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

    public destroy(): void {
        this.pixiApp.destroy();
    }
}

export default GameApp;