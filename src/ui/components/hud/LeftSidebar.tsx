import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';

interface MenuItem {
    id: string;
    label: string;
    top: number;
    height: number;
}

/**
 * MENU_ITEMS (v5.4) — Финальная подтяжка вверх.
 */
const MENU_ITEMS: MenuItem[] = [
    { id: 'STORE', label: 'МАГАЗИН', top: 9, height: 94 },
    { id: 'INVENTORY', label: 'ИНВЕНТАРЬ', top: 103, height: 88 },
    { id: 'HEROES', label: 'ГЕРОИ', top: 195, height: 88 },
    { id: 'CLAN', label: 'КЛАН', top: 287, height: 88 },
    { id: 'RANKING', label: 'РЕЙТИНГ', top: 379, height: 88 },
];

export const LeftSidebar: React.FC<{ onOpenWindow: (n: string) => void }> = ({ onOpenWindow }) => {
    const activeScreen = useGameStore((state) => state.activeScreen);

    return (
        <div
            style={{
                backgroundImage: `url(${AssetsMap.UI.SIDEBAR_LEFT})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                width: 320,
                height: 515,
                position: 'relative',
                pointerEvents: 'auto',
                // Углубляем чёрный в спрайте: contrast(1.28) сжимает тёмные зоны до ~5%
                // brightness(0.80) не даёт золоту пожелтеть — оно в металлической зоне спрайта и выдерживает его
                filter: 'contrast(1.28) brightness(0.80)',
            }}
        >
            {MENU_ITEMS.map((item) => (
                <SideMenuItem
                    key={item.id}
                    item={item}
                    isActive={activeScreen === item.id}
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        onOpenWindow(item.id);
                    }}
                />
            ))}
        </div>
    );
};

const SideMenuItem: React.FC<{
    item: MenuItem;
    isActive: boolean;
    onClick: () => void;
}> = ({ item, isActive, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={`tutorial-${item.id.toLowerCase()}-btn`}
        style={{
            position: 'absolute',
            top: item.top,
            left: 0,
            width: '100%',
            height: item.height,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 145,
            background: isActive
                ? 'linear-gradient(90deg, rgba(240,192,64,0.1) 0%, rgba(240,192,64,0) 100%)'
                : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease-out',
            textAlign: 'left',
        }}
    >
        <span
            style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 17,
                fontWeight: 800,
                // Активная: пик яркости ~95% (#ffe066) + внутренний 1px светлый кант
                // Неактивная: чуть ярче (#d4a96a) чтобы читалась на углублённом фоне
                color: isActive ? '#ffe066' : '#d4a96a',
                letterSpacing: '1.5px',
                textShadow: isActive
                    ? '0 1px 0 rgba(255,240,160,0.4), 0 2px 8px rgba(0,0,0,0.95), 0 0 12px rgba(240,192,64,0.25)'
                    : '0 1px 0 rgba(255,220,120,0.15), 0 2px 6px rgba(0,0,0,0.9)',
                userSelect: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.15s, text-shadow 0.15s',
            }}
        >
            {item.label}
        </span>

        {isActive && (
            <div
                style={{
                    position: 'absolute',
                    right: 25,
                    width: 8,
                    height: 8,
                    backgroundColor: '#f0c040',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px #f0c040',
                }}
            />
        )}
    </motion.button>
);
