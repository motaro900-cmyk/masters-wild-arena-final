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
        id: 'raccoon',
        name: 'Енот-Инстинкт',
        title: 'ДИКИЙ СТРАЖ',
        image: '/assets/characters/raccoon/raccoon_base.png',
        color: 0xffaa00,
        rarity: 'EPIC',
        role: 'ASSASSIN',
        unlockType: 'gold',
        unlockCost: 200,
        stats: { strength: 14, agility: 24, stamina: 16, intelligence: 12 },
        baseScale: 0.8,
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.22, scale: 0.8 },
            rightHand: { x: 0.72, y: 0.45, angle: -30, scale: 1.0 },
            leftHand: { x: 0.28, y: 0.45, angle: 30, scale: 0.9 },
            center: { x: 0.5, y: 0.55 },
        },
    },
];

export const getHeroConfig = (id: string) => HEROES_DB.find((h) => h.id === id) || HEROES_DB[0];
