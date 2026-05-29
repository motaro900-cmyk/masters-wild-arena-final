import { ShopItem } from '../../../../configs/ShopConfig';
import {
    WEAPONS_DB,
    HELMS_DB,
    ARMOR_DB,
    SHIELDS_DB,
    PANTS_DB,
    BOOTS_DB,
    SHOULDERS_DB,
    IEquipmentStats,
} from '../../../../game/configs/ItemsConfig';

export type MainTab = 'ARSENAL' | 'ALCHEMY' | 'BANK' | 'SKINS';
export type SubTab = 'ALL' | 'WEAPONS' | 'HELMETS' | 'ARMOR' | 'SHIELDS' | 'POTIONS' | 'GOLD' | 'GEMS' | 'ENERGY';

export interface ISubTabInfo {
    id: string;
    label: string;
}

export const getSubTabs = (mainTab: MainTab): ISubTabInfo[] => {
    switch (mainTab) {
        case 'ARSENAL':
            return [
                { id: 'WEAPONS', label: 'ОРУЖИЕ' },
                { id: 'SHIELDS', label: 'ЩИТЫ' },
                { id: 'HELMETS', label: 'ШЛЕМЫ' },
                { id: 'SHOULDERS', label: 'НАПЛЕЧНИКИ' },
                { id: 'ARMOR', label: 'ДОСПЕХИ' },
                { id: 'PANTS', label: 'ПОНОЖИ' },
                { id: 'BOOTS', label: 'САПОГИ' },
            ];
        case 'ALCHEMY':
            return [{ id: 'POTIONS', label: 'ЗЕЛЬЯ' }];
        case 'BANK':
            return [
                { id: 'GOLD', label: 'ЗОЛОТО' },
                { id: 'GEMS', label: 'АЛМАЗЫ' },
                { id: 'ENERGY', label: 'ЭНЕРГИЯ' },
                { id: 'FREE', label: 'БЕСПЛАТНО' },
            ];
        case 'SKINS':
            return [{ id: 'ALL', label: 'ОБЛИКИ' }];
        default:
            return [];
    }
};

export const getRarityColor = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
        case 'COMMON':
            return '#a0a0a0';
        case 'UNCOMMON':
            return '#10b981';
        case 'RARE':
            return '#3b82f6';
        case 'EPIC':
            return '#a855f7';
        case 'MYTHIC':
            return '#ef4444';
        case 'LEGENDARY':
            return '#f59e0b';
        default:
            return '#fff';
    }
};

export const rarityTranslation: Record<string, string> = {
    COMMON: 'ОБЫЧНЫЙ ПРЕДМЕТ',
    UNCOMMON: 'НЕОБЫЧНЫЙ ПРЕДМЕТ',
    RARE: 'РЕДКИЙ ПРЕДМЕТ',
    EPIC: 'ЭПИЧЕСКИЙ ПРЕДМЕТ',
    MYTHIC: 'МИФИЧЕСКИЙ ПРЕДМЕТ',
    LEGENDARY: 'ЛЕГЕНДАРНЫЙ ПРЕДМЕТ',
};

export const getItemStats = (item: ShopItem): IEquipmentStats | null => {
    const id = String(item.id);
    if (item.subTab === 'WEAPONS') return WEAPONS_DB[id] || null;
    if (item.subTab === 'HELMETS') return HELMS_DB[id] || null;
    if (item.subTab === 'ARMOR') return ARMOR_DB[id] || null;
    if (item.subTab === 'SHIELDS') return SHIELDS_DB[id] || null;
    if (item.subTab === 'PANTS') return PANTS_DB[id] || null;
    if (item.subTab === 'BOOTS') return BOOTS_DB[id] || null;
    if (item.subTab === 'SHOULDERS') return SHOULDERS_DB[id] || null;
    return null;
};
