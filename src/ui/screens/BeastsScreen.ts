import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { AssetsMap } from '../../configs/AssetsMap';
import { resolveAssetPath } from '../../utils/assetPath';
import { SceneManager } from '../../engine/core/SceneManager';
import { useGameStore } from '../../store/useGameStore';

/**
 * BeastsScreen — Экран выбора зверей.
 * Реализует сетку 4x2 с анимацией и интеграцией в ProfileStore.
 */
export class BeastsScreen extends PIXI.Container {
    private bg: PIXI.Graphics;
    private content: PIXI.Container;
    private titleContainer: PIXI.Container;

    private readonly beastList = [
        { id: 'panda', name: 'ПАНДА', file: 'panda.webp' },
        { id: 'tiger', name: 'ТИГР', file: 'tiger.webp' },
        { id: 'lion', name: 'ЛЕВ', file: 'lion.webp' },
        { id: 'bear', name: 'МЕДВЕДЬ', file: 'bear.webp' },
        { id: 'rhino', name: 'НОСОРОГ', file: 'rhino.webp' },
        { id: 'croc', name: 'КРОКОДИЛ', file: 'crocodile.webp' },
        { id: 'boar', name: 'КАБАН', file: 'boar.webp' },
        { id: 'elk', name: 'ЛОСЬ', file: 'moose.webp' },
    ];

    constructor() {
        super();
        this.label = 'BEASTS'; // Для синхронизации с React HUD

        this.bg = new PIXI.Graphics();
        this.content = new PIXI.Container();
        this.titleContainer = new PIXI.Container();

        this.addChild(this.bg, this.content, this.titleContainer);
        this.init();
    }

    private async init() {
        // Загрузка ресурсов
        const beastAssets = this.beastList.map((b) => resolveAssetPath(`/assets/images/avatars/${b.file}`));
        await PIXI.Assets.load([
            ...beastAssets,
            AssetsMap.UI.SHOP_TITLE_BG,
            AssetsMap.UI.BEAST_CARD_BG,
            AssetsMap.BACKGROUNDS.MAIN_MENU,
        ]);

        this.render();
    }

    private render() {
        const sw = 1920;
        const sh = 1080;

        // 1. Фон (Темный градиент или основное меню с блюром)
        this.bg.clear().rect(0, 0, sw, sh).fill(0x050505);

        const mainBg = new PIXI.Sprite(PIXI.Assets.get(AssetsMap.BACKGROUNDS.MAIN_MENU));
        mainBg.width = sw;
        mainBg.height = sh;
        mainBg.alpha = 0.3;
        this.addChildAt(mainBg, 0);

        // 2. Заголовок
        this.renderTitle(sw);

        // 3. Сетка зверей
        this.renderGrid(sw);

        // 4. Кнопка "Назад"
        this.createBackButton(sw);
    }

    private renderTitle(sw: number) {
        this.titleContainer.removeChildren();
        this.titleContainer.position.set(sw / 2 - 300, 60);

        const bg = new PIXI.Sprite(PIXI.Assets.get(AssetsMap.UI.SHOP_TITLE_BG));
        bg.width = 600;
        bg.height = 80;

        const txt = new PIXI.Text({
            text: 'КОЛЛЕКЦИЯ ЗВЕРЕЙ',
            style: {
                fill: 0xffffff,
                fontSize: 32,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                letterSpacing: 4,
            },
        });
        txt.anchor.set(0.5);
        txt.position.set(300, 40);

        this.titleContainer.addChild(bg, txt);
    }

    private renderGrid(sw: number) {
        this.content.removeChildren();

        const cols = 4;
        const spacing = 40;
        const cardW = 320;
        const cardH = 400;

        const totalW = cols * cardW + (cols - 1) * spacing;
        const startX = (sw - totalW) / 2;
        const startY = 220;

        this.beastList.forEach((beast, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;

            const card = this.createBeastCard(beast, cardW, cardH);
            card.position.set(startX + col * (cardW + spacing), startY + row * (cardH + spacing));

            // Анимация появления
            card.alpha = 0;
            card.scale.set(0.8);
            gsap.to(card, { alpha: 1, duration: 0.4, delay: i * 0.05 });
            gsap.to(card.scale, { x: 1, y: 1, duration: 0.5, delay: i * 0.05, ease: 'back.out(1.7)' });

            this.content.addChild(card);
        });
    }

    private createBeastCard(beast: any, w: number, h: number): PIXI.Container {
        const container = new PIXI.Container();
        const currentAvatar = useGameStore.getState().avatar;
        const isSelected = currentAvatar.includes(beast.file);

        // Фон карточки
        const bg = new PIXI.Sprite(PIXI.Assets.get(AssetsMap.UI.BEAST_CARD_BG));
        bg.width = w;
        bg.height = h;
        container.addChild(bg);

        // Рамка выбора
        const border = new PIXI.Graphics()
            .roundRect(0, 0, w, h, 15)
            .stroke({ color: isSelected ? 0xffd700 : 0x444444, width: isSelected ? 4 : 2 });
        container.addChild(border);

        // Иконка зверя
        const icon = new PIXI.Sprite(PIXI.Assets.get(resolveAssetPath(`/assets/images/avatars/${beast.file}`)));
        icon.width = w * 0.8;
        icon.height = w * 0.8;
        icon.anchor.set(0.5);
        icon.position.set(w / 2, h * 0.4);
        container.addChild(icon);

        // Имя
        const nameText = new PIXI.Text({
            text: beast.name,
            style: {
                fill: isSelected ? 0xffd700 : 0xffffff,
                fontSize: 22,
                fontWeight: 'bold',
                fontFamily: 'Arial',
            },
        });
        nameText.anchor.set(0.5);
        nameText.position.set(w / 2, h - 60);
        container.addChild(nameText);

        // Статус
        const statusText = new PIXI.Text({
            text: isSelected ? 'ВЫБРАН' : 'ВЫБРАТЬ',
            style: {
                fill: isSelected ? 0xffd700 : 0x888888,
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'Arial',
            },
        });
        statusText.anchor.set(0.5);
        statusText.position.set(w / 2, h - 30);
        container.addChild(statusText);

        // Интерактивность
        container.eventMode = 'static';
        container.cursor = 'pointer';

        container.on('pointerover', () => {
            gsap.to(container.scale, { x: 1.05, y: 1.05, duration: 0.2 });
            border.stroke({ color: 0xffd700, width: 3 });
        });

        container.on('pointerout', () => {
            gsap.to(container.scale, { x: 1, y: 1, duration: 0.2 });
            border.stroke({ color: isSelected ? 0xffd700 : 0x444444, width: isSelected ? 4 : 2 });
        });

        container.on('pointerdown', () => {
            // Выбор зверя
            useGameStore.getState().setAvatar(beast.file);
            this.render(); // Перерисовываем для обновления рамок
        });

        return container;
    }

    private createBackButton(sw: number) {
        const btn = new PIXI.Container();
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        const bg = new PIXI.Graphics()
            .roundRect(0, 0, 180, 60, 10)
            .fill(0x8b0000)
            .stroke({ color: 0xffd700, width: 2 });

        const txt = new PIXI.Text({
            text: 'НАЗАД',
            style: { fill: 0xffffff, fontSize: 20, fontWeight: 'bold' },
        });
        txt.anchor.set(0.5);
        txt.position.set(90, 30);

        btn.addChild(bg, txt);
        btn.position.set(sw - 220, 40);

        btn.on('pointerdown', () => {
            import('./MainScreen').then((m) => {
                SceneManager.getInstance().switchScene(new m.MainScreen());
            });
        });

        this.addChild(btn);
    }
}
