import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';

/**
 * MainScreen — Главное меню игры (PixiJS v8 compatible).
 */
export class MainScreen extends PIXI.Container {
    private bg: PIXI.Sprite;
    private rays: PIXI.Graphics;
    private uiContainer: PIXI.Container;

    constructor() {
        super();
        this.label = 'MainScreen';

        this.bg = new PIXI.Sprite();
        this.bg.anchor.set(0.5);
        this.bg.position.set(1920 / 2, 1080 / 2);

        this.rays = new PIXI.Graphics();
        this.uiContainer = new PIXI.Container();

        this.addChild(this.bg, this.rays, this.uiContainer);

        console.log('[MainScreen] Constructor called, starting init...');
        this.init();
    }

    private async init() {
        try {
            const isMobile =
                typeof navigator !== 'undefined' &&
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const bgPath = isMobile ? AssetsMap.BACKGROUNDS.MAIN_MENU_MOBILE : AssetsMap.BACKGROUNDS.MAIN_MENU;
            console.log('[MainScreen] Loading background:', bgPath);

            const bgAsset = await PIXI.Assets.load(bgPath);
            if (bgAsset && bgAsset instanceof PIXI.Texture) {
                this.bg.texture = bgAsset;
                try {
                    this.bg.width = 1920;
                    this.bg.height = 1080;
                } catch {
                    // Fallback scale if width setter issues
                    this.bg.scale.set(1920 / (bgAsset.width || 1920));
                }
            } else {
                throw new Error('Invalid background texture loaded');
            }

            console.log('[MainScreen] Background loaded successfully');
            this.render();
        } catch (e) {
            console.warn('[MainScreen] Lobby background fallback:', e);
            const fallback = new PIXI.Graphics().rect(0, 0, 1920, 1080).fill({ color: 0x0a0a1a });
            this.addChildAt(fallback, 0);
        }
    }

    private render() {
        const sw = 1920;
        const sh = 1080;

        this.rays.clear();
        for (let i = 0; i < 5; i++) {
            this.rays
                .poly([sw, 0, sw - 300 - i * 150, sh, sw - 600 - i * 150, sh])
                .fill({ color: 0xfff3c7, alpha: 0.03 + i * 0.01 });
        }
    }

    public destroy(options?: any) {
        console.log('[MainScreen] Destroying...');
        super.destroy(options);
    }
}
