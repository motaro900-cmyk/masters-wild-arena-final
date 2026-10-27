import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { portalSound } from '../PortalSoundService';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { SERVER_NAME, SERVER_ONLINE_STRING } from '../portalConstants';

interface ShowcaseSlide {
  id: string;
  title: string;
  tag: string;
  description: string;
  src: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'hub',
    title: 'Главный Хаб и Арена',
    tag: 'ИНТЕРФЕЙС & БОЕВОЙ ПРОПУСК',
    description:
      'Живая стартовая арена: быстрый выбор соревновательных боев, разминка, статус сезонного Боевого Пропуска и доступ во все системы Дикоземья в один клик.',
    src: '/assets/images/showcase/showcase_hub.png',
  },
  {
    id: 'city',
    title: 'Древний Город и Гильдии',
    tag: 'ЖИВОЙ МИР',
    description:
      'Монументальный хаб мастеров: Обитель Древних, Зверинец, торговые лавки, Башня Испытаний и клановые замки на вершинах горных водопадов.',
    src: '/assets/images/showcase/showcase_city.png',
  },
  {
    id: 'battle',
    title: 'Тактические Сражения',
    tag: 'АВТОБАТЛЕР & РЕАЛЬНОЕ ВРЕМЯ',
    description:
      'Динамичные пошаговые дуэли на рунической арене: комбо льда, пламени и энергии Ци, применение ультимейтов и честный просчет каждого удара с честным расчетом физики и комбо-эффектов.',
    src: '/assets/images/showcase/showcase_battle.png',
  },
  {
    id: 'heroes',
    title: 'Бестиарий и Чемпионы',
    tag: '5 УНИКАЛЬНЫХ КЛАССОВ',
    description:
      'Глубокая система прокачки чемпионов: Фэн Лун (Боец), Рикки (Убийца), Громм (Танк), Варкан и Аурелиус с уникальными ветками пассивных умений и коллекцией обликов.',
    src: '/assets/images/showcase/showcase_heroes.png',
  },
  {
    id: 'forge',
    title: 'Королевская Кузница',
    tag: 'КРАФТ & ЗАТОЧКА',
    description:
      'Честная кузница снаряжения: ковка тяжелого оружия, заточка доспехов, инкрустация стихийных самоцветов и перековка редких артефактов без скрытых шансов.',
    src: '/assets/images/showcase/showcase_forge.png',
  },
];

interface PortalGameShowcaseProps {
  onRegisterClick: () => void;
  isLoggedIn?: boolean;
}

export const PortalGameShowcase: React.FC<PortalGameShowcaseProps> = ({
  onRegisterClick,
  isLoggedIn = false,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeSlide = SHOWCASE_SLIDES[activeIdx];

  const handleSelectSlide = (idx: number) => {
    portalSound.playClick(1.0);
    setActiveIdx(idx);
  };

  const handlePrev = () => {
    portalSound.playClick(0.9);
    setActiveIdx((prev) => (prev === 0 ? SHOWCASE_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    portalSound.playClick(1.1);
    setActiveIdx((prev) => (prev === SHOWCASE_SLIDES.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      id="about"
      style={{
        position: 'relative',
        padding: '100px clamp(20px, 4vw, 60px)',
        backgroundColor: '#07050d',
        borderTop: '1.5px solid rgba(212, 175, 55, 0.25)',
        borderBottom: '1.5px solid rgba(212, 175, 55, 0.25)',
        overflow: 'hidden',
      }}
    >
      {/* Background Ambience */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 18px',
              borderRadius: '20px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#FFE07D', fontWeight: 800, letterSpacing: '1px' }}>
              🎮 ОБ ИГРЕ • ИГРОВЫЕ СКРИНШОТЫ
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 16px 0',
              letterSpacing: '0.5px',
            }}
          >
            Арена Дикоземья: Тактика, Крафт и Битвы Зверей
          </h2>
          <p
            style={{
              color: '#d4c7b6',
              fontSize: 'clamp(16px, 1.3vw, 19px)',
              maxWidth: '850px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Каждый скриншот снят непосредственно из реальной игровой сессии в ультра-качестве.
            Оцените визуальный стиль, интерфейс и масштаб возможностей игры перед входом.
          </p>
        </div>

        {/* Steam-Style Showcase Module: Cinema Theater (Left) + Steam Metadata Card (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1.15fr)',
            gap: 'clamp(24px, 3vw, 40px)',
            alignItems: 'stretch',
            marginBottom: '70px',
          }}
          className="showcase-theater-grid"
        >
          {/* Left: Main Cinema Screenshot Theater */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Active High-Res Viewport */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '16 / 9',
                backgroundColor: '#0c0916',
                borderRadius: '18px',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(212, 175, 55, 0.15)',
                overflow: 'hidden',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSlide.id}
                  src={activeSlide.src}
                  alt={activeSlide.title}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </AnimatePresence>

              {/* Tag & Title Overlay Bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(8, 6, 12, 0.95) 0%, rgba(8, 6, 12, 0.6) 70%, transparent 100%)',
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#FFE07D',
                      backgroundColor: 'rgba(212, 175, 55, 0.2)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeSlide.tag}
                  </span>
                  <h3
                    style={{
                      fontFamily: "'Philosopher', serif",
                      fontSize: '24px',
                      fontWeight: 900,
                      color: '#ffffff',
                      margin: '8px 0 4px 0',
                    }}
                  >
                    {activeSlide.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#d4c7b6',
                      maxWidth: '650px',
                      lineHeight: 1.4,
                    }}
                  >
                    {activeSlide.description}
                  </p>
                </div>

                {/* Arrow Navigation */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={handlePrev}
                    aria-label="Предыдущий скриншот"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(212, 175, 55, 0.5)',
                      background: 'rgba(12, 9, 18, 0.85)',
                      color: '#FFE07D',
                      fontSize: '18px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Следующий скриншот"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(212, 175, 55, 0.5)',
                      background: 'rgba(12, 9, 18, 0.85)',
                      color: '#FFE07D',
                      fontSize: '18px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
              }}
            >
              {SHOWCASE_SLIDES.map((slide, idx) => {
                const isCurrent = idx === activeIdx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => handleSelectSlide(idx)}
                    style={{
                      padding: 0,
                      border: isCurrent ? '2px solid #FFE07D' : '1.5px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      aspectRatio: '16 / 9',
                      backgroundColor: '#120d1c',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: isCurrent ? '0 0 16px rgba(212, 175, 55, 0.45)' : 'none',
                      opacity: isCurrent ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={slide.src}
                      alt={slide.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Steam-Style Game Profile & Specs Card */}
          <div
            style={{
              backgroundColor: '#0c0916',
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, rgba(12, 9, 22, 0.98) 75%)',
              border: '2px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '18px',
              padding: 'clamp(24px, 2.5vw, 34px)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            {/* Brand Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: '#150f04',
                    fontSize: '18px',
                  }}
                >
                  ⚔️
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Philosopher', serif",
                      fontSize: '20px',
                      fontWeight: 900,
                      color: '#FFE07D',
                      letterSpacing: '0.8px',
                    }}
                  >
                    MASTERS OF THE WILD
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    mastersofthewild.ru • wildgames.ru
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#d4c7b6',
                  margin: '0 0 20px 0',
                }}
              >
                Браузерная темная RPG нового поколения. Исследуйте Дикоземье, улучшайте боевое снаряжение в кузнице,
                командуйте кланами и покоряйте соревновательную арену без скачивания файлов.
              </p>

              {/* Steam-Style Metadata Rows */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Жанр:</span>
                  <span style={{ color: '#FFE07D', fontWeight: 700 }}>Темное фэнтези / Тактическая RPG</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Платформа:</span>
                  <span style={{ color: '#e5e7eb', fontWeight: 700 }}>Любой браузер (ПК, Смартфоны, Планшеты)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Запуск:</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>Мгновенно без скачивания (за 3 сек)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Язык:</span>
                  <span style={{ color: '#e5e7eb', fontWeight: 600 }}>Полностью на русском (звук и текст)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Режимы:</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>Арена, Рейтинговый PvP, Кланы, Кузница</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Сохранение:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 800 }}>100% Облачный профиль персонажа</span>
                </div>
              </div>
            </div>

            {/* CTA Button in Meta Card */}
            <div>
              <button
                onClick={() => {
                  proceduralAudio.playDuelHorn();
                  onRegisterClick();
                }}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #aa8022 100%)',
                  color: '#120d04',
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: "'Philosopher', serif",
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <span>{isLoggedIn ? 'ПЕРЕЙТИ К ИГРЕ (АККАУНТ АКТИВЕН)' : 'СОЗДАТЬ АККАУНТ И НАЧАТЬ С 0'}</span>
                <span>→</span>
              </button>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '10px',
                }}
              >
                ✓ Полная синхронизация прогресса на сервере
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards (Steam-Style Highlights) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: '#0c0916',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>🛡️</div>
            <h4
              style={{
                fontFamily: "'Philosopher', serif",
                fontSize: '20px',
                fontWeight: 900,
                color: '#FFE07D',
                margin: '0 0 10px 0',
              }}
            >
              Честный старт с 0 уровня
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#d4c7b6', margin: 0 }}>
              Никаких платных преимуществ и раздутых статов. Каждый мастер начинает с чистого листа: 1-й уровень,
              стартовый чемпион Фэн Лун и честный путь развития через арены и победы.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: '#0c0916',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>☁️</div>
            <h4
              style={{
                fontFamily: "'Philosopher', serif",
                fontSize: '20px',
                fontWeight: 900,
                color: '#FFE07D',
                margin: '0 0 10px 0',
              }}
            >
              100% Защита прогресса
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#d4c7b6', margin: 0 }}>
              Регистрация на сайте mastersofthewild.ru навсегда связывает ваш прогресс с защищенной учетной записью.
              Сражайтесь дома на ПК или в дороге с телефона — прогресс непрерывен.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: '#0c0916',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚡</div>
            <h4
              style={{
                fontFamily: "'Philosopher', serif",
                fontSize: '20px',
                fontWeight: 900,
                color: '#FFE07D',
                margin: '0 0 10px 0',
              }}
            >
              Прямо в браузере за 3 секунды
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#d4c7b6', margin: 0 }}>
              Забудьте о скачивании десятков гигабайт и долгих установках. Продвинутая оптимизация графики обеспечивает
              кинематографическую плавную картинку прямо во вкладке браузера.
            </p>
          </div>

          {/* Card 4 */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: '#0c0916',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚔️</div>
            <h4
              style={{
                fontFamily: "'Philosopher', serif",
                fontSize: '20px',
                fontWeight: 900,
                color: '#FFE07D',
                margin: '0 0 10px 0',
              }}
            >
              Рейтинговый PvP и P2P-Дуэли
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#d4c7b6', margin: 0 }}>
              Соревнуйтесь в едином ладдере чемпионов за сезонные кубки и титулы или создавайте мгновенную
              дуэльную ссылку, чтобы бросить вызов любому другу в мессенджере.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .showcase-theater-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
