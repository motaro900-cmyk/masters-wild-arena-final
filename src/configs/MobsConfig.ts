export interface IMobData {
    id: string;
    name: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'BOSS';
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        crit: number;
    };
    icon: string;
}

export const MOBS_DB: IMobData[] = [
    {
        id: 'wolf_scout',
        name: 'Волк-Разведчик',
        rarity: 'COMMON',
        baseStats: { hp: 450, attack: 45, defense: 10, speed: 1.2, crit: 0.1 },
        icon: '🐺'
    },
    {
        id: 'iron_boar',
        name: 'Железный Вепрь',
        rarity: 'RARE',
        baseStats: { hp: 1200, attack: 35, defense: 50, speed: 0.8, crit: 0.05 },
        icon: '🐗'
    },
    {
        id: 'shadow_panther',
        name: 'Теневая Пантера',
        rarity: 'EPIC',
        baseStats: { hp: 800, attack: 85, defense: 20, speed: 2.0, crit: 0.3 },
        icon: '🐆'
    },
    {
        id: 'ancient_treant',
        name: 'Древний Энт',
        rarity: 'BOSS',
        baseStats: { hp: 5000, attack: 120, defense: 100, speed: 0.5, crit: 0.15 },
        icon: '🌳'
    }
];
