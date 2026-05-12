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
        
        // [Anti-Grey] Умное разрешение путей (Smart Resolver)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const optimizedManifest = manifest.map(path => {
            // 1. Заменяем .png/.jpg на .webp
            let newPath = path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            
            // 2. Если это фон и мы на мобилке — добавляем суффикс _mobile
            if (isMobile && (newPath.includes('backgrounds') || newPath.includes('Shop.webp') || newPath.includes('Shoping.webp'))) {
                newPath = newPath.replace('.webp', '_mobile.webp');
            }
            return newPath;
        });

        console.log(`[AssetLoader] Loading ${optimizedManifest.length} optimized assets...`);
        try {
            if (!(PIXI.Assets as any)._initialized) {
                await PIXI.Assets.init({
                    preferences: {
                        preferWorkers: true,
                        preferCreateImageBitmap: true,
                    }
                });
            }

            await PIXI.Assets.load(optimizedManifest);
            console.log('✅ [AssetLoader] Assets loaded successfully');
        } catch (error) {
            console.error('❌ [AssetLoader] Failed to load assets:', error);
            // Fallback: пробуем загрузить оригиналы если оптимизированные не нашлись
            await PIXI.Assets.load(manifest);
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
