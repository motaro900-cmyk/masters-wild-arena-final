import * as PIXI from 'pixi.js';
import { HeroUnit } from '../entities/HeroUnit';
import { AssetsMap } from '../../configs/AssetsMap';
import { audioService } from '../../services/AudioService';
import { PixiApp } from './PixiApp';

export interface BattleState {
    playerHP: number;
    playerMaxHP: number;
    enemyHP: number;
    enemyMaxHP: number;
    log: string;
}

export interface ICombatStats {
    hp: number;
    attack: number;
    speed: number;
    critChance: number;
    defense: number;
    dodge: number;
}

export class BattleEngine {
    private player: HeroUnit | null = null;
    private enemy: HeroUnit | null = null;
    private atlasTexture: PIXI.Texture | null = null;
    
    private playerStats: ICombatStats | null = null;
    private enemyStats: ICombatStats | null = null;

    private playerAttackTimer: number = 0;
    private enemyAttackTimer: number = 0;
    private isCombatRunning: boolean = false;
    private time: number = 0;
    
    public onStateChange: (state: BattleState) => void = () => {};
    private state: BattleState = { playerHP: 100, playerMaxHP: 100, enemyHP: 100, enemyMaxHP: 100, log: 'ПОДГОТОВКА...' };

    private updateCallback: ((dt: number) => void) | null = null;

    constructor() {}

    async init(_container: HTMLElement, _heroId: string, playerStats: ICombatStats, enemyStats: ICombatStats) {
        try {
            this.playerStats = playerStats;
            this.enemyStats = enemyStats;

            const pixiApp = PixiApp.getInstance();

            // Загрузка ассетов
            const [bgTex, atlasTex] = await Promise.all([
                PIXI.Assets.load(AssetsMap.BACKGROUNDS.BATTLE_ARENA).catch(_ => PIXI.Texture.WHITE),
                PIXI.Assets.load(AssetsMap.CHARACTERS.PANDA_ATLAS).catch(_ => PIXI.Texture.WHITE)
            ]);
            this.atlasTexture = atlasTex;

            const background = new PIXI.Sprite(bgTex);
            background.width = 1920; 
            background.height = 1080;
            pixiApp.backgroundLayer.addChild(background);

            // Создание бойцов
            this.player = new HeroUnit(this.getFrame(0));
            this.player.x = 480; this.player.y = 860;
            this.player.scale.set(0.42);
            
            // Загрузка оружия (если есть)
            // if (playerStats.weaponTexture) await this.player.loadWeapon(playerStats.weaponTexture);

            this.enemy = new HeroUnit(this.atlasTexture!);
            this.enemy.x = 1440; this.enemy.y = 860;
            this.enemy.scale.set(-0.42, 0.42);
            this.enemy.mainSprite.tint = 0x9999ff;

            pixiApp.gameLayer.addChild(this.player, this.enemy);

            // Инициализация HP
            this.updateState({
                playerHP: playerStats.hp,
                playerMaxHP: playerStats.hp,
                enemyHP: enemyStats.hp,
                enemyMaxHP: enemyStats.hp,
                log: 'БИТВА НАЧИНАЕТСЯ!'
            });

            // Игровой цикл
            this.updateCallback = (dt: number) => {
                const delta = dt;
                this.time += delta;
                
                // Анимация дыхания
                if (this.player) this.player.y = 860 + Math.sin(this.time / 500) * 5;
                if (this.enemy) this.enemy.y = 860 + Math.sin(this.time / 500 + 1) * 5;

                // Логика боя (автобой по таймерам)
                if (this.isCombatRunning) {
                    this.updateTimers(delta);
                }
            };
            pixiApp.addUpdateLoop(this.updateCallback);

            setTimeout(() => {
                this.isCombatRunning = true;
                this.playerAttackTimer = 1000 / playerStats.speed;
                this.enemyAttackTimer = 1000 / enemyStats.speed;
            }, 1500);

        } catch (error) {
            console.error("BattleEngine initialization failed:", error);
            this.updateState({ log: 'ОШИБКА ЗАГРУЗКИ БОЯ' });
        }
    }

    private updateTimers(delta: number) {
        if (this.state.playerHP <= 0 || this.state.enemyHP <= 0) {
            this.isCombatRunning = false;
            this.updateState({ log: this.state.playerHP > 0 ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...' });
            return;
        }

        this.playerAttackTimer -= delta;
        this.enemyAttackTimer -= delta;

        if (this.playerAttackTimer <= 0) {
            this.executeAttack(this.player!, this.enemy!, true);
            this.playerAttackTimer = (2000 / this.playerStats!.speed) + (Math.random() * 500);
        }

        if (this.enemyAttackTimer <= 0 && this.state.enemyHP > 0) {
            this.executeAttack(this.enemy!, this.player!, false);
            this.enemyAttackTimer = (2000 / this.enemyStats!.speed) + (Math.random() * 500);
        }
    }

    private getFrame(index: number) {
        if (!this.atlasTexture) return PIXI.Texture.EMPTY;
        const FRAME_W = 568; const FRAME_H = 941;
        const col = index % 4; const row = Math.floor(index / 4);
        return new PIXI.Texture({
            source: this.atlasTexture.source,
            frame: new PIXI.Rectangle(col * FRAME_W + 10, row * FRAME_H + 10, FRAME_W - 20, FRAME_H - 20)
        });
    }

    private async executeAttack(attacker: HeroUnit, victim: HeroUnit, isPlayer: boolean) {
        if (!this.isCombatRunning) return;

        const startX = attacker.x;
        const targetX = victim.x - (120 * (isPlayer ? 1 : -1));
        
        // Анимация прыжка
        attacker.setFrame(this.getFrame(1), 1);
        const duration = 300;
        let start = Date.now();
        while (Date.now() - start < duration) {
            const t = (Date.now() - start) / duration;
            attacker.x = startX + (targetX - startX) * (t * (2 - t));
            await new Promise(r => requestAnimationFrame(r));
        }

        // УДАР
        attacker.setFrame(this.getFrame(6), 6);
        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
        this.applyShake(10);
        
        // Расчет урона
        const stats = isPlayer ? this.playerStats! : this.enemyStats!;
        const targetStats = isPlayer ? this.enemyStats! : this.playerStats!;
        
        let damage = stats.attack * (0.9 + Math.random() * 0.2); // +/- 10%
        const isCrit = Math.random() < stats.critChance;
        if (isCrit) damage *= 2;
        
        // Учет защиты
        const mitigated = Math.max(0, damage - (targetStats.defense * 0.5));
        const finalDamage = Math.ceil(mitigated);

        this.updateState({ log: `${isPlayer ? 'ВЫ' : 'ВРАГ'} ${isCrit ? 'КРИТУЕТ' : 'БЬЕТ'} НА ${finalDamage}!` });
        
        if (isPlayer) this.updateState({ enemyHP: Math.max(0, this.state.enemyHP - finalDamage) });
        else this.updateState({ playerHP: Math.max(0, this.state.playerHP - finalDamage) });

        victim.mainSprite.tint = 0xFF4444;
        setTimeout(() => { if(victim.mainSprite) victim.mainSprite.tint = isPlayer ? 0x9999ff : 0xFFFFFF; }, 150);
        victim.setFrame(this.getFrame(2), 2);

        await new Promise(r => setTimeout(r, 200));
        
        // Возврат
        attacker.setFrame(this.getFrame(1), 1);
        start = Date.now();
        while (Date.now() - start < duration) {
            const t = (Date.now() - start) / duration;
            attacker.x = targetX + (startX - targetX) * (t * t);
            await new Promise(r => requestAnimationFrame(r));
        }
        attacker.x = startX;
        attacker.setFrame(this.getFrame(0), 0);
        victim.setFrame(this.getFrame(0), 0);
    }

    private applyShake(intensity: number) {
        PixiApp.getInstance().screenShake(intensity);
    }

    private updateState(patch: Partial<BattleState>) {
        this.state = { ...this.state, ...patch };
        this.onStateChange(this.state);
    }

    public destroy() {
        const pixiApp = PixiApp.getInstance();
        if (this.updateCallback) {
            pixiApp.removeUpdateLoop(this.updateCallback);
        }
        // Clear battle sprites from layers
        pixiApp.backgroundLayer.removeChildren().forEach(child => child.destroy({ children: true, texture: true }));
        pixiApp.gameLayer.removeChildren().forEach(child => child.destroy({ children: true, texture: true }));
    }
}
