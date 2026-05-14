import React from 'react';
import { AssetsMap } from '../../../configs/AssetsMap';
import { useGameStore } from '../../../store/useGameStore';
import { getRankInfo } from '../../../configs/RankSystem';
import { audioService } from '../../../services/AudioService';

interface ActionButtonsProps {
  onStartBattle: () => void;
  onWarmup: () => void;
  onOpenRanks: () => void;
}

/**
 * ActionButtons (v2.7) — Поддержка модалки разработки для ЗБТ.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ onStartBattle, onWarmup, onOpenRanks }) => {
  const { rating } = useGameStore();
  const rank = getRankInfo(rating);

  return (
    <div style={{
      width: 720,
      height: 180,
      position: 'relative',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Главный спрайт панели */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${AssetsMap.UI.BTN_BATTLE_GROUP})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        {/* Clickable Rank Area (Top part only) */}
        <div 
          onClick={() => {
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
            onOpenRanks();
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            cursor: 'pointer',
            zIndex: 1
          }}
        />

        {/* ЛЕВАЯ ИКОНКА: КУБОК */}
        <div style={{
          position: 'absolute',
          top: '7%',
          left: '14%',
          width: '52px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <img 
            src={AssetsMap.UI.TROPHY_PREMIUM} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} 
            alt="trophy" 
          />
        </div>

        {/* ПРАВАЯ ИКОНКА: РАНГ (ДИНАМИЧЕСКАЯ) */}
        <div style={{
          position: 'absolute',
          top: '7%',
          right: '4%',
          width: '52px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          <img 
            src={rank.icon} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} 
            alt="rank-icon" 
          />
        </div>

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
          fontSize: 15,
          fontWeight: 800,
          color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)',
          pointerEvents: 'none',
          zIndex: 3,
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
          paddingRight: '10px',
          fontFamily: "'Cinzel', serif",
          fontSize: 15,
          fontWeight: 800,
          color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)',
          pointerEvents: 'none',
          zIndex: 3,
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
          zIndex: 2 // Above the clickable background
        }}>
          {/* ЛЕВАЯ КНОПКА (Синяя) */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
              onWarmup(); 
            }}
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
              fontSize: 16,
              fontWeight: 900,
              color: '#a0c0ff',
              textShadow: '0 0 8px rgba(0,0,0,1)',
              transition: 'all 0.2s',
              paddingLeft: '55px'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,100,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            РАЗМИНКА
          </button>

          {/* ПРАВАЯ КНОПКА (Красная) */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
              onStartBattle(); 
            }}
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
              fontSize: 22,
              fontWeight: 950,
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(0,0,0,1)',
              transition: 'all 0.2s',
              paddingRight: '75px'
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
