
export enum ItemRarity {
    COMMON = 'COMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    MYTHIC = 'MYTHIC',
    LEGENDARY = 'LEGENDARY'
}

export interface IBaseItem {
    id: string;
    name: string;
    desc: string;
    image: string;
    rarity: ItemRarity | string;
    mainTab: 'ARSENAL' | 'ALCHEMY' | 'SKINS' | 'BANK';
    subTab: string;
    priceGold?: number;
    priceGem?: number;
    priceStars?: number;
    isAd?: boolean;
    amount?: number;
}

export interface IEquipmentStats extends IBaseItem {
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;
    speedBonus?: number;
    critBonus?: number;
    textureKey?: string;
    visualSocket?: 'MainHand' | 'OffHand' | 'Head' | 'Chest';
}

const resolveAssetPath = (path: string) => path;

const rawItemsDatabase: Record<string, IBaseItem | IEquipmentStats> = {
    // --- ОРУЖИЕ ---
    'fire_magic_sword': { 
        id: 'fire_magic_sword', 
        name: 'Пламенный Магический Меч', 
        priceGem: 2000, 
        image: '/assets/images/items/weapons/fire_magic_sword.png', 
        rarity: 'MYTHIC', 
        mainTab: 'ARSENAL', 
        subTab: 'WEAPONS', 
        textureKey: 'weapon_fire_sword', 
        visualSocket: 'MainHand',
        attackBonus: 180, 
        critBonus: 0.2,
        desc: 'Меч, выкованный в недрах магического вулкана. Пылает вечным огнем.' 
    },
    'heavy_war_axe': { 
        id: 'heavy_war_axe', 
        name: 'Тяжелый Боевой Топор', 
        priceGold: 45000, 
        priceGem: 500,
        image: '/assets/images/items/weapons/heavy_war_axe.png', 
        rarity: 'EPIC', 
        mainTab: 'ARSENAL', 
        subTab: 'WEAPONS', 
        textureKey: 'weapon_heavy_axe', 
        visualSocket: 'MainHand',
        attackBonus: 110, 
        desc: 'Огромный топор, способный расколоть даже самый крепкий щит.' 
    },
    'stick': { id: 'stick', name: 'Дубовая Палка', priceGold: 0, image: '/assets/images/items/weapons/stick.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_stick', attackBonus: 20, desc: 'Просто крепкая палка.' },
    'staff': { id: 'staff', name: 'Посох Ученика', priceGold: 1200, image: '/assets/images/items/weapons/staff.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_staff', attackBonus: 35, desc: 'Деревянный посох начинающего мага.' },
    'sling': { id: 'sling', name: 'Праща Кочевника', priceGold: 1800, image: '/assets/images/items/weapons/sling.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_sling', attackBonus: 28, desc: 'Простое, но эффективное метательное оружие.' },
    'bow': { id: 'bow', name: 'Охотничий Лук', priceGold: 8500, image: '/assets/images/items/weapons/bow.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_bow', attackBonus: 55, critBonus: 0.1, desc: 'Хороший лук для охоты на крупную дичь.' },
    'axe': { id: 'axe', name: 'Боевой Топор', priceGold: 15000, priceGem: 250, image: '/assets/images/items/weapons/axe.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_axe', attackBonus: 85, desc: 'Тяжелый топор, прорубающий любую броню.' },
    'daggers': { id: 'daggers', name: 'Кинжалы Убийцы', priceGem: 450, image: '/assets/images/items/weapons/daggers.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_daggers', attackBonus: 75, critBonus: 0.25, desc: 'Пара острых кинжалов для быстрых атак.' },
    'pan': { id: 'pan', name: 'Боевая Сковородка', priceGem: 600, image: '/assets/images/items/weapons/pan.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_pan', attackBonus: 100, desc: 'Тяжелая чугунная сковорода. Бьет больно.' },
    'moon_sword': { id: 'moon_sword', name: 'Лунный Клинок', priceGem: 1200, image: '/assets/images/items/weapons/moon_sword.png', rarity: 'MYTHIC', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_moon_sword', attackBonus: 150, critBonus: 0.15, desc: 'Клинок, сияющий холодным светом луны.' },
    'void_staff': { id: 'void_staff', name: 'Посох Бездны', priceGem: 2500, image: '/assets/images/items/weapons/void_staff.png', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_void_staff', attackBonus: 220, desc: 'Мощный артефакт, черпающий силу из пустоты.' },
    'phoenix_hammer': { id: 'phoenix_hammer', name: 'Молот Феникса', priceGem: 5000, image: '/assets/images/items/weapons/phoenix_hammer.png', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_phoenix_hammer', attackBonus: 300, desc: 'Легендарный молот, пылающий вечным огнем.' },

    // --- ШЛЕМЫ ---
    'starter_helm': { id: 'starter_helm', name: 'Кожаный Шлем', priceGold: 0, image: '/assets/images/items/helms/starter_helm.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_leather', defenseBonus: 5, hpBonus: 50, desc: 'Простая защита головы.' },
    'bandana': { id: 'bandana', name: 'Бандана Пирата', priceGold: 1000, image: '/assets/images/items/helms/bandana.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_bandana', hpBonus: 80, desc: 'Защищает от солнца и придает грозный вид.' },
    'iron_helm': { id: 'iron_helm', name: 'Железный Шлем', priceGold: 5000, image: '/assets/images/items/helms/iron_helm.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_iron', defenseBonus: 15, hpBonus: 120, desc: 'Стандартный шлем пехотинца.' },
    'forest_hood': { id: 'forest_hood', name: 'Лесной Капюшон', priceGold: 12000, image: '/assets/images/items/helms/forest_hood.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_hood', defenseBonus: 10, hpBonus: 200, speedBonus: 0.05, desc: 'Идеален для маскировки в чаще.' },
    'bone_mask': { id: 'bone_mask', name: 'Костяная Маска', priceGold: 18000, priceGem: 200, image: '/assets/images/items/helms/bone_mask.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_bone', defenseBonus: 20, hpBonus: 150, desc: 'Маска древнего шамана.' },
    'helm_skull': { id: 'helm_skull', name: 'Шлем-Череп', priceGold: 25000, priceGem: 350, image: '/assets/images/items/helms/helm_skull.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_skull', defenseBonus: 25, hpBonus: 250, desc: 'Внушает ужас врагам.' },
    'helm_lion': { id: 'helm_lion', name: 'Шлем Льва', priceGem: 600, image: '/assets/images/items/helms/helm_lion.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_lion', defenseBonus: 40, hpBonus: 500, desc: 'Символ королевской власти и отваги.' },
    'helm_steampunk': { id: 'helm_steampunk', name: 'Паровой Шлем', priceGem: 800, image: '/assets/images/items/helms/helm_steampunk.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_steam', defenseBonus: 45, hpBonus: 450, desc: 'Сложное устройство с медными линзами.' },
    'helm_crown': { id: 'helm_crown', name: 'Королевская Корона', priceGem: 1500, image: '/assets/images/items/helms/helm_crown.png', rarity: 'MYTHIC', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_crown', defenseBonus: 30, hpBonus: 1000, desc: 'Золотая корона, дарующая величие.' },
    'helm_fire': { id: 'helm_fire', name: 'Шлем Пламени', priceGem: 3000, image: '/assets/images/items/helms/helm_fire.png', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_fire', defenseBonus: 60, hpBonus: 1200, desc: 'Шлем, выкованный в сердце вулкана.' },

    // --- БРОНЯ ---
    'starter_armor': { id: 'starter_armor', name: 'Ученический Доспех', priceGold: 0, image: '/assets/images/items/armor/starter_armor.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_leather', defenseBonus: 10, hpBonus: 100, desc: 'Легкая броня для начинающих.' },
    'ragged_tunic': { id: 'ragged_tunic', name: 'Потертая Туника', priceGold: 800, image: '/assets/images/items/armor/ragged_tunic.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_tunic', hpBonus: 150, desc: 'Старая одежда, мало на что годная.' },
    'hunter_furs': { id: 'hunter_furs', name: 'Охотничьи Меха', priceGold: 6000, image: '/assets/images/items/armor/hunter_furs.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_furs', defenseBonus: 15, hpBonus: 300, desc: 'Теплая шкура, защищающая от когтей.' },
    'chainmail': { id: 'chainmail', name: 'Кольчуга', priceGold: 18500, priceGem: 250, image: '/assets/images/items/armor/chainmail.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_chain', defenseBonus: 35, hpBonus: 500, desc: 'Надежное плетение из стальных колец.' },
    'spiked_leather': { id: 'spiked_leather', name: 'Шипованная Кожа', priceGold: 28000, priceGem: 400, image: '/assets/images/items/armor/spiked_leather.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_spikes', defenseBonus: 45, hpBonus: 600, desc: 'Броня, которая ранит атакующих.' },
    'armor_bone': { id: 'armor_bone', name: 'Костяной Доспех', priceGold: 45000, priceGem: 600, image: '/assets/images/items/armor/armor_bone.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_bone', defenseBonus: 60, hpBonus: 900, desc: 'Сделан из костей древних чудовищ.' },
    'armor_lion': { id: 'armor_lion', name: 'Доспех Льва', priceGem: 1200, image: '/assets/images/items/armor/armor_lion.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_lion', defenseBonus: 85, hpBonus: 1500, desc: 'Могучая броня с золотыми вставками.' },
    'armor_steampunk': { id: 'armor_steampunk', name: 'Паровой Доспех', priceGem: 1800, image: '/assets/images/items/armor/armor_steampunk.png', rarity: 'MYTHIC', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_steam', defenseBonus: 110, hpBonus: 1800, desc: 'Чудо инженерной мысли с котлом за спиной.' },
    'armor_phoenix': { id: 'armor_phoenix', name: 'Доспех Феникса', priceGem: 5000, image: '/assets/images/items/armor/armor_phoenix.png', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_phoenix', defenseBonus: 150, hpBonus: 3000, desc: 'Легендарный доспех, дарующий бессмертие.' },

    // --- ЩИТЫ ---
    'starter_shield': { id: 'starter_shield', name: 'Деревянный Баклер', priceGold: 0, image: '/assets/images/items/shields/starter_shield.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_wood', defenseBonus: 8, hpBonus: 40, desc: 'Маленький щит из досок.' },
    'plank_shield': { id: 'plank_shield', name: 'Дощатый Щит', priceGold: 1500, image: '/assets/images/items/shields/plank_shield.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_plank', defenseBonus: 12, hpBonus: 100, desc: 'Грубо сколоченный щит.' },
    'dented_buckler': { id: 'dented_buckler', name: 'Помятый Баклер', priceGold: 3500, image: '/assets/images/items/shields/dented_buckler.png', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_dented', defenseBonus: 18, hpBonus: 150, desc: 'Видавший виды металлический щит.' },
    'steel_shield': { id: 'steel_shield', name: 'Стальной Щит', priceGold: 14000, image: '/assets/images/items/shields/steel_shield.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_steel', defenseBonus: 35, hpBonus: 400, desc: 'Надежный щит из каленой стали.' },
    'bone_shield': { id: 'bone_shield', name: 'Костяной Щит', priceGold: 22500, priceGem: 300, image: '/assets/images/items/shields/bone_shield.png', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_bone', defenseBonus: 45, hpBonus: 600, desc: 'Щит из черепа огромного монстра.' },
    'royal_shield': { id: 'royal_shield', name: 'Королевский Щит', priceGem: 800, image: '/assets/images/items/shields/royal_shield.png', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_royal', defenseBonus: 75, hpBonus: 1200, desc: 'Украшен гербом королевской династии.' },

    // --- АЛХИМИЯ ---
    'hp_small': { id: 'hp_small', name: 'Зелье Жизни', priceGold: 500, priceGem: 10, image: '/assets/images/items/potions/hp_small.png', rarity: 'COMMON', mainTab: 'ALCHEMY', subTab: 'POTIONS', desc: 'Восстанавливает 20% здоровья.' },
    'strength': { id: 'strength', name: 'Зелье Силы', priceGold: 1500, priceGem: 25, image: '/assets/images/items/potions/strength.png', rarity: 'RARE', mainTab: 'ALCHEMY', subTab: 'POTIONS', desc: 'Увеличивает урон на 30% на бой.' },
    'defense_potion': { id: 'defense_potion', name: 'Зелье Защиты', priceGold: 1500, priceGem: 25, image: '/assets/images/items/potions/defense.png', rarity: 'RARE', mainTab: 'ALCHEMY', subTab: 'POTIONS', desc: 'Увеличивает защиту на 30% на бой.' },
    'speed_potion': { id: 'speed_potion', name: 'Зелье Скорости', priceGold: 1500, priceGem: 25, image: '/assets/images/items/potions/speed.png', rarity: 'RARE', mainTab: 'ALCHEMY', subTab: 'POTIONS', desc: 'Увеличивает скорость на 30% на бой.' },
    'crit_potion': { id: 'crit_potion', name: 'Зелье Крита', priceGold: 3000, priceGem: 50, image: '/assets/images/items/potions/crit.png', rarity: 'EPIC', mainTab: 'ALCHEMY', subTab: 'POTIONS', desc: 'Увеличивает шанс крита на 20%.' },

    // --- БАНК ---
    '20': { id: '20', name: 'Мешочек золота', priceGem: 50, image: '/assets/images/shop/bank_gold_small.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GOLD', desc: '1,000 монет.', amount: 1000 },
    '21': { id: '21', name: 'Сундук золота', priceGem: 250, image: '/assets/images/shop/bank_gold_medium.png', rarity: 'RARE', mainTab: 'BANK', subTab: 'GOLD', desc: '6,000 монет.', amount: 6000 },
    '22': { id: '22', name: 'Сокровищница золота', priceGem: 1000, image: '/assets/images/shop/bank_gold_large.png', rarity: 'EPIC', mainTab: 'BANK', subTab: 'GOLD', desc: '30,000 монет.', amount: 30000 },
    
    'gems_100': { id: 'gems_100', name: 'Мешочек алмазов', priceStars: 50, image: '/assets/images/shop/bank_almaz_small.png', rarity: 'RARE', mainTab: 'BANK', subTab: 'GEMS', desc: '100 алмазов.', amount: 100 },
    'gems_500': { id: 'gems_500', name: 'Сундук алмазов', priceStars: 200, image: '/assets/images/shop/bank_almaz_medium.png', rarity: 'EPIC', mainTab: 'BANK', subTab: 'GEMS', desc: '500 алмазов.', amount: 500 },
    'gems_1000': { id: 'gems_1000', name: 'Сокровищница алмазов', priceStars: 450, image: '/assets/images/shop/bank_almaz_large.png', rarity: 'LEGENDARY', mainTab: 'BANK', subTab: 'GEMS', desc: '1,200 алмазов.', amount: 1200 },

    'ad_gold': { id: 'ad_gold', name: 'Бесплатное золото', isAd: true, image: '/assets/images/shop/bank_gold_small.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GOLD', desc: 'Просмотр рекламы.', amount: 1000 },
    'ad_gem': { id: 'ad_gem', name: 'Бесплатные алмазы', isAd: true, image: '/assets/images/shop/bank_almaz_small.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GEMS', desc: 'Просмотр рекламы.', amount: 10 },
    'ad_energy': { id: 'ad_energy', name: 'Бесплатная энергия', isAd: true, image: '/assets/images/shop/bank_energy_1.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'ENERGY', desc: 'Просмотр рекламы.', amount: 10 },

    '40': { id: '40', name: 'Малый эликсир', priceGem: 50, image: '/assets/images/shop/bank_energy_1.png', rarity: 'COMMON', mainTab: 'BANK', subTab: 'ENERGY', desc: '50 энергии.', amount: 50 },
    '41': { id: '41', name: 'Средний эликсир', priceGem: 200, image: '/assets/images/shop/bank_energy_2.png', rarity: 'RARE', mainTab: 'BANK', subTab: 'ENERGY', desc: '250 энергии.', amount: 250 },
    '42': { id: '42', name: 'Великий эликсир', priceGem: 500, image: '/assets/images/shop/bank_energy_3.png', rarity: 'EPIC', mainTab: 'BANK', subTab: 'ENERGY', desc: '750 энергии.', amount: 750 },
};

export const ITEMS_DATABASE: Record<string, IBaseItem | IEquipmentStats> = Object.fromEntries(
    Object.entries(rawItemsDatabase).map(([key, item]) => [
        key,
        { ...item, image: resolveAssetPath(item.image) }
    ])
) as Record<string, IBaseItem | IEquipmentStats>;

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
