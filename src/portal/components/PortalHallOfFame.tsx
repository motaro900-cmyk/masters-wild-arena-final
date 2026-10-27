import { TrophyGlyph, CrownGlyph, SwordGlyph } from './PortalGlyphs';
/**
 * PORTAL HALL OF FAME (Чертоги Славы & PvP Лидерборд)
 * Топ Чемпионов Арены Дикоземья, ранговая система 9 лиг и прямые P2P дуэли.
 */
import React, { useState } from 'react';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { duelChallengeService } from '../../utils/DuelChallengeService';
import { PVP_RANKS } from '../portalConstants';

export interface ILeaderboardPlayer {
  rank: number;
  name: string;
  title: string;
  avatar: string;
  heroName: string;
  level: number;
  power: number;
  winRate: string;
  pvpScore: number;
  badge: string;
}

export const TOP_CHAMPIONS: ILeaderboardPlayer[] = [
  {
    rank: 1,
    name: 'СеверныйКлык',
    title: 'Верховный Владыка',
    avatar: '/assets/images/avatars/panda.webp',
    heroName: 'Фэн Лун (Мастер Дао)',
    level: 80,
    power: 148500,
    winRate: '94.2%',
    pvpScore: 7840,
    badge: 'ВЛАДЫКА',
  },
  {
    rank: 2,
    name: 'СолнечныйГнев',
    title: 'Первый Паладин',
    avatar: '/assets/images/avatars/lion.webp',
    heroName: 'Аурелиус (Лорд Прайда)',
    level: 79,
    power: 142100,
    winRate: '91.8%',
    pvpScore: 7190,
    badge: 'ЛЕГЕНДА',
  },
  {
    rank: 3,
    name: 'ЯростьДжунглей',
    title: 'Кровавый Берсерк',
    avatar: '/assets/images/avatars/tiger.webp',
    heroName: 'Варкан (Повелитель Джунглей)',
    level: 79,
    power: 139800,
    winRate: '89.5%',
    pvpScore: 6850,
    badge: 'ЛЕГЕНДА',
  },
  {
    rank: 4,
    name: 'ПризракТени',
    title: 'Безмолвный Клинок',
    avatar: '/assets/images/avatars/cat.webp',
    heroName: 'Рикки (Дикий Страж)',
    level: 78,
    power: 135400,
    winRate: '88.1%',
    pvpScore: 5910,
    badge: 'ЧЕМПИОН',
  },
  {
    rank: 5,
    name: 'КаменнаяСкала',
    title: 'Землетрясец Гор',
    avatar: '/assets/images/avatars/boar.webp',
    heroName: 'Громм (Хранитель Лабиринта)',
    level: 77,
    power: 131200,
    winRate: '86.4%',
    pvpScore: 5420,
    badge: 'ЧЕМПИОН',
  },
  {
    rank: 6,
    name: 'ДикийВетер',
    title: 'Мастер Засад',
    avatar: '/assets/images/avatars/cat.webp',
    heroName: 'Рикки (Дикий Страж)',
    level: 76,
    power: 128900,
    winRate: '85.0%',
    pvpScore: 4820,
    badge: 'ГРОССМЕЙСТЕР',
  },
  {
    rank: 7,
    name: 'МонолитНедр',
    title: 'Хранитель Оплота',
    avatar: '/assets/images/avatars/boar.webp',
    heroName: 'Громм (Хранитель Лабиринта)',
    level: 75,
    power: 125400,
    winRate: '83.7%',
    pvpScore: 4210,
    badge: 'ГРОССМЕЙСТЕР',
  },
  {
    rank: 8,
    name: 'ГромовойУдар',
    title: 'Мастер Бамбука',
    avatar: '/assets/images/avatars/panda.webp',
    heroName: 'Фэн Лун (Мастер Дао)',
    level: 74,
    power: 121800,
    winRate: '82.2%',
    pvpScore: 3640,
    badge: 'МАСТЕР',
  },
  {
    rank: 9,
    name: 'СолнечныйЩит',
    title: 'Рыцарь Прайда',
    avatar: '/assets/images/avatars/lion.webp',
    heroName: 'Аурелиус (Лорд Прайда)',
    level: 73,
    power: 119500,
    winRate: '80.9%',
    pvpScore: 2880,
    badge: 'ЭЛИТА',
  },
  {
    rank: 10,
    name: 'НочнойОхотник',
    title: 'Следопыт Чащи',
    avatar: '/assets/images/avatars/tiger.webp',
    heroName: 'Варкан (Повелитель Джунглей)',
    level: 72,
    power: 116200,
    winRate: '79.5%',
    pvpScore: 1950,
    badge: 'ВЕТЕРАН',
  },
];

interface PortalHallOfFameProps {
  onChallengePlayer: (playerName: string) => void;
}

export const PortalHallOfFame: React.FC<PortalHallOfFameProps> = ({ onChallengePlayer }) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCreateDuelInvite = () => {
    proceduralAudio.playDuelHorn();
    const { url: duelUrl } = duelChallengeService.createDuelLink();
    navigator.clipboard?.writeText(duelUrl).then(() => {
      setCopiedLink('✓ Ссылка-вызов скопирована в буфер обмена! Отправьте её другу.');
      setTimeout(() => setCopiedLink(null), 4000);
    }).catch(() => {
      setCopiedLink(duelUrl);
    });
  };

  const handleChallengeTarget = (player: ILeaderboardPlayer) => {
    proceduralAudio.playDuelHorn();
    onChallengePlayer(player.name);
  };

  return (
    <section
      id="leaderboard"
      style={{
        position: 'relative',
        padding: '90px 24px',
        backgroundColor: '#07050a',
        borderBottom: '1px solid rgba(200, 168, 112, 0.15)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#d4af37',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <TrophyGlyph size={16} color="#d4af37" glow /> ЗАЛ СЛАВЫ: АРЕНА ДИКОЗЕМЬЯ
          </div>
          <h2
            style={{
              margin: '0 0 14px 0',
              fontFamily: "'Philosopher', 'Philosopher', serif",
              fontSize: 'clamp(28px, 4vw, 42px)',
              color: '#f9f5ea',
              textShadow: '0 4px 14px rgba(0,0,0,0.8)',
            }}
          >
            Чертоги Славы & PvP Арена
          </h2>
          <p style={{ margin: '0 auto', maxWidth: '640px', fontSize: '15px', color: '#a39886', lineHeight: 1.6 }}>
            Сильнейшие воины соревновательной арены. Сражайтесь на PvP Арене, накапливайте боевой рейтинг
            и бросайте персональные вызовы другим игрокам через прямые P2P дуэли.
          </p>
        </div>

        {/* Leaderboard Table Container */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(18, 14, 24, 0.9) 0%, rgba(10, 8, 14, 0.98) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.1)',
            marginBottom: '35px',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 2.2fr 1.2fr 1fr 1fr 130px',
              padding: '16px 20px',
              backgroundColor: 'rgba(25, 20, 32, 0.8)',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#d4af37',
            }}
          >
            <div>Ранг</div>
            <div>Герой & Игрок</div>
            <div>Ранг Арены</div>
            <div>Боевая Мощь</div>
            <div>Винрейт</div>
            <div style={{ textAlign: 'right' }}>Действие</div>
          </div>

          {/* Rows */}
          {TOP_CHAMPIONS.map((player) => {
            const isTop1 = player.rank === 1;
            const isTop3 = player.rank <= 3;

            return (
              <div
                key={player.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 2.2fr 1.2fr 1fr 1fr 130px',
                  padding: '14px 20px',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: isTop1
                    ? 'rgba(212, 175, 55, 0.06)'
                    : 'transparent',
                  transition: 'background 0.2s ease',
                }}
              >
                {/* Rank badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: isTop3 ? '16px' : '13px',
                      fontWeight: 800,
                      color: isTop1 ? '#FFE07D' : isTop3 ? '#e0d4c3' : '#8c7e6f',
                    }}
                  >
                    #{player.rank}
                  </span>
                  {isTop1 ? (
                    <CrownGlyph size={16} color="#d4af37" glow />
                  ) : player.rank === 2 ? (
                    <CrownGlyph size={15} color="#cbd5e1" />
                  ) : player.rank === 3 ? (
                    <CrownGlyph size={15} color="#d97706" />
                  ) : null}
                </div>

                {/* Player Name & Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={player.avatar}
                    alt={player.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: isTop1 ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.15)',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#f5ede0',
                        fontFamily: "'Philosopher', serif",
                      }}
                    >
                      {player.name}
                      <span style={{ fontSize: '11px', color: '#9c8e7e', marginLeft: '8px' }}>
                        ур. {player.level}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#b9a997' }}>
                      {player.heroName}
                    </div>
                  </div>
                </div>

                {/* Arena Badge */}
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f3e8d2' }}>
                  {player.badge}
                </div>

                {/* Power */}
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SwordGlyph size={13} color="#f59e0b" />
                  <span>{player.power.toLocaleString('ru-RU')}</span>
                </div>

                {/* Win Rate */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                  {player.winRate} ({player.pvpScore} pts)
                </div>

                {/* Action: Вызов на дуэль */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleChallengeTarget(player)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(20, 15, 25, 0.8) 100%)',
                      border: '1px solid rgba(212, 175, 55, 0.5)',
                      color: '#FFE07D',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ВЫЗОВ НА ДУЭЛЬ
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Duel Challenge Generator Bar */}
        <div
          style={{
            padding: '24px 30px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 22, 38, 0.8) 0%, rgba(15, 12, 20, 0.95) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3
              style={{
                margin: '0 0 6px 0',
                fontFamily: "'Philosopher', serif",
                fontSize: '20px',
                color: '#FFE07D',
              }}
            >
              Хотите сразиться с другом один на один?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#b9ac9a' }}>
              Создайте прямую P2P ссылку-вызов. Ваш друг перейдет по ней и сразу попадет на боевую арену против вашей копии персонажа!
            </p>
          </div>

          <button
            onClick={handleCreateDuelInvite}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
              border: 'none',
              color: '#120d05',
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span></span> Создать Дуэль-Вызов
          </button>
        </div>

        {copiedLink && (
          <div
            style={{
              marginTop: '16px',
              textAlign: 'center',
              color: '#6ee7b7',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {copiedLink}
          </div>
        )}

        {/* Canonical 9 PvP Leagues Strip */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', textAlign: 'center' }}>
            🏆 9 Канонических Лиг PvP Арены
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            {PVP_RANKS.map((rk, idx) => (
              <div
                key={rk.name}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${rk.color}55`,
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: rk.color, textTransform: 'uppercase' }}>
                  {rk.name}
                </div>
                <div style={{ fontSize: '10.5px', color: '#9ca3af', marginTop: '3px' }}>
                  {rk.range}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
