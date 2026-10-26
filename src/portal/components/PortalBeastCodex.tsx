import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { useGameStore } from '../../store/useGameStore';

export interface IPortalBeast {
  id: string;
  name: string;
  title: string;
  avatar: string;
  sprite: string;
  backdrop: string;
  element: string;
  elementColor: string;
  role: string;
  rarity: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    critChance: number;
  };
  skills: {
    name: string;
    icon: string;
    cooldown: string;
    desc: string;
  }[];
  lore: string;
  quote: string;
}

export const PORTAL_BEASTS: IPortalBeast[] = [
  {
    id: 'panda',
    name: 'Фэн Лун',
    title: 'Страж Окраин',
    avatar: '/assets/images/avatars/panda.webp',
    sprite: '/assets/characters/panda/panda_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Энергия Ци & Бамбук',
    elementColor: '#4ade80',
    role: 'Воин (WARRIOR)',
    rarity: 'БАЗОВЫЙ',
    stats: { hp: 770, attack: 32, defense: 12, speed: 1.95, critChance: 9.5 },
    skills: [
      { name: 'Удар Дзена', icon: 'strike', cooldown: '3 хода', desc: 'Концентрирует внутреннюю энергию Ци в наконечнике шеста, нанося 2.5× урона и оглушая противника на 1 ход.' },
      { name: 'Ожог Ци', icon: 'flame', cooldown: 'Пассивно (30%)', desc: 'Обычные атаки с шансом 30% поджигают цель священным огнем, нанося 12% урона от атаки каждый ход.' },
      { name: 'Железный Бамбук', icon: 'shield', cooldown: 'Реликвия Отца', desc: 'Реликвийный шест из закаленного бронзового бамбука, отражающий атаки (+12 Защиты, +9.5% Крита).' },
    ],
    lore: 'Фэн Лун вырос на затерянных рубежах Туманной Долины, постигая путь Дзен среди горных рощ священного бамбука. Когда темное осквернение коснулось границ его родины, он надел отцовские бронзовые доспехи и спустился на Арену Диких Земель. Его боевой стиль совмещает невозмутимое спокойствие монастырского монаха с сокрушительной физической мощью горного исполина.',
    quote: '«Сила — это не только умение наносить сокрушительный удар, это священная ответственность за тех, кто слабее тебя.»',
  },
  {
    id: 'cat',
    name: 'Рикки',
    title: 'Дикий Страж',
    avatar: '/assets/images/avatars/cat.webp',
    sprite: '/assets/characters/cat/cat_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Тень & Яд',
    elementColor: '#a855f7',
    role: 'Ассасин (ASSASSIN)',
    rarity: 'РЕДКИЙ',
    stats: { hp: 620, attack: 44, defense: 8, speed: 2.25, critChance: 18.0 },
    skills: [
      { name: 'Танец Теней', icon: 'strike', cooldown: '2 хода', desc: 'Серия из трех молниеносных выпадов, игнорирующих 30% брони противника.' },
      { name: 'Ядовитый Разрез', icon: 'flame', cooldown: 'Пассивно (45%)', desc: 'Отравляет кровь цели смертельным нейротоксином, снижая скорость врага на 20%.' },
      { name: 'Костяные Клинки', icon: 'shield', cooldown: 'Особое', desc: 'Парные стилеты из клыков болотного василиска. Повышают шанс критического удара на 18%.' },
    ],
    lore: 'Дитя ночных болот и затененных карнизов. Рикки выжил там, где пали целые караваны наемников. Его слух различает шелест совиного крыла за милю, а бесшумный шаг не колышет даже предрассветный туман. Он сражается не ради славы или золота, а ради сохранения баланса древних троп, на которых вырос.',
    quote: '«Прежде чем ты успеешь осознать движение моей тени, твой клинок уже упадет в траву.»',
  },
  {
    id: 'boar',
    name: 'Громм',
    title: 'Хранитель Лабиринта',
    avatar: '/assets/images/avatars/boar.webp',
    sprite: '/assets/characters/boar/boar_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Земля & Камень',
    elementColor: '#38bdf8',
    role: 'Танк (TANK)',
    rarity: 'ЭПИЧЕСКИЙ',
    stats: { hp: 1100, attack: 28, defense: 24, speed: 1.40, critChance: 5.0 },
    skills: [
      { name: 'Молот Лабиринта', icon: 'strike', cooldown: '3 хода', desc: 'Сотрясает землю колоссальным ударом, нанося дробящий урон по площади и оглушая.' },
      { name: 'Каменная Броня', icon: 'shield', cooldown: 'Пассивно', desc: 'Монолитная шкура поглощает 25% любого входящего урона и отражает его часть обратно.' },
      { name: 'Звездный Рунический Меч', icon: 'flame', cooldown: 'Реликвия', desc: 'Древнее каменное оружие с рунами гравитации, накладывающее замедление на атакующих.' },
    ],
    lore: 'Несокрушимый колосс подземных каменоломен и рунических крипт. Громм веками охранял сокровищницы Древних от расхитителей гробниц. Его массивное тело выдерживает прямые попадания таранных бревен и магических молний. В бою он действует как неприступная скала, сокрушающая все наступающие волны врагов.',
    quote: '«Горы не отступают перед бурей. Я — эта гора.»',
  },
  {
    id: 'wolf',
    name: 'Варкан',
    title: 'Повелитель Джунглей',
    avatar: '/assets/images/avatars/wolf.webp',
    sprite: '/assets/characters/wolf/wolf_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Кровь & Луна',
    elementColor: '#f97316',
    role: 'Ассасин (ASSASSIN)',
    rarity: 'ЛЕГЕНДАРНЫЙ',
    stats: { hp: 740, attack: 48, defense: 14, speed: 2.10, critChance: 15.5 },
    skills: [
      { name: 'Лунное Сечение', icon: 'strike', cooldown: '3 хода', desc: 'Круговой взмах секирой с полумесяцем темной энергии, вызывающий кровотечение цели.' },
      { name: 'Метка Теней', icon: 'flame', cooldown: 'Пассивно (50%)', desc: 'Помечает слабейшего противника, увеличивая весь входящий урон по нему на 25%.' },
      { name: 'Лунная Секира', icon: 'shield', cooldown: 'Оружие Вождя', desc: 'Двухсторонний топор из метеоритного железа, жаждущий крови вражеских вождей.' },
    ],
    lore: 'Верховный вожак хищных кланов Полуночных Дебрей. Варкан объединил разрозненные стаи благодаря железной воле и беспощадному боевому кодексу. Его лунная секира оставляет за собой сияющий кроваво-красный след, пробивающий любую защиту. На Арене он охотится за сильнейшими бойцами турнира.',
    quote: '«Запах страха невозможно скрыть. В свете кровавой луны вы все — лишь добыча.»',
  },
  {
    id: 'lion',
    name: 'Аурелиус',
    title: 'Лорд Прайда',
    avatar: '/assets/images/avatars/lion.webp',
    sprite: '/assets/characters/lion/lion_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Солнце & Природа',
    elementColor: '#eab308',
    role: 'Воин (WARRIOR)',
    rarity: 'МИФИЧЕСКИЙ',
    stats: { hp: 920, attack: 52, defense: 18, speed: 1.85, critChance: 12.0 },
    skills: [
      { name: 'Королевский Гнев', icon: 'strike', cooldown: '4 хода', desc: 'Обрушивает столб священного солнечного света, нанося 3.2× урона и ослепляя врагов.' },
      { name: 'Солнечный Ожог', icon: 'flame', cooldown: 'Пассивно (35%)', desc: 'Каждая атака наносит дополнительный урон огнем и восстанавливает 5% здоровья Аурелиуса.' },
      { name: 'Золотой Клинок Солнца', icon: 'shield', cooldown: 'Венец Прайда', desc: 'Легендарный солнечный палаш, излучающий теплоту жизни и ауру непоколебимости.' },
    ],
    lore: 'Владыка Золотого Плато и наследник династии Солнечных Львов. Аурелиус ведет войну не ради завоеваний, а ради защиты всеобщего мира во всех землях Терры. Его золотой палаш был выкован в сердце падающей звезды. Его боевой рык вселяет отвагу в сердца союзников и обращает в бегство даже самых свирепых чудовищ.',
    quote: '«Пока над Дикими Землями сияет солнце, свет справедливости не угаснет никогда.»',
  },
];

const renderSkillIcon = (icon: string, color: string) => {
  switch (icon) {
    case 'strike':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || '#f5edd8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M19 13l2 2-5 5-2-2" />
          <path d="M9 13l-4 4" />
          <path d="M13 9l4-4" />
        </svg>
      );
    case 'flame':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
  }
};

interface PortalBeastCodexProps {
  onSelectAndPlay: (heroId: string) => void;
}

export const PortalBeastCodex: React.FC<PortalBeastCodexProps> = ({ onSelectAndPlay }) => {
  const [selectedBeast, setSelectedBeast] = useState<IPortalBeast>(PORTAL_BEASTS[0]);
  const [isDuelHornPlaying, setIsDuelHornPlaying] = useState(false);

  // 3D Tilt Card state
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTransform, setCardTransform] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -1;
    const rotateY = (x - centerX) / centerX;
    const maxDeg = 10;

    setCardTransform({
      rx: rotateX * maxDeg,
      ry: rotateY * maxDeg,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCardTransform({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
  }, []);

  const handleSelectBeast = (beast: IPortalBeast) => {
    proceduralAudio.playShimmer();
    setSelectedBeast(beast);
  };

  const handlePlayDuelSound = () => {
    proceduralAudio.playDuelHorn();
    setIsDuelHornPlaying(true);
    setTimeout(() => setIsDuelHornPlaying(false), 800);
  };

  const handleLaunchWithHero = () => {
    proceduralAudio.playFanfare();
    const store = useGameStore.getState();
    store.setSelectedHeroId?.(selectedBeast.id);
    onSelectAndPlay(selectedBeast.id);
  };

  return (
    <section
      id="beasts"
      style={{
        position: 'relative',
        padding: '90px 24px',
        backgroundColor: '#0a0812',
        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Element Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${selectedBeast.elementColor}20 0%, transparent 70%)`,
          pointerEvents: 'none',
          filter: 'blur(90px)',
          transition: 'background 0.8s ease',
        }}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#d4af37',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            Бестиарий & Легенды
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: '#f5edd8',
              fontFamily: "'Philosopher', serif",
              letterSpacing: '1px',
            }}
          >
            Воины Вселенной Masters of the Wild
          </h2>
          <p style={{ maxWidth: '640px', margin: '14px auto 0', fontSize: '15px', color: '#a69a89', lineHeight: 1.6 }}>
            Подлинные персонажи игры с детальной боевой механикой, набором способностей и глубокой историей. Выберите своего зверя и сразу отправляйтесь на боевую арену.
          </p>
        </div>

        {/* Hero Selector Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '44px',
          }}
        >
          {PORTAL_BEASTS.map((beast) => {
            const isSelected = selectedBeast.id === beast.id;
            return (
              <button
                key={beast.id}
                onClick={() => handleSelectBeast(beast)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  border: isSelected ? `2px solid ${beast.elementColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(212, 175, 55, 0.18)' : 'rgba(18, 14, 24, 0.7)',
                  color: isSelected ? '#f5edd8' : '#8a7b6c',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected ? `0 0 20px ${beast.elementColor}35` : 'none',
                }}
              >
                <img
                  src={beast.avatar}
                  alt={beast.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: `1px solid ${beast.elementColor}60`,
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#fff' : '#b0a294' }}>
                    {beast.name}
                  </div>
                  <div style={{ fontSize: '10px', color: beast.elementColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {beast.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
            alignItems: 'center',
          }}
        >
          {/* Left: 3D Holographic Card */}
          <div style={{ perspective: '1000px', display: 'flex', justifyContent: 'center' }}>
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                height: '520px',
                borderRadius: '24px',
                background: 'linear-gradient(180deg, #161220 0%, #0d0a14 100%)',
                border: `2px solid ${selectedBeast.elementColor}60`,
                boxShadow: `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px ${selectedBeast.elementColor}30`,
                transform: `rotateX(${cardTransform.rx}deg) rotateY(${cardTransform.ry}deg)`,
                transition: cardTransform.active ? 'transform 0.05s ease-out' : 'transform 0.5s ease',
                transformStyle: 'preserve-3d',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {/* Card Background Composite */}
              <img
                src={selectedBeast.backdrop}
                alt="Backdrop"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.35,
                  filter: 'brightness(0.6) saturate(1.2)',
                }}
              />

              {/* Glare Reflection Layer */}
              {cardTransform.active && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at ${cardTransform.glareX}% ${cardTransform.glareY}%, rgba(255, 255, 255, 0.18) 0%, transparent 60%)`,
                    pointerEvents: 'none',
                    zIndex: 3,
                  }}
                />
              )}

              {/* Top Badge & Sound Trigger */}
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '18px',
                  right: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 4,
                }}
              >
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    border: `1px solid ${selectedBeast.elementColor}`,
                    color: selectedBeast.elementColor,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedBeast.rarity}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayDuelSound();
                  }}
                  title="Боевой клич зверя"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    border: `1px solid ${selectedBeast.elementColor}60`,
                    color: selectedBeast.elementColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isDuelHornPlaying ? `0 0 15px ${selectedBeast.elementColor}` : 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>

              {/* Hero Centered Character Sprite */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  transform: 'translateZ(35px)',
                }}
              >
                <img
                  src={selectedBeast.sprite}
                  alt={selectedBeast.name}
                  style={{
                    maxHeight: '78%',
                    maxWidth: '85%',
                    objectFit: 'contain',
                    filter: `drop-shadow(0 15px 25px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 15px ${selectedBeast.elementColor}40)`,
                  }}
                />
              </div>

              {/* Bottom Identity Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '24px 20px',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(5, 4, 8, 0.95) 45%, #050408 100%)',
                  zIndex: 4,
                  transform: 'translateZ(20px)',
                }}
              >
                <div style={{ fontSize: '11px', color: selectedBeast.elementColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {selectedBeast.element} • {selectedBeast.role}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#f5edd8',
                    fontFamily: "'Philosopher', serif",
                    lineHeight: 1.2,
                    marginTop: '4px',
                  }}
                >
                  {selectedBeast.name}
                </div>
                <div style={{ fontSize: '12px', color: '#9c8e7e', marginTop: '2px' }}>
                  {selectedBeast.title}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Technical Stats, Lore, Skills & Launch CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Quote Box */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(18, 14, 24, 0.7)',
                borderLeft: `3px solid ${selectedBeast.elementColor}`,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderLeftWidth: '3px',
                fontStyle: 'italic',
                color: '#e2d4c0',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              {selectedBeast.quote}
            </div>

            {/* Rich Multi-Paragraph Lore */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(18, 14, 24, 0.7)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Летопись Героя
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#c5b8a5', lineHeight: 1.7 }}>
                {selectedBeast.lore}
              </p>
            </div>

            {/* Tactical Stats Matrix */}
            <div
              style={{
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(18, 14, 24, 0.7)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Боевые Характеристики
                </span>
                <span style={{ fontSize: '11px', color: selectedBeast.elementColor, fontWeight: 700 }}>
                  {selectedBeast.role}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Здоровье (HP)', val: selectedBeast.stats.hp, max: 1200, color: '#4ade80' },
                  { label: 'Атака (ATK)', val: selectedBeast.stats.attack, max: 60, color: '#f87171' },
                  { label: 'Броня (DEF)', val: selectedBeast.stats.defense, max: 30, color: '#60a5fa' },
                  { label: 'Скорость (SPD)', val: `${selectedBeast.stats.speed} уд/с`, max: 2.5, color: '#c084fc', pct: (selectedBeast.stats.speed / 2.5) * 100 },
                  { label: 'Крит [CRIT %]', val: `${selectedBeast.stats.critChance}%`, max: 25, color: '#fbbf24', pct: (selectedBeast.stats.critChance / 25) * 100 },
                ].map((st) => (
                  <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '130px', fontSize: '12px', color: '#a69a89' }}>{st.label}</div>
                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${st.pct !== undefined ? st.pct : (typeof st.val === 'number' ? (st.val / st.max) * 100 : 50)}%`,
                          backgroundColor: st.color,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <div style={{ width: '55px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#f5edd8' }}>
                      {st.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Runes List with Pure SVG Glyphs */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                Способности & Боевые Руны
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedBeast.skills.map((skill) => (
                  <div
                    key={skill.name}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(20, 16, 26, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${selectedBeast.elementColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {renderSkillIcon(skill.icon, selectedBeast.elementColor)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f3e8d2' }}>
                          {skill.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {skill.cooldown}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9c8e7e', marginTop: '3px', lineHeight: 1.4 }}>
                        {skill.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Battle Launch Button */}
            <button
              onClick={handleLaunchWithHero}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                color: '#120d04',
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 25px rgba(212, 175, 55, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#120d04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                <path d="M13 19l6-6" />
              </svg>
              Вступить в бой за {selectedBeast.name}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
