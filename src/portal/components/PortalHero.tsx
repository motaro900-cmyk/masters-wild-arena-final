/**
 * PORTAL HERO SECTION (Главный экран портала)
 * Эпичный арт-баннер, статус сервера, кнопка запуска игры, промокоды и статистика онлайна.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { proceduralAudio } from '../../utils/ProceduralAudio';
import { useGameStore } from '../../store/useGameStore';

interface PortalHeroProps {
    onLaunchGame: () => void;
    onExploreBeasts: () => void;
}

export const PortalHero: React.FC<PortalHeroProps> = ({ onLaunchGame, onExploreBeasts }) => {
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
            setPromoStatus('✓ Промокод активирован: +500 🪙 Золота и +50 💎 Кристаллов!');
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
                paddingTop: '80px',
                paddingBottom: '60px',
                overflow: 'hidden',
                backgroundColor: '#050409',
            }}
        >
            {/* Background 4K Splash Art with Dark Gradient & Vignette */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url(/assets/promo/frost_panda_aaa_master.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%',
                    filter: 'brightness(0.38) saturate(1.2)',
                    transform: 'scale(1.02)',
                    zIndex: 0,
                }}
            />

            {/* Gradient Overlays for Cinematic Depth */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 50% 40%, transparent 20%, rgba(5, 4, 9, 0.85) 75%, #050409 100%)',
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
                    background: 'linear-gradient(to top, #050409 0%, transparent 100%)',
                    zIndex: 1,
                }}
            />

            {/* Main Content Container */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '1200px',
                    width: '100%',
                    padding: '0 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Live Server & Game Engine Status Tag */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 18px',
                        borderRadius: '30px',
                        background: 'rgba(212, 175, 55, 0.12)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        boxShadow: '0 0 25px rgba(212, 175, 55, 0.2)',
                        marginBottom: '20px',
                    }}
                >
                    <span
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 10px #22c55e',
                        }}
                    />
                    <span
                        style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#FFE07D',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Сервер S1: Туманная Долина • 1,420 в сети
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
                    <span
                        style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '11px',
                            color: '#9ca3af',
                        }}
                    >
                        PixiJS v8 60 FPS
                    </span>
                </motion.div>

                {/* Epic Brand Title */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    style={{
                        margin: '0 0 12px',
                        fontFamily: "'Cinzel', serif",
                        fontSize: 'clamp(38px, 7vw, 76px)',
                        fontWeight: 900,
                        letterSpacing: 'clamp(3px, 1vw, 8px)',
                        color: '#FFF5D0',
                        textShadow:
                            '0 4px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.35)',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                    }}
                >
                    Masters of the Wild
                </motion.h1>

                {/* Subtitle / Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.25 }}
                    style={{
                        margin: '0 0 32px',
                        fontFamily: "'Philosopher', serif",
                        fontSize: 'clamp(18px, 2.5vw, 24px)',
                        fontWeight: 700,
                        color: '#e2c082',
                        maxWidth: '720px',
                        lineHeight: 1.4,
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
                    }}
                >
                    Собери непобедимый отряд первобытных зверей и стань легендой Арены Дикоземья
                </motion.p>

                {/* CTA Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35 }}
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        marginBottom: '40px',
                    }}
                >
                    {/* Primary Button: В БОЙ */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            proceduralAudio.playDuelHorn();
                            onLaunchGame();
                        }}
                        style={{
                            padding: '16px 42px',
                            borderRadius: '12px',
                            border: '2px solid #FFE07D',
                            background:
                                'linear-gradient(135deg, #d4af37 0%, #aa820a 50%, #856102 100%)',
                            color: '#150f05',
                            fontSize: '18px',
                            fontWeight: 900,
                            fontFamily: "'Philosopher', serif",
                            letterSpacing: '1.2px',
                            cursor: 'pointer',
                            boxShadow:
                                '0 10px 35px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>⚔️</span>
                        <span>ВСТУПИТЬ В БИТВУ</span>
                    </motion.button>

                    {/* Secondary Button: Кодекс Зверей */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            proceduralAudio.playClick(1.0);
                            onExploreBeasts();
                        }}
                        style={{
                            padding: '16px 32px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            background: 'rgba(15, 12, 22, 0.75)',
                            backdropFilter: 'blur(12px)',
                            color: '#f3e8d2',
                            fontSize: '16px',
                            fontWeight: 700,
                            fontFamily: "'Philosopher', serif",
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span>🐾</span>
                        <span>Кодекс Зверей</span>
                    </motion.button>
                </motion.div>

                {/* Quick Promo Code & Newbie Starter Pack */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    style={{
                        background: 'rgba(12, 9, 18, 0.75)',
                        border: '1px solid rgba(200, 168, 112, 0.3)',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        maxWidth: '540px',
                        width: '100%',
                        backdropFilter: 'blur(14px)',
                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#FFE07D',
                                fontFamily: "'Montserrat', sans-serif",
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            🎁 Подарок новичка: Код «WILD2026»
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>+500 🪙 | +50 💎</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="Введи WILD2026..."
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                background: 'rgba(0, 0, 0, 0.5)',
                                color: '#fff',
                                fontSize: '13px',
                                fontFamily: "'Montserrat', sans-serif",
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleApplyPromo}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '8px',
                                border: '1px solid #c8a870',
                                background: 'linear-gradient(135deg, #c8a870 0%, #9e7338 100%)',
                                color: '#150f05',
                                fontSize: '13px',
                                fontWeight: 800,
                                fontFamily: "'Philosopher', serif",
                                cursor: 'pointer',
                            }}
                        >
                            Получить
                        </button>
                    </div>

                    {promoStatus && (
                        <div
                            style={{
                                marginTop: '10px',
                                fontSize: '12px',
                                color: promoStatus.startsWith('✓') ? '#4ade80' : '#f87171',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 600,
                            }}
                        >
                            {promoStatus}
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};
