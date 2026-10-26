import React from 'react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 250,
  duration = 8,
  borderWidth = 2,
  anchor = 90,
  colorFrom = '#FFE07D',
  colorTo = '#d4af37',
  delay = 0,
}) => {
  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        border: `${borderWidth}px solid transparent`,
        maskImage: 'linear-gradient(transparent, transparent), linear-gradient(white, white)',
        maskClip: 'padding-box, border-box',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'xor',
      }}
    >
      <div
        style={{
          position: 'absolute',
          aspectRatio: '1 / 1',
          width: `${size}px`,
          animation: `border-beam-spin ${duration}s infinite linear`,
          animationDelay: `-${delay}s`,
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${colorFrom} 350deg, ${colorTo} 360deg)`,
          offsetAnchor: `calc(${anchor}% * 1) 50%`,
          offsetPath: 'rect(0 auto auto 0 round inherit)',
          filter: `drop-shadow(0 0 12px ${colorFrom})`,
        }}
      />
      <style>{`
        @keyframes border-beam-spin {
          to {
            offset-distance: 100%;
          }
        }
      `}</style>
    </div>
  );
};
