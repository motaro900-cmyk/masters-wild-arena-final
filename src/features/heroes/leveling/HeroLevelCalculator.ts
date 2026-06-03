import { STAT_GROWTH_PER_LEVEL } from './HeroLevelConfig';

/**
 * Calculates the stat multiplier based on the hero level.
 * @param level Hero level
 */
export const getLevelMultiplier = (level: number): number => {
    return 1 + (level - 1) * STAT_GROWTH_PER_LEVEL;
};
