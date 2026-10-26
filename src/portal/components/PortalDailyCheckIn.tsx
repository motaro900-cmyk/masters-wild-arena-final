/**
 * PORTAL DAILY CHECK-IN (Благословение Леса: Ежедневный Календарь Наград)
 * 7-дневный прогрессивный веб-календарь с начислением золота, кристаллов
 * и редких предметов непосредственно в игровой профиль useGameStore.
 * Полностью векторный интерфейс без Unicode-эмодзи в стандартах Diablo IV / PoE.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { portalSound } from '../PortalSoundService';
import { portalSyncBridge } from '../../services/PortalSyncBridge';
import {
  GoldCoinGlyph,
  CrystalGlyph,
  HerbGlyph,
  PotionGlyph,
  ScrollGlyph,
  OrbGlyph,
  ShieldGlyph,
  ChestGlyph,
} from './PortalGlyphs';

export interface ICheckInDay {
  day: number;
  title: string;
  glyphType: 'herb' | 'potion' | 'crystal' | 'scroll' | 'orb' | 'shield' | 'chest';
  gold: number;
  crystals: number;
  itemDesc?: string;
  isSuper?: boolean;
}

export const CHECK_IN_DAYS: ICheckInDay[] = [
  { day: 1, title: 'День 1', glyphType: 'herb', gold: 100, crystals: 0, itemDesc: '10x Трав' },
  { day: 2, title: 'День 2', glyphType: 'potion', gold: 250, crystals: 0, itemDesc: 'Малое Зелье' },
  { day: 3, title: 'День 3', glyphType: 'crystal', gold: 500, crystals: 15, itemDesc: '+15 Кристаллов' },
  { day: 4, title: 'День 4', glyphType: 'scroll', gold: 750, crystals: 0, itemDesc: 'Свиток Опыта' },
  { day: 5, title: 'День 5', glyphType: 'orb', gold: 1000, crystals: 25, itemDesc: '+25 Кристаллов' },
  { day: 6, title: 'День 6', glyphType: 'shield', gold: 1500, crystals: 0, itemDesc: 'Амулет Стойкости' },
  { day: 7, title: 'День 7', glyphType: 'chest', gold: 3000, crystals: 100, itemDesc: 'Сундук Чемпиона', isSuper: true },
];

export const PortalDailyCheckIn: React.FC = () => {
  const [streak, setStreak] = useState(1);
  const [canClaim, setCanClaim] = useState(true);
  const [claimedToday, setClaimedToday] = useState(false);
  const [feedback, setFeedback] = useState<{ gold: number; crystals: number } | null>(null);

  useEffect(() => {
    const savedStreak = parseInt(localStorage.getItem('wild_portal_checkin_streak') || '1', 10);
    const lastDate = localStorage.getItem('wild_portal_last_checkin_date');
    const todayStr = new Date().toDateString();

    setStreak(savedStreak > 7 ? 1 : savedStreak);

    if (lastDate === todayStr) {
      setCanClaim(false);
      setClaimedToday(true);
    } else {
      setCanClaim(true);
      setClaimedToday(false);
    }
  }, []);

  const handleClaim = () => {
    if (!canClaim) return;

    portalSound.playReward();
    const currentReward = CHECK_IN_DAYS[(streak - 1) % CHECK_IN_DAYS.length];

    const profile = portalSyncBridge.getProfile();
    const todayStr = new Date().toDateString();
    const nextStreak = streak >= 7 ? 1 : streak + 1;

    portalSyncBridge.commitMutation({
      gold: profile.gold + currentReward.gold,
      diamonds: profile.diamonds + currentReward.crystals,
      lastDailyCheckinDate: todayStr,
      dailyCheckinStreak: nextStreak,
    });

    localStorage.setItem('wild_portal_last_checkin_date', todayStr);
    localStorage.setItem('wild_portal_checkin_streak', nextStreak.toString());

    setCanClaim(false);
    setClaimedToday(true);
    setFeedback({ gold: currentReward.gold, crystals: currentReward.crystals });

    setTimeout(() => setFeedback(null), 6000);
  };

  const renderGlyph = (type: ICheckInDay['glyphType'], isCurrent: boolean, isPast: boolean) => {
    const glow = isCurrent;
    switch (type) {
      case 'herb':
        return <HerbGlyph size={36} color={isPast ? '#4b5563' : '#34d399'} glow={glow} />;
      case 'potion':
        return <PotionGlyph size={36} color={isPast ? '#4b5563' : '#c084fc'} glow={glow} />;
      case 'crystal':
        return <CrystalGlyph size={36} color={isPast ? '#4b5563' : '#38bdf8'} glow={glow} />;
      case 'scroll':
        return <ScrollGlyph size={36} color={isPast ? '#4b5563' : '#fbbf24'} glow={glow} />;
      case 'orb':
        return <OrbGlyph size={36} color={isPast ? '#4b5563' : '#a855f7'} glow={glow} />;
      case 'shield':
        return <ShieldGlyph size={36} color={isPast ? '#4b5563' : '#60a5fa'} glow={glow} />;
      case 'chest':
        return <ChestGlyph size={42} color={isPast ? '#4b5563' : '#f59e0b'} glow={glow} />;
    }
  };

  return (
    <section
      id="rewards"
      style={{
        position: 'relative',
        padding: '110px 24px',
        backgroundColor: '#07050a',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '55px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '2.5px',
              color: '#d4af37',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            <GoldCoinGlyph size={14} color="#d4af37" />
            СВЯТИЛИЩЕ ПРЕДКОВ
          </div>
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '44px',
              fontWeight: 900,
              fontFamily: "'Cinzel', 'Philosopher', serif",
              color: '#f5edd8',
              letterSpacing: '2px',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
            }}
          >
            Благословение Первозданного Леса
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#a39582', maxWidth: '640px', marginInline: 'auto', lineHeight: 1.6 }}>
            Входите в игру каждый день, чтобы зажигать руны мистической стелы и получать дары древних духов: чеканное золото, кристаллы маны и легендарные реликвии.
          </p>
        </div>

        {/* 7-Day Stone Altar Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          {CHECK_IN_DAYS.map((dayItem) => {
            const isPast = dayItem.day < streak;
            const isCurrent = dayItem.day === streak;

            return (
              <motion.div
                key={dayItem.day}
                whileHover={{ y: -6, scale: 1.02 }}
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  background: isCurrent
                    ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.2) 0%, rgba(18, 14, 24, 0.95) 100%)'
                    : isPast
                     ? 'rgba(12, 10, 16, 0.6)'
                     : 'rgba(18, 14, 24, 0.85)',
                  border: isCurrent
                    ? '2px solid #d4af37'
                    : dayItem.isSuper
                     ? '1.5px solid rgba(234, 179, 8, 0.5)'
                     : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isCurrent
                    ? '0 12px 35px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(212, 175, 55, 0.2)'
                    : '0 8px 24px rgba(0, 0, 0, 0.4)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '210px',
                }}
              >
                {/* Top Day Badge */}
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isCurrent ? '#FFE07D' : isPast ? '#6b7280' : '#8a7b6c',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}
                >
                  {dayItem.title}
                </div>

                {/* Vector Icon */}
                <div style={{ margin: '14px 0' }}>
                  {renderGlyph(dayItem.glyphType, isCurrent, isPast)}
                </div>

                {/* Reward Detail */}
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f3e8d2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <span>+{dayItem.gold}</span>
                    <GoldCoinGlyph size={14} color="#f59e0b" />
                  </div>
                  {dayItem.crystals > 0 && (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <span>+{dayItem.crystals}</span>
                      <CrystalGlyph size={13} color="#60a5fa" />
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#9c8e7e', marginTop: '6px' }}>
                    {dayItem.itemDesc}
                  </div>
                </div>

                {/* Status ribbon */}
                {isPast && (
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, marginTop: '8px', letterSpacing: '1px' }}>
                    ПОЛУЧЕНО
                  </div>
                )}
                {isCurrent && (
                  <div style={{ fontSize: '10px', color: '#d4af37', fontWeight: 900, marginTop: '8px', letterSpacing: '1px' }}>
                    {claimedToday ? '✓ ЗАБРАНО' : ' ДОСТУПНО'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Claim Action Bar */}
        <div style={{ textAlign: 'center' }}>
          <motion.button
            whileHover={canClaim ? { scale: 1.04, boxShadow: '0 0 35px rgba(212, 175, 55, 0.6)' } : {}}
            whileTap={canClaim ? { scale: 0.98 } : {}}
            onClick={handleClaim}
            disabled={!canClaim}
            style={{
              padding: '16px 44px',
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              borderRadius: '12px',
              border: canClaim ? '1px solid rgba(255, 235, 150, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: canClaim
                ? 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              color: canClaim ? '#0f0c05' : '#6b7280',
              cursor: canClaim ? 'pointer' : 'not-allowed',
              boxShadow: canClaim ? '0 10px 30px rgba(212, 175, 55, 0.4)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ChestGlyph size={18} color={canClaim ? '#0f0c05' : '#6b7280'} />
            {claimedToday ? 'Награда за сегодня уже в профиле' : 'Забрать Благословение Дня'}
          </motion.button>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            style={{
              marginTop: '25px',
              padding: '14px 24px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#a7f3d0',
              fontSize: '13px',
              fontWeight: 700,
              textAlign: 'center',
              maxWidth: '480px',
              marginInline: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Награда успешно начислена:</span>
            <span>+{feedback.gold}</span>
            <GoldCoinGlyph size={14} color="#f59e0b" />
            {feedback.crystals > 0 && (
              <>
                <span>и +{feedback.crystals}</span>
                <CrystalGlyph size={14} color="#60a5fa" />
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};
export default PortalDailyCheckIn;
