import * as PIXI from 'pixi.js';
import { SceneManager } from '../core/SceneManager';

/**
 * UIManager — высокоуровневый менеджер для управления экранами.
 * Используется в React-компонентах для переключения PIXI-сцен.
 */
export class UIManager {
    private static instance: UIManager;

    private constructor() {}

    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    /**
     * Переключает текущий экран.
     * @param screen Экземпляр PIXI-контейнера (сцены)
     * @param label Метка для стора (например, 'ARENA', 'MAIN_MENU')
     */
    public switchScreen(screen: PIXI.Container, label: string) {
        console.log(`[UIManager] Switching to screen: ${label}`);

        // Устанавливаем метку для SceneManager, если она не установлена
        if (!(screen as any).label) {
            (screen as any).label = label;
        }

        // Вызываем базовый менеджер сцен
        SceneManager.getInstance().switchScene(screen);
    }
}
