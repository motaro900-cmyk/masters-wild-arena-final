import { resolveAssetObject } from '../utils/assetPath';

export interface Hero {
    id: string;
    name: string;
    title: string;
    role: 'TANK' | 'WARRIOR' | 'ASSASSIN';
    image: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'MYTHIC' | 'LEGENDARY';
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        crit: number;
        evasion: number;
        resilience: number;
        lifesteal: number;
        penetration: number;
        critDamage: number;
    };
    displayStats: {
        attack: number;
        defense: number;
        speed: number;
    };
    lore: string;
    description: string;
    unlockType: 'free' | 'gold' | 'diamonds' | 'achievement' | 'level';
    unlockCost?: number;
    unlockAchievement?: string;
    reqLevel: number;
}

const rawHeroes: Hero[] = [
    // --- COMMON ---
    {
        id: 'panda',
        name: 'ПАНДА ЧУ',
        title: 'МАСТЕР ДЗЕН',
        role: 'WARRIOR',
        image: '/assets/images/avatars/панда.png',
        rarity: 'COMMON',
        baseStats: { hp: 3200, attack: 450, defense: 180, speed: 45, crit: 15, evasion: 12, resilience: 10, lifesteal: 5, penetration: 15, critDamage: 1.6 },
        displayStats: { attack: 65, defense: 55, speed: 45 },
        description: 'Сбалансированный боец, сочетающий мощные удары and духовную защиту.',
        lore: 'Мастер медитации and рукопашного боя.',
        unlockType: 'free', reqLevel: 1
    },
    {
        id: 'ram',
        name: 'БРОНЕЛОБЫЙ СТРАЖ',
        title: 'ЖЕЛЕЗНЫЙ ЛОБ',
        role: 'TANK',
        image: '/assets/images/avatars/баран.png',
        rarity: 'COMMON',
        baseStats: { hp: 4500, attack: 300, defense: 380, speed: 30, crit: 10, evasion: 5, resilience: 20, lifesteal: 0, penetration: 20, critDamage: 1.5 },
        displayStats: { attack: 45, defense: 75, speed: 30 },
        description: 'Живой таран, сметающий всё на своем пути.',
        lore: 'Его лоб крепче любой крепостной стены.',
        unlockType: 'achievement', unlockAchievement: 'Победи 50 боёв', reqLevel: 1
    },

    // --- RARE ---
    {
        id: 'boar',
        name: 'ВЕПРЬ ГРОМОБОЙ',
        title: 'СОКРУШИТЕЛЬ',
        role: 'TANK',
        image: '/assets/images/avatars/кабан.png',
        rarity: 'RARE',
        baseStats: { hp: 5500, attack: 320, defense: 450, speed: 25, crit: 5, evasion: 2, resilience: 25, lifesteal: 0, penetration: 5, critDamage: 1.5 },
        displayStats: { attack: 40, defense: 85, speed: 25 },
        description: 'Непробиваемый танк, способный выдержать град ударов.',
        lore: 'Ярость леса в обличии стали.',
        unlockType: 'gold', unlockCost: 5000, reqLevel: 1
    },
    {
        id: 'monkey',
        name: 'ХАНУМАН ЛОВКАЧ',
        title: 'ЛОВКИЙ ТРЮКАЧ',
        role: 'ASSASSIN',
        image: '/assets/images/avatars/обезьяна.png',
        rarity: 'RARE',
        baseStats: { hp: 2500, attack: 550, defense: 120, speed: 75, crit: 30, evasion: 18, resilience: 5, lifesteal: 5, penetration: 20, critDamage: 1.8 },
        displayStats: { attack: 75, defense: 40, speed: 80 },
        description: 'Быстрый and непредсказуемый боец.',
        lore: 'Мастер акробатики and внезапных атак.',
        unlockType: 'level', unlockCost: 8, reqLevel: 8
    },
    {
        id: 'crocodile',
        name: 'ДРЕВНИЙ ТИРАН',
        title: 'УЖАС РЕКИ',
        role: 'TANK',
        image: '/assets/images/avatars/крокодил.png',
        rarity: 'RARE',
        baseStats: { hp: 6000, attack: 350, defense: 500, speed: 20, crit: 5, evasion: 0, resilience: 30, lifesteal: 5, penetration: 10, critDamage: 1.4 },
        displayStats: { attack: 50, defense: 95, speed: 15 },
        description: 'Бронированный хищник из мутных вод.',
        lore: 'Его челюсти не знают пощады.',
        unlockType: 'diamonds', unlockCost: 300, reqLevel: 15
    },

    // --- EPIC ---
    {
        id: 'moose',
        name: 'СЕВЕРНЫЙ ТИТАН',
        title: 'ЛЕСНОЙ КОРОЛЬ',
        role: 'WARRIOR',
        image: '/assets/images/avatars/лось.png',
        rarity: 'EPIC',
        baseStats: { hp: 4100, attack: 380, defense: 250, speed: 35, crit: 10, evasion: 5, resilience: 15, lifesteal: 12, penetration: 10, critDamage: 1.5 },
        displayStats: { attack: 55, defense: 60, speed: 35 },
        description: 'Хранитель природы, поддерживающий союзников.',
        lore: 'Дух леса, дарующий исцеление.',
        unlockType: 'level', unlockCost: 5, reqLevel: 5
    },
    {
        id: 'panther',
        name: 'ТЕНЬ БЕЗДНЫ',
        title: 'ЧЕРНАЯ СМЕРТЬ',
        role: 'ASSASSIN',
        image: '/assets/images/avatars/пантера.png',
        rarity: 'EPIC',
        baseStats: { hp: 2300, attack: 720, defense: 110, speed: 90, crit: 40, evasion: 25, resilience: 0, lifesteal: 10, penetration: 40, critDamage: 2.1 },
        displayStats: { attack: 85, defense: 35, speed: 95 },
        description: 'Грациозный убийца из джунглей.',
        lore: 'Последнее, что видит жертва — блеск её глаз.',
        unlockType: 'gold', unlockCost: 15000, reqLevel: 10
    },
    {
        id: 'bear',
        name: 'УРСУС БЕРСЕРК',
        title: 'ГОРНЫЙ ГИГАНТ',
        role: 'WARRIOR',
        image: '/assets/images/avatars/медведь.png',
        rarity: 'EPIC',
        baseStats: { hp: 4800, attack: 520, defense: 300, speed: 40, crit: 20, evasion: 5, resilience: 15, lifesteal: 0, penetration: 25, critDamage: 1.7 },
        displayStats: { attack: 75, defense: 70, speed: 35 },
        description: 'Сильный and выносливый хозяин тайги.',
        lore: 'Один его рев заставляет врагов бежать.',
        unlockType: 'gold', unlockCost: 25000, reqLevel: 20
    },
    {
        id: 'rhino',
        name: 'ЖЕЛЕЗНЫЙ ТАРАН',
        title: 'ЖЕЛЕЗНЫЙ РОГ',
        role: 'TANK',
        image: '/assets/images/avatars/носорог.png',
        rarity: 'EPIC',
        baseStats: { hp: 7000, attack: 400, defense: 600, speed: 15, crit: 0, evasion: 0, resilience: 40, lifesteal: 0, penetration: 15, critDamage: 1.3 },
        displayStats: { attack: 60, defense: 90, speed: 10 },
        description: 'Живая крепость, которую невозможно остановить.',
        lore: 'Броня этого зверя выдержит даже удар молнии.',
        unlockType: 'achievement', unlockAchievement: 'Топ-100 в рейтинге', reqLevel: 25
    },

    // --- LEGENDARY ---
    {
        id: 'cat',
        name: 'ПОЛУНОЧНЫЙ ЖНЕЦ',
        title: 'УЛЫБКА СМЕРТИ',
        role: 'ASSASSIN',
        image: '/assets/images/avatars/кот.png',
        rarity: 'LEGENDARY',
        baseStats: { hp: 2100, attack: 680, defense: 90, speed: 85, crit: 45, evasion: 20, resilience: 0, lifesteal: 8, penetration: 35, critDamage: 2.2 },
        displayStats: { attack: 95, defense: 30, speed: 90 },
        description: 'Мастер скрытности and критических ударов.',
        lore: 'Тень, которая кусает за горло.',
        unlockType: 'diamonds', unlockCost: 150, reqLevel: 1
    },
    {
        id: 'lion',
        name: 'ВЕЛИКИЙ МОНАРХ',
        title: 'ЦАРЬ ЗВЕРЕЙ',
        role: 'WARRIOR',
        image: '/assets/images/avatars/лев.png',
        rarity: 'LEGENDARY',
        baseStats: { hp: 4000, attack: 650, defense: 220, speed: 60, crit: 25, evasion: 10, resilience: 10, lifesteal: 15, penetration: 30, critDamage: 1.9 },
        displayStats: { attack: 85, defense: 50, speed: 65 },
        description: 'Благородный лидер and смертоносный боец.',
        lore: 'Его золото на гриве — это кровь павших врагов.',
        unlockType: 'diamonds', unlockCost: 750, reqLevel: 30
    },

    // --- MYTHIC ---
    {
        id: 'tiger',
        name: 'НЕФРИТОВЫЙ ВЛАДЫКА',
        title: 'ПОЛОСАТЫЙ ТИРАН',
        role: 'ASSASSIN',
        image: '/assets/images/avatars/тигр.png',
        rarity: 'MYTHIC',
        baseStats: { hp: 3500, attack: 950, defense: 180, speed: 110, crit: 55, evasion: 35, resilience: 10, lifesteal: 15, penetration: 60, critDamage: 3.0 },
        displayStats: { attack: 100, defense: 45, speed: 100 },
        description: 'Вершина пищевой цепочки. Истинное воплощение смерти.',
        lore: 'Мастер идеального убийства. Тот, чье имя боятся произносить.',
        unlockType: 'diamonds', unlockCost: 2500, reqLevel: 45
    }
];

export const HEROES_DB: Hero[] = rawHeroes.map(hero => ({
    ...hero,
    image: resolveAssetObject(hero.image)
})) as Hero[];
