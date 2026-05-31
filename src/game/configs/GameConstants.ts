/**
 * @file GameConstants.ts
 * Централизованное хранилище всех игровых констант.
 * Используй эти значения вместо хардкода по всему проекту.
 */

// --- РАЗМЕРЫ CANVAS ---
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

// --- ПРОГРЕССИЯ ---
/** Базовый XP для перехода на следующий уровень. Итоговый: newLevel * EXP_PER_LEVEL */
export const EXP_PER_LEVEL = 600;

// --- НАГРАДЫ ЗА БОЙ ---
// Сбалансировано v2: замедление прогрессии, прокачка занимает 7–14 дней
export const BATTLE_REWARDS = {
    GOLD_VICTORY: 80, // было 150 — снижено чтобы не купить всё за 1 день
    GOLD_DEFEAT: 10, // было 20
    XP_VICTORY: 200, // было 300
    XP_DEFEAT: 30, // было 50
    TROPHIES_VICTORY: 28, // было 25 — чуть больше мотивация побеждать
    TROPHIES_DEFEAT: -18, // было -15 — чуть больнее проигрывать
} as const;

// --- ATB / БОЕВАЯ СИСТЕМА ---
/** Порог накопления действия (Active Time Battle) */
export const ATB_THRESHOLD = 3000;
/** Задержка перед запуском боевого цикла (мс) */
export const BATTLE_START_DELAY_MS = 400;
/** Тик анимации шкалы инициативы (мс) */
export const INITIATIVE_TICK_MS = 120;
/** Пауза между ходами (мс) */
export const TURN_COOLDOWN_MS = 60;

/**
 * Вычисляет динамические награды за бой на основе разницы в рейтинге между игроком и оппонентом.
 * Разброс зависит от силы оппонента (кубки/рейтинг).
 */
export const calculateBattleRewards = (
    isVictory: boolean,
    playerRating: number,
    opponentRating: number,
    isWarmup: boolean = false,
) => {
    if (isWarmup) {
        return { gold: 0, xp: 0, trophies: 0 };
    }

    const baseGold = isVictory ? BATTLE_REWARDS.GOLD_VICTORY : BATTLE_REWARDS.GOLD_DEFEAT;
    const baseXP = isVictory ? BATTLE_REWARDS.XP_VICTORY : BATTLE_REWARDS.XP_DEFEAT;
    const baseTrophies = isVictory ? BATTLE_REWARDS.TROPHIES_VICTORY : BATTLE_REWARDS.TROPHIES_DEFEAT;

    const ratingDiff = opponentRating - playerRating;
    const clampedDiff = Math.max(-150, Math.min(150, ratingDiff));

    let gold: number = baseGold;
    let xp: number = baseXP;
    let trophies: number = baseTrophies;

    if (isVictory) {
        // Разброс золота: при равных ~80, максимум при сильном оппоненте (+150) = 80 + 30 = 110, минимум при слабом (-150) = 80 - 20 = 60
        const goldBonus = clampedDiff >= 0 ? clampedDiff * 0.2 : clampedDiff * 0.13;
        gold = Math.max(50, Math.round(baseGold + goldBonus));

        // Разброс опыта: при равных ~200, максимум = 200 + 50 = 250, минимум = 200 - 50 = 150
        const xpBonus = clampedDiff * 0.33;
        xp = Math.max(100, Math.round(baseXP + xpBonus));

        // Кубки: при равных ~28, максимум = 28 + 8 = 36, минимум = 28 - 8 = 20
        const trophiesBonus = clampedDiff * 0.053;
        trophies = Math.max(15, Math.round(baseTrophies + trophiesBonus));
    } else {
        // При поражении:
        // Золото: базовое 10, почти не меняется (от 5 до 15)
        gold = Math.max(2, Math.round(baseGold + clampedDiff * 0.03));
        // Опыт: базовый 30 (от 15 до 45)
        xp = Math.max(10, Math.round(baseXP + clampedDiff * 0.1));
        // Кубки: базовый -18. Если проиграли сильному (clampedDiff > 0), теряем МЕНЬШЕ кубков.
        // Если проиграли слабому (clampedDiff < 0), теряем БОЛЬШЕ кубков.
        const trophiesBonus = clampedDiff * 0.053;
        trophies = Math.min(-5, Math.round(baseTrophies + trophiesBonus));
    }

    return { gold, xp, trophies };
};
