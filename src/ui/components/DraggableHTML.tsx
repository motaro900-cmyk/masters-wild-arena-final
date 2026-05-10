import React, { useEffect, useRef, useState } from 'react';
import { useDebugStore } from '../../store/useDebugStore';
import { useUIStore } from '../../store/useUIStore';
import { safeGetItem, safeSetItem } from '../../utils/SafeStorage';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    id: string;
}

const getPrimaryTextElement = (container: HTMLElement): HTMLElement | null => {
    const semanticNode = container.querySelector('h1, h2, h3, h4, h5, h6, p');
    if (semanticNode) return semanticNode as HTMLElement;
    const texts = Array.from(container.querySelectorAll('*')).filter(el => el.childNodes.length === 1 && el.childNodes[0].nodeType === 3);
    if (texts.length > 0) return texts[0] as HTMLElement;
    return null;
};

/**
 * Обертка для React-компонентов, делающая их перетаскиваемыми в режиме Visual Debug Editor.
 */
export const DraggableHTML: React.FC<Props> = ({ id, children, className = '', ...props }) => {
    const isEditorMode = useDebugStore(state => state.isEditorMode);
    const setSelected = useDebugStore(state => state.setSelected);
    const [pos, setPos] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [customColor, setCustomColor] = useState<string | undefined>(undefined);
    const [isHidden, setIsHidden] = useState(false);
    const [zIndex, setZIndex] = useState(0);
    const [alpha, setAlpha] = useState(1);
    const customColorRef = useRef(customColor);
    customColorRef.current = customColor;
    const elementRef = useRef<HTMLDivElement>(null);
    const posRef = useRef(pos);
    posRef.current = pos;
    const dragState = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0
    });

    useEffect(() => {
        const saved = safeGetItem(`react_debug_pos_${id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const initial = {
                    x: (parsed.x > -2000 && parsed.x < 3000) ? parsed.x : 0,
                    y: (parsed.y > -2000 && parsed.y < 3000) ? parsed.y : 0,
                    scale: parsed.scale || 1
                };
                setPos(initial);
                posRef.current = initial;
                
                if (parsed.text && elementRef.current) {
                    const target = getPrimaryTextElement(elementRef.current);
                    if (target) target.innerText = parsed.text;
                }
                if (parsed.color) setCustomColor(parsed.color);
                if (parsed.hidden !== undefined) setIsHidden(parsed.hidden);
                if (parsed.zIndex !== undefined) setZIndex(parsed.zIndex);
                if (parsed.alpha !== undefined) setAlpha(parsed.alpha);
            } catch (e) { console.error(e); }
        }
    }, [id]);

    useEffect(() => {
        const handleUpdate = (e: any) => {
            if (e.detail.id === id && !dragState.current.isDragging) {
                const newProps = e.detail.props;
                setPos(prev => ({ 
                    ...prev, 
                    x: newProps.x !== undefined ? newProps.x : prev.x, 
                    y: newProps.y !== undefined ? newProps.y : prev.y, 
                    scale: newProps.scale !== undefined ? newProps.scale : prev.scale 
                }));
                if (newProps.color) setCustomColor(newProps.color);
                if (newProps.hidden !== undefined) setIsHidden(newProps.hidden);
                if (newProps.zIndex !== undefined) setZIndex(newProps.zIndex);
                if (newProps.alpha !== undefined) setAlpha(newProps.alpha);
                if (newProps.text !== undefined && elementRef.current) {
                    const target = getPrimaryTextElement(elementRef.current);
                    if (target) target.innerText = newProps.text;
                }
                safeSetItem(`react_debug_pos_${id}`, JSON.stringify(newProps));
            }
        };
        window.addEventListener('hud_editor_update', handleUpdate);
        return () => window.removeEventListener('hud_editor_update', handleUpdate);
    }, [id]);

    useEffect(() => {
        if (!isDragging) return;

        const onMove = (e: PointerEvent) => {
            if (!dragState.current.isDragging) return;

            const wrapper = document.getElementById('game-wrapper');
            const zoom = wrapper ? wrapper.getBoundingClientRect().width / 1920 : 1;

            if (e.shiftKey || e.altKey) {
                const dy = e.clientY - dragState.current.startY;
                const newScale = Math.max(0.1, posRef.current.scale - dy * 0.01);
                setPos({ ...posRef.current, scale: newScale });
                useDebugStore.getState().updateSelected({ scale: newScale });
            } else {
                const deltaX = e.clientX - dragState.current.startX;
                const deltaY = e.clientY - dragState.current.startY;
                let newX = dragState.current.initialX + (deltaX / zoom) / posRef.current.scale;
                let newY = dragState.current.initialY + (deltaY / zoom) / posRef.current.scale;

                const isGridEnabled = (useUIStore.getState() as any).isGridEnabled ?? useDebugStore.getState().snapToGrid;
                if (isGridEnabled) {
                    newX = Math.round(newX / 10) * 10;
                    newY = Math.round(newY / 10) * 10;
                }

                const dx = newX - posRef.current.x;
                const dy = newY - posRef.current.y;

                setPos({ ...posRef.current, x: newX, y: newY });
                useDebugStore.getState().updateSelected({ x: newX, y: newY });

                if (dx !== 0 || dy !== 0) {
                    const store = useDebugStore.getState();
                    const getChildrenIds = (parentId: string, allElements: any[]): string[] => {
                        const children = allElements.filter(el => el.parentId === parentId);
                        let ids = children.map(c => c.id);
                        children.forEach(c => { ids = [...ids, ...getChildrenIds(c.id, allElements)]; });
                        return ids;
                    };
                    const childIds = getChildrenIds(id, store.elements);
                    childIds.forEach(childId => {
                        const childEl = store.elements.find(e => e.id === childId);
                        if (childEl) {
                            window.dispatchEvent(new CustomEvent('hud_editor_update', { detail: { id: childId, props: { x: childEl.x + dx, y: childEl.y + dy } } }));
                        }
                    });
                }
            }
        };

        const onUp = () => {
            if (!dragState.current.isDragging) return;
            dragState.current.isDragging = false;
            
            const stateToSave: any = { 
                x: Math.round(posRef.current.x), 
                y: Math.round(posRef.current.y), 
                scale: Number(posRef.current.scale.toFixed(3)),
                color: customColorRef.current,
                hidden: isHidden,
                zIndex: zIndex,
                alpha: alpha
            };

            if (elementRef.current) {
                const target = getPrimaryTextElement(elementRef.current);
                if (target) stateToSave.text = target.innerText;
            }

            console.log(`📍 React Position saved [${id}]:`, stateToSave);
            safeSetItem(`react_debug_pos_${id}`, JSON.stringify(stateToSave));
            setSelected(id, stateToSave);
            setIsDragging(false);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [isDragging, id]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isEditorMode) return;
        e.stopPropagation();

        let textVal = undefined;
        if (elementRef.current) {
            const target = getPrimaryTextElement(elementRef.current);
            if (target) textVal = target.innerText;
        }
        setSelected(id, { x: posRef.current.x, y: posRef.current.y, scale: posRef.current.scale, text: textVal, color: customColor, hidden: isHidden, zIndex: zIndex, alpha: alpha });

        dragState.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: posRef.current.x,
            initialY: posRef.current.y
        };
        setIsDragging(true);
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditorMode) return;
        e.stopPropagation();
        
        if (elementRef.current) {
            const targetEl = getPrimaryTextElement(elementRef.current);
            if (targetEl) {
                const currentText = targetEl.innerText;
                const newText = prompt(`Редактировать текст [${id}]:`, currentText);
                if (newText !== null && newText.trim() !== '') {
                    targetEl.innerText = newText;
                    const stateToSave = { 
                        x: Math.round(posRef.current.x), 
                        y: Math.round(posRef.current.y), 
                        scale: Number(posRef.current.scale.toFixed(3)),
                        text: newText,
                        hidden: isHidden,
                        zIndex: zIndex
                    };
                    safeSetItem(`react_debug_pos_${id}`, JSON.stringify(stateToSave));
                }
            }
        }
    };

    const editorClasses = isEditorMode ? ' cursor-move z-[100]' : '';

    // Если элемент скрыт, мы показываем его только в режиме редактора с сильной прозрачностью
    if (isHidden && !isEditorMode) return null;
    
    const finalOpacity = isHidden && isEditorMode ? 0.3 : (isEditorMode && dragState.current.isDragging ? 0.8 : alpha);
    
    const dragStyle = {
        transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`,
        color: customColor,
        touchAction: 'none',
        opacity: finalOpacity,
        zIndex: zIndex
    } as React.CSSProperties;

    return (
        <div
            ref={elementRef}
            className={`${className}${editorClasses}`}
            style={{ ...(props.style || {}), ...dragStyle }}
            onPointerDown={onPointerDown}
            onDoubleClick={onDoubleClick}
            onDragStart={(e) => isEditorMode && e.preventDefault()}
            {...props}
        >
            {children}
            {isEditorMode && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-green-500 z-[1000]">
                    {/* Pivot (Anchor Point) */}
                    <div className="absolute w-3 h-3 bg-red-500 rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2 shadow-md border border-white" />
                    {/* Label */}
                    <div className="absolute -top-14 left-0 bg-black/90 text-green-400 text-xs font-mono p-1 border border-green-500/50 rounded whitespace-nowrap shadow-lg">
                        <div className="font-bold text-white">{id}</div>
                        <div>Pos: {Math.round(pos.x)}, {Math.round(pos.y)}</div>
                        <div>Size: {elementRef.current?.offsetWidth || 0}x{elementRef.current?.offsetHeight || 0}</div>
                    </div>
                </div>
            )}
        </div>
    );
};
