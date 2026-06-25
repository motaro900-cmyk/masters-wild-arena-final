/**
 * Вспомогательные константы и функции для HeroList.
 * Перенесено из HeroList/index.tsx при рефакторинге.
 */

export const RARITY_LABELS: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
};

export const RARITY_GLOWS: Record<string, string> = {
    COMMON: 'rgba(160, 160, 160, 0.15)',
    RARE: 'rgba(59, 130, 246, 0.25)',
    EPIC: 'rgba(168, 85, 247, 0.35)',
    LEGENDARY: 'rgba(245, 158, 11, 0.45)',
    MYTHIC: 'rgba(239, 68, 68, 0.55)',
};

export const SOURCE_ICONS: Record<string, string> = {
    default: '🎁',
    battle_pass: '🏆',
    shop: '🛒',
    achievement: '🏅',
    event: '🌟',
};

/**
 * Вычисляет производные боевые характеристики из базовых статов героя.
 */
export function deriveStats(
    stats: { strength: number; agility: number; stamina: number; intelligence: number },
    _heroId?: string,
) {
    return {
        hp: stats.stamina * 10,
        attack: stats.strength * 2,
        defense: Math.round(stats.stamina * 0.5),
        speed: Math.round((1 + stats.agility * 0.05) * 100) / 100,
        crit: Math.round(stats.agility * 0.5),
    };
}
