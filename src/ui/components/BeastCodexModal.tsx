/**
 * BEAST CODEX MODAL (КОДЕКС ЗВЕРЕЙ)
 * Interactive 3D Parallax Beast Codex with holographic foil reflection,
 * real-time mouse/touch tilt physics, audio feedback, and lore reader.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HEROES_DB, IHeroConfig } from '../../configs/HeroesConfig';
import { useGameStore } from '../../store/useGameStore';
import { proceduralAudio } from '../../utils/ProceduralAudio';

interface BeastCodexModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BeastCodexModal: React.FC<BeastCodexModalProps> = ({ isOpen, onClose }) => {
    const activeHeroes = HEROES_DB.slice(0, 5); // 5 primary playable beasts
    const [selectedHero, setSelectedHero] = useState<IHeroConfig>(activeHeroes[0]);
    const equippedHeroId = useGameStore((state: any) => state.selectedHeroId) || 'panda';
    const isMobile = useGameStore((state: any) => state.isMobile);

    // 3D Parallax state
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        const maxTilt = 14;
        setTilt({
            rx: -deltaY * maxTilt,
            ry: deltaX * maxTilt,
            glareX: (x / rect.width) * 100,
            glareY: (y / rect.height) * 100,
            active: true,
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
    }, []);

    const handleSelectHero = (hero: IHeroConfig) => {
        proceduralAudio.playShimmer();
        setSelectedHero(hero);
    };

    const handleEquip = () => {
        proceduralAudio.playClick(1.2);
        const store: any = useGameStore.getState();
        store.setSelectedHeroId?.(selectedHero.id);
    };

    if (!isOpen) return null;

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
                    backgroundColor: 'rgba(5, 5, 10, 0.9)',
                    backdropFilter: 'blur(14px)',
                    padding: isMobile ? '10px' : '24px',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 25 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 25 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '920px',
                        maxHeight: '90vh',
                        background: 'linear-gradient(135deg, #14121a 0%, #0a080f 100%)',
                        border: '2px solid rgba(200, 168, 112, 0.4)',
                        borderRadius: '18px',
                        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(200, 168, 112, 0.15)',
                        padding: isMobile ? '16px' : '28px',
                        color: '#f3e8d2',
                        display: 'flex',
                        flexDirection: 'column',
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
                            background: 'linear-gradient(90deg, transparent, #c8a870, transparent)',
                        }}
                    />

                    {/* Modal Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '18px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingBottom: '12px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>🐾</span>
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: isMobile ? '20px' : '24px',
                                        fontFamily: "'Philosopher', serif",
                                        fontWeight: 700,
                                        color: '#fff',
                                    }}
                                >
                                    Кодекс Зверей
                                </h2>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        color: '#c8a870',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontFamily: "'Montserrat', sans-serif",
                                    }}
                                >
                                    Зал Славы и Боевая Мощь
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                proceduralAudio.playClick(0.9);
                                onClose();
                            }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                color: '#9ca3af',
                                fontSize: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Beast Selector Strip */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '12px',
                            marginBottom: '16px',
                        }}
                    >
                        {activeHeroes.map((hero) => {
                            const isCurrent = hero.id === selectedHero.id;
                            const isEquipped = hero.id === equippedHeroId;
                            return (
                                <button
                                    key={hero.id}
                                    onClick={() => handleSelectHero(hero)}
                                    onMouseEnter={() => proceduralAudio.playHover()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        border: isCurrent ? '2px solid #c8a870' : '1px solid rgba(255, 255, 255, 0.1)',
                                        background: isCurrent ? 'rgba(200, 168, 112, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                        color: isCurrent ? '#fef3c7' : '#9ca3af',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease',
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontWeight: isCurrent ? 700 : 500,
                                        fontSize: '13px',
                                    }}
                                >
                                    <img
                                        src={hero.image}
                                        alt={hero.name}
                                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                    />
                                    {hero.name}
                                    {isEquipped && (
                                        <span
                                            style={{
                                                fontSize: '9px',
                                                background: '#2d6a4f',
                                                color: '#d8f3dc',
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            АКТИВЕН
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Content: 3D Card + Stats */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '24px',
                            flex: 1,
                            overflowY: 'auto',
                            paddingRight: '6px',
                        }}
                    >
                        {/* 3D Holographic Card Viewport */}
                        <div
                            style={{
                                flex: isMobile ? 'none' : '0 0 320px',
                                display: 'flex',
                                justifyContent: 'center',
                                perspective: '1000px',
                            }}
                        >
                            <div
                                ref={cardRef}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    position: 'relative',
                                    width: '280px',
                                    height: '380px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(145deg, #1f1b26 0%, #0f0c14 100%)',
                                    border: '2px solid rgba(200, 168, 112, 0.5)',
                                    boxShadow: tilt.active
                                        ? '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(200, 168, 112, 0.3)'
                                        : '0 15px 35px rgba(0, 0, 0, 0.6)',
                                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                                    transformStyle: 'preserve-3d',
                                    transition: tilt.active ? 'transform 0.05s ease-out' : 'transform 0.5s ease-out',
                                    cursor: 'grab',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Foil Glare Sheen Layer */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)`,
                                        mixBlendMode: 'color-dodge',
                                        pointerEvents: 'none',
                                        zIndex: 3,
                                    }}
                                />

                                {/* Card Header Badge */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '14px',
                                        right: '14px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        zIndex: 4,
                                        transform: 'translateZ(30px)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(200, 168, 112, 0.2)',
                                            color: '#e2c082',
                                            border: '1px solid rgba(200, 168, 112, 0.4)',
                                            fontFamily: "'Montserrat', sans-serif",
                                        }}
                                    >
                                        {selectedHero.role}
                                    </span>
                                    <span style={{ fontSize: '12px' }}>⭐ ⭐ ⭐</span>
                                </div>

                                {/* Hero Sprite */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: '45px 20px 70px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transform: 'translateZ(45px)',
                                        zIndex: 2,
                                    }}
                                >
                                    <img
                                        src={selectedHero.image}
                                        alt={selectedHero.name}
                                        style={{
                                            maxWidth: '90%',
                                            maxHeight: '90%',
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.7))',
                                        }}
                                    />
                                </div>

                                {/* Card Footer Name */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '12px',
                                        left: '14px',
                                        right: '14px',
                                        textAlign: 'center',
                                        zIndex: 4,
                                        transform: 'translateZ(25px)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#fff',
                                            fontFamily: "'Philosopher', serif",
                                        }}
                                    >
                                        {selectedHero.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#c8a870',
                                            fontFamily: "'Montserrat', sans-serif",
                                        }}
                                    >
                                        {selectedHero.title}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Stats & Lore Panel */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Stat Bars */}
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#e2c082',
                                        textTransform: 'uppercase',
                                        marginBottom: '12px',
                                        fontFamily: "'Montserrat', sans-serif",
                                    }}
                                >
                                    Боевые Характеристики
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* HP */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ color: '#9ca3af' }}>❤️ Здоровье</span>
                                            <span style={{ color: '#fff', fontWeight: 700 }}>{selectedHero.stats.hp}</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min((selectedHero.stats.hp / 1200) * 100, 100)}%`, background: '#ef4444' }} />
                                        </div>
                                    </div>

                                    {/* Attack */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ color: '#9ca3af' }}>⚔️ Атака</span>
                                            <span style={{ color: '#fff', fontWeight: 700 }}>{selectedHero.stats.attack}</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min((selectedHero.stats.attack / 50) * 100, 100)}%`, background: '#f59e0b' }} />
                                        </div>
                                    </div>

                                    {/* Defense */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ color: '#9ca3af' }}>🛡️ Защита</span>
                                            <span style={{ color: '#fff', fontWeight: 700 }}>{selectedHero.stats.defense}</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min((selectedHero.stats.defense / 25) * 100, 100)}%`, background: '#3b82f6' }} />
                                        </div>
                                    </div>

                                    {/* Speed */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ color: '#9ca3af' }}>⚡ Скорость</span>
                                            <span style={{ color: '#fff', fontWeight: 700 }}>{selectedHero.stats.speed}</span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min((selectedHero.stats.speed / 2.5) * 100, 100)}%`, background: '#10b981' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lore Snippet */}
                            <div
                                style={{
                                    flex: 1,
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    overflowY: 'auto',
                                    fontSize: '12px',
                                    color: '#d1d5db',
                                    lineHeight: 1.6,
                                    fontFamily: "'Montserrat', sans-serif",
                                }}
                            >
                                <div style={{ fontSize: '11px', color: '#c8a870', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                                    Летопись Персонажа
                                </div>
                                <div style={{ whiteSpace: 'pre-line' }}>{selectedHero.lore || 'Легенда этого героя хранится в тайне...'}</div>
                            </div>

                            {/* Equip CTA */}
                            <button
                                onClick={handleEquip}
                                disabled={selectedHero.id === equippedHeroId}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '10px',
                                    border: selectedHero.id === equippedHeroId ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #c8a870',
                                    background: selectedHero.id === equippedHeroId ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #c8a870 0%, #9e7338 100%)',
                                    color: selectedHero.id === equippedHeroId ? '#6b7280' : '#160e05',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    cursor: selectedHero.id === equippedHeroId ? 'default' : 'pointer',
                                    boxShadow: selectedHero.id === equippedHeroId ? 'none' : '0 4px 15px rgba(200, 168, 112, 0.35)',
                                    transition: 'all 0.15s ease',
                                    fontFamily: "'Philosopher', serif",
                                }}
                            >
                                {selectedHero.id === equippedHeroId ? '✓ Этот герой уже выбран' : '⚔️ Выбрать зверя в бой'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
