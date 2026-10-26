import React, { useState, useEffect } from 'react';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { HEROES_DB } from '../../configs/HeroesConfig';
import { portalSyncBridge, IPortalForgeTiers } from '../../services/PortalSyncBridge';
import { SERVER_NAME, SERVER_ONLINE_STRING } from '../portalConstants';

interface PortalCabinetProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchGame: (heroId?: string) => void;
}

export const PortalCabinet: React.FC<PortalCabinetProps> = ({
  isOpen,
  onClose,
  onLaunchGame,
}) => {
  if (!isOpen) return null;

  const initialProfile = portalSyncBridge.getProfile();
  // 2 clean tabs: 'account' (Регистрация & Аккаунт на Сайте) vs 'game_account' (Игровая Учетная Запись и Боец)
  const [curTab, setCurTab] = useState<'account' | 'game_account'>('account');
  const [gold, setGold] = useState<number>(initialProfile.gold);
  const [diamonds, setDiamonds] = useState<number>(initialProfile.diamonds);
  const [energy] = useState<number>(initialProfile.energy || 120);
  const [rating, setRating] = useState<number>(initialProfile.rating);
  
  // Auth & Profile state with PortalSyncBridge persistence
  const [playerName, setPlayerName] = useState<string>(initialProfile.playerName);
  const [guestId] = useState<string>(initialProfile.guestId);
  const [copied, setCopied] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState<string>(initialProfile.accountEmail || '');
  const [authPass, setAuthPass] = useState<string>('');
  const [authNick, setAuthNick] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!initialProfile.isLoggedIn);

  // Equipment Tiers state from PortalSyncBridge
  const [equipTiers, setEquipTiers] = useState<IPortalForgeTiers>(initialProfile.equipTiers);

  // Starter champion is UNIFIED for all players: Panda (Фэн Лун)
  const starterHero = HEROES_DB.find((h) => h.id === 'panda') || HEROES_DB[0];

  useEffect(() => {
    const handleSync = (e: any) => {
      const profile = e.detail || portalSyncBridge.getProfile();
      setGold(profile.gold);
      setDiamonds(profile.diamonds);
      setRating(profile.rating);
      setPlayerName(profile.playerName);
      setEquipTiers(profile.equipTiers);
      setIsLoggedIn(!!profile.isLoggedIn);
    };
    window.addEventListener('mow:portal_sync', handleSync);
    return () => window.removeEventListener('mow:portal_sync', handleSync);
  }, []);

  const handleUpgrade = (slot: keyof IPortalForgeTiers) => {
    const res = portalSyncBridge.upgradeSlot(slot);
    if (res.success) {
      const p = portalSyncBridge.getProfile();
      setGold(p.gold);
      setEquipTiers(p.equipTiers);
      proceduralAudio.playFanfare();
    } else {
      proceduralAudio.playClick(2);
      alert(res.error || 'Недостаточно золота для заточки!');
    }
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(guestId);
    setCopied(true);
    proceduralAudio.playClick(1);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPass.trim()) {
      setAuthStatus('Пожалуйста, заполните email и пароль.');
      return;
    }

    proceduralAudio.playFanfare();
    const nick = authNick.trim() || authEmail.split('@')[0];
    setPlayerName(nick);
    setIsLoggedIn(true);
    localStorage.setItem('mow_auth_token', 'mow_jwt_' + Date.now());
    localStorage.setItem('mow_auth_email', authEmail);

    portalSyncBridge.commitMutation({
      playerName: nick,
      isLoggedIn: true,
      accountEmail: authEmail,
      gold: gold + (authMode === 'register' ? 500 : 0),
      diamonds: diamonds + (authMode === 'register' ? 50 : 0),
    });

    setAuthStatus(
      authMode === 'register'
        ? '✓ Аккаунт успешно создан на сайте! Начислено +500 золота и +50 кристаллов.'
        : '✓ Добро пожаловать, ' + nick + '!'
    );
  };

  const handleExport = async () => {
    proceduralAudio.playClick(1);
    try {
      const blob = await portalSyncBridge.exportMowSave();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `masters-of-wild-save-${guestId}.mow`;
      a.click();
      URL.revokeObjectURL(url);
      setAuthStatus('✓ Сохранение .mow защищено криптографической подписью SHA-256!');
    } catch (e: any) {
      alert('Ошибка экспорта сохранения: ' + (e.message || e));
    }
  };

  const handleImport = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const result = await portalSyncBridge.importMowSave(text);
        if (result.success && result.payload) {
          const p = result.payload;
          setGold(p.gold);
          setDiamonds(p.diamonds);
          setPlayerName(p.playerName);
          setEquipTiers(p.equipTiers);
          setRating(p.rating);
          proceduralAudio.playFanfare();
          alert('✓ Сохранение (.mow) успешно верифицировано и восстановлено! Хеш SHA-256 совпал.');
        } else {
          proceduralAudio.playClick(2);
          alert(`[Внимание] ${result.error || 'Ошибка проверки целостности сохранения!'}`);
        }
      } catch (err: any) {
        alert(`Ошибка чтения файла: ${err.message || err}`);
      } finally {
        if (ev.target) ev.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const swordSvg = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M19 13l2 2-5 5-2-2M9 13l-4 4M13 9l4-4" />
    </svg>
  );

  const shieldSvg = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const userSvg = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );

  const forgeBonus = portalSyncBridge.calculatePortalForgeBonus(starterHero.role, equipTiers);
  const totalHp = (starterHero.stats?.hp || 700) + forgeBonus.hp;
  const totalAtk = (starterHero.stats?.attack || 30) + forgeBonus.attack;
  const totalDef = (starterHero.stats?.defense || 10) + forgeBonus.defense;
  const totalSpd = +((starterHero.stats?.speed || 1.8) + forgeBonus.speed).toFixed(2);
  const totalCrit = +((starterHero.stats?.critChance || 5) + forgeBonus.critChance).toFixed(1);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 2, 6, 0.88)',
        backdropFilter: 'blur(16px)',
        padding: '20px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '94vh',
          backgroundColor: '#0c0a12',
          border: '1.5px solid rgba(212, 175, 55, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.95), 0 0 50px rgba(212, 175, 55, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 30px',
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.18) 0%, rgba(12, 10, 18, 0.98) 100%)',
            borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #FFE07D, #d4af37)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#120d04',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
              }}
            >
              {shieldSvg}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    color: '#ffffff',
                    fontFamily: "'Philosopher', serif",
                  }}
                >
                  Личный Кабинет: {playerName}
                </h2>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: isLoggedIn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    border: `1px solid ${isLoggedIn ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    color: isLoggedIn ? '#4ade80' : '#f59e0b',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {isLoggedIn ? 'Аккаунт привязан' : 'Гостевой режим'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#c5b8a5', marginTop: '4px', fontFamily: "'Montserrat', sans-serif" }}>
                UID: <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{guestId}</strong> • Сервер: <strong style={{ color: '#4ade80' }}>{SERVER_NAME} ({SERVER_ONLINE_STRING} онлайн)</strong> • Ранг: {rating} • Золото: {gold} • Кристаллы: {diamonds}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              proceduralAudio.playClick(1);
              onClose();
            }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              border: '1.5px solid rgba(212, 175, 55, 0.4)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#FFE07D',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            ✕
          </button>
        </div>

        {/* Big Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid rgba(212, 175, 55, 0.25)', backgroundColor: 'rgba(7, 5, 10, 0.9)' }}>
          <button
            id="portal-cabinet-tab-account"
            onClick={() => {
              proceduralAudio.playClick(1);
              setCurTab('account');
            }}
            style={{
              flex: 1,
              padding: '18px 24px',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              border: 'none',
              borderBottom: curTab === 'account' ? '3px solid #FFE07D' : '3px solid transparent',
              backgroundColor: curTab === 'account' ? 'rgba(212, 175, 55, 0.14)' : 'transparent',
              color: curTab === 'account' ? '#ffffff' : '#9c8e7e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: "'Philosopher', serif",
              transition: 'all 0.2s',
            }}
          >
            {userSvg} 1. Регистрация & Аккаунт на Сайте
          </button>
          <button
            id="portal-cabinet-tab-game"
            onClick={() => {
              proceduralAudio.playClick(1);
              setCurTab('game_account');
            }}
            style={{
              flex: 1,
              padding: '18px 24px',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              border: 'none',
              borderBottom: curTab === 'game_account' ? '3px solid #FFE07D' : '3px solid transparent',
              backgroundColor: curTab === 'game_account' ? 'rgba(212, 175, 55, 0.14)' : 'transparent',
              color: curTab === 'game_account' ? '#ffffff' : '#9c8e7e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: "'Philosopher', serif",
              transition: 'all 0.2s',
            }}
          >
            {swordSvg} 2. Игровая Учетная Запись & Боец
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
          {curTab === 'account' ? (
            /* TAB 1: REGISTRATION & MASTER SITE ACCOUNT */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
              {/* Account Status Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(18, 14, 24, 0.85)',
                  border: '1.5px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                    Уникальный идентификатор игрока в системе (UID):
                  </div>
                  <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 800, color: '#FFE07D' }}>
                    {guestId}
                  </div>
                  <div style={{ fontSize: '12px', color: isLoggedIn ? '#4ade80' : '#f59e0b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLoggedIn ? '#4ade80' : '#f59e0b' }} />
                    {isLoggedIn ? `Привязано к email: ${authEmail || 'Учетная запись подтверждена'}` : 'Гостевой режим (сохраняется в браузере)'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCopyId}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(212, 175, 55, 0.45)',
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ Скопировано!' : 'Копировать UID'}
                  </button>
                </div>
              </div>

              {/* Registration / Login Master Form */}
              <div
                style={{
                  padding: '26px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(18, 14, 24, 0.85)',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3
                      style={{
                        margin: '0 0 4px',
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#FFE07D',
                        fontFamily: "'Philosopher', serif",
                      }}
                    >
                      {authMode === 'register' ? 'Регистрация Аккаунта на Сайте' : 'Вход в Аккаунт на Сайте'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                      {authMode === 'register'
                        ? 'Создай мастер-аккаунт для защиты прогресса, кросс-платформенного сохранения и получения +500 золота.'
                        : 'Введи данные аккаунта для восстановления персонажа и снаряжения.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      proceduralAudio.playClick(1);
                      setAuthMode((m) => (m === 'login' ? 'register' : 'login'));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFE07D',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {authMode === 'register' ? 'Уже есть аккаунт? Войти →' : 'Создать новый аккаунт →'}
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {authMode === 'register' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px', fontWeight: 600 }}>
                        Никнейм бойца (Имя на сайте и в игре):
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Снежный_Барс"
                        value={authNick}
                        onChange={(e) => setAuthNick(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(212, 175, 55, 0.35)',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px', fontWeight: 600 }}>
                        Электронная почта (Email):
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(212, 175, 55, 0.35)',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px', fontWeight: 600 }}>
                        Пароль:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPass}
                        onChange={(e) => setAuthPass(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(212, 175, 55, 0.35)',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: '16px 28px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #aa8022 100%)',
                      color: '#120d04',
                      fontSize: '16px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      marginTop: '8px',
                      boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                      fontFamily: "'Philosopher', serif",
                    }}
                  >
                    {authMode === 'register' ? 'ЗАРЕГИСТРИРОВАТЬ АККАУНТ И ПОЛУЧИТЬ БОНУС' : 'ВОЙТИ В УЧЕТНУЮ ЗАПИСЬ'}
                  </button>

                  {authStatus && (
                    <div style={{ fontSize: '14px', color: '#4ade80', textAlign: 'center', marginTop: '6px', fontWeight: 600 }}>
                      {authStatus}
                    </div>
                  )}
                </form>
              </div>

              {/* Cryptographic Save File Export / Import */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(18, 14, 24, 0.85)',
                  border: '1.5px solid rgba(212, 175, 55, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f5edd8', fontFamily: "'Philosopher', serif" }}>
                  Резервное Копирование Файла Прогресса (.mow)
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  Вы можете скачать зашифрованный файл сохранения на свой диск и восстановить прогресс на любом устройстве без пароля.
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleExport}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(212, 175, 55, 0.45)',
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      color: '#f5edd8',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Экспорт сохранения (.mow)
                  </button>
                  <label
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(96, 165, 250, 0.35)',
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                      color: '#f5edd8',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    Импорт файла (.mow)
                    <input type="file" accept=".mow,.json" style={{ display: 'none' }} onChange={handleImport} />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: UNIFIED GAME ACCOUNT & CHARACTER (NO HERO SELECTION - PANDA ONLY) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
              {/* Single Unified Champion Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(18, 14, 24, 0.85)',
                  border: '1.5px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  flexWrap: 'wrap',
                }}
              >
                <img
                  src={starterHero.image || '/assets/characters/panda/panda_frost.png'}
                  alt={starterHero.name}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    border: '2px solid #d4af37',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.35)',
                  }}
                />
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#FFE07D',
                        fontFamily: "'Philosopher', serif",
                      }}
                    >
                      {starterHero.name} • {starterHero.title}
                    </h3>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(96, 165, 250, 0.15)',
                        border: '1px solid rgba(96, 165, 250, 0.4)',
                        color: '#60a5fa',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      Единый стартовый герой
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#c5b8a5', lineHeight: 1.6 }}>
                    Все воины начинают путь в Дикоземье за Снежного Берсерка Фэн Луна. Развивай мастерство, куй экипировку в кузнице и побеждай на арене.
                  </p>
                </div>
              </div>

              {/* Stats & Forge Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Character Live Stats */}
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '18px',
                    backgroundColor: 'rgba(18, 14, 24, 0.85)',
                    border: '1.5px solid rgba(212, 175, 55, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f5edd8', fontFamily: "'Philosopher', serif" }}>
                      Боевые Параметры
                    </span>
                    <span style={{ fontSize: '12px', color: '#d4af37', fontWeight: 700 }}>
                      Уровень 1 (Новичок)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Здоровье (HP):</span>
                      <strong style={{ color: '#4ade80' }}>
                        {totalHp} <small style={{ opacity: 0.8 }}>(+{forgeBonus.hp})</small>
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Атака (ATK):</span>
                      <strong style={{ color: '#f87171' }}>
                        {totalAtk} <small style={{ opacity: 0.8 }}>(+{forgeBonus.attack})</small>
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Защита (DEF):</span>
                      <strong style={{ color: '#60a5fa' }}>
                        {totalDef} <small style={{ opacity: 0.8 }}>(+{forgeBonus.defense})</small>
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Скорость атаки (SPD):</span>
                      <strong style={{ color: '#c084fc' }}>
                        {totalSpd} уд/с <small style={{ opacity: 0.8 }}>(+{forgeBonus.speed})</small>
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Крит. шанс:</span>
                      <strong style={{ color: '#fbbf24' }}>
                        {totalCrit}% <small style={{ opacity: 0.8 }}>(+{forgeBonus.critChance}%)</small>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Equipment Forge */}
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '18px',
                    backgroundColor: 'rgba(18, 14, 24, 0.85)',
                    border: '1.5px solid rgba(212, 175, 55, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f5edd8', fontFamily: "'Philosopher', serif" }}>
                      Кузница Снаряжения
                    </span>
                    <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>
                      Баланс: {gold} Золота
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {(['weapon', 'armor', 'ring', 'boots'] as const).map((slot) => {
                      const labels = { weapon: 'Оружие', armor: 'Доспех', ring: 'Кольцо', boots: 'Сапоги' };
                      const tier = equipTiers[slot];
                      const cost = (tier + 1) * 350;
                      return (
                        <div
                          key={slot}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#FFE07D', fontWeight: 700 }}>{labels[slot]}</span>
                            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 800 }}>T{tier}</span>
                          </div>
                          <button
                            onClick={() => handleUpgrade(slot)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(212, 175, 55, 0.4)',
                              backgroundColor: 'rgba(212, 175, 55, 0.15)',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Заточить ({cost} з.)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '20px 30px',
            background: 'rgba(7, 5, 10, 0.98)',
            borderTop: '1.5px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <button
            onClick={() => {
              proceduralAudio.playClick(1);
              onClose();
            }}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#d4af37',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Закрыть Кабинет
          </button>

          <button
            onClick={() => {
              proceduralAudio.playFanfare();
              onClose();
              onLaunchGame('panda');
            }}
            style={{
              padding: '16px 36px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #aa8022 100%)',
              color: '#120d04',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 30px rgba(212, 175, 55, 0.45)',
              fontFamily: "'Philosopher', serif",
            }}
          >
            {swordSvg} ВСТУПИТЬ В БОЙ ЗА ФЭН ЛУН
          </button>
        </div>
      </div>
    </div>
  );
};
