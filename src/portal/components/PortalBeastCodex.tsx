import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { SwordGlyph, ShieldGlyph, CrownGlyph, FlameGlyph, FrostGlyph } from './PortalGlyphs';

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
    icon: 'strike' | 'shield' | 'flame';
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
    element: 'Энергия Ци',
    elementColor: '#4ade80',
    role: 'Боец (WARRIOR)',
    rarity: 'БАЗОВЫЙ',
    stats: { hp: 770, attack: 32, defense: 12, speed: 1.95, critChance: 9.5 },
    skills: [
      { name: 'Удар Дзена', icon: 'strike', cooldown: '3 хода', desc: 'Концентрирует энергию Ци в наконечнике шеста, нанося 2.5× урона противнику.' },
      { name: 'Вихрь Бамбука', icon: 'flame', cooldown: 'Пассивно (30%)', desc: 'Удары бамбукового шеста оглушают цель и повышают концентрацию Ци.' },
      { name: 'Броня Отца', icon: 'shield', cooldown: 'Реликвия', desc: 'Закаленные латы из отцовского сундука, отражающие 15% входящего урона.' },
    ],
    lore: 'Фэн Лун вырос в Туманной Долине, постигая путь Дзен среди священных бамбуковых рощ. Его боевой стиль совмещает спокойствие мастера Дао с сокрушительной мощью железного бамбукового шеста.',
    quote: '«Сила — это не только сокрушительный удар, это священная ответственность за тех, кто слабее тебя.»',
  },
  {
    id: 'raccoon',
    name: 'Рикки',
    title: 'Дикий Страж',
    avatar: '/assets/images/avatars/cat.webp',
    sprite: '/assets/characters/raccoon/raccoon_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Тень & Яд',
    elementColor: '#a855f7',
    role: 'Ассасин (ASSASSIN)',
    rarity: 'РЕДКИЙ',
    stats: { hp: 620, attack: 44, defense: 8, speed: 2.25, critChance: 18.0 },
    skills: [
      { name: 'Танец Теней', icon: 'strike', cooldown: '2 хода', desc: 'Серия из трех молниеносных выпадов кинжалами, игнорирующих 30% брони противника.' },
      { name: 'Ядовитый Разрез', icon: 'flame', cooldown: 'Пассивно (45%)', desc: 'Отравляет кровь цели болотным токсином, снижая атаку врага на 15%.' },
      { name: 'Ночной Капюшон', icon: 'shield', cooldown: 'Маскировка', desc: 'Позволяет уклониться от первого смертельного удара в дуэли.' },
    ],
    lore: 'Дитя ночных болот и затененных карнизов. Рикки выжил там, где пали целые отряды наемников. Его слух различает шелест совиного крыла за милю, а бесшумный шаг не колышет даже предрассветный туман.',
    quote: '«Прежде чем ты успеешь осознать движение моей тени, твой клинок уже упадет в траву.»',
  },
  {
    id: 'minotaur',
    name: 'Громм',
    title: 'Хранитель Лабиринта',
    avatar: '/assets/images/avatars/boar.webp',
    sprite: '/assets/characters/minotaur/minotaur_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Земля & Камень',
    elementColor: '#f59e0b',
    role: 'Танк (TANK)',
    rarity: 'ЭПИЧЕСКИЙ',
    stats: { hp: 980, attack: 28, defense: 22, speed: 1.45, critChance: 6.0 },
    skills: [
      { name: 'Молот Лабиринта', icon: 'strike', cooldown: '3 хода', desc: 'Сотрясает землю колоссальным ударом рогов и топора, оглушая врага на 1 ход.' },
      { name: 'Каменная Шкура', icon: 'shield', cooldown: 'Пассивно', desc: 'Монолитная броня поглощает 25% любого входящего урона и снижает шанс крита по Громму.' },
      { name: 'Неистовство Земли', icon: 'flame', cooldown: 'При < 30% HP', desc: 'Удваивает показатель брони и скорость атаки при критическом уровне здоровья.' },
    ],
    lore: 'Несокрушимый колосс подземных каменоломен и рунических лабиринтов. Громм веками охранял сокровищницы Древних от расхитителей гробниц. В бою он действует как неприступная крепостная стена.',
    quote: '«Горы не отступают перед бурей. Я — эта гора.»',
  },
  {
    id: 'tiger_warrior',
    name: 'Варкан',
    title: 'Повелитель Джунглей',
    avatar: '/assets/images/avatars/tiger.webp',
    sprite: '/assets/characters/tiger_warrior/tiger_warrior_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Ярость & Пламя',
    elementColor: '#ef4444',
    role: 'Ассасин (ASSASSIN)',
    rarity: 'ЛЕГЕНДАРНЫЙ',
    stats: { hp: 710, attack: 48, defense: 11, speed: 2.10, critChance: 16.5 },
    skills: [
      { name: 'Кровавый Прыжок', icon: 'strike', cooldown: '3 хода', desc: 'Стремительный бросок с высоты с нанесением глубоких рваных ран (кровотечение 3 хода).' },
      { name: 'Жажда Охоты', icon: 'flame', cooldown: 'Пассивно (50%)', desc: 'Каждый успешный крит увеличивает скорость атаки Варкана на 10% до конца боя.' },
      { name: 'Когти Хищника', icon: 'shield', cooldown: 'Реликвия', desc: 'Закаленные пламенем когти пробивают 40% любой брони.' },
    ],
    lore: 'Верховный вожак полосатых кланов Полуночных Джунглей. Варкан объединил разрозненные прайды благодаря железной дисциплине и беспощадному кодексу чести. На Арене он выслеживает сильнейших чемпионов.',
    quote: '«Запах страха невозможно скрыть. В свете багровой луны вы все — лишь добыча.»',
  },
  {
    id: 'lion_knight',
    name: 'Аурелиус',
    title: 'Лорд Прайда',
    avatar: '/assets/images/avatars/lion.webp',
    sprite: '/assets/characters/lion_knight/lion_knight_base.png',
    backdrop: '/assets/images/backgrounds/bg_main.webp',
    element: 'Солнце & Золото',
    elementColor: '#eab308',
    role: 'Боец (WARRIOR)',
    rarity: 'МИФИЧЕСКИЙ',
    stats: { hp: 850, attack: 38, defense: 18, speed: 1.85, critChance: 12.0 },
    skills: [
      { name: 'Солнечный Удар', icon: 'strike', cooldown: '4 хода', desc: 'Обрушивает столб священного солнечного света, нанося 3.2× урона и ослепляя врагов.' },
      { name: 'Аура Прайда', icon: 'flame', cooldown: 'Пассивно (35%)', desc: 'Каждая атака восстанавливает 5% максимального здоровья Аурелиуса.' },
      { name: 'Золотой Палаш', icon: 'shield', cooldown: 'Венец Прайда', desc: 'Легендарный меч, выкованный в сердце падающей звезды. Дарует абсолютную стойкость.' },
    ],
    lore: 'Владыка Золотого Плато и наследник династии Солнечных Львов. Аурелиус ведет войну не ради завоеваний, а ради защиты всеобщего мира. Его золотой палаш и львиный щит внушают трепет даже древним титанам.',
    quote: '«Пока над Дикими Землями сияет солнце, свет справедливости не угаснет никогда.»',
  },
];

interface PortalBeastCodexProps {
  onSelectAndPlay?: (beastId: string) => void;
}

export const PortalBeastCodex: React.FC<PortalBeastCodexProps> = ({ onSelectAndPlay }) => {
  const [selectedBeast, setSelectedBeast] = useState<IPortalBeast>(PORTAL_BEASTS[0]);
  const [cardTransform, setCardTransform] = useState({ rx: 0, ry: 0, active: false });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -12;
    const ry = ((x - cx) / cx) * 12;
    setCardTransform({ rx, ry, active: true });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCardTransform({ rx: 0, ry: 0, active: false });
  }, []);

  const handleSelectBeast = (beast: IPortalBeast) => {
    proceduralAudio.playClick(1.2);
    setSelectedBeast(beast);
  };

  return (
    <section
      id="beasts"
      style={{
        position: 'relative',
        padding: '90px 24px',
        backgroundColor: '#07050d',
        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#FFE07D',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <CrownGlyph size={16} color="#FFE07D" glow />
            <span>БЕСТИАРИЙ & ЧЕМПИОНЫ ДИКОЗЕМЬЯ</span>
          </div>
          <h2
            style={{
              margin: '0 0 14px',
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 30px rgba(212, 175, 55, 0.25)',
            }}
          >
            Воины Вселенной Masters of the Wild
          </h2>
          <p style={{ margin: '0 auto', maxWidth: '680px', color: '#b5a695', fontSize: '16px', lineHeight: 1.6 }}>
            Официальные чемпионы арены с подлинными характеристиками, способностями и 3D-арт картами. Выбери зверя и начни путь в Дикоземье.
          </p>
        </div>

        {/* Hero Selector Tabs (Large, Tactile, No Broken Avatars) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '40px',
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
                  gap: '12px',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  border: isSelected ? `2px solid ${beast.elementColor}` : '1.5px solid rgba(212, 175, 55, 0.25)',
                  background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(18, 14, 26, 0.85)',
                  boxShadow: isSelected ? `0 0 25px ${beast.elementColor}45` : '0 8px 20px rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src={beast.avatar}
                  alt={beast.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: `1.5px solid ${beast.elementColor}`,
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f5edd8', fontFamily: "'Philosopher', serif" }}>
                    {beast.name}
                  </div>
                  <div style={{ fontSize: '11px', color: beast.elementColor, fontWeight: 700, textTransform: 'uppercase' }}>
                    {beast.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2-Column Showcase (High-Scale 3D Card + Full Stats & Skills) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          {/* Left: 3D Holographic Card with 100% REAL Loaded Sprite */}
          <div style={{ perspective: '1200px', display: 'flex', justifyContent: 'center' }}>
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                height: '600px',
                borderRadius: '26px',
                background: 'linear-gradient(180deg, #181324 0%, #0a0712 100%)',
                border: `2px solid ${selectedBeast.elementColor}`,
                boxShadow: `0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px ${selectedBeast.elementColor}35`,
                transform: `rotateX(${cardTransform.rx}deg) rotateY(${cardTransform.ry}deg)`,
                transition: cardTransform.active ? 'transform 0.05s ease-out' : 'transform 0.5s ease',
                transformStyle: 'preserve-3d',
                overflow: 'hidden',
              }}
            >
              {/* Top Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  right: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 4,
                }}
              >
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: `1.5px solid ${selectedBeast.elementColor}`,
                    color: selectedBeast.elementColor,
                    fontSize: '12px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedBeast.rarity}
                </span>

                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#e5e7eb',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {selectedBeast.element}
                </span>
              </div>

              {/* REAL CHARACTER SPRITE (Centered, Crisp, High-Res) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  transform: 'translateZ(40px)',
                  paddingBottom: '70px',
                }}
              >
                <img
                  src={selectedBeast.sprite}
                  alt={selectedBeast.name}
                  style={{
                    maxHeight: '80%',
                    maxWidth: '85%',
                    objectFit: 'contain',
                    filter: `drop-shadow(0 20px 35px rgba(0,0,0,0.95)) drop-shadow(0 0 25px ${selectedBeast.elementColor}40)`,
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
                  padding: '28px 24px',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(7, 5, 12, 0.95) 45%, #07050d 100%)',
                  zIndex: 4,
                  transform: 'translateZ(25px)',
                }}
              >
                <div style={{ fontSize: '12px', color: selectedBeast.elementColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {selectedBeast.element} • {selectedBeast.role}
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#FFE07D',
                    fontFamily: "'Philosopher', serif",
                    lineHeight: 1.2,
                    marginTop: '4px',
                  }}
                >
                  {selectedBeast.name}
                </div>
                <div style={{ fontSize: '13px', color: '#a69a89', marginTop: '3px' }}>
                  {selectedBeast.title}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Real Stats & Abilities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quote Block */}
            <div
              style={{
                padding: '18px 22px',
                borderRadius: '16px',
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                fontStyle: 'italic',
                color: '#FFE07D',
                fontSize: '15px',
                lineHeight: 1.6,
                fontFamily: "'Philosopher', serif",
              }}
            >
              {selectedBeast.quote}
            </div>

            {/* Lore */}
            <div
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: 'rgba(16, 12, 22, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9c8e7e', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                Летопись Героя
              </div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#d1d5db' }}>
                {selectedBeast.lore}
              </p>
            </div>

            {/* Real Stats Bars */}
            <div
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: 'rgba(16, 12, 22, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9c8e7e', fontWeight: 800, textTransform: 'uppercase' }}>
                Подлинные Боевые Характеристики
              </div>

              {[
                { label: 'Здоровье (HP)', val: selectedBeast.stats.hp, max: 1200, color: '#22c55e' },
                { label: 'Атака (ATK)', val: selectedBeast.stats.attack, max: 60, color: '#ef4444' },
                { label: 'Броня (DEF)', val: selectedBeast.stats.defense, max: 30, color: '#3b82f6' },
                { label: 'Скорость (SPD)', val: `${selectedBeast.stats.speed} уд/с`, max: 2.5, numVal: selectedBeast.stats.speed, color: '#a855f7' },
                { label: 'Крит. Шанс', val: `${selectedBeast.stats.critChance}%`, max: 25, numVal: selectedBeast.stats.critChance, color: '#eab308' },
              ].map((stat) => {
                const percent = ((stat.numVal ?? (stat.val as number)) / stat.max) * 100;
                return (
                  <div key={stat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#9ca3af' }}>{stat.label}</span>
                      <strong style={{ color: '#f5edd8' }}>{stat.val}</strong>
                    </div>
                    <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', backgroundColor: stat.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Real Skills */}
            <div
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: 'rgba(16, 12, 22, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9c8e7e', fontWeight: 800, textTransform: 'uppercase' }}>
                Способности & Боевые Руны
              </div>
              {selectedBeast.skills.map((skill) => (
                <div
                  key={skill.name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFE07D', fontFamily: "'Philosopher', serif" }}>
                      {skill.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{skill.cooldown}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#c4b5a2', lineHeight: 1.5 }}>
                    {skill.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Launch CTA */}
            {onSelectAndPlay && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  proceduralAudio.playDuelHorn();
                  onSelectAndPlay(selectedBeast.id);
                }}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  border: '1px solid #FFE07D',
                  background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                  color: '#120d04',
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: "'Philosopher', serif",
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 8px 30px rgba(212, 175, 55, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <SwordGlyph size={20} color="#120d04" />
                <span>ВСТУПИТЬ В БОЙ ЗА {selectedBeast.name.toUpperCase()}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
