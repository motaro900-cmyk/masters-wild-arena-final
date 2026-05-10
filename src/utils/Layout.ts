import { PixiApp } from '../engine/core/PixiApp';

/**
 * Утилиты для адаптивной верстки (Responsive Layout)
 */
export const Layout = {
    /**
     * Возвращает значение в пикселях на основе процента от ширины экрана (Viewport Width)
     */
    vw(percent: number): number {
        const app = PixiApp.getInstance().getApp();
        return (app.screen.width * percent) / 100;
    },

    /**
     * Возвращает значение в пикселях на основе процента от высоты экрана (Viewport Height)
     */
    vh(percent: number): number {
        const app = PixiApp.getInstance().getApp();
        return (app.screen.height * percent) / 100;
    },

    /**
     * Центрирует контейнер относительно экрана
     */
    center(container: any) {
        const app = PixiApp.getInstance().getApp();
        container.x = app.screen.width / 2;
        container.y = app.screen.height / 2;
    }
};
