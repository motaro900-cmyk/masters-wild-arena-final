import { HeroUnit } from '../../entities/HeroUnit';
import type { BattleEngine, ICombatStats } from '../BattleEngine';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { ATB_THRESHOLD as ATB_THRESHOLD_CONST } from '../../../game/configs/GameConstants';
import { getAbilityConfig, getAbilityConfigByRole } from '../../../configs/AbilityConfig';

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

    // Ensure stats are defensively initialized to prevent NaN or undefined bugs
    engine.totalDamageDealt = engine.totalDamageDealt || 0;
    engine.totalDamageTaken = engine.totalDamageTaken || 0;
    engine.maxSingleHitDamage = engine.maxSingleHitDamage || 0;
    engine.totalTurnsPlayed = engine.totalTurnsPlayed || 0;

    const store = useGameStore.getState();
    const { isGodMode, isOneShot, isEnemyFrozen } = store;

    const pStats = anyEngine.playerStats!;
    const eStats = anyEngine.enemyStats!;
    const pDivisor = 200 + ((pStats.avgItemLevel || 1) - 1) * 25;
    const eDivisor = 200 + ((eStats.avgItemLevel || 1) - 1) * 25;

    let pHP = engine.state.playerHP;
    let eHP = engine.state.enemyHP;
    let pShield = engine.state.playerShield || 0;

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

        // Используем ABILITY_REGISTRY вместо хардкода ID/role
        const abilityCfg = getAbilityConfig(attacker.config?.id) ?? getAbilityConfigByRole(attacker.config?.role);
        if (abilityCfg?.attackPassive) {
            const { chance, status, duration, damagePercent } = abilityCfg.attackPassive;
            if (Math.random() < chance) {
                const avgItemLevel = attStats.avgItemLevel || 1;
                const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;
                let baseDmg = damagePercent ? attStats.attack * damagePercent : 0;
                if (attacker.config?.id === 'raccoon' && status === 'POISON') {
                    baseDmg = Math.max(15, baseDmg);
                }
                const dmg = Math.ceil(baseDmg * itemLevelFactor);
                engine.applyStatus(victim, status, duration, dmg, !isAttackerPlayer);
            }
        }
    };

    const ATB_THRESHOLD = ATB_THRESHOLD_CONST;
    let playerTicks = 0;
    let enemyTicks = 0;
    let totalBattleTicks = 0;
    let isRageActive = false;

    while (pHP > 0 && eHP > 0 && totalBattleTicks < maxTicks) {
        while (playerTicks < ATB_THRESHOLD && enemyTicks < ATB_THRESHOLD) {
            playerTicks += getEffectiveSpeed(anyEngine.player!, pStats);
            enemyTicks += getEffectiveSpeed(anyEngine.enemy!, eStats);
            totalBattleTicks++;

            if (totalBattleTicks === 8000 && !isRageActive) {
                isRageActive = true;
                pStats.attack = Math.round(pStats.attack * 1.5);
                pStats.defense = Math.round(pStats.defense * 0.7);
                eStats.attack = Math.round(eStats.attack * 1.5);
                eStats.defense = Math.round(eStats.defense * 0.7);

                engine.onCombatEvent({
                    type: 'INSTINCT',
                    damage: 0,
                    target: 'player',
                    label: '🔥 ЯРОСТЬ!',
                });
            }

            if (totalBattleTicks >= 10000) {
                break;
            }
        }

        if (totalBattleTicks >= 10000) {
            break;
        }

        const isPlayerTurn = playerTicks >= enemyTicks;

        if (isPlayerTurn) {
            engine.triggerPassiveOnTurnStart(anyEngine.player!, true);

            // Применяем периодический урон в начале хода
            const playerEffects = [...anyEngine.player!.statusEffects];
            for (const status of playerEffects) {
                if (status.type === 'SHADOW_MARK' && status.delay > 0) {
                    status.delay--;
                }
                if (status.type === 'BURN' || status.type === 'POISON') {
                    const tickDamage = Math.ceil(status.damagePerTurn * status.stacks);
                    const defMultiplier = status.type === 'POISON' ? 0.5 : 0.25;
                    const effectiveDef = pStats.defense * defMultiplier;
                    const mitigation = effectiveDef / (effectiveDef + pDivisor);
                    const finalDamage = Math.max(1, Math.ceil(tickDamage * (1 - mitigation)));

                    const modifiedTick = engine.triggerPassiveOnTakeDamage('player', finalDamage);
                    let dmg = modifiedTick;
                    if (pShield > 0) {
                        if (pShield >= dmg) {
                            pShield -= dmg;
                            dmg = 0;
                        } else {
                            dmg -= pShield;
                            pShield = 0;
                        }
                    }
                    pHP = Math.max(0, pHP - dmg);
                    engine.totalDamageTaken += modifiedTick;
                    engine.onCombatEvent({
                        type: status.type,
                        damage: modifiedTick,
                        target: 'player',
                    });
                }
                if (status.type === 'NATURE_REGEN') {
                    const avgItemLevel = pStats.avgItemLevel || 1;
                    const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;
                    const regenPercent = (playerHeroId === 'lion_knight' ? 0.04 : 0.05) * itemLevelFactor;
                    const baseHeal = Math.ceil(pStats.hp * regenPercent);
                    const effectiveDef = pStats.defense * 0.5;
                    const mitigation = effectiveDef / (effectiveDef + pDivisor);
                    const healAmount = Math.max(1, Math.ceil(baseHeal * (1 - mitigation)));
                    pHP = Math.min(pStats.hp, pHP + healAmount);
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

                    const abilityCfg = getAbilityConfig(playerHeroId) ?? getAbilityConfigByRole(role);
                    const { damageMultiplier, healPercent, shieldPercent, onCastStatus } = abilityCfg.activeAbility;

                    const rawDmg = pStats.attack * damageMultiplier * (0.9 + Math.random() * 0.2);
                    const finalActiveDmg = Math.ceil(Math.max(1, rawDmg - eStats.defense * 0.25));

                    let finalDmg = engine.triggerPassiveOnDealDamage(
                        anyEngine.player!,
                        anyEngine.enemy!,
                        finalActiveDmg,
                        true,
                        true,
                    );
                    finalDmg = engine.triggerPassiveOnTakeDamage('enemy', finalDmg, true);

                    eHP = Math.max(0, eHP - finalDmg);
                    engine.totalDamageDealt += finalDmg;
                    if (finalDmg > engine.maxSingleHitDamage) {
                        engine.maxSingleHitDamage = finalDmg;
                    }
                    engine.totalTurnsPlayed += 1;

                    // Вампиризм (lifesteal)
                    if (pStats.lifesteal && pStats.lifesteal > 0) {
                        const heal = Math.ceil(finalDmg * (pStats.lifesteal / 100));
                        pHP = Math.min(pStats.hp, pHP + heal);
                    }

                    const avgItemLevel = pStats.avgItemLevel || 1;
                    const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;

                    if (healPercent) {
                        pHP = Math.min(pStats.hp, pHP + Math.ceil(pStats.hp * healPercent));
                    }
                    if (shieldPercent) {
                        const shieldAmount = Math.ceil(pStats.hp * shieldPercent * itemLevelFactor);
                        const maxShieldLimit = Math.ceil(pStats.hp * 0.5);
                        pShield = Math.min(maxShieldLimit, pShield + shieldAmount);
                    }
                    if (onCastStatus) {
                        let baseDmg = onCastStatus.damagePerTurn
                            ? onCastStatus.damagePerTurn > 1
                                ? onCastStatus.damagePerTurn
                                : pStats.attack * onCastStatus.damagePerTurn
                            : 0;
                        if (playerHeroId === 'raccoon' && onCastStatus.type === 'POISON') {
                            baseDmg = Math.max(15, baseDmg);
                        }
                        const dmgPerTurn = Math.ceil(baseDmg * itemLevelFactor);
                        const targetUnit = onCastStatus.target === 'enemy' ? anyEngine.enemy! : anyEngine.player!;
                        const isTargetPlayer = onCastStatus.target === 'player';
                        engine.applyStatus(
                            targetUnit,
                            onCastStatus.type,
                            onCastStatus.duration,
                            dmgPerTurn,
                            isTargetPlayer,
                        );
                    }
                } else {
                    const finalEvasion = Math.max(0, eStats.dodge - ((pStats.accuracy || 100) - 100) / 100);
                    const dodgeCheck = Math.random() < finalEvasion;
                    if (!dodgeCheck || isOneShot) {
                        let baseDmg = pStats.attack * (0.9 + Math.random() * 0.2);
                        const isCrit = Math.random() < pStats.critChance;
                        if (isCrit) baseDmg *= pStats.critDamage || 1.5;
                        if (isOneShot) baseDmg = 999999;

                        let targetDefense = eStats.defense * Math.max(0, 1 - (pStats.penetration || 0) / 100);
                        if (playerWeaponArchetype === 'STAFF') {
                            targetDefense *= 0.5;
                        }

                        const defReduction = targetDefense / (targetDefense + eDivisor);
                        const mitigated = Math.max(0, baseDmg * (1 - defReduction));
                        const blockCheck = Math.random() < (eStats.defense > 0 ? 0.15 : 0.05);

                        let finalDmg = Math.ceil(mitigated);
                        if (blockCheck && !isOneShot) {
                            finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                        }

                        finalDmg = engine.triggerPassiveOnDealDamage(
                            anyEngine.player!,
                            anyEngine.enemy!,
                            finalDmg,
                            isCrit,
                            true,
                        );
                        finalDmg = engine.triggerPassiveOnTakeDamage('enemy', finalDmg, isCrit);

                        // Вампиризм (lifesteal)
                        if (pStats.lifesteal && pStats.lifesteal > 0) {
                            const heal = Math.ceil(finalDmg * (pStats.lifesteal / 100));
                            pHP = Math.min(pStats.hp, pHP + heal);
                        }

                        eHP = Math.max(0, eHP - finalDmg);
                        engine.totalDamageDealt += finalDmg;
                        if (finalDmg > engine.maxSingleHitDamage) {
                            engine.maxSingleHitDamage = finalDmg;
                        }
                        engine.totalTurnsPlayed += 1;

                        simulateStatusEffects(anyEngine.player!, anyEngine.enemy!, pStats, true, isCrit && !blockCheck);
                    }
                }
            }
            // Уменьшаем длительность статусов в конце хода
            engine.decrementStatusDurations(anyEngine.player!);

            playerTicks -= ATB_THRESHOLD;
        } else {
            // Ход врага
            if (!isEnemyFrozen) {
                engine.triggerPassiveOnTurnStart(anyEngine.enemy!, false);

                const enemyEffects = [...anyEngine.enemy!.statusEffects];
                for (const status of enemyEffects) {
                    if (status.type === 'SHADOW_MARK' && status.delay > 0) {
                        status.delay--;
                    }
                    if (status.type === 'BURN' || status.type === 'POISON') {
                        const tickDamage = Math.ceil(status.damagePerTurn * status.stacks);
                        const defMultiplier = status.type === 'POISON' ? 0.5 : 0.25;
                        const effectiveDef = eStats.defense * defMultiplier;
                        const mitigation = effectiveDef / (effectiveDef + eDivisor);
                        const finalDamage = Math.max(1, Math.ceil(tickDamage * (1 - mitigation)));

                        const modifiedTick = engine.triggerPassiveOnTakeDamage('enemy', finalDamage);
                        eHP = Math.max(0, eHP - modifiedTick);
                        engine.totalDamageDealt += modifiedTick;
                        engine.onCombatEvent({
                            type: status.type,
                            damage: modifiedTick,
                            target: 'enemy',
                        });
                    }
                    if (status.type === 'NATURE_REGEN') {
                        const enemyHeroId = anyEngine.enemy?.config?.id || '';
                        const avgItemLevel = eStats.avgItemLevel || 1;
                        const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;
                        const regenPercent = (enemyHeroId === 'lion_knight' ? 0.04 : 0.05) * itemLevelFactor;
                        const baseHeal = Math.ceil(eStats.hp * regenPercent);
                        const effectiveDef = eStats.defense * 0.5;
                        const mitigation = effectiveDef / (effectiveDef + eDivisor);
                        const healAmount = Math.max(1, Math.ceil(baseHeal * (1 - mitigation)));
                        eHP = Math.min(eStats.hp, eHP + healAmount);
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
                    let playerDodgeChance = pStats.dodge;
                    if (playerWeaponArchetype === 'BOW') {
                        playerDodgeChance += 0.15;
                    }
                    const finalEvasion = Math.max(0, playerDodgeChance - ((eStats.accuracy || 100) - 100) / 100);
                    const dodgeCheck = Math.random() < finalEvasion;
                    if (!dodgeCheck) {
                        let baseDmg = eStats.attack * (0.9 + Math.random() * 0.2);
                        const isCrit = Math.random() < eStats.critChance;
                        if (isCrit) baseDmg *= eStats.critDamage || 1.5;

                        let targetDefense = pStats.defense * Math.max(0, 1 - (eStats.penetration || 0) / 100);
                        const pDefReduction = targetDefense / (targetDefense + pDivisor);
                        let mitigated = Math.max(0, baseDmg * (1 - pDefReduction));
                        if (isGodMode) mitigated = 0;

                        const blockCheck = Math.random() < (pStats.defense > 0 ? 0.15 : 0.05);

                        let finalDmg = Math.ceil(mitigated);
                        if (blockCheck) {
                            finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                        }

                        finalDmg = engine.triggerPassiveOnDealDamage(
                            anyEngine.enemy!,
                            anyEngine.player!,
                            finalDmg,
                            isCrit,
                            false,
                        );
                        finalDmg = engine.triggerPassiveOnTakeDamage('player', finalDmg, isCrit);

                        // Вампиризм (lifesteal)
                        if (eStats.lifesteal && eStats.lifesteal > 0) {
                            const heal = Math.ceil(finalDmg * (eStats.lifesteal / 100));
                            eHP = Math.min(eStats.hp, eHP + heal);
                        }

                        let dmg = finalDmg;
                        if (pShield > 0) {
                            if (pShield >= dmg) {
                                pShield -= dmg;
                                dmg = 0;
                            } else {
                                dmg -= pShield;
                                pShield = 0;
                            }
                        }
                        pHP = Math.max(0, pHP - dmg);
                        engine.totalDamageTaken += finalDmg;
                        engine.totalTurnsPlayed += 1;

                        simulateStatusEffects(
                            anyEngine.enemy!,
                            anyEngine.player!,
                            eStats,
                            false,
                            isCrit && !blockCheck,
                        );
                    }
                }
                engine.decrementStatusDurations(anyEngine.enemy!);
            }
            enemyTicks -= ATB_THRESHOLD;
        }
    }

    if (totalBattleTicks >= 10000 && pHP > 0 && eHP > 0) {
        if (pHP >= eHP) {
            eHP = 0;
        } else {
            pHP = 0;
        }
    }

    const isWin = pHP > 0;
    if (isWin) {
        if (engine.totalDamageDealt === 0) {
            engine.totalDamageDealt = Math.ceil(eStats.hp * 1.15);
        }
        if (engine.maxSingleHitDamage === 0) {
            engine.maxSingleHitDamage = Math.ceil(pStats.attack * 1.1);
        }
    } else {
        if (engine.totalDamageDealt === 0) {
            engine.totalDamageDealt = Math.round(eStats.hp * 0.4);
        }
        if (engine.maxSingleHitDamage === 0) {
            engine.maxSingleHitDamage = Math.round(pStats.attack * 0.7);
        }
    }

    if (engine.totalTurnsPlayed === 0) {
        engine.totalTurnsPlayed = isWin ? 5 : 4;
    }

    engine.updateState({
        playerHP: pHP,
        enemyHP: eHP,
        playerShield: isWin ? pShield : 0,
        log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...',
    });

    engine.onStateChange(engine.state);
}
