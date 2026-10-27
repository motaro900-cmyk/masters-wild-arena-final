import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SwordGlyph,
  ShieldGlyph,
  GoldCoinGlyph,
  CrystalGlyph,
} from './PortalGlyphs';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { portalSound } from '../PortalSoundService';
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

  // Callsign
  const [callsign, setCallsign] = useState(() => {
    return localStorage.getItem('mow_player_name') || 'admin';
  });

  // Auth Mode: 'register' is primary, 'login' for returning players
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [loginField, setLoginField] = useState('');
  const [emailField, setEmailField] = useState('');
  const [passwordField, setPasswordField] = useState('');
  const [confirmPassField, setConfirmPassField] = useState('');
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
   * Launch game with active session
   */
  const handleLaunch = () => {
    portalSound.playEquip();
    proceduralAudio.playDuelHorn();
    onLaunchGame();
  };

  /**
   * Account Registration
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (passwordField !== confirmPassField) {
      portalSound.playClick(0.7);
      setFormMsg({ text: 'Пароли не совпадают! Проверьте повтор пароля.', isError: true });
      return;
    }

    setIsLoading(true);

    try {
      const res = await accountAuthService.register({
        login: loginField,
        email: emailField,
        password: passwordField,
        selectedHeroId: 'panda',
      });

      if (!res.success) {
        portalSound.playClick(0.7);
        setFormMsg({ text: res.error || 'Ошибка регистрации', isError: true });
        setIsLoading(false);
        return;
      }

      portalSound.playReward();
      proceduralAudio.playFanfare();
      setFormMsg({ text: 'Аккаунт успешно создан! Запуск игры...', isError: false });

      setTimeout(() => {
        onLaunchGame();
      }, 350);
    } catch (err: any) {
      setFormMsg({ text: err?.message || 'Непредвиденная ошибка регистрации', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Account Login
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
        setFormMsg({ text: res.error || 'Неверный логин или пароль', isError: true });
        setIsLoading(false);
        return;
      }

      portalSound.playReward();
      proceduralAudio.playDuelHorn();
      setFormMsg({ text: `С возвращением, ${res.account?.login}! Вход в игру...`, isError: false });

      setTimeout(() => {
        onLaunchGame();
      }, 300);
    } catch (err: any) {
      setFormMsg({ text: err?.message || 'Непредвиденная ошибка входа', isError: true });
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
        backgroundColor: '#0c0817',
      }}
    >
      {/* 1. Vibrant, High-Saturated, Radiant Game Background */}
      <motion.div
        animate={{ scale: [1.02, 1.05, 1.02] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/images/backgrounds/bg_main.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          filter: 'brightness(1.02) contrast(1.12) saturate(1.2)',
          zIndex: 0,
        }}
      />

      {/* 2. Warm Sunbeam Radial Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 30%, rgba(255, 235, 160, 0.16) 0%, rgba(20, 14, 32, 0.38) 60%, #0c0817 100%)',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '160px',
          background: 'linear-gradient(to top, #0c0817 0%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* 3. Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1680px',
          width: '100%',
          padding: '0 clamp(14px, 3.5vw, 70px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Game Branding */}
        <div style={{ textAlign: 'left' }}>
          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 24px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.25)',
              border: '1.5px solid rgba(255, 224, 125, 0.75)',
              boxShadow: '0 0 35px rgba(255, 215, 0, 0.4)',
              marginBottom: '24px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 16px #4ade80',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                color: '#FFE899',
                fontSize: 'clamp(11px, 2.8vw, 15px)',
                fontWeight: 800,
                letterSpacing: 'clamp(0.5px, 0.2vw, 1.5px)',
                textTransform: 'uppercase',
                fontFamily: "'Montserrat', sans-serif",
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              ✨ Официальный сайт • Играй бесплатно в браузере
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
                '0 4px 35px rgba(0,0,0,0.98), 0 0 60px rgba(255, 215, 0, 0.45)',
              letterSpacing: '0.5px',
            }}
          >
            Добро пожаловать в <br />
            <span
              style={{
                background:
                  'linear-gradient(135deg, #FFF0A8 0%, #FFE07D 40%, #eab308 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 14px rgba(234, 179, 8, 0.5))',
              }}
            >
              MASTERS OF THE WILD
            </span>
          </h1>

          {/* Direct Concise Game Description */}
          <p
            style={{
              margin: '0 0 26px 0',
              maxWidth: '680px',
              fontSize: 'clamp(17px, 1.35vw, 21px)',
              lineHeight: 1.7,
              color: '#f5edd8',
              textShadow: '0 2px 14px rgba(0,0,0,0.95)',
            }}
          >
            Браузерная тактическая RPG нового поколения. Мгновенный запуск прямо в браузере без скачивания файлов.
            5 легендарных чемпионов, глубокая кузница экипировки из 7 слотов, соревновательная арена и живой оркестровый саундтрек.
          </p>

          {/* Fantasy Features Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#FFE07D',
                backgroundColor: 'rgba(212, 175, 55, 0.22)',
                padding: '8px 18px',
                borderRadius: '14px',
                border: '1.5px solid rgba(255, 224, 125, 0.55)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
              }}
            >
              ⚔️ Тактические дуэли
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#86efac',
                backgroundColor: 'rgba(34, 197, 94, 0.22)',
                padding: '8px 18px',
                borderRadius: '14px',
                border: '1.5px solid rgba(74, 222, 128, 0.55)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
              }}
            >
              🛡️ Кузница артефактов
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#93c5fd',
                backgroundColor: 'rgba(59, 130, 246, 0.22)',
                padding: '8px 18px',
                borderRadius: '14px',
                border: '1.5px solid rgba(96, 165, 250, 0.55)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
              }}
            >
              🏆 Рейтинговая арена
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#fbcfe8',
                backgroundColor: 'rgba(236, 72, 153, 0.22)',
                padding: '8px 18px',
                borderRadius: '14px',
                border: '1.5px solid rgba(244, 114, 182, 0.55)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
              }}
            >
              🎼 Оркестровый саундтрек
            </span>
          </div>
        </div>

        {/* Right Column: Clean Master-Account Registration & Login Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HudCard
            active={true}
            beamColor="#FFE07D"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: 'clamp(18px, 3.5vw, 36px)',
              backgroundColor: 'rgba(18, 12, 30, 0.94)',
              border: '2px solid rgba(255, 224, 125, 0.55)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(212, 175, 55, 0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1.5px solid rgba(212, 175, 55, 0.35)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldGlyph size={28} color="#FFE07D" glow />
                <span
                  style={{
                    fontFamily: "'Philosopher', serif",
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#FFE07D',
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentAccount ? 'МАСТЕР-АККАУНТ' : authMode === 'register' ? 'РЕГИСТРАЦИЯ' : 'ВХОД В ИГРУ'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#4ade80',
                  backgroundColor: 'rgba(34, 197, 94, 0.22)',
                  padding: '6px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(34, 197, 94, 0.55)',
                }}
              >
                ● Облачный сейв
              </span>
            </div>

            {currentAccount ? (
              /* ACTIVE LOGGED IN ACCOUNT CARD */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    border: '1.5px solid rgba(212, 175, 55, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '2px solid #FFE07D',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.55)',
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
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#ffffff',
                        fontFamily: "'Philosopher', serif",
                      }}
                    >
                      {currentAccount.login}
                    </div>
                    <div style={{ fontSize: '13px', color: '#d4c7b6', marginTop: '2px' }}>
                      {currentAccount.email}
                    </div>
                    <div style={{ fontSize: '13px', color: '#FFE07D', fontWeight: 800, marginTop: '2px' }}>
                      Уровень {currentAccount.profile.level || 1} • Рейтинг {currentAccount.profile.rating || 1000} 🏆
                    </div>
                  </div>
                </div>

                {/* Resources Bar */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    border: '1.5px solid rgba(212, 175, 55, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GoldCoinGlyph size={20} color="#f59e0b" glow />
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#f59e0b' }}>
                      {currentAccount.profile.gold} Золота
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CrystalGlyph size={20} color="#60a5fa" glow />
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#60a5fa' }}>
                      {currentAccount.profile.diamonds} Кристаллов
                    </span>
                  </div>
                </div>

                {/* Primary Launch Button */}
                <ShinyGoldButton
                  type="button"
                  onClick={handleLaunch}
                  style={{ width: '100%', padding: '20px 32px', fontSize: '18px' }}
                >
                  <SwordGlyph size={24} color="#120d04" />
                  <span>ВОЙТИ В ИГРУ</span>
                </ShinyGoldButton>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#d4c7b6',
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
              /* CLEAN REGISTRATION & LOGIN FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Tabs Switcher: Регистрация (default) / Вход */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '5px',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      portalSound.playClick(1.0);
                      setAuthMode('register');
                      setFormMsg(null);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor:
                        authMode === 'register' ? 'rgba(212, 175, 55, 0.3)' : 'transparent',
                      color: authMode === 'register' ? '#FFE07D' : '#9ca3af',
                      fontFamily: "'Philosopher', serif",
                      fontSize: '16px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow:
                        authMode === 'register' ? '0 2px 10px rgba(212, 175, 55, 0.35)' : 'none',
                    }}
                  >
                    РЕГИСТРАЦИЯ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      portalSound.playClick(1.0);
                      setAuthMode('login');
                      setFormMsg(null);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor:
                        authMode === 'login' ? 'rgba(212, 175, 55, 0.3)' : 'transparent',
                      color: authMode === 'login' ? '#FFE07D' : '#9ca3af',
                      fontFamily: "'Philosopher', serif",
                      fontSize: '16px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow:
                        authMode === 'login' ? '0 2px 10px rgba(212, 175, 55, 0.35)' : 'none',
                    }}
                  >
                    ВХОД
                  </button>
                </div>

                {/* Form Alert Message */}
                {formMsg && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      backgroundColor: formMsg.isError
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(34, 197, 94, 0.2)',
                      border: `1.5px solid ${formMsg.isError ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)'}`,
                      color: formMsg.isError ? '#fca5a5' : '#86efac',
                      textAlign: 'center',
                    }}
                  >
                    {formMsg.text}
                  </div>
                )}

                {/* Bonus Strip */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    border: '1.5px solid rgba(255, 224, 125, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GoldCoinGlyph size={18} color="#f59e0b" glow />
                    <span style={{ color: '#f59e0b', fontWeight: 900 }}>+500 Золота</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CrystalGlyph size={18} color="#60a5fa" glow />
                    <span style={{ color: '#60a5fa', fontWeight: 900 }}>+50 Кристаллов</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SwordGlyph size={18} color="#4ade80" />
                    <span style={{ color: '#4ade80', fontWeight: 900 }}>Шест Дзена</span>
                  </div>
                </div>

                {authMode === 'register' ? (
                  /* ── CLEAN REGISTRATION FORM ── */
                  <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 1. Callsign / Login */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          color: '#f5edd8',
                          marginBottom: '6px',
                          fontWeight: 700,
                        }}
                      >
                        Позывной воина (Логин персонажа):
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Громобой, admin"
                        value={loginField}
                        onChange={(e) => setLoginField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          border: '1.5px solid rgba(255, 224, 125, 0.55)',
                          color: '#ffffff',
                          fontSize: '15px',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* 2. Email */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          color: '#f5edd8',
                          marginBottom: '6px',
                          fontWeight: 700,
                        }}
                      >
                        Email (для защиты и сохранения прогресса):
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@domain.ru"
                        value={emailField}
                        onChange={(e) => setEmailField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          border: '1.5px solid rgba(255, 224, 125, 0.55)',
                          color: '#ffffff',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* 3. Password & Confirm Password (2 Columns) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            color: '#f5edd8',
                            marginBottom: '6px',
                            fontWeight: 700,
                          }}
                        >
                          Пароль:
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Минимум 4 симв."
                          value={passwordField}
                          onChange={(e) => setPasswordField(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            border: '1.5px solid rgba(255, 224, 125, 0.55)',
                            color: '#ffffff',
                            fontSize: '15px',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            color: '#f5edd8',
                            marginBottom: '6px',
                            fontWeight: 700,
                          }}
                        >
                          Повтор пароля:
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Повторите"
                          value={confirmPassField}
                          onChange={(e) => setConfirmPassField(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            border: '1.5px solid rgba(255, 224, 125, 0.55)',
                            color: '#ffffff',
                            fontSize: '15px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* BIG GOLD CTA BUTTON */}
                    <ShinyGoldButton
                      type="submit"
                      disabled={isLoading}
                      style={{ width: '100%', padding: '20px 24px', fontSize: '18px', marginTop: '6px' }}
                    >
                      <SwordGlyph size={24} color="#120d04" />
                      <span>{isLoading ? 'СОЗДАНИЕ АККАУНТА...' : 'СОЗДАТЬ АККАУНТ И В БОЙ'}</span>
                    </ShinyGoldButton>

                    {/* Storage & Privacy note */}
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#d4c7b6',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      🔒 100% сохранение прогресса. Нажимая кнопку, вы соглашаетесь с Политикой конфиденциальности.
                    </div>
                  </form>
                ) : (
                  /* ── CLEAN LOGIN FORM ── */
                  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          color: '#f5edd8',
                          marginBottom: '6px',
                          fontWeight: 700,
                        }}
                      >
                        Позывной воина или Email:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Логин или yourname@domain.ru"
                        value={loginIdentField}
                        onChange={(e) => setLoginIdentField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          border: '1.5px solid rgba(255, 224, 125, 0.55)',
                          color: '#ffffff',
                          fontSize: '15px',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          color: '#f5edd8',
                          marginBottom: '6px',
                          fontWeight: 700,
                        }}
                      >
                        Пароль:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Ваш пароль"
                        value={loginPassField}
                        onChange={(e) => setLoginPassField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          border: '1.5px solid rgba(255, 224, 125, 0.55)',
                          color: '#ffffff',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* BIG GOLD CTA BUTTON */}
                    <ShinyGoldButton
                      type="submit"
                      disabled={isLoading}
                      style={{ width: '100%', padding: '20px 24px', fontSize: '18px', marginTop: '6px' }}
                    >
                      <SwordGlyph size={24} color="#120d04" />
                      <span>{isLoading ? 'ПРОВЕРКА ВХОДА...' : 'ВОЙТИ В ИГРУ'}</span>
                    </ShinyGoldButton>

                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setFormMsg(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#FFE07D',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Еще нет аккаунта? Зарегистрироваться за 10 секунд →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </HudCard>
        </div>
      </div>
    </section>
  );
};
