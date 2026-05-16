import * as PIXI from 'pixi.js';
import { AssetsMap } from '../../configs/AssetsMap';
import gsap from 'gsap';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { useGameStore } from '../../store/useGameStore';
import { SceneManager } from '../../engine/core/SceneManager';
import { MainScreen } from './MainScreen';

/**
 * ShopScreen — Премиальный магазин с поддержкой двойной валюты (Золото/Алмазы).
 */
export class ShopScreen extends PIXI.Container {
    private bg: PIXI.Graphics;
    private leftPanel: PIXI.Graphics;
    private rightPanel: PIXI.Graphics;
    private itemGrid: PIXI.Container;
    private panelsContainer: PIXI.Container;
    private activeTab: string = 'WEAPONS';

    constructor() {
        super();
        this.label = 'ShopScreen';

        this.panelsContainer = new PIXI.Container();
        this.addChild(this.panelsContainer);

        this.bg = new PIXI.Graphics();
        this.leftPanel = new PIXI.Graphics();
        this.rightPanel = new PIXI.Graphics();
        this.panelsContainer.addChild(this.bg, this.leftPanel, this.rightPanel);

        this.itemGrid = new PIXI.Container();
        this.addChild(this.itemGrid);

        this.init();
        window.addEventListener('resize', this.onResize);
    }

    private async init() {
        await PIXI.Assets.load([AssetsMap.UI.SHOP_ITEM_BG, AssetsMap.UI.SHOP_TITLE_BG]);
        this.render();
    }

    private render() {
        const sw = 1920;
        const sh = 1080;

        this.bg.clear().rect(0, 0, sw, sh).fill(0x050505);

        const leftW = sw * 0.35;
        this.leftPanel.clear().rect(0, 0, leftW, sh).fill(0x0a0a0a);

        const rightW = sw * 0.65;
        this.rightPanel.clear().rect(leftW, 0, rightW, sh).fill(0x050505);

        this.renderTabs(leftW);
        this.renderItemGrid(leftW, rightW);
        this.renderBalance(sw);
        this.createCloseButton(sw);
    }

    private renderTabs(leftW: number) {
        const tabs = [
            { id: 'WEAPONS', label: 'ОРУЖИЕ', icon: '⚔️' },
            { id: 'HELMETS', label: 'ШЛЕМЫ', icon: '🪖' },
            { id: 'ARMOR', label: 'БРОНЯ', icon: '🛡️' },
            { id: 'SHIELDS', label: 'ЩИТЫ', icon: '🔰' },
        ];

        tabs.forEach((tab, i) => {
            const btn = new PIXI.Container();
            btn.position.set(50, 200 + i * 100);

            const isActive = this.activeTab === tab.id;
            const bg = new PIXI.Graphics().roundRect(0, 0, leftW - 100, 80, 12).fill(isActive ? 0x2a2a40 : 0x1a1a1a);
            if (isActive) bg.stroke({ color: 0xffd700, width: 2 });

            const txt = new PIXI.Text({
                text: `${tab.icon}  ${tab.label}`,
                style: { fill: isActive ? 0xffd700 : 0xaaaaaa, fontSize: 24, fontWeight: 'bold' },
            });
            txt.anchor.set(0, 0.5);
            txt.position.set(30, 40);

            btn.addChild(bg, txt);
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.on('pointerdown', () => {
                this.activeTab = tab.id;
                this.render();
            });

            this.itemGrid.addChild(btn);
        });
    }

    private renderBalance(sw: number) {
        const store = useGameStore.getState();
        const goldTxt = new PIXI.Text({
            text: `💰 ${store.gold.toLocaleString()}`,
            style: { fill: 0xffd700, fontSize: 28, fontWeight: 'bold' },
        });
        goldTxt.position.set(sw - 600, 35);

        const gemTxt = new PIXI.Text({
            text: `💎 ${store.crystals.toLocaleString()}`,
            style: { fill: 0x00ffff, fontSize: 28, fontWeight: 'bold' },
        });
        gemTxt.position.set(sw - 350, 35);

        this.itemGrid.addChild(goldTxt, gemTxt);
    }

    private renderItemGrid(startX: number, width: number) {
        const padding = 60;
        const columns = 4;
        const spacing = 30;
        const availableW = width - padding * 2;
        const cellW = (availableW - (columns - 1) * spacing) / columns;
        const cellH = cellW * 1.5;

        // Фильтрация предметов
        const allItems = Object.values(ITEMS_DATABASE);
        const filtered = allItems.filter((item) => item.subTab === this.activeTab);

        filtered.forEach((item, i) => {
            const col = i % columns;
            const row = Math.floor(i / columns);

            const card = new PIXI.Container();
            card.x = startX + padding + col * (cellW + spacing);
            card.y = 150 + row * (cellH + spacing);

            // Основной фон карты
            const rarityColors: any = {
                COMMON: 0x333333,
                RARE: 0x1e3a8a,
                EPIC: 0x581c87,
                MYTHIC: 0x7f1d1d,
                LEGENDARY: 0x78350f,
            };
            const bg = new PIXI.Graphics()
                .roundRect(0, 0, cellW, cellH, 16)
                .fill(0x1a1a1a)
                .stroke({ color: rarityColors[item.rarity] || 0x333333, width: 3 });
            card.addChild(bg);

            // Название
            const name = new PIXI.Text({
                text: item.name.toUpperCase(),
                style: {
                    fill: 0xffffff,
                    fontSize: 16,
                    fontWeight: '900',
                    align: 'center',
                    wordWrap: true,
                    wordWrapWidth: cellW - 20,
                },
            });
            name.anchor.set(0.5, 0);
            name.position.set(cellW / 2, 15);
            card.addChild(name);

            // Иконка (Заглушка или Текст)
            const icon = new PIXI.Text({ text: '📦', style: { fontSize: 64 } });
            icon.anchor.set(0.5);
            icon.position.set(cellW / 2, cellH * 0.4);
            card.addChild(icon);

            // КНОПКА ПОКУПКИ: ЗОЛОТО
            if (item.priceGold !== undefined) {
                const btnGold = this.createBuyButton(cellW - 40, 45, 0xd4af37, `💰 ${item.priceGold}`, () => {
                    if (useGameStore.getState().buyItem(item.id, 'gold')) {
                        this.render(); // Обновить баланс
                        this.showFlyText(card, 'КУПЛЕНО!', 0x00ff00);
                    } else {
                        this.showFlyText(card, 'НЕТ ЗОЛОТА!', 0xff0000);
                    }
                });
                btnGold.position.set(20, cellH - 110);
                card.addChild(btnGold);
            }

            // КНОПКА ПОКУПКИ: АЛМАЗЫ
            if (item.priceGem !== undefined) {
                const btnGem = this.createBuyButton(cellW - 40, 45, 0x008888, `💎 ${item.priceGem}`, () => {
                    if (useGameStore.getState().buyItem(item.id, 'gem')) {
                        this.render();
                        this.showFlyText(card, 'КУПЛЕНО!', 0x00ff00);
                    } else {
                        this.showFlyText(card, 'НЕТ АЛМАЗОВ!', 0xff0000);
                    }
                });
                btnGem.position.set(20, cellH - 55);
                card.addChild(btnGem);
            }

            this.itemGrid.addChild(card);

            card.alpha = 0;
            gsap.to(card, { alpha: 1, duration: 0.4, delay: i * 0.05 });
        });
    }

    private createBuyButton(w: number, h: number, color: number, label: string, onClick: () => void): PIXI.Container {
        const btn = new PIXI.Container();
        const bg = new PIXI.Graphics()
            .roundRect(0, 0, w, h, 8)
            .fill(color)
            .stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
        const txt = new PIXI.Text({ text: label, style: { fill: 0xffffff, fontSize: 16, fontWeight: 'bold' } });
        txt.anchor.set(0.5);
        txt.position.set(w / 2, h / 2);
        btn.addChild(bg, txt);

        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => {
            gsap.to(btn.scale, { x: 0.95, y: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
            onClick();
        });
        return btn;
    }

    private showFlyText(parent: PIXI.Container, msg: string, color: number) {
        const txt = new PIXI.Text({
            text: msg,
            style: { fill: color, fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 4 } },
        });
        txt.anchor.set(0.5);
        txt.position.set(parent.width / 2, parent.height / 2);
        parent.addChild(txt);
        gsap.to(txt, { y: -50, alpha: 0, duration: 1.5, ease: 'power2.out', onComplete: () => txt.destroy() });
    }

    private createCloseButton(sw: number) {
        const btn = new PIXI.Container();
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        const bg = new PIXI.Graphics().roundRect(0, 0, 160, 50, 8).fill(0x8b0000).stroke({ color: 0xffd700, width: 2 });
        const txt = new PIXI.Text({ text: 'ВЫХОД', style: { fill: 0xffffff, fontSize: 18, fontWeight: 'bold' } });
        txt.anchor.set(0.5);
        txt.position.set(80, 25);
        btn.addChild(bg, txt);
        btn.position.set(sw - 200, 30);
        btn.on('pointerdown', () => SceneManager.getInstance().switchScene(new MainScreen()));
        this.addChild(btn);
    }

    private onResize = () => this.render();
    public destroy(options?: any) {
        window.removeEventListener('resize', this.onResize);
        super.destroy(options);
    }
}
