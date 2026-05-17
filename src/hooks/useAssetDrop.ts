import { useCallback } from 'react';
import { useDebugStore } from '../store/useDebugStore';
import { useAssetsStore } from '../store/useAssetsStore';
import { PixiApp } from '../engine/core/PixiApp';
import { useUIStore } from '../store/useUIStore';

export const useAssetDrop = () => {
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const store = useDebugStore.getState() as any;
        // Если мы не в режиме редактора — игнорируем дроп
        if (!store.isEditorMode) return;

        // Находим канвас через PixiApp для точного расчета координат
        const canvas = PixiApp.getView() || document.querySelector('canvas');
        if (!canvas) {
            console.warn('[AssetDrop] Канвас не найден!');
            return;
        }

        const rect = canvas.getBoundingClientRect();

        // ❌ Координаты: Решаем проблему "Pixi ≠ DOM"
        // Переводим пиксели браузера в виртуальное пространство игры (1920x1080)
        const scaleX = 1920 / rect.width;
        const scaleY = 1080 / rect.height;

        let x = (e.clientX - rect.left) * scaleX;
        let y = (e.clientY - rect.top) * scaleY;

        // ✨ 4. Snap / Grid (Сетка для перфекционистов)
        const isGridEnabled = (useUIStore.getState() as any).isGridEnabled ?? store.snapToGrid;
        if (isGridEnabled) {
            const snap = 10; // Шаг сетки (можно вынести в настройки)
            x = Math.round(x / snap) * snap;
            y = Math.round(y / snap) * snap;
        }

        // Фабрика для создания элемента
        const createNewElement = (assetId: string, extraProps: any = {}) => {
            const newId = `sprite_${Date.now()}`;
            const newElement = {
                id: newId,
                type: 'sprite',
                assetId,
                x,
                y,
                scale: { x: 1, y: 1 }, // ИСПРАВЛЕНИЕ: Гарантированный масштаб 1:1 (решает проблему "Точки")
                rotation: 0,
                alpha: 1,
                // ✨ 6. Слои: новый элемент кладется поверх остальных (минимум 100)
                zIndex: Math.max(100, store.elements.length * 10),
                isVisible: true,
                isLocked: false,
                anchorX: 0.5, // ✨ Drag -> сразу в центр курсора
                anchorY: 0.5,
                parentId: null,
                ...extraProps,
            };

            useDebugStore.setState((state: any) => ({
                elements: [...state.elements, newElement],
            }));
            store.setSelected(newId, newElement);
        };

        // ✨ 1. Drag прямо из файловой системы (Desktop Drag & Drop)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|gif|webp|svg)$/i)) {
                const url = URL.createObjectURL(file); // Сразу в память, без загрузки на сервер!

                const assetId = `temp_img_${Date.now()}`;
                useAssetsStore.getState().addAsset({
                    id: assetId,
                    type: 'image',
                    src: url,
                    name: file.name,
                    isTemp: true,
                });

                createNewElement(assetId);
                return;
            }
        }

        // ✨ 3. ВАЖНО: правильный drag payload (Новый AssetBrowser)
        const assetDataStr = e.dataTransfer.getData('application/x-asset');
        if (assetDataStr) {
            try {
                const parsed = JSON.parse(assetDataStr);
                if (parsed.type === 'asset' && parsed.assetId) {
                    // 🔥 4. Drop -> инстанс prefab
                    const asset = useAssetsStore.getState().assets[parsed.assetId];
                    if (asset && asset.type === 'prefab' && asset.elements) {
                        // Генерируем уникальный ID группы для связи
                        const groupId = `group_${Date.now()}`;
                        const newIds: string[] = [];

                        const newElements = asset.elements.map((el: any) => {
                            const newId = `sprite_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                            newIds.push(newId);
                            return {
                                ...el,
                                id: newId,
                                groupId,
                                x: x + el.x,
                                y: y + el.y, // Смещение от центра префаба к курсору
                                zIndex: store.elements.length * 10,
                            };
                        });
                        useDebugStore.setState((state: any) => ({ elements: [...state.elements, ...newElements] }));
                        // Авто-выделение главного элемента префаба
                        store.setSelected(newIds[0], newElements[0]);
                    } else {
                        createNewElement(parsed.assetId);
                    }
                    return;
                }
            } catch {
                // Ignore parse errors
            }
        }

        // ✨ 2. Drop из Asset Library (Внутренний UI-конструктор)
        const dataStr = e.dataTransfer.getData('application/json');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                let assetId = data.id;

                if (data.type === 'slice' && data.frame) {
                    assetId = `slice_${Date.now()}`;
                    useAssetsStore
                        .getState()
                        .addAsset({ id: assetId, type: 'slice', src: data.url, frame: data.frame });
                } else if (data.url) {
                    // Если это просто иконка из библиотеки
                    assetId = assetId || `asset_${Date.now()}`;
                    useAssetsStore.getState().addAsset({ id: assetId, type: 'icon', src: data.url });
                }

                createNewElement(assetId);
            } catch (err) {
                console.error('Drop Parse Error:', err);
            }
        }
    }, []);

    return { handleDrop };
};
