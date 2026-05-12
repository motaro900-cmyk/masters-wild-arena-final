import * as PIXI from 'pixi.js';
import { Sprite, Container, Text, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { BattleResultData } from '../components/hud/BattleResultScreen';
import { AssetsMap } from '../../configs/AssetsMap';
import { resolveAssetPath } from '../../utils/assetPath';
import { useGameStore } from '../../store/useGameStore';

const ENEMY_NAMES: Record<string, string> = {
    'лось.webp': 'Лось',
    'тигр.webp': 'Тигр',
    'лев.webp': 'Лев',
    'медведь.webp': 'Медведь',
    'кабан.webp': 'Кабан',
    'крокодил.webp': 'Крокодил',
};

export class BattleScreen extends Container {
    private bg: Sprite;
    private player!: Sprite;
    private enemy!: Sprite;
    private uiLayer: Container;
    private playerHpBar!: Graphics;
    private enemyHpBar!: Graphics;
    private playerHpLabel!: Text;
    private enemyHpLabel!: Text;

    private playerHp = 100;
    private playerMaxHp = 100;
    private enemyHp = 100;
    private enemyMaxHp = 100;
    
    private playerStats: any = null;
    private enemyStats: any = null;

    private isBattleOver = false;

    // Статистика матча
    private totalDamageDealt = 0;
    private turnsPlayed = 0;
    private enemyFileName = 'лось.webp';

    // Callback для передачи результата в React
    public onBattleEnd: ((result: BattleResultData) => void) | null = null;

    constructor() {
        super();
        this.label = 'BattleScreen'; // Для SceneManager
        this.bg = new Sprite();
        this.addChild(this.bg);
        this.uiLayer = new Container();
        this.addChild(this.uiLayer);
        this.init();
    }

    private async init() {
        try {
            // ПОЛУЧАЕМ ДАННЫЕ ИГРОКА ИЗ СТОРА
            const store = useGameStore.getState();
            const calcStats = store.getCalculatedStats(store.selectedHeroId);
            this.playerStats = calcStats;
            
            this.playerHp = calcStats.hp;
            this.playerMaxHp = calcStats.hp;

            // ГЕНЕРИРУЕМ ВРАГА (чуть слабее или сильнее игрока для баланса)
            this.enemyStats = {
                hp: Math.floor(calcStats.hp * (0.8 + Math.random() * 0.4)),
                attack: Math.floor(calcStats.attack * (0.7 + Math.random() * 0.3)),
                speed: calcStats.speed * (0.8 + Math.random() * 0.4),
                critChance: 0.1,
                defense: Math.floor(calcStats.defense * 0.5)
            };
            this.enemyHp = this.enemyStats.hp;
            this.enemyMaxHp = this.enemyStats.hp;

            // ФОН АРЕНЫ
            const bgTex = await PIXI.Assets.load(AssetsMap.BACKGROUNDS.BATTLE_ARENA);
            this.bg.texture = bgTex;
            this.bg.width = 1920;
            this.bg.height = 1080;

            // ИГРОК (ПАНДА)
            const pandaTex = await PIXI.Assets.load(AssetsMap.CHARACTERS.PANDA_FULL);
            this.player = new Sprite(pandaTex);
            this.player.anchor.set(0.5);
            this.player.position.set(450, 750);
            this.player.scale.set(0.9);
            this.addChildAt(this.player, 1);

            // ВРАГ (СЛУЧАЙНЫЙ) — правая сторона
            const enemies = ['лось.webp', 'тигр.webp', 'лев.webp', 'медведь.webp', 'кабан.webp', 'крокодил.webp'];
            this.enemyFileName = enemies[Math.floor(Math.random() * enemies.length)];
            const enemyTex = await PIXI.Assets.load(resolveAssetPath(`/assets/images/avatars/${this.enemyFileName}`));
            this.enemy = new Sprite(enemyTex);
            this.enemy.anchor.set(0.5);
            this.enemy.position.set(1520, 720);
            this.enemy.scale.set(1.0);
            this.enemy.scale.x = -1.0; // Смотрит влево
            this.addChildAt(this.enemy, 2);

            // UI поверх всего
            this.addChild(this.uiLayer);
            this.createUI();

            // Задержка перед стартом — драматичность
            await this.delay(800);
            this.startBattleLoop();

        } catch (e) {
            console.error('[BattleScreen] Failed to load assets:', e);
        }
    }

    private createUI() {
        // ФОНОВЫЕ ПЛАШКИ HP БАРОВ
        const playerBg = new Graphics();
        playerBg.roundRect(60, 30, 500, 55, 10).fill({ color: 0x000000, alpha: 0.6 });
        playerBg.roundRect(60, 30, 500, 55, 10).stroke({ color: 0xc48b3b, width: 2, alpha: 0.6 });
        this.uiLayer.addChild(playerBg);

        const enemyBg = new Graphics();
        enemyBg.roundRect(1360, 30, 500, 55, 10).fill({ color: 0x000000, alpha: 0.6 });
        enemyBg.roundRect(1360, 30, 500, 55, 10).stroke({ color: 0xef4444, width: 2, alpha: 0.6 });
        this.uiLayer.addChild(enemyBg);

        // HP БАРЫ
        this.playerHpBar = new Graphics();
        this.enemyHpBar = new Graphics();
        this.uiLayer.addChild(this.playerHpBar);
        this.uiLayer.addChild(this.enemyHpBar);

        // ИМЕНА
        const store = useGameStore.getState();
        const playerName = new Text({
            text: store.selectedHeroId === 'panda' ? 'ПАНДА' : 'БОЕЦ',
            style: { fill: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }
        });
        playerName.position.set(70, 33);
        this.uiLayer.addChild(playerName);

        const enemyName = new Text({
            text: (ENEMY_NAMES[this.enemyFileName] ?? 'ВРАГ').toUpperCase(),
            style: { fill: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }
        });
        enemyName.anchor.set(1, 0);
        enemyName.position.set(1855, 33);
        this.uiLayer.addChild(enemyName);

        // HP ЛЕЙБЛЫ
        this.playerHpLabel = new Text({
            text: `${Math.ceil(this.playerHp)}/${this.playerMaxHp}`,
            style: { fill: '#ffffff', fontSize: 16, fontWeight: 'bold' }
        });
        this.playerHpLabel.position.set(70, 58);
        this.uiLayer.addChild(this.playerHpLabel);

        this.enemyHpLabel = new Text({
            text: `${Math.ceil(this.enemyHp)}/${this.enemyMaxHp}`,
            style: { fill: '#ffffff', fontSize: 16, fontWeight: 'bold' }
        });
        this.enemyHpLabel.anchor.set(1, 0);
        this.enemyHpLabel.position.set(1855, 58);
        this.uiLayer.addChild(this.enemyHpLabel);

        // VS ТЕКСТ
        const vsText = new Text({
            text: 'VS',
            style: {
                fill: '#fbbf24',
                fontSize: 72,
                fontWeight: 'bold',
                stroke: { color: '#000', width: 8 },
                dropShadow: { color: '#000', blur: 10, distance: 4 }
            }
        });
        vsText.anchor.set(0.5);
        vsText.position.set(960, 55);
        this.uiLayer.addChild(vsText);

        this.updateHpBars();
    }

    private updateHpBars() {
        const pPct = Math.max(0, this.playerHp) / this.playerMaxHp;
        const ePct = Math.max(0, this.enemyHp) / this.enemyMaxHp;

        const pColor = pPct > 0.5 ? 0x22c55e : pPct > 0.25 ? 0xf59e0b : 0xef4444;
        const eColor = ePct > 0.5 ? 0xef4444 : ePct > 0.25 ? 0xf59e0b : 0x7f1d1d;

        this.playerHpBar.clear();
        this.playerHpBar.roundRect(65, 40, 480 * pPct, 30, 6).fill(pColor);

        this.enemyHpBar.clear();
        this.enemyHpBar.roundRect(1365 + 480 * (1 - ePct), 40, 480 * ePct, 30, 6).fill(eColor);

        this.playerHpLabel.text = `${Math.ceil(Math.max(0, this.playerHp))}/${this.playerMaxHp}`;
        this.enemyHpLabel.text = `${Math.ceil(Math.max(0, this.enemyHp))}/${this.enemyMaxHp}`;
    }

    private async startBattleLoop() {
        while (!this.isBattleOver) {
            // ХОД ИГРОКА
            await this.delay(1000 / (this.playerStats.speed || 1));
            if (this.isBattleOver) break;

            const baseDmg = this.playerStats.attack;
            const isCrit = Math.random() < this.playerStats.critChance;
            const rawDmg = baseDmg * (0.9 + Math.random() * 0.2) * (isCrit ? 1.8 : 1);
            const finalDmg = Math.ceil(Math.max(1, rawDmg - (this.enemyStats.defense * 0.3)));

            await this.attack(this.player, this.enemy, finalDmg, isCrit, 'PLAYER');
            this.enemyHp -= finalDmg;
            this.totalDamageDealt += finalDmg;
            this.updateHpBars();

            if (this.enemyHp <= 0) {
                this.turnsPlayed++;
                this.isBattleOver = true;
                await this.delay(500);
                this.endBattle(true);
                break;
            }

            // ХОД ВРАГА
            await this.delay(1000 / (this.enemyStats.speed || 1));
            if (this.isBattleOver) break;

            const enemyBaseDmg = this.enemyStats.attack;
            const enemyCrit = Math.random() < this.enemyStats.critChance;
            const rawEnemyDmg = enemyBaseDmg * (0.9 + Math.random() * 0.2) * (enemyCrit ? 1.6 : 1);
            const finalEnemyDmg = Math.ceil(Math.max(1, rawEnemyDmg - (this.playerStats.defense * 0.3)));

            await this.attack(this.enemy, this.player, finalEnemyDmg, enemyCrit, 'ENEMY');
            this.playerHp -= finalEnemyDmg;
            this.updateHpBars();

            this.turnsPlayed++;

            if (this.playerHp <= 0) {
                this.isBattleOver = true;
                await this.delay(500);
                this.endBattle(false);
                break;
            }
        }
    }

    private attack(attacker: Sprite, target: Sprite, damage: number, isCrit: boolean, side: string): Promise<void> {
        return new Promise((resolve) => {
            const dir = side === 'PLAYER' ? 1 : -1;
            const startX = attacker.x;

            // Рывок к цели
            gsap.timeline({ onComplete: resolve })
                .to(attacker, { x: startX + 200 * dir, duration: 0.18, ease: 'power2.in' })
                .to(attacker, { x: startX, duration: 0.25, ease: 'power2.out' }, '+=0.05')
                .add(() => {
                    this.shake(target);
                    this.showDamageNumber(target, damage, isCrit);
                    if (isCrit) this.screenFlash();
                }, '-=0.25');
        });
    }

    private shake(obj: Sprite) {
        const startX = obj.x;
        gsap.to(obj, {
            x: startX + 18,
            duration: 0.06,
            repeat: 5,
            yoyo: true,
            onComplete: () => { obj.x = startX; }
        });
    }

    private screenFlash() {
        const flash = new Graphics();
        flash.rect(0, 0, 1920, 1080).fill({ color: 0xffffff, alpha: 0.12 });
        this.uiLayer.addChild(flash);
        gsap.to(flash, { alpha: 0, duration: 0.3, onComplete: () => flash.destroy() });
    }

    private showDamageNumber(target: Sprite, damage: number, isCrit: boolean) {
        const text = new Text({
            text: isCrit ? `💥 ${damage}!` : `-${damage}`,
            style: {
                fill: isCrit ? '#fbbf24' : '#f87171',
                fontSize: isCrit ? 56 : 40,
                fontWeight: 'bold',
                stroke: { color: '#000', width: 5 },
                dropShadow: { color: '#000', blur: 5, distance: 2 }
            }
        });
        text.anchor.set(0.5);
        text.position.set(target.x + (Math.random() - 0.5) * 60, target.y - 80);
        this.uiLayer.addChild(text);

        gsap.to(text, {
            y: text.y - 100,
            alpha: 0,
            duration: 1.2,
            ease: 'power2.out',
            onComplete: () => text.destroy()
        });

        if (isCrit) {
            gsap.fromTo(text, { scale: 0.5 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
        }
    }

    private endBattle(isVictory: boolean) {
        const resultData: BattleResultData = {
            isVictory,
            goldEarned: isVictory ? Math.floor(Math.random() * 50) + 30 : Math.floor(Math.random() * 15) + 5,
            xpEarned: isVictory ? Math.floor(Math.random() * 80) + 50 : Math.floor(Math.random() * 30) + 10,
            trophiesChange: isVictory ? Math.floor(Math.random() * 20) + 15 : -(Math.floor(Math.random() * 10) + 5),
            damageDealt: this.totalDamageDealt,
            turnsPlayed: this.turnsPlayed,
            enemyName: ENEMY_NAMES[this.enemyFileName] ?? 'Противник',
        };

        if (this.onBattleEnd) {
            this.onBattleEnd(resultData);
        }
    }

    private delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
}
