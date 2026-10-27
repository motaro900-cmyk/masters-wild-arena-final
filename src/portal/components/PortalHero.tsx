import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SwordGlyph,
  ShieldGlyph,
  GoldCoinGlyph,
  CrystalGlyph,
} from './PortalGlyphs';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { portalSound } from '../PortalSoundService';
import { OFFICIAL_DOMAIN, STORAGE_BACKEND } from '../portalConstants';
import { HudCard } from './hud/HudCard';
import { ShinyGoldButton } from './hud/ShinyGoldButton';
import { accountAuthService, IUserAccount } from '../../services/AccountAuthService';
import { portalSyncBridge } from '../../services/PortalSyncBridge';

interface PortalHeroProps {
  onLaunchGame: () => void;
  onExploreBeasts: () => void;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  onLaunchGame,
}) => {
  const [currentAccount, setCurrentAccount] = useState<IUserAccount | null>(() =>
    accountAuthService.getCurrentAccount()
  );

  // Quick Play Callsign
  const [callsign, setCallsign] = useState(() => {
    return localStorage.getItem('mow_player_name') || 'admin';
  });

  // Optional Advanced Auth Form State
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login');
  const [loginField, setLoginField] = useState('');
  const [emailField, setEmailField] = useState('');
  const [passwordField, setPasswordField] = useState('');
  const [loginIdentField, setLoginIdentField] = useState('');
  const [loginPassField, setLoginPassField] = useState('');

  const [formMsg, setFormMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const acc = e.detail?.account ?? accountAuthService.getCurrentAccount();
      setCurrentAccount(acc);
      if (acc?.login) setCallsign(acc.login);
    };
    window.addEventListener('mow:auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('mow:auth_state_changed', handleAuthChange);
  }, []);

  /**
   * Frictionless 1-Click Launch (Zero-Barrier Onboarding)
   */
  const handleQuickPlay = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanName = callsign.trim() || 'admin';
    portalSound.playEquip();
    proceduralAudio.playDuelHorn();

    // Persist player name locally for game launch
    localStorage.setItem('mow_player_name', cleanName);
    localStorage.setItem('mow_master_nick', cleanName);
    portalSyncBridge.commitMutation({
      playerName: cleanName,
      isLoggedIn: true,
    });

    onLaunchGame();
  };

  /**
   * Optional Full Account Registration
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    setIsLoading(true);

    try {
      const res = await accountAuthService.register({
        login: loginField,
        email: emailField,
        password: passwordField,
      });

      if (!res.success) {
        portalSound.playClick(0.7);
        setFormMsg({ text: res.error || 'Ошибка регистрации', isError: true });
        setIsLoading(false);
        return;
      }

      portalSound.playReward();
      proceduralAudio.playFanfare();
      setFormMsg({ text: 'Аккаунт успешно создан! Запуск...', isError: false });

      setTimeout(() => {
        onLaunchGame();
      }, 350);
    } catch (err: any) {
      setFormMsg({ text: err?.message || 'Непредвиденная ошибка', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Optional Full Account Login
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    setIsLoading(true);

    try {
      const res = await accountAuthService.login({
        identifier: loginIdentField,
        password: loginPassField,
      });

      if (!res.success) {
        portalSound.playClick(0.7);
        setFormMsg({ text: res.error || 'Неверные данные входа', isError: true });
        setIsLoading(false);
        return;
      }

      portalSound.playReward();
      proceduralAudio.playDuelHorn();
      setFormMsg({ text: `С возвращением, ${res.account?.login}! Запуск...`, isError: false });

      setTimeout(() => {
        onLaunchGame();
      }, 300);
    } catch (err: any) {
      setFormMsg({ text: err?.message || 'Непредвиденная ошибка', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    portalSound.playClick(0.85);
    accountAuthService.logout();
    setFormMsg(null);
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

      {/* 3. Main Full-Scale Layout Container (Clean 2-Column Responsive Layout) */}
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
        {/* Left Column: Monumental Branding & Direct Game Intro */}
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
              ⚡ Zero-Server • React 19 + PixiJS v8 • 60 FPS
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            style={{
              margin: '0 0 20px 0',
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

          {/* Direct Concise Game Description */}
          <p
            style={{
              margin: '0 0 28px 0',
              maxWidth: '680px',
              fontSize: 'clamp(17px, 1.35vw, 21px)',
              lineHeight: 1.7,
              color: '#d4c7b6',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            Официальный сайт браузерной тактической RPG ({OFFICIAL_DOMAIN}).
            Мгновенный запуск прямо в окне браузера без скачивания и очередей.
            10 уникальных чемпионов, кузница экипировки из 7 слотов, соревновательная арена с 9 PvP-рангами и оркестровый саундтрек (-14 LUFS).
          </p>

          {/* Feature Badges Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFE07D',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.35)',
              }}
            >
              ⚡ 0 сек загрузки
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#4ade80',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.35)',
              }}
            >
              🎮 60 FPS на PixiJS v8
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.12)',
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(96, 165, 250, 0.35)',
              }}
            >
              ☁️ VK Cloud Storage
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#e2d7c5',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              ⚖️ 152-ФЗ Комплаенс
            </span>
          </div>
        </div>

        {/* Right Column: Zero-Barrier Instant Launch Card (10/10 UX & Conversion) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HudCard
            active={true}
            beamColor="#FFE07D"
            style={{ width: '100%', maxWidth: '580px', padding: 'clamp(28px, 4vw, 42px)' }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)',
                paddingBottom: '18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldGlyph size={26} color="#FFE07D" glow />
                <span
                  style={{
                    fontFamily: "'Philosopher', serif",
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#FFE07D',
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentAccount ? 'МАСТЕР-АККАУНТ' : 'МГНОВЕННЫЙ ЗАПУСК'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#4ade80',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  padding: '5px 12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(34, 197, 94, 0.45)',
                }}
              >
                ● 0 сек ожидания
              </span>
            </div>

            {currentAccount ? (
              /* ACTIVE LOGGED IN ACCOUNT CARD */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    border: '1.5px solid rgba(212, 175, 55, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '2px solid #FFE07D',
                      boxShadow: '0 0 16px rgba(212, 175, 55, 0.4)',
                      flexShrink: 0,
                      backgroundColor: '#120d1c',
                    }}
                  >
                    <img
                      src="/assets/images/avatars/panda.webp"
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#ffffff',
                        fontFamily: "'Philosopher', serif",
                      }}
                    >
                      {currentAccount.login}
                    </div>
                    <div style={{ fontSize: '13px', color: '#b5a695', marginTop: '2px' }}>
                      {currentAccount.email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#FFE07D', fontWeight: 700, marginTop: '2px' }}>
                      Фэн Лун (Мастер Дао) • Уровень {currentAccount.profile.level || 1}
                    </div>
                  </div>
                </div>

                {/* Resources Bar */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GoldCoinGlyph size={18} color="#f59e0b" glow />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>
                      {currentAccount.profile.gold} Золота
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CrystalGlyph size={18} color="#60a5fa" glow />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#60a5fa' }}>
                      {currentAccount.profile.diamonds} Кристаллов
                    </span>
                  </div>
                </div>

                {/* Primary Button */}
                <ShinyGoldButton
                  type="button"
                  onClick={handleQuickPlay}
                  style={{ width: '100%', padding: '20px 32px', fontSize: '18px' }}
                >
                  <SwordGlyph size={24} color="#120d04" />
                  <span>ПРОДОЛЖИТЬ ИГРУ</span>
                </ShinyGoldButton>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textAlign: 'center',
                  }}
                >
                  Сменить аккаунт / Выйти
                </button>
              </div>
            ) : (
              /* INSTANT PLAY (ZERO BARRIER) + OPTIONAL ADVANCED AUTH */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Starter Resources Strip */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1.5px solid rgba(212, 175, 55, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GoldCoinGlyph size={18} color="#f59e0b" glow />
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>+500 Золота</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CrystalGlyph size={18} color="#60a5fa" glow />
                    <span style={{ color: '#60a5fa', fontWeight: 800 }}>+50 Кристаллов</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SwordGlyph size={18} color="#4ade80" />
                    <span style={{ color: '#4ade80', fontWeight: 800 }}>Шест Фэн Луна</span>
                  </div>
                </div>

                {!showAdvancedAuth ? (
                  /* ZERO FRICTION MODE: CALLSIGN + 1-CLICK INSTANT LAUNCH */
                  <form onSubmit={handleQuickPlay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          color: '#e2d7c5',
                          marginBottom: '6px',
                          fontWeight: 700,
                        }}
                      >
                        Позывной воина (Имя персонажа на арене):
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="admin"
                        value={callsign}
                        onChange={(e) => setCallsign(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          border: '1.5px solid rgba(212, 175, 55, 0.5)',
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* BIG GOLD CTA BUTTON */}
                    <ShinyGoldButton
                      type="submit"
                      style={{ width: '100%', padding: '22px 32px', fontSize: '19px', marginTop: '4px' }}
                    >
                      <SwordGlyph size={26} color="#120d04" />
                      <span>ИГРАТЬ СРАЗУ В БРАУЗЕРЕ</span>
                    </ShinyGoldButton>

                    {/* Storage & Privacy Note */}
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        lineHeight: 1.5,
                      }}
                    >
                      🔒 Сохранение: {STORAGE_BACKEND}. Без очередей и скачивания.
                    </div>

                    {/* Toggle to Open Advanced Password Protection */}
                    <div style={{ textAlign: 'center', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedAuth(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d4af37',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Войти под паролем / Защитить аккаунт Email →
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ADVANCED AUTH: REGISTER / LOGIN TABS */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Tabs Switcher */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '4px',
                        borderRadius: '14px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          portalSound.playClick(1.0);
                          setAuthMode('login');
                          setFormMsg(null);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor:
                            authMode === 'login' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                          color: authMode === 'login' ? '#FFE07D' : '#9ca3af',
                          fontFamily: "'Philosopher', serif",
                          fontSize: '15px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        ВХОД
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          portalSound.playClick(1.0);
                          setAuthMode('register');
                          setFormMsg(null);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor:
                            authMode === 'register' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                          color: authMode === 'register' ? '#FFE07D' : '#9ca3af',
                          fontFamily: "'Philosopher', serif",
                          fontSize: '15px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        РЕГИСТРАЦИЯ
                      </button>
                    </div>

                    {/* Form Message */}
                    {formMsg && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: formMsg.isError
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(34, 197, 94, 0.15)',
                          border: `1.5px solid ${formMsg.isError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
                          color: formMsg.isError ? '#fca5a5' : '#86efac',
                          textAlign: 'center',
                        }}
                      >
                        {formMsg.text}
                      </div>
                    )}

                    {authMode === 'register' ? (
                      <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Позывной воина (от 3 символов)"
                            value={loginField}
                            onChange={(e) => setLoginField(e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1.5px solid rgba(212, 175, 55, 0.45)',
                              color: '#ffffff',
                              fontSize: '15px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            required
                            placeholder="Email (для восстановления)"
                            value={emailField}
                            onChange={(e) => setEmailField(e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1.5px solid rgba(212, 175, 55, 0.45)',
                              color: '#ffffff',
                              fontSize: '15px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            required
                            placeholder="Пароль (минимум 4 символа)"
                            value={passwordField}
                            onChange={(e) => setPasswordField(e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1.5px solid rgba(212, 175, 55, 0.45)',
                              color: '#ffffff',
                              fontSize: '15px',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <ShinyGoldButton type="submit" disabled={isLoading} style={{ width: '100%', padding: '16px' }}>
                          <ShieldGlyph size={20} color="#120d04" />
                          <span>{isLoading ? 'СОЗДАНИЕ...' : 'СОЗДАТЬ АККАУНТ И В БОЙ'}</span>
                        </ShinyGoldButton>
                      </form>
                    ) : (
                      <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Позывной или Email"
                            value={loginIdentField}
                            onChange={(e) => setLoginIdentField(e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1.5px solid rgba(212, 175, 55, 0.45)',
                              color: '#ffffff',
                              fontSize: '15px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            required
                            placeholder="Пароль"
                            value={loginPassField}
                            onChange={(e) => setLoginPassField(e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              border: '1.5px solid rgba(212, 175, 55, 0.45)',
                              color: '#ffffff',
                              fontSize: '15px',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <ShinyGoldButton type="submit" disabled={isLoading} style={{ width: '100%', padding: '16px' }}>
                          <SwordGlyph size={20} color="#120d04" />
                          <span>{isLoading ? 'ПРОВЕРКА...' : 'ВОЙТИ И В БОЙ'}</span>
                        </ShinyGoldButton>
                      </form>
                    )}

                    {/* Back to Quick Play */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdvancedAuth(false);
                        setFormMsg(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textAlign: 'center',
                      }}
                    >
                      ← Вернуться к быстрому запуску без пароля
                    </button>
                  </div>
                )}
              </div>
            )}
          </HudCard>
        </div>
      </div>
    </section>
  );
};
