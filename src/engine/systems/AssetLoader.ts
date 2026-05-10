import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';

/**
 * AssetLoader — Системный загрузчик ресурсов.
 * Интегрирован с PIXI.Assets для кэширования и управления памятью.
 */
export class AssetLoader {
    private static instance: AssetLoader;

    private constructor() {}

    public static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    /**
     * Загружает список ассетов из манифеста.
     */
    public async loadAssets(manifest: string[]): Promise<void> {
        if (manifest.length === 0) return;
        
        console.log(`[AssetLoader] Loading ${manifest.length} assets...`);
        try {
            await PIXI.Assets.load(manifest);
            console.log('✅ [AssetLoader] Assets loaded successfully');
        } catch (error) {
            console.error('❌ [AssetLoader] Failed to load assets:', error);
        }
    }

    /**
     * Создает базовый манифест необходимых ресурсов.
     */
    public static createGameManifest(): string[] {
        return [
            AssetsMap.BACKGROUNDS.MAIN_MENU,
            AssetsMap.UI.SIDEBAR_LEFT,
            AssetsMap.UI.PANEL_PARCHMENT,
            AssetsMap.UI.BAR_GOLD,
            AssetsMap.UI.BAR_GEM,
            AssetsMap.UI.BAR_ENERGY,
            AssetsMap.UI.ICON_MAIL,
            AssetsMap.UI.ICON_DAILY_CHEST,
            AssetsMap.UI.PANEL_QUEST
        ];
    }
}
