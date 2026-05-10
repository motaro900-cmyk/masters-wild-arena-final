import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { BaseEntity, EntityState } from '../entities/BaseEntity';
import { useGameStore } from '../../store/useGameStore';
import { PixiApp } from '../../engine/core/PixiApp';
import { EffectsManager } from '../../engine/systems/EffectsManager';
import { AssetLoader } from '../../engine/systems/AssetLoader';

/**
 * @class DamageNumber
 * Объект для пулинга всплывающего урона
 * Используется для оптимизации (Object Pooling)
 */
class DamageNumber extends PIXI.Text {
    public isActive: boolean = false;

    constructor() {
        super('', {
            fontFamily: 'Arial Bold',
            fontSize: 36,
            fill: '#ff0000',
            stroke: { color: '#000000', width: 4 },
            fontWeight: 'bold',
            align: 'center'
        });
        (this as any).anchor.set(0.5, 0.5);
        (this as any).visible = false;
        (this as any).resolution = 2;
    }

    /**
     * Показать цифру урона с анимацией
     */
    public show(amount: number, isCrit: boolean, x: number, y: number): void {
        const text = isCrit ? `💥${Math.round(amount)}` : `-${Math.round(amount)}`;
        // Градиент для крита по ТЗ
        const fill = isCrit ? ['#ffff00', '#ff0000'] : '#ffffff';
        const fontSize = isCrit ? 64 : 40;
        
        (this as any).text = text;
        (this as any).style.fill = fill;
        (this as any).style.fontSize = fontSize;
        (this as any).x = x;
        (this as any).y = y;
        (this as any).alpha = 1;
        (this as any).visible = true;
        this.isActive = true;
        (this as any).scale.set(isCrit ? 1.5 : 1.0);

        gsap.to(this as any, {
            y: y - 120,
            alpha: 0,
            scale: isCrit ? 2.0 : 1.0,
            duration: 1.2,
            ease: "power2.out",
            onComplete: () => {
                (this as any).visible = false;
                this.isActive = false;
            }
        });

        // Shaking effect for crit text
        if (isCrit) {
            gsap.fromTo(this, { x: x - 10 }, { x: x + 10, duration: 0.05, yoyo: true, repeat: 5 });
        }
    }

    /**
     * Вернуть в пул (сбросить состояние)
     */
    public reset(): void {
        this.isActive = false;
        (this as any).visible = false;
        gsap.killTweensOf(this);
    }
}

/**
 * @enum {string}
 * Состояния боевой системы
 */
export enum BattleStatus {
    PREPARING = 'PREPARING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
    ERROR = 'ERROR'
}

/**
 * @interface IBattleStats
 * Статистика боя для UI
 */
export interface IBattleStats {
    playerHp: number;
    enemyHp: number;
    playerMaxHp: number;
    enemyMaxHp: number;
    battleDuration: number;
    damageDealt: number;
    damageReceived: number;
    critsLanded: number;
    turnCount: number;
}

/**
 * @class BattleState
 * Управляет боевой системой с AAA-инди эффектами
 * 
 * Архитектура:
 * - Использует PixiApp для слоев и управления
 * - Интегрирует EffectsManager для визуальных эффектов
 * - Object Pooling для цифр урона
 * - State Machine для управления состояниями
 * - Lerp интерполяция для плавных движений
 * 
 * @example
 * const battle = new BattleState();
 * await battle.startBattle('panda', 'moose');
 * pixiApp.addUpdateLoop((dt) => battle.update(dt));
 */
export class BattleState {
    private pixiApp: PixiApp;
    private fx: EffectsManager;
    private assetLoader: AssetLoader;
    
    private player: BaseEntity | null = null;
    private enemy: BaseEntity | null = null;
    private damagePool: DamageNumber[] = [];
    
    private status: BattleStatus = BattleStatus.PREPARING;
    private playerAtb: number = 0; // Active Time Battle system
    private enemyAtb: number = 0;
    private battleStartTime: number = 0;
    
    // Пул фильтров для вспышек урона (GPU memory leak prevention)
    private flashFilterPool: Map<BaseEntity, { filter: PIXI.ColorMatrixFilter; refCount: number; timer: number }> = new Map();
    
    // State machine для анимаций атаки (dt-based, не зависит от ticker.speed)
    private attackQueue: Array<{
        attacker: BaseEntity;
        target: BaseEntity;
        isCrit: boolean;
        damage: number;
        phase: 'dash_in' | 'hit' | 'dash_out' | 'done';
        phaseTimer: number;
        startX: number;
        targetX: number;
        dashOffset: number;
    }> = [];

    // Статистика боя
    private stats: IBattleStats = {
        playerHp: 0,
        enemyHp: 0,
        playerMaxHp: 0,
        enemyMaxHp: 0,
        battleDuration: 0,
        damageDealt: 0,
        damageReceived: 0,
        critsLanded: 0,
        turnCount: 0
    };

    // Слой боя для управления сортировкой
    private battleLayer: PIXI.Container;

    constructor() {
        this.pixiApp = PixiApp.getInstance();
        this.fx = EffectsManager.getInstance();
        this.assetLoader = AssetLoader.getInstance();

        // Создаем слой для боя
        this.battleLayer = new PIXI.Container();
        this.pixiApp.gameLayer.addChild(this.battleLayer);

        // Инициализируем пул цифр урона
        this.initDamagePool();
    }

    /**
     * Инициализировать пул цифр урона (Object Pooling)
     * @private
     */
    private initDamagePool(size: number = 30): void {
        try {
            for (let i = 0; i < size; i++) {
                const damageText = new DamageNumber();
                this.damagePool.push(damageText);
                this.pixiApp.effectsLayer.addChild(damageText);
            }
            console.log(`📊 Damage pool initialized: ${size} objects`);
        } catch (error) {
            console.error('❌ Damage pool init error:', error);
        }
    }

    /**
     * Получить цифру урона из пула
     * @private
     */
    private getDamageNumberFromPool(): DamageNumber | null {
        try {
            return this.damagePool.find(dn => !dn.isActive) || null;
        } catch (error) {
            console.error('❌ Get damage number error:', error);
            return null;
        }
    }

    /**
     * Начать бой между двумя персонажами
     * @param playerHeroId ID героя игрока
     * @param enemyHeroId ID врага
     * @throws Если герои не найдены
     */
    public async startBattle(playerHeroId: string, enemyHeroId: string): Promise<void> {
        try {
            this.status = BattleStatus.PREPARING;
            const store = useGameStore.getState();

            // Получаем финальные статы с модификаторами оружия
            const playerStats = store.getCalculatedStats(playerHeroId);
            const enemyStats = store.getCalculatedStats(enemyHeroId);

            if (!playerStats || !enemyStats) {
                throw new Error(`Stats not found for heroes: ${playerHeroId}, ${enemyHeroId}`);
            }

            // Очищаем старый бой
            this.battleLayer.removeChildren();
            this.playerAtb = 0;
            this.enemyAtb = 0;
            this.battleStartTime = Date.now();

            // Получаем текстуры
            const playerTexture = this.assetLoader.getTexture(playerHeroId);
            const enemyTexture = this.assetLoader.getTexture(enemyHeroId);
            const playerWeaponTex = playerStats.weaponTexture 
                ? this.assetLoader.getTexture(playerStats.weaponTexture) 
                : undefined;
            const enemyWeaponTex = enemyStats.weaponTexture 
                ? this.assetLoader.getTexture(enemyStats.weaponTexture) 
                : undefined;

            // Создаем персонажей с оружием (Socket System)
            this.player = new BaseEntity(playerTexture, playerStats, playerWeaponTex);
            this.enemy = new BaseEntity(enemyTexture, enemyStats, enemyWeaponTex);

            // Позиционируем (слева игрок, справа враг)
            (this.player as any).position.set(250, 480);
            (this.enemy as any).position.set(750, 480);
            (this.enemy as any).scale.x = -1; // Зеркало врага

            this.battleLayer.addChild(this.player, this.enemy);

            // Инициализируем статистику
            this.stats = {
                playerHp: playerStats.hp,
                enemyHp: enemyStats.hp,
                playerMaxHp: playerStats.hp,
                enemyMaxHp: enemyStats.hp,
                battleDuration: 0,
                damageDealt: 0,
                damageReceived: 0,
                critsLanded: 0,
                turnCount: 0
            };

            this.status = BattleStatus.ACTIVE;

            // Камера fade in эффект
            this.fx.fadeIn(this.battleLayer, 0.3);

            console.log('⚔️ BATTLE STARTED!');
            console.log(`🐼 Player (${playerHeroId}):`, playerStats);
            console.log(`🦌 Enemy (${enemyHeroId}):`, enemyStats);

        } catch (error) {
            this.status = BattleStatus.ERROR;
            console.error('❌ Battle start failed:', error);
            throw error;
        }
    }

    /**
     * Главный loop обновления боя
     * Вызывается каждый кадр из PixiApp
     * @param deltaTime Время между кадрами (в мс)
     */
    public update(deltaTime: number): void {
        try {
            if (this.status !== BattleStatus.ACTIVE || !this.player || !this.enemy) {
                return;
            }

            // Обновляем длительность боя
            this.stats.battleDuration = (Date.now() - this.battleStartTime) / 1000;

            // Обновляем очередь атак (dt-based state machine)
            this.updateAttackQueue(deltaTime);

            // Логика ATB (Speed-based Ticking)
            this.playerAtb += (this.player.stats.speed || 1.0) * deltaTime;
            this.enemyAtb += (this.enemy.stats.speed || 1.0) * deltaTime;

            const ATB_THRESHOLD = 3000; // Порог для совершения атаки

            // Проверяем готовность к атаке
            if (this.playerAtb >= ATB_THRESHOLD && 
                this.player.isAlive() && 
                this.enemy.isAlive()) {
                this.playerAtb -= ATB_THRESHOLD;
                this.stats.turnCount++;
                this.resolveHit(this.player, this.enemy);
            }

            if (this.enemyAtb >= ATB_THRESHOLD && 
                this.enemy.isAlive() && 
                this.player.isAlive()) {
                this.enemyAtb -= ATB_THRESHOLD;
                this.stats.turnCount++;
                this.resolveHit(this.enemy, this.player);
            }

            // Обновляем сущности
            this.player.update(deltaTime);
            this.enemy.update(deltaTime);

            // Y-Sorting (правильная отрисовка глубины)
            this.battleLayer.children.sort((a, b) => {
                const aY = (a.position?.y ?? 0) + ((a as any).height ?? 0);
                const bY = (b.position?.y ?? 0) + ((b as any).height ?? 0);
                return aY - bY;
            });

            // Проверяем конец боя
            if (!this.player.isAlive() || !this.enemy.isAlive()) {
                this.endBattle();
            }

        } catch (error) {
            console.error('❌ Battle update error:', error);
            this.status = BattleStatus.ERROR;
        }
    }

    /**
     * Разрешить удар: расчет урона, крита и применение эффектов
     * State Machine: ATTACK → TAKE_DAMAGE
     * @private
     */
    private resolveHit(attacker: BaseEntity, target: BaseEntity): void {
        try {
            if (!attacker.isAlive() || !target.isAlive()) {
                return;
            }

            // Логика уклонения (Dodge)
            const isDodge = Math.random() < (target.stats.dodgeChance || 0);
            if (isDodge) {
                // Анимация уклонения (Move back 40px)
                const dodgeDir = target === this.player ? -40 : 40;
                const origX = (target as any).x;
                gsap.to(target, { x: origX + dodgeDir, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out" });
                
                // Текст уклонения
                const dodgeText = new PIXI.Text({
                    text: 'УКЛОНЕНИЕ',
                    style: { fontFamily: 'Arial', fontSize: 32, fill: '#aaaaaa', fontStyle: 'italic', stroke: { color: '#000000', width: 4 } }
                });
                dodgeText.anchor.set(0.5);
                dodgeText.position.set((target as any).x, (target as any).y - 100);
                this.battleLayer.addChild(dodgeText);
                gsap.to(dodgeText, { y: dodgeText.y - 50, alpha: 0, duration: 1, onComplete: () => dodgeText.destroy() });
                return;
            }

            // Атакующий переходит в state ATTACK
            attacker.setState(EntityState.ATTACK);

            // AAA Боевая Формула (Math Engine)
            const isCrit = Math.random() < (attacker.stats.critChance || 0.1);
            const variance = 0.9 + Math.random() * 0.2;
            const baseDamage = (attacker.stats.attack || 50) * variance;
            const damage = Math.max(1, Math.floor(baseDamage * (isCrit ? 2.5 : 1)));

            // Кинематографичный Dash к цели (dt-based state machine, не зависит от ticker.speed)
            const startX = (attacker as any).x;
            const targetX = (target as any).x;
            const dashOffset = attacker === this.player ? -80 : 80;

            this.attackQueue.push({
                attacker,
                target,
                isCrit,
                damage,
                phase: 'dash_in',
                phaseTimer: 0,
                startX,
                targetX: targetX + dashOffset,
                dashOffset
            });

            // Обновляем статистику атаки (будет применена после анимации)
            if (attacker === this.player) {
                this.stats.turnCount++;
            }

        } catch (error) {
            console.error('❌ Resolve hit error:', error);
        }
    }

    /**
     * Применить эффект удара (сброс фильтра, спавн цифры, лог)
     * @private
     */
    private applyHitEffects(target: BaseEntity, damage: number, isCrit: boolean): void {
        try {
            const previousHp = target.getHp();
            target.setHp(target.getHp() - damage);
            target.setState(EntityState.TAKE_DAMAGE);

            // Сброс вспышки через 50ms (реальных ms, не game time) — не зависит от ticker.speed
            const flash = this.flashFilterPool.get(target) || { filter: new PIXI.ColorMatrixFilter(), refCount: 0, timer: 0 };
            if (flash.refCount === 0) {
                flash.filter.brightness(2, true);
                (target as any).filters = [flash.filter];
                this.flashFilterPool.set(target, flash);
            }
            flash.refCount++;

            // Screen Shake (magnitude = damage / 10)
            const shakeMag = Math.min(20, Math.max(2, damage / 10));
            this.pixiApp.screenShake(shakeMag, 0.9);

            // Camera Zoom & Slow-mo on Crit
            if (isCrit) {
                this.fx.particleBurst((target as any).x, (target as any).y - 50, 20, 0xff0000, 300);
                gsap.fromTo(this.battleLayer.scale, { x: 1.05, y: 1.05 }, { x: 1, y: 1, duration: 0.1 });
            }

            // Спавним цифру урона
            this.spawnDamageNumber(damage, isCrit, (target as any).x, (target as any).y - 100);

            // Логирование
            const attacker = this.attackQueue[0]?.attacker;
            console.log(
                `${isCrit ? '💥 CRIT!' : '⚔️ HIT'} ${attacker === this.player ? '🐼 Player' : '🦌 Enemy'} deals ${damage} dmg ` +
                `(HP: ${previousHp} → ${target.getHp()})`
            );
        } catch (error) {
            console.error('❌ Apply hit effects error:', error);
        }
    }

    /**
     * Спавнить цифру урона с анимацией
     * Object Pooling для оптимизации
     * @private
     */
    private spawnDamageNumber(amount: number, isCrit: boolean, x: number, y: number): void {
        try {
            const damageText = this.getDamageNumberFromPool();
            if (damageText) {
                damageText.show(amount, isCrit, x, y);
            }
        } catch (error) {
            console.error('❌ Spawn damage number error:', error);
        }
    }

    /**
     * Обновить очередь атак (dt-based state machine)
     * Обрабатывает dash анимации независимо от ticker.speed (slow-mo compatible)
     * @private
     */
    private updateAttackQueue(deltaTime: number): void {
        try {
            // Обрабатываем только первую готовую атаку в очереди
            for (let i = 0; i < this.attackQueue.length; i++) {
                const atk = this.attackQueue[i];
                if (!atk || atk.phase === 'done') continue;

                atk.phaseTimer += deltaTime;

                switch (atk.phase) {
                    case 'dash_in':
                        // Dash к цели: 150ms
                        if (atk.phaseTimer >= 150) {
                            // Устанавливаем позицию в конце dash
                            atk.attacker.x = atk.targetX;
                            atk.phase = 'hit';
                            atk.phaseTimer = 0;

                            // Применяем урон и эффекты (независимо от ticker.speed)
                            this.applyHitEffects(atk.target, atk.damage, atk.isCrit);
                        } else {
                            // Lerp к позиции dash
                            const t = atk.phaseTimer / 150;
                            atk.attacker.x = atk.startX + (atk.targetX - atk.startX) * t;
                        }
                        break;

                    case 'hit':
                        // Hit pose: 100ms
                        if (atk.phaseTimer >= 100) {
                            atk.phase = 'dash_out';
                            atk.phaseTimer = 0;
                        }
                        break;

                    case 'dash_out':
                        // Dash back к стартовой позиции: 300ms
                        if (atk.phaseTimer >= 300) {
                            atk.attacker.x = atk.startX;
                            atk.phase = 'done';
                            // Удаляем из очереди
                            this.attackQueue.splice(i, 1);
                            i--;
                        } else {
                            // Lerp back
                            const t = atk.phaseTimer / 300;
                            atk.attacker.x = atk.targetX + (atk.startX - atk.targetX) * t;
                        }
                        break;
                }
            }
        } catch (error) {
            console.error('❌ Update attack queue error:', error);
        }
    }

    /**
     * Завершить бой
     * Определить победителя и начислить награды
     * @private
     */
    private endBattle(): void {
        try {
            this.status = BattleStatus.FINISHED;

            const winner = this.player && this.player.isAlive() ? this.player : this.enemy;
            const loser = winner === this.player ? this.enemy : this.player;
            const store = useGameStore.getState();

            if (loser) {
                // Замедление времени для эффектной смерти (Time Dilation)
                this.pixiApp.getApp().ticker.speed = 0.2;
                gsap.to(loser, { alpha: 0, y: (loser as any).y + 50, duration: 0.5 }); // Death fall
                setTimeout(() => {
                    this.pixiApp.getApp().ticker.speed = 1.0;
                }, 1000); // Вернуть скорость через 1 сек реального времени
            }

            if (winner === this.player && this.player) {
                // Победа игрока!
                const reward = 1200;
                const bonusReward = Math.floor(this.stats.damageDealt / 100);
                const totalReward = reward + bonusReward;

                store.addGold(totalReward);

                // Эффект победы
                gsap.to(this.battleLayer, {
                    alpha: 0.7,
                    duration: 0.5,
                    ease: 'power2.out'
                });

                console.log(`✅ VICTORY!`);
                console.log(`  Reward: ${totalReward} gold`);
                console.log(`  Base: ${reward}, Bonus: ${bonusReward}`);
                console.log(`  Battle duration: ${this.stats.battleDuration.toFixed(1)}s`);
                console.log(`  Stats:`, this.stats);

            } else {
                console.log(`❌ DEFEAT!`);
                console.log(`  Battle duration: ${this.stats.battleDuration.toFixed(1)}s`);
                console.log(`  Stats:`, this.stats);
            }

        } catch (error) {
            console.error('❌ End battle error:', error);
        }
    }

    /**
     * Получить текущий статус боя
     */
    public getStatus(): BattleStatus {
        return this.status;
    }

    /**
     * Проверить активна ли бой
     */
    public isActive(): boolean {
        return this.status === BattleStatus.ACTIVE;
    }

    /**
     * Получить текущую статистику боя
     */
    public getStats(): IBattleStats {
        if (this.player && this.enemy) {
            return {
                ...this.stats,
                playerHp: this.player.getHp(),
                enemyHp: this.enemy.getHp()
            };
        }
        return this.stats;
    }

    /**
     * Получить персонажа игрока
     */
    public getPlayer(): BaseEntity | null {
        return this.player;
    }

    /**
     * Получить врага
     */
    public getEnemy(): BaseEntity | null {
        return this.enemy;
    }

    /**
     * Остановить и очистить бой
     */
    public destroy(): void {
        try {
            this.status = BattleStatus.FINISHED;

            // Очищаем слой
            this.battleLayer.removeChildren();

            // Сбрасываем пул цифр урона
            for (const damageText of this.damagePool) {
                damageText.reset();
            }

            // Останавливаем все эффекты
            this.fx.stopAllEffects();

            console.log('🛑 Battle destroyed');
        } catch (error) {
            console.error('❌ Destroy error:', error);
        }
    }
}
