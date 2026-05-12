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
    private stage: PIXI.Container;

    private constructor() {
        this.stage = PixiApp.getInstance().getApp().stage;
    }

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
        const app = PixiApp.getInstance().getApp();

        // Синхронизация с React Store (скрытие HUD если не Главный Экран)
        const sceneLabel = (newScene as any).label || newScene.name;
        const screenId = sceneLabel === 'MainScreen' ? 'MAIN_MENU' : (sceneLabel || 'OTHER').toUpperCase();
        useGameStore.setState({ activeScreen: screenId });

        // 1. ЯДЕРНАЯ ОЧИСТКА
        app.stage.children.forEach(child => {
            if (child !== newScene) {
                child.visible = false;
            }
        });

        // 2. Если старая сцена должна быть уничтожена
        if (this.currentScene && destroyOld && this.currentScene !== newScene) {
            this.stage.removeChild(this.currentScene);
            this.currentScene.destroy({ children: true });
        }

        // 3. Добавляем и активируем новую сцену
        this.currentScene = newScene;
        this.currentScene.visible = true;
        
        if (!this.stage.children.includes(newScene)) {
            this.stage.addChild(newScene);
        }

        console.log(`[SceneManager] Сцена переключена: ${(newScene as any).label || newScene.name || 'unnamed'}`);
    }

    /**
     * Возвращает текущую активную сцену
     */
    public getCurrentScene(): PIXI.Container | null {
        return this.currentScene;
    }
}
