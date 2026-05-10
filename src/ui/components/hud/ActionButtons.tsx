import React from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useGameStore } from '../../../store/useGameStore';
import { getRankInfo } from '../../../configs/RankSystem';

interface ActionButtonsProps {
  onStartBattle: () => void;
  onOpenRanks: () => void;
}

/**
 * ActionButtons (v2.6) — Поддержка системы рангов и кликабельности.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ onStartBattle, onOpenRanks }) => {
  const { rating } = useGameStore();
  const rank = getRankInfo(rating);

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
      <div 
        onClick={onOpenRanks}
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${AssetsMap.UI.BTN_BATTLE_GROUP})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        
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
          paddingLeft: '110px',
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          fontWeight: 800,
          color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)',
          pointerEvents: 'none',
        }}>
          РЕЙТИНГ: {rating}
        </div>

        {/* ПРАВЫЙ БЛОК: РАНГ */}
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
          pointerEvents: 'none',
        }}>
          РАНГ: {rank.name}
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
