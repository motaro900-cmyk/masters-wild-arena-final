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

function createCombatant(hero, level, gearRarity, overrideStats = null) {
    const levelMultiplier = getLevelMultiplier(level);
    const gear = GEAR_DB[gearRarity] || GEAR_DB.MYTHIC;

    const stamina = overrideStats ? overrideStats.stamina : hero.stats.stamina;
    const strength = overrideStats ? overrideStats.strength : hero.stats.strength;
    const agility = overrideStats ? overrideStats.agility : hero.stats.agility;

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
        activeDmg: overrideStats && overrideStats.activeDmg !== undefined ? overrideStats.activeDmg : (hero.id === 'panda' ? 2.5 : hero.id === 'raccoon' ? 3.5 : hero.id === 'tiger_warrior' ? 3.2 : hero.id === 'lion_knight' ? 2.4 : 1.8),
        shieldPercent: overrideStats && overrideStats.shieldPercent !== undefined ? overrideStats.shieldPercent : (hero.id === 'minotaur' ? 0.12 : 0),
        regenPercent: overrideStats && overrideStats.regenPercent !== undefined ? overrideStats.regenPercent : (hero.id === 'lion_knight' ? 0.03 : 0),
        burnPct: overrideStats && overrideStats.burnPct !== undefined ? overrideStats.burnPct : 0.16,
        poisonPct: overrideStats && overrideStats.poisonPct !== undefined ? overrideStats.poisonPct : 0.10
    };
}

function simulateCombat(p1, p2, useAlternativeDefFormula = false) {
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
                const heal = Math.ceil(maxHp * regenPercent);
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

        const effectiveDef = Math.max(0, def.defense - att.penetration);
        const divisor = useAlternativeDefFormula ? 2000 : 200;
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
            if (isP1) p2StatusEffects = p2StatusEffects.filter(s => s.type !== 'SHADOW_MARK');
            else p1StatusEffects = p1StatusEffects.filter(s => s.type !== 'SHADOW_MARK');
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
            } else if (att.id === 'minotaur') {
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

    if (p1HP <= 0 && p2HP <= 0) return 0.5;
    if (p1HP <= 0) return 0;
    if (p2HP <= 0) return 1;
    return (p1HP / p1.maxHp) >= (p2HP / p2.maxHp) ? 1 : 0;
}

function evaluateConfig(config, useAlternativeDefFormula) {
    const runs = 100;
    const winrates = {};
    HEROES_DB.forEach(h => {
        winrates[h.id] = 0;
    });

    HEROES_DB.forEach(h1 => {
        HEROES_DB.forEach(h2 => {
            if (h1.id === h2.id) {
                winrates[h1.id] += 0.5;
                return;
            }
            let wins = 0;
            for (let i = 0; i < runs; i++) {
                const p1 = createCombatant(h1, 80, 'MYTHIC', config[h1.id]);
                const p2 = createCombatant(h2, 80, 'MYTHIC', config[h2.id]);
                const res = simulateCombat(p1, p2, useAlternativeDefFormula);
                wins += res;
            }
            winrates[h1.id] += wins / runs;
        });
    });

    for (const id of Object.keys(winrates)) {
        winrates[id] /= 5;
    }
    return winrates;
}

let currentStats = {
    panda: { stamina: 25, strength: 19, agility: 12, activeDmg: 2.5, burnPct: 0.16 },
    raccoon: { stamina: 18.5, strength: 14, agility: 24, activeDmg: 3.5, poisonPct: 0.10 },
    minotaur: { stamina: 24.5, strength: 23.5, agility: 8, shieldPercent: 0.12, activeDmg: 1.8 },
    tiger_warrior: { stamina: 21, strength: 16.5, agility: 20, activeDmg: 3.2 },
    lion_knight: { stamina: 21, strength: 19, agility: 16, regenPercent: 0.03, activeDmg: 2.4 }
};

console.log("Starting multi-parameter optimization...");
for (let iter = 1; iter <= 20; iter++) {
    const winrates = evaluateConfig(currentStats, true);
    console.log(`Step ${iter} Winrates:`, 
        Object.entries(winrates).map(([id, wr]) => `${id}: ${(wr*100).toFixed(1)}%`).join(', ')
    );

    let allBalanced = true;
    for (const id of Object.keys(currentStats)) {
        const wr = winrates[id];
        if (wr > 0.56) {
            allBalanced = false;
            currentStats[id].strength = Math.max(10, currentStats[id].strength - 0.5);
            currentStats[id].agility = Math.max(10, currentStats[id].agility - 0.5);
            currentStats[id].activeDmg = Math.max(1.0, currentStats[id].activeDmg - 0.1);
            if (id === 'minotaur') {
                currentStats.minotaur.shieldPercent = Math.max(0.04, currentStats.minotaur.shieldPercent - 0.01);
            } else if (id === 'lion_knight') {
                currentStats.lion_knight.regenPercent = Math.max(0.01, currentStats.lion_knight.regenPercent - 0.005);
            } else if (id === 'raccoon') {
                currentStats.raccoon.poisonPct = Math.max(0.04, currentStats.raccoon.poisonPct - 0.01);
            } else if (id === 'panda') {
                currentStats.panda.burnPct = Math.max(0.06, currentStats.panda.burnPct - 0.01);
            }
        } else if (wr < 0.44) {
            allBalanced = false;
            currentStats[id].strength = Math.min(30, currentStats[id].strength + 0.5);
            currentStats[id].agility = Math.min(30, currentStats[id].agility + 0.5);
            currentStats[id].activeDmg = Math.min(5.0, currentStats[id].activeDmg + 0.1);
            if (id === 'minotaur') {
                currentStats.minotaur.shieldPercent = Math.min(0.20, currentStats.minotaur.shieldPercent + 0.01);
            } else if (id === 'lion_knight') {
                currentStats.lion_knight.regenPercent = Math.min(0.08, currentStats.lion_knight.regenPercent + 0.005);
            } else if (id === 'raccoon') {
                currentStats.raccoon.poisonPct = Math.min(0.20, currentStats.raccoon.poisonPct + 0.01);
            } else if (id === 'panda') {
                currentStats.panda.burnPct = Math.min(0.35, currentStats.panda.burnPct + 0.01);
            }
        }
    }
    if (allBalanced) {
        console.log("Balanced system achieved!");
        console.log("Final Stats:", JSON.stringify(currentStats));
        break;
    }
}
