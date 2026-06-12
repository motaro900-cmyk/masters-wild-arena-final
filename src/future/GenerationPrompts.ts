/**
 * Промпт-инжиниринг для генерации ассетов через AI.
 * Вшивает геометрические оси в подсказки, чтобы облегчить постобработку.
 */

export const BODY_PROMPT = (heroClass: string) =>
    `
  ${heroClass} warrior character, dark fantasy RPG style,
  full body standing pose, facing slightly right,
  feet touching the very bottom center of the image,
  centered horizontally, large empty transparent margin above head,
  no background, PNG transparent, game sprite style,
  2D illustration, flat lighting
`.trim();

export const WEAPON_PROMPT = (weaponType: string) =>
    `
  ${weaponType}, dark fantasy RPG game icon,
  weapon tilted at -65 degrees (blade pointing upper-left),
  handle positioned at the very bottom center of the image,
  large transparent padding around the weapon,
  no background, PNG transparent, isolated on transparency,
  game asset style
`.trim();
