import { ITEMS_DATABASE, IBaseItem } from '../game/configs/ItemsConfig';

/**
 * ShopItem теперь просто ссылается на IBaseItem из общей базы
 */
export type ShopItem = IBaseItem;

/**
 * Генерируем список товаров для магазина напрямую из ITEMS_DATABASE.
 * Фильтруем те, у которых есть цена хотя бы в одной из валют.
 */
export const ALL_SHOP_ITEMS: ShopItem[] = Object.values(ITEMS_DATABASE).filter(item => 
    (item.priceGold !== undefined && item.priceGold > 0) || 
    (item.priceGem !== undefined && item.priceGem > 0) ||
    item.id === 'pan' || item.id === 'stick'
);

export const ARSENAL_ITEMS = ALL_SHOP_ITEMS.filter(i => i.mainTab === 'ARSENAL');
export const ALCHEMY_ITEMS = ALL_SHOP_ITEMS.filter(i => i.mainTab === 'ALCHEMY');
export const BANK_ITEMS = ALL_SHOP_ITEMS.filter(i => i.mainTab === 'BANK');
export const SKINS_ITEMS = ALL_SHOP_ITEMS.filter(i => i.mainTab === 'SKINS');
