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
    // ── 5 НОВЫХ ГЕРОЕВ ─────────────────────────────────────────────────
    {
        id: 'shadow_dancer_default',
        name: 'Танцор Теней',
        description: 'Облачение из чистой тени. Нyx движется быстрее, чем взгляд успевает уследить.',
        heroId: 'shadow_dancer',
        image: '/assets/characters/shadow_dancer/shadow_dancer_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'EPIC',
    },
    {
        id: 'crystal_guardian_default',
        name: 'Хранитель Кристалла',
        description: 'Тело из живого кристалла, пронизанное небесной молнией.',
        heroId: 'crystal_guardian',
        image: '/assets/characters/crystal_guardian/crystal_guardian_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'RARE',
    },
    {
        id: 'storm_caller_default',
        name: 'Призыватель Гроз',
        description: 'Одеяния старого шамана, пропитанные запахом озона и грозовым светом.',
        heroId: 'storm_caller',
        image: '/assets/characters/storm_caller/storm_caller_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'LEGENDARY',
    },
    {
        id: 'nature_warden_default',
        name: 'Страж Природы',
        description: 'Живые листья и ветви образуют одеяние Эльры — природа сама защищает свою хранительницу.',
        heroId: 'nature_warden',
        image: '/assets/characters/nature_warden/nature_warden_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'RARE',
    },
    {
        id: 'void_walker_default',
        name: 'Ходок по Пустоте',
        description: 'Плащ из чистой пустоты. Каэль существует между мирами.',
        heroId: 'void_walker',
        image: '/assets/characters/void_walker/void_walker_base.webp',
        source: 'default',
        sourceLabel: 'По умолчанию',
        rarity: 'MYTHIC',
    },
];

/** Возвращает скины для конкретного героя */
export const getSkinsForHero = (heroId: string): ISkinConfig[] => SKINS_DB.filter((s) => s.heroId === heroId);
