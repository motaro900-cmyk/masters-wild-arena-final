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

export interface CombatEvent {
    type: 'HIT' | 'CRIT' | 'DODGE' | 'BLOCK' | 'INSTINCT';
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

    private playerStats: ICombatStats | null = null;
    private enemyStats: ICombatStats | null = null;

    private playerAttackTimer: number = 0;
    private enemyAttackTimer: number = 0;
    private isCombatRunning: boolean = false;
    public isInitialized: boolean = false;
    public battleTime: number = 0;
    public totalDamageDealt: number = 0;

    public onStateChange: (state: BattleState) => void = () => {};
    public onCombatEvent: (event: CombatEvent) => void = () => {};
    private state: BattleState = {
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...',
    };

    private updateCallback: ((dt: number) => void) | null = null;
    private storeUnsubscribe: (() => void) | null = null;

    private constructor() {}

    async init(_container: HTMLElement, heroId: string, enemyId: string, playerStats: any, enemyStats: any) {
        if (this.isInitialized) return;
        this.isInitialized = true;

        try {
            this.totalDamageDealt = 0;
            // [Lead Architect]: Safe fallbacks for missing stats using Number() || to prevent NaN
            this.playerStats = {
                hp: Number(playerStats?.hp) || 100,
                attack: Number(playerStats?.attack) || 10,
                defense: Number(playerStats?.defense) || 5,
                speed: Number(playerStats?.speed) || 50,
                critChance: Number(playerStats?.critChance) || 0.1,
                dodge: Number(playerStats?.dodge) || 0.05,
            };
            this.enemyStats = {
                hp: Number(enemyStats?.hp) || 100,
                attack: Number(enemyStats?.attack) || 8,
                defense: Number(enemyStats?.defense) || 3,
                speed: Number(enemyStats?.speed) || 40,
                critChance: Number(enemyStats?.critChance) || 0.1,
                dodge: Number(enemyStats?.dodge) || 0.05,
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
            this.player.scale.set(0.9);
            this.player.alpha = 1;
            this.player.visible = true;

            this.enemy.position.set(W * 0.75, H * 0.82);
            this.enemy.scale.set(-0.9, 0.9);
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
        let playerTicks = this.playerStats!.speed; // игрок стартует с форой по скорости
        let enemyTicks = this.enemyStats!.speed;

        const firstIsPlayer = this.playerStats!.speed >= this.enemyStats!.speed;
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
                await this.executeAttack(this.player!, this.enemy!, true);
                // После атаки — сбрасываем свои очки и добавляем обоим
                playerTicks = 0;
                playerTicks += this.playerStats!.speed;
                enemyTicks += this.enemyStats!.speed;
            } else {
                const { isEnemyFrozen } = useGameStore.getState();
                if (!isEnemyFrozen) {
                    await this.executeAttack(this.enemy!, this.player!, false);
                }
                enemyTicks = 0;
                playerTicks += this.playerStats!.speed;
                enemyTicks += this.enemyStats!.speed;
            }

            if (!this.isCombatRunning || this.state.playerHP <= 0 || this.state.enemyHP <= 0) break;

            // Драматическая пауза между ходами (читаемость лога)
            await new Promise((r) => setTimeout(r, 1200 / timeScale));
        }

        this.checkCombatEnd();
    }

    private checkCombatEnd() {
        this.isCombatRunning = false;
        const isWin = this.state.playerHP > 0;
        this.updateState({
            log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...',
        });

        // Анимация смерти
        if (isWin) {
            this.enemy?.animateDeath(false); // Враг падает
        } else {
            this.player?.animateDeath(true); // Игрок падает
        }

        const store = useGameStore.getState();
        store.addCombatLog(isWin ? '🏁 БОЙ ЗАВЕРШЕН: ПОБЕДА' : '🏁 БОЙ ЗАВЕРШЕН: ПОРАЖЕНИЕ');

        store.updateQuestProgress('PLAY', 1);
        if (isWin) store.updateQuestProgress('WIN', 1);
    }

    private async executeAttack(attacker: HeroUnit, victim: HeroUnit, isPlayer: boolean) {
        if (!this.isCombatRunning) return;

        const { timeScale, addCombatLog } = useGameStore.getState();
        const pixiApp = PixiApp.getInstance();

        // 1. ФАЗА ПОДГОТОВКИ — короткое напряжение (100мс замаха перед ударом)
        await new Promise((r) => setTimeout(r, 100 / timeScale));

        // 2. РЫВОК ВПЕРЕД (180мс до удара)
        const lungePromise = attacker.animateLunge(isPlayer);

        await new Promise((r) => setTimeout(r, 120 / timeScale));

        if (!this.isCombatRunning) return;

        // 2. МОМЕНТ УДАРА
        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
        attacker.playAttackAnimation();

        // Характеристики
        const stats = isPlayer ? this.playerStats! : this.enemyStats!;
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
        let hasDodged = Math.random() < (targetStats.dodge || 0.05);
        if (instinctEvent?.type === 'FOCUS') hasDodged = false;

        if (hasDodged && !(isPlayer && isOneShot)) {
            const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} уклоняется от атаки! (МИМО)`;
            this.updateState({ log: logMsg });
            addCombatLog(logMsg);
            this.onCombatEvent({ type: 'DODGE', damage: 0, target: isPlayer ? 'enemy' : 'player' });

            // Быстрый уклон-поворот на 150мс
            victim.animateDodge(!isPlayer);

            await lungePromise;
            return;
        }

        // Расчет базового урона
        let damage = stats.attack * (0.9 + Math.random() * 0.2);
        const isCrit = Math.random() < stats.critChance;
        if (isCrit) damage *= 2;
        if (instinctEvent?.type === 'RAGE') damage *= 1.5;
        if (isPlayer && isOneShot) damage = 999999;

        let mitigated = Math.max(0, damage - targetStats.defense * 0.5);
        if (!isPlayer && isGodMode) mitigated = 0;
        if (instinctEvent?.type === 'SHIELD') mitigated *= 0.5;

        const finalDamage = Math.ceil(mitigated);

        // Обработка инстинкта COUNTER
        if (instinctEvent?.type === 'COUNTER') {
            const counterDamage = Math.max(1, Math.ceil(targetStats.attack * 0.5));
            if (isPlayer) {
                const nextP_HP = Math.max(0, this.state.playerHP - counterDamage);
                this.updateState({ playerHP: nextP_HP });
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

        if (hasBlocked && !(isPlayer && isOneShot)) {
            const blockedDamage = Math.max(1, Math.ceil(finalDamage * 0.3));
            if (isPlayer) this.totalDamageDealt += blockedDamage;
            const logMsg = `[Раунд] ${isPlayer ? 'Враг' : 'Вы'} блокирует удар! Урон снижен до ${blockedDamage}.`;
            this.updateState({ log: logMsg });
            addCombatLog(logMsg);
            this.onCombatEvent({ type: 'BLOCK', damage: blockedDamage, target: isPlayer ? 'enemy' : 'player' });

            // Обычная тряска при блокировании
            victim.animateHitReaction(false);
            victim.playHitEffect();

            if (isPlayer) {
                const nextHP = Math.max(0, this.state.enemyHP - blockedDamage);
                this.updateState({ enemyHP: nextHP });
                useGameStore.getState().updateQuestProgress('DAMAGE', blockedDamage);
                if (nextHP <= 0) victim.animateDeath(false);
            } else {
                const nextHP = Math.max(0, this.state.playerHP - blockedDamage);
                this.updateState({ playerHP: nextHP });
                if (nextHP <= 0) victim.animateDeath(true);
            }

            await lungePromise;
            return;
        }

        // 2c. Обычный урон или Крит
        let logMsg: string;
        if (isPlayer) this.totalDamageDealt += finalDamage;

        if (isCrit) {
            logMsg = `[Раунд] ${isPlayer ? 'Вы наносите' : 'Враг наносит'} КРИТИЧЕСКИЙ УДАР на ${finalDamage}!`;
            this.onCombatEvent({ type: 'CRIT', damage: finalDamage, target: isPlayer ? 'enemy' : 'player' });

            // Slow-mo при крите — временно замедляем ticker (0.15x на 300мс реального времени)
            try {
                const app = pixiApp.getApp();
                app.ticker.speed = 0.15;
                setTimeout(() => {
                    app.ticker.speed = 1.0;
                }, 300);
            } catch {
                /* ignore if pixi not ready */
            }

            // Сильная критическая тряска
            victim.animateHitReaction(true);
        } else {
            logMsg = `[Раунд] ${isPlayer ? 'Вы бьёте' : 'Враг бьёт'} на ${finalDamage}!`;
            this.onCombatEvent({ type: 'HIT', damage: finalDamage, target: isPlayer ? 'enemy' : 'player' });

            // Обычная тряска
            victim.animateHitReaction(false);
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

        // Ждем возвращения нападающего на исходную позицию
        await lungePromise;
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

        while (pHP > 0 && eHP > 0 && safetyCounter < maxTicks) {
            safetyCounter++;

            const dt = Math.min(pTimer, eTimer);
            pTimer -= dt;
            eTimer -= dt;

            // Ход игрока
            if (pTimer <= 0) {
                const dodgeCheck = Math.random() < eStats.dodge;
                if (!dodgeCheck || isOneShot) {
                    let baseDmg = pStats.attack * (0.9 + Math.random() * 0.2);
                    const isCrit = Math.random() < pStats.critChance;
                    if (isCrit) baseDmg *= 2;
                    if (isOneShot) baseDmg = 999999;

                    const mitigated = Math.max(0, baseDmg - eStats.defense * 0.5);
                    const blockCheck = Math.random() < (eStats.defense > 0 ? 0.15 : 0.05);

                    let finalDmg = Math.ceil(mitigated);
                    if (blockCheck && !isOneShot) {
                        finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                    }

                    eHP = Math.max(0, eHP - finalDmg);
                    store.updateQuestProgress('DAMAGE', finalDmg);
                }
                pTimer = pMax;
            }

            // Ход врага
            if (eHP > 0 && !isEnemyFrozen && eTimer <= 0) {
                const dodgeCheck = Math.random() < pStats.dodge;
                if (!dodgeCheck) {
                    let baseDmg = eStats.attack * (0.9 + Math.random() * 0.2);
                    const isCrit = Math.random() < eStats.critChance;
                    if (isCrit) baseDmg *= 2;

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

    private updateState(patch: Partial<BattleState>) {
        this.state = { ...this.state, ...patch };
        this.onStateChange(this.state);
    }

    public destroy() {
        if (this.storeUnsubscribe) this.storeUnsubscribe();
        const pixiApp = PixiApp.getInstance();
        if (this.updateCallback) pixiApp.removeUpdateLoop(this.updateCallback);
        // We must clear the background layer as well, so the battle arena background is removed
        pixiApp.clearAllLayers();

        // [Fix]: Return canvas to main UI container so it's not lost when React unmounts
        pixiApp.returnToHomeContainer();

        this.isCombatRunning = false;
        this.isInitialized = false;
        BattleEngine.instance = null; // Allow fresh re-init next battle
    }
}
