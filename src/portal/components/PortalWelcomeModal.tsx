import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SwordGlyph,
  ShieldGlyph,
  CrownGlyph,
  GoldCoinGlyph,
  CrystalGlyph,
} from './PortalGlyphs';
import { portalSyncBridge } from '../../services/PortalSyncBridge';
import { portalSound } from '../PortalSoundService';

interface PortalWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchGame: (heroId?: string) => void;
}

export const PortalWelcomeModal: React.FC<PortalWelcomeModalProps> = ({
  isOpen,
  onClose,
  onLaunchGame,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleFastPlay = () => {
    portalSound.playEquip();
    if (dontShowAgain) {
      localStorage.setItem('mow_welcome_dismissed', 'true');
    }
    onClose();
    onLaunchGame();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert('Пожалуйста, укажите email и пароль для привязки аккаунта.');
      return;
    }

    portalSound.playReward();
    const finalNick = nick.trim() || email.split('@')[0];

    // Grant starter bonuses via PortalSyncBridge
    portalSyncBridge.commitMutation({
      playerName: finalNick,
      isLoggedIn: true,
      accountEmail: email.trim(),
      gold: 500,
      diamonds: 50,
    });

    if (dontShowAgain) {
      localStorage.setItem('mow_welcome_dismissed', 'true');
    }

    setRegisteredSuccess(true);
    setTimeout(() => {
      onClose();
      onLaunchGame();
    }, 1200);
  };

  const handleClose = () => {
    portalSound.playClick();
    if (dontShowAgain) {
      localStorage.setItem('mow_welcome_dismissed', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(3, 2, 8, 0.88)',
          backdropFilter: 'blur(16px)',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '880px',
            backgroundColor: '#0c0914',
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15) 0%, rgba(12, 9, 20, 0.98) 75%)',
            border: '2px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '24px',
            boxShadow:
              '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(212, 175, 55, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Close Button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#d4af37',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s',
            }}
          >
            ✕
          </button>

          {/* Modal Header */}
          <div
            style={{
              padding: '36px 32px 20px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                color: '#FFE07D',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              <CrownGlyph size={15} color="#FFE07D" glow />
              <span>ВРАТА ДИКОЗЕМЬЯ • ВЫБОР ПУТИ</span>
            </div>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                fontWeight: 900,
                color: '#f5edd8',
                fontFamily: 'Cinzel, Philosopher, serif',
                letterSpacing: '1px',
                textShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
              }}
            >
              Добро Пожаловать в Masters of the Wild
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#b0a294',
                maxWidth: '620px',
                marginInline: 'auto',
                lineHeight: 1.6,
              }}
            >
              Легендарная браузерная dark-fantasy RPG. Сражайся в PvP дуэлях,
              затачивай реликвии и получай ценные трофеи. Выбери способ входа:
            </p>
          </div>

          {/* Modal Body: 2 Path Cards */}
          <div
            style={{
              padding: '28px 32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* PATH 1: Быстрый Старт / Гость */}
            <div
              style={{
                padding: '24px',
                borderRadius: '18px',
                backgroundColor: 'rgba(18, 14, 26, 0.85)',
                border: '1.5px solid rgba(96, 165, 250, 0.3)',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
                transition: 'all 0.25s',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(96, 165, 250, 0.15)',
                      border: '1px solid rgba(96, 165, 250, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SwordGlyph size={26} color="#60a5fa" glow />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#60a5fa',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Мгновенный Вход
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '20px',
                        color: '#f5edd8',
                        fontFamily: 'Cinzel, serif',
                      }}
                    >
                      Гостевой Доступ
                    </h3>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    lineHeight: 1.6,
                    margin: '0 0 16px',
                  }}
                >
                  Начни играть прямо сейчас без заполнения форм. Прогресс
                  сохраняется в локальном хранилище браузера на этом компьютере.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#d1d5db',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#4ade80' }}>✓</span> Вход в 1 клик
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#4ade80' }}>✓</span> Полный доступ ко всем аренам и квестам
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fbbf24' }}>●</span> Возможность привязать аккаунт позже
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFastPlay}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #60a5fa',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  fontFamily: 'Cinzel, sans-serif',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <SwordGlyph size={18} color="#ffffff" />
                <span>ИГРАТЬ КАК ГОСТЬ</span>
              </motion.button>
            </div>

            {/* PATH 2: Регистрация + Стартовый Бонус */}
            <div
              style={{
                padding: '24px',
                borderRadius: '18px',
                backgroundColor: 'rgba(24, 18, 30, 0.95)',
                border: '1.5px solid rgba(212, 175, 55, 0.55)',
                boxShadow:
                  '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(212, 175, 55, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.25s',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #d4af37, #aa8022)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldGlyph size={26} color="#150f04" glow />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#d4af37',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Рекомендуется
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '20px',
                        color: '#f5edd8',
                        fontFamily: 'Cinzel, serif',
                      }}
                    >
                      Создать Аккаунт
                    </h3>
                  </div>
                </div>

                {/* Starter Bonus Pill */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <GoldCoinGlyph size={15} color="#f59e0b" glow />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>
                      +500 Золота
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CrystalGlyph size={15} color="#60a5fa" glow />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#60a5fa' }}>
                      +50 Кристаллов
                    </span>
                  </div>
                </div>

                {/* Registration Form */}
                <form
                  onSubmit={handleRegister}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <input
                    type="text"
                    placeholder="Позывной героя (Никнейм)"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      color: '#f5edd8',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Ваш Email (для защиты прогресса)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      color: '#f5edd8',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="password"
                    required
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      color: '#f5edd8',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '13px',
                      marginTop: '4px',
                      borderRadius: '12px',
                      border: '1px solid #FFE07D',
                      background:
                        'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                      color: '#150f04',
                      fontSize: '13px',
                      fontWeight: 900,
                      fontFamily: 'Cinzel, sans-serif',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    {registeredSuccess
                      ? '✓ БОНУС ПОЛУЧЕН! ЗАХОДИМ...'
                      : 'СОЗДАТЬ АККАУНТ И ПОЛУЧИТЬ БОНУС'}
                  </motion.button>
                </form>
              </div>
            </div>
          </div>

          {/* Modal Footer Checkbox */}
          <div
            style={{
              padding: '14px 32px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#8c7e6f',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#d4af37' }}
              />
              <span>Больше не показывать это окно при входе</span>
            </label>

            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Пропустить и перейти к сайту
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
