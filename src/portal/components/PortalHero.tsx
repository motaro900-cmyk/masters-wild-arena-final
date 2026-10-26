import { SwordGlyph, ShieldGlyph, CrownGlyph, FrostGlyph, GoldCoinGlyph, CrystalGlyph } from './PortalGlyphs';
/**
 * PORTAL HERO SECTION (Главный экран портала)
 * Аутентичный арт из игры (bg_main.webp + panda_frost.png), статус сервера,
 * быстрый запуск боя, промокод WILD2026 и вход в Личный Кабинет.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { useGameStore } from '../../store/useGameStore';

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
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<string | null>(null);

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    proceduralAudio.playClick(1.1);
    const store: any = useGameStore.getState();

    if (code === 'WILD2026' || code === 'START') {
      store.addGold?.(500);
      store.addCrystals?.(50);
      proceduralAudio.playFanfare();
      setPromoStatus('✓ Промокод активирован: +500 Золота и +50 Кристаллов!');
    } else {
      setPromoStatus('✕ Неверный промокод или срок действия истек');
    }
    setPromoCode('');
    setTimeout(() => setPromoStatus(null), 4000);
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
      {/* Authentic Game Painted Forest Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/images/backgrounds/bg_main.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.35) contrast(1.15)',
          transform: 'scale(1.04)',
          zIndex: 0,
        }}
      />

      {/* Gradient Overlays for Atmospheric Depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 45%, rgba(212, 175, 55, 0.08) 0%, rgba(5, 4, 9, 0.8) 70%, #07050d 100%)',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '140px',
          background: 'linear-gradient(to top, #07050d 0%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* Main Content Layout (2 Columns: Hero Description & Authentic In-Game Beast Showcase) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1240px',
          width: '100%',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        {/* Left: Headline, Telemetry & CTA Deck */}
        <div style={{ textAlign: 'left' }}>
          {/* Live Server & Game Engine Status Tag */}
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
              marginBottom: '20px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />
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

          {/* Epic Title */}
          <h1
            style={{
              margin: '0 0 16px 0',
              fontFamily: "'Philosopher', 'Cinzel', serif",
              fontSize: 'clamp(34px, 5vw, 54px)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#fff',
              textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 35px rgba(212, 175, 55, 0.25)',
            }}
          >
            Вступи в Битву <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #FFE07D 0%, #d4af37 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Легендарных Зверей
            </span>
          </h1>

          {/* Subtitle Lore */}
          <p
            style={{
              margin: '0 0 28px 0',
              maxWidth: '560px',
              fontSize: '15px',
              lineHeight: 1.7,
              color: '#c4b5a2',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            Полноценная браузерная AAA-RPG. Соберите собственный отряд мифических хищников,
            экипируйте древние реликвии и сокрушайте соперников в PvP дуэлях прямо в браузере без скачивания.
          </p>

          {/* CTA Buttons Deck */}
          <div
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '35px',
            }}
          >
            {/* Primary: Вступить в бой */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                proceduralAudio.playDuelHorn();
                onLaunchGame();
              }}
              style={{
                padding: '16px 36px',
                borderRadius: '14px',
                border: '1px solid #FFE07D',
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                color: '#130d04',
                fontSize: '15px',
                fontWeight: 900,
                fontFamily: "'Philosopher', serif",
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(212, 175, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <SwordGlyph size={18} color="#130d04" />
              <span>ВСТУПИТЬ В БИТВУ</span>
            </motion.button>

            {/* Secondary: Личный Кабинет */}
            <button
              onClick={() => {
                proceduralAudio.playClick(1.0);
                onOpenCabinet();
              }}
              style={{
                padding: '16px 26px',
                borderRadius: '14px',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                background: 'rgba(25, 20, 32, 0.85)',
                color: '#FFE07D',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: "'Philosopher', serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                transition: 'all 0.2s',
              }}
            >
              <ShieldGlyph size={16} color="#FFE07D" />
              <span>Личный Кабинет</span>
            </button>

            {/* Secondary: Бестиарий */}
            <button
              onClick={onExploreBeasts}
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <CrownGlyph size={16} color="#e5e7eb" />
              <span>Бестиарий</span>
            </button>
          </div>

          {/* Promo Code Activator Card */}
          <div
            style={{
              maxWidth: '460px',
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(18, 14, 24, 0.85)',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#d4af37',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}
            >
              Стартовый Набор Новичка (Промокод: WILD2026)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Введи WILD2026"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#09070e',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleApplyPromo}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                  border: 'none',
                  color: '#120d04',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Активировать
              </button>
            </div>
            {promoStatus && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: promoStatus.startsWith('✓') ? '#4ade80' : '#ef4444',
                  fontWeight: 600,
                }}
              >
                {promoStatus}
              </div>
            )}
          </div>
        </div>

        {/* Right: Authentic In-Game Character Showcase (Transparent Frost Panda & Runic Frame) */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              height: '500px',
              borderRadius: '24px',
              background: 'radial-gradient(circle at 50% 60%, rgba(96, 165, 250, 0.22) 0%, rgba(10, 8, 16, 0.95) 75%)',
              border: '2px solid rgba(212, 175, 55, 0.45)',
              boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(96, 165, 250, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Background City/Arena Ambient Silhouette */}
            <img
              src="/assets/images/backgrounds/bg_city_hub.webp"
              alt="City Hub"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.28,
                filter: 'blur(3px)',
              }}
            />

            {/* Real Transparent Character Sprite */}
            <img
              src="/assets/characters/panda/panda_frost.png"
              alt="Фэн Лун (Снежная Панда)"
              style={{
                position: 'relative',
                maxHeight: '88%',
                maxWidth: '88%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.95)) drop-shadow(0 0 20px rgba(96, 165, 250, 0.4))',
                zIndex: 2,
              }}
            />

            {/* Bottom Hero Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: '18px',
                left: '20px',
                right: '20px',
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(8, 6, 12, 0.88)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 3,
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>
                  Холод & Лед • Танк
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFE07D', fontFamily: "'Philosopher', serif" }}>
                  Фэн Лун (Снежная Панда)
                </div>
              </div>
              <FrostGlyph size={24} color="#60a5fa" glow />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
