import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getRankInfo } from '../../../configs/RankSystem';
import { resolveAssetPath } from '../../../utils/assetPath';

interface PlayerProfileProps {
  onOpenRanks?: () => void;
}

/**
 * PlayerProfile (v6.0) — Спрайт profile_panel_full.png + правильное позиционирование.
 * Размер спрайта: 450×150px. Аватар в шестиугольной рамке слева, контент справа.
 */
export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onOpenRanks }) => {
  const { avatar, title, exp, trophies = 2850, vkUser } = useGameStore();
  const xpPercent = Math.min(exp || 0, 100);
  const rank = getRankInfo(trophies);

  const avatarUrl = vkUser?.photo ||
    (avatar?.includes('/') ? avatar : resolveAssetPath(`/assets/images/avatars/${avatar || 'панда.png'}`));

  return (
    <div
      onClick={onOpenRanks}
      style={{
        position: 'relative',
        width: 450,
        height: 150,
        cursor: 'pointer',
        pointerEvents: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Спрайт фона — деревянная панель с золотой рамкой */}
      <img
        src={AssetsMap.UI.PANEL_PROFILE}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        alt=""
      />

      {/* АВАТАР — вписан в шестиугольную рамку спрайта */}
      <div style={{
        position: 'absolute',
        top: 33,
        left: 43,
        width: 82,
        height: 82,
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundImage: `url(${avatarUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1a0e04',
      }} />

      {/* ПРАВАЯ ЧАСТЬ — заголовок + XP + ранг */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: 148,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {/* Заголовок */}
        <p style={{
          margin: 0,
          fontFamily: "'Cinzel', serif",
          fontSize: 15,
          fontWeight: 900,
          color: '#f0c040',
          textShadow: '0 1px 4px rgba(0,0,0,1)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title || 'ИГРОК'}
        </p>

        {/* XP Bar */}
        <div style={{ width: '85%', height: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(180,140,40,0.3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${xpPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #7a4800, #f0c040 50%, #7a4800)',
            boxShadow: '0 0 5px rgba(240,192,64,0.5)',
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Ранг + Кубки — строка под XP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          {/* Кубки */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>🏆</span>
            <span style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 900,
              fontFamily: "'Cinzel', serif",
              textShadow: '0 2px 4px #000',
            }}>
              {trophies}
            </span>
          </div>

          {/* Разделитель */}
          <div style={{ width: 1, height: 14, background: 'rgba(240,192,64,0.3)' }} />

          {/* Название ранга */}
          <span style={{
            color: rank.color,
            fontSize: 11,
            fontWeight: 900,
            fontFamily: "'Cinzel', serif",
            textShadow: '0 1px 3px #000',
            letterSpacing: 0.5,
          }}>
            {rank.name}
          </span>
        </div>
      </div>
    </div>
  );
};
