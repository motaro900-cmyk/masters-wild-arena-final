import { ITEMS_DATABASE, calculateItemPower } from '../../../../../game/configs/ItemsConfig';

/**
 * Рассчитывает суммарную боевую мощь по словарю экипировки { слот: itemId }.
 */
export function calculateTotalPower(equipment: Record<string, string | null | undefined>): number {
    let total = 0;
    Object.values(equipment).forEach((itemId: any) => {
        if (!itemId) return;
        let templateId = itemId;
        if (!ITEMS_DATABASE[itemId]) {
            const match = Object.keys(ITEMS_DATABASE)
                .filter((key) => itemId.startsWith(key + '_'))
                .sort((a, b) => b.length - a.length)[0];
            templateId = match || itemId;
        }
        const item = (ITEMS_DATABASE as any)[templateId];
        if (item) total += calculateItemPower(item);
    });
    return total;
}

/**
 * Рассчитывает строку диапазона золота, опыт и трофеи за победу
 * на основании уровня игрока, флага premium и разницы рейтингов.
 */
export function calculateWinRewards(
    playerLevel: number,
    isPremium: boolean,
    playerRating: number,
    _opponentRating: number,
    winStreak?: number,
): { goldRange: string; xp: number; trophies: string } {
    const pLevel = playerLevel || 1;

    let goldMin = 70;
    let goldMax = 120;
    if (pLevel <= 10) {
        goldMin = 70;
        goldMax = 120;
    } else if (pLevel <= 20) {
        goldMin = 150;
        goldMax = 250;
    } else if (pLevel <= 40) {
        goldMin = 300;
        goldMax = 450;
    } else if (pLevel <= 60) {
        goldMin = 400;
        goldMax = 500;
    } else {
        goldMin = 450;
        goldMax = 500;
    }

    const xpBase = 150 + pLevel * 4;
    const xpAmount = Math.round(xpBase * (isPremium ? 1.25 : 1.0));

    let baseMin = 20;
    let baseMax = 20;

    if (playerRating < 1000) {
        baseMin = 70;
        baseMax = 100;
    } else if (playerRating < 3000) {
        baseMin = 40;
        baseMax = 60;
    } else if (playerRating < 4500) {
        baseMin = 20;
        baseMax = 35;
    } else if (playerRating < 6000) {
        baseMin = 12;
        baseMax = 25;
    } else if (playerRating < 7500) {
        baseMin = 10;
        baseMax = 20;
    } else if (playerRating < 9000) {
        baseMin = 10;
        baseMax = 18;
    } else {
        baseMin = 10;
        baseMax = 15;
    }

    // Добавляем стрик-бонус за серию побед
    const nextStreak = (winStreak || 0) + 1;
    let streakBonus = 0;
    if (nextStreak >= 10) {
        streakBonus = 35;
    } else if (nextStreak >= 5) {
        streakBonus = 20;
    } else if (nextStreak >= 3) {
        streakBonus = 10;
    }

    let minTrophies = baseMin + streakBonus;
    let maxTrophies = baseMax + streakBonus;

    // Применяем Catch-up множитель (до 3000 кубков) как в BattleResultService
    if (playerRating < 3000) {
        const expectedLevel = playerRating < 1000 ? 1 : (playerRating < 2000 ? 10 : 20);
        const levelDiff = pLevel - expectedLevel;
        if (levelDiff >= 20) {
            const multiplier = Math.min(5, 1 + levelDiff / 20);
            minTrophies = Math.round(minTrophies * multiplier);
            maxTrophies = Math.round(maxTrophies * multiplier);
        }
    }

    let trophiesStr = "";
    if (minTrophies !== maxTrophies) {
        trophiesStr = `+${minTrophies}-${maxTrophies}`;
    } else {
        trophiesStr = `+${minTrophies}`;
    }

    return {
        goldRange: `${goldMin}-${goldMax}`,
        xp: xpAmount,
        trophies: trophiesStr,
    };
}
