/**
 * itemAtlas.ts
 *
 * Утилита для рендеринга иконок предметов из единого WebP-атласа.
 * Используется вместо загрузки 32 отдельных WebP-файлов.
 *
 * Атласы: public/assets/images/items/items.webp (ПК, 4096×4096)
 *         public/assets/images/items/items_mobile.webp (мобильный, 2048×2048)
 */

import type { CSSProperties } from 'react';

/** Определяет мобильное устройство по userAgent (аналогично AssetLoader.ts) */
const isMobile = (): boolean =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/** Размер атласа (ПК) */
const ATLAS_PC_SIZE = 4096;
/** Размер атласа (мобильный) */
const ATLAS_MOB_SIZE = 2048;
/** Масштаб мобильного атласа относительно ПК */
const MOBILE_SCALE = ATLAS_MOB_SIZE / ATLAS_PC_SIZE;

/** Тип одного фрейма из JSON-атласа */
interface AtlasFrame {
    frame: { x: number; y: number; w: number; h: number };
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
}

/** Тип полного JSON-файла атласа */
interface AtlasData {
    frames: Record<string, AtlasFrame>;
    meta: {
        image: string;
        size: { w: number; h: number };
    };
}

// Загружаем JSON атласа один раз лениво
let _atlasData: AtlasData | null = null;
let _loadPromise: Promise<AtlasData> | null = null;

/**
 * Лениво загружает JSON-данные атласа (один раз на сессию).
 * Автоматически выбирает мобильный или ПК вариант.
 */
export async function loadItemsAtlas(): Promise<AtlasData> {
    if (_atlasData) return _atlasData;
    if (_loadPromise) return _loadPromise;

    const jsonPath = isMobile()
        ? '/assets/images/items/weapons/items_mobile.json'
        : '/assets/images/items/weapons/items.json';

    _loadPromise = fetch(jsonPath)
        .then((r) => r.json())
        .then((data: AtlasData) => {
            _atlasData = data;
            return data;
        });

    return _loadPromise;
}

/** Возвращает синхронно загруженные данные атласа (после loadItemsAtlas()) */
export function getAtlasData(): AtlasData | null {
    return _atlasData;
}

/** Принудительная инициализация на старте (вызвать в AssetLoader) */
export function preloadItemsAtlas(): void {
    loadItemsAtlas().catch(() => {
        // Тихая ошибка — откат к индивидуальным изображениям
    });
}

/**
 * CSS-стили для рендеринга предмета из атласа.
 * Использует background-image + background-position + background-size.
 *
 * @param frameKey  Ключ фрейма в атласе (например: 'broken_sword.png')
 * @param renderW   Желаемая ширина рендера в px (по умолчанию 64)
 * @param renderH   Желаемая высота рендера в px (по умолчанию 64)
 * @returns         Объект CSSProperties или null если фрейм не найден
 */
export function getAtlasFrameStyle(frameKey: string, renderW = 64, renderH = 64): CSSProperties | null {
    const data = _atlasData;
    if (!data) return null;

    const frame = data.frames[frameKey];
    if (!frame) return null;

    const mobile = isMobile();

    const atlasW = data.meta.size.w;
    const atlasH = data.meta.size.h;

    // Координаты фрейма в пикселях атласа
    const fx = frame.frame.x;
    const fy = frame.frame.y;
    const fw = frame.frame.w;
    const fh = frame.frame.h;

    // Масштаб для вписывания фрейма в renderW×renderH с сохранением пропорций
    const fitScale = Math.min(renderW / fw, renderH / fh);

    // background-size = сколько займёт весь атлас при заданном fitScale
    const bgW = Math.round(atlasW * fitScale);
    const bgH = Math.round(atlasH * fitScale);

    // background-position = смещение нужного фрейма к левому верхнему углу контейнера
    const bgX = -Math.round(fx * fitScale);
    const bgY = -Math.round(fy * fitScale);

    const atlasUrl = mobile
        ? '/assets/images/items/weapons/items_mobile.webp'
        : '/assets/images/items/weapons/items.webp';

    return {
        backgroundImage: `url('${atlasUrl}')`,
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        width: `${renderW}px`,
        height: `${renderH}px`,
        display: 'block',
    } as CSSProperties;
}

/**
 * React.CSSProperties для рендеринга предмета из атласа по объекту item.
 * Если atlasFrame не указан или атлас не загружен — возвращает null
 * (компонент должен использовать item.image как fallback).
 */
export function getItemAtlasStyle(item: { atlasFrame?: string }, renderW = 64, renderH = 64): CSSProperties | null {
    if (!item.atlasFrame) return null;
    return getAtlasFrameStyle(item.atlasFrame, renderW, renderH);
}
