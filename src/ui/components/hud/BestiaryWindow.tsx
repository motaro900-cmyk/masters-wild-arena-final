import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { GfxProgressBar, GfxMenuButton } from './SharedUI';

export const BestiaryWindow: React.FC = () => {
    const { pet } = useGameStore();
    const [actionLog, setActionLog] = useState<string>('Ваш питомец счастлив видеть вас!');
    const [isAnimating, setIsAnimating] = useState(false);

    const getPetEmoji = () => {
        if (pet.hunger < 30) return '🤤';
        if (pet.happiness < 30) return '😢';
        if (pet.happiness > 90 && pet.hunger > 90) return '🐲✨';
        return '🐲';
    };

    const handleFeed = () => {
        if (pet.hunger >= 100) {
            setActionLog(`${pet.name} уже сыт!`);
            return;
        }
        setIsAnimating(true);
        setTimeout(() => {
            useGameStore.setState((state: any) => ({
                pet: { ...state.pet, hunger: Math.min(100, state.pet.hunger + 20), exp: state.pet.exp + 5 },
            }));
            setActionLog(`Вы покормили ${pet.name}! +20 сытости`);
            setIsAnimating(false);
        }, 500);
    };

    const handlePet = () => {
        setIsAnimating(true);
        setTimeout(() => {
            const newState = useGameStore.getState().pet;
            const newExp = newState.exp + 15;
            let newLevel = newState.level;
            let log = `Вы погладили ${pet.name}... +15 счастья`;

            if (newExp >= 100) {
                newLevel++;
                log = `✨ УРОВЕНЬ ПОВЫШЕН! ${pet.name} теперь ${newLevel} уровня!`;
            }

            useGameStore.setState((state: any) => ({
                pet: {
                    ...state.pet,
                    happiness: Math.min(100, state.pet.happiness + 15),
                    exp: newExp % 100,
                    level: newLevel,
                },
            }));
            setActionLog(log);
            setIsAnimating(false);
        }, 500);
    };

    return (
        <div style={{ padding: '40px', display: 'flex', gap: '40px', color: '#fff' }}>
            {/* ЛЕВАЯ ЧАСТЬ: ВИЗУАЛ ПИТОМЦА */}
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        width: '350px',
                        height: '350px',
                        background: 'radial-gradient(circle, rgba(196,139,59,0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    <motion.div
                        animate={isAnimating ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : { y: [0, -15, 0] }}
                        transition={
                            isAnimating ? { duration: 0.4 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                        }
                        style={{ fontSize: '130px', filter: 'drop-shadow(0 0 30px rgba(240,192,64,0.5))' }}
                    >
                        {getPetEmoji()}
                    </motion.div>
                </div>

                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '32px',
                        color: '#f0c040',
                        marginTop: '20px',
                        letterSpacing: '2px',
                    }}
                >
                    {pet.name}
                </h2>
                <span style={{ color: '#c48b3b', fontWeight: 900, fontSize: '14px', letterSpacing: '3px' }}>
                    УРОВЕНЬ {pet.level}
                </span>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: СТАТЫ И ДЕЙСТВИЯ */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '25px',
                        borderRadius: '20px',
                        border: '1px solid rgba(240,192,64,0.1)',
                    }}
                >
                    <div style={{ marginBottom: '20px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 800,
                            }}
                        >
                            <span>СЫТОСТЬ</span>
                            <span>{pet.hunger}%</span>
                        </div>
                        <GfxProgressBar value={pet.hunger} max={100} color="#10b981" />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 800,
                            }}
                        >
                            <span>СЧАСТЬЕ</span>
                            <span>{pet.happiness}%</span>
                        </div>
                        <GfxProgressBar value={pet.happiness} max={100} color="#f59e0b" />
                    </div>

                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 800,
                            }}
                        >
                            <span>ОПЫТ</span>
                            <span>{pet.exp} / 1000</span>
                        </div>
                        <GfxProgressBar value={pet.exp} max={1000} color="#3b82f6" />
                    </div>
                </div>

                {/* ЛОГ ДЕЙСТВИЙ */}
                <div
                    style={{
                        height: '60px',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 600,
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={actionLog}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {actionLog}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* КНОПКИ ДЕЙСТВИЙ */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <GfxMenuButton onClick={handleFeed} style={{ flex: 1, height: '60px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 900 }}>ПОКОРМИТЬ 🥩</span>
                    </GfxMenuButton>
                    <GfxMenuButton onClick={handlePet} style={{ flex: 1, height: '60px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 900 }}>ПОГЛАДИТЬ ✨</span>
                    </GfxMenuButton>
                </div>

                <div
                    style={{
                        marginTop: 'auto',
                        padding: '15px',
                        background: 'rgba(240,192,64,0.05)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: '#c8a870',
                        border: '1px dashed rgba(240,192,64,0.2)',
                    }}
                >
                    <b>СОВЕТ:</b> Заходите в Зверинец каждый день, чтобы ваш верный спутник чувствовал себя любимым и
                    сытым!
                </div>
            </div>
        </div>
    );
};
