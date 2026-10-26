import React from 'react';

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
          'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, rgba(12, 9, 22, 0.98) 75%)',
        border: active ? '2px solid rgba(212, 175, 55, 0.6)' : '1.5px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '24px',
        boxShadow: active
          ? '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 30px rgba(212, 175, 55, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 25px 70px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        ...style,
      }}
    >
      {/* Golden Corner Runic Rivets */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 8px #d4af37',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 8px #d4af37',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 8px #d4af37',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          boxShadow: '0 0 8px #d4af37',
          opacity: 0.8,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
