import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { audioService } from '../../../../services/AudioService';
import { AssetsMap } from '../../../../configs/AssetsMap';

export interface Particle {
    id: number;
    x: number;
    y: number;
    emoji: string;
}

// Decay constants — HARDCORE mode
export const HUNGER_DECAY_AMOUNT = 20;
export const HUNGER_DECAY_INTERVAL_MS = 1 * 60 * 60 * 1000; // 1 hour
export const HAPPY_DECAY_AMOUNT = 10;
export const HAPPY_DECAY_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Format milliseconds into a human-readable string like "2 ч 30 мин" or "45 мин"
export const formatTime = (ms: number): string => {
    const totalMin = Math.max(0, Math.ceil(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0 && m > 0) return `${h} ч ${m} мин`;
    if (h > 0) return `${h} ч`;
    return `${m} мин`;
};

// Russian declension helper for pet name: "Дракоша" -> "Дракошу"
export const declinePetName = (name: string) => {
    if (name === 'Дракоша') return 'Дракошу';
    if (name.endsWith('а')) return name.slice(0, -1) + 'у';
    return name;
};

export const useBestiary = () => {
    const { pet, gold, crystals } = useGameStore();
    const [actionLog, setActionLog] = useState<string>('Ваш питомец счастлив видеть вас!');
    const [isAnimating, setIsAnimating] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);

    // UI state toggles
    const [isHovered, setIsHovered] = useState(false);
    const [showFoodSelector, setShowFoodSelector] = useState(false);

    // Dynamic dragon illustration state
    const [dragonState, setDragonState] = useState<'idle' | 'happy' | 'sad' | 'sleep'>('idle');
    const idleTimeRef = useRef(0);

    // Ref to track all pending setTimeout IDs for safe cleanup on unmount
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Helper: schedule a timeout and track it
    const scheduleTimeout = (fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            // Remove this id from the list once it fires
            timeoutRefs.current = timeoutRefs.current.filter((t) => t !== id);
            fn();
        }, ms);
        timeoutRefs.current.push(id);
        return id;
    };

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
        const happyDecayCount = Math.floor((now - lastHappinessDecay) / HAPPY_DECAY_INTERVAL_MS);

        if (hungerDecayCount > 0 || happyDecayCount > 0) {
            useGameStore.setState((state: any) => ({
                pet: {
                    ...state.pet,
                    hunger: Math.max(0, state.pet.hunger - hungerDecayCount * HUNGER_DECAY_AMOUNT),
                    happiness: Math.max(0, state.pet.happiness - happyDecayCount * HAPPY_DECAY_AMOUNT),
                    lastHungerDecay: lastHungerDecay + hungerDecayCount * HUNGER_DECAY_INTERVAL_MS,
                    lastHappinessDecay: lastHappinessDecay + happyDecayCount * HAPPY_DECAY_INTERVAL_MS,
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
                        hunger: Math.max(0, state.pet.hunger - hdc * HUNGER_DECAY_AMOUNT),
                        happiness: Math.max(0, state.pet.happiness - adc * HAPPY_DECAY_AMOUNT),
                        lastHungerDecay: lhd + hdc * HUNGER_DECAY_INTERVAL_MS,
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
                },
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
                        },
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
            scheduleTimeout(() => {
                setParticles((prev) => prev.filter((item) => item.id !== p.id));
            }, 2000);
        }, 2000);
        return () => clearInterval(interval);
    }, [dragonState]);

    // Cleanup all pending timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach((id) => clearTimeout(id));
            timeoutRefs.current = [];
        };
    }, []);

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
                return '/assets/images/ui/pet_dragon_happy.webp';
            case 'sad':
                return '/assets/images/ui/pet_dragon_sad.webp';
            case 'sleep':
                return '/assets/images/ui/pet_dragon_sleep.webp';
            default:
                return '/assets/images/ui/pet_dragon.webp';
        }
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
        scheduleTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 1500);

        scheduleTimeout(() => {
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
            scheduleTimeout(() => {
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
        scheduleTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 1500);

        scheduleTimeout(() => {
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
            scheduleTimeout(() => {
                const refreshed = useGameStore.getState().pet;
                setDragonState(refreshed.hunger < 35 || refreshed.happiness < 35 ? 'sad' : 'idle');
            }, 1500);
        }, 500);
    };

    return {
        pet,
        gold,
        crystals,
        actionLog,
        setActionLog,
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
    };
};
