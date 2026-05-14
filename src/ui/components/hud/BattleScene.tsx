import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { BattleEngine, BattleState } from '../../../engine/core/BattleEngine';
import { motion, AnimatePresence } from 'framer-motion';

export const BattleScene: React.FC = () => {
    const { selectedHeroId, selectedEnemyId, goToMainMenu, getCalculatedStats } = useGameStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);
    
    const [battleState, setBattleState] = useState<BattleState>({
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...'
    });

    const playerHero = HEROES_DB.find(h => h.id === selectedHeroId) || HEROES_DB[0];
    const enemyData = MOBS_DB.find(m => m.id === selectedEnemyId) || MOBS_DB[0];

    useEffect(() => {
        if (!containerRef.current) return;

        const playerStats = getCalculatedStats(selectedHeroId);
        // Для врага создаем временные статы на основе базы монстров
        const enemyStats = {
            hp: enemyData.baseStats.hp,
            attack: enemyData.baseStats.attack,
            speed: enemyData.baseStats.speed,
            critChance: enemyData.baseStats.crit,
            defense: enemyData.baseStats.defense,
            dodge: 0
        };

        if (!playerStats) {
            setBattleState(prev => ({ ...prev, log: 'ОШИБКА: ГЕРОЙ НЕ НАЙДЕН' }));
            return;
        }

        const engine = BattleEngine.getInstance();
        engineRef.current = engine;
        (window as any).__BATTLE_ENGINE__ = engine; // РЕГИСТРАЦИЯ ДЛЯ АДМИНКИ
        
        engine.onStateChange = (newState) => {
            setBattleState({ ...newState });
        };

        let destroyed = false;
        const run = async () => {
            if (engineRef.current?.isInitialized) return;
            console.log('[BattleScene] Starting async run...');
            if (containerRef.current) {
                await engine.init(containerRef.current, selectedHeroId, selectedEnemyId, playerStats, enemyStats).catch((err) => {
                    console.error('[BattleScene] Критическая ошибка инициализации боя:', err);
                });
                if (!destroyed) console.log('Battle ready — units on stage');
            }
        };
        run();

        return () => {
            destroyed = true;
            engine.destroy();
            (window as any).__BATTLE_ENGINE__ = null;
        };
    }, [selectedHeroId, selectedEnemyId, getCalculatedStats, enemyData]);

    return (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 500, overflow: 'hidden' }}>
            <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />
            
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
                <div style={{ padding: '40px 100px', display: 'flex', justifyContent: 'space-between' }}>
                    {/* PLAYER */}
                    <div style={{ width: '500px' }}>
                        <div style={{ color: '#fff', fontSize: '28px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>{playerHero.name}</div>
                        <div style={{ height: '24px', background: 'rgba(0,0,0,0.6)', border: '2px solid #f0c040', marginTop: '10px', position: 'relative', overflow: 'hidden' }}>
                            <motion.div 
                                animate={{ width: `${(battleState.playerHP / battleState.playerMaxHP) * 100}%` }} 
                                transition={{ duration: 0.3 }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #ef4444, #991b1b)' }} 
                            />
                        </div>
                    </div>

                    {/* LOG */}
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={battleState.log}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            style={{ color: '#f0c040', fontSize: '36px', textAlign: 'center', fontFamily: "'Cinzel', serif", fontWeight: 'bold' }}
                        >
                            {battleState.log}
                        </motion.div>
                    </AnimatePresence>

                    {/* ENEMY */}
                    <div style={{ width: '500px', textAlign: 'right' }}>
                        <div style={{ color: '#fff', fontSize: '28px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>{enemyData.name}</div>
                        <div style={{ height: '24px', background: 'rgba(0,0,0,0.6)', border: '2px solid #ef4444', marginTop: '10px', position: 'relative', overflow: 'hidden' }}>
                            <motion.div 
                                animate={{ width: `${(battleState.enemyHP / battleState.enemyMaxHP) * 100}%` }} 
                                transition={{ duration: 0.3 }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #1e40af)', float: 'right' }} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={goToMainMenu} 
                style={{
                    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    padding: '15px 40px', background: 'rgba(0,0,0,0.8)', border: '2px solid #f0c040',
                    color: '#f0c040', borderRadius: '10px', cursor: 'pointer', zIndex: 200,
                    fontSize: '20px', fontWeight: 900, fontFamily: "'Cinzel', serif"
                }}
            >
                В ГОРОД
            </button>
        </div>
    );
};
