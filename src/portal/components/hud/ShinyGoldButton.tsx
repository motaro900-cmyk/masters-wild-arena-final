import React from 'react';
import { motion } from 'framer-motion';
import { portalSound } from '../../PortalSoundService';

interface ShinyGoldButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const ShinyGoldButton: React.FC<ShinyGoldButtonProps> = ({
  children,
  onClick,
  type = 'button',
  style,
  variant = 'primary',
}) => {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.96, y: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={() => {
        portalSound.playClick(1.1);
        if (onClick) onClick();
      }}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 28px',
        borderRadius: '14px',
        border: '1.5px solid #FFE07D',
        background:
          variant === 'primary'
            ? 'linear-gradient(135deg, #d4af37 0%, #aa8022 50%, #7d5907 100%)'
            : 'linear-gradient(135deg, rgba(30, 22, 40, 0.9) 0%, rgba(14, 10, 20, 0.95) 100%)',
        color: variant === 'primary' ? '#120d04' : '#FFE07D',
        fontSize: '15px',
        fontWeight: 900,
        fontFamily: "'Philosopher', serif",
        letterSpacing: '1px',
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow:
          variant === 'primary'
            ? '0 8px 30px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            : '0 8px 25px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(212, 175, 55, 0.2)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Animated Light Sweep Shimmer Effect */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          repeatDelay: 2,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%)',
          transform: 'skewX(-25deg)',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
        {children}
      </span>
    </motion.button>
  );
};
