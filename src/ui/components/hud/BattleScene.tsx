import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { BattleEngine, BattleState } from '../../../engine/core/BattleEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleResultScreen, BattleResultData } from './BattleResultScreen';
import { PreBattleScreen } from './PreBattleScreen';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { BATTLE_REWARDS } from '../../../game/configs/GameConstants';
import { shareBattleResult } from '../../../utils/VKBridge';

export const BattleScene: React.FC = () => {
    const { selectedHeroId, selectedEnemyId, goToMainMenu, getCalculatedStats, timeScale, setTimeScale } =
        useGameStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);

    const [battleState, setBattleState] = useState<BattleState>({
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...',
    });
    const [playerPulse, setPlayerPulse] = useState(false);
    const [enemyPulse, setEnemyPulse] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState<BattleResultData | null>(null);
    const [damageTexts, setDamageTexts] = useState<any[]>([]);
    const [shake, setShake] = useState({ x: 0, y: 0 });
    const [canSkip, setCanSkip] = useState(false);
    const [liveLog, setLiveLog] = useState<{ id: number; text: string; type: string }[]>([]);
    const [currentAttacker, setCurrentAttacker] = useState<'player' | 'enemy' | null>(null);
    // Предбоевой экран
    const [showPreBattle, setShowPreBattle] = useState(useGameStore.getState().battleMode !== 'RANKED');
    const [battleStarted, setBattleStarted] = useState(useGameStore.getState().battleMode === 'RANKED');
    // Реальный счётчик ходов
    const turnCountRef = useRef(0);
    // Тост для VK Share
    const [shareToast, setShareToast] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCanSkip(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

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
        const battleTracks = AssetsMap.AUDIO.MUSIC_LIST.filter((track) => track !== AssetsMap.AUDIO.MUSIC_MAIN);
        const randomTrack =
            battleTracks[Math.floor(Math.random() * battleTracks.length)] || AssetsMap.AUDIO.MUSIC_LIST[0];
        audioService.playMusic(randomTrack);

        // Списываем энергию при входе в рейтинговый бой, если он начинается сразу
        const store = useGameStore.getState() as any;
        if (store.battleMode === 'RANKED' && store.consumeEnergy) {
            store.consumeEnergy(10);
        }

        return () => {
            // Revert to city theme when leaving battle
            audioService.playMusic(AssetsMap.AUDIO.MUSIC_MAIN);
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const playerStats = getCalculatedStats(selectedHeroId)?.total;
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

            if ((newState.playerHP <= 0 || newState.enemyHP <= 0) && !showResultRef.current) {
                // ПРЕДОТВРАЩАЕМ ПОВТОРНЫЙ ВЫЗОВ НАГРАД:
                showResultRef.current = true;

                const isVictory = newState.enemyHP <= 0;
                const store = useGameStore.getState() as any;
                const isWarmup = store.battleMode === 'WARMUP';

                const gold = isWarmup ? 0 : isVictory ? BATTLE_REWARDS.GOLD_VICTORY : BATTLE_REWARDS.GOLD_DEFEAT;
                const xp = isWarmup ? 0 : isVictory ? BATTLE_REWARDS.XP_VICTORY : BATTLE_REWARDS.XP_DEFEAT;
                const trophies = isWarmup
                    ? 0
                    : isVictory
                      ? BATTLE_REWARDS.TROPHIES_VICTORY
                      : BATTLE_REWARDS.TROPHIES_DEFEAT;

                setResultData({
                    isVictory,
                    goldEarned: gold,
                    xpEarned: xp,
                    trophiesChange: trophies,
                    damageDealt: engineRef.current?.totalDamageDealt ?? (playerStats?.attack || 50) * 10,
                    turnsPlayed: turnCountRef.current,
                    enemyName: enemyData.name,
                    playerStats: playerStats
                        ? {
                              hp: playerStats.hp,
                              attack: playerStats.attack,
                              defense: playerStats.defense,
                              speed: playerStats.speed,
                          }
                        : undefined,
                    enemyStats: {
                        hp: enemyData.baseStats.hp,
                        attack: enemyData.baseStats.attack,
                        defense: enemyData.baseStats.defense,
                        speed: enemyData.baseStats.speed,
                    },
                    battleDurationSeconds: engineRef.current ? engineRef.current.battleTime / 60 : 0,
                });

                if (!isWarmup) {
                    // НАЧИСЛЯЕМ НАГРАДЫ В СТОР
                    store.addGold(gold);
                    store.addExp(xp);
                    store.addCombatLog(
                        `Бой завершен: ${isVictory ? 'Победа' : 'Поражение'}. Получено +${gold} золота, +${xp} опыта.`,
                    );
                    // Уровень и трофеи тоже нужно обновить
                    if (isVictory) {
                        const newTrophies = store.trophies + trophies;
                        store.updateProfile({
                            trophies: newTrophies,
                            rating: newTrophies,
                            wins: store.wins + 1,
                            totalBattles: store.totalBattles + 1,
                        });
                    } else {
                        const newTrophies = Math.max(0, store.trophies + trophies);
                        store.updateProfile({
                            trophies: newTrophies,
                            rating: newTrophies,
                            totalBattles: store.totalBattles + 1,
                        });
                    }
                }

                setTimeout(() => setShowResult(true), 1500);
            }
        };

        engine.onCombatEvent = (event) => {
            const isPlayerTarget = event.target === 'player';
            // В ХИБРИДНОЙ АРХИТЕКТУРЕ: Игрок стоит на X = W * 0.25 (480px), Враг на X = W * 0.75 (1440px)
            const x = isPlayerTarget ? 480 : 1440;
            const y = 400; // Y-координата над головами бойцов

            let text = '';
            let color = '';
            let fontSize = '54px';
            let initialScale = 0.5;
            let animateScale = 1.0;

            switch (event.type) {
                case 'HIT':
                    text = `-${Math.round(event.damage)}`;
                    color = '#FFFFFF';
                    break;
                case 'CRIT':
                    text = `-${Math.round(event.damage)}!`;
                    color = '#FFD700'; // Золотой
                    fontSize = '80px'; // Увеличенный размер 1.8x
                    initialScale = 0.5;
                    animateScale = 1.8;

                    // GPU-акселерированная тряскаtranslateX ±3px за 200мс
                    setShake({ x: 3, y: 0 });
                    setTimeout(() => setShake({ x: -3, y: 0 }), 50);
                    setTimeout(() => setShake({ x: 3, y: 0 }), 100);
                    setTimeout(() => setShake({ x: -3, y: 0 }), 150);
                    setTimeout(() => setShake({ x: 0, y: 0 }), 200);
                    break;
                case 'DODGE':
                    text = 'МИМО!';
                    color = '#999999'; // Серый
                    break;
                case 'BLOCK':
                    text = `🛡️ БЛОК! (-${Math.round(event.damage)})`;
                    color = '#4FC3F7'; // Синий
                    break;
            }

            // Считаем ходы
            if (event.type === 'HIT' || event.type === 'CRIT') {
                turnCountRef.current += 1;
            }

            if (event.target === 'enemy') {
                setCurrentAttacker('player');
                setPlayerPulse(true);
                setTimeout(() => {
                    setPlayerPulse(false);
                    setCurrentAttacker(null);
                }, 500);
            } else {
                setCurrentAttacker('enemy');
                setEnemyPulse(true);
                setTimeout(() => {
                    setEnemyPulse(false);
                    setCurrentAttacker(null);
                }, 500);
            }

            // Обновляем живой лог
            const logText = (() => {
                switch (event.type) {
                    case 'CRIT':
                        return `★ КРИТ! ${event.target === 'player' ? 'Враг' : 'Вы'} -${Math.round(event.damage)} урона`;
                    case 'DODGE':
                        return `» ${event.target === 'player' ? 'Вы' : 'Враг'} уклоняется!`;
                    case 'BLOCK':
                        return `🛡️ Блок! -${Math.round(event.damage)} урона`;
                    case 'INSTINCT':
                        return `⚡ ${event.target === 'player' ? '[ВЫ]' : '[ВРАГ]'} ${event.label ?? 'ИНСТИНКТ!'}`;
                    default:
                        return `${event.target === 'player' ? 'Враг' : 'Вы'} -${Math.round(event.damage)} урона`;
                }
            })();
            setLiveLog((prev) => {
                const entry = { id: Date.now() + Math.random(), text: logText, type: event.type };
                return [...prev.slice(-4), entry];
            });

            const newDmg = {
                id: Date.now() + Math.random(),
                text,
                x,
                y,
                color,
                fontSize,
                initialScale,
                animateScale,
                type: event.type,
            };

            // Ограничение: не больше 5 одновременных тегов на экране
            setDamageTexts((prev) => {
                const maxAllowed = 4;
                const sliced = prev.length >= 5 ? prev.slice(prev.length - maxAllowed) : prev;
                return [...sliced, newDmg];
            });

            // Автоматическое удаление через 800мс (fade out в конце)
            setTimeout(() => {
                setDamageTexts((prev) => prev.filter((d) => d.id !== newDmg.id));
            }, 800);
        };

        const run = async () => {
            if (engineRef.current?.isInitialized) return;
            // Ждём пока игрок нажмёт «Начать бой» на PreBattleScreen
            if (!battleStarted) return;
            turnCountRef.current = 0;
            if (containerRef.current) {
                await engine
                    .init(containerRef.current, selectedHeroId, selectedEnemyId, playerStats, enemyStats)
                    .catch((err) => {
                        console.error('[BattleScene] Критическая ошибка инициализации боя:', err);
                    });
            }
        };
        run();

        return () => {
            engine.destroy();
            (window as any).__BATTLE_ENGINE__ = null;
        };
    }, [selectedHeroId, selectedEnemyId, getCalculatedStats, enemyData, battleStarted]);

    const isMobile = useGameStore((state) => state.isMobile);
    const isBattleOver = battleState.playerHP <= 0 || battleState.enemyHP <= 0;

    // Стабильный коллбэк для PreBattleScreen (избегаем пересоздания)
    const handleBattleStart = useCallback(() => {
        const store = useGameStore.getState() as any;
        if (store.battleMode !== 'WARMUP' && store.consumeEnergy) {
            store.consumeEnergy(10);
        }
        setShowPreBattle(false);
        setBattleStarted(true);
    }, []);
    const handlePreBattleCancel = useCallback(() => {
        goToMainMenu();
    }, [goToMainMenu]);

    // Функция шаринга результата
    const handleShare = useCallback(async () => {
        if (!resultData) return;
        const store = useGameStore.getState();
        const playerName = store.profile?.firstName || 'Игрок';
        const result = await shareBattleResult({
            playerName,
            enemyName: resultData.enemyName,
            damageDealt: Math.round(resultData.damageDealt),
            trophiesChange: resultData.trophiesChange,
            isVictory: resultData.isVictory,
        });
        if (result === 'shared') setShareToast('✅ Опубликовано в ВК!');
        else if (result === 'copied') setShareToast('📋 Скопировано в буфер!');
        else setShareToast('❌ Ошибка шаринга');
        setTimeout(() => setShareToast(null), 3000);
    }, [resultData]);

    // Вычисляем статы врага для PreBattleScreen
    const playerStats4Pre = getCalculatedStats(selectedHeroId)?.total;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: isMobile ? '100%' : '1920px',
                height: isMobile ? '100%' : '1080px',
                background: 'transparent',
                overflow: 'hidden',
                transform: `translate(${shake.x}px, ${shake.y}px)`,
                transition: 'transform 0.05s',
                pointerEvents: 'auto',
            }}
        >
            {/* ── ПРИОРИТЕТ 1: ПРЕДБОЕВОЙ ЭКРАН ─────────────────────────── */}
            <AnimatePresence>
                {showPreBattle && playerStats4Pre && (
                    <motion.div
                        key="prebattle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 5000 }}
                    >
                        <PreBattleScreen
                            playerName={playerHero.name}
                            playerImage={playerHero.image}
                            playerLevel={useGameStore.getState().level}
                            playerStats={{
                                hp: playerStats4Pre.hp,
                                attack: playerStats4Pre.attack,
                                defense: playerStats4Pre.defense,
                                speed: Math.round(playerStats4Pre.speed),
                            }}
                            enemyName={enemyData.name}
                            enemyImage={enemyData.image}
                            enemyIcon={enemyData.icon}
                            enemyStats={{
                                hp: enemyData.baseStats.hp,
                                attack: enemyData.baseStats.attack,
                                defense: enemyData.baseStats.defense,
                                speed: Math.round(enemyData.baseStats.speed),
                            }}
                            onStart={handleBattleStart}
                            onCancel={handlePreBattleCancel}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                ref={containerRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
            />

            {/* DAMAGE TEXTS OVERLAY */}
            <AnimatePresence>
                {damageTexts.map((dmg) => {
                    const isDodge = dmg.type === 'DODGE';
                    // DODGE улетает по диагонали вправо-вверх (x+120, y-150), остальные летят вверх (y-150)
                    const animateX = isDodge ? 120 : 0;
                    const animateY = -150;

                    return (
                        <motion.div
                            key={dmg.id}
                            initial={{
                                opacity: 0,
                                scale: dmg.initialScale,
                                transform: `translate3d(${dmg.x}px, ${dmg.y}px, 0)`,
                            }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: dmg.animateScale,
                                transform: `translate3d(${dmg.x + animateX}px, ${dmg.y + animateY}px, 0)`,
                            }}
                            transition={{
                                duration: 0.8,
                                ease: 'easeOut',
                                opacity: {
                                    times: [0, 0.15, 0.75, 1],
                                    duration: 0.8,
                                },
                            }}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                pointerEvents: 'none',
                                color: dmg.color,
                                fontSize: dmg.fontSize,
                                fontWeight: 900,
                                textShadow:
                                    '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                                zIndex: 1000,
                                fontFamily: "'Cinzel', serif",
                                willChange: 'transform, opacity',
                            }}
                        >
                            {dmg.text}
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
                <div
                    style={{
                        padding: '40px 100px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                    }}
                >
                    {/* PLAYER PANEL */}
                    <motion.div
                        animate={{ scale: playerPulse ? 1.05 : 1 }}
                        transition={{ duration: 0.15 }}
                        style={{ width: '480px' }}
                    >
                        {/* Имя + индикатор атаки */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AnimatePresence>
                                {currentAttacker === 'player' && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: '#FFD700',
                                            boxShadow: '0 0 12px #FFD700',
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                            <div
                                style={{
                                    color: currentAttacker === 'player' ? '#FFD700' : '#fff',
                                    fontSize: '28px',
                                    fontFamily: "'Cinzel', serif",
                                    textTransform: 'uppercase',
                                    transition: 'color 0.2s',
                                    textShadow: currentAttacker === 'player' ? '0 0 20px rgba(255,215,0,0.8)' : 'none',
                                }}
                            >
                                {playerHero.name}
                            </div>
                        </div>
                        {/* HP БАР ИГРОКА */}
                        <div
                            style={{
                                height: '28px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '2px solid #f0c040',
                                marginTop: '10px',
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '4px',
                            }}
                        >
                            <motion.div
                                animate={{ width: `${(battleState.playerHP / battleState.playerMaxHP) * 100}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    textShadow: '1px 1px 2px #000',
                                }}
                            >
                                {Math.max(0, battleState.playerHP)} / {battleState.playerMaxHP}
                            </div>
                        </div>
                    </motion.div>

                    {/* CENTER LOG */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0 40px',
                        }}
                    >
                        {/* Главный лог (текущее событие) */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={battleState.log}
                                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15 }}
                                style={{
                                    color: '#f0c040',
                                    fontSize: '32px',
                                    textAlign: 'center',
                                    fontFamily: "'Cinzel', serif",
                                    fontWeight: 'bold',
                                    textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                                }}
                            >
                                {battleState.log}
                            </motion.div>
                        </AnimatePresence>

                        {/* ЖИВОЙ ЛОГ СОБЫТИЙ */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                width: '100%',
                                maxWidth: '500px',
                            }}
                        >
                            <AnimatePresence>
                                {liveLog.map((entry, i) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: i === liveLog.length - 1 ? 1 : 0.4, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        style={{
                                            textAlign: 'center',
                                            fontSize: i === liveLog.length - 1 ? '22px' : '16px',
                                            fontFamily: "'Cinzel', serif",
                                            fontWeight: i === liveLog.length - 1 ? 'bold' : 'normal',
                                            color:
                                                entry.type === 'CRIT'
                                                    ? '#FFD700'
                                                    : entry.type === 'DODGE'
                                                      ? '#9E9E9E'
                                                      : entry.type === 'BLOCK'
                                                        ? '#4FC3F7'
                                                        : entry.type === 'INSTINCT'
                                                          ? '#CE93D8'
                                                          : '#ffffff',
                                            textShadow: '0 1px 6px rgba(0,0,0,1)',
                                            transition: 'font-size 0.2s, opacity 0.2s',
                                        }}
                                    >
                                        {entry.text}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ENEMY PANEL */}
                    <motion.div
                        animate={{ scale: enemyPulse ? 1.05 : 1 }}
                        transition={{ duration: 0.15 }}
                        style={{ width: '480px', textAlign: 'right' }}
                    >
                        {/* Имя врага + индикатор атаки */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <div
                                style={{
                                    color: currentAttacker === 'enemy' ? '#FF6B6B' : '#fff',
                                    fontSize: '28px',
                                    fontFamily: "'Cinzel', serif",
                                    textTransform: 'uppercase',
                                    transition: 'color 0.2s',
                                    textShadow: currentAttacker === 'enemy' ? '0 0 20px rgba(255,100,100,0.8)' : 'none',
                                }}
                            >
                                {enemyData.name}
                            </div>
                            <AnimatePresence>
                                {currentAttacker === 'enemy' && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: '#FF6B6B',
                                            boxShadow: '0 0 12px #FF6B6B',
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                        {/* HP БАР ВРАГА */}
                        <div
                            style={{
                                height: '28px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '2px solid #ef4444',
                                marginTop: '10px',
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '4px',
                            }}
                        >
                            <motion.div
                                animate={{ width: `${(battleState.enemyHP / battleState.enemyMaxHP) * 100}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #10b981, #059669)',
                                    float: 'right',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    textShadow: '1px 1px 2px #000',
                                }}
                            >
                                {Math.max(0, battleState.enemyHP)} / {battleState.enemyMaxHP}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* BATTLE ACCELERATION & SKIP CONTROLS */}
            {!isBattleOver && (
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        right: '25px',
                        zIndex: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* X2 SPEED BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            setTimeScale(timeScale === 2 ? 1 : 2);
                        }}
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: timeScale === 2 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(0, 0, 0, 0.7)',
                            border: timeScale === 2 ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: timeScale === 2 ? '0 0 20px rgba(251, 191, 36, 0.5)' : 'none',
                            color: timeScale === 2 ? '#fbbf24' : '#ffffff',
                            fontSize: '18px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Cinzel', serif",
                            textShadow: timeScale === 2 ? '0 0 10px rgba(251, 191, 36, 0.6)' : 'none',
                            transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                        }}
                        title="Ускорение боя"
                    >
                        {timeScale === 2 ? '2X' : '1X'}
                    </motion.button>

                    {/* SKIP BUTTON */}
                    <AnimatePresence>
                        {canSkip && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                                    if (engineRef.current) {
                                        engineRef.current.skipToEndOfBattle();
                                    }
                                }}
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '12px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'border 0.2s, background 0.2s',
                                }}
                                title="Пропустить бой"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
                                    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="3" />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {showResult && resultData && (
                    <>
                        <BattleResultScreen
                            data={resultData}
                            onContinue={goToMainMenu}
                            onRematch={() => {
                                setShowResult(false);
                                goToMainMenu();
                            }}
                        />
                        {/* ── ПРИОРИТЕТ 3: VK SHARE КНОПКА ─────────────────── */}
                        {resultData.isVictory && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2, duration: 0.4 }}
                                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                style={{
                                    position: 'absolute',
                                    bottom: '32px',
                                    right: '48px',
                                    zIndex: 6000,
                                    padding: '14px 28px',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                                    border: '2px solid #60a5fa',
                                    borderRadius: '14px',
                                    color: '#ffffff',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    fontFamily: 'Russo One, sans-serif',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    pointerEvents: 'auto',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>🌐</span>
                                РАССКАЗАТЬ О ПОБЕДЕ
                            </motion.button>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* ТОСТ уведомление */}
            <AnimatePresence>
                {shareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(10,20,40,0.95)',
                            border: '1px solid #3b82f6',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: 700,
                            zIndex: 9999,
                            pointerEvents: 'none',
                            boxShadow: '0 0 20px rgba(59,130,246,0.4)',
                            fontFamily: 'Russo One, sans-serif',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {shareToast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
