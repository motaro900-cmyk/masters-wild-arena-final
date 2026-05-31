/**
 * Редкость предметов для визуальной дифференциации
 */
export enum ItemRarity {
    COMMON = 'COMMON',
    UNCOMMON = 'UNCOMMON', // Добавлено для совместимости
    RARE = 'RARE',
    EPIC = 'EPIC',
    MYTHIC = 'MYTHIC',
    LEGENDARY = 'LEGENDARY',
}

/**
 * Базовые поля для любого предмета в игре
 */
export interface IBaseItem {
    id: string;
    level?: number;
    name: string;
    image: string;
    rarity: ItemRarity | string;
    desc: string;
    priceGold?: number;
    priceGem?: number;
    priceStars?: number;
    isAd?: boolean;
    mainTab: 'ARSENAL' | 'ALCHEMY' | 'SKINS' | 'BANK';
    subTab: string;
    amount?: number;
    flavor?: string;
    badge?: string;
    spriteClass?: string;
    /** Минимальный уровень игрока для покупки. 1 = доступно сразу. */
    requiredLevel?: number;
    expReward?: number;
}

/**
 * Интерфейс характеристик экипировки
 */
export interface IEquipmentStats extends IBaseItem {
    // Основные статы
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;

    // Вторичные статы
    critChance?: number; // Крит. шанс (в %)
    critDamage?: number; // Крит. урон (множитель)
    attackSpeed?: number; // Скорость атаки
    lifesteal?: number; // Вампиризм (в %)
    penetration?: number; // Пробитие брони
    accuracy?: number; // Точность (в %)
    evasion?: number; // Уклонение
    resilience?: number; // Стойкость

    // Технические поля
    textureKey?: string;
    visualSocket?: 'MainHand' | 'OffHand' | 'Head' | 'Chest';

    // Обратная совместимость (alias)
    critBonus?: number;
    speedBonus?: number;
}
