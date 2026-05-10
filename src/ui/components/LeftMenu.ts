import * as PIXI from 'pixi.js';
import { resolveAssetPath } from '../../utils/assetPath';
import { SceneManager } from '../../engine/core/SceneManager';
import { ShopScreen } from '../screens/ShopScreen';
import { UI_SIZES, UI_COLORS } from '../UI_CONFIG';

/**
 * LeftMenu — Исправленная версия левого меню.
 * Решает проблему наслоения и дублирования через принудительную очистку.
 */
export class LeftMenu extends PIXI.Container {
    private menuContainer: PIXI.Container;

    constructor() {
        super();
        this.menuContainer = new PIXI.Container();
        this.addChild(this.menuContainer);
        this.init();
    }

    private async init() {
        // Гарантированная загрузка необходимых ассетов для меню
        const assetsToLoad = [
            resolveAssetPath('/assets/images/ui/btn_panel_mis12c.png'),
            resolveAssetPath('/assets/images/ui/bar_gold.png'),
            resolveAssetPath('/assets/images/ui/bar_gem.png'),
            resolveAssetPath('/assets/images/ui/bar_energy.png'),
            resolveAssetPath('/assets/images/ui/mail_icon.png')
        ];
        
        await PIXI.Assets.load(assetsToLoad);
        this.render();
    }

    /**
     * Основной метод отрисовки меню.
     */
    public render() {
        // ФАЗА 2: Полная очистка перед перерисовкой
        this.menuContainer.removeChildren();

        const menuItems = [
            { id: 'STORE', label: 'МАГАЗИН', icon: 'bar_gold.png' },
            { id: 'INVENTORY', label: 'ИНВЕНТАРЬ', icon: 'bar_gem.png' },
            { id: 'BEASTS', label: 'ЗВЕРИ', icon: 'bar_energy.png' },
            { id: 'CLANS', label: 'КЛАНЫ', icon: 'mail_icon.png' }
        ];

        menuItems.forEach((item, index) => {
            // ОДИН контейнер на ОДНУ кнопку
            const btnContainer = new PIXI.Container();
            btnContainer.y = index * 85; // Строгий фиксированный отступ
            
            // 1. ПОДЛОЖКА
            const texture = PIXI.Assets.get(resolveAssetPath('/assets/images/ui/btn_panel_mis12c.png'));
            const bg = new PIXI.Sprite(texture);
            bg.width = UI_SIZES.SIDEBAR_WIDTH - 20;
            bg.height = UI_SIZES.BUTTON_HEIGHT;
            btnContainer.addChild(bg);

            // 2. ИКОНКА
            if (item.icon) {
                const iconTexture = PIXI.Assets.get(resolveAssetPath(`/assets/images/ui/${item.icon}`));
                if (iconTexture) {
                    const icon = new PIXI.Sprite(iconTexture);
                    icon.anchor.set(0, 0.5);
                    icon.position.set(15, bg.height / 2);
                    icon.width = 30;
                    icon.height = 30;
                    btnContainer.addChild(icon);
                }
            }

            // 3. ТЕКСТ
            const text = new PIXI.Text({
                text: item.label,
                style: {
                    fill: UI_COLORS.TEXT_MAIN,
                    fontSize: 18,
                    fontWeight: 'bold',
                    fontFamily: 'Arial Black',
                    dropShadow: { color: 0x000000, alpha: 0.5, blur: 2, distance: 2 }
                }
            });
            text.anchor.set(0, 0.5);
            text.position.set(60, bg.height / 2);
            btnContainer.addChild(text);

            // Интерактивность
            btnContainer.eventMode = 'static';
            btnContainer.cursor = 'pointer';
            btnContainer.on('pointerdown', () => this.handleNavigation(item.id));

            this.menuContainer.addChild(btnContainer);
        });
    }

    private handleNavigation(id: string) {
        if (id === 'STORE') {
            import('../../store/useGameStore').then(m => m.useGameStore.setState({ activeScreen: 'SHOP' }));
            SceneManager.getInstance().switchScene(new ShopScreen());
        }
    }

    public updateLayout() {
        // В фиксированном разрешении 1920x1080 позиции тоже фиксированные
        this.position.set(50, 250);
    }
}
