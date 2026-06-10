// find_pair.js
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

function createCombatant(heroId, role, stats, level) {
    const levelMultiplier = getLevelMultiplier(level);
    const gear = NO_GEAR;

    const stamina = stats.stamina;
    const strength = stats.strength;
    const agility = stats.agility;

    const avgItemLevel = 1;

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
        name: heroId,
        role: role,
        level,
        avgItemLevel,
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
        activeDmg: heroId === 'panda' ? 2.5 : heroId === 'raccoon' ? 3.5 : heroId === 'tiger_warrior' ? 4.0 : heroId === 'lion_knight' ? 2.4 : 1.8,
        shieldPercent: heroId === 'minotaur' ? 0.054 : 0, 
        regenPercent: heroId === 'lion_knight' ? 0.04 : 0, 
        burnPct: heroId === 'panda' ? 0.12 : 0.10, 
        poisonPct: heroId === 'raccoon' ? 0.10 : 0 
    };
}

function simulateCombat(p1, p2) {
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

    // Scale factors:
    const p1Factor = 1;
    const p2Factor = 1;

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
        const factor = isP1 ? p1Factor : p2Factor;

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
                const baseRegen = isP1 ? p1.regenPercent : p2.regenPercent;
                const regenPercent = baseRegen * factor;
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
        const factor = isP1 ? p1Factor : p2Factor;

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
                mult += 0.7 * factor;
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
                const dmg = Math.max(15, att.attack * att.poisonPct) * factor;
                applyStatus(defStatus, 'POISON', 4, dmg);
            } else if (att.id === 'tiger_warrior') {
                applyStatus(defStatus, 'SHADOW_MARK', 2, 0, 1);
            } else if (att.id === 'lion_knight') {
                applyStatus(attStatus, 'NATURE_REGEN', 4);
            } else if (att.id === 'minotaur') {
                const sVal = Math.round(att.maxHp * att.shieldPercent * factor);
                if (isP1) p1Shield = Math.min(att.maxHp * 0.5, p1Shield + sVal);
                else p2Shield = Math.min(att.maxHp * 0.5, p2Shield + sVal);
            }
        } else {
            if (att.id === 'panda' && Math.random() < 0.42) {
                applyStatus(defStatus, 'BURN', 3, att.attack * att.burnPct * factor);
            } else if (att.id === 'raccoon' && Math.random() < 0.35) {
                const dmg = Math.max(15, att.attack * (att.poisonPct - 0.01)) * factor;
                applyStatus(defStatus, 'POISON', 4, dmg);
            } else if (att.id === 'tiger_warrior' && Math.random() < 0.35) {
                applyStatus(defStatus, 'SHADOW_MARK', 2, 0, 1);
            } else if (att.id === 'lion_knight' && Math.random() < 0.25) {
                applyStatus(defStatus, 'BURN', 2, att.attack * 0.1 * factor);
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

    return winner;
}

// Other heroes (using their balanced stats)
const HEROES_DB = {
    panda: { id: 'panda', role: 'WARRIOR', stats: { strength: 18, agility: 27, stamina: 9 } },
    minotaur: { id: 'minotaur', role: 'TANK', stats: { strength: 21, agility: 6, stamina: 29 } },
    lion_knight: { id: 'lion_knight', role: 'WARRIOR', stats: { strength: 19, agility: 6, stamina: 31 } }
};

console.log("Searching for pairs...");
for (let racStr = 1; racStr <= 28; racStr++) {
    const racSta = 29 - racStr;
    const racStats = { strength: racStr, agility: 25, stamina: racSta };

    for (let tigStr = 10; tigStr <= 25; tigStr++) {
        const tigSta = 32 - tigStr;
        const tigStats = { strength: tigStr, agility: 24, stamina: tigSta };

        // Test raccoon vs tiger_warrior
        let racWins = 0;
        const runs = 500;
        for (let r = 0; r < runs; r++) {
            const h1IsP1 = (r % 2 === 0);
            const p1 = h1IsP1 ? createCombatant('raccoon', 'ASSASSIN', racStats, 1) : createCombatant('tiger_warrior', 'ASSASSIN', tigStats, 1);
            const p2 = h1IsP1 ? createCombatant('tiger_warrior', 'ASSASSIN', tigStats, 1) : createCombatant('raccoon', 'ASSASSIN', racStats, 1);
            const win = simulateCombat(p1, p2);
            if (h1IsP1) racWins += win;
            else racWins += (1 - win);
        }
        const racVsTigWR = racWins / runs;
        
        // If tiger WR is between 60% and 70%
        const tigWR_vs_rac = 1 - racVsTigWR;
        if (tigWR_vs_rac >= 0.60 && tigWR_vs_rac <= 0.70) {
            // Check raccoon overall winrate
            // We need raccoon vs other 3 heroes
            let totalRacWR = racVsTigWR;
            
            for (const otherId in HEROES_DB) {
                const other = HEROES_DB[otherId];
                let otherWins = 0;
                for (let r = 0; r < runs; r++) {
                    const h1IsP1 = (r % 2 === 0);
                    const p1 = h1IsP1 ? createCombatant('raccoon', 'ASSASSIN', racStats, 1) : createCombatant(other.id, other.role, other.stats, 1);
                    const p2 = h1IsP1 ? createCombatant(other.id, other.role, other.stats, 1) : createCombatant('raccoon', 'ASSASSIN', racStats, 1);
                    const win = simulateCombat(p1, p2);
                    if (h1IsP1) otherWins += win;
                    else otherWins += (1 - win);
                }
                totalRacWR += (otherWins / runs);
            }
            const racOverall = (totalRacWR + 0.5) / 5; // adding 0.5 for mirror match
            
            if (racOverall >= 0.49 && racOverall <= 0.53) {
                // Check tiger overall winrate
                let totalTigWR = (1 - racVsTigWR);
                for (const otherId in HEROES_DB) {
                    const other = HEROES_DB[otherId];
                    let otherWins = 0;
                    for (let r = 0; r < runs; r++) {
                        const h1IsP1 = (r % 2 === 0);
                        const p1 = h1IsP1 ? createCombatant('tiger_warrior', 'ASSASSIN', tigStats, 1) : createCombatant(other.id, other.role, other.stats, 1);
                        const p2 = h1IsP1 ? createCombatant(other.id, other.role, other.stats, 1) : createCombatant('tiger_warrior', 'ASSASSIN', tigStats, 1);
                        const win = simulateCombat(p1, p2);
                        if (h1IsP1) otherWins += win;
                        else otherWins += (1 - win);
                    }
                    totalTigWR += (otherWins / runs);
                }
                const tigOverall = (totalTigWR + 0.5) / 5;
                
                console.log(`FOUND! Raccoon: str=${racStr}, sta=${racSta} (Overall WR: ${(racOverall*100).toFixed(1)}%) | Tiger: str=${tigStr}, sta=${tigSta} (Overall WR: ${(tigOverall*100).toFixed(1)}%) | Varkan vs Rikki: ${(tigWR_vs_rac*100).toFixed(1)}%`);
            }
        }
    }
}
console.log("Done searching.");
