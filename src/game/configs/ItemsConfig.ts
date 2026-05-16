/**
 * Masters of the Wild - Items Configuration Proxy
 * Этот файл теперь является точкой доступа к модульной базе данных предметов.
 * Вся логика и данные перенесены в папку ./items/
 */

export * from './items/types';
export * from './items/itemUtils';
export {
    ITEMS_DATABASE,
    WEAPONS_DB,
    HELMS_DB,
    ARMOR_DB,
    SHIELDS_DB,
    PANTS_DB,
    BOOTS_DB,
    SHOULDERS_DB,
} from './items/index';

// Для обратной совместимости, если где-то используется прямое обращение
import { rawItemsDatabase } from './items/index';
export { rawItemsDatabase };
