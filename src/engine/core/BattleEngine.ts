import * as PIXI from 'pixi.js';
import { HeroUnit } from '../entities/HeroUnit';
import { EffectsManager } from '../systems/EffectsManager';
import { AssetsMap } from '../../configs/AssetsMap';
import { audioService } from '../../services/AudioService';
import { PixiApp } from './PixiApp';
import { useGameStore } from '../../store/useGameStore';
import { HEROES_DB } from '../../configs/HeroesConfig';
import { ITEMS_DATABASE } from '../../game/configs/ItemsConfig';

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

    private player: HeroUnit | null = null;
    private enemy: HeroUnit | null = null;

    public getPlayerUnit(): HeroUnit | null {
        return this.player;
    }

    public getEnemyUnit(): HeroUnit | null {
        return this.enemy;
    }

    private playerStats: ICombatStats | null = null;
    private enemyStats: ICombatStats | null = null;

    private playerAttackTimer: number = 0;
    private enemyAttackTimer: number = 0;
    private isCombatRunning: boolean = false;
    public isInitialized: boolean = false;
    public battleTime: number = 0;
    public totalDamageDealt: number = 0;
    public totalDamageTaken: number = 0;

    public onStateChange: (state: BattleState) => void = () => {};
    public onCombatEvent: (event: CombatEvent) => void = () => {};
    private state: BattleState = {
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...',
        playerMana: 0,
        playerMaxMana: 100,
        playerStatuses: [],
        enemyStatuses: [],
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

            // Нормализация процентов крита и уклонения (из 0-100% в 0.0-1.0)
            const pCrit = Number(playerStats?.critChance) || 10;
            const pDodge = Number(playerStats?.evasion ?? playerStats?.dodge) || 5;

            const eCrit = Number(enemyStats?.critChance ?? enemyStats?.crit) || 10;
            const eDodge = Number(enemyStats?.dodge ?? enemyStats?.evasion) || 5;

            // [Lead Architect]: Safe fallbacks for missing stats using Number() || to prevent NaN
            this.playerStats = {
                hp: Number(playerStats?.hp) || 100,
                attack: Number(playerStats?.attack) || 10,
                defense: Number(playerStats?.defense) || 5,
                speed: Number(playerStats?.speed) || 1.5,
                critChance: Math.max(0.25, pCrit > 1 ? pCrit / 100 : pCrit), // Мин 25% шанс крита
                dodge: Math.max(0.18, pDodge > 1 ? pDodge / 100 : pDodge), // Мин 18% шанс уворота
                critDamage: Number(playerStats?.critDamage) || 1.5,
            };
            this.enemyStats = {
                hp: Number(enemyStats?.hp) || 100,
                attack: Number(enemyStats?.attack) || 8,
                defense: Number(enemyStats?.defense) || 3,
                speed: Number(enemyStats?.speed) || 1.2,
                critChance: Math.max(0.22, eCrit > 1 ? eCrit / 100 : eCrit), // Мин 22% шанс крита
                dodge: Math.max(0.15, eDodge > 1 ? eDodge / 100 : eDodge), // Мин 15% шанс уворота
                critDamage: Number(enemyStats?.critDamage) || 1.5,
            };

            // 1. ПОДГОТОВКА СЦЕНЫ
            const pixiApp = PixiApp.getInstance();
            await pixiApp.init({}, _container);
            pixiApp.clearAllLayers();

            // 2. ЗАГРУЗКА ФОНА
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
            console.log('2. background ready');

            // 3. ЗАГРУЗКА БОЙЦОВ
            const { heroEquipment } = useGameStore.getState();

            // Игрок
            this.player = new HeroUnit();
            await this.player.loadHero(heroId);

            await this.player.updateEquipment(heroEquipment[heroId] || {});

            // Враг
            this.enemy = new HeroUnit();
            await this.enemy.loadHero(enemyId);

            await this.enemy.updateEquipment({});

            // ЯВНОЕ ПОЗИЦИОНИРОВАНИЕ (1920x1080)
            this.player.position.set(W * 0.25, H * 0.82);
            this.player.defaultX = this.player.x;
            this.player.defaultY = this.player.y;

            // Player faces right (positive scale.x)
            const playerBaseScale = this.player.config?.baseScale || 1.0;
            this.player.parentDefaultScaleX = playerBaseScale;
            this.player.parentDefaultScaleY = playerBaseScale;
            this.player.scale.set(playerBaseScale, playerBaseScale);
            this.player.alpha = 1;
            this.player.visible = true;

            // Enemy faces left (negative scale.x to flip from right)
            let enemyY = H * 0.82;
            let enemyBaseScale = this.enemy.config?.baseScale || 1.0;
            let enemyScaleX = -enemyBaseScale;
            if (this.enemy.isMob) {
                enemyBaseScale *= 0.72; // Make the mob 28% smaller
                enemyY = H * 0.88;      // Lower it towards the ground
                enemyScaleX = enemyBaseScale; // Mobs face left by default, so do not flip them!
            }
            this.enemy.position.set(W * 0.75, enemyY);
            this.enemy.defaultX = this.enemy.x;
            this.enemy.defaultY = this.enemy.y;
            this.enemy.parentDefaultScaleX = enemyScaleX;
            this.enemy.parentDefaultScaleY = enemyBaseScale;
            this.enemy.scale.set(enemyScaleX, enemyBaseScale);
            this.enemy.alpha = 1;
            this.enemy.visible = true;

            // 4. ОТОБРАЖЕНИЕ (Только когда всё загружено!)
            pixiApp.gameLayer.addChild(this.player, this.enemy);
            pixiApp.startRendering();

            // 4. ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ
            this.updateState({
                playerHP: this.playerStats.hp,
                playerMaxHP: this.playerStats.hp,
                enemyHP: this.enemyStats.hp,
                enemyMaxHP: this.enemyStats.hp,
                playerMana: 0,
                playerMaxMana: 100,
                log: 'БИТВА НАЧИНАЕТСЯ!',
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
            };
            pixiApp.addUpdateLoop(this.updateCallback);

            setTimeout(() => {
                this.isCombatRunning = true;
                this.runCombatLoop();
            }, 400);
        } catch (error) {
            console.error('BattleEngine initialization failed:', error);
            this.updateState({ log: 'ОШИБКА ЗАГРУЗКИ БОЯ' });
        }
    }

    /**
     * SPEED-BASED ATB — Нет шкалы заполнения. У кого speed выше — тот атакует чаще.
     *
     * Алгоритм:
     *   - Оба бойца накапливают очки скорости после каждого ход
     *   - Первым ходит тот, у кого очки достигли порога (ATB_THRESHOLD=100)
     *   - При равенстве — первым ходит игрок (бонус первого хода)
     *
     * Пример: speed=80 вс speed=40 → игрок атакует в 2× чаще
     */
    private async runCombatLoop() {
        if (!this.isCombatRunning) return;

        const ATB_THRESHOLD = 100;
        const getEffectiveSpeed = (unit: HeroUnit, stats: ICombatStats) => {
            return unit.isFrozenStatus ? Math.ceil(stats.speed * 0.5) : stats.speed;
        };

        let playerTicks = getEffectiveSpeed(this.player!, this.playerStats!);
        let enemyTicks = getEffectiveSpeed(this.enemy!, this.enemyStats!);

        const firstIsPlayer = playerTicks >= enemyTicks;
        if (firstIsPlayer) {
            playerTicks = ATB_THRESHOLD; // игрок ходит первым
        } else {
            enemyTicks = ATB_THRESHOLD; // враг ходит первым
        }

        const openingMsg = firstIsPlayer
            ? `Вы наносите удар первыми! (Скорость: ${this.playerStats!.speed} → ${this.enemyStats!.speed})`
            : `Враг атакует первым! (Скорость: ${this.enemyStats!.speed} → ${this.playerStats!.speed})`;
        this.updateState({ log: openingMsg });
        useGameStore.getState().addCombatLog('--- НАЧАЛО БОЯ ---');

        while (this.isCombatRunning && this.state.playerHP > 0 && this.state.enemyHP > 0) {
            const { timeScale } = useGameStore.getState();

            // Определяем кто ходит сейчас
            const isPlayerTurn = playerTicks >= enemyTicks;

            if (isPlayerTurn) {
                // Применяем периодический урон в начале хода
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

                // Уменьшаем длительность статусов в конце хода
                this.decrementStatusDurations(this.player!);

                // После атаки — сбрасываем свои очки и добавляем обоим
                playerTicks = 0;
                playerTicks += getEffectiveSpeed(this.player!, this.playerStats!);
                enemyTicks += getEffectiveSpeed(this.enemy!, this.enemyStats!);
            } else {
                const { isEnemyFrozen } = useGameStore.getState();
                if (!isEnemyFrozen) {
                    // Применяем периодический урон в начале хода
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

                    // Уменьшаем длительность статусов в конце хода
                    this.decrementStatusDurations(this.enemy!);
                }
                enemyTicks = 0;
                playerTicks += getEffectiveSpeed(this.player!, this.playerStats!);
                enemyTicks += getEffectiveSpeed(this.enemy!, this.enemyStats!);
            }

            if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

            // Драматическая пауза между ходами (читаемость лога, синхронизировано со средним темпом анимации)
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

        // Анимация смерти
        if (isWin) {
            this.enemy?.animateDeath(false); // Враг падает
            if (this.enemy) EffectsManager.getInstance().deathEffect(this.enemy);
        } else {
            this.player?.animateDeath(true); // Игрок падает
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

        // Вычисляем тип оружия атакующего
        const attackerEquipment = useGameStore.getState().heroEquipment[attacker.config?.id || ''] || {};
        const attackerWeaponId = attackerEquipment.WEAPONS || null;
        const attackerWeaponArchetype = getWeaponArchetype(attackerWeaponId);

        // Накопление маны/ярости
        if (isPlayer) {
            const currentMana = this.state.playerMana;
            const newMana = Math.min(100, currentMana + 25);
            this.updateState({ playerMana: newMana });
        } else {
            const currentMana = this.state.playerMana;
            const newMana = Math.min(100, currentMana + 15);
            this.updateState({ playerMana: newMana });
        }

        // 1. ФАЗА ПОДГОТОВКИ
        await new Promise((r) => setTimeout(r, 100 / timeScale));

        const startX = attacker.x;
        const startY = attacker.y;

        // Вычисляем шанс особого удара (спецприема) на основе силы оружия и характеристик
        const weaponData = attackerWeaponId ? ITEMS_DATABASE[attackerWeaponId] : null;
        let specialChance = 0.08; // базовый шанс 8%
        if (weaponData) {
            const rarity = (weaponData.rarity || 'COMMON').toUpperCase();
            if (rarity === 'UNCOMMON') specialChance += 0.05;
            else if (rarity === 'RARE') specialChance += 0.1;
            else if (rarity === 'EPIC') specialChance += 0.18;
            else if (rarity === 'LEGENDARY') specialChance += 0.28;

            const wLvl = weaponData.level || 1;
            specialChance += wLvl * 0.01;
        }

        const stats = isPlayer ? this.playerStats! : this.enemyStats!;
        const isCrit = Math.random() < stats.critChance;
        if (isCrit) specialChance += 0.12;
        specialChance = Math.min(0.8, specialChance);

        const isSpecialStrike = Math.random() < specialChance;

        // Увеличиваем счетчик атак
        attacker.attackCounter = (attacker.attackCounter || 0) + 1;
        const isAssassin = attacker.config?.role === 'ASSASSIN';
        const isShadowStep = isAssassin && attacker.attackCounter % 4 === 0;

        // 2. РЫВОК ВПЕРЕД ИЛИ ТЕЛЕПОРТАЦИЯ ЗА СПИНУ (Shadow Step)
        if (isShadowStep) {
            const stepLog = `👤 ${attacker.config.name} уходит в тень (Shadow Step)!`;
            this.updateState({ log: stepLog });
            addCombatLog(stepLog);

            await attacker.animateTeleportOut();
            if (!this.isCombatRunning) return;

            // Вычисляем позицию за спиной цели
            const baseScale = attacker.config.baseScale || 1.0;
            const targetX = isPlayer ? victim.x + 85 : victim.x - 85;
            const faceScaleX = -attacker.parentDefaultScaleX; // Разворачиваемся лицом к жертве

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

            // Helper: smooth tween via requestAnimationFrame
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

            // 1. Взлетаем еще выше и копим энергию!
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

            // Создаем искрящуюся синюю энергию над пандой
            EffectsManager.getInstance().particleBurst(attacker.x, attacker.y - 200, 12, 0x00ffff, 120);

            await new Promise((r) => setTimeout(r, chargeDuration));

            if (!this.isCombatRunning) return;

            // Смена позы на атакующую в пике
            attacker.playAttackAnimation();

            // 2. Мощный удар всем весом прямо в координаты противника!
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

            // 3. Эпичный взрыв и оглушение!
            EffectsManager.getInstance().screenShake(25, 0.9, 600);
            audioService.playCritSFX();

            const hitX = victim.x;
            const hitY = victim.y - 120;
            EffectsManager.getInstance().particleBurst(hitX, hitY, 35, 0xffea00, 320);
            EffectsManager.getInstance().slashEffect(hitX, hitY, isPlayer, attacker.config?.role, true);

            // Сильный критический урон
            const targetStats = isPlayer ? this.enemyStats! : this.playerStats!;
            const { isOneShot } = useGameStore.getState();

            let damage = stats.attack * 2.5 * (0.9 + Math.random() * 0.2);
            if (isPlayer && isOneShot) damage = 999999;
            const finalDamage = Math.ceil(Math.max(1, damage - targetStats.defense * 0.5));

            // Стопроцентный стан с эффектом звезд
            victim.isStunnedStatus = true;
            victim.showStunEffect();
            victim.setFrame(0);

            if (isPlayer) {
                this.totalDamageDealt += finalDamage;
            } else {
                this.totalDamageTaken += finalDamage;
            }
            this.onCombatEvent({ type: 'CRIT', damage: finalDamage, target: isPlayer ? 'enemy' : 'player' });
            this.onCombatEvent({
                type: 'INSTINCT',
                damage: 0,
                target: isPlayer ? 'enemy' : 'player',
                label: '💫 ОГЛУШЕНИЕ!',
            });

            victim.playHitEffect();
            victim.animateHitReaction(true);

            const comboMsg = `💥 [КОМБО] ${attacker.config.name} проводит Сокрушительный прыжок на ${finalDamage} урона с оглушением!`;
            this.updateState({ log: comboMsg });
            addCombatLog(comboMsg);

            if (isPlayer) {
                const nextHP = Math.max(0, this.state.enemyHP - finalDamage);
                this.updateState({ enemyHP: nextHP });
                if (nextHP <= 0) victim.animateDeath(false);
            } else {
                const nextHP = Math.max(0, this.state.playerHP - finalDamage);
                this.updateState({ playerHP: nextHP });
                if (nextHP <= 0) victim.animateDeath(true);
            }

            // Задержка после смачного удара перед возвращением
            await new Promise((r) => setTimeout(r, 900 / timeScale));
            await attacker.animateLungeReturn(startX, startY);
            return;
        }

        // 2. МОМЕНТ УДАРА
        attacker.playAttackAnimation();

        // Точка взмаха прямо перед атакующим
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

        // Характеристики
        const targetStats = isPlayer ? this.enemyStats! : this.playerStats!;
        const { isGodMode, isOneShot } = useGameStore.getState();

        // --- ПРИОРИТЕТ 2: ИНСТИНКТЫ (15% шанс "Вау-момента") ---
        let instinctEvent: { type: 'RAGE' | 'SHIELD' | 'COUNTER' | 'FOCUS'; label: string } | null = null;
        if (Math.random() < 0.15 && !(isPlayer && isOneShot)) {
            const instincts = [
                { type: 'RAGE', label: 'ЯРОСТЬ (+50% Урон)' },
                { type: 'FOCUS', label: 'КОНЦЕНТРАЦИЯ (Без промаха)' },
                { type: 'SHIELD', label: 'КАМЕННАЯ КОЖА (-50% Урон)' },
                { type: 'COUNTER', label: 'ОТВЕТНЫЙ УДАР' },
            ] as const;
            instinctEvent = instincts[Math.floor(Math.random() * instincts.length)];

            // Если прокнул инстинкт, отправляем событие в UI
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

            // Микро-пауза для осознания инстинкта
            await new Promise((r) => setTimeout(r, 400 / timeScale));
        }

        // 2a. Уклон (Dodge)
        const victimEquipment = useGameStore.getState().heroEquipment[victim.config?.id || ''] || {};
        const victimWeaponId = victimEquipment.WEAPONS || null;
        const victimWeaponArchetype = getWeaponArchetype(victimWeaponId);

        let extraDodge = 0;
        if (victimWeaponArchetype === 'BOW') {
            extraDodge = 0.15; // +15% шанс уклонения при ношении лука
        }

        let hasDodged = Math.random() < (targetStats.dodge || 0.05) + extraDodge;
        if (instinctEvent?.type === 'FOCUS') hasDodged = false;
        if (victim.isStunnedStatus) hasDodged = false;

        if (hasDodged && !(isPlayer && isOneShot)) {
            // 1. Атакующий начинает удар!
            attacker.playAttackAnimation();

            // 2. Ждем замаха (150мс), после чего защищающийся отскакивает назад
            await new Promise((r) => setTimeout(r, 150 / timeScale));

            audioService.playSFX('/assets/audio/sfx/miss.mp3');
            const dodgeTypeLabel = victimWeaponArchetype === 'BOW' ? ' (Благодаря луку!)' : '';
            const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} уклоняется от атаки! (УВОРОТ)${dodgeTypeLabel}`;
            this.updateState({ log: logMsg });
            addCombatLog(logMsg);
            this.onCombatEvent({ type: 'DODGE', damage: 0, target: isPlayer ? 'enemy' : 'player' });

            // Запускаем анимацию уклонения и эффекты
            const dodgePromise = victim.animateDodge(!isPlayer);
            EffectsManager.getInstance().dodgeEffect(victim);

            // Ждем завершения уклонения и возврата
            await dodgePromise;

            // Возвращаем атакующего на исходную
            if (isShadowStep) {
                await attacker.animateTeleportOut();
                const originalFaceScaleX = attacker.parentDefaultScaleX;
                await attacker.animateTeleportIn(startX, originalFaceScaleX);
            } else {
                await attacker.animateLungeReturn(startX, startY);
            }
            return;
        }

        // Базовые характеристики и расчет базового урона

        // Расчет базового урона
        let damage = stats.attack * (0.9 + Math.random() * 0.2);
        if (isCrit) damage *= stats.critDamage || 1.5;
        if (instinctEvent?.type === 'RAGE') damage *= 1.5;
        if (isPlayer && isOneShot) damage = 999999;

        // Магический урон (Посох) игнорирует 50% защиты
        let targetDefense = targetStats.defense;
        if (attackerWeaponArchetype === 'STAFF') {
            targetDefense *= 0.5;
            addCombatLog(`✨ [Магия] Атака посохом игнорирует 50% защиты цели!`);
        }

        let mitigated = Math.max(0, damage - targetDefense * 0.5);
        if (!isPlayer && isGodMode) mitigated = 0;
        if (instinctEvent?.type === 'SHIELD') mitigated *= 0.5;

        const finalDamage = Math.ceil(mitigated);

        // Обработка инстинкта COUNTER
        if (instinctEvent?.type === 'COUNTER') {
            const counterDamage = Math.max(1, Math.ceil(targetStats.attack * 0.5));
            if (isPlayer) {
                const nextP_HP = Math.max(0, this.state.playerHP - counterDamage);
                this.updateState({ playerHP: nextP_HP });
                this.totalDamageTaken += counterDamage;
                this.onCombatEvent({ type: 'HIT', damage: counterDamage, target: 'player' });
                if (nextP_HP <= 0) attacker.animateDeath(true);
            } else {
                const nextE_HP = Math.max(0, this.state.enemyHP - counterDamage);
                this.updateState({ enemyHP: nextE_HP });
                this.onCombatEvent({ type: 'HIT', damage: counterDamage, target: 'enemy' });
                this.totalDamageDealt += counterDamage;
                if (nextE_HP <= 0) attacker.animateDeath(false);
            }
        }

        // 2b. Блок (Block)
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

            // Обычная тряска при блокировании
            victim.animateHitReaction(false);
            EffectsManager.getInstance().blockEffect(victim);
            victim.playHitEffect();

            if (isPlayer) {
                const nextHP = Math.max(0, this.state.enemyHP - blockedDamage);
                this.updateState({ enemyHP: nextHP });
                useGameStore.getState().updateQuestProgress('DAMAGE', blockedDamage);
                if (nextHP <= 0) victim.animateDeath(false);
            } else {
                const nextHP = Math.max(0, this.state.playerHP - blockedDamage);
                this.updateState({ playerHP: nextHP });
                this.totalDamageTaken += blockedDamage;
                if (nextHP <= 0) victim.animateDeath(true);
            }

            // Пауза перед возвращением
            await new Promise((r) => setTimeout(r, 650 / timeScale));
            await attacker.animateLungeReturn(startX, startY);
            return;
        }

        // 2c. Обычный урон или Крит
        let logMsg: string;
        if (isPlayer) {
            this.totalDamageDealt += finalDamage;
        } else {
            this.totalDamageTaken += finalDamage;
        }

        // Шанс оглушения при критическом ударе: 35%
        let isStunnedThisHit = false;
        if (isCrit && Math.random() < 0.35) {
            isStunnedThisHit = true;
            this.applyStatus(victim, 'STUN', 1, 0, !isPlayer);
        }

        // Character/Class specific status effects instead of wizard-like weapons
        const attackerId = attacker.config?.id;
        const attackerRole = attacker.config?.role;

        if (attackerId === 'panda' || attackerRole === 'WARRIOR' || attackerId === 'ancient_golem') {
            // FIRE/BURN Alignment (Panda, Lava Golem): 30% chance to Ignite on hit
            if (Math.random() < 0.3) {
                const burnDmg = Math.ceil(stats.attack * 0.12);
                this.applyStatus(victim, 'BURN', 3, burnDmg, !isPlayer);
            }
        } else if (attackerId === 'raccoon' || attackerRole === 'ASSASSIN' || attackerId === 'ancient_spider') {
            // POISON Alignment (Raccoon, Spider): 35% chance to Poison on hit
            if (Math.random() < 0.35) {
                const poisonDmg = Math.ceil(stats.attack * 0.09);
                this.applyStatus(victim, 'POISON', 4, poisonDmg, !isPlayer);
            }
        } else if (attackerId === 'ancient_wolf') {
            // ICE/FREEZE Alignment (Ice Wolf): 25% chance to Freeze on hit
            if (Math.random() < 0.25) {
                this.applyStatus(victim, 'FREEZE', 2, 0, !isPlayer);
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
                // Отдельный плавающий текст для оглушения
                this.onCombatEvent({
                    type: 'INSTINCT',
                    damage: 0,
                    target: isPlayer ? 'enemy' : 'player',
                    label: '💫 ОГЛУШЕНИЕ!',
                });
            }

            // Сильная критическая тряска
            victim.animateHitReaction(true);
            EffectsManager.getInstance().criticalHit(victim);
            if (isStunnedThisHit) {
                addCombatLog(`💫 ${isPlayer ? 'Враг' : 'Вы'} оглушен критическим ударом!`);
            }
        } else {
            audioService.playStrikeSFX(attackerWeaponArchetype);
            logMsg = `[Раунд] ${isPlayer ? 'Вы бьёте' : 'Враг бьёт'} на ${finalDamage}!`;
            this.onCombatEvent({ type: 'HIT', damage: finalDamage, target: isPlayer ? 'enemy' : 'player' });

            // Обычная тряска
            victim.animateHitReaction(false);
            EffectsManager.getInstance().normalHit(victim);
        }

        victim.playHitEffect();
        this.updateState({ log: logMsg });
        addCombatLog(logMsg);

        if (isPlayer) {
            const nextHP = Math.max(0, this.state.enemyHP - finalDamage);
            this.updateState({ enemyHP: nextHP });
            useGameStore.getState().updateQuestProgress('DAMAGE', finalDamage);
            if (nextHP <= 0) victim.animateDeath(false);
        } else {
            const nextHP = Math.max(0, this.state.playerHP - finalDamage);
            this.updateState({ playerHP: nextHP });
            if (nextHP <= 0) victim.animateDeath(true);
        }

        // Пауза перед возвращением
        await new Promise((r) => setTimeout(r, 650 / timeScale));
        if (isShadowStep) {
            await attacker.animateTeleportOut();
            const originalFaceScaleX = attacker.parentDefaultScaleX;
            await attacker.animateTeleportIn(startX, originalFaceScaleX);
        } else {
            await attacker.animateLungeReturn(startX, startY);
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

    public skipToEndOfBattle() {
        if (!this.isInitialized || this.state.playerHP <= 0 || this.state.enemyHP <= 0) return;

        this.isCombatRunning = false;

        const store = useGameStore.getState();
        const { isGodMode, isOneShot, isEnemyFrozen } = store;

        const pStats = this.playerStats!;
        const eStats = this.enemyStats!;

        let pHP = this.state.playerHP;
        let eHP = this.state.enemyHP;

        let pTimer = this.playerAttackTimer;
        let eTimer = this.enemyAttackTimer;

        const pMax = 2000 / Math.max(0.1, pStats.speed);
        const eMax = 2000 / Math.max(0.1, eStats.speed);

        let safetyCounter = 0;
        const maxTicks = 10000;

        // Извлекаем тип оружия игрока для симуляции
        const playerHeroId = this.player?.config?.id || '';
        const playerEquipment = store.heroEquipment[playerHeroId] || {};
        const playerWeaponArchetype = getWeaponArchetype(playerEquipment.WEAPONS || null);

        while (pHP > 0 && eHP > 0 && safetyCounter < maxTicks) {
            safetyCounter++;

            const dt = Math.min(pTimer, eTimer);
            pTimer -= dt;
            eTimer -= dt;

            // Ход игрока
            if (pTimer <= 0) {
                // Накопление маны
                let currentMana = this.state.playerMana;
                currentMana = Math.min(100, currentMana + 25);
                this.state.playerMana = currentMana;

                if (currentMana >= 100) {
                    // Использование суперспособности в симуляции
                    this.state.playerMana = 0;
                    const hero = HEROES_DB.find((h) => h.id === playerHeroId) || HEROES_DB[0];
                    const role = hero.role;
                    let mult = 2.0;
                    if (role === 'WARRIOR') mult = 2.5;
                    else if (role === 'ASSASSIN') mult = 3.5;
                    else if (role === 'TANK') mult = 1.8;
                    else mult = 2.2;

                    const rawDmg = pStats.attack * mult * (0.9 + Math.random() * 0.2);
                    const finalActiveDmg = Math.ceil(Math.max(1, rawDmg - eStats.defense * 0.25));
                    eHP = Math.max(0, eHP - finalActiveDmg);
                    store.updateQuestProgress('DAMAGE', finalActiveDmg);

                    if (role === 'SUPPORT') {
                        pHP = Math.min(pStats.hp, pHP + Math.ceil(pStats.hp * 0.2));
                    } else if (role === 'TANK') {
                        pHP = Math.min(pStats.hp + Math.ceil(pStats.hp * 0.25), pHP + Math.ceil(pStats.hp * 0.25));
                    }
                } else {
                    const dodgeCheck = Math.random() < eStats.dodge;
                    if (!dodgeCheck || isOneShot) {
                        let baseDmg = pStats.attack * (0.9 + Math.random() * 0.2);
                        const isCrit = Math.random() < pStats.critChance;
                        if (isCrit) baseDmg *= pStats.critDamage || 1.5;
                        if (isOneShot) baseDmg = 999999;

                        let targetDefense = eStats.defense;
                        if (playerWeaponArchetype === 'STAFF') {
                            targetDefense *= 0.5; // Игнорирование половины защиты цели
                        }

                        const mitigated = Math.max(0, baseDmg - targetDefense * 0.5);
                        const blockCheck = Math.random() < (eStats.defense > 0 ? 0.15 : 0.05);

                        let finalDmg = Math.ceil(mitigated);
                        if (blockCheck && !isOneShot) {
                            finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                        }

                        eHP = Math.max(0, eHP - finalDmg);
                        store.updateQuestProgress('DAMAGE', finalDmg);
                    }
                }
                pTimer = pMax;
            }

            // Ход врага
            if (eHP > 0 && !isEnemyFrozen && eTimer <= 0) {
                // При получении урона игрок копит ману
                let currentMana = this.state.playerMana;
                currentMana = Math.min(100, currentMana + 15);
                this.state.playerMana = currentMana;

                let playerDodgeChance = pStats.dodge;
                if (playerWeaponArchetype === 'BOW') {
                    playerDodgeChance += 0.15; // Бонус к уклонению от лука
                }
                const dodgeCheck = Math.random() < playerDodgeChance;
                if (!dodgeCheck) {
                    let baseDmg = eStats.attack * (0.9 + Math.random() * 0.2);
                    const isCrit = Math.random() < eStats.critChance;
                    if (isCrit) baseDmg *= eStats.critDamage || 1.5;

                    let mitigated = Math.max(0, baseDmg - pStats.defense * 0.5);
                    if (isGodMode) mitigated = 0;

                    const blockCheck = Math.random() < (pStats.defense > 0 ? 0.15 : 0.05);

                    let finalDmg = Math.ceil(mitigated);
                    if (blockCheck) {
                        finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                    }

                    pHP = Math.max(0, pHP - finalDmg);
                }
                eTimer = eMax;
            }
        }

        const isWin = pHP > 0;
        this.updateState({
            playerHP: pHP,
            enemyHP: eHP,
            log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...',
        });

        // Завершаем бой
        this.onStateChange(this.state);
    }

    public async castActiveAbility() {
        if (!this.isCombatRunning || this.state.playerMana < 100 || this.state.playerHP <= 0 || this.state.enemyHP <= 0)
            return;

        // Consume all mana
        this.updateState({ playerMana: 0 });

        const store = useGameStore.getState();
        const heroName = this.player?.config?.name || 'Герой';
        const role = this.player?.config?.role || 'WARRIOR';

        // Play casting effects
        audioService.playSFX('/assets/audio/sfx/strike_staff.mp3'); // active cast sound

        let abilityName = 'Суперудар';
        let damageMultiplier = 2.0;
        let healAmount = 0;
        let shieldAmount = 0;

        if (role === 'WARRIOR') {
            abilityName = 'Удар Дзена';
            damageMultiplier = 2.5;
        } else if (role === 'ASSASSIN') {
            abilityName = 'Танец Теней';
            damageMultiplier = 3.5; // High crit
        } else if (role === 'TANK') {
            abilityName = 'Молот Земли';
            damageMultiplier = 1.8;
            shieldAmount = Math.ceil(this.playerStats!.hp * 0.25); // 25% max HP shield
        } else {
            abilityName = 'Вспышка Звезд';
            damageMultiplier = 2.2;
            healAmount = Math.ceil(this.playerStats!.hp * 0.2); // 20% max HP heal
        }

        const logMsg = `✨ [АКТИВ СПОСОБНОСТЬ] ${heroName} использует "${abilityName}"!`;
        this.updateState({ log: logMsg });
        store.addCombatLog(logMsg);

        // Visual flash & shake
        this.onCombatEvent({
            type: 'INSTINCT',
            damage: 0,
            target: 'enemy',
            label: `💥 ${abilityName.toUpperCase()}!`,
        });

        // Trigger lunge animation for the cast
        if (this.player && this.enemy) {
            this.player.playAttackAnimation();
            await this.player.animateLungeForward(true, undefined, this.enemy.x);
        }

        // Deal damage
        const rawDmg = this.playerStats!.attack * damageMultiplier * (0.9 + Math.random() * 0.2);
        // Active ability always hits and can't be dodged/blocked
        const mitigated = Math.max(1, rawDmg - this.enemyStats!.defense * 0.25); // bypasses 75% defense!
        const finalDamage = Math.ceil(mitigated);

        this.totalDamageDealt += finalDamage;
        const damageLog = `💥 ${abilityName} наносит ${finalDamage} урона врагу!`;
        store.addCombatLog(damageLog);

        this.onCombatEvent({
            type: 'CRIT', // Use CRIT type for big text & shake
            damage: finalDamage,
            target: 'enemy',
        });

        if (this.enemy) {
            this.enemy.animateHitReaction(true);
            EffectsManager.getInstance().criticalHit(this.enemy);
            this.enemy.playHitEffect();

            // Применяем статусные эффекты в зависимости от класса
            if (role === 'WARRIOR' && Math.random() < 0.5) {
                this.applyStatus(this.enemy, 'STUN', 1, 0, false);
            } else if (role === 'TANK' && Math.random() < 0.5) {
                this.applyStatus(this.enemy, 'STUN', 1, 0, false);
            } else if (role === 'MAGE') {
                const burnDmg = Math.ceil(this.playerStats!.attack * 0.15);
                this.applyStatus(this.enemy, 'BURN', 3, burnDmg, false);
            } else if (role === 'ASSASSIN') {
                const poisonDmg = Math.ceil(this.playerStats!.attack * 0.1);
                this.applyStatus(this.enemy, 'POISON', 4, poisonDmg, false);
            }
        }

        const nextE_HP = Math.max(0, this.state.enemyHP - finalDamage);
        this.updateState({ enemyHP: nextE_HP });
        store.updateQuestProgress('DAMAGE', finalDamage);

        // Apply heal/shield
        if (healAmount > 0) {
            const nextP_HP = Math.min(this.playerStats!.hp, this.state.playerHP + healAmount);
            this.updateState({ playerHP: nextP_HP });
            const healLog = `💚 ${abilityName} исцеляет вас на +${healAmount} HP!`;
            this.updateState({ log: healLog });
            store.addCombatLog(healLog);
            this.onCombatEvent({
                type: 'BLOCK', // Blue text for positive heal/shield
                damage: healAmount,
                target: 'player',
                label: `+${healAmount} HP`,
            });
        }

        if (shieldAmount > 0) {
            const nextP_HP = Math.min(this.playerStats!.hp + shieldAmount, this.state.playerHP + shieldAmount);
            this.updateState({ playerHP: nextP_HP });
            const shieldLog = `🛡️ ${abilityName} накладывает щит на +${shieldAmount} прочности!`;
            this.updateState({ log: shieldLog });
            store.addCombatLog(shieldLog);
            this.onCombatEvent({
                type: 'BLOCK',
                damage: shieldAmount,
                target: 'player',
                label: `🛡️ ЩИТ +${shieldAmount}`,
            });
        }

        if (nextE_HP <= 0 && this.enemy) {
            this.enemy.animateDeath(false);
        }

        // Пауза и возвращение на исходную позицию
        const { timeScale } = useGameStore.getState();
        await new Promise((r) => setTimeout(r, 900 / timeScale));
        if (this.player && this.state.playerHP > 0) {
            await this.player.animateLungeReturn(this.player.defaultX, this.player.defaultY);
        }
    }

    public updateStatusesState() {
        this.updateState({
            playerStatuses: this.player
                ? this.player.statusEffects.map((s) => ({ type: s.type, stacks: s.stacks, duration: s.duration }))
                : [],
            enemyStatuses: this.enemy
                ? this.enemy.statusEffects.map((s) => ({ type: s.type, stacks: s.stacks, duration: s.duration }))
                : [],
        });
    }

    public applyStatus(
        unit: HeroUnit,
        type: 'STUN' | 'BURN' | 'FREEZE' | 'POISON',
        duration: number,
        damagePerTurn: number,
        isPlayer: boolean,
    ) {
        if (!unit || unit.destroyed) return;

        // Mutual exclusivity: Fire melts Ice, Ice extinguishes Fire
        if (type === 'BURN') {
            const hasFreeze = unit.statusEffects.find((s) => s.type === 'FREEZE');
            if (hasFreeze) {
                unit.statusEffects = unit.statusEffects.filter((s) => s.type !== 'FREEZE');
                unit.removeFreezeEffect();
            }
        } else if (type === 'FREEZE') {
            const hasBurn = unit.statusEffects.find((s) => s.type === 'BURN');
            if (hasBurn) {
                unit.statusEffects = unit.statusEffects.filter((s) => s.type !== 'BURN');
                unit.removeBurnEffect();
            }
        }

        const existing = unit.statusEffects.find((s) => s.type === type);
        if (existing) {
            if (type === 'POISON') {
                existing.stacks = Math.min(5, existing.stacks + 1);
                existing.duration = Math.max(existing.duration, duration);
                existing.damagePerTurn = damagePerTurn;
            } else {
                existing.duration = Math.max(existing.duration, duration);
            }
        } else {
            unit.statusEffects.push({
                type,
                duration,
                stacks: 1,
                damagePerTurn,
            });

            // Trigger visual on creation
            if (type === 'STUN') {
                unit.showStunEffect();
                unit.setFrame(0);
                this.onCombatEvent({
                    type: 'STUN',
                    damage: 0,
                    target: isPlayer ? 'player' : 'enemy',
                    label: '💫 ОГЛУШЕНИЕ!',
                });
            } else if (type === 'BURN') {
                unit.showBurnEffect();
            } else if (type === 'FREEZE') {
                unit.showFreezeEffect();
                this.onCombatEvent({
                    type: 'FREEZE',
                    damage: 0,
                    target: isPlayer ? 'player' : 'enemy',
                    label: '❄️ ЗАМОРОЗКА!',
                });
            } else if (type === 'POISON') {
                unit.showPoisonEffect();
            }
        }

        this.updateStatusesState();
    }

    public async resolvePeriodicDamage(unit: HeroUnit, isPlayer: boolean) {
        if (!this.isCombatRunning || !unit || unit.destroyed) return;

        const { timeScale, addCombatLog } = useGameStore.getState();
        const activeEffects = [...unit.statusEffects];

        for (const status of activeEffects) {
            if (status.type === 'BURN' || status.type === 'POISON') {
                const tickDamage = Math.ceil(status.damagePerTurn * status.stacks);

                if (isPlayer) {
                    const nextHP = Math.max(0, this.state.playerHP - tickDamage);
                    this.updateState({ playerHP: nextHP });
                    this.totalDamageTaken += tickDamage;
                    if (nextHP <= 0) unit.animateDeath(true);
                } else {
                    const nextHP = Math.max(0, this.state.enemyHP - tickDamage);
                    this.updateState({ enemyHP: nextHP });
                    this.totalDamageDealt += tickDamage;
                    if (nextHP <= 0) unit.animateDeath(false);
                }

                // Popup combat event
                this.onCombatEvent({
                    type: status.type,
                    damage: tickDamage,
                    target: isPlayer ? 'player' : 'enemy',
                });

                const logMsg =
                    status.type === 'BURN'
                        ? `🔥 [Горение] ${unit.config.name} получает ${tickDamage} урона от огня!`
                        : `🤢 [Отравление] ${unit.config.name} получает ${tickDamage} урона от яда! (${status.stacks} стак.)`;

                this.updateState({ log: logMsg });
                addCombatLog(logMsg);

                // Play reaction
                unit.playHitEffect();
                unit.animateHitReaction(false);

                // Tiny pause to read the periodic damage pop
                await new Promise((r) => setTimeout(r, 650 / timeScale));
                if (!this.isCombatRunning || (isPlayer ? this.state.playerHP : this.state.enemyHP) <= 0) return;
            }
        }
    }

    public decrementStatusDurations(unit: HeroUnit) {
        if (!unit || unit.destroyed) return;

        const activeEffects = [...unit.statusEffects];
        for (const status of activeEffects) {
            status.duration -= 1;

            if (status.duration <= 0) {
                // Remove status
                unit.statusEffects = unit.statusEffects.filter((s) => s.type !== status.type);
                if (status.type === 'STUN') {
                    unit.removeStunEffect();
                } else if (status.type === 'BURN') {
                    unit.removeBurnEffect();
                } else if (status.type === 'FREEZE') {
                    unit.removeFreezeEffect();
                } else if (status.type === 'POISON') {
                    unit.removePoisonEffect();
                }
            }
        }

        this.updateStatusesState();
    }

    private updateState(patch: Partial<BattleState>) {
        this.state = { ...this.state, ...patch };
        this.onStateChange(this.state);
    }

    public destroy() {
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

        // We must clear the background layer as well, so the battle arena background is removed
        pixiApp.clearAllLayers();

        // [Fix]: Return canvas to main UI container so it's not lost when React unmounts
        pixiApp.returnToHomeContainer();

        this.isCombatRunning = false;
        this.isInitialized = false;
        BattleEngine.instance = null; // Allow fresh re-init next battle
    }
}
