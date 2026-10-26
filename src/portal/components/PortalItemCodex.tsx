import React, { useState } from 'react';
import { PortalItemTooltip } from './PortalItemTooltip';
import { portalSound } from '../PortalSoundService';

export interface IItemEntry {
  id: string;
  name: string;
  category: 'weapon' | 'armor' | 'shield' | 'consumable';
  categoryLabel: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  rarityLabel: string;
  rarityColor: string;
  image: string;
  stats: {
    attack?: number;
    defense?: number;
    hp?: number;
    speed?: string;
    crit?: string;
    special?: string;
  };
  lore: string;
  tier: string;
}

export const ITEMS_CATALOG: IItemEntry[] = [
  {
    id: 'stick_bamboo',
    name: 'Бамбуковый Шест Стража',
    category: 'weapon',
    categoryLabel: 'Оружие (Шест)',
    rarity: 'COMMON',
    rarityLabel: 'Обычный',
    rarityColor: '#9ca3af',
    image: '/assets/images/items/weapons/stick.webp',
    tier: 'Т-1',
    stats: { attack: 32, speed: '1.95 уд/с', crit: '+9.5%' },
    lore: 'Выточен из железного бамбука Туманной Долины. Несмотря на внешнюю простоту, наконечник пропитан природной энергией Ци и способен сокрушать медные шлемы разбойников.',
  },
  {
    id: 'bone_daggers',
    name: 'Парные Костяные Клинки',
    category: 'weapon',
    categoryLabel: 'Оружие (Клинки)',
    rarity: 'RARE',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    image: '/assets/images/items/weapons/rusty_dagger.webp',
    tier: 'Т-2',
    stats: { attack: 93, speed: '2.10 уд/с', crit: '+14.0%', special: 'Яд (12% в ход)' },
    lore: 'Смертоносные парные лезвия, изготовленные из клыков болотного василиска. Рикки смазывает их соком ночной белены, чтобы жертва засыпала раньше, чем коснется земли.',
  },
  {
    id: 'hammer_titan',
    name: 'Звездный Рунический Молот',
    category: 'weapon',
    categoryLabel: 'Оружие (Дробящее)',
    rarity: 'EPIC',
    rarityLabel: 'Эпический',
    rarityColor: '#a855f7',
    image: '/assets/images/items/weapons/pan.webp',
    tier: 'Т-3',
    stats: { attack: 165, defense: 25, speed: '1.45 уд/с', special: 'Оглушение (1 ход)' },
    lore: 'Выкован Громмом в подземных плавильнях Чертогов Камня. Каждое руническое клеймо на бойке пульсирует гравитационным полем, создавая ударные волны при столкновении.',
  },
  {
    id: 'axe_shadow',
    name: 'Лунная Секира Теней',
    category: 'weapon',
    categoryLabel: 'Оружие (Секира)',
    rarity: 'LEGENDARY',
    rarityLabel: 'Легендарный',
    rarityColor: '#f59e0b',
    image: '/assets/images/items/weapons/axe.webp',
    tier: 'Т-4',
    stats: { attack: 240, crit: '+18.5%', special: 'Метка Теней (+25% урона)' },
    lore: 'Двухсторонний боевой топор Варкана. Лезвия закалены в крови темных духов полнолуния. Оставляет в воздухе черные мерцающие шлейфы, раскалывающие сталь и дух врага.',
  },
  {
    id: 'sword_sun',
    name: 'Золотой Клинок Солнца',
    category: 'weapon',
    categoryLabel: 'Оружие (Меч)',
    rarity: 'MYTHIC',
    rarityLabel: 'Мифический',
    rarityColor: '#ef4444',
    image: '/assets/images/items/weapons/staff.webp',
    tier: 'Т-5',
    stats: { attack: 350, crit: '+22.0%', special: 'Солнечный Ожог & Регенерация' },
    lore: 'Фамильная реликвия Аурелиуса. Клинок из солнечного орихалка не остывает никогда. В руках истинного Лорда Прайда озаряет поле боя золотым пламенем, исцеляя владельца.',
  },
  {
    id: 'armor_bone',
    name: 'Панцирь Из Кости Титана',
    category: 'armor',
    categoryLabel: 'Доспех (Тяжелый)',
    rarity: 'EPIC',
    rarityLabel: 'Эпический',
    rarityColor: '#a855f7',
    image: '/assets/images/items/armor/armor_bone.webp',
    tier: 'Т-3',
    stats: { defense: 85, hp: 320, special: 'Снижение крит-урона на 15%' },
    lore: 'Собран из пластин панциря реликтового лесного бегемота. Гасит кинетическую силу тяжелых ударов и защищает жизненно важные артерии от коварных стрел.',
  },
  {
    id: 'armor_lion',
    name: 'Львиная Мантия Прайда',
    category: 'armor',
    categoryLabel: 'Доспех (Средний)',
    rarity: 'LEGENDARY',
    rarityLabel: 'Легендарный',
    rarityColor: '#f59e0b',
    image: '/assets/images/items/armor/armor_lion.webp',
    tier: 'Т-4',
    stats: { defense: 140, hp: 550, special: 'Аура Величия (+10% силы отряду)' },
    lore: 'Королевский нагрудник с чеканкой золотого львиного лика. Доспех носили полководцы, державшие оборону Цитадели Зари против легионов Пустоты.',
  },
  {
    id: 'armor_phoenix',
    name: 'Оперение Феникса',
    category: 'armor',
    categoryLabel: 'Доспех (Легкий)',
    rarity: 'MYTHIC',
    rarityLabel: 'Мифический',
    rarityColor: '#ef4444',
    image: '/assets/images/items/armor/armor_phoenix.webp',
    tier: 'Т-5',
    stats: { defense: 210, hp: 800, special: 'Второе Дыхание (Воскрешение с 30% HP)' },
    lore: 'Сплетен из огненных перьев бессмертной птицы Каменного Гнезда. При смертельном ранении вспыхивает яркой волной пламени, отбрасывая врагов и оживляя героя.',
  },
  {
    id: 'shield_oak',
    name: 'Дубовый Круглый Щит',
    category: 'shield',
    categoryLabel: 'Щит (Легкий)',
    rarity: 'COMMON',
    rarityLabel: 'Обычный',
    rarityColor: '#9ca3af',
    image: '/assets/images/items/armor/armor_steampunk.webp',
    tier: 'Т-1',
    stats: { defense: 35, hp: 120, special: 'Блок 10% входящих атак' },
    lore: 'Окованный железной полосой щит из мореного дуба. Прост в обращении и выдерживает прямые попадания арбалетных болтов.',
  },
  {
    id: 'potion_rage',
    name: 'Эликсир Ярости Древних',
    category: 'consumable',
    categoryLabel: 'Зелье',
    rarity: 'RARE',
    rarityLabel: 'Редкий',
    rarityColor: '#38bdf8',
    image: '/assets/images/items/weapons/sling.webp',
    tier: 'Алхимия',
    stats: { attack: 75, special: '+50% к атаке на 3 хода' },
    lore: 'Дистиллированная кровь дикого вепря, настоянная на корнях багульника. Одурманивает разум боевым трансом, утроивая свирепость ударов.',
  },
  {
    id: 'potion_regen',
    name: 'Слеза Первозданного Леса',
    category: 'consumable',
    categoryLabel: 'Зелье',
    rarity: 'EPIC',
    rarityLabel: 'Эпический',
    rarityColor: '#a855f7',
    image: '/assets/images/items/armor/armor_bone_mobile.webp',
    tier: 'Алхимия',
    stats: { hp: 500, special: 'Мгновенное исцеление' },
    lore: 'Чистейшая эссенция жизни, собранная на рассвете с листьев Мирового Древа. Мгновенно затягивает даже самые глубокие раны от отравленного клинка.',
  },
];

export const PortalItemCodex: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapon' | 'armor' | 'shield' | 'consumable'>('all');
  const [selectedItem, setSelectedItem] = useState<IItemEntry>(ITEMS_CATALOG[0]);
  const [hoveredItem, setHoveredItem] = useState<IItemEntry | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const filteredItems = activeTab === 'all' 
    ? ITEMS_CATALOG 
    : ITEMS_CATALOG.filter(it => it.category === activeTab);

  return (
    <section
      id="armory"
      style={{
        position: 'relative',
        padding: '90px 24px',
        backgroundColor: '#07050b',
        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
            Энциклопедия Снаряжения
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
            Арсенал и Реликвии Диких Земель
          </h2>
          <p style={{ maxWidth: '640px', margin: '14px auto 0', fontSize: '15px', color: '#a69a89', lineHeight: 1.6 }}>
            Подлинное вооружение, выкованное в кузницах древних рас. Исследуйте характеристики, редкость и историю легендарных клинков и панцирей.
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '36px',
          }}
        >
          {[
            { id: 'all', label: 'Все предметы' },
            { id: 'weapon', label: 'Оружие' },
            { id: 'armor', label: 'Доспехи' },
            { id: 'shield', label: 'Щиты' },
            { id: 'consumable', label: 'Зелья и Реликвии' },
          ].map(tab => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onMouseEnter={() => portalSound.playHover()}
                onClick={() => {
                  portalSound.playClick(1.0);
                  setActiveTab(tab.id as any);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: isSel ? '1.5px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSel ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(13, 11, 16, 0.9) 100%)' : 'rgba(18, 14, 22, 0.7)',
                  color: isSel ? '#f5edd8' : '#8a7b6c',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSel ? '0 0 15px rgba(212, 175, 55, 0.2)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Showcase Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Item Grid (Epic Scale 210px) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '18px',
            }}
          >
            {filteredItems.map(item => {
              const isSel = selectedItem.id === item.id;
              const primaryStat = item.stats.attack 
                ? { label: `+${item.stats.attack} ATK`, color: '#f87171' }
                : item.stats.defense 
                ? { label: `+${item.stats.defense} DEF`, color: '#60a5fa' }
                : item.stats.hp 
                ? { label: `+${item.stats.hp} HP`, color: '#4ade80' }
                : { label: item.categoryLabel, color: '#fbbf24' };

              return (
                <div
                  key={item.id}
                  onMouseEnter={(e) => {
                    portalSound.playHover();
                    setHoveredItem(item);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredItem(null);
                  }}
                  onClick={() => {
                    portalSound.playEquip();
                    setSelectedItem(item);
                  }}
                  style={{
                    position: 'relative',
                    padding: '18px 14px',
                    borderRadius: '16px',
                    backgroundColor: isSel ? 'rgba(212, 175, 55, 0.12)' : 'rgba(16, 12, 22, 0.82)',
                    backgroundImage: isSel 
                      ? 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.18) 0%, rgba(16, 12, 22, 0.9) 100%)' 
                      : 'linear-gradient(180deg, rgba(24, 18, 30, 0.75) 0%, rgba(12, 9, 16, 0.95) 100%)',
                    border: isSel ? `2px solid ${item.rarityColor}` : '1px solid rgba(255, 255, 255, 0.09)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSel 
                      ? `0 0 25px ${item.rarityColor}35, 0 12px 30px rgba(0, 0, 0, 0.75)` 
                      : '0 8px 24px rgba(0, 0, 0, 0.5)',
                    transform: isSel ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {/* Top Bar: Tier Badge + Rarity */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: '#d4af37',
                        fontWeight: 800,
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {item.tier}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: item.rarityColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                      }}
                    >
                      {item.rarityLabel}
                    </span>
                  </div>

                  {/* 88px Obsidian Icon Frame */}
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      border: `1.5px solid ${item.rarityColor}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: `inset 0 0 16px rgba(0, 0, 0, 0.8), 0 0 18px ${item.rarityColor}20`,
                      position: 'relative',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '84%', height: '84%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Name and Category */}
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#f5edd8',
                        lineHeight: 1.25,
                        fontFamily: "'Philosopher', serif",
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9c8e7e', marginTop: '2px' }}>
                      {item.categoryLabel}
                    </div>
                  </div>

                  {/* Quick Primary Stat Pill */}
                  <div
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: primaryStat.color }}>
                      {primaryStat.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Card for Selected Item */}
          <div
            style={{
              padding: '28px',
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 11, 20, 0.85)',
              border: `1.5px solid ${selectedItem.rarityColor}60`,
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${selectedItem.rarityColor}20`,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: `2px solid ${selectedItem.rarityColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: `0 0 25px ${selectedItem.rarityColor}40`,
                }}
              >
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: `${selectedItem.rarityColor}20`,
                      color: selectedItem.rarityColor,
                      fontWeight: 800,
                      border: `1px solid ${selectedItem.rarityColor}50`,
                    }}
                  >
                    {selectedItem.rarityLabel}
                  </span>
                  <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 700 }}>
                    {selectedItem.tier}
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#f5edd8',
                    fontFamily: "'Philosopher', serif",
                  }}
                >
                  {selectedItem.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#9c8e7e', marginTop: '2px' }}>
                  {selectedItem.categoryLabel}
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              {selectedItem.stats.attack && (
                <div>
                  <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Атака (ATK):</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>
                    +{selectedItem.stats.attack}
                  </div>
                </div>
              )}
              {selectedItem.stats.defense && (
                <div>
                  <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Защита (DEF):</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#60a5fa' }}>
                    +{selectedItem.stats.defense}
                  </div>
                </div>
              )}
              {selectedItem.stats.hp && (
                <div>
                  <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Здоровье (HP):</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#4ade80' }}>
                    +{selectedItem.stats.hp}
                  </div>
                </div>
              )}
              {selectedItem.stats.speed && (
                <div>
                  <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Скорость:</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#c084fc' }}>
                    {selectedItem.stats.speed}
                  </div>
                </div>
              )}
              {selectedItem.stats.crit && (
                <div>
                  <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Крит. шанс:</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fbbf24' }}>
                    {selectedItem.stats.crit}
                  </div>
                </div>
              )}
              {selectedItem.stats.special && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Особый эффект:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#d4af37', marginTop: '2px' }}>
                    {selectedItem.stats.special}
                  </div>
                </div>
              )}
            </div>

            {/* Lore Story */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Легенда Реликвии
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#c5b8a5', lineHeight: 1.7, fontStyle: 'italic' }}>
                «{selectedItem.lore}»
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Path of Exile / Diablo IV Interactive Tooltip */}
      <PortalItemTooltip
        item={hoveredItem}
        visible={hoveredItem !== null}
        x={tooltipPos.x}
        y={tooltipPos.y}
      />
    </section>
  );
};
