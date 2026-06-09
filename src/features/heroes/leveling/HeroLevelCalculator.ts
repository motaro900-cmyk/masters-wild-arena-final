
/**
 * Calculates the stat multiplier based on the hero level.
 * @param level Hero level
 */
export const getLevelMultiplier = (level: number): number => {
    let mult = 1.0;
    for (let i = 2; i <= level; i++) {
        if (i <= 20) {
            mult += 0.03;
        } else if (i <= 40) {
            mult += 0.025;
        } else if (i <= 60) {
            mult += 0.02;
        } else {
            mult += 0.015;
        }
    }
    return Math.round(mult * 1000) / 1000;
};
