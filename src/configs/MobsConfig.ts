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
        image: '/assets/images/avatars/волк.webp',
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
        image: '/assets/images/avatars/кабан.webp',
        baseStats: { hp: 1200, attack: 35, defense: 50, speed: 0.8, crit: 0.05 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.8, y: 0.5, angle: 10 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🐗',
    },
    {
        id: 'shadow_panther',
        name: 'Теневая Пантера',
        rarity: 'EPIC',
        image: '/assets/images/avatars/пантера.webp',
        baseStats: { hp: 800, attack: 85, defense: 20, speed: 2.0, crit: 0.3 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.2 },
            rightHand: { x: 0.6, y: 0.5, angle: -20 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🐆',
    },
    {
        id: 'ancient_treant',
        name: 'Древний Энт',
        rarity: 'BOSS',
        image: '/assets/images/avatars/медведь.webp',
        baseStats: { hp: 5000, attack: 120, defense: 100, speed: 0.5, crit: 0.15 },
        anchors: {
            feet: { x: 0.5, y: 0.95 },
            head: { x: 0.5, y: 0.1 },
            rightHand: { x: 0.5, y: 0.5 },
            center: { x: 0.5, y: 0.5 },
        },
        icon: '🌳',
    },
];
