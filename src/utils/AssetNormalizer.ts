import * as PIXI from 'pixi.js';

export interface ISlotConfig {
    w: number;
    h: number;
    fallbackColor: number;
}

/**
 * AssetNormalizer — Система нормализации ассетов для AI-пайплайна.
 * Предотвращает поломку рендеринга из-за некорректных размеров или отсутствующих текстур.
 */
export class AssetNormalizer {
    static readonly SLOTS: Record<string, ISlotConfig> = {
        'WEAPONS': { w: 256, h: 256, fallbackColor: 0x555555 },
        'HELMETS': { w: 256, h: 256, fallbackColor: 0x777777 },
        'ARMOR':   { w: 512, h: 512, fallbackColor: 0x333333 },
        'BODY':    { w: 512, h: 512, fallbackColor: 0xaaaaaa },
    };

    /**
     * Валидирует и логирует предупреждение, если размер не совпадает.
     * Возвращает коэффициент масштабирования для вписывания в слот.
     */
    static normalize(texture: PIXI.Texture, slot: string): { scale: number, isInvalid: boolean } {
        const config = this.SLOTS[slot];
        if (!config) return { scale: 1, isInvalid: false };

        const { width, height } = texture;
        const isInvalid = width !== config.w || height !== config.h;

        if (isInvalid) {
            console.warn(
                `[AssetNormalizer] ⚠️ SLOT "${slot}": ` +
                `Размер ${width}x${height} не совпадает с эталоном ${config.w}x${config.h}. ` +
                `Применяется автоматическое масштабирование.`
            );
        }

        // Вычисляем масштаб, чтобы вписать текстуру в квадрат слота
        const scale = config.w / Math.max(width, height, 1);
        
        return { scale, isInvalid };
    }

    /**
     * Создает временную текстуру-заглушку, если ассет не найден.
     */
    static getFallbackTexture(slot: string): PIXI.Texture {
        const config = this.SLOTS[slot] || { w: 128, h: 128, fallbackColor: 0xff00ff };
        const g = new PIXI.Graphics();
        g.rect(0, 0, config.w, config.h)
         .fill({ color: config.fallbackColor, alpha: 0.5 })
         .stroke({ color: 0xffffff, width: 4, alpha: 0.8 });
        
        // Рисуем крест
        g.moveTo(0, 0).lineTo(config.w, config.h)
         .moveTo(config.w, 0).lineTo(0, config.h)
         .stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

        // В Pixi v8 мы можем использовать generateTexture напрямую
        return PIXI.Texture.from(g as any); 
    }
}

// Экспортируем старый класс для обратной совместимости, если нужно, 
// но лучше обновить все импорты.
export const SpriteValidator = {
    validate: (texture: PIXI.Texture, slot: string) => AssetNormalizer.normalize(texture, slot)
};
