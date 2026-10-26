import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwordGlyph, ShieldGlyph, MenuGlyph, CloseGlyph } from './PortalGlyphs';
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

  const navItems = [
    { label: 'Главная', id: 'hero' },
    { label: 'Звери и Навыки', id: 'beasts' },
    { label: 'Оружейная', id: 'armory' },
    { label: 'Саундтреки', id: 'music' },
    { label: 'Награды', id: 'rewards' },
    { label: 'Зал Славы', id: 'leaderboard' },
  ];

  return (
    <>
      <style>{`
        .portal-nav-desktop {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .portal-mobile-toggle {
          display: none;
        }
        .portal-server-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          font-size: 11px;
          color: #4ade80;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
        }
        .portal-cabinet-header-btn {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        @media (max-width: 1024px) {
          .portal-nav-desktop {
            display: none !important;
          }
          .portal-mobile-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .portal-server-badge {
            display: none !important;
          }
          .portal-cabinet-header-btn {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .portal-brand-subtitle {
            display: none !important;
          }
        }
      `}</style>

      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          height: '70px',
          zIndex: 1000,
          backgroundColor: 'rgba(7, 5, 11, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        {/* Left: Brand Logo & Server Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('hero');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                flexShrink: 0,
              }}
            >
              <SwordGlyph size={20} color="#150f04" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Philosopher', serif",
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  color: '#FFE07D',
                  textShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                MASTERS OF THE WILD
              </div>
              <div
                className="portal-brand-subtitle"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '9px',
                  color: '#a69a89',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Официальный портал игры
              </div>
            </div>
          </a>

          {/* Server Status Badge (Desktop/Tablet) */}
          <div className="portal-server-badge">
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                boxShadow: '0 0 8px #4ade80',
              }}
            />
            <span>S1: Wild Lands (1,482 онлайн)</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="portal-nav-desktop">
          {navItems.map((item) => (
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

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Личный Кабинет Button (Desktop only) */}
          <button
            className="portal-cabinet-header-btn"
            onClick={() => {
              portalSound.playClick(1.1);
              onOpenCabinet();
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              background: 'linear-gradient(135deg, rgba(30, 22, 40, 0.85) 0%, rgba(15, 11, 22, 0.95) 100%)',
              color: '#FFE07D',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: "'Philosopher', serif",
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldGlyph size={14} color="#FFE07D" />
            <span>Кабинет</span>
          </button>

          {/* Quick Play / В БОЙ */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              proceduralAudio.playDuelHorn();
              onLaunchGame();
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #FFE07D',
              background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)',
              color: '#150f05',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: "'Philosopher', serif",
              letterSpacing: '0.8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <SwordGlyph size={14} color="#150f05" />
            <span>В БОЙ</span>
          </motion.button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="portal-mobile-toggle"
            onClick={() => {
              portalSound.playClick(1.2);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Навигационное меню"
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: '#FFE07D',
              padding: 0,
            }}
          >
            {mobileMenuOpen ? <CloseGlyph size={18} color="#FFE07D" /> : <MenuGlyph size={18} color="#FFE07D" />}
          </button>
        </div>
      </header>

      {/* Animated Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                top: '70px',
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                zIndex: 998,
              }}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '70px',
                left: 0,
                right: 0,
                background: 'rgba(12, 9, 18, 0.98)',
                borderBottom: '2px solid rgba(212, 175, 55, 0.4)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
                padding: '20px 20px 28px',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Mobile Server Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#4ade80',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4ade80',
                      boxShadow: '0 0 8px #4ade80',
                    }}
                  />
                  <span>Сервер S1: Wild Lands</span>
                </div>
                <span style={{ fontWeight: 700 }}>1,482 онлайн</span>
              </div>

              {/* Mobile Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(212, 175, 55, 0.15)',
                      borderRadius: '8px',
                      color: '#FFE07D',
                      fontSize: '15px',
                      fontWeight: 700,
                      fontFamily: "'Philosopher', serif",
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: 'rgba(212, 175, 55, 0.5)', fontSize: '12px' }}>→</span>
                  </button>
                ))}
              </div>

              {/* Drawer Secondary Action */}
              <button
                onClick={() => {
                  portalSound.playClick(1.1);
                  setMobileMenuOpen(false);
                  onOpenCabinet();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  background: 'linear-gradient(135deg, rgba(30, 22, 40, 0.9) 0%, rgba(15, 11, 22, 0.95) 100%)',
                  color: '#FFE07D',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: "'Philosopher', serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <ShieldGlyph size={16} color="#FFE07D" />
                <span>Открыть Личный Кабинет</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
