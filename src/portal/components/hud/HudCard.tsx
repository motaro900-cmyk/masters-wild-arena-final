import React from 'react';
import { BorderBeam } from './BorderBeam';

interface HudCardProps {
  children: React.ReactNode;
  active?: boolean;
  beamColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const HudCard: React.FC<HudCardProps> = ({
  children,
  active = false,
  beamColor = '#FFE07D',
  style,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#0c0916',
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.16) 0%, rgba(12, 9, 22, 0.98) 75%)',
        border: '2px solid rgba(212, 175, 55, 0.55)',
        borderRadius: '24px',
        boxShadow:
          '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 45px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        ...style,
      }}
    >
      {/* Golden Corner Runic Rivets */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 6px #d4af37',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 6px #d4af37',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 6px #d4af37',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 6px #d4af37',
          opacity: 0.7,
        }}
      />

      {/* Active Laser Border Beam */}
      {active && <BorderBeam colorFrom={beamColor} colorTo="#d4af37" duration={7} size={280} />}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
