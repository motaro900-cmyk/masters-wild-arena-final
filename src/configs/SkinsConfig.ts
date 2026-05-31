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
    skinLore?: string;
    color?: string;
}

export const SKINS_DB: ISkinConfig[] = [
    // ── ПАНДА ──────────────────────────────────────────────────────────
    {
        id: 'default',
        name: 'Страж Окраин',
        description: 'Традиционное снаряжение защитника Туманной Долины. Проверенное временем и надежное в бою.',
        heroId: 'panda',
        image: '/assets/characters/panda/panda_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'COMMON',
    },
    {
        id: 'panda_frost',
        name: 'Лазурный Дракон',
        description:
            'Легендарные серебряные латы, заряженные чистой энергией Лазурного Дракона. Облик дарует силу ветра и шторма.',
        heroId: 'panda',
        image: '/assets/characters/panda/panda_frost.webp',
        source: 'battle_pass',
        sourceLabel: 'Боевой пропуск · Сезон 1 · Ур. 15',
        season: 1,
        bpLevel: 15,
        rarity: 'EPIC',
        color: '#00d2ff',
        skinLore:
            'Когда тьма начала грозить не только Окраинам, но и самому Храму Небес, Фэн Лун совершил паломничество на Драконий Пик. Там, преодолев бурю и доказав чистоту своих намерений, он удостоился благословения Древнего Духа ветра.\n\nЕго отцовские бронзовые доспехи переродились в великолепные серебряные латы с чешуйками бирюзового цвета, а деревянный шест наполнился чистой космической энергией, увенчавшись парящей сферой Лазурного Дракона. Фэн Лун принял титул Лазурного Дракона — хранителя небесного баланса и штормов.',
    },
    // ── ЕНОТ ───────────────────────────────────────────────────────────
    {
        id: 'raccoon_default',
        name: 'Дикий Страж',
        description: 'Легкие и бесшумные доспехи скрытного защитника Древнего Леса.',
        heroId: 'raccoon',
        image: '/assets/characters/raccoon/raccoon_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'COMMON',
    },
];

/** Возвращает скины для конкретного героя */
export const getSkinsForHero = (heroId: string): ISkinConfig[] => SKINS_DB.filter((s) => s.heroId === heroId);
