import { MAX_HERO_LEVEL, getHeroExpNeeded, LEVEL_MILESTONES } from './HeroLevelConfig';
import { getLevelMultiplier } from './HeroLevelCalculator';
import { HeroProgress, LevelUpStatsDelta } from './HeroLevelTypes';

export class HeroLevelService {
    /**
     * Simulates or computes adding experience to a hero.
     * Returns the updated progress and any LevelUpStatsDelta if a level up occurred.
     */
    public static addExp(
        heroId: string,
        currentProgress: HeroProgress,
        xpAmount: number,
        baseStats: { stamina: number; strength: number },
    ): { updatedProgress: HeroProgress; delta: LevelUpStatsDelta | null } {
        let level = currentProgress.level;
        let exp = currentProgress.exp + xpAmount;

        if (level >= MAX_HERO_LEVEL) {
            return {
                updatedProgress: { ...currentProgress, exp: 0 },
                delta: null,
            };
        }

        const oldLevel = level;
        let leveledUp = false;

        while (level < MAX_HERO_LEVEL) {
            const needed = getHeroExpNeeded(level);
            if (exp >= needed) {
                exp -= needed;
                level += 1;
                leveledUp = true;
            } else {
                break;
            }
        }

        const updatedProgress: HeroProgress = {
            ...currentProgress,
            level,
            exp: level >= MAX_HERO_LEVEL ? 0 : exp,
        };

        let delta: LevelUpStatsDelta | null = null;
        if (leveledUp) {
            // Calculate HP and ATK before and after to get the exact stats gain
            const oldMult = getLevelMultiplier(oldLevel);
            const newMult = getLevelMultiplier(level);

            const oldHp = Math.round(baseStats.stamina * 10 * oldMult);
            const newHp = Math.round(baseStats.stamina * 10 * newMult);

            const oldAtk = Math.round(baseStats.strength * 2 * oldMult);
            const newAtk = Math.round(baseStats.strength * 2 * newMult);

            // Determine if a milestone is crossed (talent tier, elite skin, master title)
            // Tier 1 is always unlocked.
            // Tier 2: Level 10 — Talent Slot 2
            // Tier 3: Level 20 — Talent Slot 3 (Ultimate)
            // Tier 4: Level 40 — Legendary Passive
            // Tier 5: Level 60 — Elite Skin unlock
            // Tier 6: Level 80 — "Master of the Wild" title + reward
            let unlockedTier: number | null = null;
            for (let i = LEVEL_MILESTONES.length - 1; i >= 0; i--) {
                const milestone = LEVEL_MILESTONES[i];
                if (oldLevel < milestone && level >= milestone) {
                    unlockedTier = i + 2; // tier index: milestone[0]=10 -> tier 2, etc.
                    break;
                }
            }

            delta = {
                heroId,
                oldLevel,
                newLevel: level,
                hpDelta: newHp - oldHp,
                atkDelta: newAtk - oldAtk,
                unlockedTier,
            };
        }

        return {
            updatedProgress,
            delta,
        };
    }
}
