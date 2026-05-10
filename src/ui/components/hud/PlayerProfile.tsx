import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getRankInfo } from '../../../configs/RankSystem';
import { resolveAssetPath } from '../../../utils/assetPath';

interface PlayerProfileProps {
  onOpenRanks?: () => void;
}

/**
 * PlayerProfile (v3.9) — Исправление "белого квадрата".
 * Тег img заменен на div с фоном, чтобы скрыть ошибки загрузки.
 */
export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onOpenRanks }) => {
  const { avatar, title, level, exp, trophies = 2850 } = useGameStore();
  const xpPercent = Math.min(exp || 0, 100);
  const rank = getRankInfo(trophies);

  // Нормализация пути аватара
  const avatarUrl = avatar?.includes('/') ? avatar : resolveAssetPath(`/assets/images/avatars/${avatar || 'панда.png'}`);

  return (
    <div style={{
      /* СПРАЙТ фона профиля */
      backgroundImage: `url(${AssetsMap.UI.PANEL_PROFILE})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      width: 440,
      height: 135,
      display: 'flex',
      alignItems: 'center',
      padding: '0 30px 0 25px',
      pointerEvents: 'auto',
      cursor: 'pointer'
    }} onClick={onOpenRanks}>
      
      {/* Аватар (Используем DIV вместо IMG для чистоты) */}
      <div style={{ 
        position: 'relative', 
        flexShrink: 0, 
        marginLeft: 18,
        width: 100, 
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '80%', 
          height: '80%',
          overflow: 'hidden',
      backgroundImage: `url(${avatarUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
      </div>

      {/* Текстовая информация */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 30, paddingBottom: 5 }}>
        <p style={{
          margin: 0, fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 900, color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)', textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title || 'ИГРОК'}
        </p>

        {/* XP Bar */}
        <div style={{ marginTop: 12, width: '95%' }}>
          <div style={{
            width: '100%', height: 12, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(180,140,40,0.5)',
            borderRadius: 6, overflow: 'hidden',
          }}>
            <div 
              style={{
                width: `${xpPercent}%`, height: '100%',
                background: 'linear-gradient(90deg, #a06010, #f0c040 50%, #a06010)',
                boxShadow: '0 0 10px rgba(240,192,64,0.5)',
              }} 
            />
          </div>
        </div>
      </div>

      {/* БЛОК РАНГА В ПРАВОЙ ЧАСТИ */}
      <div style={{
        position: 'absolute',
        right: '25px',
        top: '35%', // Поднял еще выше
        transform: 'translateY(-50%)',
        width: '90px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ 
            color: rank.color, 
            fontSize: '13px', 
            fontWeight: 900, 
            fontFamily: "'Cinzel', serif",
            textShadow: '0 2px 4px #000',
            letterSpacing: '0.5px',
            marginBottom: '2px'
        }}>
            {rank.name}
        </div>
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px'
        }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 900, textShadow: '0 2px 5px #000' }}>{trophies}</span>
            <span style={{ fontSize: '14px' }}>🏆</span>
        </div>
      </div>
    </div>
  );
};
