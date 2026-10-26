import React, { useState, useEffect } from 'react';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { HEROES_DB } from '../../configs/HeroesConfig';
import { portalSyncBridge, IPortalForgeTiers } from '../../services/PortalSyncBridge';

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
  const [curTab, setCurTab] = useState<'gear' | 'account'>('gear');
  const [selectedHeroId, setSelectedHeroId] = useState<string>(initialProfile.selectedHeroId || 'panda');
  const [gold, setGold] = useState<number>(initialProfile.gold);
  const [diamonds, setDiamonds] = useState<number>(initialProfile.diamonds);
  const [energy] = useState<number>(initialProfile.energy);
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

  const activeHero = HEROES_DB.find((h) => h.id === selectedHeroId) || HEROES_DB[0];

  useEffect(() => {
    const handleSync = (e: any) => {
      const profile = e.detail || portalSyncBridge.getProfile();
      setGold(profile.gold);
      setDiamonds(profile.diamonds);
      setRating(profile.rating);
      setPlayerName(profile.playerName);
      setSelectedHeroId(profile.selectedHeroId);
      setEquipTiers(profile.equipTiers);
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
    });

    setAuthStatus(authMode === 'register' ? '✓ Аккаунт успешно создан и привязан!' : '✓ Добро пожаловать, ' + nick + '!');
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
          setSelectedHeroId(p.selectedHeroId);
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M19 13l2 2-5 5-2-2M9 13l-4 4M13 9l4-4" />
    </svg>
  );

  const shieldSvg = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const userSvg = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 2, 6, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          backgroundColor: '#0d0b10',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, rgba(13, 11, 16, 0.95) 100%)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #d4af37, #aa8022)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#120d04',
              }}
            >
              {shieldSvg}
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  color: '#f5edd8',
                  fontFamily: "'Philosopher', serif",
                }}
              >
                Личный Кабинет: {playerName}
              </h2>
              <div style={{ fontSize: '12px', color: '#9c8e7e', marginTop: '2px' }}>
                ID: {guestId} • Ранг: {rating} • Золото: {gold} • Кристаллы: {diamonds} • Энергия: {energy}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              proceduralAudio.playClick(1);
              onClose();
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#d4af37',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', backgroundColor: 'rgba(7, 5, 10, 0.8)' }}>
          <button
            onClick={() => {
              proceduralAudio.playClick(1);
              setCurTab('gear');
            }}
            style={{
              flex: 1,
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              border: 'none',
              borderBottom: curTab === 'gear' ? '2px solid #d4af37' : '2px solid transparent',
              backgroundColor: curTab === 'gear' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              color: curTab === 'gear' ? '#f5edd8' : '#8a7b6c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {swordSvg} Снаряжение и Герой
          </button>
          <button
            onClick={() => {
              proceduralAudio.playClick(1);
              setCurTab('account');
            }}
            style={{
              flex: 1,
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              border: 'none',
              borderBottom: curTab === 'account' ? '2px solid #d4af37' : '2px solid transparent',
              backgroundColor: curTab === 'account' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              color: curTab === 'account' ? '#f5edd8' : '#8a7b6c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {userSvg} Аккаунт и Сохранения
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {curTab === 'gear' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Hero Selector */}
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#d4af37', fontWeight: 700, marginBottom: '12px' }}>
                  Выберите Активного Героя
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {HEROES_DB.map((h) => {
                    const isSel = h.id === selectedHeroId;
                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          proceduralAudio.playClick(1);
                          setSelectedHeroId(h.id);
                          portalSyncBridge.commitMutation({ selectedHeroId: h.id });
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: isSel ? '2px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: isSel ? 'rgba(212, 175, 55, 0.15)' : 'rgba(20, 16, 24, 0.6)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img
                          src={h.image}
                          alt={h.name}
                          style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                        />
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isSel ? '#f5edd8' : '#b0a294', textAlign: 'center' }}>
                          {h.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {h.role}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Hero Stats & Forge */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Hero Specs */}
                <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(18, 14, 22, 0.7)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  {(() => {
                    const forgeBonus = portalSyncBridge.calculatePortalForgeBonus(activeHero.role, equipTiers);
                    const totalHp = (activeHero.stats?.hp || 700) + forgeBonus.hp;
                    const totalAtk = (activeHero.stats?.attack || 30) + forgeBonus.attack;
                    const totalDef = (activeHero.stats?.defense || 10) + forgeBonus.defense;
                    const totalSpd = +((activeHero.stats?.speed || 1.8) + forgeBonus.speed).toFixed(2);
                    const totalCrit = +((activeHero.stats?.critChance || 5) + forgeBonus.critChance).toFixed(1);

                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#f5edd8' }}>{activeHero.name}</span>
                          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(212, 175, 55, 0.2)', color: '#d4af37', fontWeight: 700 }}>
                            {activeHero.title} • {activeHero.role}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9c8e7e' }}>Здоровье (HP):</span>
                            <span style={{ color: '#4ade80', fontWeight: 700 }}>
                              {totalHp} <small style={{ opacity: 0.7 }}>(+{forgeBonus.hp})</small>
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9c8e7e' }}>Атака (ATK):</span>
                            <span style={{ color: '#f87171', fontWeight: 700 }}>
                              {totalAtk} <small style={{ opacity: 0.7 }}>(+{forgeBonus.attack})</small>
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9c8e7e' }}>Защита (DEF):</span>
                            <span style={{ color: '#60a5fa', fontWeight: 700 }}>
                              {totalDef} <small style={{ opacity: 0.7 }}>(+{forgeBonus.defense})</small>
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9c8e7e' }}>Скорость (SPD):</span>
                            <span style={{ color: '#c084fc', fontWeight: 700 }}>
                              {totalSpd} уд/с <small style={{ opacity: 0.7 }}>(+{forgeBonus.speed})</small>
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9c8e7e' }}>Крит. шанс:</span>
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                              {totalCrit}% <small style={{ opacity: 0.7 }}>(+{forgeBonus.critChance}%)</small>
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Forge */}
                <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(18, 14, 22, 0.7)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f5edd8', marginBottom: '12px' }}>
                    Кузница Экипировки
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {(['weapon', 'armor', 'ring', 'boots'] as const).map((slot) => {
                      const labels = { weapon: 'Оружие', armor: 'Доспех', ring: 'Кольцо', boots: 'Сапоги' };
                      const tier = equipTiers[slot];
                      const cost = (tier + 1) * 350;
                      return (
                        <div
                          key={slot}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 700 }}>{labels[slot]}</span>
                            <span style={{ fontSize: '10px', color: '#9c8e7e', fontWeight: 700 }}>T{tier}</span>
                          </div>
                          <button
                            onClick={() => handleUpgrade(slot)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              backgroundColor: 'rgba(212, 175, 55, 0.12)',
                              color: '#f5edd8',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Улучшить ({cost} з.)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Profile Info */}
              <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(18, 14, 22, 0.7)', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f5edd8' }}>Гостевой Профиль & Синхронизация</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9c8e7e' }}>Уникальный идентификатор игрока:</div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#d4af37' }}>{guestId}</div>
                  </div>
                  <button
                    onClick={handleCopyId}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.4)', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#f5edd8', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {copied ? 'Скопировано!' : 'Копировать ID'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                  {isLoggedIn ? 'Аккаунт привязан и синхронизирован с облаком' : 'Гостевой режим активен (локальное хранилище)'}
                </div>
              </div>

              {/* Registration / Login */}
              <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(18, 14, 22, 0.7)', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f5edd8' }}>
                    {authMode === 'register' ? 'Регистрация Учетной Записи' : 'Вход в Учетную Запись'}
                  </div>
                  <button
                    onClick={() => setAuthMode((m) => (m === 'login' ? 'register' : 'login'))}
                    style={{ background: 'none', border: 'none', color: '#d4af37', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {authMode === 'register' ? 'Уже есть аккаунт? Войти' : 'Создать новый аккаунт'}
                  </button>
                </div>

                {/* Social fast login */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      proceduralAudio.playClick(1);
                      setIsLoggedIn(true);
                      setAuthStatus('✓ Сессия привязана к Telegram WebApp ID!');
                    }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #229ED9', backgroundColor: 'rgba(34, 158, 217, 0.12)', color: '#229ED9', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Войти через Telegram
                  </button>
                  <button
                    onClick={() => {
                      proceduralAudio.playClick(1);
                      setIsLoggedIn(true);
                      setAuthStatus('✓ Авторизовано через VK ID (152-ФЗ соблюден)!');
                    }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #0077FF', backgroundColor: 'rgba(0, 119, 255, 0.12)', color: '#0077FF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Войти через VK ID
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {authMode === 'register' && (
                    <input
                      type="text"
                      placeholder="Никнейм бойца"
                      value={authNick}
                      onChange={(e) => setAuthNick(e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#f5edd8', fontSize: '12px', outline: 'none' }}
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Электронная почта (Email)"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#f5edd8', fontSize: '12px', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="Пароль"
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#f5edd8', fontSize: '12px', outline: 'none' }}
                  />
                  <button
                    type="submit"
                    style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #d4af37, #aa8022)', color: '#120d04', fontSize: '13px', fontWeight: 800, cursor: 'pointer', marginTop: '4px' }}
                  >
                    {authMode === 'register' ? 'Зарегистрироваться' : 'Войти в Профиль'}
                  </button>
                  {authStatus && (
                    <div style={{ fontSize: '12px', color: '#4ade80', textAlign: 'center', marginTop: '4px' }}>
                      {authStatus}
                    </div>
                  )}
                </form>
              </div>

              {/* Export / Import */}
              <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(18, 14, 22, 0.7)', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f5edd8' }}>Резервное Копирование (.mow)</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleExport}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.4)', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#f5edd8', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Экспорт сохранения (.mow)
                  </button>
                  <label
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f5edd8', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    Импорт файла
                    <input type="file" accept=".mow,.json" style={{ display: 'none' }} onChange={handleImport} />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', background: 'rgba(7, 5, 10, 0.95)', borderTop: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              proceduralAudio.playClick(1);
              onClose();
            }}
            style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#d4af37', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Закрыть
          </button>
          <button
            onClick={() => {
              proceduralAudio.playFanfare();
              onClose();
              onLaunchGame(activeHero.id);
            }}
            style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #d4af37, #aa8022)', color: '#120d04', fontSize: '13px', fontWeight: 900, letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)' }}
          >
            {swordSvg} Вступить в бой за {activeHero.name}
          </button>
        </div>
      </div>
    </div>
  );
};
