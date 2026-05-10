import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';

const RESOURCES = [
  { key: 'energy', label: 'Энергия', sprite: AssetsMap.UI.BAR_ENERGY, color: '#f0c040' },
  { key: 'gold',   label: 'Золото',  sprite: AssetsMap.UI.BAR_GOLD,   color: '#fff' },
  { key: 'gems',   label: 'Кристаллы',sprite: AssetsMap.UI.BAR_GEM,    color: '#fff' },
];

interface ResourceBarProps {
  onOpenShop?: (tab: string) => void;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ onOpenShop }) => {
  const { gold, crystals, energy } = useGameStore();
  const values = { energy: `${energy}/50`, gold, gems: crystals };

  return (
    <div className="flex items-center gap-1.5 pointer-events-auto">
      {RESOURCES.map(res => (
        <div key={res.key} style={{
          position: 'relative',
          width: 145,
          height: 34,
          backgroundImage: `url(${res.sprite})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
        }}>
          {/* Значение ресурса */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            paddingRight: 28, 
            paddingLeft: 34,
          }}>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 16,
              fontWeight: 900,
              color: res.color,
              textShadow: '0 2px 4px rgba(0,0,0,1)',
              letterSpacing: '0.2px',
            }}>
              {/* @ts-ignore */}
              {typeof values[res.key] === 'number' ? values[res.key].toLocaleString() : values[res.key]}
            </span>
          </div>

          <button 
            onClick={() => onOpenShop?.(res.key === 'energy' ? 'ENERGY' : 'RESOURCES')}
            style={{
              position: 'absolute',
              right: 4,
              width: 24,
              height: 24,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 5
            }} 
          />
        </div>
      ))}
    </div>
  );
};
