import { resolveAssetPath } from '../../../utils/assetPath';

/**
 * Хелпер для расчета "Мощи" (Gear Score) предмета.
 * Теперь учитывает расширенные характеристики.
 */
export const calculateItemPower = (item: any): number => {
    if (!item) return 0;
    let power = 0;
    // Основные статы
    if (item.attackBonus) power += item.attackBonus * 1.5;
    if (item.defenseBonus) power += item.defenseBonus * 1.2;
    if (item.hpBonus) power += item.hpBonus * 0.1;
    if (item.critBonus) power += item.critBonus * 500;
    if (item.speedBonus) power += item.speedBonus * 300;
    // Расширенные статы (улучшение Gear Score)
    if (item.evasion) power += item.evasion * 1000;
    if (item.resilience) power += item.resilience * 800;
    if (item.lifesteal) power += item.lifesteal * 1200;
    if (item.penetration) power += item.penetration * 2;
    if (item.critDamage) power += (item.critDamage - 1.5) * 2000;

    const rarityMult: Record<string, number> = {
        COMMON: 1,
        UNCOMMON: 1.2,
        RARE: 1.5,
        EPIC: 2.5,
        LEGENDARY: 4,
        MYTHIC: 6,
    };
    return Math.round(power * (rarityMult[item.rarity] || 1)) || 10;
};

/**
 * Утилита для обработки путей изображений в базе данных
 */
export const processItemImage = (image: string): string => {
    if (!image) return image;
    const webpImage = image.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    return resolveAssetPath(webpImage);
};
