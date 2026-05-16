import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { SceneManager } from '../../engine/core/SceneManager';
import { MainScreen } from './MainScreen';
import { CombatManager } from './CombatManager';
import { useGameStore } from '../../store/useGameStore';
import { PixiApp } from '../../engine/core/PixiApp';
import { FillGradient } from 'pixi.js';
import { makeDraggable } from '../../engine/utils/Draggable';
import { SoundManager } from '../../engine/systems/SoundManager';
import { AssetsMap } from '../../configs/AssetsMap';

export class BattleScene extends PIXI.Container {
    private combatManager!: CombatManager;
    private gameLayer: PIXI.Container;
    private uiLayer: PIXI.Container;
    private bgSprite!: PIXI.Sprite;

    private playerSprite!: PIXI.Container;
    private enemySprite!: PIXI.Container;

    private playerHpFill!: PIXI.Graphics;
    private enemyHpFill!: PIXI.Graphics;

    private roundText!: PIXI.Text;
    private roundTimer: number = 45;
    private timeAccumulator: number = 0;

    private playerAtb = 0;
    private enemyAtb = 0;
    private isAnimatingAttack = false;
    private isZoomed = false;

    private updateLoop!: (dt: number) => void;

    constructor() {
        super();

        this.gameLayer = new PIXI.Container();
        this.uiLayer = new PIXI.Container();
        this.addChild(this.gameLayer, this.uiLayer);

        const store = useGameStore.getState();

        // Проверка энергии перед боем
        if (!store.consumeEnergy()) {
            const txt = new PIXI.Text({
                text: 'ГЕРОЙ УСТАЛ. НЕТ ЭНЕРГИИ!',
                style: { fontFamily: 'Arial Black', fontSize: 48, fill: '#ff2222', dropShadow: { alpha: 1 } },
            });
            txt.anchor.set(0.5);
            txt.position.set(640, 360);
            this.addChild(txt);
            setTimeout(() => SceneManager.getInstance().switchScene(new MainScreen()), 2000);
            return;
        }

        this.combatManager = new CombatManager(store.currentHeroId, 'boar');

        this.buildArena();
        this.buildFighters();
        this.buildHUD();
    }

    private resize() {
        if (!this.bgSprite || !this.bgSprite.texture) return;
        const bgWidth = this.bgSprite.texture.width;
        const bgHeight = this.bgSprite.texture.height;
        const scale = Math.max(1920 / bgWidth, 1080 / bgHeight);
        this.bgSprite.scale.set(scale);
    }

    private buildArena() {
        // Загрузка нового фона арены с фиксированной позицией 960x540
        this.bgSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.bgSprite.anchor.set(0.5);
        this.bgSprite.position.set(960, 540);

        PIXI.Assets.load({ src: AssetsMap.BACKGROUNDS.BATTLE_ARENA })
            .then((tex) => {
                this.bgSprite.texture = tex;
                this.resize();
            })
            .catch((e) => console.error('Battle background asset not found.', e));

        this.gameLayer.addChild(this.bgSprite);
    }

    private buildFighters() {
        const emojis: Record<string, string> = { panda: '🐼', moose: '🫎', goose: '🦢', cat: '🐱', boar: '🐗' };

        // Pedestals removed for this scene. Characters stand on the ground.

        // 2. High-Res Sprites with Emoji Fallback
        const createFighter = (id: string, isEnemy: boolean, x: number, y: number) => {
            const container = new PIXI.Container();
            container.position.set(x, y);

            // Пытаемся получить текстуру из загруженных ассетов
            let tex: PIXI.Texture;
            try {
                tex = PIXI.Assets.get(id) || PIXI.Texture.WHITE;
            } catch {
                tex = PIXI.Texture.WHITE;
            }

            const sprite = new PIXI.Sprite(tex);
            sprite.anchor.set(0.5, 1);
            sprite.scale.set(1.5);
            if (isEnemy) sprite.scale.x = -1.5; // Зеркально отражаем врага

            if (tex === PIXI.Texture.WHITE || tex.width <= 1) {
                const fallback = new PIXI.Text({
                    text: emojis[id] || '🐼',
                    style: { fontSize: 450, dropShadow: { color: '#000000', alpha: 0.8, blur: 20, distance: 15 } },
                });
                fallback.anchor.set(0.5, 1);
                if (isEnemy) fallback.scale.x = -1;
                container.addChild(fallback);
            } else {
                container.addChild(sprite);
            }

            return container;
        };

        // Player (Left)
        this.playerSprite = createFighter(this.combatManager.playerHeroId, false, 500, 960);

        // Enemy (Right)
        this.enemySprite = createFighter(this.combatManager.enemyHeroId, true, 1420, 960);

        // Idle Breathing Animation
        gsap.to(this.playerSprite.scale, {
            y: 0.97,
            x: 1.03,
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
        gsap.to(this.enemySprite.scale, {
            y: 0.97,
            x: 1.03,
            duration: 1.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.2,
        });

        this.gameLayer.addChild(this.playerSprite, this.enemySprite);
        makeDraggable(this.playerSprite, 'battle_player_sprite');
        makeDraggable(this.enemySprite, 'battle_enemy_sprite');

        // Floating HP Bars
        const createHpBar = (name: string, lvl: number, isPlayer: boolean, x: number, y: number) => {
            const container = new PIXI.Container();
            container.position.set(x, y);

            const bg = new PIXI.Graphics()
                .roundRect(-120, 0, 240, 24, 12)
                .fill(0x111111)
                .stroke({ width: 2, color: 0x333333 });
            const fill = new PIXI.Graphics().roundRect(-120, 0, 240, 24, 12).fill(isPlayer ? 0x00ffaa : 0xff2222);

            const txt = new PIXI.Text({
                text: `${name} Ур.${lvl}`,
                style: { fontFamily: 'Arial Black', fontSize: 16, fill: '#fff', stroke: { color: '#000', width: 4 } },
            });
            txt.anchor.set(0.5, 1);
            txt.position.set(0, -5);

            container.addChild(bg, fill, txt);
            this.uiLayer.addChild(container);
            makeDraggable(container, `battle_hp_bar_${isPlayer ? 'player' : 'enemy'}`);
            return fill;
        };

        this.playerHpFill = createHpBar('ПАНДА', 5, true, 500, 450);
        this.enemyHpFill = createHpBar('КАБАН', 6, false, 1420, 450);
    }

    private buildHUD() {
        // Round Indicator & Timer
        this.roundText = new PIXI.Text({
            text: 'РАУНД 1\n00:45',
            style: {
                fontFamily: 'Arial Black',
                fontSize: 36,
                fill: '#ffcc00',
                align: 'center',
                stroke: { color: '#331100', width: 6 },
                dropShadow: { color: '#000000', alpha: 1, distance: 4, blur: 4, angle: Math.PI / 6 },
            },
        });
        this.roundText.anchor.set(0.5, 0);
        this.roundText.position.set(960, 20);
        this.uiLayer.addChild(this.roundText);
        makeDraggable(this.roundText, 'battle_round_text');

        // 4 Square Action Buttons (Glossy Plastic)
        const skills = ['🥊', '⚔️', '🛡', '🔥'];
        skills.forEach((icon, i) => {
            const btn = new PIXI.Graphics();
            btn.roundRect(0, 0, 80, 80, 16).fill(0x1a1a2e).stroke({ width: 3, color: 0x4a4a6a });
            // Gloss highlight to emulate NineSlice
            btn.roundRect(4, 4, 72, 30, 12).fill({ color: 0xffffff, alpha: 0.1 });
            btn.position.set(735 + i * 110, 950); // Центрируем 4 скилла для 1920

            const txt = new PIXI.Text({
                text: icon,
                style: { fontSize: 40 },
            });
            txt.anchor.set(0.5);
            txt.position.set(40, 40);
            btn.addChild(txt);

            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.on('pointerdown', () => {
                gsap.to(btn.scale, { x: 0.9, y: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
                if (this.combatManager.isBattleActive) this.executeAttack('player');
            });
            this.uiLayer.addChild(btn);
            makeDraggable(btn, `battle_skill_btn_${i}`);
        });

        // Текст энергии снизу
        const store = useGameStore.getState();
        const energyTxt = new PIXI.Text({
            text: `⚡ ЭНЕРГИЯ: ${store.energy} / ${store.maxEnergy}`,
            style: { fontFamily: 'Arial Black', fontSize: 24, fill: '#00ccff' },
        });
        energyTxt.anchor.set(0.5);
        energyTxt.position.set(960, 1040);
        this.uiLayer.addChild(energyTxt);
        makeDraggable(energyTxt, 'battle_energy_text');
    }

    public tick(dt: number) {
        if (!this.combatManager.isBattleActive) return;

        // Timer Logic (assuming ~60fps)
        this.timeAccumulator += dt;
        if (this.timeAccumulator >= 60) {
            this.timeAccumulator = 0;
            this.roundTimer = Math.max(0, this.roundTimer - 1);
            const s = this.roundTimer.toString().padStart(2, '0');
            this.roundText.text = `РАУНД 1\n00:${s}`;

            if (this.roundTimer <= 0) {
                this.combatManager.isBattleActive = false;
                this.handleWin('enemy'); // Timeout -> Lose
            }
        }

        // Авто-бой (ATB System)
        if (this.isAnimatingAttack) return;

        const store = useGameStore.getState();
        const pSpeed = store.getCalculatedStats(this.combatManager.playerHeroId)?.speed || 2.0;
        const eSpeed = store.getCalculatedStats(this.combatManager.enemyHeroId)?.speed || 2.0;

        this.playerAtb += pSpeed * dt;
        this.enemyAtb += eSpeed * dt;

        if (this.playerAtb >= 150) {
            this.playerAtb = 0;
            this.isAnimatingAttack = true;
            this.executeAttack('player');
        } else if (this.enemyAtb >= 150) {
            this.enemyAtb = 0;
            this.isAnimatingAttack = true;
            this.executeAttack('enemy');
        }
    }

    private shakeScreen(intensity: number) {
        gsap.to(this.gameLayer, {
            x: `+=${(Math.random() - 0.5) * intensity}`,
            y: `+=${(Math.random() - 0.5) * intensity}`,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            onComplete: () => this.gameLayer.position.set(0, 0),
        });
    }

    private checkCameraZoom() {
        if (this.combatManager.enemyHp / this.combatManager.enemyMaxHp <= 0.2 && !this.isZoomed) {
            this.isZoomed = true;
            // Cinematic zoom in
            gsap.to(this.gameLayer.scale, { x: 1.15, y: 1.15, duration: 1.0, ease: 'power2.out' });
            gsap.to(this.gameLayer.position, { x: -80, y: -60, duration: 1.0, ease: 'power2.out' });
        }
    }

    private executeAttack(attacker: 'player' | 'enemy', isDoubleHitFollowup = false) {
        if (!this.combatManager.isBattleActive) return;

        const source = attacker === 'player' ? this.playerSprite : this.enemySprite;
        const target = attacker === 'player' ? this.enemySprite : this.playerSprite;

        const originalX = attacker === 'player' ? 500 : 1420;
        const dashOffset = attacker === 'player' ? 450 : -450;

        const result = this.combatManager.calculateAttack(attacker);

        gsap.to(source, {
            x: target.x - dashOffset,
            duration: 0.15,
            ease: 'power2.in',
            onComplete: () => {
                if (result.isDodge) {
                    this.spawnTextPopup(target.x, target.y - 150, 'УКЛОНЕНИЕ', 0xaaaaaa);
                } else {
                    this.combatManager.takeDamage(attacker === 'player' ? 'enemy' : 'player', result.damage);

                    this.shakeScreen(result.isCrit ? 40 : 15);
                    this.spawnImpactStar(target.x, target.y - 120);
                    this.spawnDamagePopup(
                        target.x + (Math.random() * 40 - 20),
                        target.y - 180,
                        result.damage,
                        result.isCrit,
                    );

                    gsap.to(this.playerHpFill.scale, {
                        x: Math.max(0, this.combatManager.playerHp / this.combatManager.playerMaxHp),
                        duration: 0.3,
                    });
                    gsap.to(this.enemyHpFill.scale, {
                        x: Math.max(0, this.combatManager.enemyHp / this.combatManager.enemyMaxHp),
                        duration: 0.3,
                    });
                    this.checkCameraZoom();
                }

                gsap.to(source, {
                    x: originalX,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        const winner = this.combatManager.checkWinCondition();
                        if (winner) {
                            this.combatManager.isBattleActive = false;
                            this.handleWin(winner);
                        } else if (result.isDoubleHit && !isDoubleHitFollowup) {
                            this.spawnTextPopup(source.x, source.y - 200, 'ДВОЙНОЙ УДАР!', 0x00ffff);
                            setTimeout(() => this.executeAttack(attacker, true), 100);
                        } else {
                            this.isAnimatingAttack = false;
                        }
                    },
                });
            },
        });
    }

    private spawnImpactStar(x: number, y: number) {
        // Отрисовка звезды через полигон (замена отсутствующему drawStar)
        const starPath = [0, -50, 15, -15, 50, -15, 20, 5, 30, 45, 0, 20, -30, 45, -20, 5, -50, -15, -15, -15];
        const star = new PIXI.Graphics().poly(starPath).fill(0xffffff);
        star.position.set(x, y);
        this.gameLayer.addChild(star);

        gsap.to(star.scale, { x: 2, y: 2, duration: 0.2 });
        gsap.to(star, { alpha: 0, duration: 0.2, ease: 'power2.out', onComplete: () => star.destroy() });
    }

    private spawnDamagePopup(x: number, y: number, amount: number, isCrit: boolean) {
        const text = new PIXI.Text({
            text: amount.toString(),
            style: {
                fontFamily: 'Impact',
                fontSize: isCrit ? 100 : 50,
                fill: isCrit ? '#ff2222' : '#ffffff',
                stroke: { color: '#000000', width: 8 },
                dropShadow: { color: '#000000', alpha: 1, distance: 4, blur: 4, angle: Math.PI / 6 },
            },
        });
        text.anchor.set(0.5);
        text.position.set(x, y);
        this.gameLayer.addChild(text);

        if (isCrit) {
            gsap.fromTo(text, { x: x - 15 }, { x: x + 15, duration: 0.05, yoyo: true, repeat: 5 });
        } else {
            gsap.to(text, { rotation: (Math.random() - 0.5) * 0.5, duration: 1.2 });
        }

        gsap.to(text, { y: y - 180, alpha: 0, duration: 1.2, ease: 'power2.out', onComplete: () => text.destroy() });
    }

    private spawnTextPopup(x: number, y: number, msg: string, color: number) {
        const text = new PIXI.Text({
            text: msg,
            style: { fontFamily: 'Arial Black', fontSize: 32, fill: color, stroke: { color: '#000000', width: 6 } },
        });
        text.anchor.set(0.5);
        text.position.set(x, y);
        this.gameLayer.addChild(text);
        gsap.to(text, { y: y - 100, duration: 1.0, ease: 'power2.out' });
        gsap.to(text, { alpha: 0, duration: 0.5, delay: 0.5, onComplete: () => text.destroy() });
    }

    private handleWin(winner: 'player' | 'enemy') {
        PixiApp.getInstance().removeUpdateLoop(this.updateLoop);

        // Музыкальное сопровождение результата
        if (winner === 'player') {
            SoundManager.getInstance().playVictory();
        } else {
            SoundManager.getInstance().playDefeat();
        }

        const overlay = new PIXI.Graphics().rect(0, 0, 1920, 1080).fill({ color: 0x000000, alpha: 0.7 });
        overlay.alpha = 0;
        this.addChild(overlay);
        gsap.to(overlay, { alpha: 1, duration: 1 });

        const modal = new PIXI.Container();
        const bg = new PIXI.Graphics()
            .roundRect(-300, -200, 600, 450, 24)
            .fill(0x1a1a2e)
            .stroke({ width: 4, color: winner === 'player' ? 0xffcc00 : 0x555555 });
        modal.addChild(bg);
        modal.position.set(960, -400); // Slide from top

        const gradient = new FillGradient(0, 0, 0, 64);
        gradient.addColorStop(0, 0xffff00);
        gradient.addColorStop(1, 0xff0000);

        const title = new PIXI.Text({
            text: winner === 'player' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ',
            style: {
                fontFamily: 'Arial Black',
                fontSize: 64,
                fill: winner === 'player' ? gradient : '#aaaaaa',
                dropShadow: { color: '#000000', alpha: 1, distance: 6, blur: 4, angle: Math.PI / 6 },
            },
        });
        title.anchor.set(0.5);
        title.position.set(0, -130);
        modal.addChild(title);

        const xpBg = new PIXI.Graphics().roundRect(-200, -20, 400, 24, 12).fill(0x000000);
        const xpFill = new PIXI.Graphics().roundRect(-200, -20, 0, 24, 12).fill(0x00ffaa);
        modal.addChild(xpBg, xpFill);

        // Начисление наград по ТЗ
        const store = useGameStore.getState();
        const isWin = winner === 'player';
        const earnedGold = isWin ? 7 : 1;
        const earnedXp = isWin ? 5 : 1;
        store.addGold(earnedGold);
        store.addExp(earnedXp);

        const lootBox = new PIXI.Graphics().roundRect(-150, 60, 300, 80, 16).fill(0x2a2a40);
        const lootIcon = new PIXI.Text({
            text: '💰',
            style: {
                fontSize: 48,
                dropShadow: { color: '#000000', alpha: 1, distance: 3, blur: 4, angle: Math.PI / 6 },
            },
        });
        lootIcon.anchor.set(0.5);
        lootIcon.position.set(-80, 100);
        const lootText = new PIXI.Text({
            text: `+${earnedGold} ЗОЛОТА`,
            style: { fontSize: 24, fill: '#ffcc00', fontWeight: 'bold' },
        });
        lootText.anchor.set(0, 0.5);
        lootText.position.set(-30, 100);

        modal.addChild(lootBox, lootIcon, lootText);

        const btn = new PIXI.Graphics().roundRect(-120, 170, 240, 50, 25).fill(0x0088ff);
        const btnText = new PIXI.Text({
            text: 'В МЕНЮ',
            style: { fontSize: 24, fill: '#ffffff', fontWeight: 'bold' },
        });
        btnText.anchor.set(0.5);
        btnText.position.set(0, 195);
        btn.addChild(btnText);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => SceneManager.getInstance().switchScene(new MainScreen()));
        modal.addChild(btn);

        makeDraggable(modal, 'battle_modal');
        makeDraggable(title, 'battle_modal_title');
        makeDraggable(xpBg, 'battle_modal_xp_bg');
        makeDraggable(lootBox, 'battle_modal_lootbox');
        makeDraggable(lootIcon, 'battle_modal_looticon');
        makeDraggable(lootText, 'battle_modal_loottext');
        makeDraggable(btn, 'battle_modal_btn');

        this.addChild(modal);

        gsap.to(modal, {
            y: 540,
            duration: 0.8,
            ease: 'back.out(1.2)',
            delay: 1,
            onComplete: () => {
                if (winner === 'player') gsap.to(xpFill, { width: 400, duration: 1.5, ease: 'power2.out' });
            },
        });
    }
}
