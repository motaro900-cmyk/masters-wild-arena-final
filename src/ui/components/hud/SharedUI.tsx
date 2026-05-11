import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useGameStore } from '../../../store/useGameStore';
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
}> = ({ icon, onClick, size = 64, notification, className, style }) => {
    const isLow = useGameStore(state => state.graphicsQuality === 'LOW');
    return (
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
            boxShadow: isLow ? 'none' : '0 4px 12px rgba(0,0,0,0.9), inset 0 0 15px rgba(196,139,59,0.2)'
        }} className="group-hover:border-[#c48b3b]" />

        <img
            src={resolveAssetPath(`/assets/images/ui/${icon}.png`)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '18px', filter: isLow ? 'none' : 'drop-shadow(0 2px 4px black) sepia(0.2) brightness(1.1)' }}
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
};

/**
 * ЗОЛОТАЯ ПАНЕЛЬ (Тонированная под медь/золото с фото)
 */
export const GfxGoldPanel: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => {
    const isLow = useGameStore(state => state.graphicsQuality === 'LOW');
    return (
    <div
        className={cn("relative border-[16px] border-transparent", !isLow && "shadow-2xl", className)}
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
};

/**
 * ТЕМНОЕ ДЕРЕВО (Максимально темное)
 */
export const GfxWoodPanel: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => {
    const isLow = useGameStore(state => state.graphicsQuality === 'LOW');
    return (
    <div
        className={cn("relative border-[18px] border-transparent", !isLow && "shadow-inner", className)}
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
};

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

    const isLow = useGameStore(state => state.graphicsQuality === 'LOW');
    return (
        <div
            onClick={onClick}
            className={cn("relative cursor-pointer active:scale-95 transition-all group", className)}
            style={style}
        >
            <img
                src={resolveAssetPath(`/assets/images/ui/${variant === 'red' || variant === 'gold' ? 'btn_battle_gold' : 'btn_bronze'}.png`)}
                style={{ 
                    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', 
                    filter: isLow ? 'none' : filterMap[variant] 
                }}
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
 * АВАТАР (В стиле фото) - Улучшенный: больше масштаб, меньше лишних рамок
 */
export const AvatarFrame: React.FC<{
    avatarFilename: string;
    frameFilename: string;
    size?: number;
    showGlow?: boolean;
}> = ({ avatarFilename, frameFilename, size = 64, showGlow = false }) => {
    const isLow = useGameStore(state => state.graphicsQuality === 'LOW');
    const avatarSrc = resolveAssetPath(`/assets/images/avatars/${avatarFilename}.png`);
    const frameSrc = resolveAssetPath(`/assets/images/frames/${frameFilename}.png`);

    return (
        <div
            style={{
                position: 'relative',
                width: `${size}px`,
                height: `${size}px`,
                filter: isLow ? 'none' : (showGlow ? 'drop-shadow(0 0 15px rgba(240,192,64,0.4))' : 'drop-shadow(0 8px 15px rgba(0,0,0,0.6))')
            }}
        >
            {/* Внутренняя часть аватара - теперь без лишней обводки и большего размера */}
            <div style={{
                position: 'absolute',
                inset: '6%', // Было 12%, теперь аватар крупнее
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'radial-gradient(circle, #1a1a1a 0%, #050505 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {avatarFilename.startsWith('sprite:') ? (
                    <div 
                        className={avatarFilename.replace('sprite:', '')} 
                        style={{ width: '100%', height: '100%', backgroundSize: '300% 300%' }} 
                    />
                ) : (
                    <img
                        src={avatarSrc}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt=""
                    />
                )}
            </div>

            {/* Сама рамка */}
            <img
                src={frameSrc}
                style={{
                    position: 'absolute',
                    inset: '-10%', // Было -15%, теперь плотнее прилегает
                    width: '120%',
                    height: '120%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }}
                alt=""
            />
        </div>
    );
};

/**
 * ОКНО "В РАЗРАБОТКЕ" (ДЛЯ ЗБТ)
 */
export const UnderDevelopmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}> = ({ isOpen, onClose, title = "РАЗДЕЛ В РАЗРАБОТКЕ" }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* BACKDROP */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                    />

                    {/* CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            width: '580px',
                            background: 'linear-gradient(135deg, #1a1512 0%, #0c0a09 100%)',
                            border: '2px solid #c48b3b',
                            borderRadius: '32px',
                            padding: '60px 40px',
                            position: 'relative',
                            boxShadow: '0 30px 100px rgba(0,0,0,1), 0 0 50px rgba(196,139,59,0.2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                        }}
                    >
                        {/* DECORATIVE CORNERS */}
                        <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '40px', height: '40px', borderTop: '4px solid #f0c040', borderLeft: '4px solid #f0c040', borderRadius: '10px 0 0 0' }} />
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', borderTop: '4px solid #f0c040', borderRight: '4px solid #f0c040', borderRadius: '0 10px 0 0' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', borderBottom: '4px solid #f0c040', borderLeft: '4px solid #f0c040', borderRadius: '0 0 0 10px' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', borderBottom: '4px solid #f0c040', borderRight: '4px solid #f0c040', borderRadius: '0 0 10px 0' }} />

                        {/* ICON */}
                        <motion.div 
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ fontSize: '80px', marginBottom: '30px', filter: 'drop-shadow(0 0 20px #f0c040)' }}
                        >
                            🛠️
                        </motion.div>

                        {/* HEADER */}
                        <h2 style={{ 
                            color: '#f0c040', fontSize: '32px', margin: '0 0 20px 0', 
                            fontFamily: "'Cinzel', serif", letterSpacing: '4px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' 
                        }}>
                            {title}
                        </h2>

                        {/* TEXT */}
                        <p style={{ 
                            color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: '1.7', 
                            margin: '0 0 40px 0', fontWeight: 600 
                        }}>
                            Мастер, путь в этот раздел еще куётся нашими кузнецами. <br/>
                            <span style={{ color: '#c8a870' }}>Следите за обновлениями Закрытого Бета-Теста!</span>
                        </p>

                        {/* BUTTON */}
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(240,192,64,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            style={{
                                padding: '15px 50px',
                                background: 'linear-gradient(180deg, #c48b3b 0%, #8a5a2a 100%)',
                                border: '2px solid #f0c040',
                                borderRadius: '15px',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                letterSpacing: '2px',
                                fontFamily: "'Cinzel', serif",
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                        >
                            ПОНЯТНО
                        </motion.button>

                        {/* CLOSE X */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '25px', right: '25px',
                                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)',
                                fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                        >
                            ✕
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
