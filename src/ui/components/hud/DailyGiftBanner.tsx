import React from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';

/**
 * DailyGiftBanner (v4.4) — Тонкая настройка: текст чуть левее.
 */
export const DailyGiftBanner: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div 
    onClick={onClick}
    style={{
      backgroundImage: `url(${AssetsMap.UI.ICON_GIFT})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      width: 360, 
      height: 90, 
      cursor: 'pointer',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end', 
      paddingRight: 110, 
      pointerEvents: 'auto',
      transition: 'transform 0.2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
  >
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 18,
        fontWeight: 900,
        color: '#f0c040',
        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
        lineHeight: '1.1',
        whiteSpace: 'nowrap'
      }}>
        ЕЖЕДНЕВНЫЙ<br/>ПОДАРОК
      </span>
    </div>

    {/* Красный индикатор */}
    <div style={{
      position: 'absolute',
      top: 8,
      right: 16,
      width: 24,
      height: 24,
      background: 'radial-gradient(circle, #f03030, #a01010)',
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif",
      fontSize: 14,
      fontWeight: 900,
      color: 'white',
    }}>
      !
    </div>
  </div>
);
