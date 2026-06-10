// scratch/analyze_combat_layers.js
import fs from 'fs';

const HEROES_DB = [
    { id: 'panda', name: 'Фэн Лун', stats: { strength: 19, agility: 12, stamina: 25, intelligence: 10 }, role: 'WARRIOR' },
    { id: 'raccoon', name: 'Рикки', stats: { strength: 14, agility: 24, stamina: 18.5, intelligence: 9.5 }, role: 'ASSASSIN' },
    { id: 'minotaur', name: 'Громм', stats: { strength: 23.5, agility: 8, stamina: 24.5, intelligence: 10 }, role: 'TANK' },
    { id: 'tiger_warrior', name: 'Варкан', stats: { strength: 16.5, agility: 20, stamina: 21, intelligence: 8.5 }, role: 'ASSASSIN' },
    { id: 'lion_knight', name: 'Аурелиус', stats: { strength: 19, agility: 16, stamina: 21, intelligence: 10 }, role: 'WARRIOR' }
];

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

const GEAR_DB = {
    MYTHIC: { hp: 21000, attack: 980, defense: 2250, crit: 20, speed: 0.42, evasion: 15, lifesteal: 0.18, penetration: 60, accuracy: 145 }
};

function createCombatant(hero, level, gearRarity, disableShields = false) {
    const levelMultiplier = getLevelMultiplier(level);
    const gear = GEAR_DB[gearRarity] || GEAR_DB.MYTHIC;

    const stamina = hero.stats.stamina;
    const strength = hero.stats.strength;
    const agility = hero.stats.agility;

    const base = {
        hp: Math.round(stamina * 10 * levelMultiplier),
        attack: Math.round(strength * 2 * levelMultiplier),
        defense: hero.id === 'tiger_warrior'
            ? Math.round(12 * levelMultiplier)
            : Math.round(stamina * 0.5 * levelMultiplier),
        speed: 1 + agility * 0.05,
        critChance: agility * 0.5,
        evasion: agility * 0.2,
        critDamage: 1.5,
        lifesteal: 0,
        penetration: 0,
        accuracy: 100
    };

    return {
        id: hero.id,
        name: hero.name,
        role: hero.role,
        level,
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
        activeDmg: hero.id === 'panda' ? 2.5 : hero.id === 'raccoon' ? 3.5 : hero.id === 'tiger_warrior' ? 3.2 : hero.id === 'lion_knight' ? 2.4 : 1.8,
        shieldPercent: disableShields ? 0 : (hero.id === 'minotaur' ? 0.12 : 0),
        regenPercent: hero.id === 'lion_knight' ? 0.03 : 0,
        burnPct: 0.16,
        poisonPct: 0.10
    };
}

function simulateCombat(p1, p2, useAlternativeDefFormula = false, disableShields = false) {
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

    // Metrics to track
    let metrics = {
        p1RawDmg: 0,
        p1MitigatedDmg: 0,
        p1ShieldAbsorbed: 0,
        p1HpDmg: 0,
        p1DoTDmg: 0,
        p1Healing: 0,
        
        p2RawDmg: 0,
        p2MitigatedDmg: 0,
        p2ShieldAbsorbed: 0,
        p2HpDmg: 0,
        p2DoTDmg: 0,
        p2Healing: 0
    };

    const applyStatus = (statusEffects, type, duration, value = 0) => {
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
        } else {
            statusEffects.push({ type, duration, value, stacks: 1 });
        }
    };

    const processEffects = (isP1) => {
        let hp = isP1 ? p1HP : p2HP;
        let shield = isP1 ? p1Shield : p2Shield;
        let statusList = isP1 ? p1StatusEffects : p2StatusEffects;
        const maxHp = isP1 ? p1.maxHp : p2.maxHp;

        statusList.forEach(s => {
            if (s.type === 'BURN' || s.type === 'POISON') {
                let tickDamage = s.type === 'BURN' ? s.value : s.value * (s.stacks || 1);
                let dmg = Math.ceil(tickDamage);
                
                if (isP1) metrics.p2DoTDmg += dmg;
                else metrics.p1DoTDmg += dmg;

                if (!disableShields && shield > 0) {
                    if (shield >= dmg) {
                        shield -= dmg;
                        if (isP1) metrics.p2ShieldAbsorbed += dmg;
                        else metrics.p1ShieldAbsorbed += dmg;
                        dmg = 0;
                    } else {
                        if (isP1) metrics.p2ShieldAbsorbed += shield;
                        else metrics.p1ShieldAbsorbed += shield;
                        dmg -= shield;
                        shield = 0;
                    }
                }
                
                if (isP1) metrics.p2HpDmg += dmg;
                else metrics.p1HpDmg += dmg;
                hp = Math.max(0, hp - dmg);
            }
            if (s.type === 'NATURE_REGEN') {
                const regenPercent = isP1 ? p1.regenPercent : p2.regenPercent;
                const heal = Math.ceil(maxHp * regenPercent);
                hp = Math.min(maxHp, hp + heal);
                if (isP1) metrics.p1Healing += heal;
                else metrics.p2Healing += heal;
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

        const hasMarkAtStart = defStatus.some(s => s.type === 'SHADOW_MARK');

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
            isCrit = Math.random() < (att.critChance / 100) || hasMarkAtStart;
            if (isCrit) {
                damage *= att.critDamage;
            }
        }

        let mult = 1.0;
        if (att.id === 'tiger_warrior') {
            mult += attHunterStacks * 0.08;
            if (hasMarkAtStart) {
                const agility = att.agility || 20;
                mult += agility * 0.05;
            }
        }
        damage *= mult;

        if (isP1) metrics.p1RawDmg += damage;
        else metrics.p2RawDmg += damage;

        const effectiveDef = Math.max(0, def.defense - att.penetration);
        const divisor = useAlternativeDefFormula ? 2000 : 200;
        const defenseReduction = effectiveDef / (effectiveDef + divisor);
        
        let mitigatedDmg = Math.ceil(damage * (1 - defenseReduction));
        
        if (isP1) metrics.p1MitigatedDmg += (damage - mitigatedDmg);
        else metrics.p2MitigatedDmg += (damage - mitigatedDmg);

        if (!isSpell) {
            const blockChance = def.defense > 0 ? 0.15 : 0.05;
            if (Math.random() < blockChance) {
                const blocked = Math.ceil(mitigatedDmg * 0.7);
                if (isP1) metrics.p1MitigatedDmg += blocked;
                else metrics.p2MitigatedDmg += blocked;
                mitigatedDmg = Math.max(1, mitigatedDmg - blocked);
            }
        }

        if (def.id === 'tiger_warrior') {
            if (isP1) p2HunterStacks = 0;
            else p1HunterStacks = 0;
        }

        let actualDmgToHP = mitigatedDmg;
        if (!disableShields && defShield > 0) {
            if (defShield >= actualDmgToHP) {
                defShield -= actualDmgToHP;
                if (isP1) metrics.p1ShieldAbsorbed += actualDmgToHP;
                else metrics.p2ShieldAbsorbed += actualDmgToHP;
                actualDmgToHP = 0;
            } else {
                if (isP1) metrics.p1ShieldAbsorbed += defShield;
                else metrics.p2ShieldAbsorbed += defShield;
                actualDmgToHP -= defShield;
                defShield = 0;
            }
        }
        
        if (isP1) metrics.p1HpDmg += actualDmgToHP;
        else metrics.p2HpDmg += actualDmgToHP;

        defHP = Math.max(0, defHP - actualDmgToHP);

        if (att.lifesteal > 0 && mitigatedDmg > 0) {
            const heal = Math.ceil(mitigatedDmg * att.lifesteal);
            attHP = Math.min(att.maxHp, attHP + heal);
            if (isP1) metrics.p1Healing += heal;
            else metrics.p2Healing += heal;
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
                applyStatus(defStatus, 'POISON', 4, att.attack * att.poisonPct);
            } else if (att.id === 'tiger_warrior') {
                applyStatus(defStatus, 'SHADOW_MARK', 2);
            } else if (att.id === 'lion_knight') {
                applyStatus(attStatus, 'NATURE_REGEN', 4);
            } else if (att.id === 'minotaur' && !disableShields) {
                const sVal = Math.round(att.maxHp * att.shieldPercent);
                if (isP1) p1Shield = Math.min(att.maxHp * 0.5, p1Shield + sVal);
                else p2Shield = Math.min(att.maxHp * 0.5, p2Shield + sVal);
            }
        } else {
            if (att.id === 'panda' && Math.random() < 0.42) {
                applyStatus(defStatus, 'BURN', 3, att.attack * att.burnPct);
            } else if (att.id === 'raccoon' && Math.random() < 0.35) {
                applyStatus(defStatus, 'POISON', 4, att.attack * (att.poisonPct - 0.01));
            } else if (att.id === 'tiger_warrior' && Math.random() < 0.35) {
                applyStatus(defStatus, 'SHADOW_MARK', 2);
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
        winner = p1HP >= p2HP ? 1 : 0; // matching production absolute HP win criteria
    }

    return { winner, ticks: tickCount, metrics };
}

function runExperiment(useAlternativeDefFormula, disableShields) {
    const runs = 1000;
    const winrates = {};
    const totalMetrics = {};
    let timeouts = 0;

    HEROES_DB.forEach(h => {
        winrates[h.id] = 0;
        totalMetrics[h.id] = {
            rawDmgDealt: 0,
            mitigatedDmgDealt: 0,
            shieldAbsorbedByEnemy: 0,
            hpDmgDealt: 0,
            dotDmgDealt: 0,
            healingDone: 0
        };
    });

    HEROES_DB.forEach(h1 => {
        HEROES_DB.forEach(h2 => {
            if (h1.id === h2.id) {
                winrates[h1.id] += 0.5;
                return;
            }

            let wins = 0;
            for (let i = 0; i < runs; i++) {
                const h1IsP1 = (i % 2 === 0);
                const attacker = h1IsP1 ? h1 : h2;
                const defender = h1IsP1 ? h2 : h1;

                const p1 = createCombatant(attacker, 80, 'MYTHIC', disableShields);
                const p2 = createCombatant(defender, 80, 'MYTHIC', disableShields);
                const res = simulateCombat(p1, p2, useAlternativeDefFormula, disableShields);

                if (res.ticks >= 10000) {
                    timeouts++;
                }

                if (h1IsP1) {
                    wins += res.winner;
                    
                    // Add metrics for h1 (P1)
                    totalMetrics[h1.id].rawDmgDealt += res.metrics.p1RawDmg;
                    totalMetrics[h1.id].mitigatedDmgDealt += res.metrics.p1MitigatedDmg;
                    totalMetrics[h1.id].shieldAbsorbedByEnemy += res.metrics.p2ShieldAbsorbed;
                    totalMetrics[h1.id].hpDmgDealt += res.metrics.p2HpDmg;
                    totalMetrics[h1.id].dotDmgDealt += res.metrics.p1DoTDmg;
                    totalMetrics[h1.id].healingDone += res.metrics.p1Healing;
                } else {
                    wins += (1 - res.winner);

                    // Add metrics for h1 (P2)
                    totalMetrics[h1.id].rawDmgDealt += res.metrics.p2RawDmg;
                    totalMetrics[h1.id].mitigatedDmgDealt += res.metrics.p2MitigatedDmg;
                    totalMetrics[h1.id].shieldAbsorbedByEnemy += res.metrics.p1ShieldAbsorbed;
                    totalMetrics[h1.id].hpDmgDealt += res.metrics.p1HpDmg;
                    totalMetrics[h1.id].dotDmgDealt += res.metrics.p2DoTDmg;
                    totalMetrics[h1.id].healingDone += res.metrics.p2Healing;
                }
            }
            winrates[h1.id] += wins / runs;
        });
    });

    for (const id of Object.keys(winrates)) {
        winrates[id] /= 5;
        // Average the metrics per fight (since there are 4 matchups * 1000 fights = 4000 fights total per hero)
        const totalFights = 4 * runs;
        totalMetrics[id].rawDmgDealt = Math.round(totalMetrics[id].rawDmgDealt / totalFights);
        totalMetrics[id].mitigatedDmgDealt = Math.round(totalMetrics[id].mitigatedDmgDealt / totalFights);
        totalMetrics[id].shieldAbsorbedByEnemy = Math.round(totalMetrics[id].shieldAbsorbedByEnemy / totalFights);
        totalMetrics[id].hpDmgDealt = Math.round(totalMetrics[id].hpDmgDealt / totalFights);
        totalMetrics[id].dotDmgDealt = Math.round(totalMetrics[id].dotDmgDealt / totalFights);
        totalMetrics[id].healingDone = Math.round(totalMetrics[id].healingDone / totalFights);
    }

    return { winrates, metrics: totalMetrics, timeouts: timeouts / 20 }; // 20 matchups total (5*4)
}

console.log("=== RUNNING EXPERIMENT 1: Baseline (Divisor=200, Shields=Active) ===");
const exp1 = runExperiment(false, false);
console.log("Winrates:", exp1.winrates);
console.log("Timeouts per match:", exp1.timeouts);
console.log("Metrics sample (raccoon):", exp1.metrics.raccoon);
console.log("Metrics sample (minotaur):", exp1.metrics.minotaur);
console.log("Metrics sample (tiger_warrior):", exp1.metrics.tiger_warrior);

console.log("\n=== RUNNING EXPERIMENT 2: New Armor (Divisor=2000, Shields=Active) ===");
const exp2 = runExperiment(true, false);
console.log("Winrates:", exp2.winrates);
console.log("Timeouts per match:", exp2.timeouts);
console.log("Metrics sample (raccoon):", exp2.metrics.raccoon);
console.log("Metrics sample (minotaur):", exp2.metrics.minotaur);
console.log("Metrics sample (tiger_warrior):", exp2.metrics.tiger_warrior);

console.log("\n=== RUNNING EXPERIMENT 3: No-Shield Mode (Divisor=200, Shields=Disabled) ===");
const exp3 = runExperiment(false, true);
console.log("Winrates:", exp3.winrates);
console.log("Timeouts per match:", exp3.timeouts);
console.log("Metrics sample (raccoon):", exp3.metrics.raccoon);
console.log("Metrics sample (minotaur):", exp3.metrics.minotaur);
console.log("Metrics sample (tiger_warrior):", exp3.metrics.tiger_warrior);

console.log("\n=== RUNNING EXPERIMENT 4: Balanced vacuum (Divisor=2000, Shields=Disabled) ===");
const exp4 = runExperiment(true, true);
console.log("Winrates:", exp4.winrates);
console.log("Timeouts per match:", exp4.timeouts);
console.log("Metrics sample (raccoon):", exp4.metrics.raccoon);
console.log("Metrics sample (minotaur):", exp4.metrics.minotaur);
console.log("Metrics sample (tiger_warrior):", exp4.metrics.tiger_warrior);
