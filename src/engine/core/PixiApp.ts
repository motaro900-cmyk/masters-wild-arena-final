import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { AppConfig } from '@/configs/AppConfig';
import { useGameStore } from '../../store/useGameStore';
import { fetchCompatibilityRules, checkWebGPUDisabled, getNextRetryVersion } from '../../configs/GraphicsCompatibility';
import { getDeviceProfile, updateActiveRenderer } from '../../services/TelemetryService';

function isVersionLessThan(v1: string, v2: string): boolean {
    const parts1 = v1.split('.').map((p) => parseInt(p, 10));
    const parts2 = v2.split('.').map((p) => parseInt(p, 10));
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return true;
        if (p1 > p2) return false;
    }
    return false;
}

gsap.registerPlugin(PixiPlugin);
PixiPlugin.convertToPixi = (_object: any, _prop: string, value: string | number) => {
    return new PIXI.Point(parseFloat(value as string), parseFloat(value as string));
};

export enum ResolutionType {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
}

export interface IPixiAppConfig {
    width?: number;
    height?: number;
    resolution?: ResolutionType;
    background?: string | number;
    antialias?: boolean;
    powerPreference?: 'high-performance' | 'low-power' | 'default';
}

/**
 * PixiApp — Singleton для управления PixiJS приложением.
 */
export class PixiApp {
    private static instance: PixiApp | null = null;
    public static canvas: HTMLCanvasElement | null = null;

    private pixiApp: PIXI.Application | null = null;
    private config: Required<IPixiAppConfig>;
    private updateLoops: Array<(dt: number) => void> = [];
    private screenShakeIntensity: number = 0;
    private screenShakeDamping: number = 0.9;

    private _backgroundLayer: PIXI.Container;
    private _gameLayer: PIXI.Container;
    private _effectsLayer: PIXI.Container;
    private _uiLayer: PIXI.Container;
    private _debugLayer: PIXI.Container;
    private homeContainer: HTMLElement | null = null;
    private storeUnsubscribe: (() => void) | null = null;

    private lastFpsUpdate: number = 0;
    private fpsFrameCount: number = 0;
    private currentActualFps: number = 0;

    private constructor() {
        this._backgroundLayer = new PIXI.Container();
        this._gameLayer = new PIXI.Container();
        this._effectsLayer = new PIXI.Container();
        this._uiLayer = new PIXI.Container();
        this._debugLayer = new PIXI.Container();

        this.config = {
            width: AppConfig.GAME_WIDTH,
            height: AppConfig.GAME_HEIGHT,
            resolution: ResolutionType.MEDIUM,
            background: '#000000',
            antialias: true,
            powerPreference: 'high-performance',
        };

        if (typeof window !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                this.updateTickerState();
            });

            this.storeUnsubscribe = useGameStore.subscribe((state: any, prevState: any) => {
                this.updateTickerState();
                if (state && prevState && state.graphicsQuality !== prevState.graphicsQuality) {
                    this.applyQualityFilter(state.graphicsQuality);
                }
            });
        }
    }

    public updateTickerState(): void {
        if (!this.pixiApp || !this.pixiApp.ticker) return;

        const isHidden = typeof document !== 'undefined' && document.hidden;
        const activeScreen = useGameStore.getState().activeScreen;
        const needsRendering = activeScreen === 'BATTLE';

        if (isHidden || !needsRendering) {
            if (this.pixiApp.ticker.started) {
                console.log(`[PixiApp] Stopping Ticker rendering (Screen: ${activeScreen}, Hidden: ${isHidden})`);
                this.pixiApp.ticker.stop();
            }
        } else {
            if (!this.pixiApp.ticker.started) {
                console.log(`[PixiApp] Starting Ticker rendering (Screen: ${activeScreen})`);
                this.pixiApp.ticker.start();
            }
        }
    }

    public static getInstance(): PixiApp {
        if (typeof window !== 'undefined') {
            const globalApp = (window as any).__PIXI_APP_INSTANCE_SINGLETON__;
            if (globalApp) {
                return globalApp;
            }
            const instance = new PixiApp();
            (window as any).__PIXI_APP_INSTANCE_SINGLETON__ = instance;
            PixiApp.instance = instance;
            return instance;
        }
        if (!PixiApp.instance) PixiApp.instance = new PixiApp();
        return PixiApp.instance;
    }

    public async destroy(): Promise<void> {
        if (this.storeUnsubscribe) {
            try {
                this.storeUnsubscribe();
            } catch (e) {
                console.warn('Failed to unsubscribe useGameStore in PixiApp destroy:', e);
            }
            this.storeUnsubscribe = null;
        }

        try {
            useGameStore.setState({ currentFps: null });
        } catch (e) {
            // ignore
        }

        if (PixiApp.canvas) {
            try {
                PixiApp.canvas.removeEventListener('webglcontextlost', this.handleWebGLContextLost);
            } catch (e) {
                console.warn('Failed to remove webglcontextlost listener:', e);
            }
        }

        if (this.pixiApp) {
            console.log('[PixiApp] Destroying application...');
            this.updateLoops = [];
            // [Lead Architect]: texture: false is CRITICAL here to avoid
            // "Texture managed by Assets was destroyed instead of unloaded" warning.
            this.pixiApp.destroy(true, { children: true, texture: false });
            this.pixiApp = null;
            PixiApp.canvas = null;
            PixiApp.instance = null;
            if (typeof window !== 'undefined') {
                (window as any).__PIXI_APP_INSTANCE_SINGLETON__ = null;
            }
        }
    }

    public async init(config?: IPixiAppConfig, container?: HTMLElement): Promise<void> {
        try {
            if (container) {
                this.homeContainer = container;
            }
            // [Fix]: Если приложение уже есть, но контейнер сменился, переносим канвас
            if (this.pixiApp && container) {
                const canvas = this.pixiApp.canvas;
                if (canvas && canvas.parentElement !== container) {
                    if (!this.homeContainer) this.homeContainer = canvas.parentElement;
                    container.appendChild(canvas);
                    this.applyCanvasStyles(canvas);
                }
            }

            if (!this.pixiApp) {
                if (config) this.config = { ...this.config, ...config };

                const isIOS =
                    typeof navigator !== 'undefined' &&
                    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

                let preferWebGL1 = false;
                if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                    try {
                        const canvas = document.createElement('canvas');
                        const gl2 = canvas.getContext('webgl2');
                        if (!gl2) {
                            preferWebGL1 = true;
                            console.warn('⚠️ WebGL2 is not available. Will fallback to WebGL1.');
                        }
                    } catch (e) {
                        preferWebGL1 = true;
                    }
                }

                const isMobile =
                    useGameStore.getState().isMobile ||
                    isIOS ||
                    (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent));

                // Load compatibility rules dynamically in background (or reuse pre-fetched rules)
                fetchCompatibilityRules().catch(() => {});

                const state = useGameStore.getState();
                const rendererPref = state.rendererPreference || 'auto';

                let forceWebGL = false;
                const forceUntil = localStorage.getItem('forceWebGLUntilVersion');
                if (forceUntil) {
                    if (isVersionLessThan(AppConfig.VERSION, forceUntil)) {
                        forceWebGL = true;
                        console.log(
                            `[PixiApp] WebGPU is blocked via forceWebGLUntilVersion (${forceUntil} > current ${AppConfig.VERSION})`,
                        );
                    } else {
                        localStorage.removeItem('forceWebGLUntilVersion');
                        console.log(
                            `[PixiApp] forceWebGLUntilVersion (${forceUntil}) expired (current ${AppConfig.VERSION}). Retrying WebGPU.`,
                        );
                    }
                }

                const profile = await getDeviceProfile();
                const compatCheck = checkWebGPUDisabled(profile.gpuRenderer);
                if (compatCheck.disabled) {
                    console.log(
                        `[PixiApp] WebGPU disabled for blacklisted GPU: ${profile.gpuRenderer}. Reason: ${compatCheck.reason}`,
                    );
                }

                // Detect weak or integrated GPUs to cap max device resolution (prevents lag on weak laptops/PCs)
                let isWeakGPU = false;
                const gpuLower = (profile.gpuRenderer || '').toLowerCase();
                if (
                    gpuLower.includes('intel') ||
                    gpuLower.includes('uhd') ||
                    gpuLower.includes('hd graphics') ||
                    gpuLower.includes('amd radeon(tm) r') ||
                    gpuLower.includes('llvmpipe') ||
                    gpuLower.includes('swiftshader')
                ) {
                    isWeakGPU = true;
                    console.log(
                        `[PixiApp] Weak/Integrated GPU detected (${profile.gpuRenderer}). Capping resolution backing store.`,
                    );
                }

                const resolution = isMobile
                    ? 1
                    : isWeakGPU
                      ? Math.min(window.devicePixelRatio || 1, 1.25)
                      : this.config.resolution === ResolutionType.HIGH
                        ? Math.min(window.devicePixelRatio || 1, 3)
                        : this.config.resolution === ResolutionType.MEDIUM
                          ? Math.min(window.devicePixelRatio || 1, 2)
                          : 1;

                let preference: 'webgl' | 'webgpu' = 'webgl';
                if (rendererPref === 'webgpu') {
                    preference = 'webgpu';
                } else if (rendererPref === 'webgl') {
                    preference = 'webgl';
                } else {
                    // 'auto' mode
                    if (forceWebGL || compatCheck.disabled) {
                        preference = 'webgl';
                    } else {
                        // Default: WebGL on mobile, WebGPU on desktop
                        preference = isMobile ? 'webgl' : preferWebGL1 ? 'webgl' : 'webgpu';
                    }
                }

                console.log(`[PixiApp] Selected renderer preference: ${preference} (User pref: ${rendererPref})`);

                this.pixiApp = new PIXI.Application();

                try {
                    await this.pixiApp.init({
                        width: this.config.width,
                        height: this.config.height,
                        backgroundColor: 0x000000,
                        backgroundAlpha: 0, // Transparent — let CSS background show through
                        antialias: this.config.antialias,
                        resolution,
                        autoDensity: true,
                        preference,
                        webgl: preferWebGL1 ? { preferWebGLVersion: 1 as 1 | 2 } : undefined,
                        roundPixels: true,
                        powerPreference: isIOS
                            ? undefined
                            : this.config.powerPreference === 'default'
                              ? undefined
                              : (this.config.powerPreference as any),
                    });
                } catch (initError) {
                    if (preference === 'webgpu') {
                        console.error('❌ WebGPU PixiApp initialization failed, falling back to WebGL:', initError);

                        // Report crash to Sentry
                        import('@sentry/react').then((Sentry) => {
                            Sentry.captureException(initError, {
                                tags: {
                                    webgpu_crash: 'true',
                                    gpu_renderer: profile.gpuRenderer,
                                },
                            });
                        });

                        // Set forceWebGL until next minor/major version
                        const nextVersion = getNextRetryVersion(AppConfig.VERSION);
                        localStorage.setItem('forceWebGLUntilVersion', nextVersion);
                        console.log(`[PixiApp] Saved forceWebGLUntilVersion: ${nextVersion} to localStorage.`);

                        // Cleanup the failed app instance
                        try {
                            this.pixiApp.destroy(true, { children: true, texture: false });
                        } catch (destroyError) {
                            console.warn('[PixiApp] Failed to destroy partially initialized WebGPU app:', destroyError);
                        }

                        // Retry with webgl
                        preference = 'webgl';
                        this.pixiApp = new PIXI.Application();
                        await this.pixiApp.init({
                            width: this.config.width,
                            height: this.config.height,
                            backgroundColor: 0x000000,
                            backgroundAlpha: 0,
                            antialias: this.config.antialias,
                            resolution,
                            autoDensity: true,
                            preference,
                            webgl: preferWebGL1 ? { preferWebGLVersion: 1 as 1 | 2 } : undefined,
                            roundPixels: true,
                            powerPreference: isIOS
                                ? undefined
                                : this.config.powerPreference === 'default'
                                  ? undefined
                                  : (this.config.powerPreference as any),
                        });
                    } else {
                        throw initError;
                    }
                }

                // Override mapPositionToPoint to handle 90-degree clockwise CSS rotation in portrait mode on mobile
                if ((this.pixiApp.renderer as any).events) {
                    const events = (this.pixiApp.renderer as any).events;
                    const originalMapPositionToPoint = events.mapPositionToPoint;
                    events.mapPositionToPoint = (point: any, x: number, y: number) => {
                        const canvas = this.pixiApp?.canvas;
                        if (!canvas) return originalMapPositionToPoint.call(events, point, x, y);

                        const isPortraitMobile =
                            useGameStore.getState()?.isMobile && window.innerWidth < window.innerHeight;
                        if (isPortraitMobile) {
                            const rect = canvas.getBoundingClientRect();
                            const nx = rect.width > 0 ? (x - rect.left) / rect.width : 0;
                            const ny = rect.height > 0 ? (y - rect.top) / rect.height : 0;
                            point.x = ny * 1920;
                            point.y = (1 - nx) * 1080;
                            return point;
                        }
                        return originalMapPositionToPoint.call(events, point, x, y);
                    };
                }

                // Configure aggressive Texture GC for mobile to save VRAM and avoid crashes
                if (isIOS || (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent))) {
                    if (this.pixiApp.renderer && (this.pixiApp.renderer as any).textureGC) {
                        (this.pixiApp.renderer as any).textureGC.maxIdle = 1000; // GC textures idle for ~16s
                        (this.pixiApp.renderer as any).textureGC.checkCountMax = 300; // Check every 5s (300 frames)
                        console.log('[PixiApp] Configured aggressive texture GC for mobile');
                    }
                }

                (window as any).__PIXI_APP__ = this.pixiApp;
                PixiApp.canvas = this.pixiApp.canvas;

                // Log renderer type to Sentry tags for graphics telemetry
                try {
                    const actualRenderer = this.pixiApp.renderer.name || 'unknown';
                    console.log(`[PixiApp] Active renderer: ${actualRenderer}`);
                    updateActiveRenderer(actualRenderer);
                } catch (e) {
                    console.warn('Failed to tag selected_renderer in Sentry:', e);
                }

                if (PixiApp.canvas) {
                    PixiApp.canvas.addEventListener('webglcontextlost', this.handleWebGLContextLost);
                }

                this.pixiApp.ticker.add((ticker: PIXI.Ticker) => this.update(ticker));
            }

            if (container && this.pixiApp.canvas) {
                const canvas = this.pixiApp.canvas;
                this.applyCanvasStyles(canvas);

                if (canvas.parentElement !== container) {
                    container.appendChild(canvas);
                }
            }

            // Пересобираем сцену
            if (this.pixiApp) {
                this.pixiApp.stage.removeChildren();
                this.pixiApp.stage.addChild(
                    this._backgroundLayer,
                    this._gameLayer,
                    this._effectsLayer,
                    this._uiLayer,
                    this._debugLayer,
                );

                // CSS filter replaces PIXI filters for single-pass compositor performance
                if (this.pixiApp.canvas) {
                    this.applyCanvasStyles(this.pixiApp.canvas);
                }

                this.pixiApp.ticker.start();
                this.applyQualityFilter(useGameStore.getState().graphicsQuality || 'LOW');
                this.updateTickerState();
            }
        } catch (error) {
            console.error('❌ PixiApp initialization failed:', error);
            throw error;
        }
    }

    private applyCanvasStyles(canvas: HTMLCanvasElement): void {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';

        // [Architect]: Filter is now applied to the root wrapper in SafeGameLayout.tsx,
        // so we keep canvas filter clean to avoid double filtering.
        canvas.style.filter = 'none';
    }

    public returnToHomeContainer(): void {
        if (this.pixiApp && this.pixiApp.canvas && this.homeContainer) {
            if (this.pixiApp.canvas.parentElement !== this.homeContainer) {
                this.homeContainer.appendChild(this.pixiApp.canvas);
                this.applyCanvasStyles(this.pixiApp.canvas);
            }
        }
    }

    private update(ticker: PIXI.Ticker): void {
        try {
            if (!this.pixiApp?.canvas) return;

            // Measure FPS of the actual game loop
            this.fpsFrameCount++;
            const now = performance.now();
            if (this.lastFpsUpdate === 0) {
                this.lastFpsUpdate = now;
            }
            if (now - this.lastFpsUpdate >= 1000) {
                const elapsed = now - this.lastFpsUpdate;
                this.currentActualFps = Math.round((this.fpsFrameCount * 1000) / elapsed);
                this.fpsFrameCount = 0;
                this.lastFpsUpdate = now;

                // Sync the actual game loop FPS to our state store so UI can display it
                try {
                    useGameStore.setState({ currentFps: this.currentActualFps });
                } catch (e) {
                    // ignore
                }
            }

            // [Lead Architect]: Update loop for all registered systems
            for (const loop of this.updateLoops) {
                loop(ticker.deltaTime);
            }
            this.updateScreenShake();
            this.ySort(this.gameLayer);
        } catch (error) {
            console.error('❌ Update loop error:', error);
        }
    }

    private updateScreenShake(): void {
        if (this.screenShakeIntensity > 0.1) {
            const offsetX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
            const offsetY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
            this.gameLayer.position.x = offsetX;
            this.gameLayer.position.y = offsetY;
            this.screenShakeIntensity *= this.screenShakeDamping;
        } else {
            this.gameLayer.position.set(0, 0);
            this.screenShakeIntensity = 0;
        }
    }

    private ySort(container: PIXI.Container): void {
        if (container.children.length < 2) return; // Пропускаем, если сортировать нечего

        if (!container.sortableChildren) {
            container.sortableChildren = true;
        }

        for (const child of container.children) {
            const y = (child.position?.y ?? 0) + ((child as any).height ?? 0);
            child.zIndex = Math.round(y);
        }
    }

    public addUpdateLoop(callback: (dt: number) => void): void {
        this.updateLoops.push(callback);
    }

    public removeUpdateLoop(callback: (dt: number) => void): void {
        const index = this.updateLoops.indexOf(callback);
        if (index > -1) this.updateLoops.splice(index, 1);
    }

    public screenShake(intensity: number = 5, damping: number = 0.95): void {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, Math.min(intensity, 100));
        this.screenShakeDamping = damping;
    }

    public applyQualityFilter(quality: string): void {
        if (!this.pixiApp) return;

        const normalizedQuality = (quality || 'LOW').toUpperCase();
        if (normalizedQuality === 'LOW' || normalizedQuality === 'HIGH') {
            this.pixiApp.stage.filters = [];
            return;
        }

        const filter = new PIXI.ColorMatrixFilter();

        switch (normalizedQuality) {
            case 'ULTRA':
                filter.contrast(0.04, false);
                filter.saturate(0.08, false);
                filter.brightness(0.97, false);
                break;
            case 'MEDIUM':
                filter.contrast(0.02, false);
                filter.saturate(0.03, false);
                filter.brightness(0.99, false);
                break;
            default:
                this.pixiApp.stage.filters = [];
                return;
        }

        this.pixiApp.stage.filters = [filter];
    }

    // ─── НОВЫЕ МЕТОДЫ УПРАВЛЕНИЯ РЕНДЕРИНГОМ ───
    public stopRendering(): void {
        if (this.pixiApp) this.pixiApp.stop();
    }

    public startRendering(): void {
        if (this.pixiApp) this.pixiApp.start();
    }

    public resize(): void {
        // [Lead Architect]: Динамический ресайз отключен.
        // Мы используем фиксированный 1920x1080 и CSS-масштабирование в SafeGameLayout.
        if (!this.pixiApp) return;
        this.pixiApp.renderer.resize(1920, 1080);
    }

    public setResolution(type: ResolutionType): void {
        if (!this.pixiApp) return;
        this.config.resolution = type;
        const isMobile =
            useGameStore.getState().isMobile ||
            (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent));
        const resolution = isMobile
            ? 1
            : type === ResolutionType.HIGH
              ? Math.min(window.devicePixelRatio || 1, 3)
              : type === ResolutionType.MEDIUM
                ? Math.min(window.devicePixelRatio || 1, 2)
                : 1;

        this.pixiApp.renderer.resolution = resolution;
        // Temporarily resize to force PixiJS to reallocate canvas buffers at new resolution, then restore 1920x1080
        this.pixiApp.renderer.resize(1919, 1079);
        this.pixiApp.renderer.resize(1920, 1080);

        // Update canvas filter styles immediately
        if (this.pixiApp.canvas) {
            this.applyCanvasStyles(this.pixiApp.canvas);
        }
    }

    public static getView(): HTMLCanvasElement | null {
        return PixiApp.canvas;
    }

    public getApp(): PIXI.Application | null {
        return this.pixiApp ?? null;
    }

    public get stage(): PIXI.Container {
        if (!this.pixiApp) throw new Error('PixiApp not initialized: stage accessed before init');
        return this.pixiApp.stage;
    }

    get backgroundLayer(): PIXI.Container {
        return this._backgroundLayer;
    }
    get gameLayer(): PIXI.Container {
        return this._gameLayer;
    }
    get effectsLayer(): PIXI.Container {
        return this._effectsLayer;
    }
    get uiLayer(): PIXI.Container {
        return this._uiLayer;
    }
    get debugLayer(): PIXI.Container {
        return this._debugLayer;
    }

    public clearBattleLayers(): void {
        const textureUsage = new Map<string, number>();

        const countSpriteTextures = (container: PIXI.Container) => {
            if (container instanceof PIXI.Sprite && container.texture) {
                const cacheIds: string[] = (container.texture as any).textureCacheIds || [];
                cacheIds.forEach((id: string) => {
                    textureUsage.set(id, (textureUsage.get(id) || 0) + 1);
                });
            }
            if (container.children) {
                container.children.forEach(countSpriteTextures);
            }
        };

        [this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach(countSpriteTextures);

        const destroyWithCheck = (container: PIXI.Container) => {
            if (container.children && container.children.length > 0) {
                const childrenCopy = [...container.children];
                childrenCopy.forEach(destroyWithCheck);
            }

            if (container instanceof PIXI.Sprite && container.texture) {
                let shouldDestroyTex = false;
                const cacheIds: string[] = (container.texture as any).textureCacheIds || [];

                const isHeroOrUI = cacheIds.some(
                    (id: string) =>
                        id.includes('poses') ||
                        id.includes('background') ||
                        id.includes('ui/') ||
                        id.includes('hud/') ||
                        id.includes('avatar'),
                );

                if (!isHeroOrUI) {
                    const isDynamic = cacheIds.some(
                        (id: string) =>
                            id.includes('weapons') ||
                            id.includes('items') ||
                            id.includes('effects') ||
                            id.includes('particles') ||
                            id.includes('combat') ||
                            id.includes('smoke') ||
                            id.includes('spark') ||
                            id.includes('dust') ||
                            id.includes('monster') ||
                            id.includes('enemy'),
                    );

                    if (isDynamic) {
                        const maxRefs = Math.max(...cacheIds.map((id: string) => textureUsage.get(id) || 0));
                        if (maxRefs <= 1) {
                            shouldDestroyTex = true;
                        }
                    }
                }

                cacheIds.forEach((id: string) => {
                    const count = textureUsage.get(id) || 0;
                    if (count > 0) {
                        textureUsage.set(id, count - 1);
                    }
                });

                if (!container.destroyed) {
                    container.destroy({ children: true, texture: shouldDestroyTex });
                }
            } else {
                if (!container.destroyed) {
                    container.destroy({ children: true, texture: false });
                }
            }
        };

        [this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach((l) => {
            l.removeChildren().forEach((child) => {
                destroyWithCheck(child);
            });
        });

        this.updateLoops = [];

        // Выгружаем специфичные для боя ассеты из кэша PIXI
        try {
            PIXI.Assets.unload('battle-specific-assets');
        } catch (e) {
            console.warn('Could not unload battle-specific-assets:', e);
        }
    }

    /** Полная очистка всех слоёв включая фон (используется только при переинициализации) */
    public clearAllLayers(): void {
        const textureUsage = new Map<string, number>();

        const countSpriteTextures = (container: PIXI.Container) => {
            if (container instanceof PIXI.Sprite && container.texture) {
                const cacheIds: string[] = (container.texture as any).textureCacheIds || [];
                cacheIds.forEach((id: string) => {
                    textureUsage.set(id, (textureUsage.get(id) || 0) + 1);
                });
            }
            if (container.children) {
                container.children.forEach(countSpriteTextures);
            }
        };

        [this.backgroundLayer, this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach(
            countSpriteTextures,
        );

        const destroyWithCheck = (container: PIXI.Container) => {
            if (container.children && container.children.length > 0) {
                const childrenCopy = [...container.children];
                childrenCopy.forEach(destroyWithCheck);
            }

            if (container instanceof PIXI.Sprite && container.texture) {
                let shouldDestroyTex = false;
                const cacheIds: string[] = (container.texture as any).textureCacheIds || [];

                const isHeroOrUI = cacheIds.some(
                    (id: string) =>
                        id.includes('poses') ||
                        id.includes('background') ||
                        id.includes('ui/') ||
                        id.includes('hud/') ||
                        id.includes('avatar'),
                );

                if (!isHeroOrUI) {
                    const isDynamic = cacheIds.some(
                        (id: string) =>
                            id.includes('weapons') ||
                            id.includes('items') ||
                            id.includes('effects') ||
                            id.includes('particles') ||
                            id.includes('combat') ||
                            id.includes('smoke') ||
                            id.includes('spark') ||
                            id.includes('dust') ||
                            id.includes('monster') ||
                            id.includes('enemy'),
                    );

                    if (isDynamic) {
                        const maxRefs = Math.max(...cacheIds.map((id: string) => textureUsage.get(id) || 0));
                        if (maxRefs <= 1) {
                            shouldDestroyTex = true;
                        }
                    }
                }

                cacheIds.forEach((id: string) => {
                    const count = textureUsage.get(id) || 0;
                    if (count > 0) {
                        textureUsage.set(id, count - 1);
                    }
                });

                if (!container.destroyed) {
                    container.destroy({ children: true, texture: shouldDestroyTex });
                }
            } else {
                if (!container.destroyed) {
                    container.destroy({ children: true, texture: false });
                }
            }
        };

        [this.backgroundLayer, this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach((l) => {
            l.removeChildren().forEach((child) => {
                destroyWithCheck(child);
            });
        });

        this.updateLoops = [];

        // Force rendering a blank/cleared frame to immediately update canvas
        if (this.pixiApp) {
            try {
                this.pixiApp.render();
            } catch (e) {
                console.warn('[PixiApp] Render failure on clearAllLayers:', e);
            }
        }
    }

    public static destroy(): void {
        const instance = PixiApp.instance;
        if (instance) {
            instance.destroy();
        }
    }

    private handleWebGLContextLost = async (event: Event) => {
        event.preventDefault();
        console.warn('⚠️ WebGL context lost detected! Attempting recovery...');

        // 1. Show full-screen dark blurred glassmorphic overlay
        const overlay = document.createElement('div');
        overlay.id = 'webgl-context-lost-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 10, 12, 0.85)',
            backdropFilter: 'blur(10px)',
            webkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '999999',
            color: '#ffffff',
            fontFamily: "'Outfit', sans-serif",
            opacity: '0',
            transition: 'opacity 0.3s ease',
        });

        // Add spinner
        const spinner = document.createElement('div');
        Object.assign(spinner.style, {
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#ffe082',
            animation: 'spin-recover 1s linear infinite',
            marginBottom: '20px',
        });

        // CSS animation style
        const styleSheet = document.createElement('style');
        styleSheet.id = 'webgl-recovery-style';
        styleSheet.innerText = `
            @keyframes spin-recover {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleSheet);

        const text = document.createElement('div');
        const activeScreenText =
            useGameStore.getState().language === 'EN' ? 'Restarting graphics...' : 'Перезапуск графики...';
        text.innerText = activeScreenText;
        Object.assign(text.style, {
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textShadow: '0 0 10px rgba(255, 224, 130, 0.3)',
        });

        overlay.appendChild(spinner);
        overlay.appendChild(text);
        document.body.appendChild(overlay);

        // Fade in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        // 2. Wait 1 second (1000ms)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
            const container = this.homeContainer;
            const savedConfig = { ...this.config };

            // 3. Destroy old instance
            await this.destroy();

            // 4. Create new instance and initialize it
            const newApp = PixiApp.getInstance();
            if (container) {
                await newApp.init(savedConfig, container);
            } else {
                console.warn('[PixiApp] No container found to reinitialize PixiApp');
            }

            // 5. Reload active screen
            const activeScreen = useGameStore.getState().activeScreen;
            if (activeScreen === 'BATTLE') {
                // Toggle activeScreen: CITY -> BATTLE
                useGameStore.setState({ activeScreen: 'CITY' });
                setTimeout(() => {
                    useGameStore.setState({ activeScreen: 'BATTLE' });
                }, 100);
            } else {
                // Switch scene to MainScreen via SceneManager
                const [{ SceneManager }, { MainScreen }] = await Promise.all([
                    import('./SceneManager'),
                    import('../../ui/screens/MainScreen'),
                ]);
                SceneManager.getInstance().switchScene(new MainScreen());
            }
        } catch (err) {
            console.error('Failed to recover PixiApp after context loss:', err);
        } finally {
            // Remove overlay with fadeout
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                styleSheet.remove();
            }, 300);
        }
    };
}
