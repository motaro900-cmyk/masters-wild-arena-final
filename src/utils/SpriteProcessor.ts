import sharp from 'sharp';

/**
 * SpriteProcessor — Модуль нормализации AI-изображений.
 * Приводит любой вывод от AI к стандарту (512x512 для тела, 256x256 для оружия)
 * с правильным расположением точки опоры (pivot).
 */

interface Preset {
    targetW: number;
    targetH: number;
    anchorX: number; // куда должна попасть "точка опоры" (0.0–1.0)
    anchorY: number;
}

const PRESETS: Record<string, Preset> = {
    BODY: { targetW: 512, targetH: 512, anchorX: 0.5, anchorY: 0.95 },
    WEAPON: { targetW: 256, targetH: 256, anchorX: 0.5, anchorY: 0.9 },
};

export async function processSprite(inputBuffer: Buffer, type: 'BODY' | 'WEAPON'): Promise<Buffer> {
    const opts = PRESETS[type];
    const img = sharp(inputBuffer).png();
    const meta = await img.metadata();

    if (!meta.width || !meta.height) throw new Error('Invalid image metadata');

    // 1. Найти bounding box непрозрачных пикселей
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const bbox = getBoundingBox(data, info.width, info.height);

    // 2. Вычислить где сейчас находится "точка опоры" объекта
    //    Для BODY — нижний центр bbox (ноги)
    //    Для WEAPON — нижний центр bbox (конец рукояти)
    const pivotX = (bbox.left + bbox.right) / 2;
    const pivotY = bbox.bottom;

    // 3. Посчитать сколько паддинга нужно чтобы pivot попал в нужную точку
    const targetPivotX = opts.targetW * opts.anchorX;
    const targetPivotY = opts.targetH * opts.anchorY;

    const padLeft = Math.round(targetPivotX - pivotX);
    const padTop = Math.round(targetPivotY - pivotY);
    const padRight = opts.targetW - info.width - padLeft;
    const padBottom = opts.targetH - info.height - padTop;

    if (padLeft < 0 || padTop < 0 || padRight < 0 || padBottom < 0) {
        // Если объект слишком большой, пытаемся просто вписать его, если это возможно,
        // но по ТЗ кидаем ошибку.
        throw new Error(`[SpriteProcessor] Объект не вмещается в ${opts.targetW}×${opts.targetH}. Пересмотри промпт.`);
    }

    // 4. Добавить паддинг → ровно нужный холст
    return sharp(inputBuffer)
        .extend({
            top: padTop,
            bottom: padBottom,
            left: padLeft,
            right: padRight,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .resize(opts.targetW, opts.targetH)
        .png()
        .toBuffer();
}

function getBoundingBox(data: Buffer, w: number, h: number) {
    let left = w,
        right = 0,
        top = h,
        bottom = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 10) {
                // Игнорируем почти прозрачные пиксели
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }
    return { left, right, top, bottom };
}
