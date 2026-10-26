import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IItemEntry } from './PortalItemCodex';

/**
 * PORTAL ITEM TOOLTIP
 * Аутентичный интерактивный тултип экипировки в стилистике Path of Exile 2 и Diablo IV:
 * - Обсидиановый градиентный фон с руническим обрамлением.
 * - Динамическая рамка редкости с угловыми акцентами (Corner Prongs).
 * - Золотые рунические разделители (Golden Runic Dividers) с печатью предков.
 * - Цветовая дифференциация аффиксов (+ATK, +DEF, +HP, Крит, Скорость).
 * - Легендарные пассивные свойства в золотом свитке.
 * - Умное позиционирование (Boundary Clamping) без вылета за края вьюпорта.
 */

interface PortalItemTooltipProps {
  item: IItemEntry | null;
  visible: boolean;
  x: number;
  y: number;
}

// Золотой рунический разделитель (Diablo IV / PoE standard)
const RunicDivider: React.FC<{ color?: string }> = ({ color = '#d4af37' }) => (
  <div style={{ position: 'relative', width: '100%', height: '14px', margin: '10px 0' }}>
    <svg
      viewBox="0 0 320 14"
      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="runeGradL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0)" />
          <stop offset="80%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="runeGradR" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="20%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
        </linearGradient>
      </defs>

      {/* Левая и правая направляющие линии */}
      <line x1="8" y1="7" x2="142" y2="7" stroke="url(#runeGradL)" strokeWidth="1.2" />
      <line x1="178" y1="7" x2="312" y2="7" stroke="url(#runeGradR)" strokeWidth="1.2" />

      {/* Боковые рунические точки */}
      <circle cx="148" cy="7" r="1.5" fill={color} opacity="0.9" />
      <circle cx="172" cy="7" r="1.5" fill={color} opacity="0.9" />

      {/* Центральный алмазный ромб и ядро силы */}
      <polygon points="160,2 165,7 160,12 155,7" fill={color} />
      <circle cx="160" cy="7" r="1.2" fill="#fffbe8" />
    </svg>
  </div>
);

// Угловые чеканные накладки
const CornerAccents: React.FC<{ color: string }> = ({ color }) => (
  <>
    {/* Top-Left */}
    <span
      style={{
        position: 'absolute',
        top: '-1px',
        left: '-1px',
        width: '10px',
        height: '10px',
        borderTop: `2px solid ${color}`,
        borderLeft: `2px solid ${color}`,
        pointerEvents: 'none',
      }}
    />
    {/* Top-Right */}
    <span
      style={{
        position: 'absolute',
        top: '-1px',
        right: '-1px',
        width: '10px',
        height: '10px',
        borderTop: `2px solid ${color}`,
        borderRight: `2px solid ${color}`,
        pointerEvents: 'none',
      }}
    />
    {/* Bottom-Left */}
    <span
      style={{
        position: 'absolute',
        bottom: '-1px',
        left: '-1px',
        width: '10px',
        height: '10px',
        borderBottom: `2px solid ${color}`,
        borderLeft: `2px solid ${color}`,
        pointerEvents: 'none',
      }}
    />
    {/* Bottom-Right */}
    <span
      style={{
        position: 'absolute',
        bottom: '-1px',
        right: '-1px',
        width: '10px',
        height: '10px',
        borderBottom: `2px solid ${color}`,
        borderRight: `2px solid ${color}`,
        pointerEvents: 'none',
      }}
    />
  </>
);

export const PortalItemTooltip: React.FC<PortalItemTooltipProps> = ({ item, visible, x, y }) => {
  if (!visible || !item) return null;

  // Расчет безопасного позиционирования внутри окна (Clamping)
  const TOOLTIP_WIDTH = 340;
  const ESTIMATED_HEIGHT = 440;
  const PADDING = 18;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

  let posX = x + 18;
  let posY = y - 40;

  // Если тултип выходит за правый край, смещаем влево от курсора
  if (posX + TOOLTIP_WIDTH + PADDING > viewportWidth) {
    posX = x - TOOLTIP_WIDTH - 18;
  }
  // Если тултип выходит за нижний край, подтягиваем наверх
  if (posY + ESTIMATED_HEIGHT + PADDING > viewportHeight) {
    posY = Math.max(PADDING, viewportHeight - ESTIMATED_HEIGHT - PADDING);
  }
  // Минимальный отступ сверху
  if (posY < PADDING) {
    posY = PADDING;
  }

  const { stats, rarityColor } = item;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: `${posX}px`,
          top: `${posY}px`,
          width: `${TOOLTIP_WIDTH}px`,
          zIndex: 9999,
          pointerEvents: 'none',
          userSelect: 'none',
          backgroundColor: '#0a080f',
          backgroundImage:
            'linear-gradient(180deg, rgba(22, 16, 28, 0.97) 0%, rgba(10, 8, 15, 0.98) 50%, rgba(6, 5, 9, 0.99) 100%)',
          borderRadius: '8px',
          border: `1.5px solid ${rarityColor}80`,
          boxShadow: `0 14px 40px rgba(0, 0, 0, 0.9), 0 0 25px ${rarityColor}35, inset 0 0 16px rgba(0, 0, 0, 0.8)`,
          padding: '18px 20px',
          fontFamily: "'Montserrat', sans-serif",
          color: '#e5dcd0',
        }}
      >
        {/* Чеканные углы */}
        <CornerAccents color={rarityColor} />

        {/* Верхняя световая полоса редкости */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '2px',
            background: `radial-gradient(ellipse at center, ${rarityColor} 0%, transparent 80%)`,
            boxShadow: `0 0 8px ${rarityColor}`,
          }}
        />

        {/* 1. Заголовок предмета */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <h4
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 800,
              color: rarityColor,
              fontFamily: "'Philosopher', serif",
              letterSpacing: '0.5px',
              textShadow: `0 0 10px ${rarityColor}60`,
            }}
          >
            {item.name}
          </h4>
          <div
            style={{
              fontSize: '11px',
              color: '#9c9285',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginTop: '3px',
            }}
          >
            {item.categoryLabel} • {item.tier}
          </div>
        </div>

        {/* Рунический разделитель 1 */}
        <RunicDivider color={rarityColor} />

        {/* 2. Базовые показатели (Implicit stats) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {stats.attack && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
              <span style={{ color: '#d1c7bc' }}>Физический урон:</span>
              <span style={{ fontWeight: 800, color: '#ef4444', textShadow: '0 0 6px rgba(239,68,68,0.4)' }}>
                +{stats.attack} ATK
              </span>
            </div>
          )}
          {stats.defense && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#93c5fd' }}>
              <span style={{ color: '#d1c7bc' }}>Защита и броня:</span>
              <span style={{ fontWeight: 800, color: '#60a5fa', textShadow: '0 0 6px rgba(96,165,250,0.4)' }}>
                +{stats.defense} DEF
              </span>
            </div>
          )}
          {stats.hp && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#86efac' }}>
              <span style={{ color: '#d1c7bc' }}>Запас жизненных сил:</span>
              <span style={{ fontWeight: 800, color: '#4ade80', textShadow: '0 0 6px rgba(74,222,128,0.4)' }}>
                +{stats.hp} HP
              </span>
            </div>
          )}
          {stats.speed && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#d1c7bc' }}>Скорость атаки:</span>
              <span style={{ fontWeight: 700, color: '#c084fc' }}>{stats.speed}</span>
            </div>
          )}
          {stats.crit && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#d1c7bc' }}>Шанс критического удара:</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>{stats.crit}</span>
            </div>
          )}
        </div>

        {/* 3. Особое легендарное свойство (Explicit affix) */}
        {stats.special && (
          <>
            <RunicDivider color="#d4af37" />
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span style={{ color: '#d4af37', fontSize: '14px', lineHeight: 1 }}>◆</span>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#d4af37',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '2px',
                  }}
                >
                  Особое Свойство
                </div>
                <div style={{ fontSize: '12px', color: '#fef3c7', fontWeight: 600, lineHeight: 1.4 }}>
                  {stats.special}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 4. Художественное описание (Lore / Flavor Text) */}
        <RunicDivider color="#8a7966" />
        <p
          style={{
            margin: 0,
            fontSize: '11.5px',
            fontStyle: 'italic',
            color: '#a39582',
            lineHeight: 1.55,
            textAlign: 'center',
          }}
        >
          «{item.lore}»
        </p>

        {/* 5. Подвал статуса предмета (Diablo standard) */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#6e6457',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          <span>ПЕРСОНАЛЬНЫЙ ПРЕДМЕТ</span>
          <span style={{ color: rarityColor }}>{item.rarityLabel.toUpperCase()}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
