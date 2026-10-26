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
  onOpenCabinet: () => void;
  onExploreBeasts: () => void;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  onLaunchGame,
  onOpenCabinet,
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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormMsg({ text: 'Заполните email и пароль', isError: true });
      return;
    }

    const masterNick = nickname.trim() || email.split('@')[0];
    portalSound.playFanfare();

    portalSyncBridge.commitMutation({
      playerName: masterNick,
      accountEmail: email.trim(),
      isLoggedIn: true,
      gold: profile.gold + (authMode === 'register' ? 500 : 0),
      diamonds: profile.diamonds + (authMode === 'register' ? 50 : 0),
    });

    localStorage.setItem('mow_auth_token', 'mow_jwt_' + Date.now());
    localStorage.setItem('mow_auth_email', email.trim());
    localStorage.setItem('mow_master_nick', masterNick);

    setFormMsg({
      text: authMode === 'register' ? '✓ Аккаунт успешно создан на сайте! Бонусы начислены.' : '✓ С возвращением, ' + masterNick + '!',
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
        paddingTop: '90px',
        paddingBottom: '60px',
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
          filter: 'brightness(0.3) contrast(1.25) saturate(1.1)',
          zIndex: 0,
        }}
      />

      {/* 2. Radial Vignette & Atmospheric Fog Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 45% 45%, rgba(212, 175, 55, 0.08) 0%, rgba(5, 4, 9, 0.88) 65%, #07050d 100%)',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '220px',
          background: 'linear-gradient(to top, #07050d 0%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* 3. Main Full-Scale Layout Container (Up to 1680px for 2K/4K displays) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1680px',
          width: '100%',
          padding: '0 clamp(24px, 4vw, 60px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'clamp(36px, 5vw, 80px)',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Epic Game Brand, Live Aura, Monumental Heading */}
        <div style={{ textAlign: 'left' }}>
          {/* Live Server Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 20px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.25)',
              marginBottom: '22px',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 12px #22c55e',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                color: '#FFE07D',
                fontSize: '13px',
                fontWeight: 700,
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
              margin: '0 0 18px 0',
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(38px, 5.5vw, 70px)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#ffffff',
              textShadow:
                '0 4px 30px rgba(0,0,0,0.98), 0 0 50px rgba(212, 175, 55, 0.3)',
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
              margin: '0 0 28px 0',
              maxWidth: '620px',
              fontSize: 'clamp(15px, 1.3vw, 17px)',
              lineHeight: 1.7,
              color: '#c9bba8',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}
          >
            Официальный портал темной браузерной RPG нового поколения. Создай единый аккаунт на сайте, получи свою учетную запись бойца и начни путь в Дикоземье со стартовым набором золота и кристаллов.
          </p>

          {/* Breathing Animated Character Presentation with Aura */}
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '18px',
              padding: '14px 24px',
              borderRadius: '20px',
              background: 'rgba(14, 10, 22, 0.92)',
              border: '1.5px solid rgba(96, 165, 250, 0.4)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.8), 0 0 30px rgba(96, 165, 250, 0.2)',
              marginBottom: '26px',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(96, 165, 250, 0.15)',
                border: '1.5px solid rgba(96, 165, 250, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FrostGlyph size={24} color="#60a5fa" glow />
            </motion.div>
            <div>
              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Флагманский Чемпион
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFE07D', fontFamily: "'Philosopher', serif" }}>
                Фэн Лун • Снежный Берсерк (Лед & Ци)
              </div>
            </div>
          </div>

          {/* Beasts Link */}
          <div>
            <button
              onClick={onExploreBeasts}
              style={{
                background: 'none',
                border: 'none',
                color: '#d4af37',
                fontSize: '15px',
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
              <span>Посмотреть полный бестиарий всех 5 чемпионов и их навыки →</span>
            </button>
          </div>
        </div>

        {/* Right Column: Master Account HUD Card with Border Beam & Shiny Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HudCard
            active={true}
            beamColor={isLoggedIn ? '#22c55e' : '#FFE07D'}
            style={{ width: '100%', maxWidth: '540px', padding: 'clamp(28px, 4vw, 38px)' }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                paddingBottom: '20px',
                marginBottom: '24px',
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
                    letterSpacing: '1px',
                  }}
                >
                  {isLoggedIn ? 'ИГРОВАЯ УЧЕТНАЯ ЗАПИСЬ' : 'МАСТЕР-АККАУНТ САЙТА'}
                </span>
              </div>

              {isLoggedIn && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#4ade80',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    padding: '4px 12px',
                    borderRadius: '14px',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                  }}
                >
                  ✓ Активен
                </span>
              )}
            </div>

            {/* STATE 1: ALREADY LOGGED IN -> Show Clean Game Account Details */}
            {isLoggedIn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Account Credentials Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1.5px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>Мастер-профиль:</span>
                    <strong style={{ fontSize: '16px', color: '#FFE07D' }}>{profile.playerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>Привязанный Email:</span>
                    <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{profile.accountEmail || 'Сайт-авторизация'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>Игровой UID (ID):</span>
                    <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 800 }}>
                      #{profile.guestId ? profile.guestId.slice(0, 10) : 'WILD-84920'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>Сервер входа:</span>
                    <span style={{ fontSize: '14px', color: '#4ade80', fontWeight: 700 }}>
                      {SERVER_NAME} ({SERVER_ONLINE_STRING} онлайн)
                    </span>
                  </div>
                </div>

                {/* Balance Pills */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <GoldCoinGlyph size={22} color="#f59e0b" glow />
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Золото</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b' }}>{profile.gold} G</div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(96, 165, 250, 0.12)',
                      border: '1px solid rgba(96, 165, 250, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <CrystalGlyph size={22} color="#60a5fa" glow />
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Кристаллы</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#60a5fa' }}>{profile.diamonds} C</div>
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
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <SwordGlyph size={22} color="#120d04" />
                  <span>ВОЙТИ В ИГРУ ПОД ЭТИМ АККАУНТОМ</span>
                </ShinyGoldButton>

                {/* Secondary Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button
                    onClick={onOpenCabinet}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFE07D',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Открыть полный Личный Кабинет →
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            ) : (
              /* STATE 2: NOT LOGGED IN -> Master Registration on the Site */
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Tabs: Регистрация vs Вход */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '5px',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: authMode === 'register' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                      color: authMode === 'register' ? '#FFE07D' : '#9ca3af',
                      fontSize: '13px',
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
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: authMode === 'login' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                      color: authMode === 'login' ? '#FFE07D' : '#9ca3af',
                      fontSize: '13px',
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
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GoldCoinGlyph size={18} color="#f59e0b" glow />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>+500 Золота</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CrystalGlyph size={18} color="#60a5fa" glow />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa' }}>+50 Кристаллов</span>
                    </div>
                  </div>
                )}

                {/* Inputs with high contrast and readable sizing */}
                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#b5a695', marginBottom: '6px' }}>
                      Позывной Мастера (Логин на сайте)
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Воин_Севера"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '13px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        border: '1.5px solid rgba(212, 175, 55, 0.35)',
                        color: '#f5edd8',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#b5a695', marginBottom: '6px' }}>
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
                      padding: '13px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      border: '1.5px solid rgba(212, 175, 55, 0.35)',
                      color: '#f5edd8',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#b5a695', marginBottom: '6px' }}>
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
                      padding: '13px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      border: '1.5px solid rgba(212, 175, 55, 0.35)',
                      color: '#f5edd8',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {formMsg && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: formMsg.isError ? '#f87171' : '#4ade80',
                      textAlign: 'center',
                    }}
                  >
                    {formMsg.text}
                  </div>
                )}

                {/* Submit Shiny Gold Button */}
                <ShinyGoldButton type="submit" style={{ width: '100%', marginTop: '6px' }}>
                  <ShieldGlyph size={20} color="#120d04" />
                  <span>
                    {authMode === 'register' ? 'ЗАРЕГИСТРИРОВАТЬ АККАУНТ НА САЙТЕ' : 'ВОЙТИ В МАСТЕР-АККАУНТ'}
                  </span>
                </ShinyGoldButton>

                {/* Quick Guest Alternative */}
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleGuestQuickPlay}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '13px',
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
