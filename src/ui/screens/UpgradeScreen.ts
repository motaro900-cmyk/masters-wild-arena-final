import * as PIXI from 'pixi.js';
import { GreenButton, CurrencyPanel, baseTextStyle, GlassPanel, headerTextStyle, IconButton } from '../components/UIComponents';
import { UIManager } from '../../engine/systems/UIManager';
import { MainScreen } from './MainScreen';
import { useGameStore } from '../../store/useGameStore';
import { makeDraggable } from '../../engine/utils/Draggable';

export class UpgradeScreen extends PIXI.Container {
    constructor() {
        super();
        const store = useGameStore.getState();
        const SAFE_MARGIN = 32;

        // 1. Верхняя панель (Назад + Ресурсы)
        const backBtn = new IconButton('❮', () => UIManager.getInstance().switchScreen(new MainScreen(), 'MAIN_MENU'));
        backBtn.position.set(SAFE_MARGIN + 30, SAFE_MARGIN + 20);
        makeDraggable(backBtn, 'upg_back_btn');
        this.addChild(backBtn);

        const title = new PIXI.Text({
            text: 'УЛУЧШЕНИЕ',
            style: { ...headerTextStyle, fontSize: 36 }
        });
        title.anchor.set(0.5, 0);
        title.position.set(640, SAFE_MARGIN);
        makeDraggable(title, 'upg_title');
        this.addChild(title);

        const goldPanel = new CurrencyPanel('icon_gold', store.gold);
        goldPanel.position.set(840, SAFE_MARGIN);
        const gemsPanel = new CurrencyPanel('icon_gem', store.crystals);
        gemsPanel.position.set(1010, SAFE_MARGIN);
        makeDraggable(goldPanel, 'upg_gold_panel');
        makeDraggable(gemsPanel, 'upg_gems_panel');
        this.addChild(goldPanel, gemsPanel);

        // 2. Персонаж слева
        const pedestal = new PIXI.Container();
        pedestal.position.set(350, 550);
        const platform = new PIXI.Graphics();
        platform.ellipse(0, 25, 200, 45).fill({ color: 0x000000, alpha: 0.7 });
        platform.ellipse(0, 15, 180, 40).rect(-180, -5, 360, 20).fill(0x1a1a2e);
        platform.ellipse(0, -5, 180, 40).fill(0x2a2a44);
        platform.ellipse(0, -5, 165, 35).fill(0x383855).stroke({ width: 4, color: 0x11111a });
        platform.ellipse(0, -5, 140, 25).stroke({ width: 2, color: 0x4a4a6a, alpha: 0.5 });
        pedestal.addChild(platform);
        makeDraggable(pedestal, 'upg_pedestal');
        this.addChild(pedestal);

        const heroSprite = new PIXI.Graphics().roundRect(-100, -250, 200, 250, 20).fill(0xffffff);
        heroSprite.position.set(300, 550);
        makeDraggable(heroSprite, 'upg_hero_sprite');
        this.addChild(heroSprite);

        // 3. Список характеристик справа (AAA Glass Panel)
        const RIGHT_PANEL_WIDTH = 550;
        const rightContainer = new PIXI.Container();
        rightContainer.position.set(1280 - RIGHT_PANEL_WIDTH - SAFE_MARGIN, 120);
        makeDraggable(rightContainer, 'upg_right_panel');
        this.addChild(rightContainer);

        const panelBg = new GlassPanel(RIGHT_PANEL_WIDTH, 520);
        rightContainer.addChild(panelBg);

        const stats = store.getCalculatedStats('panda');
        const upgradeData = [
            { id: 'hp', icon: 'icon_hp', name: 'ЗДОРОВЬЕ', val: stats?.hp || 3250, plus: '+250', cost: '2 000', glow: 0xff3333 },
            { id: 'atk', icon: 'icon_atk', name: 'АТАКА', val: stats?.attack || 520, plus: '+40', cost: '2 200', glow: 0xff8800 },
            { id: 'spd', icon: 'icon_spd', name: 'СКОРОСТЬ', val: stats?.speed || 120, plus: '+10', cost: '1 800', glow: 0x00ffff },
            { id: 'crt', icon: 'icon_crt', name: 'КРИТ. ШАНС', val: `${((stats?.critChance || 0.25) * 100).toFixed(0)}%`, plus: '+5%', cost: '2 500', glow: 0xcc00ff }
        ];

        upgradeData.forEach((st, i) => {
            const row = new PIXI.Container();
            row.position.set(25, 40 + i * 110);
            
            if (i > 0) {
                const line = new PIXI.Graphics().moveTo(0, -15).lineTo(RIGHT_PANEL_WIDTH - 50, -15).stroke({ width: 2, color: 0x2a2b36 });
                row.addChild(line);
            }

            const iconContainer = new PIXI.Container();
            const glow = new PIXI.Graphics().circle(16, 16, 20).fill({ color: st.glow, alpha: 0.2 });
            const iconPlaceholder = new PIXI.Graphics().roundRect(0, 0, 32, 32, 8).fill(st.glow);
            iconContainer.addChild(glow, iconPlaceholder);
            iconContainer.position.set(0, 20);
            
            const nameText = new PIXI.Text({
                text: st.name,
                style: { ...baseTextStyle, fontSize: 18, fill: '#888899' }
            });
            nameText.position.set(50, 25);
            row.addChild(iconContainer, nameText);

            const valText = new PIXI.Text({
                text: st.val.toString(),
                style: { ...baseTextStyle, fontSize: 24 }
            });
            valText.anchor.set(1, 0);
            valText.position.set(300, 20);
            
            const plusText = new PIXI.Text({
                text: st.plus,
                style: { ...baseTextStyle, fontSize: 18, fill: '#4caf50', dropShadow: { alpha: 0 } }
            });
            plusText.position.set(310, 25);
            row.addChild(valText, plusText);

            const btn = new GreenButton('УЛУЧШИТЬ', st.cost, 140, 55, () => {
                // Логика покупки
            });
            btn.position.set(420, 35);
            makeDraggable(btn, `upg_stat_btn_${i}`);
            row.addChild(btn);
            makeDraggable(row, `upg_stat_row_${i}`);
        });
    }
}
