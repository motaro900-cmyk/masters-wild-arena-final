import * as PIXI from 'pixi.js';
import { YellowButton, CurrencyPanel, baseTextStyle } from '../components/UIComponents';
import { UIManager } from '../../engine/systems/UIManager';
import { MainScreen } from './MainScreen';
import { useGameStore } from '../../store/useGameStore';
import { makeDraggable } from '../../engine/utils/Draggable';

export class HeroSelection extends PIXI.Container {
    private screenContainer: PIXI.Container;

    constructor() {
        super();
        this.screenContainer = new PIXI.Container();
        this.addChild(this.screenContainer);
        
        this.renderScreen();
    }

    private renderScreen() {
        // Очищаем контейнер при каждой перерисовке (например, при смене героя)
        this.screenContainer.removeChildren();
        const store = useGameStore.getState();

        // 1. Верхняя панель (Назад + Ресурсы)
        const backBtn = new PIXI.Text({
            text: '❮ ГЕРОИ',
            style: { ...baseTextStyle, fontSize: 32 }
        });
        backBtn.eventMode = 'static';
        backBtn.cursor = 'pointer';
        backBtn.position.set(40, 30);
        backBtn.on('pointerdown', () => UIManager.getInstance().switchScreen(new MainScreen(), 'MAIN_MENU'));
        makeDraggable(backBtn, 'hero_back_btn');
        this.screenContainer.addChild(backBtn);

        const goldPanel = new CurrencyPanel('icon_gold', store.gold);
        goldPanel.position.set(900, 30);
        const gemsPanel = new CurrencyPanel('icon_gem', store.crystals);
        gemsPanel.position.set(1070, 30);
        makeDraggable(goldPanel, 'hero_gold_panel');
        makeDraggable(gemsPanel, 'hero_gems_panel');
        this.screenContainer.addChild(goldPanel, gemsPanel);

        // 2. Сетка карточек героев (3x2)
        const heroes = Object.keys(store.heroes);
        const heroNames: Record<string, string> = { 
            panda: 'ПАНДА', moose: 'ЛОСЬ', goose: 'ГУСЬ', cat: 'КОТ', boar: 'КАБАН' 
        };
        const emojis: Record<string, string> = { panda: '🐼', moose: '🫎', goose: '🦢', cat: '🐱', boar: '🐗' };

        heroes.forEach((heroId, index) => {
            const card = new PIXI.Container();
            const isSelected = store.currentHeroId === heroId;

            // Центрируем сетку из 3 колонок (260px карточка + 40px отступ = 300px шаг)
            const x = 210 + (index % 3) * 300;
            const y = 120 + Math.floor(index / 3) * 290;
            card.position.set(x, y);

            // Фон карточки с подсветкой активного
            const bg = new PIXI.Graphics();
            bg.roundRect(0, 0, 260, 260, 20).fill({ color: 0x1a1a2e, alpha: 0.9 }).stroke({ width: 6, color: isSelected ? 0x00ff00 : 0x888888 }); // Rarity borders
            card.addChild(bg);

            // Имя и уровень
            const nameText = new PIXI.Text({
                text: heroNames[heroId] || heroId.toUpperCase(),
                style: { ...baseTextStyle, fontSize: 24, fill: isSelected ? '#ffdd00' : '#ffffff' }
            });
            nameText.position.set(20, 20);
            card.addChild(nameText);

            const lvlText = new PIXI.Text({
                text: 'Ур. 1',
                style: { ...baseTextStyle, fontSize: 16, fill: '#aaaaaa' }
            });
            lvlText.anchor.set(1, 0);
            lvlText.position.set(240, 26);
            card.addChild(lvlText);

            const heroEmoji = new PIXI.Text({
                text: emojis[heroId] || '🐼',
                style: { fontSize: 96, dropShadow: { color: '#000000', alpha: 1, blur: 4, distance: 6 } }
            });
            heroEmoji.anchor.set(0.5);
            heroEmoji.position.set(130, 120);
            card.addChild(heroEmoji);

            const xpBar = new PIXI.Graphics().rect(50, 180, 160, 15).fill(0x000000).rect(50, 180, 80, 15).fill(0x00ff00);
            card.addChild(xpBar);

            // Кнопка или статус "Выбран"
            if (isSelected) {
                const selectedText = new PIXI.Text({
                    text: 'ВЫБРАН',
                    style: { ...baseTextStyle, fontSize: 20, fill: '#4caf50', dropShadow: { alpha: 0 } }
                });
                selectedText.anchor.set(0.5);
                selectedText.position.set(130, 220);
                card.addChild(selectedText);
            } else {
                const selectBtn = new YellowButton('ВЫБРАТЬ', 200, 45, () => {
                    // Выбираем героя и перерисовываем экран
                    useGameStore.setState({ currentHeroId: heroId });
                    this.renderScreen();
                });
                selectBtn.position.set(130, 220);
                card.addChild(selectBtn);
            }

            makeDraggable(card, `hero_card_${heroId}`);
            this.screenContainer.addChild(card);
        });
    }
}
