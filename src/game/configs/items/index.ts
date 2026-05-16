import { IEquipmentStats } from './types';
import { processItemImage } from './itemUtils';
import { weapons } from './weapons';
import { armor } from './armor';
import { helmets } from './helmets';
import { shoulders } from './shoulders';
import { shields } from './shields';
import { pants } from './pants';
import { boots } from './boots';
import { consumables } from './consumables';

/**
 * Объединенная база данных всех предметов
 */
export const rawItemsDatabase: Record<string, IEquipmentStats> = {
    ...weapons,
    ...armor,
    ...helmets,
    ...shoulders,
    ...shields,
    ...pants,
    ...boots,
    ...consumables,
};

/**
 * Финальная база данных с обработанными путями ассетов
 */
export const ITEMS_DATABASE: Record<string, IEquipmentStats> = Object.fromEntries(
    Object.entries(rawItemsDatabase).map(([key, item]) => [
        key,
        { ...item, image: processItemImage(item.image) }
    ])
);

/**
 * Вспомогательная функция для фильтрации по подкатегории
 */
const filterBySubTab = (subTab: string): Record<string, IEquipmentStats> => {
    return Object.fromEntries(
        Object.entries(ITEMS_DATABASE).filter(([_, v]) => v.subTab === subTab)
    );
};

// Экспорты для конкретных разделов магазина
export const WEAPONS_DB = filterBySubTab('WEAPONS');
export const HELMS_DB = filterBySubTab('HELMETS');
export const ARMOR_DB = filterBySubTab('ARMOR');
export const SHIELDS_DB = filterBySubTab('SHIELDS');
export const PANTS_DB = filterBySubTab('PANTS');
export const BOOTS_DB = filterBySubTab('BOOTS');
export const SHOULDERS_DB = filterBySubTab('SHOULDERS');
