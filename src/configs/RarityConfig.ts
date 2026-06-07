import { ItemRarity } from '../game/configs/ItemsConfig';

export const RARITY_COLORS: any = {
    [ItemRarity.COMMON]: {
        border: '#a0a0a0',
        glow: 'rgba(160,160,160,0.2)',
        bg: 'rgba(50,50,50,0.8)',
        color: '#a0a0a0',
    },
    [ItemRarity.RARE]: {
        border: '#3b82f6',
        glow: 'rgba(59,130,246,0.3)',
        bg: 'rgba(20,30,50,0.9)',
        color: '#3b82f6',
    },
    [ItemRarity.EPIC]: {
        border: '#a855f7',
        glow: 'rgba(168,85,247,0.4)',
        bg: 'rgba(40,20,60,0.9)',
        color: '#a855f7',
    },
    MYTHIC: {
        border: '#ef4444',
        glow: 'rgba(239,68,68,0.4)',
        bg: 'rgba(60,20,20,0.9)',
        color: '#ef4444',
    },
    [ItemRarity.LEGENDARY]: {
        border: '#f59e0b',
        glow: 'rgba(245,158,11,0.5)',
        bg: 'rgba(60,45,10,0.9)',
        color: '#f59e0b',
    },
};

export const rarityTranslation: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ',
    RARE: 'РЕДКИЙ',
    EPIC: 'ЭПИЧЕСКИЙ',
    MYTHIC: 'МИФИЧЕСКИЙ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ',
};
