import fs from 'fs';

// Target corridors:
// Aurelius (lion_knight): 54-57%
// Gromm (minotaur): 51-54%
// Rikki (raccoon): 49-53%
// Varkan (tiger_warrior): 49-53%
// Panda (panda): 44-48%

const TARGETS = {
    lion_knight: { min: 0.54, max: 0.57 },
    minotaur: { min: 0.51, max: 0.54 },
    raccoon: { min: 0.49, max: 0.53 },
    tiger_warrior: { min: 0.49, max: 0.53 },
    panda: { min: 0.44, max: 0.48 }
};

const HEROES_BASE_BUDGET = {
    panda: 54, // 19 + 12 + 23
    raccoon: 54, // 14 + 24 + 16
    minotaur: 56, // 22 + 8 + 26
    tiger_warrior: 56, // 16 + 24 + 16
    lion_knight: 56 // 19 + 16 + 21
};

const HERO_ROLES = {
    panda: 'WARRIOR',
    raccoon: 'ASSASSIN',
    minotaur: 'TANK',
    tiger_warrior: 'ASSASSIN',
    lion_knight: 'WARRIOR'
};

const HERO_NAMES = {
    panda: 'Фэн Лун (Panda)',
    raccoon: 'Рикки (Raccoon)',
    minotaur: 'Громм (Minotaur)',
    tiger_warrior: 'Варкан (Tiger Warrior)',
    lion_knight: 'Аурелиус (Lion Knight)'
};

const getLevelMultiplier = (level) => {
    let mult = 1.0;
    for (let i = 2; i <= level; i++) {
        if (i <= 20) mult += 0.03;
        else if (i <= 40) mult += 0.025;
        else if (i <= 60) mult += 0.02;
        else mult += 0.015;
    }
    return Math.round(mult * 1000) / 1000;
};

const NO_GEAR = { hp: 0, attack: 0, defense: 0, crit: 0, speed: 0, evasion: 0, lifesteal: 0, penetration: 0, accuracy: 100 };

function createCombatant(heroId, statsConfig, level) {
    const levelMultiplier = getLevelMultiplier(level);
    const gear = NO_GEAR;

    const stamina = statsConfig[heroId].stamina;
    const strength = statsConfig[heroId].strength;
    const agility = statsConfig[heroId].agility;

    const base = {
        hp: Math.round(stamina * 10 * levelMultiplier),
        attack: Math.round(strength * 2 * levelMultiplier),
        defense: Math.round(stamina * 0.5 * levelMultiplier),
        speed: 1 + agility * 0.05,
        critChance: agility * 0.5,
        evasion: agility * 0.2,
        critDamage: 1.5,
        lifesteal: 0,
        penetration: 0,
        accuracy: 100
    };

    return {
        id: heroId,
        name: HERO_NAMES[heroId],
        role: HERO_ROLES[heroId],
        level,
        avgItemLevel: 1,
        maxHp: base.hp + gear.hp,
        hp: base.hp + gear.hp,
        attack: base.attack + gear.attack,
        defense: base.defense + gear.defense,
        speed: base.speed + gear.speed,
        critChance: Math.min(75, base.critChance + gear.crit),
        evasion: Math.min(60, base.evasion + gear.evasion),
        critDamage: base.critDamage,
        lifesteal: base.lifesteal + gear.lifesteal,
        penetration: base.penetration + gear.penetration,
        accuracy: base.accuracy + gear.accuracy - 100,
        agility: agility,
        shield: 0,
        mana: 0,
        statusEffects: [],
        hunterStacks: 0,
        attackCounter: 0,
        activeDmg: heroId === 'panda' ? 2.5 : heroId === 'raccoon' ? 3.5 : heroId === 'tiger_warrior' ? 3.2 : heroId === 'lion_knight' ? 2.4 : 1.8,
        shieldPercent: heroId === 'minotaur' ? statsConfig.minotaur.shieldPercent : 0, 
        regenPercent: heroId === 'lion_knight' ? statsConfig.lion_knight.regenPercent : 0, 
        burnPct: heroId === 'panda' ? 0.12 : 0.10, 
        poisonPct: heroId === 'raccoon' ? 0.10 : 0 
    };
}

function simulateCombat(p1, p2, statsConfig) {
    let tickCount = 0;
    let p1Ticks = p1.speed;
    let p2Ticks = p2.speed;
    const ATB_THRESHOLD = 100;
    
    let p1Shield = 0;
    let p2Shield = 0;

    let p1HP = p1.maxHp;
    let p2HP = p2.maxHp;

    let p1Mana = 0;
    let p2Mana = 0;

    let p1StatusEffects = [];
    let p2StatusEffects = [];

    let p1HunterStacks = 0;
    let p2HunterStacks = 0;

    let p1AttackCounter = 0;
    let p2AttackCounter = 0;

    let statsP1 = { ...p1 };
    let statsP2 = { ...p2 };

    let isRageActive = false;

    const applyStatus = (statusEffects, type, duration, value = 0, delay = 0) => {
        const existing = statusEffects.find(s => s.type === type);
        if (existing) {
            if (type === 'POISON') {
                existing.stacks = Math.min(6, (existing.stacks || 1) + 1);
                existing.duration = Math.max(existing.duration, duration);
                existing.value = value;
            } else {
                existing.duration = Math.max(existing.duration, duration);
                existing.value = Math.max(existing.value, value);
            }
            if (type === 'SHADOW_MARK') {
                existing.delay = Math.max(existing.delay || 0, delay);
            }
        } else {
            statusEffects.push({ type, duration, value, stacks: 1, delay });
        }
    };

    const processEffects = (isP1) => {
        let hp = isP1 ? p1HP : p2HP;
        let shield = isP1 ? p1Shield : p2Shield;
        let statusList = isP1 ? p1StatusEffects : p2StatusEffects;
        const maxHp = isP1 ? p1.maxHp : p2.maxHp;

        const targetDefense = isP1 ? statsP1.defense : statsP2.defense;

        statusList.forEach(s => {
            if (s.type === 'SHADOW_MARK' && s.delay > 0) {
                s.delay--;
            }
            if (s.type === 'BURN' || s.type === 'POISON') {
                let tickDamage = s.type === 'BURN' ? s.value : s.value * (s.stacks || 1);
                
                const defMultiplier = s.type === 'POISON' ? 0.5 : 0.25;
                const effectiveDef = targetDefense * defMultiplier;
                const divisor = 200;
                const mitigation = effectiveDef / (effectiveDef + divisor);
                let dmg = Math.max(1, Math.ceil(tickDamage * (1 - mitigation)));

                if (shield > 0) {
                    if (shield >= dmg) {
                        shield -= dmg;
                        dmg = 0;
                    } else {
                        dmg -= shield;
                        shield = 0;
                    }
                }
                hp = Math.max(0, hp - dmg);
            }
            if (s.type === 'NATURE_REGEN') {
                const regenPercent = isP1 ? p1.regenPercent : p2.regenPercent;
                const baseHeal = Math.ceil(maxHp * regenPercent);
                const effectiveDef = targetDefense * 0.5;
                const divisor = 200;
                const mitigation = effectiveDef / (effectiveDef + divisor);
                const heal = Math.max(1, Math.ceil(baseHeal * (1 - mitigation)));

                hp = Math.min(maxHp, hp + heal);
            }
        });

        if (isP1) {
            p1HP = hp;
            p1Shield = shield;
        } else {
            p2HP = hp;
            p2Shield = shield;
        }
    };

    const executeAttack = (isP1) => {
        const att = isP1 ? statsP1 : statsP2;
        const def = isP1 ? statsP2 : statsP1;

        let attMana = isP1 ? p1Mana : p2Mana;
        let attHP = isP1 ? p1HP : p2HP;
        let defHP = isP1 ? p2HP : p1HP;
        let defShield = isP1 ? p2Shield : p1Shield;

        let attStatus = isP1 ? p1StatusEffects : p2StatusEffects;
        let defStatus = isP1 ? p2StatusEffects : p1StatusEffects;

        let attHunterStacks = isP1 ? p1HunterStacks : p2HunterStacks;

        const isStunned = attStatus.some(s => s.type === 'STUN' || s.type === 'FREEZE');
        if (isStunned) return;

        attMana = Math.min(100, attMana + 25);

        let damage = 0;
        let isCrit = false;
        let isSpell = false;

        const hasMarkAtStart = defStatus.some(s => s.type === 'SHADOW_MARK' && (!s.delay || s.delay <= 0));

        if (attMana >= 100) {
            isSpell = true;
            attMana = 0;
            damage = att.attack * att.activeDmg * (0.9 + Math.random() * 0.2);
        } else {
            const isAssassin = att.role === 'ASSASSIN';
            const attCounter = isP1 ? ++p1AttackCounter : ++p2AttackCounter;
            const isShadowStep = isAssassin && attCounter % 3 === 0;

            const extraDodge = isShadowStep ? 0.15 : 0;
            const effectiveEvasion = Math.max(0, def.evasion - Math.max(0, att.accuracy - 100) * 0.005);
            const dodgeChance = Math.min(0.6, (effectiveEvasion / 100) + extraDodge);

            if (Math.random() < dodgeChance) {
                if (isP1) p1Mana = attMana;
                else p2Mana = attMana;
                return;
            }

            damage = att.attack * (0.9 + Math.random() * 0.2);
            isCrit = Math.random() < (att.critChance / 100);
            if (isCrit) {
                damage *= att.critDamage;
            }
        }

        let mult = 1.0;
        if (att.id === 'tiger_warrior') {
            mult += attHunterStacks * 0.08;
            if (hasMarkAtStart) {
                mult += (statsConfig.tiger_warrior.markMult - 1.0);
            }
        }
        damage *= mult;

        const effectiveDef = Math.max(0, def.defense - att.penetration);
        const divisor = 200;
        const defenseReduction = effectiveDef / (effectiveDef + divisor);
        let mitigatedDmg = Math.ceil(damage * (1 - defenseReduction));

        if (!isSpell) {
            const blockChance = def.defense > 0 ? 0.15 : 0.05;
            if (Math.random() < blockChance) {
                mitigatedDmg = Math.max(1, Math.ceil(mitigatedDmg * 0.3));
            }
        }

        if (def.id === 'tiger_warrior') {
            if (isP1) p2HunterStacks = 0;
            else p1HunterStacks = 0;
        }

        let actualDmgToHP = mitigatedDmg;
        if (defShield > 0) {
            if (defShield >= actualDmgToHP) {
                defShield -= actualDmgToHP;
                actualDmgToHP = 0;
            } else {
                actualDmgToHP -= defShield;
                defShield = 0;
            }
        }
        defHP = Math.max(0, defHP - actualDmgToHP);

        if (att.lifesteal > 0 && mitigatedDmg > 0) {
            const heal = Math.ceil(mitigatedDmg * att.lifesteal);
            attHP = Math.min(att.maxHp, attHP + heal);
        }

        if (isP1) {
            p1Mana = attMana;
            p1HP = attHP;
            p2HP = defHP;
            p2Shield = defShield;
        } else {
            p2Mana = attMana;
            p2HP = attHP;
            p1HP = defHP;
            p1Shield = defShield;
        }

        if (hasMarkAtStart) {
            if (isP1) {
                p2StatusEffects = p2StatusEffects.filter(s => s.type !== 'SHADOW_MARK');
                defStatus = p2StatusEffects;
            } else {
                p1StatusEffects = p1StatusEffects.filter(s => s.type !== 'SHADOW_MARK');
                defStatus = p1StatusEffects;
            }
        }

        if (isSpell) {
            if (att.id === 'panda') {
                applyStatus(defStatus, 'STUN', 1);
            } else if (att.id === 'raccoon') {
                const dmg = Math.max(15, att.attack * att.poisonPct);
                applyStatus(defStatus, 'POISON', 4, dmg);
            } else if (att.id === 'tiger_warrior') {
                applyStatus(defStatus, 'SHADOW_MARK', 2, 0, 1);
            } else if (att.id === 'lion_knight') {
                applyStatus(attStatus, 'NATURE_REGEN', 4);
            } else if (att.id === 'minotaur') {
                const sVal = Math.round(att.maxHp * att.shieldPercent);
                if (isP1) p1Shield = Math.min(att.maxHp * 0.5, p1Shield + sVal);
                else p2Shield = Math.min(att.maxHp * 0.5, p2Shield + sVal);
            }
        } else {
            if (att.id === 'panda' && Math.random() < 0.42) {
                applyStatus(defStatus, 'BURN', 3, att.attack * att.burnPct);
            } else if (att.id === 'raccoon' && Math.random() < 0.35) {
                const dmg = Math.max(15, att.attack * (att.poisonPct - 0.01));
                applyStatus(defStatus, 'POISON', 4, dmg);
            } else if (att.id === 'tiger_warrior' && Math.random() < 0.35) {
                applyStatus(defStatus, 'SHADOW_MARK', 2, 0, 1);
            } else if (att.id === 'lion_knight' && Math.random() < 0.25) {
                applyStatus(defStatus, 'BURN', 2, att.attack * 0.1);
            } else if (att.id === 'minotaur' && Math.random() < 0.15) {
                applyStatus(defStatus, 'STUN', 1);
            }
        }
    };

    const decrementStatusDurations = (isP1) => {
        let statusList = isP1 ? p1StatusEffects : p2StatusEffects;
        statusList.forEach(s => s.duration--);
        const nextList = statusList.filter(s => s.duration > 0);
        if (isP1) p1StatusEffects = nextList;
        else p2StatusEffects = nextList;
    };

    while (p1HP > 0 && p2HP > 0 && tickCount < 10000) {
        tickCount++;

        if (tickCount === 8000 && !isRageActive) {
            isRageActive = true;
            statsP1.attack = Math.round(statsP1.attack * 1.5);
            statsP1.defense = Math.round(statsP1.defense * 0.7);
            statsP2.attack = Math.round(statsP2.attack * 1.5);
            statsP2.defense = Math.round(statsP2.defense * 0.7);
        }

        p1Ticks += statsP1.speed;
        p2Ticks += statsP2.speed;

        if (p1Ticks >= ATB_THRESHOLD) {
            p1Ticks -= ATB_THRESHOLD;
            p1HunterStacks++;
            processEffects(true);
            if (p1HP <= 0 || p2HP <= 0) break;
            executeAttack(true);
            if (p1HP <= 0 || p2HP <= 0) break;
            decrementStatusDurations(true);
        }

        if (p2Ticks >= ATB_THRESHOLD) {
            p2Ticks -= ATB_THRESHOLD;
            p2HunterStacks++;
            processEffects(false);
            if (p1HP <= 0 || p2HP <= 0) break;
            executeAttack(false);
            if (p1HP <= 0 || p2HP <= 0) break;
            decrementStatusDurations(false);
        }
    }

    let winner = 0.5;
    if (p1HP <= 0 && p2HP <= 0) winner = 0.5;
    else if (p1HP <= 0) winner = 0;
    else if (p2HP <= 0) winner = 1;
    else {
        winner = (p1HP / p1.maxHp) >= (p2HP / p2.maxHp) ? 1 : 0;
    }

    return { winner };
}

function runAnalysis(statsConfig, level) {
    const runsPerSetting = 500;
    const ids = Object.keys(TARGETS);
    const matrix = {};
    
    ids.forEach(h1 => {
        matrix[h1] = {};
    });

    ids.forEach(h1 => {
        ids.forEach(h2 => {
            if (h1 === h2) {
                matrix[h1][h2] = 0.5;
                return;
            }

            let p1Wins = 0;
            for (let i = 0; i < runsPerSetting; i++) {
                const h1IsP1 = (i % 2 === 0);
                const p1 = createCombatant(h1IsP1 ? h1 : h2, statsConfig, level);
                const p2 = createCombatant(h1IsP1 ? h2 : h1, statsConfig, level);
                const res = simulateCombat(p1, p2, statsConfig);

                if (h1IsP1) {
                    p1Wins += res.winner;
                } else {
                    p1Wins += (1 - res.winner);
                }
            }
            matrix[h1][h2] = p1Wins / runsPerSetting;
        });
    });

    // Overall winrates
    const winrates = {};
    ids.forEach(h1 => {
        let sum = 0;
        ids.forEach(h2 => {
            sum += matrix[h1][h2];
        });
        winrates[h1] = sum / ids.length;
    });

    return { matrix, winrates };
}

// Optimization search
function optimize() {
    console.log("Starting Optimization...");
    
    // Initial stats: official database stats
    let current = {
        panda: { stamina: 23, strength: 19, agility: 12 },
        raccoon: { stamina: 16, strength: 14, agility: 24 },
        minotaur: { stamina: 26, strength: 22, agility: 8, shieldPercent: 0.12 },
        tiger_warrior: { stamina: 16, strength: 16, agility: 24, markMult: 1.6 },
        lion_knight: { stamina: 21, strength: 19, agility: 16, regenPercent: 0.04 }
    };

    let bestConfig = JSON.parse(JSON.stringify(current));
    let bestScore = -Infinity;
    let bestWinrates = {};
    let bestMatrix = {};

    function evaluate(config) {
        const { winrates, matrix } = runAnalysis(config, 1);
        
        let score = 0;
        let allInCorridor = true;
        
        Object.entries(TARGETS).forEach(([id, target]) => {
            const wr = winrates[id];
            if (wr >= target.min && wr <= target.max) {
                // Large reward for being inside the corridor
                score += 100;
                // Add minor reward for being closer to the center of the corridor
                const center = (target.min + target.max) / 2;
                score += 10 * (1 - Math.abs(wr - center) / (target.max - target.min));
            } else {
                allInCorridor = false;
                // Penalty based on distance to corridor
                const dist = wr < target.min ? target.min - wr : wr - target.max;
                score -= dist * 1000;
            }
        });

        return { score, allInCorridor, winrates, matrix };
    }

    const ids = Object.keys(TARGETS);
    const baseline = evaluate(current);
    console.log("Baseline Winrates at Lvl 1:", Object.entries(baseline.winrates).map(([id, wr]) => `${id}: ${(wr*100).toFixed(1)}%`).join(', '));
    
    bestConfig = JSON.parse(JSON.stringify(current));
    bestScore = baseline.score;
    bestWinrates = baseline.winrates;
    bestMatrix = baseline.matrix;

    if (baseline.allInCorridor) {
        console.log("Baseline is already balanced!");
        return current;
    }

    // Local Search / Random Hill Climbing
    const iterations = 4000;
    let temp = 1.0;

    for (let iter = 1; iter <= iterations; iter++) {
        // Create candidate mutation
        const candidate = JSON.parse(JSON.stringify(current));
        
        // Mutate one or more heroes
        const targetHero = ids[Math.floor(Math.random() * ids.length)];

        // Mutate primary stats keeping budget constant
        const budget = HEROES_BASE_BUDGET[targetHero];
        
        let stamina = current[targetHero].stamina;
        let strength = current[targetHero].strength;
        let agility = current[targetHero].agility;

        if (Math.random() < 0.7) {
            // Small step: transfer 1 point from one stat to another
            const stats = ['stamina', 'strength', 'agility'];
            const from = stats[Math.floor(Math.random() * 3)];
            let to = stats[Math.floor(Math.random() * 3)];
            while (to === from) {
                to = stats[Math.floor(Math.random() * 3)];
            }
            if (from === 'stamina' && stamina > 5) {
                stamina--;
                if (to === 'strength') strength++; else agility++;
            } else if (from === 'strength' && strength > 5) {
                strength--;
                if (to === 'stamina') stamina++; else agility++;
            } else if (from === 'agility' && agility > 5) {
                agility--;
                if (to === 'stamina') stamina++; else strength++;
            }
        } else {
            // Large step: random redistribution of budget
            stamina = Math.floor(Math.random() * (budget - 15)) + 5;
            strength = Math.floor(Math.random() * (budget - stamina - 10)) + 5;
            agility = budget - stamina - strength;
        }

        if (stamina >= 5 && strength >= 5 && agility >= 5) {
            candidate[targetHero].stamina = stamina;
            candidate[targetHero].strength = strength;
            candidate[targetHero].agility = agility;
        }

        // Mutate abilities if applicable (within constraints)
        if (targetHero === 'minotaur') {
            // shieldPercent <= 0.12 (from 0.05 to 0.12)
            candidate.minotaur.shieldPercent = Math.round((0.05 + Math.random() * 0.07) * 1000) / 1000;
        } else if (targetHero === 'lion_knight') {
            // regenPercent <= 0.04 (from 0.01 to 0.04)
            candidate.lion_knight.regenPercent = Math.round((0.01 + Math.random() * 0.03) * 1000) / 1000;
        } else if (targetHero === 'tiger_warrior') {
            // markMult <= 1.7 (from 1.2 to 1.7)
            candidate.tiger_warrior.markMult = Math.round((1.2 + Math.random() * 0.5) * 10) / 10;
        }

        // Evaluate candidate
        const result = evaluate(candidate);
        
        // Simulated annealing / hill climbing acceptance probability
        const diff = result.score - bestScore;
        if (diff > 0 || Math.random() < Math.exp(diff / temp)) {
            current = candidate;
            if (result.score > bestScore) {
                bestScore = result.score;
                bestConfig = JSON.parse(JSON.stringify(candidate));
                bestWinrates = result.winrates;
                bestMatrix = result.matrix;
                console.log(`Iteration ${iter} - New Best Score: ${bestScore.toFixed(2)} Winrates:`, 
                    Object.entries(bestWinrates).map(([id, wr]) => `${id}: ${(wr*100).toFixed(1)}%`).join(', ')
                );
            }
        }

        // Cool down
        temp *= 0.995;
        
        if (result.allInCorridor && result.score >= bestScore) {
            console.log("Converged to configuration meeting all corridors!");
            break;
        }
    }

    console.log("=== OPTIMIZATION COMPLETED ===");
    console.log("Best score achieved:", bestScore);
    console.log("Best Winrates:", Object.entries(bestWinrates).map(([id, wr]) => `${id}: ${(wr*100).toFixed(1)}%`).join(', '));
    console.log("Best Config:", JSON.stringify(bestConfig, null, 2));

    // Print best matrix
    console.log("\n=== Best Matchup matrix ===");
    console.log("| Hero (A) \\ (B) | panda | raccoon | minotaur | tiger_warrior | lion_knight |");
    console.log("|---|---|---|---|---|---|");
    ids.forEach(h1 => {
        let row = `| **${h1}** | `;
        ids.forEach(h2 => {
            if (h1 === h2) {
                row += "- | ";
            } else {
                row += `${(bestMatrix[h1][h2] * 100).toFixed(1)}% | `;
            }
        });
        console.log(row);
    });
}

optimize();
