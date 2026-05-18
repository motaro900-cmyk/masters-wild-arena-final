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
// TODO: заменить на формулы от уровня врага и рейтингового разрыва
export const BATTLE_REWARDS = {
    GOLD_VICTORY: 150,
    GOLD_DEFEAT: 20,
    XP_VICTORY: 300,
    XP_DEFEAT: 50,
    TROPHIES_VICTORY: 25, // TODO: MMR-формула
    TROPHIES_DEFEAT: -15, // TODO: MMR-формула
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
