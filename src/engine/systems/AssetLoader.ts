import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';
import { useGameStore } from '../../store/useGameStore';

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
        const state = useGameStore.getState();
        const isUltra = state.graphicsQuality === 'ULTRA';
        const isMobile = !isUltra && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const optimizedManifest = manifest.map((path) => {
            const normalized = path.replace(/\\/g, '/').toLowerCase();
            const isHeroOrSkin = normalized.includes('characters/') && !normalized.includes('characters/ancients/');
            const isBoss = normalized.includes('ancient_treant') || normalized.includes('ancient_griffin');
            const shouldKeepPng = isHeroOrSkin || isBoss;

            // 1. Заменяем .png/.jpg на .webp, кроме героев, скинов и боссов
            let newPath = path;
            if (!shouldKeepPng) {
                newPath = path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            }

            // 2. Если мы на мобилке — подставляем легкие мобильные версии _mobile.webp для фонов, предметов и персонажей
            if (
                isMobile &&
                (newPath.includes('backgrounds') ||
                    newPath.includes('Shop.webp') ||
                    newPath.includes('Shoping.webp') ||
                    newPath.includes('Shop.png') ||
                    newPath.includes('Shoping.png') ||
                    newPath.includes('images/items/') ||
                    newPath.includes('characters/') ||
                    newPath.includes('avatars/') ||
                    newPath.includes('frames/'))
            ) {
                if (newPath.endsWith('.webp')) {
                    newPath = newPath.replace('.webp', '_mobile.webp');
                } else if (newPath.endsWith('.png') || newPath.endsWith('.jpg') || newPath.endsWith('.jpeg')) {
                    newPath = newPath.replace(/\.(png|jpg|jpeg)$/i, '_mobile.webp');
                }
            }
            return newPath;
        });

        console.log(`[AssetLoader] Loading ${optimizedManifest.length} optimized assets...`);
        try {
            if (!(PIXI.Assets as any)._initialized) {
                const isIOS =
                    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

                console.log(`[AssetLoader] Initializing Pixi Assets. iOS detected: ${isIOS}. Setting preferences accordingly.`);
                await PIXI.Assets.init({
                    preferences: {
                        preferWorkers: !isIOS,
                        preferCreateImageBitmap: !isIOS,
                    },
                });
            }

            // Load assets individually to prevent one failure from crashing the entire app
            const loadPromises = optimizedManifest.map(async (assetPath, index) => {
                try {
                    await PIXI.Assets.load(assetPath);
                } catch (err) {
                    console.warn(`[AssetLoader] Failed to load optimized asset: ${assetPath}. Cleaning cache and trying fallback...`, err);
                    
                    try {
                        // Clear the corrupted/partial load from Pixi's cache before retrying
                        await PIXI.Assets.unload(assetPath);
                    } catch (unloadErr) {
                        // Silent fail for unload, proceed to fallback
                    }

                    const origPath = manifest[index];
                    // If the optimized path (usually WebP) failed, try to fallback to the PNG version
                    let pngFallbackPath = origPath;
                    if (origPath.endsWith('.webp')) {
                        pngFallbackPath = origPath.replace(/_mobile\.webp$/i, '.png').replace(/\.webp$/i, '.png');
                    }

                    try {
                        if (pngFallbackPath !== assetPath) {
                            await PIXI.Assets.load(pngFallbackPath);
                        } else {
                            throw new Error('Fallback path is identical to failed path');
                        }
                    } catch (fallbackErr) {
                        console.error(`[AssetLoader] Critical: Failed to load fallback asset: ${origPath} (PNG fallback: ${pngFallbackPath})`, fallbackErr);
                        try {
                            // Assign a safe default white texture to prevent crashes on usage
                            PIXI.Assets.cache.set(assetPath, PIXI.Texture.WHITE);
                            PIXI.Assets.cache.set(origPath, PIXI.Texture.WHITE);
                            if (pngFallbackPath !== origPath) {
                                PIXI.Assets.cache.set(pngFallbackPath, PIXI.Texture.WHITE);
                            }
                        } catch (cacheErr) {
                            // ignore cache errors
                        }
                    }
                }
            });
            await Promise.all(loadPromises);
            console.log('✅ [AssetLoader] Assets loading completed (all attempts finished)');
        } catch (error) {
            console.error('❌ [AssetLoader] Global load exception:', error);
        }
    }

    /**
     * Создает базовый манифест необходимых ресурсов.
     */
    public static createGameManifest(): string[] {
        return [
            AssetsMap.UI.SIDEBAR_LEFT,
            AssetsMap.UI.PANEL_PARCHMENT,
            AssetsMap.UI.BAR_GOLD,
            AssetsMap.UI.BAR_GEM,
            AssetsMap.UI.BAR_ENERGY,
            AssetsMap.UI.ICON_MAIL,
            AssetsMap.UI.ICON_DAILY_CHEST,
            AssetsMap.UI.PANEL_QUEST,
        ];
    }
}
