import { useGameStore } from '../../../store/useGameStore';
import { getRankInfo } from '../../../configs/RankSystem';
import { resolveAssetPath } from '../../../utils/assetPath';

interface PlayerProfileProps {
  onOpenRanks?: () => void;
}

/**
 * PlayerProfile (v5.0) — Полностью CSS-based, без спрайта.
 * Чёткое разделение: Аватар | Информация | Ранг
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
      onClick={onOpenRanks}
      style={{
        width: 440,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        position: 'relative',
        // Фоновая панель (тёмное дерево с золотой рамкой)
        background: 'linear-gradient(180deg, rgba(30,18,8,0.92) 0%, rgba(15,8,2,0.97) 100%)',
        border: '2px solid #7a5520',
        borderRadius: 8,
        boxShadow: '0 0 0 1px rgba(240,192,64,0.3), 0 4px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,80,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Декоративная золотая линия сверху */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #c8860a, #f0c040, #c8860a, transparent)',
        opacity: 0.8,
      }} />

      {/* Блок АВАТАРА — чёткий круг с золотой рамкой */}
      <div style={{
        flexShrink: 0,
        width: 120,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(60,35,10,0.6) 0%, rgba(20,10,2,0.8) 100%)',
        borderRight: '1px solid rgba(200,134,10,0.4)',
      }}>
        {/* Внешнее свечение рамки */}
        <div style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          padding: 3,
          background: 'linear-gradient(135deg, #f0c040, #a06010, #f0c040)',
          boxShadow: '0 0 12px rgba(240,192,64,0.5), 0 0 4px rgba(240,192,64,0.3)',
        }}>
          {/* Внутренний круг — аватар */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundImage: `url(${avatarUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#1a0e04',
          }} />
        </div>
      </div>

      {/* Центральный блок: Заголовок + XP Bar */}
      <div style={{
        flex: 1,
        minWidth: 0,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
      }}>
        {/* Заголовок игрока */}
        <p style={{
          margin: 0,
          fontFamily: "'Cinzel', serif",
          fontSize: 17,
          fontWeight: 900,
          color: '#f0c040',
          textShadow: '0 0 10px rgba(240,192,64,0.4), 0 2px 4px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title || 'ИГРОК'}
        </p>

        {/* XP Bar */}
        <div>
          <div style={{
            width: '100%', height: 8,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(180,140,40,0.3)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${xpPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7a4800, #f0c040 50%, #7a4800)',
              boxShadow: '0 0 6px rgba(240,192,64,0.6)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{
            fontSize: 10,
            color: 'rgba(200,168,80,0.6)',
            fontFamily: "'Cinzel', serif",
            marginTop: 2,
            letterSpacing: 0.5,
          }}>
            ОПЫТ: {xpPercent}%
          </div>
        </div>
      </div>

      {/* Правый блок: Ранг + Кубки */}
      <div style={{
        flexShrink: 0,
        width: 90,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderLeft: '1px solid rgba(200,134,10,0.3)',
        background: 'linear-gradient(135deg, rgba(60,35,10,0.4) 0%, rgba(20,10,2,0.6) 100%)',
        padding: '8px 6px',
      }}>
        {/* Иконка трофея */}
        <div style={{ fontSize: 20 }}>🏆</div>

        {/* Кол-во кубков */}
        <div style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 900,
          fontFamily: "'Cinzel', serif",
          textShadow: '0 2px 6px #000, 0 0 10px rgba(240,192,64,0.3)',
          lineHeight: 1,
        }}>
          {trophies}
        </div>

        {/* Ранг */}
        <div style={{
          color: rank.color,
          fontSize: 10,
          fontWeight: 900,
          fontFamily: "'Cinzel', serif",
          textShadow: '0 1px 3px #000',
          textAlign: 'center',
          letterSpacing: 0.5,
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {rank.name}
        </div>
      </div>

      {/* Декоративная золотая линия снизу */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, #7a5520, transparent)',
      }} />
    </div>
  );
};
