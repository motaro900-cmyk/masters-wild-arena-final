import { MAX_HERO_LEVEL, getHeroExpNeeded, LEVEL_MILESTONES } from './HeroLevelConfig';
import { getLevelMultiplier } from './HeroLevelCalculator';
import { HeroProgress, LevelUpStatsDelta } from './HeroLevelTypes';

export class HeroLevelService {
    /**
     * Вычисляет прибавку опыта и уровень героя на основе 5 базовых статов.
     */
    public static addExp(
        heroId: string,
        currentProgress: HeroProgress,
        xpAmount: number,
        baseStats: { hp: number; attack: number },
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
            // Вычисляем разницу здоровья и атаки до и после повышения уровня
            const oldMult = getLevelMultiplier(oldLevel);
            const newMult = getLevelMultiplier(level);

            const oldHp = Math.round(baseStats.hp * oldMult);
            const newHp = Math.round(baseStats.hp * newMult);

            const oldAtk = Math.round(baseStats.attack * oldMult);
            const newAtk = Math.round(baseStats.attack * newMult);

            let unlockedTier: number | null = null;
            for (let i = LEVEL_MILESTONES.length - 1; i >= 0; i--) {
                const milestone = LEVEL_MILESTONES[i];
                if (oldLevel < milestone && level >= milestone) {
                    unlockedTier = i + 2;
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
