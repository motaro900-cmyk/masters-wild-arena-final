import * as PIXI from 'pixi.js';
import { HeroUnit } from '../entities/HeroUnit';
import { EffectsManager } from '../systems/EffectsManager';
import { AssetsMap } from '../../configs/AssetsMap';
import { audioService } from '../../services/AudioService';
import { PixiApp } from './PixiApp';
import { useGameStore } from '../../store/useGameStore';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';
import { ATB_THRESHOLD as ATB_THRESHOLD_CONST } from '../../game/configs/GameConstants';
import { getAbilityConfig, getAbilityConfigByRole, type StatusType, type PassiveContext } from '../../configs/AbilityConfig';

// Import extracted subsystems
import * as BattleStatusSystem from './battle/BattleStatusSystem';
import * as BattleAbilitySystem from './battle/BattleAbilitySystem';
import * as BattleSimulation from './battle/BattleSimulation';

function getWeaponArchetype(itemId: string | null): 'SWORD' | 'BOW' | 'STAFF' | 'DAGGER' | 'OTHER' {
    if (!itemId) return 'OTHER';
    const id = itemId.toLowerCase();
    if (id.includes('bow')) return 'BOW';
    if (
        id.includes('staff') ||
        id.includes('wand') ||
        id.includes('stick') ||
        id.includes('scepter') ||
        id.includes('jezl')
    )
        return 'STAFF';
    if (id.includes('dagger') || id.includes('claw')) return 'DAGGER';
    if (id.includes('sword') || id.includes('katana') || id.includes('blade') || id.includes('sabre')) return 'SWORD';
    return 'OTHER';
}

export interface BattleState {
    playerHP: number;
    playerMaxHP: number;
    enemyHP: number;
    enemyMaxHP: number;
    log: string;
    playerMana: number;
    playerMaxMana: number;
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

    public isCombatRunning: boolean = false;
    public isInitialized: boolean = false;
    public battleTime: number = 0;
    private initTimeoutId: ReturnType<typeof setTimeout> | null = null;
    public totalDamageDealt: number = 0;
    public totalDamageTaken: number = 0;
    public totalTurnsPlayed: number = 0;

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
        playerStatuses: [],
        enemyStatuses: [],
        playerShield: 0,
    };

    private updateCallback: ((dt: number) => void) | null = null;
    private storeUnsubscribe: (() => void) | null = null;

    private constructor() {}

    async init(_container: HTMLElement, heroId: string, enemyId: string, playerStats: any, enemyStats: any) {
        if (this.isInitialized) return;
        this.isInitialized = true;

        try {
            this.totalDamageDealt = 0;
            this.totalDamageTaken = 0;
            this.totalTurnsPlayed = 0;

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
                dodge: Math.max(0.05, pDodge > 1 ? pDodge / 100 : pDodge),
                critDamage: Number(playerStats?.critDamage) || 1.5,
            };
            this.enemyStats = {
                hp: Number(enemyStats?.hp) || 100,
                attack: Number(enemyStats?.attack) || 8,
                defense: Number(enemyStats?.defense) || 3,
                speed: Number(enemyStats?.speed) || 1.2,
                critChance: Math.max(0.22, eCrit > 1 ? eCrit / 100 : eCrit),
                dodge: Math.max(0.05, eDodge > 1 ? eDodge / 100 : eDodge),
                critDamage: Number(enemyStats?.critDamage) || 1.5,
            };

            const pixiApp = PixiApp.getInstance();
            await pixiApp.init({}, _container);
            pixiApp.clearAllLayers();

            const isMobile = useGameStore.getState().isMobile;
            const arenas = isMobile ? AssetsMap.BACKGROUNDS.BATTLE_ARENAS_MOBILE : AssetsMap.BACKGROUNDS.BATTLE_ARENAS;
            const randomBg = arenas[Math.floor(Math.random() * arenas.length)];
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

            this.player.position.set(W * 0.25, H * 0.82);
            this.player.defaultX = this.player.x;
            this.player.defaultY = this.player.y;

            const playerBaseScale = this.player.config?.baseScale || 1.0;
            this.player.parentDefaultScaleX = playerBaseScale;
            this.player.parentDefaultScaleY = playerBaseScale;
            this.player.scale.set(playerBaseScale, playerBaseScale);
            this.player.alpha = 1;
            this.player.visible = true;

            let enemyY = H * 0.82;
            let enemyBaseScale = this.enemy.config?.baseScale || 1.0;
            let enemyScaleX = -enemyBaseScale;
            if (this.enemy.isMob) {
                enemyBaseScale *= 0.72;
                enemyY = H * 0.88;
                enemyScaleX = enemyBaseScale;
            }
            this.enemy.position.set(W * 0.75, enemyY);
            this.enemy.defaultX = this.enemy.x;
            this.enemy.defaultY = this.enemy.y;
            this.enemy.parentDefaultScaleX = enemyScaleX;
            this.enemy.parentDefaultScaleY = enemyBaseScale;
            this.enemy.scale.set(enemyScaleX, enemyBaseScale);
            this.enemy.alpha = 1;
            this.enemy.visible = true;

            pixiApp.gameLayer.addChild(this.player, this.enemy);
            pixiApp.startRendering();

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
            useGameStore.getState().addCombatLog('--- НАЧАЛО БОЯ ---');

            this.updateCallback = (dt: number) => {
                const { timeScale } = useGameStore.getState();
                const delta = dt * timeScale;
                this.battleTime += delta;

                if (this.player) this.player.update(delta);
                if (this.enemy) this.enemy.update(delta);
            };
            pixiApp.addUpdateLoop(this.updateCallback);

            this.initTimeoutId = setTimeout(() => {
                this.isCombatRunning = true;
                this.runCombatLoop();
            }, 400);
        } catch (error) {
            console.error('BattleEngine initialization failed:', error);
            this.isInitialized = false; // сброс флага чтобы разрешить повторную инициализацию
            this.updateState({ log: 'ОШИБКА ЗАГРУЗКИ БОЯ' });
        }
    }

    private async runCombatLoop() {
        if (!this.isCombatRunning) return;

        const ATB_THRESHOLD = ATB_THRESHOLD_CONST;
        const getEffectiveSpeed = (unit: HeroUnit, stats: ICombatStats) => {
            const raw = unit.isFrozenStatus ? Math.ceil(stats.speed * 0.5) : stats.speed;
            return Math.max(raw, 1); // guard: speed=0 вызвал бы бесконечный цикл ATB
        };

        let playerTicks = 0;
        let enemyTicks = 0;

        const openingMsg = getEffectiveSpeed(this.player!, this.playerStats!) >= getEffectiveSpeed(this.enemy!, this.enemyStats!)
            ? `Вы наносите удар первыми! (Скорость: ${this.playerStats!.speed} → ${this.enemyStats!.speed})`
            : `Враг атакует первым! (Скорость: ${this.enemyStats!.speed} → ${this.playerStats!.speed})`;
        this.updateState({ log: openingMsg });
        useGameStore.getState().addCombatLog('--- НАЧАЛО БОЯ ---');

        while (this.isCombatRunning && this.state.playerHP > 0 && this.state.enemyHP > 0) {
            // Накапливаем тики до тех пор, пока хотя бы один не превысит порог в 100
            while (playerTicks < ATB_THRESHOLD && enemyTicks < ATB_THRESHOLD) {
                playerTicks += getEffectiveSpeed(this.player!, this.playerStats!);
                enemyTicks += getEffectiveSpeed(this.enemy!, this.enemyStats!);
            }

            const { timeScale } = useGameStore.getState();
            const isPlayerTurn = playerTicks >= enemyTicks;

            if (isPlayerTurn) {
                await this.resolvePeriodicDamage(this.player!, true);
                if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

                if (this.player!.isStunnedStatus) {
                    const skipMsg = 'Вы оглушены и пропускаете ход!';
                    this.updateState({ log: skipMsg });
                    useGameStore.getState().addCombatLog(`💫 ${skipMsg}`);
                    await new Promise((r) => setTimeout(r, 1500 / timeScale));
                } else if (this.state.playerMana >= 100) {
                    await this.castActiveAbility();
                } else {
                    await this.executeAttack(this.player!, this.enemy!, true);
                }

                this.decrementStatusDurations(this.player!);
                playerTicks -= ATB_THRESHOLD;
            } else {
                const { isEnemyFrozen } = useGameStore.getState();
                if (!isEnemyFrozen) {
                    await this.resolvePeriodicDamage(this.enemy!, false);
                    if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

                    if (this.enemy!.isStunnedStatus) {
                        const skipMsg = 'Враг оглушен и пропускает ход!';
                        this.updateState({ log: skipMsg });
                        useGameStore.getState().addCombatLog(`💫 ${skipMsg}`);
                        await new Promise((r) => setTimeout(r, 1500 / timeScale));
                    } else {
                        await this.executeAttack(this.enemy!, this.player!, false);
                    }

                    this.decrementStatusDurations(this.enemy!);
                }
                enemyTicks -= ATB_THRESHOLD;
            }

            if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;
            await new Promise((r) => setTimeout(r, 2200 / timeScale));
        }

        this.checkCombatEnd();
    }

    private checkCombatEnd() {
        this.isCombatRunning = false;
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
        store.addCombatLog(isWin ? '🏁 БОЙ ЗАВЕРШЕН: ПОБЕДА' : '🏁 БОЙ ЗАВЕРШЕН: ПОРАЖЕНИЕ');

        store.updateQuestProgress('PLAY', 1);
        if (isWin) store.updateQuestProgress('WIN', 1);
    }

    private async executeAttack(attacker: HeroUnit, victim: HeroUnit, isPlayer: boolean) {
        if (!this.isCombatRunning) return;

        const { timeScale, addCombatLog } = useGameStore.getState();
        const attackerEquipment = useGameStore.getState().heroEquipment[attacker.config?.id || ''] || {};
        const attackerWeaponId = attackerEquipment.WEAPONS || null;
        const attackerWeaponArchetype = getWeaponArchetype(attackerWeaponId);

        if (isPlayer) {
            const currentMana = this.state.playerMana;
            const newMana = Math.min(100, currentMana + 25);
            this.updateState({ playerMana: newMana });
        }

        await new Promise((r) => setTimeout(r, 100 / timeScale));

        const startX = attacker.x;
        const startY = attacker.y;

        const inventoryItem = useGameStore.getState().inventory.find(
            (i: any) => i.id === attackerWeaponId || i.instanceId === attackerWeaponId,
        );
        const weaponBaseId = inventoryItem ? inventoryItem.id : attackerWeaponId;
        const weaponData = weaponBaseId ? ITEMS_DATABASE[weaponBaseId] : null;
        let specialChance = 0.08;
        if (weaponData) {
            const rarity = (weaponData.rarity || 'COMMON').toUpperCase();
            if (rarity === 'UNCOMMON') specialChance += 0.05;
            else if (rarity === 'RARE') specialChance += 0.1;
            else if (rarity === 'EPIC') specialChance += 0.18;
            else if (rarity === 'LEGENDARY') specialChance += 0.28;

            const wLvl = inventoryItem?.level || 1;
            specialChance += wLvl * 0.01;
        }

        const stats = isPlayer ? this.playerStats! : this.enemyStats!;
        const isCrit = Math.random() < stats.critChance;
        if (isCrit) specialChance += 0.12;
        specialChance = Math.min(0.8, specialChance);

        const isSpecialStrike = Math.random() < specialChance;
        attacker.attackCounter = (attacker.attackCounter || 0) + 1;
        const isAssassin = attacker.config?.role === 'ASSASSIN';
        const isShadowStep = isAssassin && attacker.attackCounter % 4 === 0;

        if (isShadowStep) {
            const stepLog = `👤 ${attacker.config.name} уходит в тень (Shadow Step)!`;
            this.updateState({ log: stepLog });
            addCombatLog(stepLog);

            await attacker.animateTeleportOut();
            if (!this.isCombatRunning) return;

            const targetX = isPlayer ? victim.x + 85 : victim.x - 85;
            const faceScaleX = -attacker.parentDefaultScaleX;

            await attacker.animateTeleportIn(targetX, faceScaleX);
        } else if (isSpecialStrike) {
            if (attacker.config?.role === 'TANK' && typeof attacker.jumpSlam === 'function') {
                await attacker.jumpSlam(isPlayer ? victim.x - 85 : victim.x + 85);
            } else {
                await attacker.animateLungeForward(isPlayer, 6, victim.x);
            }
        } else {
            await attacker.animateLungeForward(isPlayer, undefined, victim.x);
        }

        if (!this.isCombatRunning) return;

        const isJumpStrikeCombo = isSpecialStrike && !isShadowStep;

        if (isJumpStrikeCombo) {
            const baseScale = attacker.config.baseScale || 1.0;

            const tweenTo = (
                obj: any,
                props: Record<string, number>,
                durationMs: number,
                easeIn = false,
            ): Promise<void> => {
                return new Promise((resolve) => {
                    const startVals: Record<string, number> = {};
                    for (const k in props) startVals[k] = obj[k];
                    const start = performance.now();
                    const tick = (now: number) => {
                        const t = Math.min(1, (now - start) / durationMs);
                        const ease = easeIn ? t * t : 1 - Math.pow(1 - t, 2);
                        for (const k in props) obj[k] = startVals[k] + (props[k] - startVals[k]) * ease;
                        if (t < 1) requestAnimationFrame(tick);
                        else resolve();
                    };
                    requestAnimationFrame(tick);
                });
            };

            const chargeDuration = Math.round(450 / timeScale);
            tweenTo(attacker, { y: startY - 460 }, chargeDuration);
            tweenTo(
                attacker.scale,
                {
                    x: attacker.parentDefaultScaleX * 1.3,
                    y: baseScale * 1.3,
                },
                chargeDuration,
            );

            EffectsManager.getInstance().particleBurst(attacker.x, attacker.y - 200, 12, 0x00ffff, 120);

            await new Promise((r) => setTimeout(r, chargeDuration));
            if (!this.isCombatRunning) return;

            attacker.playAttackAnimation();

            const smashDuration = Math.round(220 / timeScale);
            tweenTo(attacker, { x: victim.x, y: victim.y }, smashDuration, true);
            tweenTo(
                attacker.scale,
                {
                    x: attacker.parentDefaultScaleX,
                    y: baseScale,
                },
                smashDuration,
                true,
            );

            await new Promise((r) => setTimeout(r, smashDuration));
            if (!this.isCombatRunning) return;

            EffectsManager.getInstance().screenShake(25, 0.9, 600);
            audioService.playCritSFX();

            const hitX = victim.x;
            const hitY = victim.y - 120;
            EffectsManager.getInstance().particleBurst(hitX, hitY, 35, 0xffea00, 320);
            EffectsManager.getInstance().slashEffect(hitX, hitY, isPlayer, attacker.config?.role, true);

            const targetStats = isPlayer ? this.enemyStats! : this.playerStats!;
            const { isOneShot } = useGameStore.getState();

            let damage = stats.attack * 2.5 * (0.9 + Math.random() * 0.2);
            if (isPlayer && isOneShot) damage = 999999;
            const finalDamage = Math.ceil(Math.max(1, damage - targetStats.defense * 0.5));

            const hasStunImmunity = victim.statusEffects.some((s: any) => s.type === 'STUN_IMMUNITY');

            if (!hasStunImmunity) {
                victim.isStunnedStatus = true;
                victim.showStunEffect();
                victim.setFrame(0);
                this.onCombatEvent({
                    type: 'INSTINCT',
                    damage: 0,
                    target: isPlayer ? 'enemy' : 'player',
                    label: '💫 ОГЛУШЕНИЕ!',
                });
            } else {
                this.onCombatEvent({
                    type: 'INSTINCT',
                    damage: 0,
                    target: isPlayer ? 'enemy' : 'player',
                    label: '🛡️ ИММУНИТЕТ К СТАНУ',
                });
                addCombatLog(`🛡️ ${victim.config.name} защищен от оглушения иммунитетом!`);
            }

            victim.playHitEffect();
            victim.animateHitReaction(true);

            const comboMsg = `💥 [КОМБО] ${attacker.config.name} проводит Сокрушительный прыжок на ${finalDamage} урона с оглушением!`;
            this.updateState({ log: comboMsg });
            addCombatLog(comboMsg);

            if (isPlayer) {
                const nextHP = this.applyDamage('enemy', finalDamage);
                if (nextHP <= 0) victim.animateDeath(false);
            } else {
                const nextHP = this.applyDamage('player', finalDamage);
                if (nextHP <= 0) victim.animateDeath(true);
            }

            await new Promise((r) => setTimeout(r, 900 / timeScale));
            await attacker.animateLungeReturn(startX, startY);
            return;
        }

        attacker.playAttackAnimation();

        const hitX = isPlayer ? attacker.x + 85 : attacker.x - 85;
        const hitY = attacker.y - 120;

        if (attackerWeaponArchetype === 'STAFF') {
            const startX = attacker.x;
            const startY = attacker.y - 120;
            const targetX = victim.x;
            const targetY = victim.y - 120;
            if (isCrit) {
                EffectsManager.getInstance().spawnLightningStrike(targetX, targetY);
            } else {
                EffectsManager.getInstance().spawnFireballProjectile(startX, startY, targetX, targetY, victim);
            }
        } else {
            EffectsManager.getInstance().slashEffect(hitX, hitY, isPlayer, attacker.config?.role, isCrit);
        }

        const targetStats = isPlayer ? this.enemyStats! : this.playerStats!;
        const { isGodMode, isOneShot } = useGameStore.getState();

        let instinctEvent: { type: 'RAGE' | 'SHIELD' | 'COUNTER' | 'FOCUS'; label: string } | null = null;
        if (Math.random() < 0.15 && !(isPlayer && isOneShot)) {
            const instincts = [
                { type: 'RAGE', label: 'ЯРОСТЬ (+50% Урон)' },
                { type: 'FOCUS', label: 'КОНЦЕНТРАЦИЯ (Без промаха)' },
                { type: 'SHIELD', label: 'КАМЕННАЯ КОЖА (-50% Урон)' },
                { type: 'COUNTER', label: 'ОТВЕТНЫЙ УДАР' },
            ] as const;
            instinctEvent = instincts[Math.floor(Math.random() * instincts.length)];

            this.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target:
                    instinctEvent.type === 'SHIELD' || instinctEvent.type === 'COUNTER'
                        ? isPlayer
                            ? 'enemy'
                            : 'player'
                        : isPlayer
                          ? 'player'
                          : 'enemy',
                label: instinctEvent.label,
            });
            addCombatLog(`⚡ Сработал инстинкт: ${instinctEvent.label}!`);

            await new Promise((r) => setTimeout(r, 400 / timeScale));
        }

        const victimEquipment = useGameStore.getState().heroEquipment[victim.config?.id || ''] || {};
        const victimWeaponId = victimEquipment.WEAPONS || null;
        const victimWeaponArchetype = getWeaponArchetype(victimWeaponId);

        let extraDodge = 0;
        if (victimWeaponArchetype === 'BOW') {
            extraDodge = 0.15;
        }

        let totalDodgeChance = Math.min(0.60, (targetStats.dodge || 0.05) + extraDodge);
        let hasDodged = Math.random() < totalDodgeChance;
        if (instinctEvent?.type === 'FOCUS') hasDodged = false;
        if (victim.isStunnedStatus) hasDodged = false;

        if (hasDodged && !(isPlayer && isOneShot)) {
            attacker.playAttackAnimation();
            await new Promise((r) => setTimeout(r, 150 / timeScale));

            audioService.playSFX('/assets/audio/sfx/miss.mp3');
            const dodgeTypeLabel = victimWeaponArchetype === 'BOW' ? ' (Благодаря луку!)' : '';
            const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} уклоняется от атаки! (УВОРОТ)${dodgeTypeLabel}`;
            this.updateState({ log: logMsg });
            addCombatLog(logMsg);
            this.onCombatEvent({ type: 'DODGE', damage: 0, target: isPlayer ? 'enemy' : 'player' });

            const dodgePromise = victim.animateDodge(!isPlayer);
            EffectsManager.getInstance().dodgeEffect(victim);

            await dodgePromise;

            if (isShadowStep) {
                await attacker.animateTeleportOut();
                const originalFaceScaleX = attacker.parentDefaultScaleX;
                await attacker.animateTeleportIn(startX, originalFaceScaleX);
            } else {
                await attacker.animateLungeReturn(startX, startY);
            }
            return;
        }

        let damage = stats.attack * (0.9 + Math.random() * 0.2);
        const cappedCritDamage = Math.min(stats.critDamage || 1.5, 3.0);
        if (isCrit) damage *= cappedCritDamage;
        if (instinctEvent?.type === 'RAGE') damage *= 1.5;
        if (isPlayer && isOneShot) damage = 999999;

        let targetDefense = targetStats.defense;
        if (attackerWeaponArchetype === 'STAFF') {
            targetDefense *= 0.5;
            addCombatLog(`✨ [Магия] Атака посохом игнорирует 50% защиты цели!`);
        }

        let defenseReduction = targetDefense / (targetDefense + 200);
        let mitigated = damage * (1 - defenseReduction);
        if (!isPlayer && isGodMode) mitigated = 0;
        if (instinctEvent?.type === 'SHIELD') mitigated *= 0.5;

        let finalDamage = Math.ceil(mitigated);
        // Пассивный хук: может увеличить урон персонажа (SHADOW_MARK и др.)
        finalDamage = this.triggerPassiveOnDealDamage(attacker, victim, finalDamage, isCrit, isPlayer);

        if (instinctEvent?.type === 'COUNTER') {
            const counterDamage = Math.max(1, Math.ceil(targetStats.attack * 0.5));
            if (isPlayer) {
                const nextP_HP = this.applyDamage('player', counterDamage);
                this.totalDamageTaken += counterDamage;
                this.onCombatEvent({ type: 'HIT', damage: counterDamage, target: 'player' });
                if (nextP_HP <= 0) attacker.animateDeath(true);
            } else {
                const nextE_HP = this.applyDamage('enemy', counterDamage);
                this.onCombatEvent({ type: 'HIT', damage: counterDamage, target: 'enemy' });
                this.totalDamageDealt += counterDamage;
                if (nextE_HP <= 0) attacker.animateDeath(false);
            }
        }

        let hasBlocked = Math.random() < (targetStats.defense > 0 ? 0.15 : 0.05);
        if (instinctEvent?.type === 'FOCUS') hasBlocked = false;
        if (victim.isStunnedStatus) hasBlocked = false;

        if (hasBlocked && !(isPlayer && isOneShot)) {
            audioService.playSFX('/assets/audio/sfx/block.mp3');
            const blockedDamage = Math.max(1, Math.ceil(finalDamage * 0.3));
            if (isPlayer) this.totalDamageDealt += blockedDamage;
            const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} блокирует удар! Урон снижен до ${blockedDamage}.`;
            this.updateState({ log: logMsg });
            addCombatLog(logMsg);
            this.onCombatEvent({ type: 'BLOCK', damage: blockedDamage, target: isPlayer ? 'enemy' : 'player' });

            victim.animateHitReaction(false);
            EffectsManager.getInstance().blockEffect(victim);
            victim.playHitEffect();

            if (isPlayer) {
                const nextHP = this.applyDamage('enemy', blockedDamage);
                useGameStore.getState().updateQuestProgress('DAMAGE', blockedDamage);
                if (nextHP <= 0) victim.animateDeath(false);
            } else {
                const nextHP = this.applyDamage('player', blockedDamage);
                this.totalDamageTaken += blockedDamage;
                if (nextHP <= 0) victim.animateDeath(true);
            }

            await new Promise((r) => setTimeout(r, 650 / timeScale));
            await attacker.animateLungeReturn(startX, startY);
            return;
        }

        let logMsg: string;
        if (isPlayer) {
            this.totalDamageDealt += finalDamage;
        } else {
            this.totalDamageTaken += finalDamage;
        }

        let isStunnedThisHit = false;
        if (isCrit && Math.random() < 0.35) {
            isStunnedThisHit = true;
            this.applyStatus(victim, 'STUN', 1, 0, !isPlayer);
        }

        const attackerId = attacker.config?.id;
        const attackerRole = attacker.config?.role;

        // Используем ABILITY_REGISTRY вместо хардкода ID/role
        const abilityCfg = getAbilityConfig(attackerId) ?? getAbilityConfigByRole(attackerRole);
        if (abilityCfg?.attackPassive) {
            const { chance, status, duration, damagePercent, value } = abilityCfg.attackPassive;
            if (Math.random() < chance) {
                const dmgPerTurn = damagePercent ? Math.ceil(stats.attack * damagePercent) : (value ?? 0);
                this.applyStatus(victim, status, duration, dmgPerTurn, !isPlayer);
            }
        }

        if (isCrit) {
            audioService.playCritSFX();
            logMsg = `[Раунд] ${isPlayer ? 'Вы наносите' : 'Враг наносит'} КРИТИЧЕСКИЙ УДАР на ${finalDamage}!${isStunnedThisHit ? ' (ОГЛУШЕНИЕ!)' : ''}`;
            this.onCombatEvent({
                type: 'CRIT',
                damage: finalDamage,
                target: isPlayer ? 'enemy' : 'player',
            });

            if (isStunnedThisHit) {
                this.onCombatEvent({
                    type: 'INSTINCT',
                    damage: 0,
                    target: isPlayer ? 'enemy' : 'player',
                    label: '💫 ОГЛУШЕНИЕ!',
                });
            }

            victim.animateHitReaction(true);
            EffectsManager.getInstance().criticalHit(victim);
            if (isStunnedThisHit) {
                addCombatLog(`💫 ${isPlayer ? 'Враг' : 'Вы'} оглушен критическим ударом!`);
            }
        } else {
            audioService.playStrikeSFX(attackerWeaponArchetype);
            logMsg = `[Раунд] ${isPlayer ? 'Вы бьёте' : 'Враг бьёт'} на ${finalDamage}!`;
            this.onCombatEvent({ type: 'HIT', damage: finalDamage, target: isPlayer ? 'enemy' : 'player' });

            victim.animateHitReaction(false);
            EffectsManager.getInstance().normalHit(victim);
        }

        victim.playHitEffect();
        this.updateState({ log: logMsg });
        addCombatLog(logMsg);

        if (isPlayer) {
            const nextHP = this.applyDamage('enemy', finalDamage);
            useGameStore.getState().updateQuestProgress('DAMAGE', finalDamage);
            if (nextHP <= 0) victim.animateDeath(false);
        } else {
            const nextHP = this.applyDamage('player', finalDamage);
            if (nextHP <= 0) victim.animateDeath(true);
        }

        await new Promise((r) => setTimeout(r, 650 / timeScale));
        if (isShadowStep) {
            await attacker.animateTeleportOut();
            const originalFaceScaleX = attacker.parentDefaultScaleX;
            await attacker.animateTeleportIn(startX, originalFaceScaleX);
        } else {
            await attacker.animateLungeReturn(startX, startY);
        }
    }

    public applyDamage(target: 'player' | 'enemy', damage: number): number {
        // Пассивный хук: CRYSTAL_SHIELD может отразить часть урона
        const modifiedDamage = this.triggerPassiveOnTakeDamage(target, damage);
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
            const nextHP = Math.max(0, this.state.playerHP - remainingDamage);
            this.updateState({ playerHP: nextHP });
            return nextHP;
        } else {
            const nextHP = Math.max(0, this.state.enemyHP - modifiedDamage);
            this.updateState({ enemyHP: nextHP });
            return nextHP;
        }
    }

    public instantWin() {
        this.updateState({ enemyHP: 0 });
        useGameStore.getState().addCombatLog('⚡ ADMIN: Мгновенная победа');
    }

    public instantLose() {
        this.updateState({ playerHP: 0 });
        useGameStore.getState().addCombatLog('💀 ADMIN: Самоубийство');
    }

    // --- Subsystem Delegation ---
    public skipToEndOfBattle() {
        BattleSimulation.skipToEndOfBattle(this);
    }

    public async castActiveAbility() {
        await BattleAbilitySystem.castActiveAbility(this);
    }

    public applyStatus(
        unit: HeroUnit,
        type: StatusType,
        duration: number,
        damagePerTurn: number,
        isPlayer: boolean,
    ) {
        BattleStatusSystem.applyStatus(this, unit, type, duration, damagePerTurn, isPlayer);
    }

    // Пассивные хуки — вызываются из executeAttack и applyDamage
    public triggerPassiveOnDealDamage(attacker: HeroUnit, victim: HeroUnit, damage: number, isCrit: boolean, isPlayer: boolean): number {
        const cfg = getAbilityConfig(attacker.config?.id);
        if (!cfg?.passive?.onDealDamage) return damage;
        const ctx: PassiveContext = { attacker, victim, isPlayer, damage, isCrit, engine: this };
        const result = cfg.passive.onDealDamage(ctx);
        if (result.extraLog) { this.updateState({ log: result.extraLog }); useGameStore.getState().addCombatLog(result.extraLog); }
        if (result.damageModifier != null) return Math.ceil(damage * result.damageModifier);
        return damage;
    }

    public triggerPassiveOnTakeDamage(target: 'player' | 'enemy', damage: number, isCrit = false): number {
        const unit = target === 'player' ? this.player : this.enemy;
        const opponent = target === 'player' ? this.enemy : this.player;
        const cfg = getAbilityConfig(unit?.config?.id);
        if (!cfg?.passive?.onTakeDamage) return damage;
        const ctx: PassiveContext = { attacker: opponent, victim: unit, isPlayer: target === 'player', damage, isCrit, engine: this };
        const result = cfg.passive.onTakeDamage(ctx);
        if (result.extraLog) { this.updateState({ log: result.extraLog }); useGameStore.getState().addCombatLog(result.extraLog); }
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

    public destroy() {
        if (this.initTimeoutId) { clearTimeout(this.initTimeoutId); this.initTimeoutId = null; }
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

        pixiApp.clearAllLayers();
        pixiApp.returnToHomeContainer();

        this.isCombatRunning = false;
        this.isInitialized = false;
        BattleEngine.instance = null;
    }
}
