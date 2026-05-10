import React from 'react';
import { cn } from '../../../utils/cn';
import { resolveAssetPath } from '../../../utils/assetPath';

/**
 * ЦВЕТОВАЯ ПАЛИТРА ИЗ ФОТО:
 * Темное дерево: #1a0f0a
 * Золото: #c48b3b
 * Медь: #8a5a2a
 */

/**
 * КРУГЛАЯ КНОПКА (Шоколад + Золото)
 */
export const GfxRoundButton: React.FC<{ 
    icon: string; 
    onClick?: () => void; 
    size?: number;
    notification?: number;
    className?: string;
    style?: React.CSSProperties;
}> = ({ icon, onClick, size = 64, notification, className, style }) => (
    <div 
        onClick={onClick}
        className={cn("relative cursor-pointer active:scale-90 transition-all group", className)}
        style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
        <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'radial-gradient(circle, #2b1d11 0%, #0c0a09 100%)', // Глубокий шоколад
            border: '3px solid #8a5a2a', // Медь
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.9), inset 0 0 15px rgba(196,139,59,0.2)'
        }} className="group-hover:border-[#c48b3b]" />
        
        <img 
            src={resolveAssetPath(`/assets/images/ui/${icon}.png`)} 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '18px', filter: 'drop-shadow(0 2px 4px black) sepia(0.2) brightness(1.1)' }} 
            alt="" 
        />
        
        {notification && (
            <div style={{ 
                position: 'absolute', top: '-2px', right: '-2px', minWidth: '22px', height: '22px', 
                backgroundColor: '#991b1b', borderRadius: '50%', border: '2px solid #fde68a',
                color: 'white', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}>{notification}</div>
        )}
    </div>
);

/**
 * ЗОЛОТАЯ ПАНЕЛЬ (Тонированная под медь/золото с фото)
 */
export const GfxGoldPanel: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => (
    <div 
        className={cn("relative border-[16px] border-transparent shadow-2xl", className)}
        style={{
            borderImageSource: `url('${resolveAssetPath('/assets/images/ui/social_bar_bg.png')}')`,
            borderImageSlice: '40 fill',
            filter: 'sepia(0.2) saturate(1.2) brightness(0.85) contrast(1.1)', // Эффект старого золота
            ...style
        }}
    >
        <div className="relative z-10 w-full h-full flex items-center">
            {children}
        </div>
    </div>
);

/**
 * ТЕМНОЕ ДЕРЕВО (Максимально темное)
 */
export const GfxWoodPanel: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => (
    <div 
        className={cn("relative border-[18px] border-transparent shadow-inner", className)}
        style={{
            borderImageSource: `url('${resolveAssetPath('/assets/images/ui/panel_dark.png')}')`,
            borderImageSlice: '40 fill',
            filter: 'brightness(0.7) contrast(1.2)', // Делаем дерево почти черным шоколадом
            ...style
        }}
    >
        <div className="relative z-10 w-full h-full">
            {children}
        </div>
    </div>
);

/**
 * МЕНЮ КНОПКА (Унифицированная под фото)
 */
export const GfxMenuButton: React.FC<{ 
    children: React.ReactNode; 
    onClick?: () => void; 
    className?: string;
    variant?: 'bronze' | 'gold' | 'red';
    style?: React.CSSProperties;
}> = ({ children, onClick, className, variant = 'bronze', style }) => {
    
    const filterMap = {
        bronze: 'sepia(0.3) brightness(0.7) contrast(1.2)', // Темная бронза
        gold: 'sepia(0.1) brightness(1.1)',
        red: 'hue-rotate(-55deg) saturate(1.8) brightness(0.8) contrast(1.2)' // Глубокий красный кристалл
    };

    return (
        <div 
            onClick={onClick}
            className={cn("relative cursor-pointer active:scale-95 transition-all group", className)}
            style={style}
        >
            <img 
                src={resolveAssetPath(`/assets/images/ui/${variant === 'red' || variant === 'gold' ? 'btn_battle_gold' : 'btn_bronze'}.png`)} 
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', filter: filterMap[variant] }} 
                className="group-hover:brightness-110"
                alt="" 
            />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

/**
 * ПРОГРЕСС-БАР (Золотой блеск)
 */
export const GfxProgressBar: React.FC<{ value: number; max: number; color?: string; className?: string }> = ({ value, max, color = '#c48b3b', className }) => {
    const pct = Math.min(100, (value / (max || 1)) * 100);
    return (
        <div className={cn("relative h-3 w-full bg-[#0c0a09] rounded-full border border-[#451a03] overflow-hidden shadow-inner", className)}>
            <div 
                className="h-full transition-all duration-700"
                style={{ 
                    width: `${pct}%`, 
                    background: `linear-gradient(180deg, #fef3c7 0%, ${color} 50%, #8a5a2a 100%)`, // Металлический градиент
                    boxShadow: `0 0 15px ${color}66` 
                }}
            />
        </div>
    );
};

/**
 * АВАТАР (В стиле фото)
 */
export const AvatarFrame: React.FC<{ avatarFilename: string; frameFilename: string; size?: number }> = ({ avatarFilename, frameFilename, size = 64 }) => {
    const avatarSrc = resolveAssetPath(`/assets/images/avatars/${avatarFilename}.png`);
    const frameSrc = resolveAssetPath(`/assets/images/frames/${frameFilename}.png`);
    return (
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, filter: 'drop-shadow(0 8px 15px rgba(0,0,0,0.8))' }}>
            <div style={{ position: 'absolute', inset: '12%', borderRadius: '50%', overflow: 'hidden', background: '#0c0a09', border: '2px solid #8a5a2a' }}>
                <img src={avatarSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <img src={frameSrc} style={{ position: 'absolute', inset: '-15%', width: '130%', height: '130%', objectFit: 'contain', filter: 'sepia(0.1) saturate(1.2) brightness(0.9)' }} alt="" />
        </div>
    );
};
