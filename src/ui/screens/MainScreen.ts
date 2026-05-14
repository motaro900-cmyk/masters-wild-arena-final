import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';

/**
 * MainScreen — Главное меню игры.
 * Переписано для поддержки адаптивной верстки.
 */
export class MainScreen extends PIXI.Container {
    private bg: PIXI.Sprite;
    private rays: PIXI.Graphics;
    private uiContainer: PIXI.Container;

    constructor() {
        super();
        this.label = 'MainScreen';
        
        // [Lead Architect]: Сначала создаем спрайт с пустой текстурой, 
        // чтобы он сразу был в дереве объектов.
        this.bg = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.bg.anchor.set(0.5);
        this.bg.width = 1920;
        this.bg.height = 1080;
        this.bg.position.set(1920 / 2, 1080 / 2);
        
        this.rays = new PIXI.Graphics();
        this.uiContainer = new PIXI.Container();
        
        this.addChild(this.bg, this.rays, this.uiContainer);

        console.log('[MainScreen] Constructor called, starting init...');
        this.init();
    }

    private async init() {
        try {
            // [Lead Architect]: High-res background is already preloaded in index.html 
            // and displayed as a placeholder in main.tsx (React). 
            // We just need to load it into PixiJS textures now.
            console.log('[MainScreen] Loading high-res background:', AssetsMap.BACKGROUNDS.MAIN_MENU);
            
            // 2. Load High-Res background
            const bgAsset = await PIXI.Assets.load(AssetsMap.BACKGROUNDS.MAIN_MENU);
            const bgTex = bgAsset instanceof PIXI.Texture ? bgAsset : null;
            if (!bgTex) {
                throw new Error('Invalid background texture loaded');
            }
            
            console.log('[MainScreen] Background loaded successfully:', bgTex.width, 'x', bgTex.height);
            
            this.bg.texture = bgTex;
            this.bg.width = 1920;
            this.bg.height = 1080;
            
            // Плавное появление (только если до этого был пустой фон или мобильный был слишком прозрачным)
            const startAlpha = this.bg.alpha;
            this.bg.alpha = startAlpha; 
            
            const fadeIn = () => {
                if (this.bg.alpha < 1) {
                    this.bg.alpha += 0.05;
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
            
            this.render();
        } catch (e) {
            console.error('[MainScreen] Lobby assets loading error:', e);
            const fallback = new PIXI.Graphics()
                .rect(0, 0, 1920, 1080)
                .fill({ color: 0x0a0a1a });
            this.addChildAt(fallback, 0);
        }
    }

    private render() {
        const sw = 1920;
        const sh = 1080;

        console.log('[MainScreen] Rendering rays...');
        
        // Отрисовка лучей света
        this.rays.clear();
        for (let i = 0; i < 5; i++) {
            this.rays.poly([
                sw, 0,
                sw - 300 - i * 150, sh,
                sw - 600 - i * 150, sh
            ]).fill({ color: 0xfff3c7, alpha: 0.03 + i * 0.01 });
        }
    }

    public destroy(options?: any) {
        console.log('[MainScreen] Destroying...');
        super.destroy(options);
    }
}
