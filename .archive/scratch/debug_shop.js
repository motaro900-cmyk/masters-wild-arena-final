import { ITEMS_DATABASE } from '../src/game/configs/ItemsConfig.js';
import { getAllShopItems } from '../src/configs/ShopConfig.js';

console.log('Total items in raw DB:', Object.keys(ITEMS_DATABASE).length);
const shopItems = getAllShopItems();
console.log('Total shop items:', shopItems.length);
console.log('Shop items category stats:', shopItems.reduce((acc, item) => {
    acc[item.mainTab] = (acc[item.mainTab] || 0) + 1;
    return acc;
}, {}));
