import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useUIStore } from '../../store/useUIStore';

interface Props {
    id: string;
    bgSrc: string; // Путь к нарезанной PNG-подложке
    width: number;
    height: number;
}

/**
 * HOC-компонент, который в режиме игры является просто картинкой с текстом,
 * а в режиме редактора (isEditMode) позволяет перетаскивать себя и редактировать текст.
 */
export const EditableUIElement: React.FC<Props> = ({ id, bgSrc, width, height }) => {
    const isEditMode = useUIStore((state) => state.isEditMode);
    const elConfig = useUIStore((state) => state.elements[id]);
    const updateElementText = useUIStore((state) => state.updateElementText);

    const [isEditingText, setIsEditingText] = useState(false);

    // Интеграция DndKit для перетаскивания
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
        disabled: !isEditMode || isEditingText,
    });

    if (!elConfig || !elConfig.isVisible) return null;

    // Визуальное смещение во время перетаскивания
    const dragTransform = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: elConfig.x,
        top: elConfig.y,
        width,
        height,
        transform: dragTransform,
        zIndex: isEditMode ? 100 : 1,
        pointerEvents: isEditMode ? 'auto' : 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group"
            {...(isEditMode && !isEditingText ? listeners : {})}
            {...(isEditMode && !isEditingText ? attributes : {})}
        >
            {/* Игровой Ассет: Подложка без CSS эффектов */}
            <img
                src={bgSrc}
                alt={`UI-${id}`}
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none drop-shadow-lg"
                draggable={false}
            />

            {/* Игровой Ассет: Текст */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {isEditMode && isEditingText ? (
                    <input
                        autoFocus
                        className="pointer-events-auto bg-black/70 text-white text-center border-b-2 border-yellow-400 outline-none w-[90%] font-game"
                        style={{ fontSize: elConfig.fontSize }}
                        value={elConfig.text}
                        onChange={(e) => updateElementText(id, e.target.value)}
                        onBlur={() => setIsEditingText(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingText(false)}
                    />
                ) : (
                    <span
                        className="text-white font-black text-center whitespace-pre-wrap leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-auto"
                        style={{ fontSize: elConfig.fontSize, WebkitTextStroke: '1px #3e2b18' }}
                        onDoubleClick={(e) => {
                            if (isEditMode) {
                                e.stopPropagation();
                                setIsEditingText(true);
                            }
                        }}
                    >
                        {elConfig.text}
                    </span>
                )}
            </div>

            {/* Рамка выделения в режиме редактора */}
            {isEditMode && (
                <div className="absolute inset-0 border-2 border-dashed border-cyan-400 opacity-50 group-hover:opacity-100 pointer-events-none transition-opacity" />
            )}
        </div>
    );
};
