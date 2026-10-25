/**
 * DUEL CHALLENGE MODAL (ВЫЗОВ НА АРЕНУ)
 * High-craft VS presentation modal for incoming viral duel links.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IDuelChallenge, DuelChallengeService } from '../../utils/DuelChallengeService';
import { HEROES_DB } from '../../configs/HeroesConfig';
import { useGameStore } from '../../store/useGameStore';
import { proceduralAudio } from '../../utils/ProceduralAudio';

interface DuelChallengeModalProps {
    challenge: IDuelChallenge | null;
    onClose: () => void;
}

export const DuelChallengeModal: React.FC<DuelChallengeModalProps> = ({ challenge, onClose }) => {
    if (!challenge) return null;

    const challengerHero = HEROES_DB.find((h) => h.id === challenge.heroId) || HEROES_DB[0];
    const playerHeroId = useGameStore((state: any) => state.selectedHeroId) || 'panda';
    const playerHero = HEROES_DB.find((h) => h.id === playerHeroId) || HEROES_DB[0];
    const playerName = useGameStore((state: any) => state.name) || 'Дикий Мастер';
    const playerHeroLevel = (useGameStore((state: any) => state.heroes?.[playerHeroId]?.level) || 1);

    const handleAccept = () => {
        DuelChallengeService.acceptDuel(challenge);
        onClose();
    };

    const handleDecline = () => {
        proceduralAudio.playClick(0.8);
        if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 20000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(5, 5, 10, 0.88)',
                    backdropFilter: 'blur(12px)',
                    padding: '16px',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '680px',
                        background: 'linear-gradient(135deg, #16131c 0%, #0d0a12 100%)',
                        border: '2px solid rgba(200, 168, 112, 0.45)',
                        borderRadius: '16px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(200, 168, 112, 0.15)',
                        padding: '24px 28px',
                        color: '#f3e8d2',
                        overflow: 'hidden',
                    }}
                >
                    {/* Top ambient highlight */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '10%',
                            right: '10%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #e2c082, transparent)',
                        }}
                    />

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <span
                            style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                color: '#e2c082',
                                background: 'rgba(200, 168, 112, 0.12)',
                                border: '1px solid rgba(200, 168, 112, 0.3)',
                                borderRadius: '20px',
                                padding: '4px 14px',
                                marginBottom: '8px',
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                            }}
                        >
                            ⚔️ Вызов на Дуэль
                        </span>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '26px',
                                fontFamily: "'Philosopher', serif",
                                fontWeight: 700,
                                color: '#fff',
                                textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                            }}
                        >
                            Битва Титанов Диких Земель
                        </h2>
                    </div>

                    {/* VS Arena Cards */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '28px',
                        }}
                    >
                        {/* Player Side */}
                        <div
                            style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: '84px',
                                    height: '84px',
                                    margin: '0 auto 10px',
                                    borderRadius: '50%',
                                    border: '2px solid #52b788',
                                    overflow: 'hidden',
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    boxShadow: '0 0 15px rgba(82, 183, 136, 0.3)',
                                }}
                            >
                                <img
                                    src={playerHero.image}
                                    alt={playerHero.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: "'Philosopher', serif" }}>
                                {playerName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>
                                {playerHero.name} • Ур. {playerHeroLevel}
                            </div>
                        </div>

                        {/* VS Emblem */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 8px',
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                                style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #c8a870 0%, #a47133 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    color: '#1a1005',
                                    boxShadow: '0 0 20px rgba(200, 168, 112, 0.6)',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                VS
                            </motion.div>
                        </div>

                        {/* Challenger Side */}
                        <div
                            style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: '84px',
                                    height: '84px',
                                    margin: '0 auto 10px',
                                    borderRadius: '50%',
                                    border: '2px solid #ef4444',
                                    overflow: 'hidden',
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                                }}
                            >
                                <img
                                    src={challengerHero.image}
                                    alt={challengerHero.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5', fontFamily: "'Philosopher', serif" }}>
                                {challenge.challengerName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>
                                {challengerHero.name} • Ур. {challenge.heroLevel}
                            </div>
                            <div style={{ fontSize: '11px', color: '#e2c082', marginTop: '4px', fontWeight: 600 }}>
                                Мощь: ⚔️ {challenge.power}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleDecline}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#9ca3af',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontFamily: "'Montserrat', sans-serif",
                            }}
                        >
                            Отклонить
                        </button>
                        <button
                            onClick={handleAccept}
                            style={{
                                flex: 2,
                                padding: '12px 20px',
                                borderRadius: '10px',
                                border: '1px solid #e2c082',
                                background: 'linear-gradient(135deg, #c8a870 0%, #9e7338 100%)',
                                color: '#160e05',
                                fontSize: '15px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(200, 168, 112, 0.4)',
                                transition: 'all 0.15s ease',
                                fontFamily: "'Philosopher', serif",
                                letterSpacing: '0.5px',
                            }}
                        >
                            ⚔️ Принять бой!
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
