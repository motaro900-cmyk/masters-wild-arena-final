import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwordGlyph, MenuGlyph, CloseGlyph, ShieldGlyph } from './PortalGlyphs';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { portalSound } from '../PortalSoundService';

interface PortalHeaderProps {
  onLaunchGame: () => void;
  isLoggedIn?: boolean;
  playerName?: string;
  installPrompt?: any;
  onInstallPwa?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  onLaunchGame,
  isLoggedIn = false,
  playerName = '',
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
    { label: 'Об игре & Скриншоты', id: 'about' },
    { label: 'Звери и Чемпионы', id: 'beasts' },
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
          gap: 24px;
        }
        .portal-mobile-toggle {
          display: none;
        }
        .portal-server-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.35);
          font-size: 12px;
          color: #4ade80;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
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
        }
        @media (max-width: 480px) {
          .portal-brand-subtitle {
            display: none !important;
          }
          .portal-header-cta-text {
            display: none !important;
          }
          .portal-header-cta-short {
            display: inline !important;
          }
        }
        @media (min-width: 481px) {
          .portal-header-cta-short {
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
          boxSizing: 'border-box',
          height: '72px',
          zIndex: 1000,
          backgroundColor: 'rgba(7, 5, 11, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1.5px solid rgba(212, 175, 55, 0.25)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(10px, 2.5vw, 24px)',
        }}
      >
        {/* Left: Brand Logo & Server Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
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
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(212, 175, 55, 0.4)',
                flexShrink: 0,
              }}
            >
              <SwordGlyph size={22} color="#150f04" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Philosopher', serif",
                  fontSize: '17px',
                  fontWeight: 900,
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
                  fontSize: '10px',
                  color: '#b0a394',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Официальный портал игры
              </div>
            </div>
          </a>

          {/* Server Status Badge */}
          <div className="portal-server-badge">
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span>Версия 1.0 HD • Онлайн</span>
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
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
                letterSpacing: '0.5px',
                cursor: 'pointer',
                padding: '8px 6px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Main Action Button */}
          {isLoggedIn ? (
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
                border: 'none',
                background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #aa8022 100%)',
                color: '#120d04',
                fontSize: '14px',
                fontWeight: 900,
                fontFamily: "'Philosopher', serif",
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <SwordGlyph size={16} color="#120d04" />
              <span className="portal-header-cta-text">ВОЙТИ В ИГРУ</span>
              <span className="portal-header-cta-short">В ИГРУ</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLaunchGame}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                color: '#120d04',
                fontSize: '14px',
                fontWeight: 900,
                fontFamily: "'Philosopher', serif",
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <SwordGlyph size={16} color="#120d04" />
              <span className="portal-header-cta-text">ИГРАТЬ СЕЙЧАС</span>
              <span className="portal-header-cta-short">ИГРАТЬ</span>
            </motion.button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="portal-mobile-toggle"
            onClick={() => {
              portalSound.playClick(1.2);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Навигационное меню"
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1.5px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              color: '#FFE07D',
              padding: 0,
            }}
          >
            {mobileMenuOpen ? <CloseGlyph size={20} color="#FFE07D" /> : <MenuGlyph size={20} color="#FFE07D" />}
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
                top: '72px',
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
                top: '72px',
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
                  padding: '10px 14px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '10px',
                  fontSize: '13px',
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
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 8px #22c55e',
                    }}
                  />
                  <span>Клиент v1.0 HD</span>
                </div>
                <span style={{ fontWeight: 700 }}>Онлайн</span>
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
                      padding: '14px 16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(212, 175, 55, 0.15)',
                      borderRadius: '10px',
                      color: '#FFE07D',
                      fontSize: '16px',
                      fontWeight: 700,
                      fontFamily: "'Philosopher', serif",
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: 'rgba(212, 175, 55, 0.5)', fontSize: '14px' }}>→</span>
                  </button>
                ))}
              </div>

              {/* Action Button in Mobile Drawer */}
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    proceduralAudio.playDuelHorn();
                    setMobileMenuOpen(false);
                    onLaunchGame();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                    color: '#120d04',
                    fontSize: '15px',
                    fontWeight: 900,
                    fontFamily: "'Philosopher', serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <SwordGlyph size={18} color="#120d04" />
                  <span>ВОЙТИ В ИГРУ ({playerName || 'АККАУНТ'})</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLaunchGame();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 100%)',
                    color: '#120d04',
                    fontSize: '15px',
                    fontWeight: 900,
                    fontFamily: "'Philosopher', serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <SwordGlyph size={18} color="#120d04" />
                  <span>ИГРАТЬ СЕЙЧАС (В 1 КЛИК)</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
