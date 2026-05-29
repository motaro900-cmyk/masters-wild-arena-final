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
