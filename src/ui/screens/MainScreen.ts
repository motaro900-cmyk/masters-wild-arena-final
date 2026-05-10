import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';

/**
 * MainScreen — Главное меню игры.
 * Переписано для поддержки адаптивной верстки.
 */
export class MainScreen extends PIXI.Container {
    private bg: PIXI.Sprite | null = null;
    private rays: PIXI.Graphics;
    private uiContainer: PIXI.Container;

    constructor() {
        super();
        this.name = 'MainScreen';
        
        this.rays = new PIXI.Graphics();
        this.uiContainer = new PIXI.Container();
        this.addChild(this.rays, this.uiContainer);

        this.init();
    }

    private async init() {
        try {
            // ФОН
            const bgTex = await PIXI.Assets.load(AssetsMap.BACKGROUNDS.MAIN_MENU);
            this.bg = new PIXI.Sprite(bgTex);
            this.bg.anchor.set(0.5);
            
            // Cover-fit: масштабируем чтобы полностью заполнить 1920x1080
            const scaleX = 1920 / bgTex.width;
            const scaleY = 1080 / bgTex.height;
            const scale = Math.max(scaleX, scaleY);
            this.bg.scale.set(scale);
            this.bg.position.set(1920 / 2, 1080 / 2);
            
            this.addChildAt(this.bg, 0);
            this.render();
        } catch (e) {
            console.error('Lobby assets loading error', e);
            const fallbackBg = new PIXI.Graphics().rect(0, 0, 1920, 1080).fill(0x0a0a1a);
            this.addChildAt(fallbackBg, 0);
        }
    }

    private render() {
        const sw = 1920;
        const sh = 1080;

        if (this.bg) {
            this.bg.position.set(sw / 2, sh / 2);
        }

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



    // [Lead Architect]: Вспомогательный метод создания кнопок удален, 
    // так как мы переходим на использование оригинальных спрайтов меню.

    public destroy(options?: any) {
        super.destroy(options);
    }
}
