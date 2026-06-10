/**
 * AbilityConfig.ts
 * Централизованный реестр способностей всех персонажей.
 * Заменяет хардкод по heroId/role в BattleEngine, BattleSimulation, BattleAbilitySystem.
 */

// ─── ТИПЫ СТАТУСОВ (расширяемый union) ───────────────────────────────────────

export type StatusType =
    | 'STUN'
    | 'BURN'
    | 'FREEZE'
    | 'POISON'
    | 'STUN_IMMUNITY'
    // Новые статусы для 5 персонажей:
    | 'SHADOW_MARK' // Следующий удар — гарантированный крит
    | 'CRYSTAL_SHIELD' // Отражает 20% урона обратно врагу
    | 'STORM_CHARGE' // Накапливается и взрывается через N ходов
    | 'NATURE_REGEN' // +5% HP каждый ход
    | 'VOID_SLOW'; // Скорость -50% (переиспользует isFrozenStatus)

// ─── ИНТЕРФЕЙСЫ ПАССИВНЫХ ХУКОВ ──────────────────────────────────────────────

export interface PassiveContext {
    attacker: any;
    victim: any;
    isPlayer: boolean;
    damage: number;
    isCrit: boolean;
    engine: any;
}

export interface PassiveResult {
    damageModifier?: number; // множитель урона (1.5 = +50%)
    cancelDamage?: boolean; // отменить урон полностью
    extraLog?: string; // строка в лог боя
}

export interface PassiveHooks {
    onTakeDamage?: (ctx: PassiveContext) => PassiveResult;
    onDealDamage?: (ctx: PassiveContext) => PassiveResult;
    onTurnStart?: (ctx: PassiveContext) => PassiveResult;
}

// ─── ИНТЕРФЕЙСЫ КОНФИГА СПОСОБНОСТЕЙ ─────────────────────────────────────────

export interface AttackPassiveConfig {
    chance: number; // вероятность (0–1)
    status: StatusType;
    duration: number; // ходов
    damagePercent?: number; // % от attack как урон за ход (для BURN/POISON)
    value?: number; // фиксированное значение
}

export interface OnCastStatus {
    target: 'enemy' | 'player';
    type: StatusType;
    duration: number;
    damagePerTurn?: number; // абсолютное или относительное значение
}

export interface ActiveAbilityConfig {
    name: string;
    icon?: string;
    damageMultiplier: number;
    healPercent?: number; // % от maxHP (heal после атаки)
    shieldPercent?: number; // % от maxHP (щит после атаки)
    onCastStatus?: OnCastStatus;
}

export interface HeroAbilityConfig {
    heroId: string;
    activeAbility: ActiveAbilityConfig;
    attackPassive?: AttackPassiveConfig;
    passive?: PassiveHooks;
}

// ─── РЕЕСТР СПОСОБНОСТЕЙ ─────────────────────────────────────────────────────

export const ABILITY_REGISTRY: Record<string, HeroAbilityConfig> = {
    // ── Существующие герои (перенесены из хардкода BattleEngine/BattleSimulation) ──

    panda: {
        heroId: 'panda',
        activeAbility: {
            name: 'Удар Дзена',
            damageMultiplier: 2.5,
            onCastStatus: { target: 'enemy', type: 'STUN', duration: 1 },
        },
        attackPassive: { chance: 0.3, status: 'BURN', duration: 3, damagePercent: 0.12 },
    },

    raccoon: {
        heroId: 'raccoon',
        activeAbility: {
            name: 'Танец Теней',
            damageMultiplier: 3.5,
            onCastStatus: { target: 'enemy', type: 'POISON', duration: 4, damagePerTurn: 0.1 },
        },
        attackPassive: { chance: 0.35, status: 'POISON', duration: 4, damagePercent: 0.09 },
    },

    wolf_knight: {
        heroId: 'wolf_knight',
        activeAbility: {
            name: 'Берсерк',
            damageMultiplier: 2.5,
            onCastStatus: { target: 'enemy', type: 'STUN', duration: 1 },
        },
        attackPassive: { chance: 0.25, status: 'BURN', duration: 2, damagePercent: 0.1 },
    },

    ancient_golem: {
        heroId: 'ancient_golem',
        activeAbility: {
            name: 'Молот Земли',
            damageMultiplier: 1.8,
            shieldPercent: 0.25,
        },
        attackPassive: { chance: 0.3, status: 'BURN', duration: 3, damagePercent: 0.12 },
    },

    ancient_spider: {
        heroId: 'ancient_spider',
        activeAbility: {
            name: 'Ядовитое Жало',
            damageMultiplier: 2.8,
            onCastStatus: { target: 'enemy', type: 'POISON', duration: 4, damagePerTurn: 0.08 },
        },
        attackPassive: { chance: 0.35, status: 'POISON', duration: 4, damagePercent: 0.09 },
    },

    ancient_wolf: {
        heroId: 'ancient_wolf',
        activeAbility: {
            name: 'Ледяной Вой',
            damageMultiplier: 2.0,
            onCastStatus: { target: 'enemy', type: 'FREEZE', duration: 2 },
        },
        attackPassive: { chance: 0.25, status: 'FREEZE', duration: 2 },
    },

    minotaur: {
        heroId: 'minotaur',
        activeAbility: {
            name: 'Молот Лабиринта',
            damageMultiplier: 1.8,
            shieldPercent: 0.12,
        },
        attackPassive: { chance: 0.25, status: 'STUN', duration: 1 },
    },

    tiger_warrior: {
        heroId: 'tiger_warrior',
        activeAbility: {
            name: 'Лунное Сечение',
            damageMultiplier: 3.25,
            onCastStatus: { target: 'enemy', type: 'SHADOW_MARK', duration: 1 },
        },
        attackPassive: { chance: 0.35, status: 'SHADOW_MARK', duration: 1 },
        passive: {
            onDealDamage: (ctx) => {
                const hasMarkIndex = ctx.victim.statusEffects?.findIndex((s: any) => s.type === 'SHADOW_MARK');
                if (hasMarkIndex !== undefined && hasMarkIndex !== -1) {
                    const mark = ctx.victim.statusEffects[hasMarkIndex];
                    if (!mark.delay || mark.delay <= 0) {
                        ctx.victim.statusEffects.splice(hasMarkIndex, 1);
                        const stats = ctx.isPlayer ? ctx.engine.playerStats : ctx.engine.enemyStats;
                        const avgItemLevel = stats?.avgItemLevel || 1;
                        const itemLevelFactor = 1 - (avgItemLevel - 1) * 0.03;
                        const modifier = 1.0 + 0.5 * itemLevelFactor;
                        return {
                            damageModifier: modifier,
                            extraLog: `🌑 [МЕТКА ТЕНЕЙ] Удар усилен ×${modifier.toFixed(2)}!`,
                        };
                    }
                }
                return {};
            },
        },
    },

    lion_knight: {
        heroId: 'lion_knight',
        activeAbility: {
            name: 'Королевский Гнев',
            damageMultiplier: 2.6,
            onCastStatus: { target: 'player', type: 'NATURE_REGEN', duration: 3 },
        },
        attackPassive: { chance: 0.3, status: 'BURN', duration: 2, damagePercent: 0.1 },
    },

    // ── 5 НОВЫХ ПЕРСОНАЖЕЙ ──────────────────────────────────────────────────

    /**
     * Нyx — Танцор Теней (ASSASSIN)
     * Пассивка: если цель помечена SHADOW_MARK — следующий удар гарантированный крит
     * с бонусом к урону на основе ловкости
     */
    shadow_dancer: {
        heroId: 'shadow_dancer',
        activeAbility: {
            name: 'Метка Теней',
            damageMultiplier: 2.8,
            onCastStatus: { target: 'enemy', type: 'SHADOW_MARK', duration: 1 },
        },
        attackPassive: { chance: 0.4, status: 'SHADOW_MARK', duration: 1 },
        passive: {
            onDealDamage: (ctx) => {
                const hasMark = ctx.victim.statusEffects?.some((s: any) => s.type === 'SHADOW_MARK');
                if (hasMark) {
                    const agi = ctx.attacker.config?.stats?.agility || 20;
                    const modifier = 1.0 + agi * 0.05;
                    return {
                        damageModifier: modifier,
                        extraLog: `🌑 [МЕТКА ТЕНЕЙ] Удар усилен ×${modifier.toFixed(2)}!`,
                    };
                }
                return {};
            },
        },
    },

    /**
     * Кристалл — Хранитель Кристалла (TANK)
     * Пассивка: при получении урона, если активен CRYSTAL_SHIELD — отражает 20% урона
     */
    crystal_guardian: {
        heroId: 'crystal_guardian',
        activeAbility: {
            name: 'Кристальный Щит',
            damageMultiplier: 1.6,
            shieldPercent: 0.4,
            onCastStatus: { target: 'player', type: 'CRYSTAL_SHIELD', duration: 3 },
        },
        passive: {
            onTakeDamage: (ctx) => {
                const shield = ctx.victim.statusEffects?.find((s: any) => s.type === 'CRYSTAL_SHIELD');
                if (shield && ctx.damage > 0) {
                    const reflected = Math.ceil(ctx.damage * 0.2);
                    ctx.engine.applyDamage('enemy', reflected);
                    return { extraLog: `💎 [КРИСТАЛЛ] Щит отражает ${reflected} урона врагу!` };
                }
                return {};
            },
        },
    },

    /**
     * Тэзар — Призыватель Гроз (MAGE)
     * Пассивка: STORM_CHARGE накапливается и взрывается через 3 хода (обработано в BattleStatusSystem)
     */
    storm_caller: {
        heroId: 'storm_caller',
        activeAbility: {
            name: 'Грозовой Разряд',
            damageMultiplier: 1.5,
            onCastStatus: { target: 'enemy', type: 'STORM_CHARGE', duration: 3 },
        },
        attackPassive: { chance: 0.45, status: 'STORM_CHARGE', duration: 3 },
    },

    /**
     * Эльра — Страж Природы (SUPPORT)
     * Пассивка: NATURE_REGEN — +5% HP каждый ход пока активен статус
     */
    nature_warden: {
        heroId: 'nature_warden',
        activeAbility: {
            name: 'Природное Благословение',
            damageMultiplier: 1.8,
            healPercent: 0.15,
            onCastStatus: { target: 'player', type: 'NATURE_REGEN', duration: 4 },
        },
    },

    /**
     * Каэль — Ходок по Пустоте (ASSASSIN/MAGE)
     * Пассивка: VOID_SLOW — замедляет цель на 50% (переиспользует isFrozenStatus)
     */
    void_walker: {
        heroId: 'void_walker',
        activeAbility: {
            name: 'Замедление Пустоты',
            damageMultiplier: 2.2,
            onCastStatus: { target: 'enemy', type: 'VOID_SLOW', duration: 3 },
        },
        attackPassive: { chance: 0.35, status: 'VOID_SLOW', duration: 2 },
    },
};

// ─── ХЕЛПЕРЫ ─────────────────────────────────────────────────────────────────

/**
 * Получить конфиг способностей по ID героя.
 * Возвращает null если герой не зарегистрирован (используй getAbilityConfigByRole как fallback).
 */
export function getAbilityConfig(heroId: string | null | undefined): HeroAbilityConfig | null {
    if (!heroId) return null;
    return ABILITY_REGISTRY[heroId] ?? null;
}

/**
 * Получить конфиг способностей по роли (fallback для незарегистрированных героев).
 */
export function getAbilityConfigByRole(role: string | null | undefined): HeroAbilityConfig {
    const roleDefaults: Record<string, HeroAbilityConfig> = {
        WARRIOR: {
            heroId: '__warrior',
            activeAbility: { name: 'Удар Воина', damageMultiplier: 2.5 },
            attackPassive: { chance: 0.25, status: 'BURN', duration: 2, damagePercent: 0.1 },
        },
        ASSASSIN: {
            heroId: '__assassin',
            activeAbility: { name: 'Смертельный Удар', damageMultiplier: 3.5 },
            attackPassive: { chance: 0.3, status: 'POISON', duration: 3, damagePercent: 0.08 },
        },
        TANK: {
            heroId: '__tank',
            activeAbility: { name: 'Молот Земли', damageMultiplier: 1.8, shieldPercent: 0.25 },
        },
        MAGE: {
            heroId: '__mage',
            activeAbility: {
                name: 'Вспышка Звёзд',
                damageMultiplier: 2.2,
                healPercent: 0.2,
                onCastStatus: { target: 'enemy', type: 'BURN', duration: 3, damagePerTurn: 0.1 },
            },
        },
        SUPPORT: {
            heroId: '__support',
            activeAbility: {
                name: 'Природный Свет',
                damageMultiplier: 1.8,
                healPercent: 0.2,
                onCastStatus: { target: 'player', type: 'NATURE_REGEN', duration: 3 },
            },
        },
    };
    return roleDefaults[role ?? ''] ?? roleDefaults['WARRIOR'];
}
