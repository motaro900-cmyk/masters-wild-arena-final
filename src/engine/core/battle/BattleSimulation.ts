import { HeroUnit } from '../../entities/HeroUnit';
import type { BattleEngine, ICombatStats } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { ITEMS_DATABASE } from '../../../game/configs/ItemsConfig';

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

export function skipToEndOfBattle(engine: BattleEngine) {
    if (!engine.isInitialized || engine.state.playerHP <= 0 || engine.state.enemyHP <= 0) return;

    const anyEngine = engine as any;
    anyEngine.isCombatRunning = false;

    const store = useGameStore.getState();
    const { isGodMode, isOneShot, isEnemyFrozen } = store;

    const pStats = anyEngine.playerStats!;
    const eStats = anyEngine.enemyStats!;

    let pHP = engine.state.playerHP;
    let eHP = engine.state.enemyHP;

    let safetyCounter = 0;
    const maxTicks = 10000;

    const playerHeroId = anyEngine.player?.config?.id || '';
    const playerEquipment = store.heroEquipment[playerHeroId] || {};
    const playerWeaponArchetype = getWeaponArchetype(playerEquipment.WEAPONS || null);

    const getEffectiveSpeed = (unit: HeroUnit, stats: ICombatStats) => {
        return unit.isFrozenStatus ? Math.ceil(stats.speed * 0.5) : stats.speed;
    };

    const simulateStatusEffects = (
        attacker: HeroUnit,
        victim: HeroUnit,
        attStats: ICombatStats,
        isAttackerPlayer: boolean,
        isCrit: boolean,
    ) => {
        if (isCrit && Math.random() < 0.35) {
            engine.applyStatus(victim, 'STUN', 1, 0, !isAttackerPlayer);
        }

        const attackerId = attacker.config?.id;
        const attackerRole = attacker.config?.role;

        if (attackerId === 'panda' || attackerRole === 'WARRIOR' || attackerId === 'ancient_golem') {
            if (Math.random() < 0.3) {
                const burnDmg = Math.ceil(attStats.attack * 0.12);
                engine.applyStatus(victim, 'BURN', 3, burnDmg, !isAttackerPlayer);
            }
        } else if (attackerId === 'raccoon' || attackerRole === 'ASSASSIN' || attackerId === 'ancient_spider') {
            if (Math.random() < 0.35) {
                const poisonDmg = Math.ceil(attStats.attack * 0.09);
                engine.applyStatus(victim, 'POISON', 4, poisonDmg, !isAttackerPlayer);
            }
        } else if (attackerId === 'ancient_wolf') {
            if (Math.random() < 0.25) {
                engine.applyStatus(victim, 'FREEZE', 2, 0, !isAttackerPlayer);
            }
        }
    };

    const ATB_THRESHOLD = 100;
    let playerTicks = getEffectiveSpeed(anyEngine.player!, pStats);
    let enemyTicks = getEffectiveSpeed(anyEngine.enemy!, eStats);

    const firstIsPlayer = playerTicks >= enemyTicks;
    if (firstIsPlayer) {
        playerTicks = ATB_THRESHOLD;
    } else {
        enemyTicks = ATB_THRESHOLD;
    }

    while (pHP > 0 && eHP > 0 && safetyCounter < maxTicks) {
        safetyCounter++;

        const isPlayerTurn = playerTicks >= enemyTicks;

        if (isPlayerTurn) {
            // Применяем периодический урон в начале хода
            const playerEffects = [...anyEngine.player!.statusEffects];
            for (const status of playerEffects) {
                if (status.type === 'BURN' || status.type === 'POISON') {
                    const tickDamage = Math.ceil(status.damagePerTurn * status.stacks);
                    pHP = Math.max(0, pHP - tickDamage);
                    engine.totalDamageTaken += tickDamage;
                    engine.onCombatEvent({
                        type: status.type,
                        damage: tickDamage,
                        target: 'player',
                    });
                }
            }
            if (pHP <= 0) break;

            if (anyEngine.player!.isStunnedStatus) {
                engine.onCombatEvent({
                    type: 'STUN',
                    damage: 0,
                    target: 'player',
                    label: '💫 ОГЛУШЕНИЕ!',
                });
            } else {
                // Накопление маны
                let currentMana = engine.state.playerMana;
                currentMana = Math.min(100, currentMana + 25);
                engine.state.playerMana = currentMana;

                if (currentMana >= 100) {
                    // Использование суперспособности в симуляции
                    engine.state.playerMana = 0;
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
                    engine.totalDamageDealt += finalActiveDmg;
                    engine.totalTurnsPlayed += 1;
                    store.updateQuestProgress('DAMAGE', finalActiveDmg);

                    if (role === 'SUPPORT') {
                        pHP = Math.min(pStats.hp, pHP + Math.ceil(pStats.hp * 0.2));
                    } else if (role === 'TANK') {
                        pHP = Math.min(pStats.hp, pHP + Math.ceil(pStats.hp * 0.25));
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
                            targetDefense *= 0.5;
                        }

                        const mitigated = Math.max(0, baseDmg - targetDefense * 0.5);
                        const blockCheck = Math.random() < (eStats.defense > 0 ? 0.15 : 0.05);

                        let finalDmg = Math.ceil(mitigated);
                        if (blockCheck && !isOneShot) {
                            finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                        }

                        eHP = Math.max(0, eHP - finalDmg);
                        engine.totalDamageDealt += finalDmg;
                        engine.totalTurnsPlayed += 1;
                        store.updateQuestProgress('DAMAGE', finalDmg);

                        simulateStatusEffects(anyEngine.player!, anyEngine.enemy!, pStats, true, isCrit && !blockCheck);
                    }
                }
            }
            // Уменьшаем длительность статусов в конце хода
            engine.decrementStatusDurations(anyEngine.player!);

            playerTicks = 0;
            playerTicks += getEffectiveSpeed(anyEngine.player!, pStats);
            enemyTicks += getEffectiveSpeed(anyEngine.enemy!, eStats);
        } else {
            // Ход врага
            if (!isEnemyFrozen) {
                const enemyEffects = [...anyEngine.enemy!.statusEffects];
                for (const status of enemyEffects) {
                    if (status.type === 'BURN' || status.type === 'POISON') {
                        const tickDamage = Math.ceil(status.damagePerTurn * status.stacks);
                        eHP = Math.max(0, eHP - tickDamage);
                        engine.totalDamageDealt += tickDamage;
                        engine.onCombatEvent({
                            type: status.type,
                            damage: tickDamage,
                            target: 'enemy',
                        });
                    }
                }
                if (eHP <= 0) break;

                if (anyEngine.enemy!.isStunnedStatus) {
                    engine.onCombatEvent({
                        type: 'STUN',
                        damage: 0,
                        target: 'enemy',
                        label: '💫 ОГЛУШЕНИЕ!',
                    });
                } else {
                    let currentMana = engine.state.playerMana;
                    currentMana = Math.min(100, currentMana + 15);
                    engine.state.playerMana = currentMana;

                    let playerDodgeChance = pStats.dodge;
                    if (playerWeaponArchetype === 'BOW') {
                        playerDodgeChance += 0.15;
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
                        engine.totalDamageTaken += finalDmg;
                        engine.totalTurnsPlayed += 1;

                        simulateStatusEffects(anyEngine.enemy!, anyEngine.player!, eStats, false, isCrit && !blockCheck);
                    }
                }
                engine.decrementStatusDurations(anyEngine.enemy!);
            }
            enemyTicks = 0;
            playerTicks += getEffectiveSpeed(anyEngine.player!, pStats);
            enemyTicks += getEffectiveSpeed(anyEngine.enemy!, eStats);
        }
    }

    const isWin = pHP > 0;
    engine.updateState({
        playerHP: pHP,
        enemyHP: eHP,
        log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...',
    });

    engine.onStateChange(engine.state);
}
