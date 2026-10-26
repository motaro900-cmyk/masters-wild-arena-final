import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  // Sync profile state
  const [profile, setProfile] = useState(() => portalSyncBridge.getProfile());
  const isLoggedIn = !!profile.isLoggedIn;

  // Master Registration Form State
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [formMsg, setFormMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Subscribe to portal sync events
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

    // Commit master registration
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
      text: authMode === 'register' ? '✓ Аккаунт создан! Бонусы начислены.' : '✓ С возвращением, ' + masterNick + '!',
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
        paddingTop: '85px',
        paddingBottom: '50px',
        overflow: 'hidden',
        backgroundColor: '#07050d',
      }}
    >
      {/* Authentic Game Painted Forest Background with subtle parallax depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/images/backgrounds/bg_main.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.28) contrast(1.2)',
          transform: 'scale(1.03)',
          zIndex: 0,
        }}
      />

      {/* Atmospheric Depth Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 45% 45%, rgba(212, 175, 55, 0.08) 0%, rgba(5, 4, 9, 0.88) 70%, #07050d 100%)',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '180px',
          background: 'linear-gradient(to top, #07050d 0%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* Main Content Layout */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1280px',
          width: '100%',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Monumental Game Promo & Character Artwork */}
        <div style={{ textAlign: 'left' }}>
          {/* Live Server Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 16px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.2)',
              marginBottom: '18px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 10px #22c55e',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                color: '#FFE07D',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Сервер S1: Wild Lands • Онлайн 1,482 воина
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            style={{
              margin: '0 0 14px 0',
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(34px, 5vw, 58px)',
              fontWeight: 900,
              lineHeight: 1.12,
              color: '#ffffff',
              textShadow:
                '0 4px 25px rgba(0,0,0,0.95), 0 0 40px rgba(212, 175, 55, 0.25)',
              letterSpacing: '0.5px',
            }}
          >
            Вступи в Битву <br />
            <span
              style={{
                background:
                  'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #f59e0b 100%)',
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
              margin: '0 0 24px 0',
              maxWidth: '520px',
              fontSize: '15px',
              lineHeight: 1.65,
              color: '#c4b5a2',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            Браузерная темная RPG нового поколения. Создай единый аккаунт на сайте, получи свою учетную запись воина и начни путь в Дикоземье с эксклюзивным набором первопроходца.
          </p>

          {/* Character Showcase Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              padding: '10px 18px',
              borderRadius: '14px',
              background: 'rgba(12, 9, 18, 0.85)',
              border: '1px solid rgba(96, 165, 250, 0.35)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.7)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(96, 165, 250, 0.15)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FrostGlyph size={18} color="#60a5fa" glow />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase' }}>
                Флагманский Герой
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFE07D', fontFamily: "'Philosopher', serif" }}>
                Фэн Лун • Снежный Берсерк
              </div>
            </div>
          </div>

          {/* Quick Codex Link */}
          <div>
            <button
              onClick={onExploreBeasts}
              style={{
                background: 'none',
                border: 'none',
                color: '#d4af37',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              <CrownGlyph size={14} color="#d4af37" />
              <span>Посмотреть бестиарий всех 5 героев и их навыки →</span>
            </button>
          </div>
        </div>

        {/* Right Column: Master Account Gate (Сначала регистрация на сайте, затем учетка) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#0c0914',
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.14) 0%, rgba(12, 9, 20, 0.98) 75%)',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '20px',
              boxShadow:
                '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.15)',
              padding: '28px 24px',
              position: 'relative',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldGlyph size={22} color="#FFE07D" glow />
                <span
                  style={{
                    fontFamily: "'Philosopher', serif",
                    fontSize: '18px',
                    fontWeight: 800,
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
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#4ade80',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  ✓ Активен
                </span>
              )}
            </div>

            {/* STATE 1: ALREADY LOGGED IN -> Show Clean Game Account Details */}
            {isLoggedIn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Account Credentials Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Мастер-профиль:</span>
                    <strong style={{ fontSize: '14px', color: '#FFE07D' }}>{profile.playerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Привязанный Email:</span>
                    <span style={{ fontSize: '12px', color: '#e5e7eb' }}>{profile.accountEmail || 'Сайт-авторизация'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Игровой UID (ID):</span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>
                      #{profile.guestId ? profile.guestId.slice(0, 10) : 'WILD-84920'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Сервер входа:</span>
                    <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>S1: Wild Lands (Онлайн: 1,482)</span>
                  </div>
                </div>

                {/* Balance Pills */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <GoldCoinGlyph size={18} color="#f59e0b" glow />
                    <div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>Золото</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>{profile.gold} G</div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <CrystalGlyph size={18} color="#60a5fa" glow />
                    <div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>Кристаллы</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa' }}>{profile.diamonds} C</div>
                    </div>
                  </div>
                </div>

                {/* MASTER ACTION BUTTON: ВОЙТИ В ИГРУ ПОД ЭТИМ АККАУНТОМ */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    proceduralAudio.playDuelHorn();
                    portalSound.playEquip();
                    onLaunchGame();
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1.5px solid #FFE07D',
                    background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                    color: '#120d04',
                    fontSize: '15px',
                    fontWeight: 900,
                    fontFamily: "'Philosopher', serif",
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(212, 175, 55, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '4px',
                  }}
                >
                  <SwordGlyph size={20} color="#120d04" />
                  <span>ВОЙТИ В ИГРУ ПОД ЭТИМ АККАУНТОМ</span>
                </motion.button>

                {/* Secondary Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <button
                    onClick={onOpenCabinet}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFE07D',
                      fontSize: '12px',
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
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            ) : (
              /* STATE 2: NOT LOGGED IN -> Master Registration on the Site */
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Tabs: Регистрация vs Вход */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: authMode === 'register' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                      color: authMode === 'register' ? '#FFE07D' : '#9ca3af',
                      fontSize: '12px',
                      fontWeight: 700,
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
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: authMode === 'login' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                      color: authMode === 'login' ? '#FFE07D' : '#9ca3af',
                      fontSize: '12px',
                      fontWeight: 700,
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
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GoldCoinGlyph size={16} color="#f59e0b" glow />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>+500 Золота</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CrystalGlyph size={16} color="#60a5fa" glow />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#60a5fa' }}>+50 Кристаллов</span>
                    </div>
                  </div>
                )}

                {/* Inputs */}
                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#a69a89', marginBottom: '5px' }}>
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
                        padding: '11px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#f5edd8',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#a69a89', marginBottom: '5px' }}>
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
                      padding: '11px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: '#f5edd8',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#a69a89', marginBottom: '5px' }}>
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
                      padding: '11px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: '#f5edd8',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                {formMsg && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: formMsg.isError ? '#f87171' : '#4ade80',
                      textAlign: 'center',
                    }}
                  >
                    {formMsg.text}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px solid #FFE07D',
                    background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                    color: '#120d04',
                    fontSize: '14px',
                    fontWeight: 900,
                    fontFamily: "'Philosopher', serif",
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 6px 25px rgba(212, 175, 55, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                >
                  <ShieldGlyph size={18} color="#120d04" />
                  <span>
                    {authMode === 'register' ? 'ЗАРЕГИСТРИРОВАТЬ АККАУНТ НА САЙТЕ' : 'ВОЙТИ В МАСТЕР-АККАУНТ'}
                  </span>
                </motion.button>

                {/* Quick Guest Alternative */}
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleGuestQuickPlay}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Или зайти сразу как гость без сохранения на сервере →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
