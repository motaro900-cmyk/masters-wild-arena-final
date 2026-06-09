import { resolveAssetPath } from '../../../utils/assetPath';

/**
 * Хелпер для расчета "Мощи" (Gear Score) предмета.
 * Теперь учитывает расширенные характеристики.
 */
export const calculateItemPower = (item: any): number => {
    if (!item) return 0;
    let power = 0;
    // Основные статы
    if (item.attackBonus) power += item.attackBonus * 2.0;
    if (item.defenseBonus) power += item.defenseBonus * 1.5;
    if (item.hpBonus) power += item.hpBonus * 0.12;
    if (item.critBonus) power += item.critBonus * 400;
    if (item.speedBonus) power += item.speedBonus * 350;
    // Расширенные статы (только реально работающие в бою)
    if (item.evasion) power += item.evasion * 600;        // снижен с 1000 до активации
    if (item.lifesteal) power += item.lifesteal * 1200;   // активирован в движке
    if (item.penetration) power += item.penetration * 800; // критический фикс: был 2
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
