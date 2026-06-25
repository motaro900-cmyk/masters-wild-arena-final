import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

export const LevelUpOverlay: React.FC = () => {
    const { latestLevelUp, clearLatestLevelUp } = useGameStore((s: any) => ({
        latestLevelUp: s.latestLevelUp,
        clearLatestLevelUp: s.clearLatestLevelUp,
    }));

    useEffect(() => {
        if (latestLevelUp) {
            // Play level up SFX
            audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP || 'SFX_LEVEL_UP');
        }
    }, [latestLevelUp]);

    if (!latestLevelUp) return null;

    const hero = HEROES_DB.find((h) => h.id === latestLevelUp.heroId) || HEROES_DB[0];
    const heroName = hero.name;

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                }}
            >
                {/* Glow Radial Background */}
                <div
                    style={{
                        position: 'absolute',
                        width: '700px',
                        height: '700px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />

                <motion.div
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: -50, opacity: 0 }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={{
                        background: 'linear-gradient(180deg, rgba(28,25,23,0.95) 0%, rgba(12,10,9,0.98) 100%)',
                        border: '3px solid #eab308',
                        boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(234,179,8,0.3)',
                        borderRadius: '32px',
                        padding: '40px 60px',
                        width: '540px',
                        textAlign: 'center',
                        zIndex: 1,
                        position: 'relative',
                    }}
                >
                    {/* Golden Ribbon Banner */}
                    <div
                        style={{
                            fontSize: '11px',
                            color: '#eab308',
                            fontWeight: 900,
                            letterSpacing: '5px',
                            textTransform: 'uppercase',
                            marginBottom: '10px',
                            fontFamily: "'Montserrat', sans-serif",
                            textShadow: '0 0 10px rgba(234,179,8,0.5)',
                        }}
                    >
                        ДОСТИЖЕНИЕ ГЕРОЯ
                    </div>

                    <h2
                        style={{
                            color: '#ffffff',
                            fontFamily: "'Cinzel', 'Philosopher', serif",
                            fontSize: '38px',
                            margin: '0 0 25px 0',
                            letterSpacing: '2px',
                            background: 'linear-gradient(180deg, #ffffff 0%, #eab308 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
                        }}
                    >
                        УРОВЕНЬ ПОВЫШЕН!
                    </h2>

                    {/* Hero image preview */}
                    <div
                        style={{
                            width: '180px',
                            height: '180px',
                            margin: '0 auto 20px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src={hero.image}
                            alt={heroName}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)',
                            }}
                        />
                    </div>

                    {/* Progress Info */}
                    <div
                        style={{
                            fontSize: '22px',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontFamily: "'Philosopher', 'Outfit', sans-serif",
                            marginBottom: '30px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                    >
                        {heroName} <span style={{ color: '#eab308' }}>Ур. {latestLevelUp.oldLevel}</span> ➔{' '}
                        <span style={{ color: '#22c55e' }}>Ур. {latestLevelUp.newLevel}</span>
                    </div>

                    {/* Stats Delta List */}
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: '16px',
                            border: '1px solid rgba(234,179,8,0.15)',
                            padding: '20px',
                            marginBottom: '30px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#e2e8f0',
                            }}
                        >
                            <span>❤️ Макс. Здоровье</span>
                            <span style={{ color: '#22c55e', fontWeight: 900 }}>+{latestLevelUp.hpDelta} HP</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#e2e8f0',
                            }}
                        >
                            <span>⚔️ Сила Атаки</span>
                            <span style={{ color: '#22c55e', fontWeight: 900 }}>+{latestLevelUp.atkDelta} ATK</span>
                        </div>

                        {/* Unlocked tier indicator */}
                        {(() => {
                            const lvl = latestLevelUp.newLevel;
                            let unlockText: string | null = null;
                            if (lvl === 10) unlockText = 'ОТКРЫТ 2-Й СЛОТ ТАЛАНТОВ (ТИР II)';
                            else if (lvl === 20) unlockText = 'ОТКРЫТ ОСОБЫЙ СКИН РАМКИ (ИЗУМРУДНЫЙ ДРАКОН)';
                            else if (lvl === 40) unlockText = 'ОТКРЫТ ЭКСКЛЮЗИВНЫЙ ЭФФЕКТ УДАРА (УЛЬТИМЕЙТ ТАЛАНТ)';
                            else if (lvl === 60) unlockText = 'ОТКРЫТ УНИКАЛЬНЫЙ ЭФФЕКТ ФИНИШЕРА';
                            else if (lvl === 80) unlockText = "ТИТУЛ 'МАСТЕР ДИКОЙ ПРИРОДЫ' + ЗОЛОТАЯ РАМКА";
                            else if (latestLevelUp.unlockedTier) {
                                unlockText = `ОТКРЫТ НОВЫЙ ТИР ТАЛАНТОВ (${
                                    latestLevelUp.unlockedTier === 2
                                        ? 'ТИР II'
                                        : latestLevelUp.unlockedTier === 3
                                          ? 'ТИР III'
                                          : 'УЛЬТИМЕЙТ'
                                })`;
                            }

                            if (!unlockText) return null;

                            return (
                                <div
                                    style={{
                                        marginTop: '10px',
                                        paddingTop: '12px',
                                        borderTop: '1px dashed rgba(234,179,8,0.2)',
                                        color: '#fbbf24',
                                        fontSize: '14px',
                                        fontWeight: 900,
                                        letterSpacing: '1px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        textShadow: '0 0 8px rgba(251,191,36,0.3)',
                                    }}
                                >
                                    <span>🔓</span>
                                    <span>{unlockText}</span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={clearLatestLevelUp}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.04)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(234,179,8,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(234,179,8,0.2)';
                        }}
                        style={{
                            padding: '12px 40px',
                            background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                            border: '2px solid #fbbf24',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '16px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(234,179,8,0.2)',
                            letterSpacing: '1.5px',
                        }}
                    >
                        ОТЛИЧНО
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
