/**
 * ScaleManager — Утилита для масштабирования UI под 1920x1080.
 * Используется для letterboxing-эффекта в VK Mini Apps.
 */
export class ScaleManager {
    public static readonly BASE_WIDTH = 1920;
    public static readonly BASE_HEIGHT = 1080;

    static getScale(): { scale: number; offsetX: number; offsetY: number } {
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;

        const scaleX = windowW / this.BASE_WIDTH;
        const scaleY = windowH / this.BASE_HEIGHT;
        const scale = Math.min(scaleX, scaleY); // contain (letterboxing)

        return {
            scale,
            offsetX: (windowW - this.BASE_WIDTH * scale) / 2,
            offsetY: (windowH - this.BASE_HEIGHT * scale) / 2,
        };
    }
}
