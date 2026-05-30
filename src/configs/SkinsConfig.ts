/**
 * ЦЕНТРАЛЬНЫЙ РЕЕСТР СКИНОВ
 * Чтобы добавить новый скин — просто добавь объект в массив нужного героя.
 */

export interface ISkinConfig {
    id: string;
    name: string;
    description: string;
    heroId: string;
    /** Путь к картинке персонажа в этом скине */
    image: string;
    /** Откуда получить */
    source: 'default' | 'battle_pass' | 'shop' | 'achievement' | 'event';
    /** Текстовка источника для UI */
    sourceLabel: string;
    /** Сезон Боевого пропуска (если source = battle_pass) */
    season?: number;
    /** Уровень БП, на котором открывается */
    bpLevel?: number;
    /** Цвет редкости */
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
}

export const SKINS_DB: ISkinConfig[] = [
    // ── ПАНДА ──────────────────────────────────────────────────────────
    {
        id: 'default',
        name: 'Базовый облик',
        description: 'Классический наряд Панды-воина. Испытан в сотнях битв.',
        heroId: 'panda',
        image: '/assets/characters/panda/panda_base.png',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'COMMON',
    },
    {
        id: 'panda_frost',
        name: 'Морозный Дзен',
        description: 'Окутанный вечным льдом. Говорят, этот облик дарует ледяное спокойствие.',
        heroId: 'panda',
        image: '/assets/characters/panda/panda_frost.png',
        source: 'battle_pass',
        sourceLabel: 'Боевой пропуск · Сезон 1 · Ур. 15',
        season: 1,
        bpLevel: 15,
        rarity: 'EPIC',
    },
    // ── ЕНОТ ───────────────────────────────────────────────────────────
    {
        id: 'raccoon_default',
        name: 'Базовый облик',
        description: 'Классическое снаряжение Енота-инстинкта.',
        heroId: 'raccoon',
        image: '/assets/characters/raccoon/raccoon_base.png',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'COMMON',
    },
];

/** Возвращает скины для конкретного героя */
export const getSkinsForHero = (heroId: string): ISkinConfig[] =>
    SKINS_DB.filter((s) => s.heroId === heroId);
