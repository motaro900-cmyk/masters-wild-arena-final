import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

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
  { id: 'STORE',      label: 'МАГАЗИН',   top: 8,   height: 95 },
  { id: 'INVENTORY', label: 'ИНВЕНТАРЬ', top: 104, height: 90 },
  { id: 'HEROES',    label: 'ГЕРОИ',      top: 196, height: 90 },
  { id: 'CLAN',      label: 'КЛАН',      top: 288, height: 90 },
  { id: 'RANKING',   label: 'РЕЙТИНГ',   top: 382, height: 90 },
];

export const LeftSidebar: React.FC<{ onOpenWindow: (n: string) => void }> = ({ onOpenWindow }) => {
  const activeScreen = useGameStore(state => state.activeScreen);

  return (
    <div style={{
      backgroundImage: `url(${AssetsMap.UI.SIDEBAR_LEFT})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      width: 300,
      height: 520,
      position: 'relative',
      pointerEvents: 'auto',
    }}>
      {MENU_ITEMS.map((item) => (
        <SideMenuItem
          key={item.id}
          item={item}
          isActive={activeScreen === item.id}
          onClick={() => onOpenWindow(item.id)}
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
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      top: item.top,
      left: 0,
      width: '100%',
      height: item.height,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 135,
      background: isActive
        ? 'linear-gradient(90deg, rgba(240,192,64,0.1) 0%, rgba(240,192,64,0) 100%)'
        : 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease-out',
      textAlign: 'left',
    }}
  >
    <span style={{
      fontFamily: "'Cinzel', serif",
      fontSize: 15,
      fontWeight: 800,
      color: isActive ? '#f0c040' : '#c8a870',
      letterSpacing: '1.5px',
      textShadow: '0 2px 4px rgba(0,0,0,1)',
      userSelect: 'none',
      textTransform: 'uppercase'
    }}>
      {item.label}
    </span>

    {isActive && (
      <div style={{ 
        position: 'absolute',
        right: 25,
        width: 8, 
        height: 8, 
        backgroundColor: '#f0c040', 
        borderRadius: '50%',
        boxShadow: '0 0 10px #f0c040'
      }} />
    )}
  </button>
);
