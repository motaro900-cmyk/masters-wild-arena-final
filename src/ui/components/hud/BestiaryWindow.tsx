import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetPath } from '../../../utils/assetPath';
import { useBestiary, PetActionButton, PetStatsCard, PetFoodSelector } from './Bestiary';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

export const BestiaryWindow: React.FC = () => {
    const {
        pet,
        gold,
        crystals,
        actionLog,
        isAnimating,
        particles,
        isHovered,
        setIsHovered,
        showFoodSelector,
        setShowFoodSelector,
        dragonState,
        currentTime,
        timerText,
        petCharges,
        isPettingLoading,
        isFeedingLoading,
        handleFeedItem,
        handlePet,
        resetIdle,
        getDragonSprite,
        getPetBubbleText,
        collectPetDailyReward,
    } = useBestiary();

    const [claimedReward, setClaimedReward] = React.useState<any | null>(null);

    return (
        <div
            style={{
                padding: '40px',
                display: 'flex',
                gap: '50px',
                color: '#fff',
                height: '100%',
                alignItems: 'center',
            }}
        >
            {/* ЛЕВАЯ ЧАСТЬ: ВИЗУАЛ ПИТОМЦА С ПЬЕДЕСТАЛОМ И ЧАТОМ */}
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Speech Bubble */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-35px',
                        background: 'rgba(26, 17, 10, 0.95)',
                        border: '2px solid #c48b3b',
                        padding: '10px 22px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#fef3c7',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 10px rgba(196,139,59,0.2)',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    {getPetBubbleText()}
                    {/* Bubble tail */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: '12px',
                            height: '12px',
                            background: '#1a110a',
                            borderRight: '2px solid #c48b3b',
                            borderBottom: '2px solid #c48b3b',
                        }}
                    />
                </div>

                {/* Circular Portal Pedestal Container */}
                <div
                    onMouseEnter={() => {
                        setIsHovered(true);
                        resetIdle();
                    }}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        width: '360px',
                        height: '360px',
                        background:
                            'radial-gradient(circle, rgba(240,192,64,0.22) 0%, rgba(0,0,0,0.65) 65%, transparent 72%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: 'inset 0 0 60px rgba(240,192,64,0.15)',
                        cursor: 'pointer',
                    }}
                >
                    {/* Slow Rotating Sunburst/Rays behind dragon */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '320px',
                            height: '320px',
                            background:
                                'repeating-conic-gradient(from 0deg, rgba(240,192,64,0.05) 0deg 15deg, transparent 15deg 30deg)',
                            borderRadius: '50%',
                            animation: 'spin 45s linear infinite',
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    />

                    {/* Rotating Magical Circles */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '300px',
                            height: '300px',
                            border: '2px dashed rgba(240,192,64,0.22)',
                            borderRadius: '50%',
                            animation: 'spin 20s linear infinite',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            width: '260px',
                            height: '260px',
                            border: '1px solid rgba(240,192,64,0.1)',
                            borderRadius: '50%',
                            animation: 'spin-reverse 15s linear infinite',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />

                    {/* Flying Particles */}
                    {particles.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                left: `calc(50% + ${p.x}px)`,
                                top: `calc(50% + ${p.y}px)`,
                                fontSize: '36px',
                                pointerEvents: 'none',
                                animation: 'float-up-fade 1.2s forwards ease-out',
                                zIndex: 5,
                            }}
                        >
                            {p.emoji}
                        </div>
                    ))}

                    {/* Round Portal with Dual Gold Border & Dragon inside */}
                    <div
                        style={{
                            width: '240px',
                            height: '240px',
                            borderRadius: '50%',
                            border: '6px double #c48b3b',
                            boxShadow: '0 0 30px rgba(240,192,64,0.4), inset 0 0 25px rgba(0,0,0,0.9)',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0d151c',
                        }}
                    >
                        <motion.div
                            animate={isAnimating ? { scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            style={{
                                width: '105%',
                                height: '105%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: isAnimating
                                    ? 'none'
                                    : dragonState === 'sleep'
                                      ? 'none'
                                      : 'float 4s ease-in-out infinite',
                            }}
                        >
                            <img
                                src={resolveAssetPath(getDragonSprite())}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter:
                                        dragonState === 'sad'
                                            ? 'grayscale(0.3) brightness(0.7) contrast(1.1)'
                                            : dragonState === 'sleep'
                                              ? 'brightness(0.75) contrast(0.95)'
                                              : 'none',
                                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'filter 0.4s ease, transform 0.4s ease',
                                }}
                                alt="Cute Pet Dragon"
                            />
                        </motion.div>
                    </div>

                    {/* Glowing Daily Pet Reward Chest */}
                    {pet.hasDailyPetReward && (
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                                boxShadow: [
                                    '0 0 15px rgba(240,192,64,0.4)',
                                    '0 0 30px rgba(240,192,64,0.8)',
                                    '0 0 15px rgba(240,192,64,0.4)',
                                ],
                            }}
                            transition={{
                                scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                                rotate: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                                boxShadow: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                            }}
                            whileHover={{ scale: 1.25 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const rewards = collectPetDailyReward();
                                if (rewards) {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_BUY || AssetsMap.AUDIO.SFX_CLICK);
                                    setClaimedReward(rewards);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                bottom: '15px',
                                right: '15px',
                                width: '70px',
                                height: '70px',
                                background:
                                    'radial-gradient(circle, rgba(240,192,64,0.45) 0%, rgba(240,192,64,0.1) 70%, transparent 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 12,
                                cursor: 'pointer',
                                border: '2px solid #f0c040',
                            }}
                        >
                            <span style={{ fontSize: '38px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                🎁
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Pet Identity Header */}
                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '36px',
                        color: '#f0c040',
                        marginTop: '25px',
                        marginBottom: '4px',
                        letterSpacing: '2px',
                        textShadow: '0 4px 8px rgba(0,0,0,0.6)',
                        fontWeight: 900,
                    }}
                >
                    {pet.name}
                </h2>
                <div
                    style={{
                        color: '#c48b3b',
                        fontWeight: 900,
                        fontSize: '15px',
                        letterSpacing: '4px',
                        background: 'rgba(196,139,59,0.1)',
                        padding: '4px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(196,139,59,0.2)',
                    }}
                >
                    УРОВЕНЬ {pet.level}
                </div>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: СТАТЫ И ДЕЙСТВИЯ */}
            <div
                style={{
                    flex: 1.2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '30px',
                    height: '100%',
                    justifyContent: 'center',
                }}
            >
                {/* Stats Container Card */}
                <PetStatsCard pet={pet} currentTime={currentTime} />

                {/* DYNAMIC ACTION VIEW OR FOOD SHOP */}
                <div style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {showFoodSelector ? (
                        /* FOOD SELECTOR SUB-PANEL */
                        <PetFoodSelector
                            gold={gold}
                            crystals={crystals}
                            onFeedItem={handleFeedItem}
                            onBack={() => setShowFoodSelector(false)}
                            disabled={isFeedingLoading}
                        />
                    ) : (
                        /* REGULAR ACTION CONTROLS & LOG */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* ЛОГ ДЕЙСТВИЙ (Стилизованная плашка) */}
                            <div
                                style={{
                                    height: '70px',
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    border: '1px solid rgba(196, 139, 59, 0.15)',
                                    borderRadius: '16px',
                                    color: '#ffedd5',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 20px',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)',
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={actionLog}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.25 }}
                                        style={{ color: actionLog.includes('УРОВЕНЬ') ? '#fbbf24' : '#fff' }}
                                    >
                                        {actionLog}
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            {/* КНОПКИ ДЕЙСТВИЙ */}
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <PetActionButton
                                    onClick={() => {
                                        setShowFoodSelector(true);
                                        resetIdle();
                                    }}
                                    colorScheme="green"
                                    disabled={isFeedingLoading}
                                >
                                    <span>{isFeedingLoading ? '...' : 'КОРМЛЕНИЕ 🥩'}</span>
                                </PetActionButton>

                                <PetActionButton
                                    onClick={handlePet}
                                    colorScheme="gold"
                                    disabled={petCharges <= 0 || isPettingLoading}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px' }}>
                                            {isPettingLoading ? '...' : `ПОГЛАДИТЬ ✨ ${petCharges}/5`}
                                        </span>
                                        {petCharges < 5 && !isPettingLoading && (
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    color: '#fef08a',
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    marginTop: '2px',
                                                }}
                                            >
                                                (+1 через {timerText})
                                            </span>
                                        )}
                                    </div>
                                </PetActionButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* CLAIM REWARD MODAL */}
            <AnimatePresence>
                {claimedReward && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(0, 0, 0, 0.85)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 50 }}
                            style={{
                                background: 'linear-gradient(135deg, #1e1b18 0%, #0d0b0a 100%)',
                                border: '3px solid #c48b3b',
                                borderRadius: '24px',
                                padding: '40px',
                                width: '420px',
                                textAlign: 'center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(196,139,59,0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                            }}
                        >
                            <h3
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '28px',
                                    color: '#f0c040',
                                    margin: 0,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                    fontWeight: 900,
                                }}
                            >
                                ДАР ОТ ПИТОМЦА! 🐉
                            </h3>
                            <p style={{ color: '#d1a873', fontSize: '15px', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                                Ваш дракон <b>{pet.name}</b> вернулся из ежедневного путешествия по Великому Лесу и
                                принес вам добычу!
                            </p>

                            {/* Rewards List */}
                            <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', margin: '10px 0' }}>
                                {/* Gold */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <span style={{ fontSize: '32px' }}>💰</span>
                                    <span style={{ color: '#fff', fontWeight: 800 }}>+{claimedReward.gold}</span>
                                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>Золото</span>
                                </div>

                                {/* Crystals */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <span style={{ fontSize: '32px' }}>💎</span>
                                    <span style={{ color: '#fff', fontWeight: 800 }}>+{claimedReward.crystals}</span>
                                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>Кристаллы</span>
                                </div>

                                {/* Bonus Loot */}
                                {claimedReward.loot && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <span style={{ fontSize: '32px' }}>🎁</span>
                                        <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                                            +{claimedReward.loot.amount}
                                        </span>
                                        <span style={{ color: '#fbbf24', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                            {claimedReward.loot.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Status Multiplier Indicator */}
                            <div
                                style={{
                                    fontSize: '13px',
                                    color:
                                        claimedReward.multiplier >= 1.2
                                            ? '#10b981'
                                            : claimedReward.multiplier >= 1.0
                                              ? '#fbbf24'
                                              : '#ef4444',
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '6px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    fontWeight: 700,
                                }}
                            >
                                Множитель состояния: x{claimedReward.multiplier}{' '}
                                {claimedReward.multiplier >= 1.2 ? '(Сытый дракон)' : ''}
                            </div>

                            <button
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setClaimedReward(null);
                                }}
                                style={{
                                    marginTop: '10px',
                                    background: 'linear-gradient(to bottom, #f0c040, #c48b3b)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '12px 30px',
                                    color: '#1a110a',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(196,139,59,0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                ПРИНЯТЬ ДАРЫ
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BestiaryWindow;
