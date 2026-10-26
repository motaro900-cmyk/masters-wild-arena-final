import React from 'react';

/**
 * PORTAL VECTOR GLYPHS (Убийцы эмодзи)
 * Профессиональные векторные SVG-глифы в темной фэнтези-стилистике.
 * Полностью заменяют детские системные эмодзи в HUD, календаре, чате и карточках.
 */

interface GlyphProps {
  size?: number;
  color?: string;
  glow?: boolean;
  className?: string;
}

export const GoldCoinGlyph: React.FC<GlyphProps> = ({ size = 16, color = '#f59e0b', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 6px ${color}80)` : 'none',
    }}
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="rgba(212, 175, 55, 0.15)" />
    <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    <path d="M12 7v10M9 10h6M10 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const CrystalGlyph: React.FC<GlyphProps> = ({ size = 16, color = '#60a5fa', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 8px ${color}90)` : 'none',
    }}
  >
    <path
      d="M6 3h12l5 7-11 12L1 10l5-7z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="rgba(96, 165, 250, 0.18)"
    />
    <path d="M1 10h22M6 3l6 19 6-19M12 3v19" stroke={color} strokeWidth="1.2" strokeLinejoin="round" opacity="0.75" />
  </svg>
);

export const HerbGlyph: React.FC<GlyphProps> = ({ size = 28, color = '#34d399', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 10px ${color}80)` : 'none',
    }}
  >
    <path
      d="M12 22C12 22 13 15 19 12C14 12 11 8 11 2C11 8 8 12 3 12C9 15 12 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      fill="rgba(52, 211, 153, 0.2)"
      strokeLinejoin="round"
    />
    <path d="M12 22V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PotionGlyph: React.FC<GlyphProps> = ({ size = 28, color = '#a855f7', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 10px ${color}80)` : 'none',
    }}
  >
    <path d="M9 3h6M10 3v3l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 15l-5-9V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 14h10" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    <circle cx="10" cy="16" r="1" fill={color} />
    <circle cx="14" cy="17" r="1.5" fill={color} />
  </svg>
);

export const ScrollGlyph: React.FC<GlyphProps> = ({ size = 28, color = '#f59e0b', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 8px ${color}80)` : 'none',
    }}
  >
    <path
      d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <rect x="7" y="2" width="10" height="4" rx="1" stroke={color} strokeWidth="1.8" fill="rgba(245, 158, 11, 0.2)" />
    <path d="M7 11h10M7 15h7" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const OrbGlyph: React.FC<GlyphProps> = ({ size = 28, color = '#c084fc', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 12px ${color})` : 'none',
    }}
  >
    <circle cx="12" cy="11" r="7" stroke={color} strokeWidth="2" fill="rgba(192, 132, 252, 0.25)" />
    <ellipse cx="12" cy="11" rx="7" ry="2.5" stroke={color} strokeWidth="1.2" opacity="0.7" />
    <path d="M8 18l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 18v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ShieldGlyph: React.FC<GlyphProps> = ({ size = 28, color = '#38bdf8', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 10px ${color}80)` : 'none',
    }}
  >
    <path
      d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      fill="rgba(56, 189, 248, 0.15)"
    />
    <path d="M12 6v14M7 10h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </svg>
);

export const ChestGlyph: React.FC<GlyphProps> = ({ size = 32, color = '#eab308', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 14px ${color})` : 'none',
    }}
  >
    <rect x="3" y="10" width="18" height="11" rx="2" stroke={color} strokeWidth="2" fill="rgba(234, 179, 8, 0.2)" />
    <path d="M2 10c0-3 3-5 10-5s10 2 10 5" stroke={color} strokeWidth="2" />
    <path d="M12 10v4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="14" r="1.5" fill={color} />
    <path d="M7 10v11M17 10v11" stroke={color} strokeWidth="1.5" opacity="0.6" />
  </svg>
);

export const SwordGlyph: React.FC<GlyphProps> = ({ size = 20, color = '#ef4444', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 8px ${color}80)` : 'none',
    }}
  >
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M19 13l2 2-5 5-2-2M9 13l-4 4M13 9l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrownGlyph: React.FC<GlyphProps> = ({ size = 20, color = '#f59e0b', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 10px ${color})` : 'none',
    }}
  >
    <path d="M4 18h16l1-12-5 4-4-6-4 6-5-4 1 12z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="rgba(245, 158, 11, 0.25)" />
    <circle cx="12" cy="4" r="1" fill={color} />
    <circle cx="4" cy="6" r="1" fill={color} />
    <circle cx="20" cy="6" r="1" fill={color} />
  </svg>
);

export const FlameGlyph: React.FC<GlyphProps> = ({ size = 18, color = '#f97316', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 8px ${color})` : 'none',
    }}
  >
    <path
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="rgba(249, 115, 22, 0.2)"
    />
  </svg>
);

export const TrophyGlyph: React.FC<GlyphProps> = ({ size = 18, color = '#eab308', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 8px ${color})` : 'none',
    }}
  >
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M6 3h12v7a6 6 0 0 1-12 0V3zM12 16v5M8 21h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(234, 179, 8, 0.2)" />
  </svg>
);

export const FrostGlyph: React.FC<GlyphProps> = ({ size = 20, color = '#60a5fa', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 8px ${color})` : 'none',
    }}
  >
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.5" fill={color} />
  </svg>
);

export const TelegramGlyph: React.FC<GlyphProps> = ({ size = 16, color = '#38bdf8', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 6px ${color}80)` : 'none',
    }}
  >
    <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(56, 189, 248, 0.2)" />
  </svg>
);

export const VkGlyph: React.FC<GlyphProps> = ({ size = 16, color = '#3b82f6', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 6px ${color}80)` : 'none',
    }}
  >
    <path
      d="M3 6.5C3 4.567 4.567 3 6.5 3h11C19.433 3 21 4.567 21 6.5v11c0 1.933-1.567 3.5-3.5 3.5h-11C4.567 21 3 19.433 3 17.5v-11z"
      stroke={color}
      strokeWidth="1.8"
      fill="rgba(59, 130, 246, 0.15)"
    />
    <path
      d="M6.5 8.5C8.8 14 11.2 16.5 13.8 16.5h1.2v-2.8c1.3.1 2.3 1.2 2.7 2.8h2.3c-.6-2.3-2.1-3.2-3.2-3.6 1-.5 2.2-1.6 2.5-3.4H17c-.4 1.4-1.4 2.5-2.5 2.6v-2.6h-2.1v4.8c-1.3-.3-2.7-1.8-3.7-4.8H6.5z"
      fill={color}
    />
  </svg>
);

export const ScaleGlyph: React.FC<GlyphProps> = ({ size = 16, color = '#d4af37', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: glow ? `drop-shadow(0 0 6px ${color}80)` : 'none',
    }}
  >
    <path d="M12 3v18M12 6L4 8l3 6a3 3 0 0 0 6 0L10 8l2-2 2 2-3 6a3 3 0 0 0 6 0l3-6-8-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

