export const MAX_HERO_LEVEL = 10;

/** Stat growth per level (2%) */
export const STAT_GROWTH_PER_LEVEL = 0.02;

/**
 * Calculates experience points needed to level up from a specific level.
 */
export const getHeroExpNeeded = (level: number): number => {
    if (level <= 1) return 100;
    if (level === 2) return 200;
    return (level - 1) * 200;
};
