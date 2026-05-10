import { resolveAssetPath } from '../../utils/assetPath';

/**
 * @enum {string}
 * Редкость предметов для визуальной дифференциации
 */
export enum ItemRarity {
    COMMON = 'COMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    MYTHIC = 'MYTHIC',
    LEGENDARY = 'LEGENDARY'
}

/**
 * @interface IBaseItem
 * Базовые поля для любого предмета в игре
 */
export interface IBaseItem {
    id: string;
    name: string;
    image: string;
    rarity: ItemRarity | string;
    desc: string;
    // Теперь поддерживаем обе валюты одновременно
    priceGold?: number; 
    priceGem?: number;
    mainTab: 'ARSENAL' | 'ALCHEMY' | 'SKINS' | 'BANK';
    subTab: string;
    amount?: number;
    flavor?: string;
    badge?: string;
}

/**
 * @interface IEquipmentStats
 */
export interface IEquipmentStats extends IBaseItem {
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;
    critBonus?: number;
    speedBonus?: number;
    // Новые расширенные характеристики
    evasion?: number;        // Шанс уклонения (%)
    resilience?: number;     // Стойкость (снижение крита по себе)
    lifesteal?: number;      // Вампиризм (%)
    penetration?: number;    // Пробитие брони
    critDamage?: number;     // Множитель крит. урона (базовый 1.5)
    textureKey?: string;
}

/**
 * Глобальная база данных всех предметов в игре.
 * СИСТЕМА ДВОЙНОЙ ВАЛЮТЫ: Игрок сам выбирает способ оплаты.
 */
const rawItemsDatabase: Record<string, IEquipmentStats> = {
    // --- ОРУЖИЕ (WEAPONS) ---
    '1': { 
        id: '1', name: 'Посох Ученика', attackBonus: 25, critBonus: 0.1, speedBonus: -0.05, 
        rarity: ItemRarity.COMMON, textureKey: 'weapon_staff', 
        priceGold: 2500, priceGem: 45,
        image: '/assets/images/items/weapons/staff.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Старый деревянный посох. Излучает едва заметное тепло.'
    },
    '2': { 
        id: '2', name: 'Лук Лесника', attackBonus: 45, critBonus: 0.15, speedBonus: -0.1, 
        rarity: ItemRarity.RARE, textureKey: 'weapon_bow', 
        priceGold: 18500, priceGem: 250,
        image: '/assets/images/items/weapons/bow.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Гибкий лук из белого ясеня.'
    },
    '3': { 
        id: '3', name: 'Клинки Тени', attackBonus: 65, critBonus: 0.25, speedBonus: -0.2, 
        rarity: ItemRarity.EPIC, textureKey: 'weapon_daggers', 
        priceGold: 45000, priceGem: 550,
        image: '/assets/images/items/weapons/daggers.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Пара зазубренных кинжалов, покрытых ядом.'
    },
    '4': { 
        id: '4', name: 'Топор Мясника', attackBonus: 90, critBonus: 0.1, speedBonus: 0.15, 
        rarity: ItemRarity.EPIC, textureKey: 'weapon_axe', 
        priceGold: 55000, priceGem: 650,
        image: '/assets/images/items/weapons/axe.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Тяжелый топор для сокрушительных ударов.'
    },
    '8': { 
        id: '8', name: 'Лунный Меч', attackBonus: 75, critBonus: 0.2, speedBonus: 0.05, 
        rarity: ItemRarity.RARE, textureKey: 'weapon_moon_sword', 
        priceGold: 28000, priceGem: 380,
        image: '/assets/images/items/weapons/moon_sword.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Древний клинок, сияющий в темноте.'
    },
    '9': { 
        id: '9', name: 'Молот Феникса', attackBonus: 120, critBonus: 0.15, speedBonus: 0.3, 
        rarity: 'MYTHIC', textureKey: 'weapon_phoenix_hammer', 
        priceGold: 150000, priceGem: 1500,
        image: '/assets/images/items/weapons/phoenix_hammer.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Выкован в жерле вулкана.'
    },
    '10': { 
        id: '10', name: 'Посох Бездны', attackBonus: 150, critBonus: 0.3, speedBonus: 0.0, 
        rarity: ItemRarity.LEGENDARY, textureKey: 'weapon_void_staff', 
        priceGold: 350000, priceGem: 3500,
        image: '/assets/images/items/weapons/void_staff.png', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Кристалл на вершине поглощает свет и надежду.'
    },
    'broken_sword': { 
        id: 'broken_sword', name: 'Обломок Меча', 
        priceGold: 950, priceGem: 15,
        image: '/assets/images/items/weapons/broken_sword.png', rarity: 'COMMON', 
        mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Раньше это был грозный клинок.', textureKey: 'weapon_broken' 
    },
    'rusty_dagger': { 
        id: 'rusty_dagger', name: 'Ржавый Кинжал', 
        priceGold: 1400, priceGem: 25,
        image: '/assets/images/items/weapons/rusty_dagger.png', rarity: 'COMMON', 
        mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Осторожно, можно подхватить столбняк.', textureKey: 'weapon_dagger_rusty' 
    },

    // --- ШЛЕМЫ (HELMETS) ---
    'h1': { 
        id: 'h1', name: 'Корона Правителя', defenseBonus: 25, hpBonus: 200, 
        rarity: ItemRarity.EPIC, textureKey: 'helm_crown', 
        priceGold: 65000, priceGem: 850,
        image: '/assets/images/items/helms/helm_crown.png', mainTab: 'ARSENAL', subTab: 'HELMETS',
        desc: 'Символ власти и мудрости древних королей.'
    },
    'h2': { 
        id: 'h2', name: 'Шлем Пламени', defenseBonus: 15, hpBonus: 100, critBonus: 0.05, 
        rarity: ItemRarity.RARE, textureKey: 'helm_fire', 
        priceGold: 15500, priceGem: 180,
        image: '/assets/images/items/helms/helm_fire.png', mainTab: 'ARSENAL', subTab: 'HELMETS',
        desc: 'Раскаленный металл, который не обжигает владельца.'
    },
    'h3': { 
        id: 'h3', name: 'Шлем Льва', defenseBonus: 35, hpBonus: 300, 
        rarity: ItemRarity.EPIC, textureKey: 'helm_lion', 
        priceGold: 38000, priceGem: 450,
        image: '/assets/images/items/helms/helm_lion.png', mainTab: 'ARSENAL', subTab: 'HELMETS',
        desc: 'Вдохновляет союзников своим величественным видом.'
    },
    'h4': { 
        id: 'h4', name: 'Шлем Черепа', defenseBonus: 50, hpBonus: 500, attackBonus: 20, 
        rarity: 'MYTHIC', textureKey: 'helm_skull', 
        priceGold: 120000, priceGem: 1800,
        image: '/assets/images/items/helms/helm_skull.png', mainTab: 'ARSENAL', subTab: 'HELMETS',
        desc: 'Наводит ужас на врагов самим своим присутствием.'
    },
    'iron_helm': { 
        id: 'iron_helm', name: 'Шлем Стража', 
        priceGold: 12500, priceGem: 150,
        image: '/assets/images/items/helms/iron_helm.png', rarity: 'RARE', 
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Надежный стальной шлем.', textureKey: 'helm_iron' 
    },

    // --- БРОНЯ (ARMOR) ---
    'a1': { 
        id: 'a1', name: 'Костяной Доспех', defenseBonus: 40, hpBonus: 400, speedBonus: -0.05, 
        rarity: ItemRarity.RARE, textureKey: 'armor_bone', 
        priceGold: 28000, priceGem: 350,
        image: '/assets/images/items/armor/armor_bone.png', mainTab: 'ARSENAL', subTab: 'ARMOR',
        desc: 'Легкая и прочная броня из костей древних драконов.'
    },
    'a2': { 
        id: 'a2', name: 'Панцирь Льва', defenseBonus: 80, hpBonus: 800, 
        rarity: ItemRarity.EPIC, textureKey: 'armor_lion', 
        priceGold: 85000, priceGem: 1200,
        image: '/assets/images/items/armor/armor_lion.png', mainTab: 'ARSENAL', subTab: 'ARMOR',
        desc: 'Тяжелая золоченая броня для истинных лидеров.'
    },
    'chainmail': { 
        id: 'chainmail', name: 'Кольчуга', 
        priceGold: 18500, priceGem: 220,
        image: '/assets/images/items/armor/chainmail.png', rarity: 'RARE', 
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Стальные кольца для защиты торса.', textureKey: 'armor_chainmail' 
    },

    // --- ЩИТЫ (SHIELDS) ---
    's1': { 
        id: 's1', name: 'Королевский Щит', defenseBonus: 60, hpBonus: 600, 
        rarity: ItemRarity.EPIC, textureKey: 'royal_shield', 
        priceGold: 42000, priceGem: 550,
        image: '/assets/images/items/shields/royal_shield.png', mainTab: 'ARSENAL', subTab: 'SHIELDS',
        desc: 'Выкован из чистой стали и украшен золотым гербом.'
    },
    'steel_shield': { 
        id: 'steel_shield', name: 'Стальной Щит', 
        priceGold: 22500, priceGem: 320,
        image: '/assets/images/items/shields/steel_shield.png', rarity: 'EPIC', 
        mainTab: 'ARSENAL', subTab: 'SHIELDS', desc: 'Классический рыцарский щит.', textureKey: 'shield_steel' 
    },
    // --- АЛХИМИЯ (ALCHEMY) ---
    'p1': { 
        id: 'p1', name: 'Зелье Здоровья', rarity: 'COMMON', 
        priceGold: 1200, priceGem: 15,
        image: '/assets/images/items/potions/hp_small.png', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Мгновенно восстанавливает 500 ХП.'
    },
    'p2': { 
        id: 'p2', name: 'Зелье Силы', rarity: 'RARE', 
        priceGold: 3500, priceGem: 45,
        image: '/assets/images/items/potions/strength.png', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Увеличивает атаку на 10% до конца боя.'
    },
    'p3': { 
        id: 'p3', name: 'Зелье Защиты', rarity: 'RARE', 
        priceGold: 3500, priceGem: 45,
        image: '/assets/images/items/potions/defense.png', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Увеличивает защиту на 15% до конца боя.'
    },
    'p4': { 
        id: 'p4', name: 'Эликсир Охотника', rarity: 'EPIC', 
        priceGold: 8500, priceGem: 120,
        image: '/assets/images/items/potions/crit.png', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Повышает крит. шанс и скорость на 20%.'
    },
    'p5': { 
        id: 'p5', name: 'Зелье Скорости', rarity: 'RARE', 
        priceGold: 2800, priceGem: 35,
        image: '/assets/images/items/potions/speed.png', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Увеличивает скорость передвижения и частоту атак.'
    },

    // --- БАНК ---
    '20': { id: '20', name: 'Мешочек золота', priceGem: 50, image: '/assets/images/shop/bank_gold_small.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GOLD', desc: '1,000 монет.', amount: 1000 },
    '21': { id: '21', name: 'Кошель золота', priceGem: 250, image: '/assets/images/shop/bank_gold_medium.png', rarity: 'RARE', mainTab: 'BANK', subTab: 'GOLD', desc: '6,000 монет.', amount: 6000 },
    '22': { id: '22', name: 'Сундук золота', priceGem: 1000, image: '/assets/images/shop/bank_gold_large.png', rarity: 'EPIC', mainTab: 'BANK', subTab: 'GOLD', desc: '30,000 монет.', amount: 30000 },
    
    '30': { id: '30', name: 'Горсть алмазов', priceGold: 25000, image: '/assets/images/shop/bank_almaz_small.png', rarity: 'RARE', mainTab: 'BANK', subTab: 'GEMS', desc: '100 алмазов.', amount: 100 },
    '31': { id: '31', name: 'Мешок алмазов', priceGold: 120000, image: '/assets/images/shop/bank_almaz_medium.png', rarity: 'EPIC', mainTab: 'BANK', subTab: 'GEMS', desc: '500 алмазов.', amount: 500 },
    '32': { id: '32', name: 'Сундук алмазов', priceGold: 500000, image: '/assets/images/shop/bank_almaz_large.png', rarity: 'MYTHIC', mainTab: 'BANK', subTab: 'GEMS', desc: '2,500 алмазов.', amount: 2500 },
    
    '40': { id: '40', name: 'Малый Эликсир', priceGem: 50, image: '/assets/images/shop/bank_energy_1.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'ENERGY', desc: '50 энергии.', amount: 50 },
    '41': { id: '41', name: 'Средний Эликсир', priceGem: 200, image: '/assets/images/shop/bank_energy_2.png', rarity: 'RARE', mainTab: 'BANK', subTab: 'ENERGY', desc: '250 энергии.', amount: 250 },
    '42': { id: '42', name: 'Большой Эликсир', priceGem: 500, image: '/assets/images/shop/bank_energy_3.png', rarity: 'EPIC', mainTab: 'BANK', subTab: 'ENERGY', desc: '750 энергии.', amount: 750 },

    // --- СТАРТОВОЕ ---
    'pan': { id: 'pan', name: 'Боевая Сковородка', priceGold: 0, image: '/assets/images/items/weapons/pan.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_pan', attackBonus: 50, desc: 'Тяжелая чугунная сковорода. Бьет больно, жарит вкусно.' },
    'stick': { id: 'stick', name: 'Дубовая Палка', priceGold: 0, image: '/assets/images/items/weapons/stick.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_stick', attackBonus: 20, desc: 'Просто крепкая палка, найденная в лесу.' },
    'starter_helm': { id: 'starter_helm', name: 'Кожаный Шлем', priceGold: 0, image: '/assets/images/items/helms/starter_helm.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_leather', defenseBonus: 5, hpBonus: 50, desc: 'Простая защита головы из потертой кожи.' },
    'starter_armor': { id: 'starter_armor', name: 'Ученический Доспех', priceGold: 0, image: '/assets/images/items/armor/starter_armor.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_leather', defenseBonus: 10, hpBonus: 100, desc: 'Легкая броня для начинающих воинов.' },
    'starter_shield': { id: 'starter_shield', name: 'Деревянный Баклер', priceGold: 0, image: '/assets/images/items/shields/starter_shield.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_wood', defenseBonus: 8, hpBonus: 40, desc: 'Маленький щит из дубовых досок.' },
};

export const ITEMS_DATABASE: Record<string, IBaseItem | IEquipmentStats> = Object.fromEntries(
    Object.entries(rawItemsDatabase).map(([key, item]) => [
        key,
        { ...item, image: resolveAssetPath(item.image) }
    ])
) as Record<string, IBaseItem | IEquipmentStats>;

/**
 * Хелпер для расчета "Мощи" (Gear Score) предмета
 */
export const calculateItemPower = (item: any): number => {
    if (!item) return 0;
    let power = 0;
    if (item.attackBonus) power += item.attackBonus * 1.5;
    if (item.defenseBonus) power += item.defenseBonus * 1.2;
    if (item.hpBonus) power += item.hpBonus * 0.1;
    if (item.critBonus) power += item.critBonus * 500;
    if (item.speedBonus) power += item.speedBonus * 300;
    
    const rarityMult: Record<string, number> = {
        COMMON: 1, RARE: 1.5, EPIC: 2.5, MYTHIC: 4, LEGENDARY: 6
    };
    return Math.round(power * (rarityMult[item.rarity] || 1)) || 10;
};

export const WEAPONS_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'WEAPONS')) as Record<string, IEquipmentStats>;
export const HELMS_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'HELMETS')) as Record<string, IEquipmentStats>;
export const ARMOR_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'ARMOR')) as Record<string, IEquipmentStats>;
export const SHIELDS_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'SHIELDS')) as Record<string, IEquipmentStats>;
