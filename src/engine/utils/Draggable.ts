import * as PIXI from 'pixi.js';
import { useDebugStore } from '../../store/useDebugStore';
import { getStorage, safeGetItem, safeSetItem, safeRemoveItem } from '../../utils/SafeStorage';

/**
 * Глобальная функция экспорта (вызывать в консоли: window.exportLayout())
 */
(window as any).exportLayout = () => {
    const exportData: Record<string, any> = {};
    const storage = getStorage();
    for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.startsWith('pixi_debug_pos_') || key.startsWith('react_debug_pos_'))) {
            const name = key.replace(/^(pixi|react)_debug_pos_/, '');
            exportData[name] = JSON.parse(storage.getItem(key) || '{}');
        }
    }
    
    exportData['animations'] = JSON.parse(storage.getItem('HUD_ANIMATIONS') || '[]');
    
    console.log('%c🎨 UI STUDIO EXPORT (Скопируй в конфиг):', 'color: #4ade80; font-size: 18px; font-weight: bold;');
    console.log(JSON.stringify(exportData, null, 4));
    return exportData;
};

/**
 * Превращает любой Pixi-объект в перетаскиваемый (работает только при isEditorMode = true)
 * С сохранением координат в localStorage и визуальным Juice-эффектом.
 * 
 * @param obj Целевой объект (Container, Sprite, Text, и т.д.)
 * @param name Уникальное имя объекта для сохранения в localStorage
 */
export function makeDraggable(obj: PIXI.Container, name: string): void {
    const storageKey = `pixi_debug_pos_${name}`;
    const savedPos = safeGetItem(storageKey);

    const findText = (container: PIXI.Container): any | null => {
        let textNode: any | null = null;
        if (container.children) {
            container.children.forEach(child => {
                if (child instanceof PIXI.Text || child instanceof PIXI.BitmapText) {
                    textNode = child; // Берем последний добавленный текст (избегая иконок/эмодзи)
                } else if (child instanceof PIXI.Container) {
                    const nested = findText(child);
                    if (nested) textNode = nested;
                }
            });
        }
        return textNode || (container instanceof PIXI.Text || container instanceof PIXI.BitmapText ? container : null);
    };
    
    if (savedPos) {
        try {
            const parsed = JSON.parse(savedPos);
            const safeX = (parsed.x >= -3000 && parsed.x <= 5000) ? parsed.x : obj.x;
            const safeY = (parsed.y >= -3000 && parsed.y <= 5000) ? parsed.y : obj.y;
            
            obj.position.set(safeX, safeY);
            if (parsed.scale !== undefined && parsed.scale > 0.05 && parsed.scale < 10) obj.scale.set(parsed.scale);
            
            if (parsed.rotation !== undefined) obj.rotation = parsed.rotation;
            if (parsed.anchorX !== undefined && (obj as any).anchor) (obj as any).anchor.x = parsed.anchorX;
            if (parsed.anchorY !== undefined && (obj as any).anchor) (obj as any).anchor.y = parsed.anchorY;

            if (parsed.text !== undefined) {
                const textNode = findText(obj);
                if (textNode) textNode.text = parsed.text;
                if (textNode && parsed.color) textNode.style.fill = parsed.color;
            }
        } catch (e) {}
    }

    const getTextColorHex = (textNode: PIXI.Text | null) => {
        if (!textNode || !textNode.style.fill) return undefined;
        const fill = textNode.style.fill;
        if (typeof fill === 'string') return fill.startsWith('#') ? fill : undefined;
        if (typeof fill === 'number') return '#' + fill.toString(16).padStart(6, '0');
        return undefined;
    };

    obj.eventMode = 'static';
    (obj as any).interactive = true; // Принудительный fallback по вашему запросу
    obj.cursor = 'move';

    useDebugStore.getState().registerElement(name);

    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let startGlobalY = 0;
    let lastClickTime = 0;
    let initialScale = 1;
    let selectionBox: PIXI.Graphics | null = null;

    const saveState = () => {
        const state: any = { 
            x: Math.round(obj.x), 
            y: Math.round(obj.y), 
            scale: Number(obj.scale.x.toFixed(3)),
            rotation: Number(obj.rotation.toFixed(3)),
            anchorX: (obj as any).anchor ? (obj as any).anchor.x : 0,
            anchorY: (obj as any).anchor ? (obj as any).anchor.y : 0
        };
        
        const textNode = findText(obj);
        if (textNode) state.text = textNode.text;
        if (textNode) state.color = getTextColorHex(textNode);
        
        safeSetItem(storageKey, JSON.stringify(state));
    };

    const handleUpdate = (e: any) => {
        if (e.detail.id === name && !isDragging) { // Защита от конфликта во время перетаскивания
            const props = e.detail.props;
            obj.position.set(props.x, props.y);
            obj.scale.set(props.scale);
            if (props.rotation !== undefined) obj.rotation = props.rotation;
            if (props.anchorX !== undefined && (obj as any).anchor) (obj as any).anchor.x = props.anchorX;
            if (props.anchorY !== undefined && (obj as any).anchor) (obj as any).anchor.y = props.anchorY;
            const textNode = findText(obj);
            if (textNode && props.text !== undefined) textNode.text = props.text;
            if (textNode && props.color !== undefined) textNode.style.fill = props.color;
            updateBoxBounds();
            saveState();
        }
    };
    window.addEventListener('hud_editor_update', handleUpdate);
    
    const onKeyDown = (e: KeyboardEvent) => {
        if (!useDebugStore.getState().isEditorMode) return;
        if (useDebugStore.getState().selectedId === name) {
            if (e.key === 'Delete') {
                obj.destroy();
                useDebugStore.getState().setSelected(null);
                safeRemoveItem(storageKey);
            }
            if (e.key.toLowerCase() === 'd' && e.ctrlKey) {
                e.preventDefault();
                if (obj instanceof PIXI.Sprite) {
                    const clone = new PIXI.Sprite(obj.texture);
                    clone.position.set(obj.x + 20, obj.y + 20);
                    clone.scale.copyFrom(obj.scale);
                    clone.rotation = obj.rotation;
                    if (clone.anchor && (obj as any).anchor) clone.anchor.copyFrom((obj as any).anchor);
                    if (obj.parent) obj.parent.addChild(clone);
                    makeDraggable(clone, `${name}_copy_${Date.now()}`);
                }
            }
        }
    };
    window.addEventListener('keydown', onKeyDown);
    
    obj.on('destroyed', () => {
        window.removeEventListener('hud_editor_update', handleUpdate);
        window.removeEventListener('keydown', onKeyDown);
        useDebugStore.getState().unregisterElement(name);
    });

    const updateBoxBounds = () => {
        if (!selectionBox) {
            selectionBox = new PIXI.Graphics();
            selectionBox.eventMode = 'none'; // КРИТИЧНО: отключаем pointer events у overlay
            (selectionBox as any).interactive = false;
            obj.addChild(selectionBox);
        }
        
        selectionBox.clear();
        selectionBox.removeChildren();
        
        // ВАЖНО: Скрываем рамку перед вычислением границ, чтобы объект не "раздувался" бесконечно!
        selectionBox.visible = false;
        const bounds = obj.getLocalBounds();
        selectionBox.visible = true;

        const absScaleX = Math.abs(obj.scale.x) || 1;
        const absScaleY = Math.abs(obj.scale.y) || 1;
        const strokeWidth = 2 / absScaleX;
        
        // Зеленая рамка (bounding box) с прозрачностью, как в ТЗ
        selectionBox.rect(bounds.minX, bounds.minY, bounds.width, bounds.height).stroke({ width: Math.max(2, strokeWidth), color: 0x00ff00, alpha: 0.8 });
        
        // Pivot точка (красная)
        selectionBox.circle(0, 0, 5 / absScaleX).fill(0xff0000).stroke({ width: 1 / absScaleX, color: 0xffffff });
        
        // Имя, координаты и размер
        const infoText = new PIXI.Text({
            text: `${name}\nX: ${Math.round(obj.x)} Y: ${Math.round(obj.y)} | S: ${obj.scale.x.toFixed(2)}\nSize: ${Math.round(bounds.width)}x${Math.round(bounds.height)}`,
            style: { fontFamily: 'monospace', fontSize: 14 / absScaleX, fill: 0x00ff00, stroke: { color: 0x000000, width: 3 / absScaleX }, align: 'left' }
        });
        infoText.position.set(bounds.minX, bounds.minY - (60 / absScaleY));
        
        // Фикс перевернутого текста, если родитель отражен
        infoText.scale.set(Math.sign(obj.scale.x) || 1, Math.sign(obj.scale.y) || 1);
        
        selectionBox.addChild(infoText);
        obj.addChild(selectionBox);
    };

    const onPointerDown = (e: PIXI.FederatedPointerEvent) => {
        if (!useDebugStore.getState().isEditorMode) return;
        
        const now = Date.now();
        const textNode = findText(obj);
        if (now - lastClickTime < 300 && textNode) {
            const newText = window.prompt(`Редактировать текст [${name}]:`, textNode.text);
            if (newText !== null && newText.trim() !== '') {
                textNode.text = newText;
                saveState();
            }
            lastClickTime = 0;
            return;
        }
        lastClickTime = now;

        isDragging = true;
        
        // Убеждаемся, что stage ловит pointermove (даже если объект добавлен после вызова makeDraggable)
        let root = obj;
        while (root.parent) {
            root = root.parent;
        }
        root.eventMode = 'static';

        const parent = obj.parent;
        const pos = parent ? parent.toLocal(e.global) : e.global;

        dragOffset.x = pos.x - obj.x;
        dragOffset.y = pos.y - obj.y;
        
        initialScale = obj.scale.x;
        startGlobalY = e.global.y;

        const textNodeForSelect = findText(obj);
        useDebugStore.getState().setSelected(name, {
            x: obj.x, y: obj.y, scale: obj.scale.x, 
            rotation: obj.rotation,
            anchorX: (obj as any).anchor ? (obj as any).anchor.x : 0,
            anchorY: (obj as any).anchor ? (obj as any).anchor.y : 0,
            text: textNodeForSelect?.text, color: getTextColorHex(textNodeForSelect)
        });

        // Быстрый тест: проверяем, что именно мы тащим (должно быть Container, Sprite, Text и т.д.)
        console.log('[HUD Debug] Selected PIXI Object:', obj, obj.constructor.name);

        updateBoxBounds();
        e.stopPropagation();
    };

    const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
        if (!isDragging) return;
    
        if (e.shiftKey) {
            // Оставляем возможность масштабирования с зажатым shift (с учетом отраженных спрайтов)
            const dy = e.global.y - startGlobalY;
            const signX = initialScale < 0 ? -1 : 1;
            const signY = obj.scale.y < 0 ? -1 : 1;
            const newScale = Math.max(0.1, Math.abs(initialScale) - dy * 0.005);
            obj.scale.set(newScale * signX, newScale * signY);
            
            // Обновляем debug данные live
            useDebugStore.getState().updateSelected({ scale: newScale });
        } else {
            const parent = obj.parent;
            const pos = parent ? parent.toLocal(e.global) : e.global;

            let newX = pos.x - dragOffset.x;
            let newY = pos.y - dragOffset.y;
            
            if (useDebugStore.getState().snapToGrid && !e.shiftKey) {
                newX = Math.round(newX / 10) * 10;
                newY = Math.round(newY / 10) * 10;
            }
            
            // 1. Двигаем PIXI объект
            obj.x = newX;
            obj.y = newY;
            
            // 2. Обновляем debug данные (Zustand Store)
            useDebugStore.getState().updateSelected({ x: newX, y: newY });
        }
        
        // 3. Обновляем рамку (следует за элементом)
        updateBoxBounds();
        e.stopPropagation();
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        
        const textNodeForSelect = findText(obj);
        useDebugStore.getState().setSelected(name, {
            x: obj.x, y: obj.y, scale: obj.scale.x, text: textNodeForSelect?.text, color: getTextColorHex(textNodeForSelect)
        });
        
        saveState();
    };

    obj.on('pointerdown', onPointerDown);
    obj.on('pointermove', onPointerMove);
    obj.on('pointerup', onPointerUp);
    obj.on('pointerupoutside', onPointerUp);
}
