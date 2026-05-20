import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

interface Particle {
    id: number;
    x: number;
    y: number;
    emoji: string;
}

// Custom Premium Action Button (replaces placeholder images to prevent sword/ranked text overlaps)
const PetActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    colorScheme?: 'gold' | 'green' | 'red';
}> = ({ onClick, disabled, children, colorScheme = 'gold' }) => {
    const goldGrad = 'linear-gradient(180deg, #eab308 0%, #ca8a04 50%, #854d0e 100%)';
    const greenGrad = 'linear-gradient(180deg, #10b981 0%, #059669 50%, #065f46 100%)';
    const redGrad = 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)';
    
    const baseColor = colorScheme === 'gold' ? '#eab308' : colorScheme === 'green' ? '#10b981' : '#ef4444';

    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.04, boxShadow: `0 0 25px ${baseColor}66` }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            onClick={disabled ? undefined : onClick}
            style={{
                flex: 1,
                height: '65px',
                background: disabled 
                    ? 'linear-gradient(180deg, #2b1d11 0%, #1a1008 100%)' 
                    : colorScheme === 'gold' ? goldGrad : colorScheme === 'green' ? greenGrad : redGrad,
                border: `3px solid ${disabled ? '#4a3219' : '#fef08a'}`,
                borderRadius: '18px',
                color: disabled ? '#8a5a2a' : '#fff',
                fontSize: '15px',
                fontWeight: 900,
                cursor: disabled ? 'not-allowed' : 'pointer',
                letterSpacing: '2px',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                boxShadow: disabled ? 'none' : '0 6px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Philosopher', sans-serif",
                textTransform: 'uppercase',
            }}
        >
            {/* Top glass reflection highlight */}
            {!disabled && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '50%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                        pointerEvents: 'none',
                    }}
                />
            )}
            {children}
        </motion.button>
    );
};

// Custom Premium Progress Bar (animates smoothly with spring physics and a shiny moving shimmer)
const PetProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div
            style={{
                height: '18px',
                width: '100%',
                backgroundColor: '#0c0a09',
                borderRadius: '9px',
                border: '2px solid #3e2b18',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)',
            }}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    boxShadow: `0 0 15px ${color}aa`,
                    borderRadius: '7px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Shining moving shimmer line overlay */}
                <div
                    className="shimmer-effect"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                        width: '100%',
                        height: '100%',
                        animation: 'shimmer 2.5s infinite linear',
                    }}
                />
            </motion.div>
        </div>
    );
};

// Decay constants — HARDCORE mode
// Hunger: -20% every 1 hour  → empty in 5h, critical (<35%) in ~3.25h
// Happiness: -10% every 30 min → empty in 5h, critical (<35%) in ~3.25h
const HUNGER_DECAY_AMOUNT = 20;
const HUNGER_DECAY_INTERVAL_MS = 1 * 60 * 60 * 1000;   // 1 hour
const HAPPY_DECAY_AMOUNT  = 10;
const HAPPY_DECAY_INTERVAL_MS  = 30 * 60 * 1000;        // 30 minutes

// Format milliseconds into a human-readable string like "2 ч 30 мин" or "45 мин"
const formatTime = (ms: number): string => {
    const totalMin = Math.max(0, Math.ceil(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0 && m > 0) return `${h} ч ${m} мин`;
    if (h > 0) return `${h} ч`;
    return `${m} мин`;
};

export const BestiaryWindow: React.FC = () => {
    const { pet, gold, crystals } = useGameStore();
    const [actionLog, setActionLog] = useState<string>('Ваш питомец счастлив видеть вас!');
    const [isAnimating, setIsAnimating] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    
    // UI state toggles
    const [isHovered, setIsHovered] = useState(false);
    const [showFoodSelector, setShowFoodSelector] = useState(false);

    // Dynamic dragon illustration state
    const [dragonState, setDragonState] = useState<'idle' | 'happy' | 'sad' | 'sleep'>('idle');
    const idleTimeRef = React.useRef(0);

    // Petting charge recovery limits
    const petCharges = pet.petCharges !== undefined ? pet.petCharges : 5;
    
    // UI state for live ticking timers
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const lastPetTime = pet.lastPetTime !== undefined ? pet.lastPetTime : currentTime;
    const [timerText, setTimerText] = useState('');

    // --- OFFLINE DECAY: apply hunger/happiness loss for time spent away ---
    useEffect(() => {
        const now = Date.now();
        const lastHungerDecay = pet.lastHungerDecay ?? now;
        const lastHappinessDecay = pet.lastHappinessDecay ?? now;

        const hungerDecayCount = Math.floor((now - lastHungerDecay) / HUNGER_DECAY_INTERVAL_MS);
        const happyDecayCount  = Math.floor((now - lastHappinessDecay) / HAPPY_DECAY_INTERVAL_MS);

        if (hungerDecayCount > 0 || happyDecayCount > 0) {
            useGameStore.setState((state: any) => ({
                pet: {
                    ...state.pet,
                    hunger:    Math.max(0, state.pet.hunger    - hungerDecayCount * HUNGER_DECAY_AMOUNT),
                    happiness: Math.max(0, state.pet.happiness - happyDecayCount  * HAPPY_DECAY_AMOUNT),
                    lastHungerDecay:    lastHungerDecay    + hungerDecayCount * HUNGER_DECAY_INTERVAL_MS,
                    lastHappinessDecay: lastHappinessDecay + happyDecayCount  * HAPPY_DECAY_INTERVAL_MS,
                },
            }));
        }
    // Run only on mount (once)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // LIVE DECAY: tick every minute while window is open
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            useGameStore.setState((state: any) => {
                const lhd = state.pet.lastHungerDecay ?? now;
                const lad = state.pet.lastHappinessDecay ?? now;
                const hdc = Math.floor((now - lhd) / HUNGER_DECAY_INTERVAL_MS);
                const adc = Math.floor((now - lad) / HAPPY_DECAY_INTERVAL_MS);
                if (hdc === 0 && adc === 0) return {};
                return {
                    pet: {
                        ...state.pet,
                        hunger:    Math.max(0, state.pet.hunger    - hdc * HUNGER_DECAY_AMOUNT),
                        happiness: Math.max(0, state.pet.happiness - adc * HAPPY_DECAY_AMOUNT),
                        lastHungerDecay:    lhd + hdc * HUNGER_DECAY_INTERVAL_MS,
                        lastHappinessDecay: lad + adc * HAPPY_DECAY_INTERVAL_MS,
                    },
                };
            });
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Ensure store is initialized with petting limits
    useEffect(() => {
        if (pet.petCharges === undefined || pet.lastPetTime === undefined) {
            useGameStore.setState((state: any) => ({
                pet: {
                    ...state.pet,
                    petCharges: 5,
                    lastPetTime: Date.now(),
                }
            }));
        }
    }, [pet]);

    // Handle initial state setup based on stats
    useEffect(() => {
        if (dragonState === 'sleep' || dragonState === 'happy') return;
        
        // Wrap in setTimeout to avoid synchronous cascading renders
        const timer = setTimeout(() => {
            if (pet.hunger < 35 || pet.happiness < 35) {
                setDragonState('sad');
            } else {
                setDragonState('idle');
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [pet.hunger, pet.happiness, dragonState]);

    // Sync energy charge timers
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const timePassed = now - lastPetTime;
            const rechargeMs = 60 * 60 * 1000; // 1 hour per charge

            if (petCharges < 5) {
                if (timePassed >= rechargeMs) {
                    const added = Math.floor(timePassed / rechargeMs);
                    const newCharges = Math.min(5, petCharges + added);
                    const remainder = timePassed % rechargeMs;
                    useGameStore.setState((state: any) => ({
                        pet: {
                            ...state.pet,
                            petCharges: newCharges,
                            lastPetTime: now - remainder,
                        }
                    }));
                }
                
                // Update local countdown string
                const elapsed = now - lastPetTime;
                const remaining = Math.max(0, rechargeMs - elapsed);
                const sec = Math.ceil(remaining / 1000);
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                setTimerText(`${m}:${s < 10 ? '0' : ''}${s}`);
            } else {
                setTimerText('');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [petCharges, lastPetTime]);

    // Sleeping idle counter
    useEffect(() => {
        if (dragonState === 'happy') return;
        const interval = setInterval(() => {
            idleTimeRef.current += 1;
            if (idleTimeRef.current >= 8 && dragonState !== 'sleep') {
                setDragonState('sleep');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [dragonState]);

    // Periodically float Zzz particles during sleep
    useEffect(() => {
        if (dragonState !== 'sleep') return;
        const interval = setInterval(() => {
            const p = {
                id: Math.random(),
                x: Math.random() * 60 - 30,
                y: Math.random() * 30 - 90, // float up from head
                emoji: '💤',
            };
            setParticles((prev) => [...prev, p]);
            setTimeout(() => {
                setParticles((prev) => prev.filter((item) => item.id !== p.id));
            }, 2000);
        }, 2000);
        return () => clearInterval(interval);
    }, [dragonState]);

    const resetIdle = () => {
        idleTimeRef.current = 0;
        if (dragonState === 'sleep') {
            setDragonState(pet.hunger < 35 || pet.happiness < 35 ? 'sad' : 'idle');
        }
    };

    // Get current sprite file path based on state
    const getDragonSprite = () => {
        switch (dragonState) {
            case 'happy':
                return '/assets/images/ui/pet_dragon_happy.png';
            case 'sad':
                return '/assets/images/ui/pet_dragon_sad.png';
            case 'sleep':
                return '/assets/images/ui/pet_dragon_sleep.png';
            default:
                return '/assets/images/ui/pet_dragon.png';
        }
    };

    // Russian declension helper for pet name: "Дракоша" -> "Дракошу"
    const declinePetName = (name: string) => {
        if (name === 'Дракоша') return 'Дракошу';
        if (name.endsWith('а')) return name.slice(0, -1) + 'у';
        return name;
    };

    const getPetBubbleText = () => {
        if (dragonState === 'sleep') return 'Хррр... Zzz... 💤';
        if (isHovered) return 'Щекотно! Хи-хи... 🥰✨';
        if (pet.hunger < 30) return 'Ррр! Жрать охота! 🥩';
        if (pet.happiness < 30) return 'Мне грустно... Погладь! 🥺';
        if (pet.happiness > 90 && pet.hunger > 90) return 'Я полон сил! Вперед к приключениям! ⚡';
        return 'Мурр... Хорошо быть драконом! 🐉❤️';
    };

    const handleFeedItem = (type: 'meat' | 'berry' | 'crystal') => {
        const store = useGameStore.getState();
        const currentGold = store.gold;
        const currentCrystals = store.crystals;

        let cost = 0;
        let currency: string = 'gold';
        let hungerBonus = 0;
        let happinessBonus = 0;
        let expBonus = 0;
        let emoji = '';
        let foodName = '';

        if (type === 'meat') {
            cost = 1500;
            currency = 'gold';
            hungerBonus = 30;
            happinessBonus = 15;
            expBonus = 12;
            emoji = '🥩';
            foodName = 'Кусок Мяса';
        } else if (type === 'berry') {
            cost = 2500;
            currency = 'gold';
            hungerBonus = 40;
            happinessBonus = 25;
            expBonus = 22;
            emoji = '🫐';
            foodName = 'Лесную Чернику';
        } else if (type === 'crystal') {
            cost = 20;
            currency = 'crystals';
            hungerBonus = 65;
            happinessBonus = 55;
            expBonus = 40;
            emoji = '🥘';
            foodName = 'Жаркое Феникса';
        }

        if (pet.hunger >= 100) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            setActionLog(`${pet.name} уже полностью сыт!`);
            return;
        }

        const balance = currency === 'gold' ? currentGold : currentCrystals;
        if (balance < cost) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            setActionLog(`Недостаточно ${currency === 'gold' ? 'золота' : 'алмазов'}!`);
            return;
        }

        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        resetIdle();
        setDragonState('happy');
        setIsAnimating(true);

        // Spawn food particles
        const newParticles = Array.from({ length: 6 }).map((_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 160 - 80,
            y: Math.random() * 100 - 50,
            emoji: emoji,
        }));
        setParticles((prev) => [...prev, ...newParticles]);
        setTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 1500);

        setTimeout(() => {
            const newState = useGameStore.getState().pet;
            const newExp = newState.exp + expBonus;
            let newLevel = newState.level;
            let log = `Вы скормили ${declinePetName(pet.name)} ${foodName}! +${hungerBonus} сытости, +${happinessBonus} счастья, +${expBonus} опыта`;

            if (newExp >= 100) {
                newLevel++;
                log = `✨ УРОВЕНЬ ПОВЫШЕН! ${pet.name} теперь ${newLevel} уровня!`;
                audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP);
            }

            useGameStore.setState((state: any) => ({
                gold: currency === 'gold' ? state.gold - cost : state.gold,
                crystals: currency === 'crystals' ? state.crystals - cost : state.crystals,
                pet: {
                    ...state.pet,
                    hunger: Math.min(100, state.pet.hunger + hungerBonus),
                    happiness: Math.min(100, state.pet.happiness + happinessBonus),
                    exp: newExp % 100,
                    level: newLevel,
                },
            }));
            setActionLog(log);
            setIsAnimating(false);
            
            // Delay returning to normal/sad state
            setTimeout(() => {
                const refreshed = useGameStore.getState().pet;
                setDragonState(refreshed.hunger < 35 || refreshed.happiness < 35 ? 'sad' : 'idle');
            }, 1500);
        }, 500);
    };

    const handlePet = () => {
        if (petCharges <= 0) {
            audioService.playSFX(AssetsMap.AUDIO.SFX_ERROR);
            setActionLog(`Нет энергии ласки! Подождите восстановления.`);
            return;
        }

        audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
        resetIdle();
        setDragonState('happy');
        setIsAnimating(true);

        // Spawn heart and spark particles
        const newParticles = Array.from({ length: 7 }).map((_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 160 - 80,
            y: Math.random() * 100 - 50,
            emoji: Math.random() > 0.5 ? '❤️' : '✨',
        }));
        setParticles((prev) => [...prev, ...newParticles]);
        setTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 1500);

        setTimeout(() => {
            const newState = useGameStore.getState().pet;
            const newExp = newState.exp + 15;
            let newLevel = newState.level;
            let log = `Вы погладили ${declinePetName(pet.name)}... +15 счастья, +15 опыта`;

            if (newExp >= 100) {
                newLevel++;
                log = `✨ УРОВЕНЬ ПОВЫШЕН! ${pet.name} теперь ${newLevel} уровня!`;
                audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP);
            }

            const nextCharges = petCharges - 1;
            useGameStore.setState((state: any) => ({
                pet: {
                    ...state.pet,
                    happiness: Math.min(100, state.pet.happiness + 15),
                    exp: newExp % 100,
                    level: newLevel,
                    petCharges: nextCharges,
                    lastPetTime: nextCharges === 4 ? Date.now() : state.pet.lastPetTime,
                },
            }));
            setActionLog(log);
            setIsAnimating(false);

            // Delay returning to normal/sad state
            setTimeout(() => {
                const refreshed = useGameStore.getState().pet;
                setDragonState(refreshed.hunger < 35 || refreshed.happiness < 35 ? 'sad' : 'idle');
            }, 1500);
        }, 500);
    };

    return (
        <div style={{ padding: '40px', display: 'flex', gap: '50px', color: '#fff', height: '100%', alignItems: 'center' }}>
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
                    onMouseEnter={() => { setIsHovered(true); resetIdle(); }}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        width: '360px',
                        height: '360px',
                        background: 'radial-gradient(circle, rgba(240,192,64,0.22) 0%, rgba(0,0,0,0.65) 65%, transparent 72%)',
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
                            background: 'repeating-conic-gradient(from 0deg, rgba(240,192,64,0.05) 0deg 15deg, transparent 15deg 30deg)',
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
                                animation: isAnimating ? 'none' : dragonState === 'sleep' ? 'none' : 'float 4s ease-in-out infinite',
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
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', justifyContent: 'center' }}>
                {/* Stats Container Card */}
                <div
                    style={{
                        background: 'rgba(10, 8, 6, 0.65)',
                        padding: '22px 28px',
                        borderRadius: '24px',
                        border: '2px solid rgba(196, 139, 59, 0.25)',
                        boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    {/* Hunger Row */}
                    {(() => {
                        const msPerTick = HUNGER_DECAY_INTERVAL_MS;
                        const lastDecay = pet.lastHungerDecay ?? currentTime;
                        const msUntilNextTick = msPerTick - ((currentTime - lastDecay) % msPerTick);
                        // How many full ticks until hunger hits 35 (sad threshold)?
                        const ticksToSad = Math.max(0, Math.ceil((pet.hunger - 35) / HUNGER_DECAY_AMOUNT));
                        const msToSad = msUntilNextTick + Math.max(0, ticksToSad - 1) * msPerTick;
                        const ticksToEmpty = Math.max(0, Math.ceil(pet.hunger / HUNGER_DECAY_AMOUNT));
                        const msToEmpty = msUntilNextTick + Math.max(0, ticksToEmpty - 1) * msPerTick;
                        const isCritical = pet.hunger < 35;
                        const isLow = pet.hunger < 60 && !isCritical;
                        return (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a7f3d0', fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>
                                        🥩 СЫТОСТЬ
                                    </span>
                                    <span style={{ color: isCritical ? '#f87171' : isLow ? '#fbbf24' : '#10b981', fontWeight: 900, fontSize: '15px' }}>
                                        {pet.hunger}%
                                    </span>
                                </div>
                                <PetProgressBar value={pet.hunger} max={100} color={isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
                                    <span style={{ color: isCritical ? '#f87171' : '#6b7280' }}>
                                        {isCritical
                                            ? '⚠️ Голодает! Срочно накормите'
                                            : `Проголодается через ≈ ${formatTime(msToSad)}`}
                                    </span>
                                    <span style={{ color: '#4b5563' }}>Опустеет через ≈ {pet.hunger === 0 ? 'уже пусто' : formatTime(msToEmpty)}</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Happiness Row */}
                    {(() => {
                        const msPerTick = HAPPY_DECAY_INTERVAL_MS;
                        const lastDecay = pet.lastHappinessDecay ?? currentTime;
                        const msUntilNextTick = msPerTick - ((currentTime - lastDecay) % msPerTick);
                        const ticksToSad = Math.max(0, Math.ceil((pet.happiness - 35) / HAPPY_DECAY_AMOUNT));
                        const msToSad = msUntilNextTick + Math.max(0, ticksToSad - 1) * msPerTick;
                        const ticksToEmpty = Math.max(0, Math.ceil(pet.happiness / HAPPY_DECAY_AMOUNT));
                        const msToEmpty = msUntilNextTick + Math.max(0, ticksToEmpty - 1) * msPerTick;
                        const isCritical = pet.happiness < 35;
                        const isLow = pet.happiness < 60 && !isCritical;
                        return (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fde68a', fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>
                                        ❤️ СЧАСТЬЕ
                                    </span>
                                    <span style={{ color: isCritical ? '#f87171' : isLow ? '#fbbf24' : '#f59e0b', fontWeight: 900, fontSize: '15px' }}>
                                        {pet.happiness}%
                                    </span>
                                </div>
                                <PetProgressBar value={pet.happiness} max={100} color={isCritical ? '#ef4444' : isLow ? '#fbbf24' : '#f59e0b'} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
                                    <span style={{ color: isCritical ? '#f87171' : '#6b7280' }}>
                                        {isCritical
                                            ? '⚠️ Грустит! Погладьте питомца'
                                            : `Загрустит через ≈ ${formatTime(msToSad)}`}
                                    </span>
                                    <span style={{ color: '#4b5563' }}>Нулевое через ≈ {pet.happiness === 0 ? 'уже пусто' : formatTime(msToEmpty)}</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Experience Row */}
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                                fontSize: '15px',
                                fontWeight: 800,
                                letterSpacing: '1px',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bfdbfe' }}>
                                ⭐ ОПЫТ
                            </span>
                            <span style={{ color: '#3b82f6', fontWeight: 900 }}>{pet.exp} / 100</span>
                        </div>
                        <PetProgressBar value={pet.exp} max={100} color="#3b82f6" />
                    </div>
                </div>

                {/* DYNAMIC ACTION VIEW OR FOOD SHOP */}
                <div style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {showFoodSelector ? (
                        /* FOOD SELECTOR SUB-PANEL */
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                background: 'rgba(10, 8, 6, 0.75)',
                                padding: '20px',
                                borderRadius: '20px',
                                border: '2px solid rgba(16, 185, 129, 0.3)',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                            }}
                        >
                            {/* Header with Balances */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', fontWeight: 900, color: '#a7f3d0', letterSpacing: '1px' }}>
                                    ВЫБЕРИТЕ КОРМ:
                                </span>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 800, alignItems: 'center' }}>
                                    <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <img src="/assets/images/ui/icons/Gold.webp" style={{ width: '18px', height: '18px', objectFit: 'contain' }} alt="gold" />
                                        {gold.toLocaleString()}
                                    </span>
                                    <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <img src="/assets/images/ui/icons/almaz.webp" style={{ width: '18px', height: '18px', objectFit: 'contain' }} alt="crystal" />
                                        {crystals.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Row of 3 Food Options */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {/* Meat Option */}
                                <motion.div
                                    whileHover={{ scale: 1.04, borderColor: '#10b981' }}
                                    onClick={() => handleFeedItem('meat')}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(20, 15, 12, 0.85)',
                                        border: '2px solid rgba(196, 139, 59, 0.2)',
                                        borderRadius: '16px',
                                        padding: '10px 4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>🥩</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Мясо</span>
                                    <span style={{ fontSize: '10px', color: '#a7f3d0' }}>+30 🍗 +15 ❤️ | +12 ⭐</span>
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: '8px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        1 500 <img src="/assets/images/ui/icons/Gold.webp" style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="g" />
                                    </div>
                                </motion.div>

                                {/* Berry Option */}
                                <motion.div
                                    whileHover={{ scale: 1.04, borderColor: '#10b981' }}
                                    onClick={() => handleFeedItem('berry')}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(20, 15, 12, 0.85)',
                                        border: '2px solid rgba(196, 139, 59, 0.2)',
                                        borderRadius: '16px',
                                        padding: '10px 4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>🫐</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Черника</span>
                                    <span style={{ fontSize: '10px', color: '#a7f3d0' }}>+40 🍗 +25 ❤️ | +22 ⭐</span>
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: '8px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        2 500 <img src="/assets/images/ui/icons/Gold.webp" style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="g" />
                                    </div>
                                </motion.div>

                                {/* Phoenix Feast Option */}
                                <motion.div
                                    whileHover={{ scale: 1.04, borderColor: '#f97316' }}
                                    onClick={() => handleFeedItem('crystal')}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(160deg, rgba(30, 15, 5, 0.9) 0%, rgba(50, 20, 5, 0.85) 100%)',
                                        border: '2px solid rgba(251, 146, 60, 0.4)',
                                        borderRadius: '16px',
                                        padding: '10px 4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        textAlign: 'center',
                                        boxShadow: '0 0 12px rgba(251,146,60,0.15)',
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>🥘</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fed7aa' }}>Жаркое Феникса</span>
                                    <span style={{ fontSize: '10px', color: '#fdba74' }}>+65 🍗 +55 ❤️ | +40 ⭐</span>
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#fb923c', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: '8px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        20 <img src="/assets/images/ui/icons/almaz.webp" style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="gem" />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Back text */}
                            <button
                                onClick={() => setShowFoodSelector(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#9ca3af',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    textDecoration: 'underline',
                                }}
                            >
                                Вернуться к действиям
                            </button>
                        </motion.div>
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
                                    onClick={() => { setShowFoodSelector(true); resetIdle(); }}
                                    colorScheme="green"
                                >
                                    <span>КОРМЛЕНИЕ 🥩</span>
                                </PetActionButton>
                                
                                <PetActionButton
                                    onClick={handlePet}
                                    colorScheme="gold"
                                    disabled={petCharges <= 0}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px' }}>ПОГЛАДИТЬ ✨ {petCharges}/5</span>
                                        {petCharges < 5 && (
                                            <span style={{ fontSize: '10px', color: '#fef08a', textTransform: 'none', fontWeight: 500, marginTop: '2px' }}>
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



