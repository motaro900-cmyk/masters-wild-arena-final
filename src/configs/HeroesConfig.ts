import { resolveAssetObject } from '../utils/assetPath';

export interface Hero {
    id: string;
    name: string;
    title: string;
    role: 'TANK' | 'WARRIOR' | 'ASSASSIN' | 'MAGE' | 'SUPPORT';
    image: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'MYTHIC' | 'LEGENDARY';
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        crit: number;
        // Расширенные статы
        evasion: number;
        resilience: number;
        lifesteal: number;
        penetration: number;
        critDamage: number;
    };
    lore: string;
    description: string;
}

const rawHeroes: Hero[] = [
    {
        id: 'panda',
        name: 'ПАНДА МУДРЕЦ',
        title: 'МАСТЕР ДЗЕН',
        role: 'WARRIOR',
        image: '/assets/images/avatars/панда.png',
        rarity: 'EPIC',
        baseStats: {
            hp: 3200,
            attack: 450,
            defense: 180,
            speed: 45,
            crit: 15,
            evasion: 12,
            resilience: 10,
            lifesteal: 5,
            penetration: 15,
            critDamage: 1.6
        },
        description: 'Сбалансированный боец, сочетающий мощные удары и духовную защиту.',
        lore: 'Выходец из высокогорных монастырей, Панда Мудрец посвятил жизнь изучению потоков энергии. Его спокойствие в бою пугает врагов больше, чем любая ярость.'
    },
    {
        id: 'boar',
        name: 'ДИКИЙ ВЕПРЬ',
        title: 'СОКРУШИТЕЛЬ',
        role: 'TANK',
        image: '/assets/images/avatars/кабан.png',
        rarity: 'RARE',
        baseStats: {
            hp: 5500,
            attack: 320,
            defense: 450,
            speed: 25,
            crit: 5,
            evasion: 2,
            resilience: 25,
            lifesteal: 0,
            penetration: 5,
            critDamage: 1.5
        },
        description: 'Непробиваемый танк, способный выдержать град ударов и раздавить врага массой.',
        lore: 'В лесах Юга нет зверя страшнее Вепря в гневе. Его броня — это шрамы от сотен сражений, а его воля непоколебима, как скалы его родины.'
    },
    {
        id: 'cat',
        name: 'НОЧНАЯ ТЕНЬ',
        title: 'УЛЫБКА СМЕРТИ',
        role: 'ASSASSIN',
        image: '/assets/images/avatars/кот.png',
        rarity: 'MYTHIC',
        baseStats: {
            hp: 2100,
            attack: 680,
            defense: 90,
            speed: 85,
            crit: 45,
            evasion: 20,
            resilience: 0,
            lifesteal: 8,
            penetration: 35,
            critDamage: 2.2
        },
        description: 'Мастер скрытности и критических ударов. Исчезает раньше, чем враг поймет, что проиграл.',
        lore: 'Она пришла из мира теней, где нет звуков и света. Её клинок острее самого времени, а её прошлое покрыто мраком, который она приносит с собой на Арену.'
    },
    {
        id: 'moose',
        name: 'СЕВЕРНЫЙ СТРАЖ',
        title: 'ЛЕСНОЙ КОРОЛЬ',
        role: 'SUPPORT',
        image: '/assets/images/avatars/лось.png',
        rarity: 'EPIC',
        baseStats: {
            hp: 4100,
            attack: 380,
            defense: 250,
            speed: 35,
            crit: 10,
            evasion: 5,
            resilience: 15,
            lifesteal: 12,
            penetration: 10,
            critDamage: 1.5
        },
        description: 'Хранитель природы, поддерживающий союзников и сковывающий врагов силой леса.',
        lore: 'Величественный Лось — воплощение самой природы. Его рога впитали магию древних деревьев, позволяя ему исцелять раны и призывать на помощь силы земли.'
    }
];

export const HEROES_DB: Hero[] = resolveAssetObject(rawHeroes) as Hero[];
