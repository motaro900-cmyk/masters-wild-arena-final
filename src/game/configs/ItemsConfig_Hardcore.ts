import { ItemRarity, IBaseItem, IEquipmentStats } from './ItemsConfig';
import { resolveAssetObject } from '../../utils/assetPath';

const rawItemsDatabase: Record<string, IEquipmentStats> = {
    // --- ОРУЖИЕ ---
    '1': { 
        id: '1', name: 'Посох Ученика', attackBonus: 25, critBonus: 0.1, speedBonus: -0.05, 
        rarity: ItemRarity.COMMON, textureKey: 'weapon_staff', priceGold: 2500,
        image: '/assets/images/items/weapons/staff.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Старый деревянный посох. Излучает едва заметное тепло.'
    },
    '2': { 
        id: '2', name: 'Лук Лесника', attackBonus: 45, critBonus: 0.15, speedBonus: -0.1, 
        rarity: ItemRarity.RARE, textureKey: 'weapon_bow', priceGold: 18500,
        image: '/assets/images/items/weapons/bow.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Гибкий лук из белого ясеня.'
    },
    '3': { 
        id: '3', name: 'Клинки Тени', attackBonus: 65, critBonus: 0.25, speedBonus: -0.2, 
        rarity: ItemRarity.EPIC, textureKey: 'weapon_daggers', priceGem: 450,
        image: '/assets/images/items/weapons/daggers.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Пара зазубренных кинжалов.'
    },
    '4': { 
        id: '4', name: 'Топор Мясника', attackBonus: 90, critBonus: 0.1, speedBonus: 0.15, 
        rarity: ItemRarity.EPIC, textureKey: 'weapon_axe', priceGold: 55000,
        image: '/assets/images/items/weapons/axe.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Тяжелый топор для сокрушительных ударов.'
    },
    '8': { 
        id: '8', name: 'Лунный Меч', attackBonus: 75, critBonus: 0.2, speedBonus: 0.05, 
        rarity: ItemRarity.RARE, textureKey: 'weapon_moon_sword', priceGold: 22000,
        image: '/assets/images/items/weapons/moon_sword.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Клинок, сияющий лунным светом.'
    },
    '9': { 
        id: '9', name: 'Молот Феникса', attackBonus: 120, critBonus: 0.15, speedBonus: 0.3, 
        rarity: ItemRarity.MYTHIC, textureKey: 'weapon_phoenix_hammer', priceGem: 1200,
        image: '/assets/images/items/weapons/phoenix_hammer.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Огненный молот из сердца вулкана.'
    },
    '10': { 
        id: '10', name: 'Посох Бездны', attackBonus: 150, critBonus: 0.3, speedBonus: 0.0, 
        rarity: ItemRarity.LEGENDARY, textureKey: 'weapon_void_staff', priceGem: 2500,
        image: '/assets/images/items/weapons/void_staff.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Пожирает свет и надежду.'
    },

    // --- ШЛЕМЫ ---
    'h1': { 
        id: 'h1', name: 'Корона Правителя', defenseBonus: 25, hpBonus: 200, 
        rarity: ItemRarity.EPIC, textureKey: 'helm_crown', priceGem: 350,
        image: '/assets/images/items/helms/helm_crown.png', mainTab: 'ARSENAL', subTab: 'HELMETS',
        desc: 'Символ власти.'
    },
    'h5': { 
        id: 'h5', name: 'Паровой Шлем', defenseBonus: 20, hpBonus: 150, speedBonus: -0.05, 
        rarity: ItemRarity.RARE, textureKey: 'helm_steampunk', priceGold: 12500,
        image: '/assets/images/items/helms/helm_steampunk.png', mainTab: 'ARSENAL', subTab: 'HELMETS',
        desc: 'Стимпанк-технологии.'
    },

    // --- БРОНЯ ---
    'a1': { 
        id: 'a1', name: 'Костяной Доспех', defenseBonus: 40, hpBonus: 400, speedBonus: -0.05, 
        rarity: ItemRarity.RARE, textureKey: 'armor_bone', priceGold: 25000,
        image: '/assets/images/items/armor/armor_bone.png', mainTab: 'ARSENAL', subTab: 'ARMOR',
        desc: 'Броня из костей дракона.'
    },
    'a2': { 
        id: 'a2', name: 'Панцирь Льва', defenseBonus: 80, hpBonus: 800, 
        rarity: ItemRarity.EPIC, textureKey: 'armor_lion', priceGem: 650,
        image: '/assets/images/items/armor/armor_lion.png', mainTab: 'ARSENAL', subTab: 'ARMOR',
        desc: 'Тяжелая золоченая броня.'
    },

    // --- ЩИТЫ ---
    's1': { 
        id: 's1', name: 'Королевский Щит', defenseBonus: 60, hpBonus: 600, 
        rarity: ItemRarity.EPIC, textureKey: 'royal_shield', priceGold: 45000,
        image: '/assets/images/items/shields/royal_shield.png', mainTab: 'ARSENAL', subTab: 'SHIELDS',
        desc: 'Чистая сталь и золото.'
    },

    // --- СЛАБОЕ СНАРЯЖЕНИЕ (Стартовое для покупки) ---
    'broken_sword': { 
        id: 'broken_sword', name: 'Обломок Меча', priceGold: 800, 
        image: '/assets/images/items/weapons/broken_sword.png', rarity: ItemRarity.COMMON, 
        mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Едва держится.', textureKey: 'weapon_broken' 
    },
    'rusty_dagger': { 
        id: 'rusty_dagger', name: 'Ржавый Кинжал', priceGold: 1200, 
        image: '/assets/images/items/weapons/rusty_dagger.png', rarity: ItemRarity.COMMON, 
        mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Ржавый, но острый.', textureKey: 'weapon_dagger_rusty' 
    },

    // --- БАНК (Курс обмена) ---
    '20': { id: '20', name: 'Мешочек золота', priceGem: 50, image: '/assets/images/shop/bank_gold_small.png', rarity: ItemRarity.COMMON, mainTab: 'BANK', subTab: 'GOLD', desc: '1,000 монет.', amount: 1000 },
    '30': { id: '30', name: 'Горсть алмазов', priceGold: 5000, image: '/assets/images/shop/bank_almaz_small.png', rarity: ItemRarity.RARE, mainTab: 'BANK', subTab: 'GEMS', desc: '100 алмазов.', amount: 100 },
    '40': { id: '40', name: 'Малый Эликсир', priceGem: 25, image: '/assets/images/shop/bank_energy_1.png', rarity: ItemRarity.COMMON, mainTab: 'BANK', subTab: 'ENERGY', desc: '50 энергии.', amount: 50 },

    // --- БАЗОВОЕ (Не для продажи) ---
    'pan': { id: 'pan', name: 'Боевая Сковородка', priceGold: 0, image: '/assets/images/items/weapons/pan.png', rarity: ItemRarity.EPIC, mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_pan', attackBonus: 50, desc: 'Тяжелая сковорода.' },
    'stick': { id: 'stick', name: 'Дубовая Палка', priceGold: 0, image: '/assets/images/items/weapons/stick.png', rarity: ItemRarity.COMMON, mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_stick', attackBonus: 20, desc: 'Простая палка.' },
};

export const ITEMS_DATABASE: Record<string, IBaseItem | IEquipmentStats> = Object.fromEntries(
    Object.entries(rawItemsDatabase).map(([key, item]) => [
        key,
        { ...item, image: resolveAssetObject(item.image) }
    ])
) as Record<string, IBaseItem | IEquipmentStats>;
