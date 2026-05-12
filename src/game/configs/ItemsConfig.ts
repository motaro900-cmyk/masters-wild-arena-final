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
    priceStars?: number; // Цена в VK Stars
    isAd?: boolean;      // Предмет за рекламу
    mainTab: 'ARSENAL' | 'ALCHEMY' | 'SKINS' | 'BANK';
    subTab: string;
    amount?: number;
    flavor?: string;
    badge?: string;
    spriteClass?: string;
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
    'axe_fire': { id: 'axe_fire', name: 'Топор Огненной Гривы', attackBonus: 450, critBonus: 0.2, rarity: 'LEGENDARY', priceGem: 2500, image: '', spriteClass: 'sprite-weapons wpn-1', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Легендарное оружие, выкованное в сердце вулкана.' },
    'dagger_poison': { id: 'dagger_poison', name: 'Ядовитые Клыки', attackBonus: 180, speedBonus: 0.15, rarity: 'EPIC', priceGem: 800, image: '', spriteClass: 'sprite-weapons wpn-2', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Клинки, пропитанные смертоносным ядом древней кобры.' },
    'mace_skull': { id: 'mace_skull', name: 'Жезл Некроманта', attackBonus: 320, hpBonus: 500, rarity: 'MYTHIC', priceGem: 1500, image: '', spriteClass: 'sprite-weapons wpn-3', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Дарует власть над тенями и душами павших.' },
    'sword_rune': { id: 'sword_rune', name: 'Меч Лунного Руна', attackBonus: 210, critBonus: 0.1, rarity: 'EPIC', priceGem: 750, image: '', spriteClass: 'sprite-weapons wpn-4', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Светится мягким светом, когда рядом враги.' },
    'gun_steam': { id: 'gun_steam', name: 'Паровой Карабин', attackBonus: 120, speedBonus: 0.05, rarity: 'RARE', priceGold: 15000, image: '', spriteClass: 'sprite-weapons wpn-5', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Шедевр инженерной мысли гномов.' },
    'staff_cosmic': { id: 'staff_cosmic', name: 'Посох Галактики', attackBonus: 500, critBonus: 0.25, rarity: 'LEGENDARY', priceGem: 3000, image: '', spriteClass: 'sprite-weapons wpn-6', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Содержит в себе энергию рождающихся звезд.' },
    'crossbow_heavy': { id: 'crossbow_heavy', name: 'Механический Арбалет', attackBonus: 140, rarity: 'RARE', priceGold: 12000, image: '', spriteClass: 'sprite-weapons wpn-7', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Стреляет болтами, пробивающими любую броню.' },
    'claws_blue': { id: 'claws_blue', name: 'Когти Синего Пламени', attackBonus: 350, speedBonus: 0.2, rarity: 'MYTHIC', priceGem: 1200, image: '', spriteClass: 'sprite-weapons wpn-9', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Призрачное пламя сжигает врагов изнутри.' },

    '1': {
        id: '1', name: 'Посох Ученика', attackBonus: 25, critBonus: 0.1, speedBonus: -0.05,
        rarity: ItemRarity.COMMON, textureKey: 'weapon_staff',
        priceGold: 2500, priceGem: 45,
        image: '/assets/images/items/weapons/staff.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        spriteClass: 'sprite-item sprite-weapon pos-1',
        desc: 'Старый деревянный посох. Излучает едва заметное тепло.'
    },
    '2': {
        id: '2', name: 'Лук Лесника', attackBonus: 45, critBonus: 0.15, speedBonus: -0.1,
        rarity: ItemRarity.RARE, textureKey: 'weapon_bow',
        priceGold: 18500, priceGem: 250,
        image: '/assets/images/items/weapons/bow.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        spriteClass: 'sprite-item sprite-weapon pos-2',
        desc: 'Гибкий лук из белого ясеня.'
    },
    '3': {
        id: '3', name: 'Клинки Тени', attackBonus: 65, critBonus: 0.25, speedBonus: -0.2,
        rarity: ItemRarity.EPIC, textureKey: 'weapon_daggers',
        priceGold: 45000, priceGem: 550,
        image: '/assets/images/items/weapons/daggers.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        spriteClass: 'sprite-item sprite-weapon pos-3',
        desc: 'Пара зазубренных кинжалов, покрытых ядом.'
    },
    '4': {
        id: '4', name: 'Топор Мясника', attackBonus: 90, critBonus: 0.1, speedBonus: 0.15,
        rarity: ItemRarity.EPIC, textureKey: 'weapon_axe',
        priceGold: 55000, priceGem: 650,
        image: '/assets/images/items/weapons/axe.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Тяжелый топор для сокрушительных ударов.'
    },
    '8': {
        id: '8', name: 'Лунный Меч', attackBonus: 75, critBonus: 0.2, speedBonus: 0.05,
        rarity: ItemRarity.RARE, textureKey: 'weapon_moon_sword',
        priceGold: 28000, priceGem: 380,
        image: '/assets/images/items/weapons/moon_sword.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Древний клинок, сияющий в темноте.'
    },
    '9': {
        id: '9', name: 'Молот Феникса', attackBonus: 120, critBonus: 0.15, speedBonus: 0.3,
        rarity: 'MYTHIC', textureKey: 'weapon_phoenix_hammer',
        priceGold: 150000, priceGem: 1500,
        image: '/assets/images/items/weapons/phoenix_hammer.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Выкован в жерле вулкана.'
    },
    '10': {
        id: '10', name: 'Посох Бездны', attackBonus: 150, critBonus: 0.3, speedBonus: 0.0,
        rarity: ItemRarity.LEGENDARY, textureKey: 'weapon_void_staff',
        priceGold: 350000, priceGem: 3500,
        image: '/assets/images/items/weapons/void_staff.webp', mainTab: 'ARSENAL', subTab: 'WEAPONS',
        desc: 'Кристалл на вершине поглощает свет и надежду.'
    },
    'broken_sword': {
        id: 'broken_sword', name: 'Обломок Меча',
        priceGold: 950, priceGem: 15,
        image: '/assets/images/items/weapons/broken_sword.webp', rarity: 'COMMON',
        mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Раньше это был грозный клинок.', textureKey: 'weapon_broken'
    },
    'rusty_dagger': {
        id: 'rusty_dagger', name: 'Ржавый Кинжал',
        priceGold: 1400, priceGem: 25,
        image: '/assets/images/items/weapons/rusty_dagger.webp', rarity: 'COMMON',
        mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Осторожно, можно подхватить столбняк.', textureKey: 'weapon_dagger_rusty'
    },

    // --- ДОПОЛНИТЕЛЬНОЕ ОРУЖИЕ (EXTENDED) ---
    'ext_1': { id: 'ext_1', name: 'Меч Звездного Сияния', attackBonus: 280, critBonus: 0.15, rarity: 'EPIC', priceGold: 55000, image: '', spriteClass: 'sprite-weapons-ext ext-1', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Клинок, выкованный из упавшей звезды.' },
    'ext_2': { id: 'ext_2', name: 'Лук Кровавой Охоты', attackBonus: 160, speedBonus: 0.1, rarity: 'RARE', priceGold: 18000, image: '', spriteClass: 'sprite-weapons-ext ext-2', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Никогда не промахивается, если почует запах крови.' },
    'ext_3': { id: 'ext_3', name: 'Посох Древних Тайн', attackBonus: 420, hpBonus: 800, rarity: 'MYTHIC', priceGem: 1600, image: '', spriteClass: 'sprite-weapons-ext ext-3', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Хранит мудрость тысячи ушедших поколений.' },
    'ext_4': { id: 'ext_4', name: 'Кинжалы Теневого Танца', attackBonus: 240, speedBonus: 0.2, rarity: 'EPIC', priceGem: 950, image: '', spriteClass: 'sprite-weapons-ext ext-4', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Владелец движется быстрее самой тени.' },
    'ext_5': { id: 'ext_5', name: 'Молот Сокрушитель Небес', attackBonus: 550, rarity: 'LEGENDARY', priceGem: 3200, image: '', spriteClass: 'sprite-weapons-ext ext-5', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Один удар может вызвать землетрясение.' },
    'ext_6': { id: 'ext_6', name: 'Топор Ледяного Шторма', attackBonus: 190, rarity: 'RARE', priceGold: 22000, image: '', spriteClass: 'sprite-weapons-ext ext-6', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Покрыт коркой льда, который никогда не тает.' },
    'ext_7': { id: 'ext_7', name: 'Арбалет Погибели', attackBonus: 210, critBonus: 0.2, rarity: 'EPIC', priceGold: 48000, image: '', spriteClass: 'sprite-weapons-ext ext-7', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Стрелы этого арбалета пронзают любую броню.' },
    'ext_8': { id: 'ext_8', name: 'Клинок Пустоты', attackBonus: 600, rarity: 'LEGENDARY', priceGem: 4500, image: '', spriteClass: 'sprite-weapons-ext ext-8', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Лезвие, состоящее из чистой тьмы.' },
    'ext_9': { id: 'ext_9', name: 'Посох Природного Гнева', attackBonus: 380, hpBonus: 600, rarity: 'EPIC', priceGold: 75000, image: '', spriteClass: 'sprite-weapons-ext ext-9', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Сила джунглей подчиняется владельцу.' },
    'ext_10': { id: 'ext_10', name: 'Копье Солнечного Луча', attackBonus: 250, critBonus: 0.1, rarity: 'RARE', priceGold: 25000, image: '', spriteClass: 'sprite-weapons-ext ext-10', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Ослепляет врагов при каждом ударе.' },
    'ext_11': { id: 'ext_11', name: 'Секира Кровавого Жнеца', attackBonus: 480, hpBonus: 400, rarity: 'MYTHIC', priceGem: 2000, image: '', spriteClass: 'sprite-weapons-ext ext-11', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Жаждет битвы больше, чем ее владелец.' },
    'ext_12': { id: 'ext_12', name: 'Эфирный Клинок', attackBonus: 320, speedBonus: 0.1, rarity: 'EPIC', priceGem: 1100, image: '', spriteClass: 'sprite-weapons-ext ext-12', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Существует одновременно в двух мирах.' },
    'ext_13': { id: 'ext_13', name: 'Жезл Повелителя Грома', attackBonus: 500, critBonus: 0.3, rarity: 'LEGENDARY', priceGem: 3800, image: '', spriteClass: 'sprite-weapons-ext ext-13', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Повелитель молний всегда находит свою цель.' },
    'ext_14': { id: 'ext_14', name: 'Лук Лесного Призрака', attackBonus: 180, speedBonus: 0.15, rarity: 'RARE', priceGold: 21000, image: '', spriteClass: 'sprite-weapons-ext ext-14', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Выстрелы тихи, как шелест листвы.' },
    'ext_15': { id: 'ext_15', name: 'Меч Драконьего Пламени', attackBonus: 450, rarity: 'EPIC', priceGold: 90000, image: '', spriteClass: 'sprite-weapons-ext ext-15', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Горит огнем ярости великих драконов.' },
    'ext_16': { id: 'ext_16', name: 'Коса Жнеца Душ', attackBonus: 580, hpBonus: 1000, rarity: 'MYTHIC', priceGem: 2800, image: '', spriteClass: 'sprite-weapons-ext ext-16', mainTab: 'ARSENAL', subTab: 'WEAPONS', desc: 'Забирает частицу души у каждого сраженного врага.' },


    // --- ШЛЕМЫ (HELMETS) ---
    'h1': {
        id: 'h1', name: 'Венец Вечного Короля', defenseBonus: 25, hpBonus: 250,
        rarity: ItemRarity.EPIC, priceGem: 850, image: '', spriteClass: 'sprite-helms helm-1',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Древний артефакт, излучающий ауру власти.'
    },
    'h2': {
        id: 'h2', name: 'Забрало Святого Искупления', defenseBonus: 15, hpBonus: 100, rarity: ItemRarity.RARE,
        priceGold: 15500, image: '', spriteClass: 'sprite-helms helm-2',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Освященный металл, благословленный жрецами света.'
    },
    'h3': {
        id: 'h3', name: 'Лик Бессмертного Легиона', defenseBonus: 35, hpBonus: 300, rarity: ItemRarity.EPIC,
        priceGold: 38000, image: '', spriteClass: 'sprite-helms helm-3',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Тяжелый шлем элитных стражей забытой империи.'
    },
    'h4': {
        id: 'h4', name: 'Череп Великого Пожирателя', defenseBonus: 60, attackBonus: 30, rarity: 'MYTHIC',
        priceGem: 1800, image: '', spriteClass: 'sprite-helms helm-4',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Дыхание бездны всё еще ощущается внутри этого шлема.'
    },
    'h_dark': {
        id: 'h_dark', name: 'Шлем Рыцаря Кровавой Луны', defenseBonus: 80, hpBonus: 1000, rarity: 'LEGENDARY',
        priceGem: 2500, image: '', spriteClass: 'sprite-helms helm-8',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Тьма внутри него шепчет забытые заклинания.'
    },
    'h_forest': {
        id: 'h_forest', name: 'Маска Духа Леса', defenseBonus: 10, speedBonus: 0.05, rarity: 'RARE',
        priceGold: 5000, image: '', spriteClass: 'sprite-helms helm-13',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Сплетен из веток священного древа.'
    },
    'h5': { id: 'h5', name: 'Шлем Грозового Фронта', defenseBonus: 45, hpBonus: 400, rarity: 'EPIC', priceGold: 42000, image: '', spriteClass: 'sprite-helms helm-5', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Притягивает молнии, которые питают владельца силой.' },
    'h6': { id: 'h6', name: 'Маска Темного Самурая', defenseBonus: 30, critBonus: 0.05, rarity: 'RARE', priceGold: 18000, image: '', spriteClass: 'sprite-helms helm-6', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Древняя маска, хранящая кодекс чести.' },
    'h7': { id: 'h7', name: 'Венец Ледяной Девы', defenseBonus: 50, speedBonus: -0.02, rarity: 'EPIC', priceGem: 850, image: '', spriteClass: 'sprite-helms helm-7', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Замораживает взгляды врагов.' },
    'h9': { id: 'h9', name: 'Капюшон Скрытности', defenseBonus: 5, speedBonus: 0.15, rarity: 'RARE', priceGold: 12000, image: '', spriteClass: 'sprite-helms helm-9', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Позволяет слиться с тенями.' },
    'h10': { id: 'h10', name: 'Шлем Горного Короля', defenseBonus: 95, hpBonus: 1200, rarity: 'LEGENDARY', priceGem: 2800, image: '', spriteClass: 'sprite-helms helm-10', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Тяжелая броня из истинного мифрила.' },
    'h11': { id: 'h11', name: 'Визор Парового Инженера', defenseBonus: 25, speedBonus: 0.08, rarity: 'RARE', priceGold: 22000, image: '', spriteClass: 'sprite-helms helm-11', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Линзы позволяют видеть сквозь туман войны.' },
    'h12': { id: 'h12', name: 'Череп Падшего Дракона', defenseBonus: 110, attackBonus: 50, rarity: 'MYTHIC', priceGem: 3500, image: '', spriteClass: 'sprite-helms helm-12', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Мощь древнего зверя всё еще живет в этой кости.' },
    'h14': { id: 'h14', name: 'Шлем Солнечного Рыцаря', defenseBonus: 70, hpBonus: 2000, rarity: 'EPIC', priceGold: 95000, image: '', spriteClass: 'sprite-helms helm-14', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Сияет так ярко, что враги не могут прицелиться.' },
    'h15': { id: 'h15', name: 'Лик Демонической Ярости', defenseBonus: 40, attackBonus: 80, rarity: 'MYTHIC', priceGem: 2200, image: '', spriteClass: 'sprite-helms helm-15', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Каждый вдох в этом шлеме наполняет кровь огнем.' },
    'h16': { id: 'h16', name: 'Венец Звездного Лорда', defenseBonus: 130, hpBonus: 5000, rarity: 'LEGENDARY', priceGem: 4500, image: '', spriteClass: 'sprite-helms helm-16', mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Управляй силой созвездий.' },
    'bandana': {
        id: 'bandana', name: 'Повязка Скитальца', defenseBonus: 2, speedBonus: 0.05, rarity: 'COMMON',
        priceGold: 500, image: '/assets/images/items/helms/bandana.webp',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Простая ткань, защищающая от солнца и пыли.'
    },
    'iron_helm': {
        id: 'iron_helm', name: 'Шлем Железного Стража',
        priceGold: 12500, priceGem: 150,
        image: '/assets/images/items/helms/iron_helm.webp', rarity: 'RARE',
        mainTab: 'ARSENAL', subTab: 'HELMETS', desc: 'Надежный стальной шлем.', textureKey: 'helm_iron'
    },

    // --- БРОНЯ (ARMOR) ---
    'a1': {
        id: 'a1', name: 'Костяной Доспех', defenseBonus: 40, hpBonus: 400, speedBonus: -0.05,
        rarity: ItemRarity.RARE, textureKey: 'armor_bone',
        priceGold: 28000, priceGem: 350,
        image: '/assets/images/items/armor/armor_bone.webp', mainTab: 'ARSENAL', subTab: 'ARMOR',
        desc: 'Легкая и прочная броня из костей древних драконов.'
    },
    'a2': {
        id: 'a2', name: 'Панцирь Льва', defenseBonus: 80, hpBonus: 800,
        rarity: ItemRarity.EPIC, textureKey: 'armor_lion',
        priceGold: 85000, priceGem: 1200,
        image: '/assets/images/items/armor/armor_lion.webp', mainTab: 'ARSENAL', subTab: 'ARMOR',
        desc: 'Тяжелая золоченая броня для истинных лидеров.'
    },
    'chainmail': {
        id: 'chainmail', name: 'Кольчуга',
        priceGold: 18500, priceGem: 220,
        image: '/assets/images/items/armor/chainmail.webp', rarity: 'RARE',
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Стальные кольца для защиты торса.', textureKey: 'armor_chainmail'
    },
    'armor_phoenix': {
        id: 'armor_phoenix', name: 'Доспех Феникса', defenseBonus: 120, hpBonus: 1500, rarity: 'MYTHIC',
        priceGem: 2200, image: '/assets/images/items/armor/armor_phoenix.webp',
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Броня, пульсирующая жаром вечного пламени.'
    },
    'armor_steampunk': {
        id: 'armor_steampunk', name: 'Паровой Панцирь', defenseBonus: 70, hpBonus: 900, rarity: 'EPIC',
        priceGold: 95000, image: '/assets/images/items/armor/armor_steampunk.webp',
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Механизмы внутри доспеха усиливают движения владельца.'
    },
    'armor_hunter': {
        id: 'armor_hunter', name: 'Охотничьи Меха', defenseBonus: 25, hpBonus: 250, speedBonus: 0.05, rarity: 'RARE',
        priceGold: 12000, image: '/assets/images/items/armor/hunter_furs.webp',
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Теплая броня для выживания в суровых условиях.'
    },
    'armor_spiked': {
        id: 'armor_spiked', name: 'Шипастая Кожа', defenseBonus: 35, hpBonus: 400, attackBonus: 15, rarity: 'RARE',
        priceGold: 22000, image: '/assets/images/items/armor/spiked_leather.webp',
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Утыканная шипами кожаная куртка.'
    },
    'armor_ragged': {
        id: 'armor_ragged', name: 'Рваная Туника', defenseBonus: 2, hpBonus: 20, rarity: 'COMMON',
        priceGold: 100, image: '/assets/images/items/armor/ragged_tunic.webp',
        mainTab: 'ARSENAL', subTab: 'ARMOR', desc: 'Старое тряпье, едва прикрывающее тело.'
    },


    // --- ЩИТЫ (SHIELDS) ---
    'shield_lion': { id: 'shield_lion', name: 'Щит Золотого Льва', defenseBonus: 250, hpBonus: 2000, rarity: 'LEGENDARY', priceGem: 2000, image: '', spriteClass: 'sprite-weapons wpn-8', mainTab: 'ARSENAL', subTab: 'SHIELDS', desc: 'Несокрушимый щит короля львов.' },

    's1': {
        id: 's1', name: 'Королевский Щит', defenseBonus: 60, hpBonus: 600,
        rarity: ItemRarity.EPIC, textureKey: 'royal_shield',
        priceGold: 42000, priceGem: 550,
        image: '/assets/images/items/shields/royal_shield.webp', mainTab: 'ARSENAL', subTab: 'SHIELDS',
        desc: 'Выкован из чистой стали и украшен золотым гербом.'
    },
    'steel_shield': {
        id: 'steel_shield', name: 'Стальной Щит',
        priceGold: 22500, priceGem: 320,
        image: '/assets/images/items/shields/steel_shield.webp', rarity: 'EPIC',
        mainTab: 'ARSENAL', subTab: 'SHIELDS', desc: 'Классический рыцарский щит.', textureKey: 'shield_steel'
    },
    // --- АЛХИМИЯ (ALCHEMY) ---
    'p1': {
        id: 'p1', name: 'Зелье Здоровья', rarity: 'COMMON',
        priceGold: 1200, priceGem: 15,
        image: '/assets/images/items/potions/hp_small.webp', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Мгновенно восстанавливает 500 ХП.'
    },
    'p2': {
        id: 'p2', name: 'Зелье Силы', rarity: 'RARE',
        priceGold: 3500, priceGem: 45,
        image: '/assets/images/items/potions/strength.webp', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Увеличивает атаку на 10% до конца боя.'
    },
    'p3': {
        id: 'p3', name: 'Зелье Защиты', rarity: 'RARE',
        priceGold: 3500, priceGem: 45,
        image: '/assets/images/items/potions/defense.webp', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Увеличивает защиту на 15% до конца боя.'
    },
    'p4': {
        id: 'p4', name: 'Эликсир Охотника', rarity: 'EPIC',
        priceGold: 8500, priceGem: 120,
        image: '/assets/images/items/potions/crit.webp', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Повышает крит. шанс и скорость на 20%.'
    },
    'p5': {
        id: 'p5', name: 'Зелье Скорости', rarity: 'RARE',
        priceGold: 2800, priceGem: 35,
        image: '/assets/images/items/potions/speed.webp', mainTab: 'ALCHEMY', subTab: 'POTIONS',
        desc: 'Увеличивает скорость передвижения и частоту атак.'
    },

    // --- БАНК ---
    '20': { id: '20', name: 'Мешочек золота', priceGem: 50, image: '/assets/images/shop/bank_gold_small.webp', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GOLD', desc: '1,000 монет.', amount: 1000 },
    '21': { id: '21', name: 'Сундук золота', priceGem: 250, image: '/assets/images/shop/bank_gold_medium.webp', rarity: 'RARE', mainTab: 'BANK', subTab: 'GOLD', desc: '6,000 монет.', amount: 6000 },
    '22': { id: '22', name: 'Сокровищница золота', priceGem: 1000, image: '/assets/images/shop/bank_gold_large.webp', rarity: 'EPIC', mainTab: 'BANK', subTab: 'GOLD', desc: '30,000 монет.', amount: 30000 },

    // --- ПАКЕТЫ ЗА VK STARS ---
    'gems_100': { id: 'gems_100', name: 'Мешочек алмазов', priceStars: 50, image: '/assets/images/shop/bank_almaz_small.webp', rarity: 'RARE', mainTab: 'BANK', subTab: 'GEMS', desc: '100 алмазов.', amount: 100 },
    'gems_500': { id: 'gems_500', name: 'Сундук алмазов', priceStars: 200, image: '/assets/images/shop/bank_almaz_medium.webp', rarity: 'EPIC', mainTab: 'BANK', subTab: 'GEMS', desc: '500 алмазов.', amount: 500 },
    'gems_1000': { id: 'gems_1000', name: 'Сокровищница алмазов', priceStars: 450, image: '/assets/images/shop/bank_almaz_large.webp', rarity: 'LEGENDARY', mainTab: 'BANK', subTab: 'GEMS', desc: '1,200 алмазов.', amount: 1200 },

    // --- РЕКЛАМА ---
    'ad_gold': { id: 'ad_gold', name: 'Бесплатное золото', isAd: true, image: '/assets/images/shop/bank_gold_small.webp', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GOLD', desc: 'Просмотр рекламы.', amount: 1000 },
    'ad_gem': { id: 'ad_gem', name: 'Бесплатные алмазы', isAd: true, image: '/assets/images/shop/bank_almaz_small.webp', rarity: 'COMMON', mainTab: 'BANK', subTab: 'GEMS', desc: 'Просмотр рекламы.', amount: 10 },
    'ad_energy': { id: 'ad_energy', name: 'Бесплатная энергия', isAd: true, image: '/assets/images/shop/bank_energy_1.webp', rarity: 'COMMON', mainTab: 'BANK', subTab: 'ENERGY', desc: 'Просмотр рекламы.', amount: 10 },

    '40': { id: '40', name: 'Малый эликсир', priceGem: 50, image: '/assets/images/shop/bank_energy_1.webp', rarity: 'COMMON', mainTab: 'BANK', subTab: 'ENERGY', desc: '50 энергии.', amount: 50 },
    '41': { id: '41', name: 'Средний эликсир', priceGem: 200, image: '/assets/images/shop/bank_energy_2.webp', rarity: 'RARE', mainTab: 'BANK', subTab: 'ENERGY', desc: '250 энергии.', amount: 250 },
    '42': { id: '42', name: 'Великий эликсир', priceGem: 500, image: '/assets/images/shop/bank_energy_3.webp', rarity: 'EPIC', mainTab: 'BANK', subTab: 'ENERGY', desc: '750 энергии.', amount: 750 },

    // --- СТАРТОВОЕ ---
    'pan': { id: 'pan', name: 'Боевая Сковородка', priceGold: 0, image: '/assets/images/items/weapons/pan.webp', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_pan', attackBonus: 50, desc: 'Тяжелая чугунная сковорода. Бьет больно, жарит вкусно.' },
    'stick': { id: 'stick', name: 'Дубовая Палка', priceGold: 0, image: '/assets/images/items/weapons/stick.webp', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'WEAPONS', textureKey: 'weapon_stick', attackBonus: 20, desc: 'Просто крепкая палка, найденная в лесу.' },
    'starter_helm': { id: 'starter_helm', name: 'Кожаный Шлем', priceGold: 0, image: '/assets/images/items/helms/starter_helm.webp', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'HELMETS', textureKey: 'helm_leather', defenseBonus: 5, hpBonus: 50, desc: 'Простая защита головы из потертой кожи.' },
    'starter_armor': { id: 'starter_armor', name: 'Ученический Доспех', priceGold: 0, image: '/assets/images/items/armor/starter_armor.webp', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'ARMOR', textureKey: 'armor_leather', defenseBonus: 10, hpBonus: 100, desc: 'Легкая броня для начинающих воинов.' },
    'royal_shield': { id: 'royal_shield', name: 'Королевский Щит', priceGem: 800, image: '/assets/images/items/shields/royal_shield.webp', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'SHIELDS', textureKey: 'shield_royal', defenseBonus: 75, hpBonus: 1200, desc: 'Украшен гербом королевской династии.' },

    // --- ПЛЕЧИ ---
    'sh_fire_lion': { id: 'sh_fire_lion', name: 'Наплечники Двойного Пламени', priceGem: 1500, image: '', spriteClass: 'sprite-shoulders sh-1', rarity: 'MYTHIC', mainTab: 'ARSENAL', subTab: 'SHOULDERS', attackBonus: 50, defenseBonus: 20, desc: 'Из пастей львов вырывается неугасающий огонь преисподней.' },
    'sh_acid_spikes': { id: 'sh_acid_spikes', name: 'Шипы Изумрудного Яда', priceGold: 25000, image: '', spriteClass: 'sprite-shoulders sh-2', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'SHOULDERS', defenseBonus: 30, critBonus: 0.05, desc: 'Пропитаны ядом древних змей.' },
    'sh_bone_lord': { id: 'sh_bone_lord', name: 'Оплечье Владыки Склепа', priceGem: 800, image: '', spriteClass: 'sprite-shoulders sh-3', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'SHOULDERS', defenseBonus: 40, hpBonus: 500, desc: 'Кости содрогаются от темной магии.' },
    'sh_frost_shards': { id: 'sh_frost_shards', name: 'Осколки Вечного Льда', priceGold: 15000, image: '', spriteClass: 'sprite-shoulders sh-4', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'SHOULDERS', defenseBonus: 25, speedBonus: -0.02, desc: 'Холод этих наплечников замедляет врагов.' },
    'sh_steam_gear': { id: 'sh_steam_gear', name: 'Механизм Высшей Паровой Лиги', priceGold: 45000, image: '', spriteClass: 'sprite-shoulders sh-5', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'SHOULDERS', defenseBonus: 45, speedBonus: 0.05, desc: 'Поршни и шестерни усиливают каждое движение.' },
    'sh_void_walker': { id: 'sh_void_walker', name: 'Наплечники Странника Бездны', priceGem: 2500, image: '', spriteClass: 'sprite-shoulders sh-6', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'SHOULDERS', defenseBonus: 100, hpBonus: 2000, desc: 'Сквозь них виден бесконечный космос.' },
    'sh_nature_spirit': { id: 'sh_nature_spirit', name: 'Оплечье Хранителя Рощи', priceGold: 12000, image: '', spriteClass: 'sprite-shoulders sh-7', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'SHOULDERS', hpBonus: 600, defenseBonus: 15, desc: 'Живое дерево продолжает расти прямо на доспехе.' },
    'sh_golden_lion': { id: 'sh_golden_lion', name: 'Эгида Солнечного Льва', priceGem: 3000, image: '', spriteClass: 'sprite-shoulders sh-8', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'SHOULDERS', defenseBonus: 150, hpBonus: 3500, desc: 'Золото, сияющее ярче самого полуденного солнца.' },



    // --- ПОНОЖИ ---
    'pants_leather': { id: 'pants_leather', name: 'Кожаные Поножи', priceGold: 600, image: '', spriteClass: 'sprite-pants pants-1', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 10, hpBonus: 100, desc: 'Простая, но надежная защита из выделанной кожи.' },
    'pants_chain': { id: 'pants_chain', name: 'Кольчужные Поножи', priceGold: 4000, image: '', spriteClass: 'sprite-pants pants-3', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 35, hpBonus: 400, desc: 'Гибкая кольчуга, усиленная стальными пластинами.' },
    'pants_lion': { id: 'pants_lion', name: 'Латные Штаны Льва', priceGold: 9500, image: '', spriteClass: 'sprite-pants pants-2', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 55, hpBonus: 650, desc: 'Украшены гербом древнего рыцарского ордена.' },
    'pants_spiked': { id: 'pants_spiked', name: 'Шипастые Леггинсы', priceGem: 550, image: '', spriteClass: 'sprite-pants pants-7', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 75, attackBonus: 15, hpBonus: 900, desc: 'Шипы не только защищают, но и ранят неосторожных врагов.' },
    'pants_bone': { id: 'pants_bone', name: 'Костяные Поножи', priceGem: 1100, image: '', spriteClass: 'sprite-pants pants-5', rarity: 'MYTHIC', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 110, hpBonus: 1800, desc: 'Сделаны из костей гигантских ящеров.' },
    'pants_royal': { id: 'pants_royal', name: 'Королевские Куисы', priceGem: 2500, image: '', spriteClass: 'sprite-pants pants-13', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 180, hpBonus: 3500, desc: 'Золотая броня, благословленная верховными жрецами.' },
    'pants_mercenary': { id: 'pants_mercenary', name: 'Брюки Наемника', priceGold: 2500, image: '', spriteClass: 'sprite-pants pants-4', rarity: 'UNCOMMON', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 20, speedBonus: 0.05, hpBonus: 250, desc: 'Множество карманов для трофеев и легкая броня.' },
    'pants_dark': { id: 'pants_dark', name: 'Тюремные Штаны', priceGold: 1200, image: '', spriteClass: 'sprite-pants pants-8', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'PANTS', defenseBonus: 12, hpBonus: 150, desc: 'Грубая ткань, которая видела немало сражений.' },

    // --- САПОГИ ---
    'boots_wanderer': { id: 'boots_wanderer', name: 'Сапоги Скитальца', priceGold: 500, image: '', spriteClass: 'sprite-boots boot-1', rarity: 'COMMON', mainTab: 'ARSENAL', subTab: 'BOOTS', speedBonus: 0.05, hpBonus: 50, desc: 'Потертая, но удобная обувь для долгих странствий.' },
    'boots_iron': { id: 'boots_iron', name: 'Стальные Сабатоны', priceGold: 3500, image: '', spriteClass: 'sprite-boots boot-2', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'BOOTS', defenseBonus: 20, hpBonus: 300, desc: 'Тяжелая латная защита для ног.' },
    'boots_rune': { id: 'boots_rune', name: 'Рунические Следоходы', priceGem: 450, image: '', spriteClass: 'sprite-boots boot-3', rarity: 'EPIC', mainTab: 'ARSENAL', subTab: 'BOOTS', speedBonus: 0.12, hpBonus: 500, desc: 'Магические руны делают походку легкой, как ветер.' },
    'boots_bone': { id: 'boots_bone', name: 'Костяные Топтуны', priceGem: 950, image: '', spriteClass: 'sprite-boots boot-4', rarity: 'MYTHIC', mainTab: 'ARSENAL', subTab: 'BOOTS', defenseBonus: 45, attackBonus: 20, hpBonus: 800, desc: 'Пропитаны первобытной яростью древних зверей.' },
    'boots_paladin': { id: 'boots_paladin', name: 'Золотые Гревсы', priceGem: 1800, image: '', spriteClass: 'sprite-boots boot-5', rarity: 'LEGENDARY', mainTab: 'ARSENAL', subTab: 'BOOTS', defenseBonus: 85, hpBonus: 1600, desc: 'Величественная броня, достойная великого героя.' },
    'boots_chain': { id: 'boots_chain', name: 'Кольчужные Сапоги', priceGold: 8000, image: '', spriteClass: 'sprite-boots boot-6', rarity: 'RARE', mainTab: 'ARSENAL', subTab: 'BOOTS', defenseBonus: 25, hpBonus: 450, desc: 'Идеальный баланс между весом и защитой.' },
    'boots_hunter': { id: 'boots_hunter', name: 'Егерские Сапоги', priceGold: 2000, image: '', spriteClass: 'sprite-boots boot-7', rarity: 'UNCOMMON', mainTab: 'ARSENAL', subTab: 'BOOTS', speedBonus: 0.08, hpBonus: 150, desc: 'Позволяют бесшумно передвигаться по лесу.' },
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
        COMMON: 1, RARE: 1.5, EPIC: 2.5, LEGENDARY: 4, MYTHIC: 6
    };
    return Math.round(power * (rarityMult[item.rarity] || 1)) || 10;
};

export const WEAPONS_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'WEAPONS')) as Record<string, IEquipmentStats>;
export const HELMS_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'HELMETS')) as Record<string, IEquipmentStats>;
export const ARMOR_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'ARMOR')) as Record<string, IEquipmentStats>;
export const SHIELDS_DB = Object.fromEntries(Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === 'SHIELDS')) as Record<string, IEquipmentStats>;
