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

    const store = useGameStore.getState();
    const { isGodMode, isOneShot, isEnemyFrozen } = store;

    const pStats = anyEngine.playerStats!;
    const eStats = anyEngine.enemyStats!;

    let pHP = engine.state.playerHP;
    let eHP = engine.state.enemyHP;
    let pShield = engine.state.playerShield || 0;

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

        // Используем ABILITY_REGISTRY вместо хардкода ID/role
        const abilityCfg = getAbilityConfig(attacker.config?.id) ?? getAbilityConfigByRole(attacker.config?.role);
        if (abilityCfg?.attackPassive) {
            const { chance, status, duration, damagePercent } = abilityCfg.attackPassive;
            if (Math.random() < chance) {
                const dmg = damagePercent ? Math.ceil(attStats.attack * damagePercent) : 0;
                engine.applyStatus(victim, status, duration, dmg, !isAttackerPlayer);
            }
        }
    };

    const ATB_THRESHOLD = ATB_THRESHOLD_CONST;
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
                    let dmg = tickDamage;
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
                        const shieldAmount = Math.ceil(pStats.hp * 0.25);
                        const maxShieldLimit = Math.ceil(pStats.hp * 0.5);
                        pShield = Math.min(maxShieldLimit, pShield + shieldAmount);
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

                        const defReduction = targetDefense / (targetDefense + 200);
                        const mitigated = Math.max(0, baseDmg * (1 - defReduction));
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
                    let playerDodgeChance = pStats.dodge;
                    if (playerWeaponArchetype === 'BOW') {
                        playerDodgeChance += 0.15;
                    }
                    const dodgeCheck = Math.random() < playerDodgeChance;
                    if (!dodgeCheck) {
                        let baseDmg = eStats.attack * (0.9 + Math.random() * 0.2);
                        const isCrit = Math.random() < eStats.critChance;
                        if (isCrit) baseDmg *= eStats.critDamage || 1.5;

                        const pDefReduction = pStats.defense / (pStats.defense + 200);
                        let mitigated = Math.max(0, baseDmg * (1 - pDefReduction));
                        if (isGodMode) mitigated = 0;

                        const blockCheck = Math.random() < (pStats.defense > 0 ? 0.15 : 0.05);

                        let finalDmg = Math.ceil(mitigated);
                        if (blockCheck) {
                            finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
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
        playerShield: isWin ? pShield : 0,
        log: isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...',
    });

    engine.onStateChange(engine.state);
}
