import { resolveAssetPath } from '../../../utils/assetPath';

/**
 * Хелпер для расчета "Мощи" (Gear Score) предмета.
 * Теперь учитывает расширенные характеристики.
 */
export const calculateItemPower = (item: any): number => {
    if (!item) return 0;
    
    const power = 
        (item.attackBonus || 0) * 2.0 +
        (item.defenseBonus || 0) * 1.5 +
        (item.hpBonus || 0) * 0.1 +
        (item.critBonus || 0) * 300 +
        (item.speedBonus || 0) * 100;

    return Math.round(power);
};

/**
 * Утилита для обработки путей изображений в базе данных
 */
export const processItemImage = (image: string): string => {
    if (!image) return image;
    const webpImage = image.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    return resolveAssetPath(webpImage);
};
