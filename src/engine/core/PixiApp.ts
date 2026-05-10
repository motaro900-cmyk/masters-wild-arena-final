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
            powerPreference: 'high-performance'
        };
    }

    public static getInstance(): PixiApp {
        if (!PixiApp.instance) PixiApp.instance = new PixiApp();
        return PixiApp.instance;
    }

    public async init(config?: IPixiAppConfig, container?: HTMLElement): Promise<void> {
        try {
            if (this.pixiApp) {
                if (container && container !== this.pixiApp.canvas.parentElement && !(container instanceof HTMLCanvasElement)) {
                    container.appendChild(this.pixiApp.canvas as HTMLCanvasElement);
                }
                return;
            }

            if (config) this.config = { ...this.config, ...config };

            this.pixiApp = new PIXI.Application();
            await this.pixiApp.init({
                width: 1920,
                height: 1080,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                backgroundColor: 0x000000,
                antialias: true
            });
            PixiApp.canvas = this.pixiApp.canvas as HTMLCanvasElement;

            const canvas = this.pixiApp.canvas as HTMLCanvasElement;
            canvas.style.maxWidth = '100vw';
            canvas.style.maxHeight = '100vh';
            canvas.style.objectFit = 'contain';
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';

            if (container && !(container instanceof HTMLCanvasElement)) {
                container.appendChild(this.pixiApp.canvas as HTMLCanvasElement);
            }

            this.pixiApp.stage.addChild(
                this.backgroundLayer,
                this.gameLayer,
                this.effectsLayer,
                this.uiLayer,
                this.debugLayer
            );

            this.pixiApp.ticker.add((ticker: PIXI.Ticker) => this.update(ticker));
            
            console.log('✅ PixiApp initialized: Fixed 1920x1080 Mode Active');

        } catch (error) {
            console.error('❌ PixiApp initialization failed:', error);
            throw error;
        }
    }

    private update(ticker: PIXI.Ticker): void {
        try {
            if (!this.pixiApp?.canvas) return;
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
        
        container.children.sort((a, b) => {
                const aY = (a.position?.y ?? 0) + ((a as any).height ?? 0);
                const bY = (b.position?.y ?? 0) + ((b as any).height ?? 0);
                return aY - bY;
            });
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

    public get stage(): PIXI.Container { return this.getApp().stage; }

    get backgroundLayer(): PIXI.Container { return this._backgroundLayer; }
    get gameLayer(): PIXI.Container { return this._gameLayer; }
    get effectsLayer(): PIXI.Container { return this._effectsLayer; }
    get uiLayer(): PIXI.Container { return this._uiLayer; }
    get debugLayer(): PIXI.Container { return this._debugLayer; }

    public clearAllLayers(): void {
        [this.backgroundLayer, this.gameLayer, this.effectsLayer, this.uiLayer, this.debugLayer].forEach(l => {
            // [Lead Architect]: Используем { children: true } для полной очистки памяти и текстур
            l.removeChildren().forEach(child => child.destroy({ children: true, texture: true }));
        });
        this.updateLoops = [];
    }

    public destroy(): void {
        if (this.pixiApp) this.pixiApp.destroy(true, { children: true, texture: true });
        PixiApp.canvas = null;
        PixiApp.instance = null;
    }
}
