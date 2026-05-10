import * as PIXI from 'pixi.js';
import { baseTextStyle, createGradientTexture, headerTextStyle, IconButton } from '../components/UIComponents';
import { UIManager } from '../../engine/systems/UIManager';
import { MainScreen } from './MainScreen';
import { useGameStore } from '../../store/useGameStore';
import { WEAPONS_DB } from '../../game/configs/ItemsConfig';
import { makeDraggable } from '../../engine/utils/Draggable';

export class InventoryScreen extends PIXI.Container {
    private screenContainer: PIXI.Container;

    constructor() {
        super();
        this.screenContainer = new PIXI.Container();
        this.addChild(this.screenContainer);
        this.renderScreen();
    }

    private renderScreen() {
        this.screenContainer.removeChildren();
        const store = useGameStore.getState();
        const SAFE_MARGIN = 32;

        // 0. Глобальный фон (Темно-синий)
        const bgSprite = new PIXI.Graphics().rect(0, 0, 1280, 720).fill(0x1a1e2e);
        this.screenContainer.addChild(bgSprite);

        // 1. Верхняя панель (Header)
        const backBtn = new IconButton('❮', () => UIManager.getInstance().switchScreen(new MainScreen(), 'MAIN_MENU'));
        backBtn.position.set(SAFE_MARGIN + 30, SAFE_MARGIN + 20);
        makeDraggable(backBtn, 'inv_back_btn');
        this.screenContainer.addChild(backBtn);

        const title = new PIXI.Text({
            text: 'ИНВЕНТАРЬ',
            style: { ...headerTextStyle, fontSize: 36, fill: '#ffffff' }
        });
        title.anchor.set(0.5, 0);
        title.position.set(640, SAFE_MARGIN);
        makeDraggable(title, 'inv_title');
        this.screenContainer.addChild(title);

        // 2. Вкладки (Стиль AAA кнопок)
        const tabs = ['ОРУЖИЕ', 'БРОНЯ', 'АКСЕССУАРЫ'];
        tabs.forEach((tab, index) => {
            const isActive = index === 0; // Пока активна только первая
            const tabBg = new PIXI.Graphics();
            const bgColor = isActive ? 0xffcc00 : 0x2a2f45;
            
            tabBg.roundRect(0, 0, 200, 50, 12).fill(bgColor);
            tabBg.position.set(300 + index * 220, 100);

            const tabText = new PIXI.Text({
                text: tab,
                style: { 
                    ...baseTextStyle, 
                    fontSize: 20, 
                    fill: isActive ? '#1a1a1a' : '#ffffff', 
                    stroke: isActive ? { width: 0 } : { color: '#000000', width: 5 },
                    dropShadow: isActive ? { alpha: 0 } : baseTextStyle.dropShadow 
                }
            });
            tabText.anchor.set(0.5);
            tabText.position.set(100, 25);
            tabBg.addChild(tabText);
            
            makeDraggable(tabBg, `inv_tab_${index}`);
            this.screenContainer.addChild(tabBg);
        });

        // 3. Подложка для сетки инвентаря
        const panelBg = new PIXI.Graphics().roundRect(280, 170, 720, 480, 16).fill(0x23283b);
        makeDraggable(panelBg, 'inv_panel_bg');
        this.screenContainer.addChild(panelBg);

        // 4. Сетка инвентаря
        const slotBgTex = createGradientTexture(140, 160, ['#2a2b36', '#0f1016']);
        
        const rarityColors: Record<string, number> = {
            'COMMON': 0xaaaaaa,
            'RARE': 0x00aaff,
            'EPIC': 0xcc00ff,
            'LEGENDARY': 0xffaa00
        };
        
        const itemEmojis: Record<string, string> = {
            'flip_flop': '🩴', 'pan': '🍳', 'dumbell': '🏋️', 
            'shovel': '🪜', 'fish': '🐟', 'stick': '🦯', 'tapok': '🩴'
        };

        store.inventory.forEach((item, index) => {
            const weaponDef = WEAPONS_DB[item.id];
            if (!weaponDef) return;

            const isEquipped = store.equippedWeaponId === item.id;

            const slot = new PIXI.Container();
            // Выравниваем элементы внутри подложки #23283b
            const x = 320 + (index % 4) * 160;
            const y = 200 + Math.floor(index / 4) * 180;
            slot.position.set(x, y);

            const bg = new PIXI.Graphics();
            // Тень
            bg.roundRect(4, 4, 140, 160, 16).fill({ color: 0x000000, alpha: 0.4 });
            // Фон
            bg.roundRect(0, 0, 140, 160, 16).fill({ texture: slotBgTex });
            
            // Highlight
            bg.roundRect(2, 2, 136, 4, 14).fill({ color: 0xffffff, alpha: 0.1 });
            
            // Рамка (если надето - зеленая, иначе цвет редкости)
            const color = rarityColors[weaponDef.rarity] || 0xffffff;
            bg.roundRect(0, 0, 140, 160, 16).stroke({ width: 6, color: isEquipped ? 0x00ff00 : color });
            slot.addChild(bg);

            // Эмодзи предмета
            const emoji = new PIXI.Text({
                text: itemEmojis[weaponDef.id] || '🎁',
                style: { fontSize: 64, dropShadow: { color: '#000000', alpha: 1, blur: 4, distance: 4 } }
            });
            emoji.anchor.set(0.5);
            emoji.position.set(70, 70);
            slot.addChild(emoji);

            // Название
            const nameText = new PIXI.Text({
                text: weaponDef.name,
                style: { ...baseTextStyle, fontSize: 14, align: 'center', wordWrap: true, wordWrapWidth: 130 }
            });
            nameText.anchor.set(0.5, 0);
            nameText.position.set(70, 110);
            slot.addChild(nameText);
            
            // Уровень
            const lvlText = new PIXI.Text({
                text: `Ур. ${item.level}`,
                style: { ...baseTextStyle, fontSize: 12, fill: '#888899', dropShadow: { alpha: 0 } }
            });
            lvlText.anchor.set(0.5, 0);
            lvlText.position.set(70, 135);
            slot.addChild(lvlText);

            // Плашка "НАДЕТО"
            if (isEquipped) {
                const eqBadge = new PIXI.Graphics().roundRect(35, -10, 70, 20, 10).fill(0x00ff00);
                const eqText = new PIXI.Text({
                    text: 'НАДЕТО',
                    style: { ...baseTextStyle, fontSize: 10, fill: '#1a1a1a', stroke: { width: 0 }, dropShadow: { alpha: 0 } }
                });
                eqText.anchor.set(0.5);
                eqText.position.set(70, 0);
                slot.addChild(eqBadge, eqText);
            }

            // Интерактивность (Клик = Надеть)
            slot.eventMode = 'static';
            slot.cursor = 'pointer';
            slot.on('pointerdown', () => {
                store.equipWeapon(item.id);
                this.renderScreen(); // Перерисовка интерфейса
            });

            makeDraggable(slot, `inv_slot_${index}`);
            this.screenContainer.addChild(slot);
        });
    }
}
