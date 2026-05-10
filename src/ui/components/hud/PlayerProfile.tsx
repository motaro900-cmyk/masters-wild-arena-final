import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getRankInfo } from '../../../configs/RankSystem';
import { resolveAssetPath } from '../../../utils/assetPath';

interface PlayerProfileProps {
  onOpenRanks?: () => void;
}

/**
 * PlayerProfile (v4.0) — Исправлен перекрывающийся layout.
 * - position:relative на контейнере
 * - Ранг в обычном flex-потоке (не absolute)
 * - Уменьшен шрифт заголовка
 */
export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onOpenRanks }) => {
  const { avatar, title, exp, trophies = 2850 } = useGameStore();
  const xpPercent = Math.min(exp || 0, 100);
  const rank = getRankInfo(trophies);

  const avatarUrl = avatar?.includes('/')
    ? avatar
    : resolveAssetPath(`/assets/images/avatars/${avatar || 'панда.png'}`);

  return (
    <div
      style={{
        position: 'relative',
        backgroundImage: `url(${AssetsMap.UI.PANEL_PROFILE})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        width: 440,
        height: 135,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px 0 20px',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={onOpenRanks}
    >
      {/* Аватар */}
      <div style={{
        flexShrink: 0,
        width: 88,
        height: 88,
        marginLeft: 12,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundImage: `url(${avatarUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />

      {/* Центральный блок: Заголовок + XP Bar */}
      <div style={{
        flex: 1,
        minWidth: 0,
        paddingLeft: 14,
        paddingRight: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Cinzel', serif",
          fontSize: 16,
          fontWeight: 900,
          color: '#f0c040',
          textShadow: '0 2px 4px rgba(0,0,0,1)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title || 'ИГРОК'}
        </p>

        {/* XP Bar */}
        <div style={{ width: '100%', height: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(180,140,40,0.4)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            width: `${xpPercent}%`, height: '100%',
            background: 'linear-gradient(90deg, #a06010, #f0c040 50%, #a06010)',
            boxShadow: '0 0 8px rgba(240,192,64,0.5)',
          }} />
        </div>
      </div>

      {/* Правый блок: Ранг + Кубки (в flex-потоке, не absolute) */}
      <div style={{
        flexShrink: 0,
        width: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingRight: 8,
      }}>
        <div style={{
          color: rank.color,
          fontSize: 11,
          fontWeight: 900,
          fontFamily: "'Cinzel', serif",
          textShadow: '0 1px 3px #000',
          letterSpacing: '0.5px',
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          {rank.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 900, textShadow: '0 2px 4px #000' }}>
            {trophies}
          </span>
          <span style={{ fontSize: 13 }}>🏆</span>
        </div>
      </div>
    </div>
  );
};
