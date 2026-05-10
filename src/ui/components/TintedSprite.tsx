import React from 'react';

interface TintedSpriteProps extends React.HTMLAttributes<HTMLDivElement> {
    src: string;          // Путь к Grayscale спрайту
    tint: string;         // Hex-код цвета (например, из ThemeConfig)
    className?: string;   // Дополнительные Tailwind классы
    blendMode?: 'color' | 'overlay' | 'multiply'; // Режим наложения
}

/**
 * Компонент динамического перекрашивания Grayscale спрайтов.
 * Накладывает цветной фильтр, строго соблюдая заданный Hex-код,
 * и сохраняет яркость (Luminosity) оригинального спрайта.
 * Блики остаются светлыми, тени — темными.
 */
export const TintedSprite: React.FC<TintedSpriteProps> = ({ 
    src, 
    tint, 
    className = '', 
    blendMode = 'color',
    ...props 
}) => {
    return (
        <div
            className={`relative inline-block overflow-hidden ${className}`}
            style={{
                // Маскируем контейнер по форме спрайта (учитывает альфа-канал прозрачности)
                WebkitMaskImage: `url(${src})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                ...props.style
            }}
            {...props}
        >
            {/* Базовый черно-белый спрайт (Grayscale), формирующий объем */}
            <img src={src} className="block w-full h-full object-contain pointer-events-none" alt="tinted-sprite" />
            
            {/* Слой перекрашивания (Tint) */}
            <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                    backgroundColor: tint, 
                    // 'color' сохраняет Luminosity нижнего слоя, заменяя Hue и Saturation.
                    mixBlendMode: blendMode 
                }} 
            />
        </div>
    );
};
