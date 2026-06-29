import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { HeroUnit } from '../entities/HeroUnit';
import { EffectsManager } from '../systems/EffectsManager';
import { AssetsMap } from '../../configs/AssetsMap';
import { audioService } from '../../services/AudioService';
import { PixiApp } from './PixiApp';
import { useGameStore } from '../../store/useGameStore';
import { ATB_THRESHOLD as ATB_THRESHOLD_CONST } from '../../game/configs/GameConstants';
import {
    getAbilityConfig,
    getAbilityConfigByRole,
    type StatusType,
    type PassiveContext,
} from '../../configs/AbilityConfig';

// Import extracted subsystems
import * as BattleStatusSystem from './battle/BattleStatusSystem';
import * as BattleAbilitySystem from './battle/BattleAbilitySystem';
import * as BattleSimulation from './battle/BattleSimulation';
import * as BattleParticleSystem from './battle/BattleParticleSystem';
import * as BattleAttackSystem from './battle/BattleAttackSystem';

export interface BattleState {
    playerHP: number;
    playerMaxHP: number;
    enemyHP: number;
    enemyMaxHP: number;
    log: string;
    playerMana: number;
    playerMaxMana: number;
    enemyMana: number;
    enemyMaxMana: number;
    playerStatuses: Array<{ type: string; stacks: number; duration: number }>;
    enemyStatuses: Array<{ type: string; stacks: number; duration: number }>;
    playerShield: number;
}

export interface ICombatStats {
    hp: number;
    attack: number;
    speed: number;
    critChance: number;
    defense: number;
    dodge: number;
    critDamage?: number;
    lifesteal?: number;
    penetration?: number;
    accuracy?: number;
    avgItemLevel?: number;
}

export interface CombatEvent {
    type: 'HIT' | 'CRIT' | 'DODGE' | 'BLOCK' | 'INSTINCT' | 'BURN' | 'POISON' | 'FREEZE' | 'STUN';
    damage: number;
    target: 'player' | 'enemy';
    label?: string;
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

    public player: HeroUnit | null = null;
    public enemy: HeroUnit | null = null;

    public getPlayerUnit(): HeroUnit | null {
        return this.player;
    }

    public getEnemyUnit(): HeroUnit | null {
        return this.enemy;
    }

    public playerStats: ICombatStats | null = null;
    public enemyStats: ICombatStats | null = null;
    private currentArenaBgUrl: string | null = null;
    private activeRafIds: number[] = [];
    private tweensCancelled: boolean = false;

    public isCombatRunning: boolean = false;
    public isInitialized: boolean = false;
    public battleTime: number = 0;
    private initTimeoutId: ReturnType<typeof setTimeout> | null = null;
    public totalDamageDealt: number = 0;
    public totalDamageTaken: number = 0;
    public totalTurnsPlayed: number = 0;
    public maxSingleHitDamage: number = 0;

    public onStateChange: (state: BattleState) => void = () => {};
    public _onCombatEvent: (event: CombatEvent) => void = () => {};
    public get onCombatEvent() {
        return this._onCombatEvent;
    }
    public set onCombatEvent(cb: (event: CombatEvent) => void) {
        this._onCombatEvent = (event: CombatEvent) => {
            if (event.type === 'HIT' || event.type === 'CRIT') {
                this.totalTurnsPlayed += 1;
            }
            cb(event);
        };
    }
    public state: BattleState = {
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...',
        playerMana: 0,
        playerMaxMana: 100,
        enemyMana: 0,
        enemyMaxMana: 100,
        playerStatuses: [],
        enemyStatuses: [],
        playerShield: 0,
    };

    private updateCallback: ((dt: number) => void) | null = null;
    private storeUnsubscribe: (() => void) | null = null;
    private localCombatLogs: string[] = [];
    private isCombatEndChecked = false;

    public addCombatLog(msg: string) {
        this.localCombatLogs.push(msg);
    }

    private constructor() {}

    async init(_container: HTMLElement, heroId: string, enemyId: string, playerStats: any, enemyStats: any) {
        if (this.isInitialized) {
            console.warn('[BattleEngine] Already initialized, resetting before re-init...');
            this.isInitialized = false;
            this.totalDamageDealt = 0;
            this.totalDamageTaken = 0;
            this.totalTurnsPlayed = 0;
            this.maxSingleHitDamage = 0;
            this.isCombatEndChecked = false;
        }
        this.isInitialized = true;

        try {
            this.totalDamageDealt = 0;
            this.totalDamageTaken = 0;
            this.totalTurnsPlayed = 0;
            this.maxSingleHitDamage = 0;
            this.localCombatLogs = [];
            this.isCombatEndChecked = false;
            this.tweensCancelled = false;
            this.activeRafIds = [];

            const pCrit = Number(playerStats?.critChance) || 10;
            const pDodge = Number(playerStats?.evasion ?? playerStats?.dodge) || 5;

            const eCrit = Number(enemyStats?.critChance ?? enemyStats?.crit) || 10;
            const eDodge = Number(enemyStats?.dodge ?? enemyStats?.evasion) || 5;

            this.playerStats = {
                hp: Number(playerStats?.hp) || 100,
                attack: Number(playerStats?.attack) || 10,
                defense: Number(playerStats?.defense) || 5,
                speed: Number(playerStats?.speed) || 1.5,
                critChance: Math.max(0.25, pCrit > 1 ? pCrit / 100 : pCrit),
                dodge: 0,
                critDamage: Number(playerStats?.critDamage) || 1.5,
                lifesteal: 0,
                penetration: 0,
                accuracy: 100,
                avgItemLevel: Number(playerStats?.avgItemLevel) || 1,
            };
            this.enemyStats = {
                hp: Number(enemyStats?.hp) || 100,
                attack: Number(enemyStats?.attack) || 8,
                defense: Number(enemyStats?.defense) || 3,
                speed: Number(enemyStats?.speed) || 1.2,
                critChance: Math.max(0.22, eCrit > 1 ? eCrit / 100 : eCrit),
                dodge: 0,
                critDamage: Number(enemyStats?.critDamage) || 1.5,
                lifesteal: 0,
                penetration: 0,
                accuracy: 100,
                avgItemLevel: Number(enemyStats?.avgItemLevel) || 1,
            };

            const pixiApp = PixiApp.getInstance();
            await pixiApp.init({}, _container);
            pixiApp.clearAllLayers();

            const state = useGameStore.getState();
            const isUltra = state.graphicsQuality === 'ULTRA';
            const arenaBgQuality = isUltra ? 'HIGH' : state.arenaBgQuality || (state.isMobile ? 'LOW' : 'HIGH');
            const arenas =
                arenaBgQuality === 'LOW'
                    ? AssetsMap.BACKGROUNDS.BATTLE_ARENAS_MOBILE
                    : AssetsMap.BACKGROUNDS.BATTLE_ARENAS;
            const randomBg = arenas[Math.floor(Math.random() * arenas.length)];
            this.currentArenaBgUrl = randomBg;
            const bgTex = await PIXI.Assets.load(randomBg).catch(() => PIXI.Texture.WHITE);
            const background = new PIXI.Sprite(bgTex);

            const W = 1920;
            const H = 1080;

            background.width = W;
            background.height = H;
            pixiApp.backgroundLayer.addChild(background);
            if (import.meta.env.DEV) console.log('2. background ready');

            const { heroEquipment } = useGameStore.getState();

            this.player = new HeroUnit();
            await this.player.loadHero(heroId);
            await this.player.updateEquipment(heroEquipment[heroId] || {});

            this.enemy = new HeroUnit();
            await this.enemy.loadHero(enemyId);
            await this.enemy.updateEquipment({});

            const q = state.graphicsQuality;
            let maxParticles = 20; // default for 'LOW'
            if (q === 'MEDIUM') {
                maxParticles = 40;
            } else if (q === 'HIGH') {
                maxParticles = 80;
            } else if (q === 'ULTRA') {
                maxParticles = 130;
            }

            // Create background particles container & array
            const particleContainer = new PIXI.Container();
            pixiApp.backgroundLayer.addChild(particleContainer);
            const arenaParticles = BattleParticleSystem.initParticles(randomBg, particleContainer, W, H, maxParticles);

            // Spawn player outside screen (left: -200) and define default positions
            const targetPlayerX = W * 0.25;
            this.player.position.set(-200, H * 0.82);
            this.player.defaultX = targetPlayerX;
            this.player.defaultY = H * 0.82;

            const playerBaseScale = this.player.config?.baseScale || 1.0;
            this.player.parentDefaultScaleX = playerBaseScale;
            this.player.parentDefaultScaleY = playerBaseScale;
            this.player.scale.set(playerBaseScale, playerBaseScale);
            this.player.alpha = 1;
            this.player.visible = true;

            // Spawn enemy outside screen (right: W + 200) and define default positions
            let enemyY = H * 0.82;
            let enemyBaseScale = this.enemy.config?.baseScale || 1.0;
            let enemyScaleX = -enemyBaseScale;
            if (this.enemy.isMob) {
                enemyBaseScale *= 0.72;
                enemyY = H * 0.88;
                enemyScaleX = enemyBaseScale;
            }

            const targetEnemyX = W * 0.75;
            this.enemy.position.set(W + 200, enemyY);
            this.enemy.defaultX = targetEnemyX;
            this.enemy.defaultY = enemyY;

            this.enemy.parentDefaultScaleX = enemyScaleX;
            this.enemy.parentDefaultScaleY = enemyBaseScale;
            this.enemy.scale.set(enemyScaleX, enemyBaseScale);
            this.enemy.alpha = 1;
            this.enemy.visible = true;

            pixiApp.gameLayer.addChild(this.player, this.enemy);
            pixiApp.startRendering();

            // GSAP entrance animations from outside the screen to target positions
            gsap.to(this.player, { x: targetPlayerX, duration: 0.6, ease: 'power2.out' });
            gsap.to(this.enemy, { x: targetEnemyX, duration: 0.6, ease: 'power2.out' });

            this.updateState({
                playerHP: this.playerStats.hp,
                playerMaxHP: this.playerStats.hp,
                enemyHP: this.enemyStats.hp,
                enemyMaxHP: this.enemyStats.hp,
                playerMana: 0,
                playerMaxMana: 100,
                playerShield: 0,
                log: 'БИТВА НАЧИНАЕТСЯ!',
            });
            this.addCombatLog('--- НАЧАЛО БОЯ ---');

            this.updateCallback = (dt: number) => {
                const { timeScale } = useGameStore.getState();
                const delta = dt * timeScale;
                this.battleTime += delta;

                if (this.player) this.player.update(delta);
                if (this.enemy) this.enemy.update(delta);

                // Update background particles (only if maxParticles > 0)
                if (maxParticles > 0) {
                    BattleParticleSystem.updateParticles(arenaParticles, delta, W, H);
                }
            };
            pixiApp.addUpdateLoop(this.updateCallback);

            this.initTimeoutId = setTimeout(() => {
                this.isCombatRunning = true;
                this.runCombatLoop();
            }, 800);
        } catch (error) {
            console.error('BattleEngine initialization failed:', error);
            this.isInitialized = false;
            this.updateState({ log: 'ОШИБКА ЗАГРУЗКИ БОЯ' });
        }
    }

    private async runCombatLoop() {
        if (!this.isCombatRunning) return;

        const ATB_THRESHOLD = ATB_THRESHOLD_CONST;
        const getEffectiveSpeed = (unit: HeroUnit, stats: ICombatStats) => {
            const raw = unit.isFrozenStatus ? Math.ceil(stats.speed * 0.5) : stats.speed;
            return Math.max(raw, 1);
        };

        let playerTicks = 0;
        let enemyTicks = 0;

        const openingMsg =
            getEffectiveSpeed(this.player!, this.playerStats!) >= getEffectiveSpeed(this.enemy!, this.enemyStats!)
                ? `Вы наносите удар первыми! (Скорость: ${this.playerStats!.speed} → ${this.enemyStats!.speed})`
                : `Враг атакует первым! (Скорость: ${this.enemyStats!.speed} → ${this.playerStats!.speed})`;
        this.updateState({ log: openingMsg });
        this.addCombatLog('--- НАЧАЛО БОЯ ---');

        let totalBattleTicks = 0;
        let isRageActive = false;

        while (this.isCombatRunning && this.state.playerHP > 0 && this.state.enemyHP > 0) {
            while (playerTicks < ATB_THRESHOLD && enemyTicks < ATB_THRESHOLD) {
                playerTicks += getEffectiveSpeed(this.player!, this.playerStats!);
                enemyTicks += getEffectiveSpeed(this.enemy!, this.enemyStats!);
                totalBattleTicks++;

                if (totalBattleTicks === 8000 && !isRageActive) {
                    isRageActive = true;
                    this.playerStats!.attack = Math.round(this.playerStats!.attack * 1.5);
                    this.playerStats!.defense = Math.round(this.playerStats!.defense * 0.7);
                    this.enemyStats!.attack = Math.round(this.enemyStats!.attack * 1.5);
                    this.enemyStats!.defense = Math.round(this.enemyStats!.defense * 0.7);

                    const rageMsg = '🔥 [ЯРОСТЬ] Бой затянулся! Атака обоих +50%, защита -30%!';
                    this.updateState({ log: rageMsg });
                    this.addCombatLog(rageMsg);
                    this.onCombatEvent({
                        type: 'INSTINCT',
                        damage: 0,
                        target: 'player',
                        label: '🔥 ЯРОСТЬ!',
                    });
                }

                if (totalBattleTicks >= 10000) {
                    const limitMsg = '⏱️ [ЛИМИТ ВРЕМЕНИ] Превышен лимит в 10000 тиков!';
                    this.updateState({ log: limitMsg });
                    this.addCombatLog(limitMsg);

                    if (this.state.playerHP >= this.state.enemyHP) {
                        this.updateState({ enemyHP: 0 });
                        this.addCombatLog('🏆 Победа по решению судей (больше здоровья)!');
                    } else {
                        this.updateState({ playerHP: 0 });
                        this.addCombatLog('💀 Поражение по решению судей (меньше здоровья)!');
                    }
                    break;
                }
            }
            if (this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

            const { timeScale } = useGameStore.getState();
            const isPlayerTurn = playerTicks >= enemyTicks;

            if (isPlayerTurn) {
                this.triggerPassiveOnTurnStart(this.player!, true);
                await this.resolvePeriodicDamage(this.player!, true);
                if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

                if (this.player!.isStunnedStatus) {
                    const skipMsg = 'Вы оглушены и пропускаете ход!';
                    this.updateState({ log: skipMsg });
                    this.addCombatLog(`💫 ${skipMsg}`);
                    await new Promise((r) => setTimeout(r, 1500 / timeScale));
                } else if (this.state.playerMana >= 100) {
                    await this.castActiveAbility(true);
                } else {
                    await this.executeAttack(this.player!, this.enemy!, true);
                }

                this.decrementStatusDurations(this.player!);
                playerTicks -= ATB_THRESHOLD;
            } else {
                const { isEnemyFrozen } = useGameStore.getState();
                if (!isEnemyFrozen) {
                    this.triggerPassiveOnTurnStart(this.enemy!, false);
                    await this.resolvePeriodicDamage(this.enemy!, false);
                    if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

                    if (this.enemy!.isStunnedStatus) {
                        const skipMsg = 'Враг оглушен и пропускает ход!';
                        this.updateState({ log: skipMsg });
                        this.addCombatLog(`💫 ${skipMsg}`);
                        await new Promise((r) => setTimeout(r, 1500 / timeScale));
                    } else if ((this.state as any).enemyMana >= 100) {
                        await this.castActiveAbility(false);
                    } else {
                        await this.executeAttack(this.enemy!, this.player!, false);
                    }

                    this.decrementStatusDurations(this.enemy!);
                }
                enemyTicks -= ATB_THRESHOLD;
            }

            if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;
            await new Promise((r) => setTimeout(r, 1000 / timeScale));
        }

        if (this.state.playerHP <= 0 || this.state.enemyHP <= 0) {
            this.checkCombatEnd();
        } else {
            console.log('[BattleEngine] runCombatLoop terminated externally (skip or exit).');
        }
    }

    private checkCombatEnd() {
        if (this.isCombatEndChecked) return;
        this.isCombatEndChecked = true;

        this.isCombatRunning = false;
        this.cancelTweens();
        const isWin = this.state.playerHP > 0;

        if (this.player) this.player.resetToIdle();
        if (this.enemy) this.enemy.resetToIdle();

        this.updateState({
            log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...',
        });

        if (isWin) {
            this.enemy?.animateDeath(false);
            if (this.enemy) EffectsManager.getInstance().deathEffect(this.enemy);
        } else {
            this.player?.animateDeath(true);
            if (this.player) EffectsManager.getInstance().deathEffect(this.player);
        }

        const store = useGameStore.getState();
        this.localCombatLogs.push(isWin ? '🏁 БОЙ ЗАВЕРШЕН: ПОБЕДА' : '🏁 БОЙ ЗАВЕРШЕН: ПОРАЖЕНИЕ');

        const formattedLogs = this.localCombatLogs.map((msg) => `${new Date().toLocaleTimeString()} - ${msg}`);
        useGameStore.setState((state: any) => ({
            combatLogs: [...state.combatLogs, ...formattedLogs].slice(-50),
        }));

        store.updateQuestProgress('DAMAGE', this.totalDamageDealt);
        store.updateQuestProgress('PLAY', 1);
        if (isWin) store.updateQuestProgress('WIN', 1);
    }

    private async executeAttack(attacker: HeroUnit, victim: HeroUnit, isPlayer: boolean) {
        await BattleAttackSystem.executeAttack(this, attacker, victim, isPlayer);
    }

    public triggerPassiveOnTurnStart(unit: HeroUnit, isPlayer: boolean) {
        const opponent = isPlayer ? this.enemy : this.player;
        const cfg = getAbilityConfig(unit?.config?.id);
        if (!cfg?.passive?.onTurnStart) return;
        const ctx: PassiveContext = {
            attacker: unit,
            victim: opponent,
            isPlayer,
            damage: 0,
            isCrit: false,
            engine: this,
        };
        const result = cfg.passive.onTurnStart(ctx);
        if (result.extraLog) {
            this.updateState({ log: result.extraLog });
            this.addCombatLog(result.extraLog);
        }
    }

    public applyDamage(target: 'player' | 'enemy', damage: number): number {
        const modifiedDamage = this.triggerPassiveOnTakeDamage(target, damage);

        const attackerStats = target === 'player' ? this.enemyStats : this.playerStats;
        const attackerUnit = target === 'player' ? this.enemy : this.player;
        const isAttackerPlayer = target === 'enemy';

        if (attackerStats && attackerStats.lifesteal && attackerStats.lifesteal > 0 && modifiedDamage > 0) {
            const healAmount = Math.ceil(modifiedDamage * attackerStats.lifesteal);
            if (healAmount > 0) {
                const maxHP = isAttackerPlayer ? this.playerStats!.hp : this.enemyStats!.hp;
                const currentHP = isAttackerPlayer ? this.state.playerHP : this.state.enemyHP;
                const nextHP = Math.min(maxHP, currentHP + healAmount);

                if (isAttackerPlayer) {
                    this.updateState({ playerHP: nextHP });
                } else {
                    this.updateState({ enemyHP: nextHP });
                }

                this.onCombatEvent({
                    type: 'BLOCK',
                    damage: healAmount,
                    target: isAttackerPlayer ? 'player' : 'enemy',
                    label: `💚 +${healAmount}`,
                });

                if (attackerUnit) {
                    const lifestealPct = Math.round(attackerStats.lifesteal * 100);
                    this.addCombatLog(
                        `💚 [ВАМПИРИЗМ] ${attackerUnit.config.name} исцеляется на +${healAmount} HP (Вампиризм: ${lifestealPct}%)`,
                    );
                }
            }
        }

        let nextHP = 0;
        if (target === 'player') {
            let remainingDamage = modifiedDamage;
            let shield = this.state.playerShield || 0;
            if (shield > 0) {
                if (shield >= remainingDamage) {
                    shield -= remainingDamage;
                    remainingDamage = 0;
                } else {
                    remainingDamage -= shield;
                    shield = 0;
                }
                this.updateState({ playerShield: shield });
            }
            nextHP = Math.max(0, this.state.playerHP - remainingDamage);
            this.updateState({ playerHP: nextHP });
        } else {
            nextHP = Math.max(0, this.state.enemyHP - modifiedDamage);
            this.updateState({ enemyHP: nextHP });
        }

        // === Resolve Barrier для Танков ===
        const unit = target === 'player' ? this.player : this.enemy;
        const stats = target === 'player' ? this.playerStats : this.enemyStats;
        const maxHP = stats ? stats.hp : 100;
        const isTank = unit?.config?.role === 'TANK';

        if (isTank && nextHP > 0 && nextHP / maxHP < 0.50 && !(unit as any).resolveBarrierTriggered) {
            (unit as any).resolveBarrierTriggered = true;

            const shieldVal = Math.ceil(maxHP * 0.25);
            if (target === 'player') {
                const currentShield = this.state.playerShield || 0;
                this.updateState({ playerShield: currentShield + shieldVal });
            } else {
                (this.state as any).enemyShield = ((this.state as any).enemyShield || 0) + shieldVal;
            }

            stats.defense = Math.round(stats.defense * 1.30);
            this.applyStatus(unit, 'STUN_IMMUNITY' as any, 2, 0, target === 'player');

            const barrierMsg = `🛡️ [РУБЕЖ СТОЙКОСТИ] ${unit.config.name} активирует барьер! Получен Щит +${shieldVal} и Защита +30%!`;
            this.updateState({ log: barrierMsg });
            this.addCombatLog(barrierMsg);
            this.onCombatEvent({
                type: 'BLOCK',
                damage: shieldVal,
                target: target,
                label: `🛡️ СТОЙКОСТЬ +${shieldVal}`,
            });
        }

        return nextHP;
    }

    public instantWin() {
        this.updateState({ enemyHP: 0 });
        this.addCombatLog('⚡ ADMIN: Мгновенная победа');
    }

    public instantLose() {
        this.updateState({ playerHP: 0 });
        this.addCombatLog('💀 ADMIN: Самоубийство');
    }

    // --- Subsystem Delegation ---
    public skipToEndOfBattle() {
        BattleSimulation.skipToEndOfBattle(this);
        this.checkCombatEnd();
    }

    public async castActiveAbility(isPlayerCast: boolean = true) {
        await BattleAbilitySystem.castActiveAbility(this, isPlayerCast);
    }

    public applyStatus(unit: HeroUnit, type: StatusType, duration: number, damagePerTurn: number, isPlayer: boolean) {
        BattleStatusSystem.applyStatus(this, unit, type, duration, damagePerTurn, isPlayer);
    }

    public triggerPassiveOnDealDamage(
        attacker: HeroUnit,
        victim: HeroUnit,
        damage: number,
        isCrit: boolean,
        isPlayer: boolean,
    ): number {
        const cfg = getAbilityConfig(attacker.config?.id);
        if (!cfg?.passive?.onDealDamage) return damage;
        const ctx: PassiveContext = { attacker, victim, isPlayer, damage, isCrit, engine: this };
        const result = cfg.passive.onDealDamage(ctx);
        if (result.extraLog) {
            this.updateState({ log: result.extraLog });
            this.addCombatLog(result.extraLog);
        }
        if (result.damageModifier != null) return Math.ceil(damage * result.damageModifier);
        return damage;
    }

    public triggerPassiveOnTakeDamage(target: 'player' | 'enemy', damage: number, isCrit = false): number {
        const unit = target === 'player' ? this.player : this.enemy;
        const opponent = target === 'player' ? this.enemy : this.player;
        const cfg = getAbilityConfig(unit?.config?.id);
        if (!cfg?.passive?.onTakeDamage) return damage;
        const ctx: PassiveContext = {
            attacker: opponent,
            victim: unit,
            isPlayer: target === 'player',
            damage,
            isCrit,
            engine: this,
        };
        const result = cfg.passive.onTakeDamage(ctx);
        if (result.extraLog) {
            this.updateState({ log: result.extraLog });
            this.addCombatLog(result.extraLog);
        }
        if (result.cancelDamage) return 0;
        if (result.damageModifier != null) return Math.ceil(damage * result.damageModifier);
        return damage;
    }

    public async resolvePeriodicDamage(unit: HeroUnit, isPlayer: boolean) {
        await BattleStatusSystem.resolvePeriodicDamage(this, unit, isPlayer);
    }

    public decrementStatusDurations(unit: HeroUnit) {
        BattleStatusSystem.decrementStatusDurations(this, unit);
    }

    public updateStatusesState() {
        BattleStatusSystem.updateStatusesState(this);
    }

    public updateState(patch: Partial<BattleState>) {
        this.state = { ...this.state, ...patch };
        this.onStateChange(this.state);
    }

    public cancelTweens(): void {
        this.tweensCancelled = true;
        this.activeRafIds.forEach((id) => {
            cancelAnimationFrame(id);
        });
        this.activeRafIds = [];
    }

    public destroy() {
        this.cancelTweens();
        if (this.initTimeoutId) {
            clearTimeout(this.initTimeoutId);
            this.initTimeoutId = null;
        }
        if (this.storeUnsubscribe) this.storeUnsubscribe();
        const pixiApp = PixiApp.getInstance();
        if (this.updateCallback) pixiApp.removeUpdateLoop(this.updateCallback);

        if (this.player) {
            this.player.removeStunEffect();
            this.player.removeBurnEffect();
            this.player.removeFreezeEffect();
            this.player.removePoisonEffect();
            this.player.statusEffects = [];
            this.player.resetToIdle();
        }
        if (this.enemy) {
            this.enemy.removeStunEffect();
            this.enemy.removeBurnEffect();
            this.enemy.removeFreezeEffect();
            this.enemy.removePoisonEffect();
            this.enemy.statusEffects = [];
            this.enemy.resetToIdle();
        }
        this.updateStatusesState();

        if (this.currentArenaBgUrl) {
            try {
                PIXI.Assets.unload(this.currentArenaBgUrl);
            } catch (err) {
                console.warn('Failed to unload arena background:', err);
            }
            this.currentArenaBgUrl = null;
        }

        pixiApp.clearAllLayers();
        pixiApp.returnToHomeContainer();

        this.isCombatRunning = false;
        this.isInitialized = false;
        BattleEngine.instance = null;
    }
}
