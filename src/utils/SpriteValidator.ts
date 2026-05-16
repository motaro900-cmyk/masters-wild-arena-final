import * as PIXI from 'pixi.js';

/**
 * Валидатор спрайтов для предотвращения дрейфа якорей из-за авто-обрезки (auto-trim).
 */
export class SpriteValidator {
    static readonly EXPECTED_SIZES: Record<string, { w: number; h: number }> = {
        // Weapons assets have varied source sizes and are often trimmed, so we skip strict validation here.
        HELMETS: { w: 256, h: 256 },
        ARMOR: { w: 512, h: 512 },
        BODY: { w: 512, h: 512 },
    };

    static validate(texture: PIXI.Texture, slot: string): void {
        const expected = this.EXPECTED_SIZES[slot];
        if (!expected) return;

        const width = texture.orig?.width || texture.width;
        const height = texture.orig?.height || texture.height;
        if (width !== expected.w || height !== expected.h) {
            console.warn(
                `[SpriteValidator] ⚠️ SLOT "${slot}": ` +
                    `ожидалось ${expected.w}x${expected.h}, ` +
                    `получено ${width}x${height}. ` +
                    `Проверь экспорт — возможен auto-trim!`,
            );
        }
    }
}
