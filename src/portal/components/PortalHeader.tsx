import { SwordGlyph, ShieldGlyph } from './PortalGlyphs';
/**
 * PORTAL HEADER (Шапка игрового портала)
 * Навигация, статус игрового сервера, личный кабинет, быстрый вход в бой и PWA установка.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { portalSound } from '../PortalSoundService';

interface PortalHeaderProps {
  onLaunchGame: () => void;
  onOpenCabinet: () => void;
  installPrompt?: any;
  onInstallPwa?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  onLaunchGame,
  onOpenCabinet,
  installPrompt,
  onInstallPwa,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    portalSound.playClick(1.0);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        zIndex: 1000,
        backgroundColor: 'rgba(7, 5, 11, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Left: Brand Logo & Server Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('hero');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
              fontSize: '20px',
            }}
          >
            
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Philosopher', 'Cinzel', serif",
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#FFE07D',
                textShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                lineHeight: 1.1,
              }}
            >
              MASTERS OF THE WILD
            </div>
            <div
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '10px',
                color: '#a69a89',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Официальный портал игры
            </div>
          </div>
        </a>

        {/* Server Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            fontSize: '11px',
            color: '#4ade80',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              boxShadow: '0 0 8px #4ade80',
            }}
          />
          <span>S1: Wild Lands (Онлайн: 1,482)</span>
        </div>
      </div>

      {/* Center: Desktop Navigation Links with exact IDs */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {[
          { label: 'Главная', id: 'hero' },
          { label: 'Звери и Навыки', id: 'beasts' },
          { label: 'Оружейная', id: 'armory' },
          { label: 'Саундтреки', id: 'music' },
          { label: 'Награды', id: 'rewards' },
          { label: 'Зал Славы', id: 'leaderboard' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            onMouseEnter={() => portalSound.playHover()}
            style={{
              background: 'none',
              border: 'none',
              color: '#e5e7eb',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'Philosopher', serif",
              letterSpacing: '0.5px',
              cursor: 'pointer',
              padding: '6px 4px',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFE07D')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#e5e7eb')}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right: Actions (Личный Кабинет + PWA + Launch Game) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Личный Кабинет Button */}
        <button
          onClick={() => {
            portalSound.playClick(1.1);
            onOpenCabinet();
          }}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            background: 'linear-gradient(135deg, rgba(30, 22, 40, 0.85) 0%, rgba(15, 11, 22, 0.95) 100%)',
            color: '#FFE07D',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: "'Philosopher', serif",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transition: 'all 0.2s ease',
          }}
        >
          <ShieldGlyph size={15} color="#FFE07D" />
          <span>Личный Кабинет</span>
        </button>

        {installPrompt && onInstallPwa && (
          <button
            onClick={onInstallPwa}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#FFE07D',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Montserrat', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            Установить PWA
          </button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            proceduralAudio.playDuelHorn();
            onLaunchGame();
          }}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: '1px solid #FFE07D',
            background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)',
            color: '#150f05',
            fontSize: '14px',
            fontWeight: 800,
            fontFamily: "'Philosopher', serif",
            letterSpacing: '0.8px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <SwordGlyph size={16} color="#150f05" />
          <span>В БОЙ!</span>
        </motion.button>
      </div>
    </header>
  );
};
