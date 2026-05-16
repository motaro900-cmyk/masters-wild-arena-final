import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useDebugStore } from '@store/useDebugStore';

interface Props {
    id: string;
    children: React.ReactNode;
}

export const EditableWidget: React.FC<Props> = ({ id, children }) => {
    const isEditMode = useDebugStore((state: any) => state.isEditorMode);
    const element = useUIStore((state) => state.elements[id]) as any;
    const updateProps = useUIStore((state) => (state as any).updateElementProps);

    const setSelected = useDebugStore((state: any) => state.setSelected);
    const selectedId = useDebugStore((state: any) => state.selectedId);

    const [isDragging, setIsDragging] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const [textValue, setTextValue] = useState('');

    const widgetRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
    const currentDragPos = useRef({ x: 0, y: 0 });

    const isSelected = selectedId === id && isEditMode;

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditMode || isEditingText) return;
        e.stopPropagation();

        setSelected(id, { ...element, type: 'ui-widget' });

        setIsDragging(true);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            initialX: element.x || 0,
            initialY: element.y || 0,
        };
        currentDragPos.current = { x: element.x || 0, y: element.y || 0 };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !isEditMode) return;

        const wrapper = document.getElementById('game-wrapper') || document.body;
        const zoom = wrapper ? wrapper.getBoundingClientRect().width / 1920 : 1;

        const deltaX = (e.clientX - dragStart.current.x) / zoom;
        const deltaY = (e.clientY - dragStart.current.y) / zoom;

        let newX = dragStart.current.initialX + deltaX;
        let newY = dragStart.current.initialY + deltaY;

        const uiStore = useUIStore.getState() as any;
        const isGridEnabled = uiStore.isGridEnabled ?? useDebugStore.getState().snapToGrid;
        if (isGridEnabled) {
            newX = Math.round(newX / 10) * 10;
            newY = Math.round(newY / 10) * 10;
        }

        currentDragPos.current = { x: newX, y: newY };

        const dx = newX - dragStart.current.initialX;
        const dy = newY - dragStart.current.initialY;

        // Прямая манипуляция DOM для производительности (без ре-рендеров React)
        if (widgetRef.current) {
            widgetRef.current.style.left = `${newX}px`;
            widgetRef.current.style.top = `${newY}px`;
        }

        const allElements = uiStore.elements;
        const getChildrenIds = (parentId: string): string[] => {
            const children = Object.values(allElements).filter((el: any) => el.parentId === parentId);
            let ids = children.map((c: any) => c.id);
            children.forEach((c: any) => {
                ids = [...ids, ...getChildrenIds(c.id)];
            });
            return ids;
        };

        const childIds = getChildrenIds(id);
        childIds.forEach((childId) => {
            const childDOM = document.getElementById(childId);
            const childEl = allElements[childId];
            if (childDOM && childEl) {
                childDOM.style.left = `${childEl.x + dx}px`;
                childDOM.style.top = `${childEl.y + dy}px`;
            }
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        // Сохраняем итоговую позицию в Zustand один раз при отпускании
        const newX = currentDragPos.current.x;
        const newY = currentDragPos.current.y;

        const dx = newX - dragStart.current.initialX;
        const dy = newY - dragStart.current.initialY;

        if (dx !== 0 || dy !== 0) {
            const uiStore = useUIStore.getState() as any;
            updateProps(id, { x: newX, y: newY });
            useDebugStore.getState().updateSelected({ x: newX, y: newY });

            const allElements = uiStore.elements;
            const getChildrenIds = (parentId: string): string[] => {
                const children = Object.values(allElements).filter((el: any) => el.parentId === parentId);
                let ids = children.map((c: any) => c.id);
                children.forEach((c: any) => {
                    ids = [...ids, ...getChildrenIds(c.id)];
                });
                return ids;
            };

            const childIds = getChildrenIds(id);
            childIds.forEach((childId) => {
                const childEl = allElements[childId];
                if (childEl) {
                    updateProps(childId, { x: childEl.x + dx, y: childEl.y + dy });
                }
            });
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isEditMode) return;
        if (e.shiftKey || e.ctrlKey) {
            e.stopPropagation();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            const newScale = Math.max(0.05, (element.scale ?? 1) + delta);
            updateProps(id, { scale: newScale });
            useDebugStore.getState().updateSelected({ scale: newScale });
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (!isEditMode) return;
        e.stopPropagation();
        setIsEditingText(true);
        setTextValue(element.text || '');
    };

    const handleTextSave = () => {
        setIsEditingText(false);
        if (textValue !== element.text) {
            updateProps(id, { text: textValue });
            useDebugStore.getState().updateSelected({ text: textValue });
        }
    };

    useEffect(() => {
        const handleHudUpdate = (e: any) => {
            if (e.detail.id === id) updateProps(id, e.detail.props);
        };
        window.addEventListener('hud_editor_update', handleHudUpdate);
        return () => window.removeEventListener('hud_editor_update', handleHudUpdate);
    }, [id, updateProps]);

    if (!element || element.isVisible === false) return null;

    const dragStyle: React.CSSProperties = {
        position: 'absolute',
        left: element.x,
        top: element.y,
        transform: `scale(${element.scale ?? 1}) rotate(${element.rotation ?? 0}deg)`,
        opacity: element.alpha ?? 1,
        zIndex: element.zIndex ?? 50,
        color: element.color || element.tint,
        touchAction: 'none',
        pointerEvents: isEditMode ? 'auto' : 'none',
    };

    return (
        <div
            id={id}
            ref={widgetRef}
            style={dragStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            className={`origin-top-left ${isEditMode ? 'cursor-move' : ''} ${isSelected ? 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-[9999]' : ''}`}
        >
            <div className={isEditMode && !isEditingText ? 'pointer-events-none' : 'pointer-events-auto'}>
                {isEditingText ? (
                    <input
                        type="text"
                        autoFocus
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        onBlur={handleTextSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleTextSave()}
                        className="bg-black/80 text-white border-2 border-cyan-400 rounded px-2 py-1 text-center font-bold outline-none shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                ) : (
                    children
                )}
            </div>
            {isSelected && (
                <div className="absolute -top-6 left-0 bg-cyan-500 text-black text-[10px] px-2 py-0.5 rounded font-black whitespace-nowrap shadow-md pointer-events-none">
                    {id}
                </div>
            )}
        </div>
    );
};
