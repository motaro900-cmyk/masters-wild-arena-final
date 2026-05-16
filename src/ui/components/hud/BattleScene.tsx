import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { BattleEngine, BattleState } from '../../../engine/core/BattleEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleResultScreen, BattleResultData } from './BattleResultScreen';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';

export const BattleScene: React.FC = () => {
    const { selectedHeroId, selectedEnemyId, goToMainMenu, getCalculatedStats } = useGameStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);

    const [battleState, setBattleState] = useState<BattleState>({
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...',
    });
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState<BattleResultData | null>(null);
    const [damageTexts, setDamageTexts] = useState<
        { id: number; text: string; x: number; y: number; isCritical: boolean }[]
    >([]);
    const [shake, setShake] = useState({ x: 0, y: 0 });

    // Refs to avoid stale closures in event listeners
    const battleStateRef = useRef(battleState);
    const showResultRef = useRef(showResult);

    useEffect(() => {
        battleStateRef.current = battleState;
    }, [battleState]);

    useEffect(() => {
        showResultRef.current = showResult;
    }, [showResult]);

    const playerHero = HEROES_DB.find((h) => h.id === selectedHeroId) || HEROES_DB[0];
    const enemyData = MOBS_DB.find((m) => m.id === selectedEnemyId) || MOBS_DB[0];

    // [Sound] Switch to battle music on mount
    useEffect(() => {
        audioService.playMusic(AssetsMap.AUDIO.MUSIC_MAIN);
        return () => {
            // Revert to city theme when leaving battle
            audioService.playMusic(AssetsMap.AUDIO.MUSIC_MAIN);
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const playerStats = getCalculatedStats(selectedHeroId);
        const enemyStats = {
            hp: enemyData.baseStats.hp,
            attack: enemyData.baseStats.attack,
            speed: enemyData.baseStats.speed,
            critChance: enemyData.baseStats.crit,
            defense: enemyData.baseStats.defense,
            dodge: 0,
        };

        if (!playerStats) {
            setTimeout(() => {
                setBattleState((prev) => ({ ...prev, log: 'ОШИБКА: ГЕРОЙ НЕ НАЙДЕН' }));
            }, 0);
            return;
        }

        const engine = BattleEngine.getInstance();
        engineRef.current = engine;

        engine.onStateChange = (newState) => {
            setBattleState({ ...newState });

            const prevBattleState = battleStateRef.current;

            // Если HP изменилось — значит был удар
            if (newState.playerHP < prevBattleState.playerHP || newState.enemyHP < prevBattleState.enemyHP) {
                const isPlayerHit = newState.playerHP < prevBattleState.playerHP;
                const damageTaken = isPlayerHit
                    ? prevBattleState.playerHP - newState.playerHP
                    : prevBattleState.enemyHP - newState.enemyHP;

                // Добавляем цифру урона
                const newDmg = {
                    id: Date.now() + Math.random(),
                    text: `-${Math.round(damageTaken)}`,
                    x: isPlayerHit ? 450 : 1450, // Координаты в PIXI мире
                    y: 400,
                    isCritical: damageTaken > 150, // Условный порог крита
                };
                setDamageTexts((prev) => [...prev, newDmg]);
                setShake({ x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 }); // Тряска
                setTimeout(() => setShake({ x: 0, y: 0 }), 100);
                setTimeout(() => setDamageTexts((prev) => prev.filter((d) => d.id !== newDmg.id)), 1000);
            }

            if ((newState.playerHP <= 0 || newState.enemyHP <= 0) && !showResultRef.current) {
                const isVictory = newState.enemyHP <= 0;
                const gold = isVictory ? 150 : 20;
                const xp = isVictory ? 300 : 50;
                const trophies = isVictory ? 25 : -15;

                setResultData({
                    isVictory,
                    goldEarned: gold,
                    xpEarned: xp,
                    trophiesChange: trophies,
                    damageDealt: (playerStats?.attack || 50) * 10,
                    turnsPlayed: 5,
                    enemyName: enemyData.name,
                });

                // НАЧИСЛЯЕМ НАГРАДЫ В СТОР
                const store = useGameStore.getState();
                store.addGold(gold);
                store.addExp(xp);
                store.addCombatLog(
                    `Бой завершен: ${isVictory ? 'Победа' : 'Поражение'}. Получено +${gold} золота, +${xp} опыта.`,
                );
                // Уровень и трофеи тоже нужно обновить
                if (isVictory) {
                    store.updateProfile({
                        trophies: store.trophies + trophies,
                        wins: store.wins + 1,
                        totalBattles: store.totalBattles + 1,
                    });
                } else {
                    store.updateProfile({
                        trophies: Math.max(0, store.trophies + trophies),
                        totalBattles: store.totalBattles + 1,
                    });
                }

                setTimeout(() => setShowResult(true), 1500);
            }
        };

        let destroyed = false;
        const run = async () => {
            if (engineRef.current?.isInitialized) return;
            console.log('[BattleScene] Starting async run...');
            if (containerRef.current) {
                await engine
                    .init(containerRef.current, selectedHeroId, selectedEnemyId, playerStats, enemyStats)
                    .catch((err) => {
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

    const isMobile = useGameStore((state) => state.isMobile);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: isMobile ? '100%' : '1920px',
                height: isMobile ? '100%' : '1080px',
                background: '#000',
                overflow: 'hidden',
                transform: `translate(${shake.x}px, ${shake.y}px)`,
                transition: 'transform 0.05s',
                pointerEvents: 'auto',
            }}
        >
            <div
                ref={containerRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
            />

            {/* DAMAGE TEXTS OVERLAY */}
            <AnimatePresence>
                {damageTexts.map((dmg) => (
                    <motion.div
                        key={dmg.id}
                        initial={{ opacity: 0, y: dmg.y, x: dmg.x, scale: 0.5 }}
                        animate={{ opacity: 1, y: dmg.y - 120, scale: dmg.isCritical ? 1.6 : 1 }}
                        exit={{ opacity: 0, scale: 2 }}
                        style={{
                            position: 'absolute',
                            pointerEvents: 'none',
                            color: dmg.isCritical ? '#facc15' : '#ef4444',
                            fontSize: dmg.isCritical ? '72px' : '54px',
                            fontWeight: 900,
                            textShadow: '0 0 15px rgba(0,0,0,0.8), 2px 2px 0 #000',
                            zIndex: 1000,
                            fontFamily: "'Cinzel', serif",
                        }}
                    >
                        {dmg.text}
                    </motion.div>
                ))}
            </AnimatePresence>

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
                <div style={{ padding: '40px 100px', display: 'flex', justifyContent: 'space-between' }}>
                    {/* PLAYER */}
                    <div style={{ width: '500px' }}>
                        <div
                            style={{
                                color: '#fff',
                                fontSize: '28px',
                                fontFamily: "'Cinzel', serif",
                                textTransform: 'uppercase',
                            }}
                        >
                            {playerHero.name}
                        </div>
                        <div
                            style={{
                                height: '24px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '2px solid #f0c040',
                                marginTop: '10px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <motion.div
                                animate={{ width: `${(battleState.playerHP / battleState.playerMaxHP) * 100}%` }}
                                transition={{ duration: 0.3 }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }}
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
                            style={{
                                color: '#f0c040',
                                fontSize: '36px',
                                textAlign: 'center',
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 'bold',
                            }}
                        >
                            {battleState.log}
                        </motion.div>
                    </AnimatePresence>

                    {/* ENEMY */}
                    <div style={{ width: '500px', textAlign: 'right' }}>
                        <div
                            style={{
                                color: '#fff',
                                fontSize: '28px',
                                fontFamily: "'Cinzel', serif",
                                textTransform: 'uppercase',
                            }}
                        >
                            {enemyData.name}
                        </div>
                        <div
                            style={{
                                height: '24px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '2px solid #ef4444',
                                marginTop: '10px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <motion.div
                                animate={{ width: `${(battleState.enemyHP / battleState.enemyMaxHP) * 100}%` }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #10b981, #059669)',
                                    float: 'right',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showResult && resultData && (
                    <BattleResultScreen
                        data={resultData}
                        onContinue={goToMainMenu}
                        onRematch={() => {
                            setShowResult(false);
                            // Логика реванша может быть сложной, пока просто сбросим и переинициализируем если нужно
                            // Но проще вернуться в лобби
                            goToMainMenu();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
