/**
 * ЦЕНТРАЛЬНАЯ БАЗА ГЕРОЕВ
 * Содержит визуальные данные, статы и метаданные для рендеринга (анкоры).
 */

export interface ISocket {
    x: number;
    y: number;
    angle?: number;
    scale?: number;
}

export interface IHeroAnchors {
    feet: ISocket;
    head: ISocket;
    rightHand: ISocket;
    leftHand?: ISocket;
    center: ISocket;
}

export interface IHeroConfig {
    id: string;
    name: string;
    title: string;
    image: string;
    color: number;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
    role: 'WARRIOR' | 'TANK' | 'ASSASSIN' | 'MAGE' | 'SUPPORT';
    unlockType: 'gold' | 'diamonds' | 'level' | 'achievement' | 'free';
    unlockCost: number;
    unlockAchievement?: string;
    stats: {
        strength: number;
        agility: number;
        stamina: number;
        intelligence: number;
    };
    anchors: IHeroAnchors;
    baseScale?: number;
    sheet?: { cols: number; rows: number };
}

export const HEROES_DB: IHeroConfig[] = [
    {
        id: 'panda',
        name: 'Панда-Воин',
        title: 'МАСТЕР ДЗЕН',
        image: '/assets/characters/panda/panda_base.png',
        color: 0x00ff00,
        rarity: 'COMMON',
        role: 'WARRIOR',
        unlockType: 'free',
        unlockCost: 0,
        stats: { strength: 18, agility: 12, stamina: 20, intelligence: 10 },
        baseScale: 0.9,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.48, y: 0.22 },
            rightHand: { x: 0.74, y: 0.4, angle: -45, scale: 1.1 },
            leftHand: { x: 0.26, y: 0.4, angle: 45, scale: 1.0 },
            center: { x: 0.5, y: 0.5 },
        },
    },
    {
        id: 'cat',
        name: 'Ночной Жнец',
        title: 'ТЕНЬ ЛЕСА',
        image: '/assets/characters/cat/cat_base.png',
        color: 0xa855f7,
        rarity: 'EPIC',
        role: 'ASSASSIN',
        unlockType: 'gold',
        unlockCost: 5000,
        stats: { strength: 12, agility: 22, stamina: 12, intelligence: 14 },
        baseScale: 1.0,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.15, scale: 0.8 },
            rightHand: { x: 0.35, y: 0.52, angle: -65, scale: 1.0 },
            leftHand: { x: 0.65, y: 0.55, angle: 20, scale: 1.0 },
            center: { x: 0.5, y: 0.45 },
        },
    },
    {
        id: 'lion_knight',
        name: 'Львиный Рыцарь',
        title: 'СТРАЖ КЛАНА ВОЛКА',
        image: '/assets/characters/lion_knight/body.png',
        color: 0xffaa00,
        rarity: 'LEGENDARY',
        role: 'WARRIOR',
        unlockType: 'diamonds',
        unlockCost: 2000,
        stats: { strength: 25, agility: 12, stamina: 22, intelligence: 10 },
        baseScale: 1.05,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.52, y: 0.18 },
            rightHand: { x: 0.88, y: 0.4, angle: -40, scale: 0.9 },
            center: { x: 0.5, y: 0.5 },
        },
    },
    {
        id: 'wolf_knight',
        name: 'Волк-Рыцарь',
        title: 'БЕЛЫЙ КЛЫК',
        image: '/assets/characters/wolf_knight/wolf_knight.png',
        color: 0x94a3b8,
        rarity: 'MYTHIC',
        role: 'TANK',
        unlockType: 'achievement',
        unlockCost: 0,
        unlockAchievement: 'LEGEND_OF_THE_WILD',
        stats: { strength: 30, agility: 15, stamina: 35, intelligence: 12 },
        baseScale: 1.1,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.18, scale: 1.1 },
            rightHand: { x: 0.32, y: 0.55, angle: -20, scale: 1.2 },
            leftHand: { x: 0.68, y: 0.55, angle: 20, scale: 1.2 },
            center: { x: 0.5, y: 0.5 },
        },
    },
];

export const getHeroConfig = (id: string) => HEROES_DB.find((h) => h.id === id) || HEROES_DB[0];
