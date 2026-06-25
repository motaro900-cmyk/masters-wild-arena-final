// Self-contained script to simulate combat.

const HEROES_DB = [
    { id: 'panda', name: 'Фэн Лун', stats: { strength: 18, agility: 27, stamina: 9, intelligence: 12 }, role: 'WARRIOR' },
    { id: 'raccoon', name: 'Рикки', stats: { strength: 15, agility: 23, stamina: 16, intelligence: 12 }, role: 'ASSASSIN' },
    { id: 'minotaur', name: 'Громм', stats: { strength: 21, agility: 6, stamina: 29, intelligence: 10 }, role: 'TANK' },
    { id: 'tiger_warrior', name: 'Варкан', stats: { strength: 16, agility: 24, stamina: 16, intelligence: 10 }, role: 'ASSASSIN' },
    { id: 'lion_knight', name: 'Аурелиус', stats: { strength: 19, agility: 6, stamina: 31, intelligence: 10 }, role: 'WARRIOR' }
];

const getLevelMultiplier = (level) => 1.0;

function createCombatant(hero, level, overrideStats = null) {
    const levelMultiplier = 1.0;
    const stats = overrideStats || hero.stats;
    const strength = stats.strength;
    const agility = stats.agility;
    const stamina = stats.stamina;

    return {
        id: hero.id,
        name: hero.name,
        hp: Math.round(stamina * 10 * levelMultiplier),
        maxHP: Math.round(stamina * 10 * levelMultiplier),
        attack: Math.round(strength * 2 * levelMultiplier),
        defense: Math.round(stamina * 0.5 * levelMultiplier),
        speed: 1 + agility * 0.05,
        critChance: agility * 0.5,
        evasion: agility * 0.2,
        resilience: stamina * 0.1,
        lifesteal: 0,
        penetration: 0,
        accuracy: 100,
        critDamage: 1.5,
        mana: 0,
        statusEffects: [],
        hunterStacks: 0,
        attackCounter: 0,
        activeDmg: hero.id === 'panda' ? 2.5 : hero.id === 'raccoon' ? 3.5 : hero.id === 'tiger_warrior' ? 3.25 : hero.id === 'lion_knight' ? 2.4 : 1.8,
        shieldPercent: hero.id === 'minotaur' ? 0.054 : 0,
        regenPercent: hero.id === 'lion_knight' ? 0.04 : 0,
        burnPct: hero.id === 'panda' ? 0.12 : 0.10,
        poisonPct: hero.id === 'raccoon' ? 0.10 : 0
    };
}

function simulateCombat(p1, p2) {
    let p1HP = p1.hp;
    let p2HP = p2.hp;
    let p1Ticks = 0;
    let p2Ticks = 0;
    const ATB_THRESHOLD = 100;
    let tickCount = 0;
    let p1HunterStacks = 0;
    let p2HunterStacks = 0;
    
    let p1Status = [];
    let p2Status = [];

    const statsP1 = p1;
    const statsP2 = p2;
    const pDivisor = 200;
    const eDivisor = 200;

    function applyStatus(statusList, type, duration, value = 0, delay = 0) {
        statusList.push({ type, duration, value, delay });
    }

    function processEffects(isP1) {
        const statusList = isP1 ? p1Status : p2Status;
        const targetDefense = isP1 ? statsP1.defense : statsP2.defense;
        for (let i = statusList.length - 1; i >= 0; i--) {
            const s = statusList[i];
            if (s.delay > 0) {
                s.delay--;
                continue;
            }
            if (s.type === 'POISON' || s.type === 'BURN') {
                const defMultiplier = s.type === 'POISON' ? 0.5 : 0.25;
                const effectiveDef = targetDefense * defMultiplier;
                const divisor = 200;
                const mitigation = effectiveDef / (effectiveDef + divisor);
                let dmg = Math.max(1, Math.ceil(s.value * (1 - mitigation)));
                
                if (isP1) p1HP -= dmg;
                else p2HP -= dmg;
            }
            if (s.type === 'NATURE_REGEN') {
                const baseHeal = Math.ceil(statsP1.hp * 0.04);
                if (isP1) p1HP = Math.min(statsP1.maxHP, p1HP + baseHeal);
                else p2HP = Math.min(statsP2.maxHP, p2HP + baseHeal);
            }
        }
    }

    function decrementStatusDurations(isP1) {
        const statusList = isP1 ? p1Status : p2Status;
        for (let i = statusList.length - 1; i >= 0; i--) {
            const s = statusList[i];
            if (s.delay > 0) continue;
            s.duration--;
            if (s.duration <= 0) {
                statusList.splice(i, 1);
            }
        }
    }

    function executeAttack(isP1) {
        const att = isP1 ? statsP1 : statsP2;
        const def = isP1 ? statsP2 : statsP1;
        let p1HP_before = p1HP;
        let p2HP_before = p2HP;
        const defStatus = isP1 ? p2Status : p1Status;
        const attHunterStacks = isP1 ? p1HunterStacks : p2HunterStacks;

        const isShadowStep = (att.id === 'raccoon' && att.attackCounter % 3 === 0 && att.attackCounter > 0);
        const extraDodge = isShadowStep ? 0.15 : 0;
        const effectiveEvasion = Math.max(0, def.evasion - Math.max(0, att.accuracy - 100) * 0.005);
        const dodgeChance = Math.min(0.6, (effectiveEvasion / 100) + extraDodge);

        if (Math.random() < dodgeChance) {
            att.attackCounter++;
            return;
        }

        const hasMarkAtStart = defStatus.some(s => s.type === 'SHADOW_MARK' && s.delay === 0);

        let damage = att.attack;
        let isSpell = false;

        if (att.mana >= 100) {
            att.mana = 0;
            damage *= att.activeDmg;
            isSpell = true;

            if (att.id === 'panda') {
                applyStatus(defStatus, 'BURN', 3, att.attack * att.burnPct);
            } else if (att.id === 'raccoon') {
                const poisonVal = Math.max(15, att.attack * att.poisonPct);
                applyStatus(defStatus, 'POISON', 4, poisonVal);
            } else if (att.id === 'tiger_warrior') {
                applyStatus(defStatus, 'SHADOW_MARK', 2, 0, 1);
            } else if (att.id === 'lion_knight') {
                applyStatus(isP1 ? p1Status : p2Status, 'NATURE_REGEN', 3);
            } else if (att.id === 'minotaur') {
                const shieldVal = Math.ceil(att.maxHP * att.shieldPercent);
                if (isP1) p1HP = Math.min(statsP1.maxHP, p1HP + shieldVal);
                else p2HP = Math.min(statsP2.maxHP, p2HP + shieldVal);
            }
        } else {
            att.mana += 25;
            if (att.id === 'panda' && Math.random() < 0.35) {
                applyStatus(defStatus, 'BURN', 3, att.attack * att.burnPct);
            } else if (att.id === 'raccoon' && Math.random() < 0.35) {
                const poisonVal = Math.max(15, att.attack * att.poisonPct);
                applyStatus(defStatus, 'POISON', 4, poisonVal);
            } else if (att.id === 'tiger_warrior' && Math.random() < 0.35) {
                applyStatus(defStatus, 'SHADOW_MARK', 2, 0, 1);
            }
        }

        let isCrit = Math.random() < (att.critChance / 100);
        if (isCrit) {
            damage *= att.critDamage;
        }

        let mult = 1.0;
        if (att.id === 'tiger_warrior') {
            mult += attHunterStacks * 0.08;
            if (hasMarkAtStart) {
                mult += 0.2; // 1.2x modifier without gear
            }
        }
        damage *= mult;

        const effectiveDef = def.defense;
        const divisor = isP1 ? eDivisor : pDivisor;
        const mitigation = effectiveDef / (effectiveDef + divisor);
        const finalDmg = Math.max(1, Math.ceil(damage * (1 - mitigation)));

        if (isP1) {
            p2HP -= finalDmg;
        } else {
            p1HP -= finalDmg;
        }

        if (def.id === 'tiger_warrior') {
            if (isP1) p2HunterStacks = 0;
            else p1HunterStacks = 0;
        }

        if (hasMarkAtStart && att.id === 'tiger_warrior') {
            const idx = defStatus.findIndex(s => s.type === 'SHADOW_MARK' && s.delay === 0);
            if (idx !== -1) defStatus.splice(idx, 1);
        }

        att.attackCounter++;
    }

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

    return p1HP > 0;
}

// Loop through possible raccoon stats where strength + stamina = 29, agility = 25
const tiger = HEROES_DB.find(h => h.id === 'tiger_warrior');
const raccoon = HEROES_DB.find(h => h.id === 'raccoon');

console.log("=== SCANNING RACCOON STATS ===");
for (let str = 1; str <= 28; str++) {
    const sta = 29 - str;
    const racStats = { strength: str, agility: 25, stamina: sta };
    
    let racWins = 0;
    const runs = 1000;
    for (let r = 0; r < runs; r++) {
        const h1IsP1 = (r % 2 === 0);
        const p1 = h1IsP1 ? createCombatant(raccoon, 1, racStats) : createCombatant(tiger, 1);
        const p2 = h1IsP1 ? createCombatant(tiger, 1) : createCombatant(raccoon, 1, racStats);
        const p1Wins = simulateCombat(p1, p2);
        
        if (h1IsP1) {
            if (p1Wins) racWins++;
        } else {
            if (!p1Wins) racWins++;
        }
    }
    const racWR = racWins / runs;
    const tigerWR = 1 - racWR;
    console.log(`strength: ${str}, agility: 25, stamina: ${sta} | Raccoon WR: ${(racWR*100).toFixed(1)}% | Varkan WR: ${(tigerWR*100).toFixed(1)}%`);
}
