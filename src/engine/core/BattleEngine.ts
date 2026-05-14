
import * as PIXI from 'pixi.js';
import { HeroUnit } from '../entities/HeroUnit';
import { AssetsMap } from '../../configs/AssetsMap';
import { audioService } from '../../services/AudioService';
import { PixiApp } from './PixiApp';
import { useGameStore } from '../../store/useGameStore';

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

/**
 * БОЕВОЙ ДВИЖОК (v2.0 - Hybrid Snapshot Architecture)
 * Управляет логикой боя, используя динамические текстуры героев.
 */
export class BattleEngine {
    private static instance: BattleEngine | null = null;
    
    public static getInstance(): BattleEngine {
        if (!BattleEngine.instance) {
            BattleEngine.instance = new BattleEngine();
        }
        return BattleEngine.instance;
    }

    private player: HeroUnit | null = null;
    private enemy: HeroUnit | null = null;
    
    private playerStats: ICombatStats | null = null;
    private enemyStats: ICombatStats | null = null;

    private playerAttackTimer: number = 0;
    private enemyAttackTimer: number = 0;
    private isCombatRunning: boolean = false;
    public isInitialized: boolean = false;
    private isDestroyed: boolean = false;
    private battleTime: number = 0;
    
    public onStateChange: (state: BattleState) => void = () => {};
    private state: BattleState = { playerHP: 100, playerMaxHP: 100, enemyHP: 100, enemyMaxHP: 100, log: 'ПОДГОТОВКА...' };

    private updateCallback: ((dt: number) => void) | null = null;
    private storeUnsubscribe: (() => void) | null = null;

    private constructor() {}

    async init(_container: HTMLElement, heroId: string, enemyId: string, playerStats: any, enemyStats: any) {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.isDestroyed = false;

        console.log('1. init started');
        console.log('playerStats:', JSON.stringify(playerStats));
        console.log('enemyStats:', JSON.stringify(enemyStats));

        try {
            // [Lead Architect]: Safe fallbacks for missing stats using Number() || to prevent NaN
            this.playerStats = {
                hp:         (Number(playerStats?.hp)         || 100),
                attack:     (Number(playerStats?.attack)     || 10),
                defense:    (Number(playerStats?.defense)    || 5),
                speed:      (Number(playerStats?.speed)      || 50),
                critChance: (Number(playerStats?.critChance) || 0.1),
                dodge:      (Number(playerStats?.dodge)      || 0.05)
            };
            this.enemyStats = {
                hp:         (Number(enemyStats?.hp)         || 100),
                attack:     (Number(enemyStats?.attack)     || 8),
                defense:    (Number(enemyStats?.defense)    || 3),
                speed:      (Number(enemyStats?.speed)      || 40),
                critChance: (Number(enemyStats?.critChance) || 0.1),
                dodge:      (Number(enemyStats?.dodge)      || 0.05)
            };

            // 1. ПОДГОТОВКА СЦЕНЫ
            const pixiApp = PixiApp.getInstance();
            await pixiApp.init({}, _container);
            pixiApp.clearAllLayers();

            // 2. ЗАГРУЗКА ФОНА
            const arenas = AssetsMap.BACKGROUNDS.BATTLE_ARENAS;
            const randomBg = arenas[Math.floor(Math.random() * arenas.length)];
            console.log(`[BattleEngine] Loading background: ${randomBg}`);
            const bgTex = await PIXI.Assets.load(randomBg).catch(_ => PIXI.Texture.WHITE);
            const background = new PIXI.Sprite(bgTex);
            
            const W = 1920;
            const H = 1080;

            background.width = W; 
            background.height = H;
            pixiApp.backgroundLayer.addChild(background);
            console.log('2. background ready');

            // 3. ЗАГРУЗКА БОЙЦОВ
            const { heroEquipment } = useGameStore.getState();
            
            // Игрок
            this.player = new HeroUnit();
            await this.player.loadHero(heroId);
            console.log('3. player hero loaded');

            await this.player.updateEquipment(heroEquipment[heroId] || {});
            console.log('4. player weapon equipped');

            // Враг
            this.enemy = new HeroUnit();
            await this.enemy.loadHero(enemyId);
            console.log('5. enemy loaded');

            await this.enemy.updateEquipment({}); 
            
            // ЯВНОЕ ПОЗИЦИОНИРОВАНИЕ (1920x1080)
            this.player.position.set(W * 0.25, H * 0.82); 
            this.player.scale.set(0.9);
            this.player.alpha = 1;
            this.player.visible = true;
            
            this.enemy.position.set(W * 0.75, H * 0.82); 
            this.enemy.scale.set(-0.9, 0.9); 
            this.enemy.alpha = 1;
            this.enemy.visible = true;
            
            // 4. ОТОБРАЖЕНИЕ (Только когда всё загружено!)
            pixiApp.gameLayer.addChild(this.player, this.enemy);
            console.log('6. ALL UNITS ON STAGE ← должен появиться этот лог');

            // 4. ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ
            this.updateState({
                playerHP: this.playerStats.hp,
                playerMaxHP: this.playerStats.hp,
                enemyHP: this.enemyStats.hp,
                enemyMaxHP: this.enemyStats.hp,
                log: 'БИТВА НАЧИНАЕТСЯ!'
            });
            useGameStore.getState().addCombatLog('--- НАЧАЛО БОЯ ---');

            // 5. ИГРОВОЙ ЦИКЛ
            this.updateCallback = (dt: number) => {
                const { timeScale } = useGameStore.getState();
                const delta = dt * timeScale;
                this.battleTime += delta;
                
                // АНИМАЦИЯ ДЫХАНИЯ (Delegated to units)
                if (this.player) this.player.update(delta);
                if (this.enemy) this.enemy.update(delta);

                if (this.isCombatRunning) {
                    this.updateTimers(delta);
                }
            };
            pixiApp.addUpdateLoop(this.updateCallback);

            setTimeout(() => {
                this.isCombatRunning = true;
                this.playerAttackTimer = 500;
                this.enemyAttackTimer = 800;
            }, 1000);

        } catch (error) {
            console.error("BattleEngine initialization failed:", error);
            this.updateState({ log: 'ОШИБКА ЗАГРУЗКИ БОЯ' });
        }
    }

    private updateTimers(delta: number) {
        if (this.state.playerHP <= 0 || this.state.enemyHP <= 0) {
            this.isCombatRunning = false;
            const isWin = this.state.playerHP > 0;
            this.updateState({ log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...' });
            
            const store = useGameStore.getState();
            store.addCombatLog(isWin ? '🏁 БОЙ ЗАВЕРШЕН: ПОБЕДА' : '🏁 БОЙ ЗАВЕРШЕН: ПОРАЖЕНИЕ');
            
            // [Quest] Track match progress
            store.updateQuestProgress('PLAY', 1);
            if (isWin) store.updateQuestProgress('WIN', 1);

            return;
        }

        this.playerAttackTimer -= delta;
        this.enemyAttackTimer -= delta;

        if (this.playerAttackTimer <= 0) {
            this.executeAttack(this.player!, this.enemy!, true);
            const speed = Math.max(0.1, this.playerStats!.speed);
            this.playerAttackTimer = (2000 / speed);
        }

        const { isEnemyFrozen } = useGameStore.getState();
        if (!isEnemyFrozen && this.enemyAttackTimer <= 0 && this.state.enemyHP > 0) {
            this.executeAttack(this.enemy!, this.player!, false);
            const speed = Math.max(0.1, this.enemyStats!.speed);
            this.enemyAttackTimer = (2000 / speed);
        }
    }

    private async executeAttack(attacker: HeroUnit, victim: HeroUnit, isPlayer: boolean) {
        if (!this.isCombatRunning) return;

        const { timeScale, addCombatLog } = useGameStore.getState();
        const startX = attacker.x;
        const targetX = victim.x - (150 * (isPlayer ? 1 : -1));
        
        const duration = 250 / timeScale;
        
        // 1. РЫВОК ВПЕРЕД (Attack Lunge)
        await this.animateTo(attacker, startX, targetX, duration);

        // 2. МОМЕНТ УДАРА
        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
        this.applyShake(8);
        attacker.playAttackAnimation();
        victim.playHitEffect();
        
        // Расчет урона
        const stats = isPlayer ? this.playerStats! : this.enemyStats!;
        const targetStats = isPlayer ? this.enemyStats! : this.playerStats!;
        const { isGodMode, isOneShot } = useGameStore.getState();
        
        let damage = stats.attack * (0.9 + Math.random() * 0.2);
        const isCrit = Math.random() < stats.critChance;
        if (isCrit) damage *= 2;
        if (isPlayer && isOneShot) damage = 999999;
        
        let mitigated = Math.max(0, damage - (targetStats.defense * 0.5));
        if (!isPlayer && isGodMode) mitigated = 0;
        
        const finalDamage = Math.ceil(mitigated);
        
        let logMsg = '';
        if (isCrit) {
            logMsg = `[Раунд] ${isPlayer ? 'Вы наносите' : 'Враг наносит'} КРИТИЧЕСКИЙ УДАР на ${finalDamage}!`;
        } else {
            logMsg = `[Раунд] ${isPlayer ? 'Вы бьете' : 'Враг бьет'} на ${finalDamage}!`;
        }
        
        this.updateState({ log: logMsg });
        addCombatLog(logMsg);
        
        if (isPlayer) {
            this.updateState({ enemyHP: Math.max(0, this.state.enemyHP - finalDamage) });
            // [Quest] Track damage progress
            useGameStore.getState().updateQuestProgress('DAMAGE', finalDamage);
        } else {
            this.updateState({ playerHP: Math.max(0, this.state.playerHP - finalDamage) });
        }

        // 3. ВОЗВРАТ НА ПОЗИЦИЮ
        await new Promise(r => setTimeout(r, 100 / timeScale));
        await this.animateTo(attacker, targetX, startX, duration);
        
        attacker.x = startX;
    }

    private animateTo(unit: HeroUnit, start: number, end: number, duration: number): Promise<void> {
        return new Promise(resolve => {
            const startTime = Date.now();
            const animate = () => {
                if (this.isDestroyed || (unit as any).destroyed) {
                    resolve();
                    return;
                }
                const now = Date.now();
                const t = Math.min(1, (now - startTime) / duration);
                unit.x = start + (end - start) * (t * (2 - t)); // Ease out
                if (t < 1) requestAnimationFrame(animate);
                else resolve();
            };
            requestAnimationFrame(animate);
        });
    }

    public instantWin() {
        this.updateState({ enemyHP: 0 });
        useGameStore.getState().addCombatLog('⚡ ADMIN: Мгновенная победа');
    }

    public instantLose() {
        this.updateState({ playerHP: 0 });
        useGameStore.getState().addCombatLog('💀 ADMIN: Самоубийство');
    }

    private applyShake(intensity: number) {
        PixiApp.getInstance().screenShake(intensity);
    }

    private updateState(patch: Partial<BattleState>) {
        this.state = { ...this.state, ...patch };
        this.onStateChange(this.state);
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.storeUnsubscribe) this.storeUnsubscribe();
        const pixiApp = PixiApp.getInstance();
        if (this.updateCallback) pixiApp.removeUpdateLoop(this.updateCallback);
        pixiApp.backgroundLayer.removeChildren().forEach(child => { if (!child.destroyed) child.destroy({ children: true, texture: false }); });
        pixiApp.gameLayer.removeChildren().forEach(child => { if (!child.destroyed) child.destroy({ children: true, texture: false }); });
        this.isInitialized = false;
    }
}
