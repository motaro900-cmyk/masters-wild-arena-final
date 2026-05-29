import { IHeroAnchors } from './HeroesConfig';

export interface IMobData {
    id: string;
    name: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'BOSS';
    image: string;
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        crit: number;
    };
    anchors: IHeroAnchors;
    icon: string;
}

export const MOBS_DB: IMobData[] = [
    {
        id: 'wolf_scout',
        name: 'Волк-Разведчик',
        rarity: 'COMMON',
        image: '/assets/characters/wolf.png',
        baseStats: { hp: 450, attack: 45, defense: 10, speed: 1.2, crit: 0.1 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.7, y: 0.45, angle: -30 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🐺',
    },
    {
        id: 'iron_boar',
        name: 'Железный Вепрь',
        rarity: 'RARE',
        image: '/assets/characters/ancients/ancient_golem.png',
        baseStats: { hp: 1200, attack: 35, defense: 50, speed: 0.8, crit: 0.05 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.1 },
            rightHand: { x: 0.6, y: 0.5 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🐗',
    },
    {
        id: 'shadow_panther',
        name: 'Теневая Пантера',
        rarity: 'EPIC',
        image: '/assets/characters/ancients/ancient_panther.png',
        baseStats: { hp: 800, attack: 85, defense: 20, speed: 2.0, crit: 0.3 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.7, y: 0.5, angle: -20 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🐆',
    },
    {
        id: 'ancient_treant',
        name: 'Древний Энт Обители',
        rarity: 'BOSS',
        image: '/assets/characters/ancients/ancient_treant.png',
        baseStats: { hp: 3500, attack: 130, defense: 80, speed: 0.6, crit: 0.15 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.1 },
            rightHand: { x: 0.5, y: 0.5 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🌳',
    },
    {
        id: 'ancient_wolf',
        name: 'Ледяной Волк Обители',
        rarity: 'RARE',
        image: '/assets/characters/ancients/ancient_wolf.png',
        baseStats: { hp: 600, attack: 55, defense: 15, speed: 1.3, crit: 0.15 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.7, y: 0.5, angle: -20 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '❄️',
    },
    {
        id: 'ancient_panther',
        name: 'Теневая Пантера Обители',
        rarity: 'EPIC',
        image: '/assets/characters/ancients/ancient_panther.png',
        baseStats: { hp: 800, attack: 85, defense: 20, speed: 1.8, crit: 0.25 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.7, y: 0.5, angle: -20 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🐈‍⬛',
    },
    {
        id: 'ancient_spider',
        name: 'Кристальный Паук Обители',
        rarity: 'RARE',
        image: '/assets/characters/ancients/ancient_spider.png',
        baseStats: { hp: 700, attack: 65, defense: 30, speed: 1.1, crit: 0.1 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.7, y: 0.5, angle: -20 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🕷️',
    },
    {
        id: 'ancient_golem',
        name: 'Лавовый Голем Обители',
        rarity: 'LEGENDARY',
        image: '/assets/characters/ancients/ancient_golem.png',
        baseStats: { hp: 1500, attack: 90, defense: 60, speed: 0.7, crit: 0.05 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.1 },
            rightHand: { x: 0.6, y: 0.5 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🔥',
    },
    {
        id: 'ancient_griffin',
        name: 'Грозовой Грифон',
        rarity: 'BOSS',
        image: '/assets/characters/ancients/ancient_griffin.png',
        baseStats: { hp: 4000, attack: 150, defense: 70, speed: 1.4, crit: 0.2 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.15 },
            rightHand: { x: 0.7, y: 0.5, angle: -10 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '⚡',
    },
];
