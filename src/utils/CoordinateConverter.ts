
export interface IUnityElement {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    anchor?: string;
}

export interface IUnityLayout {
    items: IUnityElement[];
}

/**
 * UnityBridge — утилита для конвертации данных из Unity в Web-формат.
 */
export class CoordinateConverter {
    // Unity Bridge logic

    /**
     * Конвертирует координаты из Unity (Y-up, pivot center/bottom) 
     * в Web (Y-down, top-left)
     */
    public static convertToWeb(unityItem: IUnityElement): { x: number; y: number } {
        // Unity RectTransform.anchoredPosition обычно считает от центра или якоря.
        // Мы предполагаем, что в Unity создан контейнер 1920x1080 с Pivot Top-Left (0, 1).
        
        return {
            x: unityItem.x,
            // В Unity Y идет вверх, в Вебе — вниз.
            // Если в Unity Y = 0 (верх), то в вебе это 0.
            // Если в Unity Y = -100 (на 100 ниже верха), то в вебе это 100.
            y: Math.abs(unityItem.y) 
        };
    }
}
