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
    opponentRating: number,
): { goldRange: string; xp: number; trophies: number } {
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

    const getXPReward = (lvl: number, won: boolean): number => {
        if (won) {
            if (lvl <= 10) return 100 + lvl * 20;
            if (lvl <= 30) return 300 + (lvl - 10) * 10;
            return Math.min(500 + (lvl - 30) * 5, 600);
        } else {
            if (lvl <= 10) return 20 + lvl * 4;
            if (lvl <= 30) return 60 + (lvl - 10) * 2;
            return Math.min(100 + (lvl - 30) * 1, 120);
        }
    };

    const xpBase = getXPReward(pLevel, true);
    const xpAmount = Math.round(xpBase * (isPremium ? 1.25 : 1.0));

    const diff = (opponentRating || 0) - (playerRating || 0);
    let trophies = 20;
    if (diff >= 100) {
        trophies = 30;
    } else if (diff >= 0) {
        trophies = 20;
    } else {
        trophies = 10;
    }

    return {
        goldRange: `${goldMin}-${goldMax}`,
        xp: xpAmount,
        trophies,
    };
}
