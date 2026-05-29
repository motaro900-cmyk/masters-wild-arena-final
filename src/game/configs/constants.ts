// src/game/configs/constants.ts
export const ENERGY_CONFIG = {
    REGEN_MS: 5 * 60 * 1000, // 5 min per 1 energy → full 50 in ~4h 10m
    MAX_ENERGY: 50,
    PREMIUM_MAX_ENERGY: 100,
    PREMIUM_REGEN_MS: 2.5 * 60 * 1000, // 2.5 min per 1 energy for premium (2x speed)
} as const;

export const BATTLE_CONFIG = {
    DAILY_LIMIT: 50,
    PREMIUM_DAILY_LIMIT: 100,
    ENERGY_COST: 1,
    RESET_HOUR_UTC: 0,
} as const;

export const FORGE_CONFIG = {
    COOLDOWN_MS: 2 * 60 * 60 * 1000, // 2 h
    PREMIUM_COOLDOWN_MS: 1 * 60 * 60 * 1000, // 1 h for premium players
} as const;
