import * as PIXI from 'pixi.js';
import { PixiApp } from './PixiApp';
import { useGameStore } from '../../store/useGameStore';

/**
 * SceneManager — паттерн State Machine для управления экранами игры.
 * Отвечает за переключение сцен, очистку памяти и предотвращение наслоения UI.
 */
export class SceneManager {
    private static instance: SceneManager;
    private currentScene: PIXI.Container | null = null;

    private constructor() {}

    public static getInstance(): SceneManager {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }

    /**
     * Переключает текущую сцену на новую.
     * @param newScene Контейнер новой сцены
     * @param destroyOld: boolean (по умолчанию true)
     */
    public switchScene(newScene: PIXI.Container, destroyOld: boolean = true) {
        const pixi = PixiApp.getInstance();
        const gameLayer = pixi.gameLayer;

        // Синхронизация с React Store
        const sceneLabel = (newScene as any).label || newScene.name;
        const screenId = sceneLabel === 'MainScreen' ? 'MAIN_MENU' : (sceneLabel || 'OTHER').toUpperCase();
        useGameStore.setState({ activeScreen: screenId });

        console.log(`[SceneManager] Switching to: ${sceneLabel}`);

        // 1. Очистка gameLayer от других сцен
        gameLayer.children.forEach((child) => {
            if (child !== newScene) {
                child.visible = false;
                if (destroyOld) {
                    // [Lead Architect]: Мы не уничтожаем здесь сразу,
                    // чтобы дать время на анимации перехода если они будут.
                }
            }
        });

        // 2. Уничтожение старой сцены
        if (this.currentScene && destroyOld && this.currentScene !== newScene) {
            if (this.currentScene.parent) {
                this.currentScene.parent.removeChild(this.currentScene);
            }
            this.currentScene.destroy({ children: true });
        }

        // 3. Добавляем новую сцену в Game Layer
        this.currentScene = newScene;
        this.currentScene.visible = true;

        if (newScene.parent !== gameLayer) {
            gameLayer.addChild(newScene);
        }

        // [Fix]: Убеждаемся, что слои видимы
        pixi.stage.visible = true;
        pixi.backgroundLayer.visible = true;
        pixi.gameLayer.visible = true;

        console.log(`[SceneManager] Scene switched successfully: ${sceneLabel}`);
    }

    /**
     * Возвращает текущую активную сцену
     */
    public getCurrentScene(): PIXI.Container | null {
        return this.currentScene;
    }
}
