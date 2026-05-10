import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { BattleEngine, BattleState } from '../../../engine/core/BattleEngine';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BattleScene - Чистый UI-оверлей над игровым движком.
 * Теперь компонент не знает ничего о PixiJS и спрайтах,
 * он только отображает состояние боя.
 */
export const BattleScene: React.FC = () => {
    const { selectedHeroId, goToMainMenu, getCalculatedStats } = useGameStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);
    
    // UI стейт (только то, что нужно для оверлея)
    const [battleState, setBattleState] = useState<BattleState>({
        playerHP: 100,
        enemyHP: 100,
        log: 'ПОДГОТОВКА...'
    });

    const playerHero = HEROES_DB.find(h => h.id === selectedHeroId) || HEROES_DB[0];
    const enemyHero = HEROES_DB.find(h => h.id === 'wild_boar') || HEROES_DB[1];

    useEffect(() => {
        if (!containerRef.current) return;

        // Собираем статы для боя
        const playerStats = getCalculatedStats(selectedHeroId);
        const enemyStats = getCalculatedStats('wild_boar') || getCalculatedStats(HEROES_DB[1].id);

        if (!playerStats || !enemyStats) {
            setBattleState(prev => ({ ...prev, log: 'ОШИБКА: ГЕРОЙ НЕ НАЙДЕН' }));
            return;
        }

        // Создаем и инициализируем движок
        const engine = new BattleEngine();
        engineRef.current = engine;
        
        // Подписываемся на изменения состояния в движке
        engine.onStateChange = (newState) => {
            setBattleState({ ...newState });
        };

        engine.init(containerRef.current, selectedHeroId, playerStats, enemyStats);

        return () => {
            engine.destroy();
        };
    }, [selectedHeroId, getCalculatedStats]);

    return (
        <div className="absolute inset-0 bg-black z-[500] pointer-events-auto overflow-hidden">
            {/* Игровой холст (управляется BattleEngine) */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />
            
            {/* UI Оверлей (React) */}
            <div className="absolute inset-0 pointer-events-none z-[100]">
                {/* Верхняя панель со статами */}
                <div className="p-[40px_100px] flex justify-between">
                    {/* Игрок */}
                    <div className="w-[500px]">
                        <div className="text-white text-[28px] font-['Cinzel'] uppercase tracking-wider">{playerHero.name}</div>
                        <div className="h-[24px] bg-black/60 border-2 border-[#f0c040] mt-[10px] relative overflow-hidden">
                            <motion.div 
                                animate={{ width: `${battleState.playerHP}%` }} 
                                transition={{ duration: 0.3 }}
                                className="h-full bg-gradient-to-r from-red-500 to-red-800 shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                            />
                        </div>
                    </div>

                    {/* Лог боя по центру */}
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={battleState.log}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="text-[#f0c040] text-[36px] text-center font-['Cinzel'] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        >
                            {battleState.log}
                        </motion.div>
                    </AnimatePresence>

                    {/* Противник */}
                    <div className="w-[500px] text-right">
                        <div className="text-white text-[28px] font-['Cinzel'] uppercase tracking-wider">{enemyHero.name}</div>
                        <div className="h-[24px] bg-black/60 border-2 border-red-500 mt-[10px] relative overflow-hidden">
                            <motion.div 
                                animate={{ width: `${battleState.enemyHP}%` }} 
                                transition={{ duration: 0.3 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-800 float-right shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Кнопка выхода */}
            <button 
                onClick={goToMainMenu} 
                className="absolute bottom-[40px] left-1/2 -translate-x-1/2 p-[15px_40px] bg-black/80 border-2 border-[#f0c040] text-[#f0c040] rounded-[10px] cursor-pointer pointer-events-auto z-[200] text-[20px] font-black font-['Cinzel'] hover:bg-[#f0c040] hover:text-black transition-all duration-300"
            >
                В ЦИТАДЕЛЬ
            </button>
        </div>
    );
};
