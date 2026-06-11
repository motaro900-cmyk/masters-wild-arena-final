import { IEquipmentStats } from './types';
import { resolveAssetPath } from '../../../utils/assetPath';

/**
 * Облики — продаются в магазине за кристаллы (алмазы).
 * skinId должен совпадать с id из SkinsConfig.ts.
 * Пути картинок НЕ конвертируются в .webp — используем исходный .png.
 */
export const skins: Record<string, IEquipmentStats> = {
    panda_frost: {
        id: 'panda_frost',
        name: 'Лазурный Дракон',
        desc: 'Легендарные серебряные латы, заряженные чистой энергией Лазурного Дракона. Облик дарует силу ветра и шторма.',
        // Указываем полный обработанный путь сразу, чтобы processItemImage не менял расширение
        image: resolveAssetPath('/assets/characters/panda/panda_frost.png'),
        rarity: 'EPIC',
        mainTab: 'SKINS',
        subTab: 'CHARACTERS',
        priceGem: 899,
        badge: 'ОБЛИК',
    },
};
