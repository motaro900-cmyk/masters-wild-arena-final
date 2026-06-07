import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';

interface SlotSymbol {
    id: string;
    emoji: string;
    label: string;
    color: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    type: 'crystal' | 'coin';
    targetRotation: number;
}

const SLOT_SYMBOLS: SlotSymbol[] = [
    { id: 'panda', emoji: '🐼', label: 'ПАНДА', color: '#ffcc00' },
    { id: 'raccoon', emoji: '🦝', label: 'ЕНОТ', color: '#a855f7' },
    { id: 'monkey', emoji: '🐵', label: 'ОБЕЗЬЯНА', color: '#3b82f6' },
    { id: 'tiger', emoji: '🐯', label: 'ТИГР', color: '#ef4444' },
    { id: 'rabbit', emoji: '🐰', label: 'КРОЛИК', color: '#10b981' },
    { id: 'bear', emoji: '🐻', label: 'МЕДВЕДЬ', color: '#f97316' },
];

const getRandomSymbol = (): SlotSymbol => {
    return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
};

const generateTrack = (currentSymbols: SlotSymbol[], winSymbol: SlotSymbol, length: number): SlotSymbol[] => {
    const track = [...currentSymbols];
    while (track.length < 3) {
        track.push(getRandomSymbol());
    }
    const midLength = length - 6;
    for (let i = 0; i < midLength; i++) {
        track.push(getRandomSymbol());
    }
    track.push(getRandomSymbol());
    track.push(winSymbol);
    track.push(getRandomSymbol());
    return track;
};

export const CityScreen: React.FC = () => {
    const isMobile = useGameStore((state) => state.isMobile);
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const goToShop = useGameStore((state) => state.goToShop);
    const goToForge = useGameStore((state) => state.goToForge);
    const openChest = useGameStore((state) => state.openChest);
    const crystals = useGameStore((state) => state.crystals);

    const [modalText, setModalText] = useState<string | null>(null);
    const showSummonOverlay = useGameStore((state) => state.showSummonOverlay) || false;
    const setShowSummonOverlay = useGameStore((state) => state.setShowSummonOverlay);

    // Slot machine state
    const [isSpinning, setIsSpinning] = useState(false);
    const [reel1Spinning, setReel1Spinning] = useState(false);
    const [reel2Spinning, setReel2Spinning] = useState(false);
    const [reel3Spinning, setReel3Spinning] = useState(false);

    const [winLineActive, setWinLineActive] = useState(false);
    const [showGrandReveal, setShowGrandReveal] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);

    const [rewards, setRewards] = useState<any[] | null>(null);
    const [turboMode, setTurboMode] = useState(false);
    const [autoSpin, setAutoSpin] = useState(false);
    const [leverPulling, setLeverPulling] = useState(false);
    const [lastSummonType, setLastSummonType] = useState<'SINGLE' | 'MULTI'>('SINGLE');

    const [reel1, setReel1] = useState<SlotSymbol[]>(() => [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
    const [reel2, setReel2] = useState<SlotSymbol[]>(() => [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
    const [reel3, setReel3] = useState<SlotSymbol[]>(() => [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);

    const controls1 = useAnimation();
    const controls2 = useAnimation();
    const controls3 = useAnimation();

    // Refs for async safety
    const reel1Ref = useRef(reel1);
    const reel2Ref = useRef(reel2);
    const reel3Ref = useRef(reel3);
    const turboModeRef = useRef(turboMode);
    const isSpinningRef = useRef(isSpinning);
    const lastSummonTypeRef = useRef<'SINGLE' | 'MULTI'>('SINGLE');

    // Sync refs
    useEffect(() => {
        reel1Ref.current = reel1;
    }, [reel1]);
    useEffect(() => {
        reel2Ref.current = reel2;
    }, [reel2]);
    useEffect(() => {
        reel3Ref.current = reel3;
    }, [reel3]);
    useEffect(() => {
        turboModeRef.current = turboMode;
    }, [turboMode]);
    useEffect(() => {
        isSpinningRef.current = isSpinning;
    }, [isSpinning]);

    const renderReelSymbols = (symbols: SlotSymbol[]) => {
        return symbols.map((sym, idx) => {
            const isCenterSymbol = symbols.length === 3 ? idx === 1 : false;
            const isFlashing = winLineActive && isCenterSymbol;

            return (
                <div
                    key={idx}
                    style={{
                        width: '100%',
                        height: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        borderBottom: '1px solid rgba(240, 192, 64, 0.05)',
                        background: `radial-gradient(circle at center, ${sym.color}15 0%, transparent 70%)`,
                        animation: isFlashing ? 'pulseGlow 0.8s infinite ease-in-out' : 'none',
                        transform: isFlashing ? 'scale(1.08)' : 'scale(1)',
                        transition: 'transform 0.3s ease-in-out',
                    }}
                >
                    <div
                        style={{
                            fontSize: '48px',
                            filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 10px ${sym.color}40)`,
                        }}
                    >
                        {sym.emoji}
                    </div>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: '900',
                            color: sym.color,
                            letterSpacing: '1.5px',
                            marginTop: '6px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        }}
                    >
                        {sym.label}
                    </div>
                </div>
            );
        });
    };

    const handleSummon = useCallback(
        async (type: 'SINGLE' | 'MULTI') => {
            if (isSpinningRef.current) return;

            const result = openChest(type);
            if (!result) {
                useGameStore.getState().showAlert('Недостаточно кристаллов!');
                setAutoSpin(false);
                return;
            }

            lastSummonTypeRef.current = type;
            setLastSummonType(type);
            setIsSpinning(true);
            setWinLineActive(false);
            setParticles([]);
            setRewards(null);
            setShowGrandReveal(false);
            setLeverPulling(true);
            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);

            // Reset lever pull animation state
            setTimeout(() => {
                setLeverPulling(false);
            }, 400);

            // Map the result to win symbol
            const targetHeroId = result[0]?.heroId || 'panda';
            const winSymbol = SLOT_SYMBOLS.find((s) => s.id === targetHeroId) || SLOT_SYMBOLS[0];

            const isTurbo = turboModeRef.current;
            const baseLength1 = isTurbo ? 10 : 25;
            const baseLength2 = isTurbo ? 14 : 35;
            const baseLength3 = isTurbo ? 18 : 45;

            const t1 = generateTrack(reel1Ref.current, winSymbol, baseLength1);
            const t2 = generateTrack(reel2Ref.current, winSymbol, baseLength2);
            const t3 = generateTrack(reel3Ref.current, winSymbol, baseLength3);

            setReel1Spinning(true);
            setReel2Spinning(true);
            setReel3Spinning(true);

            setReel1(t1);
            setReel2(t2);
            setReel3(t3);

            requestAnimationFrame(() => {
                const symbolHeight = 120;
                const targetY1 = -((t1.length - 3) * symbolHeight);
                const targetY2 = -((t2.length - 3) * symbolHeight);
                const targetY3 = -((t3.length - 3) * symbolHeight);

                // Sequential Stops
                controls1
                    .start({
                        y: targetY1,
                        transition: {
                            type: 'spring',
                            stiffness: isTurbo ? 200 : 35,
                            damping: isTurbo ? 18 : 10,
                            mass: 0.8,
                        },
                    })
                    .then(() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
                        setReel1Spinning(false);
                        setReel1([t1[t1.length - 3], t1[t1.length - 2], t1[t1.length - 1]]);
                    });

                controls2
                    .start({
                        y: targetY2,
                        transition: {
                            type: 'spring',
                            stiffness: isTurbo ? 150 : 28,
                            damping: isTurbo ? 18 : 10,
                            mass: 0.8,
                        },
                    })
                    .then(() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
                        setReel2Spinning(false);
                        setReel2([t2[t2.length - 3], t2[t2.length - 2], t2[t2.length - 1]]);
                    });

                controls3
                    .start({
                        y: targetY3,
                        transition: {
                            type: 'spring',
                            stiffness: isTurbo ? 100 : 22,
                            damping: isTurbo ? 18 : 10,
                            mass: 0.8,
                        },
                    })
                    .then(() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_HIT);
                        setReel3Spinning(false);
                        setReel3([t3[t3.length - 3], t3[t3.length - 2], t3[t3.length - 1]]);

                        // Spin complete
                        audioService.playSFX(AssetsMap.AUDIO.SFX_BUY);
                        setIsSpinning(false);

                        // Trigger visual win animations
                        setWinLineActive(true);

                        // Generate coin/crystal cascade particles
                        const newParticles: Particle[] = [];
                        for (let i = 0; i < 35; i++) {
                            newParticles.push({
                                id: Math.random(),
                                x: Math.random() * 100,
                                y: -50 - Math.random() * 150,
                                size: 20 + Math.random() * 20,
                                delay: Math.random() * 1.5,
                                duration: 1.5 + Math.random() * 1.5,
                                type: Math.random() > 0.5 ? 'crystal' : 'coin',
                                targetRotation: 360 * (Math.random() > 0.5 ? 1 : -1),
                            });
                        }
                        setParticles(newParticles);

                        const displayDelay = isTurbo ? 800 : 1500;
                        setTimeout(() => {
                            if (autoSpin) {
                                setRewards(result);
                            } else {
                                setShowGrandReveal(true);
                                setRewards(result);
                            }
                        }, displayDelay);
                    });
            });
        },
        [openChest, controls1, controls2, controls3, autoSpin],
    );

    // Auto-spin trigger next spin
    useEffect(() => {
        let timer: number;
        if (autoSpin && !isSpinning && winLineActive) {
            const delay = turboMode ? 1200 : 2500;
            timer = window.setTimeout(() => {
                setWinLineActive(false);
                setParticles([]);
                setRewards(null);
                const cost = lastSummonTypeRef.current === 'SINGLE' ? 100 : 950;
                if (crystals >= cost) {
                    handleSummon(lastSummonTypeRef.current);
                } else {
                    setAutoSpin(false);
                    useGameStore.getState().showAlert('Недостаточно кристаллов!');
                }
            }, delay);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [autoSpin, isSpinning, winLineActive, crystals, handleSummon, turboMode]);

    // Handle edge case: if player turns off autoSpin while win line is active, open the grand reveal modal
    useEffect(() => {
        if (!autoSpin && winLineActive && !showGrandReveal && !isSpinning) {
            const timer = setTimeout(() => {
                setShowGrandReveal(true);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [autoSpin, winLineActive, showGrandReveal, isSpinning]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: '1920px',
                height: '1080px',
                backgroundImage: `url(${isMobile ? AssetsMap.BACKGROUNDS.CITY_HUB_MOBILE : AssetsMap.BACKGROUNDS.CITY_HUB})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0c0c0c',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 9999,
                pointerEvents: 'auto',
            }}
        >
            {/* Overlay Gradient for depth */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Title / Back Button */}
            <div
                style={{
                    position: 'absolute',
                    top: '40px',
                    left: '40px',
                    zIndex: 10,
                }}
            >
                <button
                    onClick={() => {
                        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                        goToMainMenu();
                    }}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(20, 15, 10, 0.85)',
                        border: '2px solid #c8a870',
                        borderRadius: '12px',
                        color: '#f0c040',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 5px 25px rgba(0,0,0,0.7)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <span>←</span> В ЛАГЕРЬ
                </button>
            </div>

            {/* ИНТЕРАКТИВНЫЕ ЗОНЫ (Хотспоты) */}

            {/* 1. КУЗНИЦА */}
            <BuildingHotspot
                x="64%"
                y="82%"
                label="КУЗНИЦА"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    goToForge();
                }}
            />

            {/* 2. ЗВЕРИНЕЦ */}
            <BuildingHotspot
                x="8%"
                y="65%"
                label="ЗВЕРИНЕЦ"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    if ((window as any).setActiveHUDWindow) {
                        (window as any).setActiveHUDWindow('BESTIARY');
                    } else {
                        setModalText('Зверинец: здесь будут жить ваши питомцы! Функция станет доступна позже.');
                    }
                }}
            />

            {/* 3. ТАВЕРНА */}
            <BuildingHotspot
                x="53%"
                y="43%"
                label="ТАВЕРНА"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    if (setShowSummonOverlay) {
                        setShowSummonOverlay(true);
                    }
                }}
            />

            {/* 4. ЗАЛ СЛАВЫ */}
            <BuildingHotspot
                x="86%"
                y="46%"
                label="ЗАЛ СЛАВЫ"
                onClick={() => setModalText('Зал Славы станет доступен в следующем обновлении. Копите победы!')}
            />

            {/* 5. ОБИТЕЛЬ ДРЕВНИХ */}
            <BuildingHotspot
                x="32%"
                y="16%"
                label="ОБИТЕЛЬ ДРЕВНИХ"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    useGameStore.setState({ activeScreen: 'SANCTUARY' });
                }}
            />

            {/* 6. РЫНОК */}
            <BuildingHotspot x="78%" y="78%" label="РЫНОК" onClick={() => goToShop('BANK')} />

            {/* Custom Modal */}
            {modalText && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100000,
                        backdropFilter: 'blur(5px)',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(20, 15, 10, 0.95)',
                            border: '2px solid #c8a870',
                            borderRadius: '16px',
                            padding: '40px',
                            textAlign: 'center',
                            maxWidth: '500px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                        }}
                    >
                        <h3
                            style={{
                                color: '#f0c040',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '24px',
                                marginBottom: '20px',
                                letterSpacing: '2px',
                            }}
                        >
                            ИНФОРМАЦИЯ
                        </h3>
                        <p style={{ color: '#fff', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
                            {modalText}
                        </p>
                        <button
                            onClick={() => setModalText(null)}
                            style={{
                                padding: '12px 40px',
                                background: 'linear-gradient(135deg, #c8a870 0%, #a6844a 100%)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            ПОНЯТНО
                        </button>
                    </div>
                </div>
            )}

            {/* Summon Overlay (Gacha Slot Machine) */}
            {showSummonOverlay && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${isMobile ? AssetsMap.BACKGROUNDS.GACHA_MOBILE : AssetsMap.BACKGROUNDS.GACHA})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100000,
                        filter: 'contrast(1.05) saturate(1.1)',
                    }}
                >
                    {/* Falling particles cascade */}
                    {winLineActive &&
                        particles.map((p) => (
                            <motion.img
                                key={p.id}
                                src={p.type === 'crystal' ? AssetsMap.UI.ICON_ALMAZ_FULL : AssetsMap.UI.ICON_GOLD_FULL}
                                initial={{ y: p.y, x: `${p.x}%`, rotate: 0 }}
                                animate={{
                                    y: 1100,
                                    rotate: p.targetRotation,
                                }}
                                transition={{
                                    duration: p.duration,
                                    delay: p.delay,
                                    ease: 'linear',
                                    repeat: Infinity,
                                }}
                                style={{
                                    position: 'absolute',
                                    width: `${p.size}px`,
                                    height: `${p.size}px`,
                                    pointerEvents: 'none',
                                    zIndex: 150,
                                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
                                }}
                            />
                        ))}

                    {/* Crystals Counter top-right */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '40px',
                            right: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(10, 5, 2, 0.85)',
                            padding: '12px 24px',
                            borderRadius: '16px',
                            border: '2px solid #c8a870',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                            zIndex: 10,
                        }}
                    >
                        <img
                            src={AssetsMap.UI.ICON_ALMAZ_FULL}
                            style={{ width: '28px', height: '28px' }}
                            alt="crystals"
                        />
                        <span
                            style={{
                                color: '#fff',
                                fontSize: '22px',
                                fontWeight: 'bold',
                                fontFamily: "'Cinzel', serif",
                            }}
                        >
                            {crystals}
                        </span>
                    </div>

                    {/* Exit Button */}
                    <button
                        onClick={() => {
                            if (!isSpinning) {
                                audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                setAutoSpin(false);
                                setWinLineActive(false);
                                setParticles([]);
                                setRewards(null);
                                setShowGrandReveal(false);
                                if (setShowSummonOverlay) {
                                    setShowSummonOverlay(false);
                                }
                            }
                        }}
                        disabled={isSpinning}
                        style={{
                            position: 'absolute',
                            bottom: '50px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '200px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#7f1d1d',
                            border: '1px solid #c8a870',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                            color: '#f0c040',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '20px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            cursor: isSpinning ? 'not-allowed' : 'pointer',
                            opacity: isSpinning ? 0.3 : 0.8,
                            transition: 'all 0.2s',
                            zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                            if (!isSpinning) {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSpinning) {
                                e.currentTarget.style.opacity = '0.8';
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                            }
                        }}
                    >
                        <span>ВЫХОД</span>
                    </button>

                    {/* Header */}
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.75)',
                            padding: '16px 48px',
                            borderRadius: '16px',
                            border: '1px solid rgba(240, 192, 64, 0.4)',
                            backdropFilter: 'blur(10px)',
                            marginBottom: '35px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(240,192,64,0.1)',
                        }}
                    >
                        <motion.h2
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{
                                color: '#f0c040',
                                background: 'linear-gradient(to bottom, #fff 20%, #f0c040 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '44px',
                                marginBottom: '6px',
                                letterSpacing: '6px',
                                textShadow: '0 4px 10px rgba(0,0,0,0.9)',
                                fontWeight: 900,
                            }}
                        >
                            ТАВЕРНА ПРИЗЫВА
                        </motion.h2>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '13px',
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '2px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                            }}
                        >
                            Испытай удачу и собери осколки великих героев
                        </p>
                    </div>

                    {/* Slot Machine Container with Lever */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '40px',
                            marginBottom: '40px',
                            position: 'relative',
                        }}
                    >
                        {/* Golden/Bronze Cabinet */}
                        <div
                            style={{
                                width: '500px',
                                height: '420px',
                                background: 'linear-gradient(135deg, #2a2015 0%, #15100a 100%)',
                                border: '4px solid #c8a870',
                                borderRadius: '24px',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(0, 0, 0, 0.9)',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '30px 20px 20px 20px',
                                boxSizing: 'border-box',
                            }}
                        >
                            {/* Decorative Marquee Banner / flashing Победа banner */}
                            {winLineActive ? (
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.6 }}
                                    style={{
                                        position: 'absolute',
                                        top: '-24px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                        border: '3px solid #f0c040',
                                        borderRadius: '12px',
                                        padding: '6px 30px',
                                        fontSize: '18px',
                                        fontWeight: '900',
                                        fontFamily: "'Cinzel', serif",
                                        color: '#fff',
                                        letterSpacing: '3px',
                                        boxShadow: '0 0 25px #ef4444, 0 0 10px #f0c040',
                                        zIndex: 10,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    💥 ПОБЕДА! 💥
                                </motion.div>
                            ) : (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-16px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(240, 192, 64, 0.9)',
                                        border: '2px solid #fff',
                                        borderRadius: '10px',
                                        padding: '4px 20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        fontFamily: "'Cinzel', serif",
                                        color: '#000',
                                        letterSpacing: '2px',
                                        boxShadow: '0 0 15px #f0c040',
                                        zIndex: 10,
                                    }}
                                >
                                    JACKPOT SUMMON
                                </div>
                            )}

                            {/* Payline Overlay Laser */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    right: '10px',
                                    top: 'calc(50% - 62px)',
                                    height: '124px',
                                    borderTop: '2px dashed rgba(240, 192, 64, 0.7)',
                                    borderBottom: '2px dashed rgba(240, 192, 64, 0.7)',
                                    background: 'rgba(240, 192, 64, 0.04)',
                                    borderRadius: '8px',
                                    pointerEvents: 'none',
                                    zIndex: 5,
                                    boxShadow: 'inset 0 0 10px rgba(240, 192, 64, 0.1)',
                                }}
                            />

                            {/* Pulsing Win Line */}
                            {winLineActive && (
                                <motion.div
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    style={{
                                        position: 'absolute',
                                        left: '10px',
                                        right: '10px',
                                        top: 'calc(50% - 2px)',
                                        height: '4px',
                                        background:
                                            'linear-gradient(90deg, transparent, #f0c040, #fff, #f0c040, transparent)',
                                        boxShadow: '0 0 15px #f0c040, 0 0 30px #f0c040',
                                        zIndex: 8,
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}

                            {/* Side arrows pointing to the payline */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '-5px',
                                    top: 'calc(50% - 12px)',
                                    color: '#f0c040',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 8px #f0c040',
                                    zIndex: 6,
                                }}
                            >
                                ▶
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    right: '-5px',
                                    top: 'calc(50% - 12px)',
                                    color: '#f0c040',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 8px #f0c040',
                                    zIndex: 6,
                                }}
                            >
                                ◀
                            </div>

                            {/* REEL 1 */}
                            <div
                                style={{
                                    width: '140px',
                                    height: '360px',
                                    background: 'rgba(5, 3, 2, 0.85)',
                                    borderRadius: '16px',
                                    border: '2px solid #5a452a',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
                                        pointerEvents: 'none',
                                        zIndex: 4,
                                    }}
                                />
                                {reel1Spinning ? (
                                    <motion.div
                                        animate={controls1}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {renderReelSymbols(reel1)}
                                    </motion.div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {renderReelSymbols(reel1.slice(-3))}
                                    </div>
                                )}
                            </div>

                            {/* REEL 2 */}
                            <div
                                style={{
                                    width: '140px',
                                    height: '360px',
                                    background: 'rgba(5, 3, 2, 0.85)',
                                    borderRadius: '16px',
                                    border: '2px solid #5a452a',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
                                        pointerEvents: 'none',
                                        zIndex: 4,
                                    }}
                                />
                                {reel2Spinning ? (
                                    <motion.div
                                        animate={controls2}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {renderReelSymbols(reel2)}
                                    </motion.div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {renderReelSymbols(reel2.slice(-3))}
                                    </div>
                                )}
                            </div>

                            {/* REEL 3 */}
                            <div
                                style={{
                                    width: '140px',
                                    height: '360px',
                                    background: 'rgba(5, 3, 2, 0.85)',
                                    borderRadius: '16px',
                                    border: '2px solid #5a452a',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.8) 100%)',
                                        pointerEvents: 'none',
                                        zIndex: 4,
                                    }}
                                />
                                {reel3Spinning ? (
                                    <motion.div
                                        animate={controls3}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {renderReelSymbols(reel3)}
                                    </motion.div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                        }}
                                    >
                                        {renderReelSymbols(reel3.slice(-3))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pullable Mechanical Lever */}
                        <div
                            style={{
                                width: '60px',
                                height: '360px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: isSpinning ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => {
                                if (!isSpinning) {
                                    handleSummon('SINGLE');
                                }
                            }}
                            onMouseEnter={(e) => {
                                if (!isSpinning) {
                                    e.currentTarget.style.filter = 'brightness(1.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = 'none';
                            }}
                        >
                            {/* Base Mount cylinder */}
                            <div
                                style={{
                                    width: '32px',
                                    height: '40px',
                                    background: 'linear-gradient(to right, #4a3b2c, #2a1f15)',
                                    border: '2px solid #c8a870',
                                    borderLeft: 'none',
                                    borderRadius: '0 8px 8px 0',
                                    position: 'absolute',
                                    left: '-5px',
                                    top: '200px',
                                    boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
                                }}
                            />

                            {/* Rotating Shaft/Arm & Knob */}
                            <motion.div
                                animate={leverPulling ? { rotate: 75 } : { rotate: -15 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: leverPulling ? 350 : 120,
                                    damping: leverPulling ? 15 : 8,
                                }}
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '80px',
                                    height: '140px',
                                    width: '10px',
                                    background: 'linear-gradient(to right, #e2e8f0, #94a3b8, #475569)',
                                    borderRadius: '5px',
                                    transformOrigin: 'center 120px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Sphere Knob */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-26px',
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle at 30% 30%, #ff4d4d, #b30000)',
                                        border: '2px solid #ff9999',
                                        boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 -4px 8px rgba(0,0,0,0.4)',
                                    }}
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* CONTROL PANEL DASHBOARD */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                            background: 'rgba(15, 10, 5, 0.9)',
                            padding: '20px 40px',
                            borderRadius: '20px',
                            border: '2px solid #5a452a',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                        }}
                    >
                        {/* Toggles (Turbo and Auto-Spin) */}
                        <div style={{ display: 'flex', gap: '30px' }}>
                            {/* Turbo Mode Toggle */}
                            <button
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setTurboMode((prev) => !prev);
                                }}
                                style={{
                                    padding: '10px 24px',
                                    background: turboMode
                                        ? 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)'
                                        : 'rgba(20, 15, 10, 0.85)',
                                    border: `2px solid ${turboMode ? '#22d3ee' : '#5a452a'}`,
                                    color: turboMode ? '#fff' : '#888',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: turboMode ? '0 0 15px rgba(34, 211, 238, 0.4)' : 'none',
                                    letterSpacing: '1px',
                                }}
                            >
                                ТУРБО: {turboMode ? 'ВКЛ' : 'ВЫКЛ'}
                            </button>

                            {/* Auto-Spin Toggle */}
                            <button
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    setAutoSpin((prev) => !prev);
                                }}
                                style={{
                                    padding: '10px 24px',
                                    background: autoSpin
                                        ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
                                        : 'rgba(20, 15, 10, 0.85)',
                                    border: `2px solid ${autoSpin ? '#4ade80' : '#5a452a'}`,
                                    color: autoSpin ? '#fff' : '#888',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    fontFamily: "'Cinzel', serif",
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: autoSpin ? '0 0 15px rgba(74, 222, 128, 0.4)' : 'none',
                                    letterSpacing: '1px',
                                }}
                            >
                                АВТО-СПИН: {autoSpin ? 'ВКЛ' : 'ВЫКЛ'}
                            </button>
                        </div>

                        {/* SUMMON BUTTONS */}
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <button
                                onClick={() => handleSummon('SINGLE')}
                                disabled={isSpinning}
                                style={{
                                    padding: '18px 45px',
                                    background: isSpinning
                                        ? '#333'
                                        : 'linear-gradient(135deg, #f0c040 0%, #c8a870 100%)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontWeight: '900',
                                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '18px',
                                    letterSpacing: '2px',
                                    boxShadow: isSpinning ? 'none' : '0 10px 25px rgba(240,192,64,0.3)',
                                    transition: 'all 0.3s',
                                    opacity: isSpinning ? 0.7 : 1,
                                }}
                                onMouseEnter={(e) =>
                                    !isSpinning && (e.currentTarget.style.transform = 'translateY(-3px)')
                                }
                                onMouseLeave={(e) => !isSpinning && (e.currentTarget.style.transform = 'translateY(0)')}
                            >
                                {isSpinning && lastSummonType === 'SINGLE' ? (
                                    'КРУТИМ...'
                                ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        ПРИЗЫВ X1 (100{' '}
                                        <img
                                            src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                            style={{ width: '22px', height: '22px' }}
                                            alt="diamond"
                                        />
                                        )
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleSummon('MULTI')}
                                disabled={isSpinning}
                                style={{
                                    padding: '18px 45px',
                                    background: isSpinning
                                        ? '#222'
                                        : 'linear-gradient(135deg, #1f1a10 0%, #0a0500 100%)',
                                    color: '#f0c040',
                                    border: '2px solid #f0c040',
                                    borderRadius: '14px',
                                    fontWeight: '900',
                                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '18px',
                                    letterSpacing: '2px',
                                    transition: 'all 0.3s',
                                    opacity: isSpinning ? 0.3 : 1,
                                    boxShadow: isSpinning ? 'none' : '0 10px 25px rgba(0,0,0,0.5)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSpinning) {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.background = 'rgba(240,192,64,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSpinning) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.background =
                                            'linear-gradient(135deg, #1f1a10 0%, #0a0500 100%)';
                                    }
                                }}
                            >
                                {isSpinning && lastSummonType === 'MULTI' ? (
                                    'КРУТИМ...'
                                ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        ПРИЗЫВ X10 (950{' '}
                                        <img
                                            src={AssetsMap.UI.ICON_ALMAZ_FULL}
                                            style={{ width: '22px', height: '22px' }}
                                            alt="diamond"
                                        />
                                        )
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ОКНО НАГРАДЫ (GRAND REVEAL) */}
                    <AnimatePresence>
                        {showGrandReveal && rewards && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: '#0a0505',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 200,
                                }}
                            >
                                {/* Background glow burst */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '600px',
                                        height: '600px',
                                        background:
                                            'radial-gradient(circle, rgba(240,192,64,0.15) 0%, transparent 70%)',
                                        zIndex: -1,
                                    }}
                                />

                                <motion.h3
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
                                    style={{
                                        color: '#f0c040',
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: '42px',
                                        marginBottom: '40px',
                                        letterSpacing: '4px',
                                        textShadow: '0 0 20px rgba(240,192,64,0.3)',
                                    }}
                                >
                                    ВЫ ПОЛУЧИЛИ:
                                </motion.h3>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '25px',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        maxWidth: '900px',
                                        marginBottom: '60px',
                                    }}
                                >
                                    {rewards.map((r, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0, opacity: 0, rotateY: 90 }}
                                            animate={{
                                                scale: 1,
                                                opacity: 1,
                                                rotateY: 0,
                                                transition: { delay: 0.4 + i * 0.1, type: 'spring', stiffness: 100 },
                                            }}
                                            style={{
                                                padding: '30px 20px',
                                                background:
                                                    'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                                                border: '1px solid rgba(200,168,112,0.4)',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '15px',
                                                width: '130px',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '4px',
                                                    background:
                                                        'linear-gradient(to right, transparent, #c8a870, transparent)',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    fontSize: '42px',
                                                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))',
                                                }}
                                            >
                                                💎
                                            </div>
                                            <span
                                                style={{
                                                    color: '#fff',
                                                    fontWeight: '900',
                                                    fontSize: '13px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                }}
                                            >
                                                {r.heroId}
                                            </span>
                                            <div
                                                style={{
                                                    background: '#c8a870',
                                                    color: '#000',
                                                    padding: '3px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                x{r.amount}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, transition: { delay: 1.5 } }}
                                    onClick={() => {
                                        setShowGrandReveal(false);
                                        setRewards(null);
                                        setWinLineActive(false);
                                        setParticles([]);
                                    }}
                                    style={{
                                        padding: '14px 60px',
                                        background: 'linear-gradient(135deg, #c8a870 0%, #a6844a 100%)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: '18px',
                                        letterSpacing: '2px',
                                        boxShadow: '0 5px 15px rgba(200,168,112,0.3)',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    ОТЛИЧНО
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

interface HotspotProps {
    x: string;
    y: string;
    label: string;
    onClick: () => void;
}

const BuildingHotspot: React.FC<HotspotProps> = ({ x, y, label, onClick }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 5,
            }}
        >
            {/* Marker / Glow */}
            <div
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(240,192,64,0.6) 0%, transparent 70%)',
                    border: '2px solid rgba(240,192,64,0.4)',
                    boxShadow: '0 0 20px rgba(240,192,64,0.3)',
                    animation: 'pulse 2s infinite ease-in-out',
                }}
            />

            {/* Label */}
            <div
                style={{
                    background: 'rgba(15, 10, 5, 0.85)',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: '1px solid #c8a870',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
                @keyframes pulseGlow {
                    0% { filter: brightness(1) drop-shadow(0 0 15px rgba(240,192,64,0.8)); }
                    50% { filter: brightness(1.35) drop-shadow(0 0 30px rgba(240,192,64,1)); }
                    100% { filter: brightness(1) drop-shadow(0 0 15px rgba(240,192,64,0.8)); }
                }
            `}</style>
        </motion.div>
    );
};
