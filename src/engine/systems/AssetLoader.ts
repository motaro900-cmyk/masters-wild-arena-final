import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';
import { useGameStore } from '../../store/useGameStore';
import { resolveAssetPath } from '../../utils/assetPath';
import { preloadItemsAtlas } from '../../utils/itemAtlas';

function getOptimizedMobilePath(path: string): string {
    const lowerPath = path.toLowerCase();
    if (
        lowerPath.includes('_mobile.webp') ||
        lowerPath.includes('_mobile.png') ||
        lowerPath.includes('_mobile.jpg') ||
        lowerPath.includes('_mobile.jpeg')
    ) {
        return path;
    }
    if (lowerPath.endsWith('.webp')) {
        return path.substring(0, path.length - 5) + '_mobile.webp';
    }
    if (lowerPath.endsWith('.png') || lowerPath.endsWith('.jpg')) {
        return path.substring(0, path.length - 4) + '_mobile.webp';
    }
    if (lowerPath.endsWith('.jpeg')) {
        return path.substring(0, path.length - 5) + '_mobile.webp';
    }
    return path;
}

/**
 * AssetLoader — Системный загрузчик ресурсов.
 * Интегрирован с PIXI.Assets для кэширования и управления памятью.
 */
export class AssetLoader {
    private static instance: AssetLoader;
    private loadedPaths: Set<string> = new Set();

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
        const isMobile =
            !isUltra && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Предзагрузка JSON-атласа предметов (неблокирующая)
        preloadItemsAtlas();

        const optimizedManifest = manifest.map((path) => {
            const shouldKeepPng = false;

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
                    newPath.includes('images/ui/') ||
                    newPath.includes('frames/'))
            ) {
                newPath = getOptimizedMobilePath(newPath);
            }
            return newPath;
        });

        const assetsToLoad = optimizedManifest.filter((path) => !this.loadedPaths.has(path));
        if (assetsToLoad.length === 0) {
            console.log('[AssetLoader] All requested assets are already loaded. Skipping.');
            return;
        }

        console.log(`[AssetLoader] Loading ${assetsToLoad.length} optimized assets...`);
        try {
            if (!(PIXI.Assets as any)._initialized) {
                const isIOS =
                    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (typeof navigator !== 'undefined' &&
                        navigator.platform === 'MacIntel' &&
                        navigator.maxTouchPoints > 1);

                console.log(
                    `[AssetLoader] Initializing Pixi Assets. iOS detected: ${isIOS}. Setting preferences accordingly.`,
                );
                await PIXI.Assets.init({
                    preferences: {
                        preferWorkers: !isIOS,
                        preferCreateImageBitmap: !isIOS,
                    },
                });
                // [Optimization] Immediate background preload after safe initialization
                PIXI.Assets.backgroundLoad([AssetsMap.BACKGROUNDS.MAIN_MENU]);
            }

            // Load assets individually to prevent one failure from crashing the entire app
            const loadPromises = assetsToLoad.map(async (assetPath) => {
                try {
                    await PIXI.Assets.load(assetPath);
                    this.loadedPaths.add(assetPath);
                } catch (err) {
                    console.warn(
                        `[AssetLoader] Failed to load optimized asset: ${assetPath}. Cleaning cache and trying fallback...`,
                        err,
                    );

                    try {
                        // Clear the corrupted/partial load from Pixi's cache before retrying
                        await PIXI.Assets.unload(assetPath);
                    } catch (unloadErr) {
                        // Silent fail for unload, proceed to fallback
                    }

                    // Find corresponding original path in manifest
                    const idx = optimizedManifest.indexOf(assetPath);
                    const origPath = idx !== -1 ? manifest[idx] : assetPath;

                    // If the optimized path (usually WebP) failed, try to fallback to the PNG version
                    let pngFallbackPath = origPath;
                    if (origPath.endsWith('.webp')) {
                        pngFallbackPath = origPath.replace(/_mobile\.webp$/i, '.png').replace(/\.webp$/i, '.png');
                    }

                    try {
                        if (pngFallbackPath !== assetPath) {
                            await PIXI.Assets.load(pngFallbackPath);
                            this.loadedPaths.add(pngFallbackPath);
                            this.loadedPaths.add(assetPath); // Mark original as resolved to prevent duplicate fallbacks
                        } else {
                            throw new Error('Fallback path is identical to failed path');
                        }
                    } catch (fallbackErr) {
                        console.error(
                            `[AssetLoader] Critical: Failed to load fallback asset: ${origPath} (PNG fallback: ${pngFallbackPath})`,
                            fallbackErr,
                        );
                        try {
                            // Assign a safe default white texture to prevent crashes on usage
                            PIXI.Assets.cache.set(assetPath, PIXI.Texture.WHITE);
                            PIXI.Assets.cache.set(origPath, PIXI.Texture.WHITE);
                            if (pngFallbackPath !== origPath) {
                                PIXI.Assets.cache.set(pngFallbackPath, PIXI.Texture.WHITE);
                            }
                            this.loadedPaths.add(assetPath);
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
        ];
    }

    /**
     * Запускает фоновую предзагрузку тяжелых ресурсов (арены, фоны экранов, атласы персонажей).
     * Выполняется неблокирующим образом через PIXI.Assets.backgroundLoad.
     */
    public startBackgroundPreload(): void {
        try {
            const state = useGameStore.getState();
            const isUltra = state.graphicsQuality === 'ULTRA';
            const isMobile =
                !isUltra && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            const preloadList: string[] = [];

            // 1. Добавляем фоны экранов в зависимости от устройства
            if (isMobile) {
                preloadList.push(
                    AssetsMap.BACKGROUNDS.CITY_HUB_MOBILE,
                    AssetsMap.BACKGROUNDS.FORGE_MOBILE,
                    AssetsMap.BACKGROUNDS.RANKED_LOBBY_MOBILE,
                    AssetsMap.BACKGROUNDS.BATTLE_PASS_MOBILE,
                    AssetsMap.BACKGROUNDS.SANCTUARY_MOBILE,
                    AssetsMap.BACKGROUNDS.GACHA_MOBILE,
                );
                if (AssetsMap.BACKGROUNDS.BATTLE_ARENAS_MOBILE) {
                    preloadList.push(...AssetsMap.BACKGROUNDS.BATTLE_ARENAS_MOBILE);
                }
            } else {
                preloadList.push(
                    AssetsMap.BACKGROUNDS.CITY_HUB,
                    AssetsMap.BACKGROUNDS.FORGE,
                    AssetsMap.BACKGROUNDS.RANKED_LOBBY,
                    AssetsMap.BACKGROUNDS.BATTLE_PASS,
                    AssetsMap.BACKGROUNDS.SANCTUARY,
                    AssetsMap.BACKGROUNDS.GACHA,
                );
                if (AssetsMap.BACKGROUNDS.BATTLE_ARENAS) {
                    preloadList.push(...AssetsMap.BACKGROUNDS.BATTLE_ARENAS);
                }
            }

            // Добавляем общие фоны
            preloadList.push(AssetsMap.BACKGROUNDS.SHOP, AssetsMap.BACKGROUNDS.SHOP_NAV_BG);

            // 2. Персонажи и аватары
            preloadList.push(
                AssetsMap.CHARACTERS.PANDA_AVATAR,
                AssetsMap.CHARACTERS.MINOTAUR_AVATAR,
                AssetsMap.CHARACTERS.TIGER_WARRIOR_AVATAR,
                AssetsMap.CHARACTERS.LION_KNIGHT_AVATAR,
            );

            // Оптимизируем пути ассетов так же, как в loadAssets
            const optimizedList = preloadList
                .map((path) => {
                    if (!path) return '';
                    const normalized = path.replace(/\\/g, '/').toLowerCase();
                    const isHeroOrSkin =
                        normalized.includes('characters/') && !normalized.includes('characters/ancients/');
                    const isBoss = normalized.includes('ancient_treant') || normalized.includes('ancient_griffin');
                    const shouldKeepPng = isHeroOrSkin || isBoss;

                    let newPath = path;
                    if (!shouldKeepPng) {
                        newPath = path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                    }

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
                        newPath = getOptimizedMobilePath(newPath);
                    }
                    return newPath;
                })
                .filter(Boolean);

            console.log(`[AssetLoader] Background preloading queue initiated for ${optimizedList.length} assets.`);
            PIXI.Assets.backgroundLoad(optimizedList);
        } catch (err) {
            console.warn('[AssetLoader] Failed to start background preload:', err);
        }
    }

    /**
     * Предзагрузка боевых ассетов (изображения арен, героев и монстров) через кэш браузера.
     * Это предотвращает зависания WebGL/PixiJS и гарантирует мгновенную загрузку из кэша при старте боя.
     */
    public preloadBattleAssets(playerHeroId?: string, opponentHeroId?: string, isPve: boolean = false): void {
        try {
            const state = useGameStore.getState();
            const isUltra = state.graphicsQuality === 'ULTRA';
            const isMobile =
                !isUltra && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            const preloadList: string[] = [];

            // 1. Арены
            if (isMobile) {
                if (AssetsMap.BACKGROUNDS.BATTLE_ARENAS_MOBILE) {
                    preloadList.push(...AssetsMap.BACKGROUNDS.BATTLE_ARENAS_MOBILE);
                }
            } else {
                if (AssetsMap.BACKGROUNDS.BATTLE_ARENAS) {
                    preloadList.push(...AssetsMap.BACKGROUNDS.BATTLE_ARENAS);
                }
            }

            // 2. Изображения спрайтшитов только необходимых героев (оптимизация VRAM OOM)
            const heroPaths: Record<string, string[]> = {
                panda: [
                    '/assets/characters/panda/panda_poses.png',
                    '/assets/characters/panda/panda_frost_poses.png',
                ],
                raccoon: ['/assets/characters/raccoon/raccoon_poses.png'],
                minotaur: ['/assets/characters/minotaur/minotaur_poses.png'],
                tiger_warrior: ['/assets/characters/tiger_warrior/tiger_warrior_poses.png'],
                lion_knight: ['/assets/characters/lion_knight/lion_knight_poses.png'],
                wolf_knight: ['/assets/characters/raccoon/raccoon_poses.png'], // Фоллбек
                shadow_dancer: ['/assets/characters/panda/panda_poses.png'],
                crystal_guardian: ['/assets/characters/minotaur/minotaur_poses.png'],
                storm_caller: ['/assets/characters/raccoon/raccoon_poses.png'],
                nature_warden: ['/assets/characters/panda/panda_poses.png'],
                void_walker: ['/assets/characters/tiger_warrior/tiger_warrior_poses.png'],
            };

            const heroesToPreload = new Set<string>();
            heroesToPreload.add(playerHeroId || state.selectedHeroId || 'panda');

            if (opponentHeroId) {
                heroesToPreload.add(opponentHeroId);
            } else if (state.activeRankedOpponent?.selectedHeroId) {
                heroesToPreload.add(state.activeRankedOpponent.selectedHeroId);
            }

            heroesToPreload.forEach((heroId) => {
                const paths = heroPaths[heroId];
                if (paths) {
                    paths.forEach((p) => preloadList.push(resolveAssetPath(p)));
                } else {
                    preloadList.push(resolveAssetPath('/assets/characters/panda/panda_poses.png.png'));
                }
            });

            // 3. Мобы и боссы (только для PVE режима)
            if (isPve) {
                preloadList.push(
                    resolveAssetPath('/assets/characters/ancients/ancient_wolf.webp'),
                    resolveAssetPath('/assets/characters/ancients/ancient_golem.webp'),
                    resolveAssetPath('/assets/characters/ancients/ancient_panther.webp'),
                    resolveAssetPath('/assets/characters/ancients/ancient_treant.png'),
                    resolveAssetPath('/assets/characters/ancients/ancient_spider.webp'),
                    resolveAssetPath('/assets/characters/ancients/ancient_griffin.png'),
                );
            }

            // Оптимизируем пути ассетов так же, как в loadAssets
            const optimizedList = preloadList
                .map((path) => {
                    if (!path) return '';
                    const shouldKeepPng = false;

                    let newPath = path;
                    if (!shouldKeepPng) {
                        newPath = path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                    }

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
                        newPath = getOptimizedMobilePath(newPath);
                    }
                    return newPath;
                })
                .filter(Boolean);

            console.log(
                `[AssetLoader] Starting native browser preloading for ${optimizedList.length} combat assets...`,
            );
            optimizedList.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        } catch (err) {
            console.warn('[AssetLoader] Failed to start background battle preload:', err);
        }
    }
}
