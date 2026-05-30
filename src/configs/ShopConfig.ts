import { ITEMS_DATABASE, IBaseItem } from '../game/configs/ItemsConfig';

/**
 * ShopItem теперь просто ссылается на IBaseItem из общей базы
 */
export type ShopItem = IBaseItem;

/**
 * Генерируем список товаров для магазина напрямую из ITEMS_DATABASE.
 * Сортируем по редкости от худшего к лучшему.
 */
const RARITY_ORDER: Record<string, number> = {
    COMMON: 1,
    UNCOMMON: 2,
    RARE: 3,
    EPIC: 4,
    LEGENDARY: 5,
    MYTHIC: 6,
};

export const getAllShopItems = (): ShopItem[] => {
    return Object.values(ITEMS_DATABASE)
        .filter(
            (item) =>
                (item.priceGold !== undefined && item.priceGold > 0) ||
                (item.priceGem !== undefined && item.priceGem > 0) ||
                item.priceStars !== undefined ||
                item.isAd === true ||
                item.id === 'pan' ||
                item.id === 'stick',
        )
        .sort((a, b) => {
            // 1. Сортировка по требуемому уровню (requiredLevel)
            const lvlA = a.requiredLevel || 1;
            const lvlB = b.requiredLevel || 1;
            if (lvlA !== lvlB) return lvlA - lvlB;

            // 2. Сортировка по редкости
            const orderA = RARITY_ORDER[a.rarity as string] || 0;
            const orderB = RARITY_ORDER[b.rarity as string] || 0;
            if (orderA !== orderB) return orderA - orderB;

            // 3. Сортировка по цене (в золоте, либо условный эквивалент в гемах)
            const priceA = a.priceGold || (a.priceGem ? a.priceGem * 10 : 0);
            const priceB = b.priceGold || (b.priceGem ? b.priceGem * 10 : 0);
            return priceA - priceB;
        });
};

export const getArsenalItems = () => getAllShopItems().filter((i) => i.mainTab === 'ARSENAL');
export const getAlchemyItems = () => getAllShopItems().filter((i) => i.mainTab === 'ALCHEMY');
export const getBankItems = () => getAllShopItems().filter((i) => i.mainTab === 'BANK');
export const getSkinsItems = () => getAllShopItems().filter((i) => i.mainTab === 'SKINS');
