// Progression Simulator for Masters of the Wild
// Located at scratch/progression_simulator.js
import fs from 'fs';

const HEROES_BASE_STATS = {
    panda: { strength: 19, agility: 12, stamina: 23, intelligence: 12 },
    lion_knight: { strength: 19, agility: 16, stamina: 21, intelligence: 10 },
    tiger_warrior: { strength: 16, agility: 24, stamina: 16, intelligence: 10 },
    minotaur: { strength: 22, agility: 8, stamina: 26, intelligence: 10 }
};

const ABILITIES = {
    panda: {
        activeAbility: {
            damageMultiplier: 2.5,
            onCastStatus: { target: 'enemy', type: 'STUN', duration: 1 },
        },
        attackPassive: { chance: 0.3, status: 'BURN', duration: 3, damagePercent: 0.12 },
    },
    lion_knight: {
        activeAbility: {
            damageMultiplier: 2.4,
            onCastStatus: { target: 'player', type: 'NATURE_REGEN', duration: 3 },
        },
        attackPassive: { chance: 0.3, status: 'BURN', duration: 2, damagePercent: 0.1 },
    },
    tiger_warrior: {
        activeAbility: {
            damageMultiplier: 3.2,
            onCastStatus: { target: 'enemy', type: 'SHADOW_MARK', duration: 1 },
        },
        attackPassive: { chance: 0.35, status: 'SHADOW_MARK', duration: 1 },
    },
    minotaur: {
        activeAbility: {
            damageMultiplier: 1.8,
            shieldPercent: 0.25,
            onCastStatus: { target: 'player', type: 'STUN_IMMUNITY', duration: 2 },
        },
        attackPassive: { chance: 0.25, status: 'STUN', duration: 1 },
    }
};

// Typical equipment stats per rarity tier (fully equipped set of 7 items)
const TYPICAL_EQUIPMENT = {
    COMMON: { attack: 15, hp: 100, defense: 25, crit: 0, evasion: 0 },
    RARE: { attack: 60, hp: 750, defense: 100, crit: 3, evasion: 2 },
    EPIC: { attack: 200, hp: 3000, defense: 350, crit: 8, evasion: 5 },
    LEGENDARY: { attack: 450, hp: 8000, defense: 900, crit: 12, evasion: 8 },
    MYTHIC: { attack: 950, hp: 20000, defense: 2200, crit: 20, evasion: 15 }
};

// XP rewards per battle
function getXPReward(level, won) {
    if (won) {
        if (level <= 10) return 100 + level * 20;
        if (level <= 30) return 300 + (level - 10) * 10;
        return Math.min(500 + (level - 30) * 5, 600);
    } else {
        if (level <= 10) return 20 + level * 4;
        if (level <= 30) return 60 + (level - 10) * 2;
        return Math.min(100 + (level - 30) * 1, 120);
    }
}

// XP needed to level up
function getHeroExpNeeded(level) {
    if (level <= 1) return 100;
    if (level === 2) return 200;
    return (level - 1) * 200;
}

// Get equipment rarity based on rating
function getRarityForRating(rating) {
    if (rating < 100) return 'COMMON';
    if (rating < 250) return 'RARE';
    if (rating < 450) return 'EPIC';
    if (rating < 600) return 'LEGENDARY';
    return 'MYTHIC';
}

// Current cup calculation formula
const calcCupsChangeCurrent = (attackerRating, defenderRating, attackerWon) => {
    const diff = defenderRating - attackerRating;
    if (attackerWon) {
        if (diff >= 100) return 30;
        if (diff >= 0) return 20;
        return 10;
    } else {
        if (diff <= -100) return -20;
        if (diff <= 0) return -15;
        return -10;
    }
};

// Proposed cup calculation formula
function calcCupsChangeProposed(playerRating, opponentRating, attackerWon, playerLevel) {
    let baseReward = 0;
    let basePenalty = 0;

    if (playerRating < 1000) {
        baseReward = 100;
        basePenalty = 0;
    } else if (playerRating < 3000) {
        baseReward = 60;
        basePenalty = -5;
    } else if (playerRating < 6000) {
        baseReward = 40;
        basePenalty = -15;
    } else if (playerRating < 9000) {
        baseReward = 25;
        basePenalty = -20;
    } else {
        baseReward = 15;
        basePenalty = -25;
    }

    const diff = opponentRating - playerRating;
    let diffModifier = 0;
    if (attackerWon) {
        if (diff >= 100) diffModifier = 5;
        else if (diff <= -100) diffModifier = -5;
    } else {
        if (diff >= 100) diffModifier = 5;
        else if (diff <= -100) diffModifier = -5;
    }

    if (attackerWon) {
        let finalReward = baseReward + diffModifier;
        // Catch-up multiplier for playerLevel > expectedLevel
        let expectedLevel = 1;
        if (playerRating < 1000) expectedLevel = 1;
        else if (playerRating < 2000) expectedLevel = 10;
        else if (playerRating < 3000) expectedLevel = 20;
        else if (playerRating < 4500) expectedLevel = 30;
        else if (playerRating < 6000) expectedLevel = 40;
        else if (playerRating < 7500) expectedLevel = 50;
        else if (playerRating < 9000) expectedLevel = 60;
        else expectedLevel = 70;

        if (playerLevel > expectedLevel) {
            const levelDiff = playerLevel - expectedLevel;
            const catchUpMult = Math.min(5, 1 + Math.floor(levelDiff / 10));
            finalReward = Math.round(finalReward * catchUpMult);
        }
        return Math.max(1, finalReward);
    } else {
        let finalPenalty = basePenalty + diffModifier;
        return Math.min(0, finalPenalty);
    }
}

// Combatant creation
const createCombatant = (heroId, level, rating, rarity, isBot, winStreak, lossStreak) => {
    const baseStats = HEROES_BASE_STATS[heroId];
    if (!baseStats) throw new Error(`Unknown hero: ${heroId}`);

    const levelMult = 1 + (level - 1) * 0.05;

    let stats = {
        hp: Math.round(baseStats.stamina * 10 * levelMult),
        attack: Math.round(baseStats.strength * 2 * levelMult),
        defense: Math.round(baseStats.stamina * 0.5 * levelMult),
        speed: 1 + baseStats.agility * 0.05,
        critChance: baseStats.agility * 0.5,
        evasion: baseStats.agility * 0.2,
        critDamage: 1.5
    };

    const eqMult = 1.0 + (level - 1) * 0.18;
    const eq = TYPICAL_EQUIPMENT[rarity] || TYPICAL_EQUIPMENT.COMMON;
    stats.hp += Math.round(eq.hp * eqMult);
    stats.attack += Math.round(eq.attack * eqMult);
    stats.defense += Math.round(eq.defense * eqMult);
    stats.critChance += eq.crit;
    stats.evasion += eq.evasion;

    if (isBot) {
        let baseMult = 0.82 + Math.min(0.4, (rating / 500) * 0.28);
        let winStreakMod = 0;
        if (winStreak >= 3) winStreakMod = 0.15;
        if (winStreak >= 6) winStreakMod = 0.3;
        if (winStreak >= 9) winStreakMod = 0.45;

        let lossStreakMod = 0;
        if (lossStreak >= 2) lossStreakMod = -0.15;
        if (lossStreak >= 4) lossStreakMod = -0.25;
        if (lossStreak >= 6) lossStreakMod = -0.35;

        const variance = Math.random() * 0.08 - 0.04;
        let statsMultiplier = baseMult + winStreakMod + lossStreakMod + variance;
        statsMultiplier = Math.max(0.65, Math.min(1.75, statsMultiplier));

        if (rating < 30) {
            statsMultiplier = 0.7;
        }

        stats.hp = Math.round(stats.hp * statsMultiplier);
        stats.attack = Math.round(stats.attack * statsMultiplier);
        stats.defense = Math.round(stats.defense * statsMultiplier);
        stats.critChance = Math.round(stats.critChance * statsMultiplier);
        stats.evasion = Math.round(stats.evasion * statsMultiplier);
    }

    stats.critChance = Math.min(75, stats.critChance);
    stats.evasion = Math.min(60, stats.evasion);

    return {
        heroId,
        level,
        rating,
        maxHP: stats.hp,
        hp: stats.hp,
        shield: 0,
        mana: 0,
        stats,
        statusEffects: []
    };
};

const applyStatusEffect = (unit, type, duration, damagePerTurn) => {
    if (type === 'STUN') {
        const isImmune = unit.statusEffects.some(s => s.type === 'STUN_IMMUNITY');
        if (isImmune) return;
    }

    const existing = unit.statusEffects.find(s => s.type === type);
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
        if (damagePerTurn) {
            existing.damagePerTurn = Math.max(existing.damagePerTurn, damagePerTurn);
        }
        existing.stacks = (existing.stacks || 1) + 1;
    } else {
        unit.statusEffects.push({
            type,
            duration,
            damagePerTurn: damagePerTurn || 0,
            stacks: 1
        });
    }
};

const simulateStatusEffects = (attacker, victim, isCrit) => {
    if (isCrit && Math.random() < 0.35) {
        applyStatusEffect(victim, 'STUN', 1, 0);
    }

    const ability = ABILITIES[attacker.heroId];
    if (ability && ability.attackPassive) {
        const { chance, status, duration, damagePercent } = ability.attackPassive;
        if (Math.random() < chance) {
            const dmg = damagePercent ? Math.ceil(attacker.stats.attack * damagePercent) : 0;
            applyStatusEffect(victim, status, duration, dmg);
        }
    }
};

// Combat loop simulation
function simulateCombat(player, enemy) {
    let pHP = player.hp;
    let eHP = enemy.hp;
    let pShield = 0;
    let eShield = 0;
    let pMana = 0;
    let eMana = 0;

    const getEffectiveSpeed = (unit) => {
        const isSlowed = unit.statusEffects.some(s => s.type === 'VOID_SLOW');
        const isFrozen = unit.statusEffects.some(s => s.type === 'FREEZE');
        if (isSlowed || isFrozen) {
            return Math.ceil(unit.stats.speed * 0.5);
        }
        return unit.stats.speed;
    };

    const decrementStatusDurations = (unit) => {
        unit.statusEffects.forEach(s => s.duration--);
        unit.statusEffects = unit.statusEffects.filter(s => s.duration > 0);
    };

    let playerTicks = getEffectiveSpeed(player);
    let enemyTicks = getEffectiveSpeed(enemy);
    const ATB_THRESHOLD = 100;

    if (playerTicks >= enemyTicks) {
        playerTicks = ATB_THRESHOLD;
    } else {
        enemyTicks = ATB_THRESHOLD;
    }

    let safetyCounter = 0;
    const maxTicks = 10000;

    while (pHP > 0 && eHP > 0 && safetyCounter < maxTicks) {
        safetyCounter++;

        const isPlayerTurn = playerTicks >= enemyTicks;

        if (isPlayerTurn) {
            // Player Turn
            const playerEffects = [...player.statusEffects];
            for (const status of playerEffects) {
                if (status.type === 'BURN' || status.type === 'POISON') {
                    const tickDamage = Math.ceil(status.damagePerTurn * (status.stacks || 1));
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
                }
            }
            if (pHP <= 0) break;

            const hasRegen = player.statusEffects.some(s => s.type === 'NATURE_REGEN');
            if (hasRegen) {
                pHP = Math.min(player.maxHP, pHP + Math.ceil(player.maxHP * 0.05));
            }

            const isStunned = player.statusEffects.some(s => s.type === 'STUN');
            if (!isStunned) {
                pMana = Math.min(100, pMana + 25);

                if (pMana >= 100) {
                    pMana = 0;
                    const ability = ABILITIES[player.heroId];
                    const dmgMult = ability.activeAbility.damageMultiplier;
                    const baseDmg = player.stats.attack * dmgMult * (0.9 + Math.random() * 0.2);

                    let targetDefense = enemy.stats.defense;
                    const defReduction = targetDefense / (targetDefense + 200);
                    const finalActiveDmg = Math.ceil(Math.max(1, baseDmg * (1 - defReduction)));
                    
                    eHP = Math.max(0, eHP - finalActiveDmg);

                    if (ability.activeAbility.healPercent) {
                        pHP = Math.min(player.maxHP, pHP + Math.ceil(player.maxHP * ability.activeAbility.healPercent));
                    }
                    if (ability.activeAbility.shieldPercent) {
                        const shieldAmt = Math.ceil(player.maxHP * ability.activeAbility.shieldPercent);
                        pShield = Math.min(player.maxHP * 0.5, pShield + shieldAmt);
                    }
                    if (ability.activeAbility.onCastStatus) {
                        const castStatus = ability.activeAbility.onCastStatus;
                        const targetUnit = castStatus.target === 'enemy' ? enemy : player;
                        const dmgPerTurn = castStatus.damagePerTurn ? Math.ceil(player.stats.attack * castStatus.damagePerTurn) : 0;
                        applyStatusEffect(targetUnit, castStatus.type, castStatus.duration, dmgPerTurn);
                    }
                } else {
                    const dodgeChance = enemy.stats.evasion / 100;
                    const dodgeCheck = Math.random() < dodgeChance;

                    if (!dodgeCheck) {
                        let baseDmg = player.stats.attack * (0.9 + Math.random() * 0.2);
                        const hasMark = enemy.statusEffects.some(s => s.type === 'SHADOW_MARK');
                        let isCrit = Math.random() < (player.stats.critChance / 100);
                        if (hasMark) {
                            isCrit = true;
                        }

                        if (isCrit) {
                            let critMult = player.stats.critDamage || 1.5;
                            if (player.heroId === 'tiger_warrior' && hasMark) {
                                critMult *= (1 + 24 * 0.05);
                            }
                            baseDmg *= critMult;
                        }

                        let targetDefense = enemy.stats.defense;
                        if (player.heroId === 'panda') {
                            targetDefense *= 0.5;
                        }

                        const defReduction = targetDefense / (targetDefense + 200);
                        const mitigated = baseDmg * (1 - defReduction);
                        const blockCheck = Math.random() < (enemy.stats.defense > 0 ? 0.15 : 0.05);

                        let finalDmg = Math.ceil(mitigated);
                        if (blockCheck) {
                            finalDmg = Math.max(1, Math.ceil(mitigated * 0.3));
                        }

                        eHP = Math.max(0, eHP - finalDmg);

                        if (hasMark) {
                            enemy.statusEffects = enemy.statusEffects.filter(s => s.type !== 'SHADOW_MARK');
                        }

                        simulateStatusEffects(player, enemy, isCrit && !blockCheck);
                    }
                }
            }

            decrementStatusDurations(player);
            playerTicks = 0;
            playerTicks += getEffectiveSpeed(player);
            enemyTicks += getEffectiveSpeed(enemy);
        } else {
            // Enemy (Bot) Turn
            const enemyEffects = [...enemy.statusEffects];
            for (const status of enemyEffects) {
                if (status.type === 'BURN' || status.type === 'POISON') {
                    const tickDamage = Math.ceil(status.damagePerTurn * (status.stacks || 1));
                    let dmg = tickDamage;
                    if (eShield > 0) {
                        if (eShield >= dmg) {
                            eShield -= dmg;
                            dmg = 0;
                        } else {
                            dmg -= eShield;
                            eShield = 0;
                        }
                    }
                    eHP = Math.max(0, eHP - dmg);
                }
            }
            if (eHP <= 0) break;

            const hasRegen = enemy.statusEffects.some(s => s.type === 'NATURE_REGEN');
            if (hasRegen) {
                eHP = Math.min(enemy.maxHP, eHP + Math.ceil(enemy.maxHP * 0.05));
            }

            const isStunned = enemy.statusEffects.some(s => s.type === 'STUN');
            if (!isStunned) {
                eMana = Math.min(100, eMana + 25);

                if (eMana >= 100) {
                    eMana = 0;
                    const ability = ABILITIES[enemy.heroId];
                    const dmgMult = ability.activeAbility.damageMultiplier;
                    const baseDmg = enemy.stats.attack * dmgMult * (0.9 + Math.random() * 0.2);

                    let targetDefense = player.stats.defense;
                    const defReduction = targetDefense / (targetDefense + 200);
                    const finalActiveDmg = Math.ceil(Math.max(1, baseDmg * (1 - defReduction)));

                    let dmg = finalActiveDmg;
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

                    if (ability.activeAbility.healPercent) {
                        eHP = Math.min(enemy.maxHP, eHP + Math.ceil(enemy.maxHP * ability.activeAbility.healPercent));
                    }
                    if (ability.activeAbility.shieldPercent) {
                        const shieldAmt = Math.ceil(enemy.maxHP * ability.activeAbility.shieldPercent);
                        eShield = Math.min(enemy.maxHP * 0.5, eShield + shieldAmt);
                    }
                    if (ability.activeAbility.onCastStatus) {
                        const castStatus = ability.activeAbility.onCastStatus;
                        const targetUnit = castStatus.target === 'enemy' ? player : enemy;
                        const dmgPerTurn = castStatus.damagePerTurn ? Math.ceil(enemy.stats.attack * castStatus.damagePerTurn) : 0;
                        applyStatusEffect(targetUnit, castStatus.type, castStatus.duration, dmgPerTurn);
                    }
                } else {
                    const dodgeChance = player.stats.evasion / 100;
                    const dodgeCheck = Math.random() < dodgeChance;

                    if (!dodgeCheck) {
                        let baseDmg = enemy.stats.attack * (0.9 + Math.random() * 0.2);
                        const hasMark = player.statusEffects.some(s => s.type === 'SHADOW_MARK');
                        let isCrit = Math.random() < (enemy.stats.critChance / 100);
                        if (hasMark) {
                            isCrit = true;
                        }

                        if (isCrit) {
                            let critMult = enemy.stats.critDamage || 1.5;
                            if (enemy.heroId === 'tiger_warrior' && hasMark) {
                                critMult *= (1 + 24 * 0.05);
                            }
                            baseDmg *= critMult;
                        }

                        let targetDefense = player.stats.defense;
                        if (enemy.heroId === 'panda') {
                            targetDefense *= 0.5;
                        }

                        const defReduction = targetDefense / (targetDefense + 200);
                        const mitigated = baseDmg * (1 - defReduction);
                        const blockCheck = Math.random() < (player.stats.defense > 0 ? 0.15 : 0.05);

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

                        if (hasMark) {
                            player.statusEffects = player.statusEffects.filter(s => s.type !== 'SHADOW_MARK');
                        }

                        simulateStatusEffects(enemy, player, isCrit && !blockCheck);
                    }
                }
            }

            decrementStatusDurations(enemy);
            enemyTicks = 0;
            playerTicks += getEffectiveSpeed(player);
            enemyTicks += getEffectiveSpeed(enemy);
        }
    }

    return pHP > 0;
}

// Winrate simulation helper
function runWinrateSimulations() {
    console.log("=== COMBAT WINRATE SIMULATION ===");
    console.log("Running 500 battles per class scenario...");
    const classes = Object.keys(HEROES_BASE_STATS);
    const levels = [1, 40, 80];
    const results = {};

    classes.forEach(heroId => {
        results[heroId] = {};
        levels.forEach(level => {
            let rating = 500;
            if (level === 40) rating = 4500;
            if (level === 80) rating = 8500;

            const playerRarity = getRarityForRating(rating);
            let wins = 0;
            const totalBattles = 500;

            for (let i = 0; i < totalBattles; i++) {
                // Generate bot
                const botRating = Math.max(0, rating + Math.floor(Math.random() * 60) - 30);
                const botLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
                const botRarity = getRarityForRating(botRating);

                // Select random bot hero class
                const botHeroId = classes[Math.floor(Math.random() * classes.length)];

                const player = createCombatant(heroId, level, rating, playerRarity, false, 0, 0);
                const bot = createCombatant(botHeroId, botLevel, botRating, botRarity, true, 0, 0);

                if (simulateCombat(player, bot)) {
                    wins++;
                }
            }

            const winrate = (wins / totalBattles) * 100;
            results[heroId][level] = winrate.toFixed(1);
            console.log(`Hero: ${heroId.padEnd(15)} | Level: ${level.toString().padEnd(2)} | Rating: ${rating.toString().padEnd(4)} | Winrate: ${winrate.toFixed(1)}%`);
        });
    });

    return results;
}

// Climb simulation helper
function simulateClimb(heroId, useProposedFormula) {
    let rating = 0;
    let level = 1;
    let xp = 0;
    let energySpent = 0;
    let battlesCount = 0;
    let winStreak = 0;
    let lossStreak = 0;

    const classes = Object.keys(HEROES_BASE_STATS);

    while (rating < 10500 && battlesCount < 15000) {
        battlesCount++;
        energySpent += 10;

        const playerRarity = getRarityForRating(rating);

        // Matchmaker bot params
        const botRating = Math.max(0, rating + Math.floor(Math.random() * 60) - 30);
        const botLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
        const botRarity = getRarityForRating(botRating);
        const botHeroId = classes[Math.floor(Math.random() * classes.length)];

        // Create combatants
        const player = createCombatant(heroId, level, rating, playerRarity, false, winStreak, lossStreak);
        const bot = createCombatant(botHeroId, botLevel, botRating, botRarity, true, lossStreak, winStreak);

        const won = simulateCombat(player, bot);

        if (won) {
            winStreak++;
            lossStreak = 0;
            const change = useProposedFormula 
                ? calcCupsChangeProposed(rating, botRating, true, level)
                : calcCupsChangeCurrent(rating, botRating, true);
            rating += change;
            xp += getXPReward(level, true);
        } else {
            lossStreak++;
            winStreak = 0;
            const change = useProposedFormula 
                ? calcCupsChangeProposed(rating, botRating, false, level)
                : calcCupsChangeCurrent(rating, botRating, false);
            rating = Math.max(0, rating + change); // rating change is negative
            xp += getXPReward(level, false);
        }

        // Level up
        while (level < 80 && xp >= getHeroExpNeeded(level)) {
            xp -= getHeroExpNeeded(level);
            level++;
        }
    }

    return {
        battlesCount,
        energySpent,
        finalLevel: level,
        stuck: rating < 10500
    };
}

function runClimbSimulations(useProposedFormula) {
    const label = useProposedFormula ? "PROPOSED NEW FORMULA" : "CURRENT FORMULA";
    console.log(`\n=== RUNNING CLIMB SIMULATION (${label}) ===`);
    
    const classes = Object.keys(HEROES_BASE_STATS);
    const summary = {};

    classes.forEach(heroId => {
        let totalBattles = 0;
        let totalEnergy = 0;
        let stuckCount = 0;
        const runs = 20;

        for (let i = 0; i < runs; i++) {
            const res = simulateClimb(heroId, useProposedFormula);
            if (res.stuck) {
                stuckCount++;
            } else {
                totalBattles += res.battlesCount;
                totalEnergy += res.energySpent;
            }
        }

        const activeRuns = runs - stuckCount;
        const avgBattles = activeRuns > 0 ? Math.round(totalBattles / activeRuns) : "N/A (Stuck)";
        const avgEnergy = activeRuns > 0 ? Math.round(totalEnergy / activeRuns) : "N/A (Stuck)";

        console.log(`Hero: ${heroId.padEnd(15)} | Stuck: ${stuckCount}/${runs} runs | Avg Battles: ${avgBattles} | Avg Energy: ${avgEnergy}`);
        summary[heroId] = { avgBattles, avgEnergy, stuckCount, runs };
    });

    return summary;
}

// Run all simulations
const winrateResults = runWinrateSimulations();
const currentClimbResults = runClimbSimulations(false);
const proposedClimbResults = runClimbSimulations(true);

// Print final comparative summary
console.log("\n=================== FINAL SUMMARY ===================");
console.log("Winrates (Level 1 / 40 / 80):");
Object.entries(winrateResults).forEach(([hero, wr]) => {
    console.log(`  ${hero.padEnd(15)}: Lvl 1: ${wr[1]}%, Lvl 40: ${wr[40]}%, Lvl 80: ${wr[80]}%`);
});

console.log("\nClimbing to Legend (10,500 cups) - Current vs Proposed:");
Object.keys(HEROES_BASE_STATS).forEach(heroId => {
    const cur = currentClimbResults[heroId];
    const prop = proposedClimbResults[heroId];
    console.log(`  ${heroId.padEnd(15)}:`);
    console.log(`    Current : Avg Battles: ${cur.avgBattles}, Avg Energy: ${cur.avgEnergy}, Stuck: ${cur.stuckCount}/${cur.runs}`);
    console.log(`    Proposed: Avg Battles: ${prop.avgBattles}, Avg Energy: ${prop.avgEnergy}, Stuck: ${prop.stuckCount}/${prop.runs}`);
});

// Output JSON for the wrapper to read easily
const reportData = {
    winrateResults,
    currentClimbResults,
    proposedClimbResults
};
fs.writeFileSync('scratch/sim_results.json', JSON.stringify(reportData, null, 2));
console.log("\nSaved raw simulation results to scratch/sim_results.json");
