/**
 * PORTAL HERO SECTION (Главный экран портала — Blizzard/Riot Split-Hero Gate)
 * Полномасштабный 100vh экран, монументальный персонаж без коробок,
 * бинарная развилка «Играть гостем (1 клик) / Создать аккаунт (+500 золота +50 кристаллов)»
 * и живой статус игрового сервера.
 */
import React, { useState } from 'react';
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
  const [promoCopied, setPromoCopied] = useState(false);

  const handleCopyPromo = () => {
    portalSound.playReward();
    navigator.clipboard?.writeText('WILD2026');
    setPromoCopied(true);
    setTimeout(() => setPromoCopied(false), 2500);
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
      {/* Authentic Game Painted Forest Background with subtle parallax depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/images/backgrounds/bg_main.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.32) contrast(1.18)',
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
            'radial-gradient(circle at 45% 45%, rgba(212, 175, 55, 0.08) 0%, rgba(5, 4, 9, 0.85) 70%, #07050d 100%)',
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

      {/* Main Content Layout (Split-Hero Gate) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1280px',
          width: '100%',
          padding: '0 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '50px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Monumental Headline & Binary Action Fork */}
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
              marginBottom: '22px',
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

          {/* Monumental Title */}
          <h1
            style={{
              margin: '0 0 18px 0',
              fontFamily: "'Philosopher', serif",
              fontSize: 'clamp(36px, 5.5vw, 62px)',
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

          {/* Subtitle Lore */}
          <p
            style={{
              margin: '0 0 32px 0',
              maxWidth: '560px',
              fontSize: '15.5px',
              lineHeight: 1.7,
              color: '#c4b5a2',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            Полноценная браузерная темная RPG мирового уровня. Собери отряд мифических хищников,
            затачивай реликтовое оружие и сокрушай соперников в PvP дуэлях прямо в браузере без скачивания.
          </p>

          {/* Binary Action Fork (Blizzard / Riot Conversion Standard) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '480px',
              marginBottom: '26px',
            }}
          >
            {/* Primary Dominant CTA: Быстрый старт гостем */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                portalSound.playEquip();
                proceduralAudio.playDuelHorn();
                onLaunchGame();
              }}
              style={{
                width: '100%',
                padding: '18px 30px',
                borderRadius: '16px',
                border: '1.5px solid #FFE07D',
                background:
                  'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                color: '#120d04',
                fontSize: '16px',
                fontWeight: 900,
                fontFamily: "'Philosopher', serif",
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow:
                  '0 8px 35px rgba(212, 175, 55, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <SwordGlyph size={22} color="#120d04" />
              <span>ИГРАТЬ ГОСТЕМ (В 1 КЛИК)</span>
            </motion.button>

            {/* Secondary CTA: Создать аккаунт с бонусом */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                portalSound.playClick(1.0);
                onOpenCabinet();
              }}
              style={{
                width: '100%',
                padding: '15px 24px',
                borderRadius: '14px',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                background:
                  'linear-gradient(135deg, rgba(28, 21, 36, 0.9) 0%, rgba(14, 10, 18, 0.95) 100%)',
                color: '#FFE07D',
                fontSize: '14px',
                fontWeight: 800,
                fontFamily: "'Philosopher', serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.7)',
                transition: 'all 0.2s',
              }}
            >
              <ShieldGlyph size={18} color="#FFE07D" />
              <span>СОЗДАТЬ АККАУНТ (+500 ЗОЛОТА +50 КРИСТАЛЛОВ)</span>
            </motion.button>
          </div>

          {/* Tertiary Row: Бестиарий Link + Promo Code Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
            }}
          >
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
              }}
            >
              <CrownGlyph size={15} color="#d4af37" />
              <span>Изучить Бестиарий и Навыки героев</span>
            </button>

            {/* Promo Code Copy Pill */}
            <div
              onClick={handleCopyPromo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                fontSize: '11px',
                color: '#e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Нажми, чтобы скопировать промокод"
            >
              <GoldCoinGlyph size={14} color="#f59e0b" />
              <span>
                Промокод:{' '}
                <strong style={{ color: '#FFE07D', letterSpacing: '0.5px' }}>
                  WILD2026
                </strong>
              </span>
              <span style={{ fontSize: '10px', color: '#4ade80', marginLeft: '2px' }}>
                {promoCopied ? '✓ Скопирован!' : '(нажми)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Monumental Character Presentation (Blizzard/Riot Scale) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Ambient Elemental Ice/Qi Aura */}
          <div
            style={{
              position: 'absolute',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, rgba(56, 189, 248, 0.1) 40%, transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Golden Runic Halo behind character */}
          <div
            style={{
              position: 'absolute',
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(212, 175, 55, 0.25)',
              boxShadow: '0 0 35px rgba(212, 175, 55, 0.1)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Full-Height Character Artwork (Breaks free of boxes!) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img
              src="/assets/characters/panda/panda_frost.png"
              alt="Фэн Лун (Снежная Панда)"
              style={{
                width: '100%',
                maxWidth: '480px',
                height: 'auto',
                maxHeight: '68vh',
                objectFit: 'contain',
                filter:
                  'drop-shadow(0 25px 45px rgba(0,0,0,0.98)) drop-shadow(0 0 30px rgba(96, 165, 250, 0.35))',
                maskImage:
                  'linear-gradient(to bottom, black 82%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 82%, transparent 100%)',
              }}
            />

            {/* Floating Hero Nameplate Tag */}
            <div
              style={{
                marginTop: '-24px',
                padding: '12px 22px',
                borderRadius: '16px',
                background: 'rgba(10, 8, 16, 0.92)',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                boxShadow:
                  '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(96, 165, 250, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FrostGlyph size={20} color="#60a5fa" glow />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#60a5fa',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Холод & Лед • Страж Окраин
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#FFE07D',
                    fontFamily: "'Philosopher', serif",
                  }}
                >
                  Фэн Лун (Снежная Панда)
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
