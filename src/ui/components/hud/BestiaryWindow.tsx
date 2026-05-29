import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAssetPath } from '../../../utils/assetPath';
import { useBestiary, PetActionButton, PetStatsCard, PetFoodSelector } from './Bestiary';

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
        handleFeedItem,
        handlePet,
        resetIdle,
        getDragonSprite,
        getPetBubbleText,
    } = useBestiary();

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
                                >
                                    <span>КОРМЛЕНИЕ 🥩</span>
                                </PetActionButton>

                                <PetActionButton onClick={handlePet} colorScheme="gold" disabled={petCharges <= 0}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px' }}>ПОГЛАДИТЬ ✨ {petCharges}/5</span>
                                        {petCharges < 5 && (
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
        </div>
    );
};
