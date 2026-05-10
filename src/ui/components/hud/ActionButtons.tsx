import React from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';

/**
 * ActionButtons (v2.5) — Еще больший сдвиг Рейтинга вправо.
 */
export const ActionButtons: React.FC<{ onStartBattle: () => void }> = ({ onStartBattle }) => {
  return (
    <div style={{
      width: 640,
      height: 160,
      position: 'relative',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Главный спрайт панели */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${AssetsMap.UI.BTN_BATTLE_GROUP})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}>
        
        {/* ЛЕВЫЙ БЛОК: РЕЙТИНГ */}
        <div style={{
          position: 'absolute',
          top: '12%',
          left: '12%',
          width: '35%',
          height: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '110px', // Значительно сдвинули вправо (было 40)
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          fontWeight: 800,
          color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)',
        }}>
          РЕЙТИНГ: 1250
        </div>

        {/* ПРАВЫЙ БЛОК: ЛИГА */}
        <div style={{
          position: 'absolute',
          top: '12%',
          right: '12%',
          width: '35%',
          height: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: '40px',
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          fontWeight: 800,
          color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)',
        }}>
          ЛИГА: МАСТЕР
        </div>

        {/* НИЖНИЙ БЛОК — КНОПКИ БОЯ */}
        <div style={{
          position: 'absolute',
          bottom: '7%',
          left: '1%',
          right: '1%',
          height: '52%',
          display: 'flex',
        }}>
          {/* ЛЕВАЯ КНОПКА (Синяя) */}
          <button 
            onClick={onStartBattle}
            style={{
              flex: '0 0 35%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 14,
              fontWeight: 900,
              color: '#a0c0ff',
              textShadow: '0 0 8px rgba(0,0,0,1)',
              transition: 'all 0.2s',
              paddingLeft: '45px'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,100,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            РАЗМИНКА
          </button>

          {/* ПРАВАЯ КНОПКА (Красная) */}
          <button 
            onClick={onStartBattle}
            style={{
              flex: '1',
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 19,
              fontWeight: 950,
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0,0,0,1)',
              transition: 'all 0.2s',
              paddingRight: '65px'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,50,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            РЕЙТИНГОВЫЙ БОЙ
          </button>
        </div>
      </div>
    </div>
  );
};
