import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { AppConfig } from '@/configs/AppConfig';

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
    }

    public static getInstance(): PixiApp {
        if (!PixiApp.instance) PixiApp.instance = new PixiApp();
        return PixiApp.instance;
    }

    public async destroy(): Promise<void> {
        if (this.pixiApp) {
            console.log('[PixiApp] Destroying application...');
            // [Lead Architect]: texture: false is CRITICAL here to avoid
            // "Texture managed by Assets was destroyed instead of unloaded" warning.
            this.pixiApp.destroy(true, { children: true, texture: false });
            this.pixiApp = null;
            PixiApp.canvas = null;
            PixiApp.instance = null;
        }
    }

    public async init(config?: IPixiAppConfig, container?: HTMLElement): Promise<void> {
        try {
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

                this.pixiApp = new PIXI.Application();
                await this.pixiApp.init({
                    width: this.config.width,
                    height: this.config.height,
                    backgroundColor: 0x000000,
                    backgroundAlpha: 0,       // Transparent — let CSS background show through
                    antialias: this.config.antialias,
                    // Повышаем cap с 2 до 3 — экраны с DPR 2.5-3 (MacBook Pro, высокие мониторы)
                    // получают рендер в нативном разрешении
                    resolution: Math.min(window.devicePixelRatio || 1, 3),
                    autoDensity: true,
                    // Предпочитаем WebGPU — более чёткий рендер без WebGL сглаживания.
                    // Браузер автоматически fallback-ится на WebGL если WebGPU недоступен.
                    preference: 'webgpu',
                    // Отключаем субпиксельное смещение спрайтов — устраняет "пиксельный шум"
                    // на краях спрайтов при нецелых координатах
                    roundPixels: true,
                });

                (window as any).__PIXI_APP__ = this.pixiApp;
                PixiApp.canvas = this.pixiApp.canvas;

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
        // Фильтр убран с canvas — весь визуальный профиль
        // задаётся через .premium-saturated-panel на контейнере.
        // Так не дублируем насыщенность и избегаем offscreen blur.
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

    public static getView(): HTMLCanvasElement | null {
        return PixiApp.canvas;
    }

    public getApp(): PIXI.Application {
        if (!this.pixiApp) throw new Error('PixiApp not initialized');
        return this.pixiApp;
    }

    public get stage(): PIXI.Container {
        return this.getApp().stage;
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
        [this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach((l) => {
            const isEffects = l === this.effectsLayer;
            l.removeChildren().forEach((child) => {
                if (!child.destroyed) {
                    const isBattleSpecific = isEffects ||
                        child.name === 'mobs' ||
                        child.name === 'projectile' ||
                        child.name === 'battle_fx' ||
                        (child as any).isBattleSpecific === true ||
                        (child.constructor.name === 'HeroUnit' && (child as any).isMob === true);
                    child.destroy({ children: true, texture: isBattleSpecific });
                }
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
        [this.backgroundLayer, this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach((l) => {
            const isEffects = l === this.effectsLayer;
            l.removeChildren().forEach((child) => {
                if (!child.destroyed) {
                    const isBattleSpecific = isEffects ||
                        l === this.backgroundLayer ||
                        child.name === 'mobs' ||
                        child.name === 'projectile' ||
                        child.name === 'battle_fx' ||
                        (child as any).isBattleSpecific === true ||
                        (child.constructor.name === 'HeroUnit' && (child as any).isMob === true);
                    child.destroy({ children: true, texture: isBattleSpecific });
                }
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
}
