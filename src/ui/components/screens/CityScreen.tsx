import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { audioService } from '../../../services/AudioService';

import { SLOT_SYMBOLS, SlotSymbol, Particle, getRandomSymbol, generateTrack } from './city/CitySlotLogic';
import { BuildingHotspot } from './city/BuildingHotspot';
import { CitySlotMachine } from './city/CitySlotMachine';

export const CityScreen: React.FC = () => {
    const isMobile = useGameStore((state) => state.isMobile);
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const goToShop = useGameStore((state) => state.goToShop);
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
            {/*
            <BuildingHotspot
                x="64%"
                y="82%"
                label="КУЗНИЦА"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    goToForge();
                }}
            />
            */}

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

            {/* ТАВЕРНА и ЗАЛ СЛАВЫ скрыты, так как они не завершены и ведут к отклонению приложения модерацией VK */}
            {/*
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

            <BuildingHotspot
                x="86%"
                y="46%"
                label="ЗАЛ СЛАВЫ"
                onClick={() => setModalText('Зал Славы станет доступен в следующем обновлении. Копите победы!')}
            />
            */}

            <BuildingHotspot
                x="32%"
                y="16%"
                label="ОБИТЕЛЬ ДРЕВНИХ"
                onClick={() => {
                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                    useGameStore.setState({ activeScreen: 'SANCTUARY' });
                }}
            />

            <BuildingHotspot x="78%" y="78%" label="МАГАЗИН" onClick={() => goToShop('BANK')} />

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

                    {/* Slot Machine */}
                    <CitySlotMachine
                        winLineActive={winLineActive}
                        particles={particles}
                        winSymbolId={null}
                        reel1Spinning={reel1Spinning}
                        reel2Spinning={reel2Spinning}
                        reel3Spinning={reel3Spinning}
                        reel1={reel1}
                        reel2={reel2}
                        reel3={reel3}
                        controls1={controls1}
                        controls2={controls2}
                        controls3={controls3}
                        leverPulling={leverPulling}
                        isSpinning={isSpinning}
                        turboMode={turboMode}
                        autoSpin={autoSpin}
                        lastSummonType={lastSummonType}
                        setTurboMode={setTurboMode}
                        setAutoSpin={setAutoSpin}
                        handleSummon={handleSummon}
                    />

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
