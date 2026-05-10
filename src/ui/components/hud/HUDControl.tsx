import React from 'react';
import { useUIStore } from '../../../store/useUIStore';

interface Props {
    id: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * БЕЗОПАСНЫЙ HUDControl (БЕЗ СТОРОННИХ ЗАВИСИМОСТЕЙ)
 * Временно отключаем логику сторов для диагностики видимости.
 */
export const HUDControl: React.FC<Props> = ({ id, children, className, style }) => {
    const element = useUIStore((state) => state.elements[id]);
    
    // Если элемент не найден или это контейнер-пустышка, просто рендерим детей
    if (!element) return <div id={`hud-ctrl-${id}`} className={className} style={{ position: 'relative', pointerEvents: 'auto', ...style }}>{children}</div>;

    return (
        <div 
            id={`hud-ctrl-${id}`}
            className={className}
            style={{ 
                position: 'absolute', // Теперь элементы позиционируются абсолютно согласно данным из Unity
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: element.width ? `${element.width}px` : undefined,
                height: element.height ? `${element.height}px` : undefined,
                pointerEvents: 'auto',
                zIndex: element.zIndex || 0,
                visibility: element.isVisible === false ? 'hidden' : 'visible',
                transform: element.scale ? `scale(${typeof element.scale === 'number' ? element.scale : element.scale.x})` : undefined,
                ...style 
            }}
        >
            {children}
        </div>
    );
};
