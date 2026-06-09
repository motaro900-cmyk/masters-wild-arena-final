export const MAX_HERO_LEVEL = 80;

/** Stat growth per level (2%) */
export const STAT_GROWTH_PER_LEVEL = 0.02;

/**
 * Milestone levels that unlock rewards or abilities.
 * - Level 10: Unlock Talent Tier 2
 * - Level 20: Unlock Talent Tier 3 (Ultimate)
 * - Level 40: Unlock Talent Tier 4 (Legendary Passive)
 * - Level 60: Unlock Elite Hero Skin
 * - Level 80: Unlock "Master of the Wild" title + bonus reward
 */
export const LEVEL_MILESTONES: Readonly<number[]> = [10, 20, 40, 60, 80];

/**
 * Non-linear XP curve for the 80-level system.
 * - Levels 1–20:  100 → 1 000 XP  (fast early progression, ~2 battles/level)
 * - Levels 21–40: 1 200 → 4 500 XP (medium grind)
 * - Levels 41–60: 5 000 → 9 000 XP (significant grind)
 * - Levels 61–79: 10 000 → 14 000 XP (endgame, ~4-5 weeks at 20 battles/day)
 *
 * At 250 XP/win and 80 XP/loss the full journey to level 80 takes roughly
 * 1 600–2 000 ranked battles, assuming ~70% win-rate.
 */
export const getHeroExpNeeded = (level: number): number => {
    if (level <= 1)  return 100;
    if (level <= 5)  return Math.round(100 + (level - 1) * 100);   // 100 → 500
    if (level <= 10) return Math.round(300 + (level - 5) * 100);   // 400 → 800
    if (level <= 20) return Math.round(800 + (level - 10) * 60);   // 860 → 1 400
    if (level <= 30) return Math.round(1400 + (level - 20) * 200); // 1 600 → 3 400
    if (level <= 40) return Math.round(3400 + (level - 30) * 300); // 3 700 → 6 400
    if (level <= 50) return Math.round(6400 + (level - 40) * 350); // 6 750 → 10 000
    if (level <= 60) return Math.round(10000 + (level - 50) * 400);// 10 400 → 14 000
    if (level <= 70) return Math.round(14000 + (level - 60) * 400);// 14 400 → 18 000
    return Math.round(18000 + (level - 70) * 400);                 // 18 400 → 21 600 (lvl 79)
};
