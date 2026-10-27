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
import { OFFICIAL_DOMAIN } from '../portalConstants';
import { HudCard } from './hud/HudCard';
import { ShinyGoldButton } from './hud/ShinyGoldButton';
import { accountAuthService, IUserAccount } from '../../services/AccountAuthService';

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

  // Auth Form State
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
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
    };
    window.addEventListener('mow:auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('mow:auth_state_changed', handleAuthChange);
  }, []);

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
      setFormMsg({ text: 'Аккаунт успешно создан! Входим в мир...', isError: false });

      setTimeout(() => {
        onLaunchGame();
      }, 350);
    } catch (err: any) {
      setFormMsg({ text: err?.message || 'Непредвиденная ошибка', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleContinueAsCurrent = () => {
    portalSound.playEquip();
    proceduralAudio.playDuelHorn();
    onLaunchGame();
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
              Официальный портал • {OFFICIAL_DOMAIN} • Играть онлайн
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

          {/* Direct Concise Game Description */}
          <p
            style={{
              margin: '0',
              maxWidth: '680px',
              fontSize: 'clamp(17px, 1.35vw, 21px)',
              lineHeight: 1.7,
              color: '#d4c7b6',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            Официальный сайт браузерной тактической RPG ({OFFICIAL_DOMAIN}).
            Мгновенный запуск прямо в окне браузера без скачивания и тяжелых установок.
            Прокачивайте чемпионов, куйте эпическую экипировку и побеждайте на соревновательной арене Дикоземья.
          </p>
        </div>

        {/* Right Column: Full-Fledged Account System (Registration & Login) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HudCard
            active={true}
            beamColor="#FFE07D"
            style={{ width: '100%', maxWidth: '580px', padding: 'clamp(28px, 4vw, 44px)' }}
          >
            {currentAccount ? (
              /* ALREADY LOGGED IN: Active Master Account Card */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)',
                    paddingBottom: '18px',
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
                      }}
                    >
                      АККАУНТ АКТИВЕН
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
                    ● В сети
                  </span>
                </div>

                {/* Account Details Box */}
                <div
                  style={{
                    padding: '18px 22px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    border: '1.5px solid rgba(212, 175, 55, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
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
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#ffffff',
                        fontFamily: "'Philosopher', serif",
                        letterSpacing: '0.5px',
                      }}
                    >
                      {currentAccount.login}
                    </div>
                    <div style={{ fontSize: '13px', color: '#b5a695', marginTop: '2px' }}>
                      {currentAccount.email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#FFE07D', fontWeight: 700, marginTop: '4px' }}>
                      Мастер Дао • Уровень {currentAccount.profile.level || 1}
                    </div>
                  </div>
                </div>

                {/* Resources Bar */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GoldCoinGlyph size={20} color="#f59e0b" glow />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>
                      {currentAccount.profile.gold} Золота
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CrystalGlyph size={20} color="#60a5fa" glow />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#60a5fa' }}>
                      {currentAccount.profile.diamonds} Кристаллов
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                <ShinyGoldButton
                  type="button"
                  onClick={handleContinueAsCurrent}
                  style={{ width: '100%', padding: '20px 32px', fontSize: '18px' }}
                >
                  <SwordGlyph size={24} color="#120d04" />
                  <span>ПРОДОЛЖИТЬ ИГРУ</span>
                </ShinyGoldButton>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textAlign: 'center',
                    marginTop: '-4px',
                  }}
                >
                  Сменить аккаунт / Выйти
                </button>
              </div>
            ) : (
              /* NOT LOGGED IN: Full-Fledged Registration / Login Tabs */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Tabs Switcher */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '6px',
                    borderRadius: '16px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
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
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor:
                        authMode === 'register' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                      color: authMode === 'register' ? '#FFE07D' : '#9ca3af',
                      fontFamily: "'Philosopher', serif",
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow:
                        authMode === 'register' ? '0 0 15px rgba(212, 175, 55, 0.2)' : 'none',
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
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor:
                        authMode === 'login' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                      color: authMode === 'login' ? '#FFE07D' : '#9ca3af',
                      fontFamily: "'Philosopher', serif",
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow:
                        authMode === 'login' ? '0 0 15px rgba(212, 175, 55, 0.2)' : 'none',
                    }}
                  >
                    ВХОД В АККАУНТ
                  </button>
                </div>

                {/* Starter Resources Strip */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#FFE07D', fontWeight: 800 }}>🎁 Стартовый бонус:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 800 }}>+500 Золота</span>
                  <span style={{ color: '#60a5fa', fontWeight: 800 }}>+50 Кристаллов</span>
                  <span style={{ color: '#4ade80', fontWeight: 800 }}>Шест мастера</span>
                </div>

                {/* Form Message (Error / Success) */}
                {formMsg && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '14px',
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

                {/* FORM: Registration Mode */}
                {authMode === 'register' ? (
                  <form
                    onSubmit={handleRegisterSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
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
                        Позывной воина (Логин персонажа):
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Например, admin или Voin"
                        value={loginField}
                        onChange={(e) => setLoginField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
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
                        Email (для сохранения и доступа к аккаунту):
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="voin@mastersofthewild.ru"
                        value={emailField}
                        onChange={(e) => setEmailField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
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
                        Пароль:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Минимум 4 символа"
                        value={passwordField}
                        onChange={(e) => setPasswordField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
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

                    <ShinyGoldButton
                      type="submit"
                      disabled={isLoading}
                      style={{ width: '100%', padding: '20px 32px', fontSize: '18px', marginTop: '6px' }}
                    >
                      <ShieldGlyph size={24} color="#120d04" />
                      <span>{isLoading ? 'СОЗДАНИЕ АККАУНТА...' : 'СОЗДАТЬ АККАУНТ И В БОЙ'}</span>
                    </ShinyGoldButton>
                  </form>
                ) : (
                  /* FORM: Login Mode */
                  <form
                    onSubmit={handleLoginSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
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
                        Имя персонажа или Email:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="admin или ваш email"
                        value={loginIdentField}
                        onChange={(e) => setLoginIdentField(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
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
                          border: '1.5px solid rgba(212, 175, 55, 0.5)',
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <ShinyGoldButton
                      type="submit"
                      disabled={isLoading}
                      style={{ width: '100%', padding: '20px 32px', fontSize: '18px', marginTop: '6px' }}
                    >
                      <SwordGlyph size={24} color="#120d04" />
                      <span>{isLoading ? 'ПРОВЕРКА...' : 'ВОЙТИ В АККАУНТ И В БОЙ'}</span>
                    </ShinyGoldButton>
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
