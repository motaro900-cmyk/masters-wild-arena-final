import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SwordGlyph,
  ShieldGlyph,
  CrownGlyph,
  FrostGlyph,
  GoldCoinGlyph,
  CrystalGlyph,
} from './PortalGlyphs';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { portalSound } from '../PortalSoundService';
import { portalSyncBridge } from '../../services/PortalSyncBridge';
import { SERVER_ONLINE_STRING, SERVER_NAME } from '../portalConstants';
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
  const isLoggedIn = !!profile.isLoggedIn;

  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [formMsg, setFormMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const handleSync = (e: any) => {
      setProfile(e.detail || portalSyncBridge.getProfile());
    };
    window.addEventListener('mow:portal_sync', handleSync);
    return () => window.removeEventListener('mow:portal_sync', handleSync);
  }, []);

  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormMsg({ text: 'Заполните email и пароль', isError: true });
      return;
    }

    const masterNick = nickname.trim() || email.split('@')[0];
    portalSound.playReward();
    proceduralAudio.playFanfare();

    localStorage.setItem('mow_auth_token', 'mow_jwt_' + Date.now());
    localStorage.setItem('mow_auth_email', email.trim());
    localStorage.setItem('mow_master_nick', masterNick);

    portalSyncBridge.commitMutation({
      playerName: masterNick,
      accountEmail: email.trim(),
      isLoggedIn: true,
      gold: profile.gold + (authMode === 'register' ? 500 : 0),
      diamonds: profile.diamonds + (authMode === 'register' ? 50 : 0),
    });

    const updated = portalSyncBridge.getProfile();
    setProfile(updated);

    setFormMsg({
      text:
        authMode === 'register'
          ? '✓ Аккаунт успешно создан на сайте! Получено +500 золота и +50 кристаллов.'
          : '✓ С возвращением, ' + masterNick + '!',
      isError: false,
    });
  };

  const handleGuestQuickPlay = () => {
    portalSound.playEquip();
    proceduralAudio.playDuelHorn();
    onLaunchGame();
  };

  const handleLogout = () => {
    portalSound.playClick(0.9);
    portalSyncBridge.commitMutation({
      isLoggedIn: false,
      accountEmail: '',
    });
    localStorage.removeItem('mow_auth_token');
    localStorage.removeItem('mow_auth_email');
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
        {/* Left Column: Monumental Branding, Server Status, Unified Hero */}
        <div style={{ textAlign: 'left' }}>
          {/* Live Server Status Badge */}
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
              Сервер {SERVER_NAME} • Онлайн {SERVER_ONLINE_STRING} воинов
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            style={{
              margin: '0 0 22px 0',
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(46px, 5.8vw, 84px)',
              fontWeight: 900,
              lineHeight: 1.08,
              color: '#ffffff',
              textShadow:
                '0 4px 35px rgba(0,0,0,0.98), 0 0 60px rgba(212, 175, 55, 0.35)',
              letterSpacing: '0.5px',
            }}
          >
            Вступи в Битву <br />
            <span
              style={{
                background:
                  'linear-gradient(135deg, #FFE07D 0%, #d4af37 40%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Легендарных Зверей
            </span>
          </h1>

          {/* Lore Description */}
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
            Официальный портал темной браузерной RPG нового поколения. Создай аккаунт на сайте, получи защищенную учетную запись бойца и начни путь в Дикоземье со стартовым набором золота и кристаллов.
          </p>

          {/* Unified Starter Champion Presentation */}
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px 28px',
              borderRadius: '22px',
              background: 'rgba(14, 10, 22, 0.94)',
              border: '1.5px solid rgba(96, 165, 250, 0.45)',
              boxShadow: '0 14px 40px rgba(0,0,0,0.85), 0 0 35px rgba(96, 165, 250, 0.25)',
              marginBottom: '30px',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'rgba(96, 165, 250, 0.18)',
                border: '1.5px solid rgba(96, 165, 250, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FrostGlyph size={28} color="#60a5fa" glow />
            </motion.div>
            <div>
              <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Единый Стартовый Чемпион
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFE07D', fontFamily: "'Philosopher', serif" }}>
                Фэн Лун • Снежный Берсерк (Лед & Ци)
              </div>
            </div>
          </div>

          {/* Beasts Codex Link */}
          <div>
            <button
              onClick={onExploreBeasts}
              style={{
                background: 'none',
                border: 'none',
                color: '#d4af37',
                fontSize: '17px',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              <CrownGlyph size={20} color="#d4af37" />
              <span>Посмотреть полный бестиарий всех 5 чемпионов и их навыки →</span>
            </button>
          </div>
        </div>

        {/* Right Column: Master Account HUD Card with Border Beam & High-Scale Elements */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HudCard
            active={true}
            beamColor={isLoggedIn ? '#22c55e' : '#FFE07D'}
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
                  {isLoggedIn ? 'ИГРОВАЯ УЧЕТНАЯ ЗАПИСЬ' : 'МАСТЕР-АККАУНТ САЙТА'}
                </span>
              </div>

              {isLoggedIn && (
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
                  ✓ Активен
                </span>
              )}
            </div>

            {/* STATE 1: ALREADY LOGGED IN -> Show Clean Game Account Details */}
            {isLoggedIn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Account Credentials Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: '18px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#9ca3af' }}>Мастер-профиль:</span>
                    <strong style={{ fontSize: '18px', color: '#FFE07D' }}>{profile.playerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#9ca3af' }}>Привязанный Email:</span>
                    <span style={{ fontSize: '15px', color: '#e5e7eb' }}>{profile.accountEmail || 'Сайт-авторизация'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#9ca3af' }}>Игровой UID (ID):</span>
                    <span style={{ fontSize: '16px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 800 }}>
                      #{profile.guestId ? profile.guestId.slice(0, 10) : 'WILD-84920'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#9ca3af' }}>Стартовый персонаж:</span>
                    <span style={{ fontSize: '15px', color: '#FFE07D', fontWeight: 700 }}>
                      Фэн Лун (Снежная Панда, Ур. 1)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#9ca3af' }}>Сервер входа:</span>
                    <span style={{ fontSize: '15px', color: '#4ade80', fontWeight: 700 }}>
                      {SERVER_NAME} ({SERVER_ONLINE_STRING} онлайн)
                    </span>
                  </div>
                </div>

                {/* Balance Pills */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(245, 158, 11, 0.14)',
                      border: '1.5px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <GoldCoinGlyph size={26} color="#f59e0b" glow />
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>Золото</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#f59e0b' }}>{profile.gold} G</div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(96, 165, 250, 0.14)',
                      border: '1.5px solid rgba(96, 165, 250, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <CrystalGlyph size={26} color="#60a5fa" glow />
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>Кристаллы</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#60a5fa' }}>{profile.diamonds} C</div>
                    </div>
                  </div>
                </div>

                {/* SHINY GOLD BUTTON: ВОЙТИ В ИГРУ ПОД ЭТИМ АККАУНТОМ */}
                <ShinyGoldButton
                  onClick={() => {
                    proceduralAudio.playDuelHorn();
                    portalSound.playEquip();
                    onLaunchGame();
                  }}
                  style={{ width: '100%', padding: '22px 32px', fontSize: '18px', marginTop: '6px' }}
                >
                  <SwordGlyph size={24} color="#120d04" />
                  <span>ВОЙТИ В ИГРУ ПОД ЭТИМ АККАУНТОМ</span>
                </ShinyGoldButton>

                {/* Secondary Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            ) : (
              /* STATE 2: NOT LOGGED IN -> Master Registration on the Site */
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Tabs: Регистрация vs Вход */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    padding: '6px',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: authMode === 'register' ? 'rgba(212, 175, 55, 0.28)' : 'transparent',
                      color: authMode === 'register' ? '#FFE07D' : '#9ca3af',
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: "'Philosopher', serif",
                    }}
                  >
                    Создать аккаунт
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: authMode === 'login' ? 'rgba(212, 175, 55, 0.28)' : 'transparent',
                      color: authMode === 'login' ? '#FFE07D' : '#9ca3af',
                      fontSize: '16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: "'Philosopher', serif",
                    }}
                  >
                    Войти в аккаунт
                  </button>
                </div>

                {/* Starter Bonus Callout */}
                {authMode === 'register' && (
                  <div
                    style={{
                      padding: '14px 20px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      border: '1.5px solid rgba(212, 175, 55, 0.45)',
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
                  </div>
                )}

                {/* Inputs with high contrast and readable 16px sizing */}
                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#e2d7c5', marginBottom: '8px', fontWeight: 600 }}>
                      Позывной Мастера (Логин на сайте и имя в игре)
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Воин_Севера"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        border: '1.5px solid rgba(212, 175, 55, 0.4)',
                        color: '#ffffff',
                        fontSize: '16px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#e2d7c5', marginBottom: '8px', fontWeight: 600 }}>
                    Email (для защиты учетной записи)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      border: '1.5px solid rgba(212, 175, 55, 0.4)',
                      color: '#ffffff',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#e2d7c5', marginBottom: '8px', fontWeight: 600 }}>
                    Пароль
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      border: '1.5px solid rgba(212, 175, 55, 0.4)',
                      color: '#ffffff',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>

                {formMsg && (
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: formMsg.isError ? '#f87171' : '#4ade80',
                      textAlign: 'center',
                    }}
                  >
                    {formMsg.text}
                  </div>
                )}

                {/* Submit Shiny Gold Button */}
                <ShinyGoldButton
                  type="submit"
                  onClick={() => handleAuthSubmit()}
                  style={{ width: '100%', padding: '22px 32px', fontSize: '18px', marginTop: '8px' }}
                >
                  <ShieldGlyph size={24} color="#120d04" />
                  <span>
                    {authMode === 'register' ? 'ЗАРЕГИСТРИРОВАТЬ АККАУНТ НА САЙТЕ' : 'ВОЙТИ В МАСТЕР-АККАУНТ'}
                  </span>
                </ShinyGoldButton>

                {/* Quick Guest Alternative */}
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleGuestQuickPlay}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '15px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Или зайти сразу как гость без сохранения на сервере →
                  </button>
                </div>
              </form>
            )}
          </HudCard>
        </div>
      </div>
    </section>
  );
};
