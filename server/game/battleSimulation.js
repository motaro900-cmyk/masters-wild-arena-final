/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: Deterministic, server-authoritative combat simulator for Active Time Battle (ATB).
 *           Uses seeded PRNG (Mulberry32) to ensure 100% reproducible and verifiable battle outcomes.
 */

/**
 * Seeded PRNG (Mulberry32) for deterministic combat
 */
export function createSeededRNG(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Computes base stats of a hero based on level and equipment
 */
export function calculateHeroCombatStats(heroConfig, heroLevel = 1, equipment = {}, inventory = []) {
    const baseAttack = (heroConfig?.stats?.attack || 25) + heroLevel * 3;
    const baseDefense = (heroConfig?.stats?.defense || 15) + heroLevel * 2;
    const baseHP = (heroConfig?.stats?.hp || 200) + heroLevel * 20;
    const baseSpeed = heroConfig?.stats?.speed || 10;
    const baseCrit = heroConfig?.stats?.critChance || 0.05;

    let bonusAttack = 0;
    let bonusDefense = 0;
    let bonusHP = 0;

    // Sum equipment stats
    for (const [slot, instanceId] of Object.entries(equipment)) {
        if (!instanceId) continue;
        const item = inventory.find((i) => i.instanceId === instanceId || i.id === instanceId);
        if (item) {
            const itemLvl = item.level || 1;
            if (slot === 'WEAPONS') bonusAttack += 15 + itemLvl * 5;
            if (slot === 'HELMETS' || slot === 'ARMOR' || slot === 'SHIELDS') {
                bonusDefense += 10 + itemLvl * 3;
                bonusHP += 30 + itemLvl * 10;
            }
        }
    }

    return {
        attack: baseAttack + bonusAttack,
        defense: baseDefense + bonusDefense,
        hp: baseHP + bonusHP,
        maxHp: baseHP + bonusHP,
        speed: baseSpeed,
        critChance: baseCrit,
        avgItemLevel: 1,
    };
}

/**
 * Runs a deterministic turn-by-turn ATB battle simulation
 *
 * @param {object} playerStats - Calculated player combat stats
 * @param {object} enemyStats - Opponent combat stats
 * @param {number} seed - Integer seed for deterministic RNG
 * @returns {{ winner: 'player'|'enemy', turns: number, playerHpRemaining: number, enemyHpRemaining: number, damageDealt: number, damageTaken: number }}
 */
export function simulateDeterministicBattle(playerStats, enemyStats, seed = 12345) {
    const rng = createSeededRNG(seed);

    let pHP = playerStats.hp;
    let eHP = enemyStats.hp;
    const pDivisor = 200;
    const eDivisor = 200;

    const ATB_THRESHOLD = 1000;
    let playerTicks = 0;
    let enemyTicks = 0;
    let totalBattleTicks = 0;
    let turns = 0;
    let damageDealt = 0;
    let damageTaken = 0;

    const maxTicks = 8000;

    while (pHP > 0 && eHP > 0 && totalBattleTicks < maxTicks) {
        while (playerTicks < ATB_THRESHOLD && enemyTicks < ATB_THRESHOLD && totalBattleTicks < maxTicks) {
            playerTicks += Math.max(1, playerStats.speed || 10);
            enemyTicks += Math.max(1, enemyStats.speed || 10);
            totalBattleTicks++;
        }

        // Player turn
        if (playerTicks >= ATB_THRESHOLD) {
            playerTicks -= ATB_THRESHOLD;
            turns++;

            const isCrit = rng() < (playerStats.critChance || 0.05);
            const critMult = isCrit ? 1.5 : 1.0;
            const defMitigation = enemyStats.defense / (enemyStats.defense + eDivisor);
            const rawDmg = Math.max(1, Math.round(playerStats.attack * critMult * (1 - defMitigation)));
            const variance = 0.9 + rng() * 0.2; // 0.9 to 1.1
            const dmg = Math.max(1, Math.round(rawDmg * variance));

            eHP -= dmg;
            damageDealt += dmg;
            if (eHP <= 0) break;
        }

        // Enemy turn
        if (enemyTicks >= ATB_THRESHOLD) {
            enemyTicks -= ATB_THRESHOLD;
            turns++;

            const isCrit = rng() < (enemyStats.critChance || 0.05);
            const critMult = isCrit ? 1.5 : 1.0;
            const defMitigation = playerStats.defense / (playerStats.defense + pDivisor);
            const rawDmg = Math.max(1, Math.round(enemyStats.attack * critMult * (1 - defMitigation)));
            const variance = 0.9 + rng() * 0.2;
            const dmg = Math.max(1, Math.round(rawDmg * variance));

            pHP -= dmg;
            damageTaken += dmg;
            if (pHP <= 0) break;
        }
    }

    const winner = pHP > 0 && eHP <= 0 ? 'player' : 'enemy';

    return {
        winner,
        turns,
        playerHpRemaining: Math.max(0, pHP),
        enemyHpRemaining: Math.max(0, eHP),
        damageDealt,
        damageTaken,
    };
}
