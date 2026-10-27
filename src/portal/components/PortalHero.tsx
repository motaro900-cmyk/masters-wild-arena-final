import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SwordGlyph,
  ShieldGlyph,
  CrownGlyph,
  GoldCoinGlyph,
  CrystalGlyph,
} from './PortalGlyphs';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { portalSound } from '../PortalSoundService';
import { portalSyncBridge } from '../../services/PortalSyncBridge';
import { OFFICIAL_DOMAIN } from '../portalConstants';
import { HudCard } from './hud/HudCard';
import { ShinyGoldButton } from './hud/ShinyGoldButton';

interface PortalHeroProps {
  onLaunchGame: () => void;
  onExploreBeasts: () => void;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  onLaunchGame,
  onExploreBeasts,
}) => {
  const [profile, setProfile] = useState(() => portalSyncBridge.getProfile());
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('mow_player_name') || profile.playerName || 'admin';
  });

  useEffect(() => {
    const handleSync = (e: any) => {
      const updated = e.detail || portalSyncBridge.getProfile();
      setProfile(updated);
      if (updated.playerName) setNickname(updated.playerName);
    };
    window.addEventListener('mow:portal_sync', handleSync);
    return () => window.removeEventListener('mow:portal_sync', handleSync);
  }, []);

  const handleLaunch = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanNick = nickname.trim() || 'admin';
    portalSound.playEquip();
    proceduralAudio.playDuelHorn();

    // Persist player name locally for game launch
    localStorage.setItem('mow_player_name', cleanNick);
    localStorage.setItem('mow_master_nick', cleanNick);
    portalSyncBridge.commitMutation({
      playerName: cleanNick,
      isLoggedIn: true,
    });

    onLaunchGame();
  };

  const scrollToAbout = () => {
    portalSound.playClick(1.0);
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '110px',
        paddingBottom: '80px',
        overflow: 'hidden',
        backgroundColor: '#07050d',
      }}
    >
      {/* 1. Deep Layered Game Background with Subtle Breathing Zoom */}
      <motion.div
        animate={{ scale: [1.02, 1.05, 1.02] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/images/backgrounds/bg_main.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.32) contrast(1.25) saturate(1.15)',
          zIndex: 0,
        }}
      />

      {/* 2. Radial Vignette & Atmospheric Fog Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 45% 45%, rgba(212, 175, 55, 0.09) 0%, rgba(5, 4, 9, 0.88) 65%, #07050d 100%)',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '240px',
          background: 'linear-gradient(to top, #07050d 0%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* 3. Main Full-Scale Layout Container (Scales up to 1760px for 2K/4K displays) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1760px',
          width: '100%',
          padding: '0 clamp(24px, 4vw, 70px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: 'clamp(40px, 5vw, 90px)',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Monumental Branding, Real Starter Hero */}
        <div style={{ textAlign: 'left' }}>
          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 24px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.14)',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
              marginBottom: '26px',
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 14px #22c55e',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                color: '#FFE07D',
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Официальная веб-версия • {OFFICIAL_DOMAIN} • Запуск в 1 клик
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            style={{
              margin: '0 0 22px 0',
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(42px, 5.2vw, 78px)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#ffffff',
              textShadow:
                '0 4px 35px rgba(0,0,0,0.98), 0 0 60px rgba(212, 175, 55, 0.35)',
              letterSpacing: '0.5px',
            }}
          >
            Добро пожаловать в <br />
            <span
              style={{
                background:
                  'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #aa8022 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MASTERS OF THE WILD
            </span>
          </h1>

          {/* Honest Description */}
          <p
            style={{
              margin: '0 0 32px 0',
              maxWidth: '720px',
              fontSize: 'clamp(17px, 1.4vw, 21px)',
              lineHeight: 1.7,
              color: '#d4c7b6',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            Официальный сайт браузерной тактической RPG ({OFFICIAL_DOMAIN}).
            Мгновенный запуск прямо в браузере без скачивания и тяжелых установок.
            Прокачивайте чемпионов, куйте редкое снаряжение и покоряйте соревновательную арену Дикоземья.
          </p>

          {/* Unified Starter Champion Presentation: Authentic Daoist Panda */}
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px 28px',
              borderRadius: '22px',
              background: 'rgba(14, 10, 22, 0.94)',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              boxShadow: '0 14px 40px rgba(0,0,0,0.85), 0 0 35px rgba(212, 175, 55, 0.25)',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px solid #FFE07D',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                flexShrink: 0,
                backgroundColor: '#120d1c',
              }}
            >
              <img
                src="/assets/images/avatars/panda.webp"
                alt="Боевой Панда"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#FFE07D',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                СТАРТОВЫЙ ЧЕМПИОН
              </div>
              <div
                style={{
                  fontFamily: "'Philosopher', serif",
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                }}
              >
                Боевой Панда (Фэн Лун) • Мастер Дао
              </div>
              <div style={{ fontSize: '13px', color: '#b5a695', marginTop: '2px' }}>
                Страж Окраин • Энергия Ци и Бамбуковый Шест (1-й уровень, 0 XP)
              </div>
            </div>
          </div>

          {/* Quick Links: Steam Showcase & Beast Codex */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <button
              onClick={scrollToAbout}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFE07D',
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: "'Philosopher', serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              <span>🎮 Смотреть скриншоты и обзор систем игры ↓</span>
            </button>

            <button
              onClick={onExploreBeasts}
              style={{
                background: 'none',
                border: 'none',
                color: '#d4af37',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              <CrownGlyph size={18} color="#d4af37" />
              <span>Бестиарий чемпионов →</span>
            </button>
          </div>
        </div>

        {/* Right Column: Honest Instant Launch Card (No Fake Password Fields) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HudCard
            active={true}
            beamColor="#FFE07D"
            style={{ width: '100%', maxWidth: '620px', padding: 'clamp(32px, 4.5vw, 48px)' }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)',
                paddingBottom: '22px',
                marginBottom: '26px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <ShieldGlyph size={28} color="#FFE07D" glow />
                <span
                  style={{
                    fontFamily: "'Philosopher', serif",
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#FFE07D',
                    letterSpacing: '1px',
                  }}
                >
                  БЫСТРЫЙ СТАРТ В БРАУЗЕРЕ
                </span>
              </div>

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#4ade80',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(34, 197, 94, 0.45)',
                }}
              >
                ⚡ Без скачивания
              </span>
            </div>

            {/* Launch Form */}
            <form onSubmit={handleLaunch} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Starter Resources Box */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  border: '1.5px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GoldCoinGlyph size={22} color="#f59e0b" glow />
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#f59e0b' }}>+500 Золота</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CrystalGlyph size={22} color="#60a5fa" glow />
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#60a5fa' }}>+50 Кристаллов</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SwordGlyph size={20} color="#4ade80" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#4ade80' }}>Бамбуковый шест</span>
                </div>
              </div>

              {/* Callsign / Nickname Input */}
              <div>
                <label style={{ display: 'block', fontSize: '15px', color: '#e2d7c5', marginBottom: '8px', fontWeight: 700 }}>
                  Позывной Мастера (Имя персонажа на арене):
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    border: '1.5px solid rgba(212, 175, 55, 0.5)',
                    color: '#ffffff',
                    fontSize: '17px',
                    fontWeight: 700,
                    outline: 'none',
                    letterSpacing: '0.5px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                  1-й уровень, 0 XP • Честный старт для всех воинов
                </div>
              </div>

              {/* Big Golden Action Button: В БОЙ */}
              <ShinyGoldButton
                type="submit"
                style={{ width: '100%', padding: '22px 32px', fontSize: '19px', marginTop: '4px' }}
              >
                <SwordGlyph size={26} color="#120d04" />
                <span>В БОЙ • ИГРАТЬ В БРАУЗЕРЕ</span>
              </ShinyGoldButton>

              {/* Honest Persistence Notice */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: '#b5a695',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>💾</span>
                <div>
                  <strong style={{ color: '#FFE07D', display: 'block', marginBottom: '2px' }}>
                    100% Локальное сохранение прогресса
                  </strong>
                  Ваш прогресс надежно сохраняется в локальном хранилище браузера (LocalStorage / IndexedDB).
                  Для синхронизации между устройствами доступен запуск через VK Mini Apps.
                </div>
              </div>
            </form>
          </HudCard>
        </div>
      </div>
    </section>
  );
};
