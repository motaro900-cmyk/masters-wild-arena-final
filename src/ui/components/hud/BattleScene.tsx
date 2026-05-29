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
import { showInterstitialAd } from '../../../utils/VKBridge';
import { BattleHUD } from './Battle/BattleHUD';

export const BattleScene: React.FC = () => {
    const {
        selectedHeroId,
        selectedEnemyId,
        goToMainMenu,
        getCalculatedStats,
        timeScale,
        setTimeScale,
        activePveEnemy,
        battleMode,
    } = useGameStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<BattleEngine | null>(null);

    const [battleState, setBattleState] = useState<BattleState>({
        playerHP: 100,
        playerMaxHP: 100,
        enemyHP: 100,
        enemyMaxHP: 100,
        log: 'ПОДГОТОВКА...',
        playerMana: 0,
        playerMaxMana: 100,
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
    const rawEnemy =
        battleMode === 'PVE'
            ? MOBS_DB.find((m) => m.id === selectedEnemyId) || MOBS_DB[0]
            : HEROES_DB.find((h) => h.id === selectedEnemyId) || HEROES_DB[0];

    const enemyData = React.useMemo(() => {
        if ('baseStats' in rawEnemy) {
            return rawEnemy;
        }
        const calculated = getCalculatedStats(rawEnemy.id)?.total || {
            hp: rawEnemy.stats.stamina * 20,
            attack: rawEnemy.stats.strength * 2,
            defense: rawEnemy.stats.agility * 1,
            speed: 1.0,
            crit: 0.05,
        };
        return {
            id: rawEnemy.id,
            name: rawEnemy.name,
            rarity: rawEnemy.rarity,
            image: rawEnemy.image,
            baseStats: {
                hp: calculated.hp,
                attack: calculated.attack,
                defense: calculated.defense,
                speed: calculated.speed || 1.0,
                crit: (calculated as any).crit || (calculated as any).critChance || 0.05,
            },
            anchors: rawEnemy.anchors,
            icon: '👤',
        };
    }, [rawEnemy, getCalculatedStats]);

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
        const isPve = battleMode === 'PVE';
        const enemyStats = {
            hp: isPve && activePveEnemy ? activePveEnemy.hp : enemyData.baseStats.hp,
            attack: isPve && activePveEnemy ? activePveEnemy.attack : enemyData.baseStats.attack,
            speed: enemyData.baseStats.speed,
            critChance: enemyData.baseStats.crit,
            defense: isPve && activePveEnemy ? activePveEnemy.defense : enemyData.baseStats.defense,
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
                const isPve = store.battleMode === 'PVE';

                let gold = 0;
                let xp = 0;
                let trophies = 0;
                let crystals = 0;

                if (isPve) {
                    if (isVictory) {
                        gold = store.pveStage * 100;
                        xp = store.pveStage * 50;
                        const isBoss = store.pveStage % 5 === 0;
                        crystals = isBoss ? 20 : 0;
                    }
                } else {
                    gold = isWarmup ? 0 : isVictory ? BATTLE_REWARDS.GOLD_VICTORY : BATTLE_REWARDS.GOLD_DEFEAT;
                    xp = isWarmup ? 0 : isVictory ? BATTLE_REWARDS.XP_VICTORY : BATTLE_REWARDS.XP_DEFEAT;
                    trophies = isWarmup
                        ? 0
                        : isVictory
                          ? BATTLE_REWARDS.TROPHIES_VICTORY
                          : BATTLE_REWARDS.TROPHIES_DEFEAT;
                }

                setResultData({
                    isVictory,
                    goldEarned: gold,
                    xpEarned: xp,
                    trophiesChange: trophies,
                    crystalsEarned: crystals,
                    damageDealt: engineRef.current?.totalDamageDealt ?? (playerStats?.attack || 50) * 10,
                    damageTaken: engineRef.current?.totalDamageTaken ?? 0,
                    turnsPlayed: turnCountRef.current,
                    enemyName: isPve && activePveEnemy ? activePveEnemy.name : enemyData.name,
                    playerStats: playerStats
                        ? {
                              hp: playerStats.hp,
                              attack: playerStats.attack,
                              defense: playerStats.defense,
                              speed: playerStats.speed,
                          }
                        : undefined,
                    enemyStats: {
                        hp: isPve && activePveEnemy ? activePveEnemy.hp : enemyData.baseStats.hp,
                        attack: isPve && activePveEnemy ? activePveEnemy.attack : enemyData.baseStats.attack,
                        defense: isPve && activePveEnemy ? activePveEnemy.defense : enemyData.baseStats.defense,
                        speed: enemyData.baseStats.speed,
                    },
                    battleDurationSeconds: engineRef.current ? engineRef.current.battleTime / 60 : 0,
                });

                if (!isWarmup && !isPve) {
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
                } else if (isPve) {
                    store.completePveBattle(isVictory);
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
                    text = 'УВОРОТ!';
                    color = '#FFB74D'; // Оранжевый
                    break;
                case 'BLOCK':
                    text = `🛡️ БЛОК! (-${Math.round(event.damage)})`;
                    color = '#4FC3F7'; // Синий
                    break;
                case 'INSTINCT':
                    text = event.label || 'ИНСТИНКТ!';
                    color = '#A78BFA'; // Фиолетовый
                    fontSize = '58px';
                    initialScale = 0.5;
                    animateScale = 1.3;
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

            // Add slight random offsets to prevent overlays of text tags
            const offsetX = (Math.random() - 0.5) * 80;
            const offsetY = (Math.random() - 0.5) * 60;

            const newDmg = {
                id: Date.now() + Math.random(),
                text,
                x: x + offsetX,
                y: y + offsetY - 50, // Slightly higher baseline
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

            // Автоматическое удаление через 1000мс (fade out в конце, slightly longer to view easily)
            setTimeout(() => {
                setDamageTexts((prev) => prev.filter((d) => d.id !== newDmg.id));
            }, 1000);
        };

        const run = async () => {
            if (engineRef.current?.isInitialized) return;
            if (!battleStarted) return;
            turnCountRef.current = 0;
            if (containerRef.current) {
                await engine
                    .init(containerRef.current, selectedHeroId, rawEnemy.id, playerStats, enemyStats)
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
    }, [selectedHeroId, selectedEnemyId, getCalculatedStats, enemyData, battleStarted, battleMode, activePveEnemy]);

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
                            enemyName={battleMode === 'PVE' && activePveEnemy ? activePveEnemy.name : enemyData.name}
                            enemyImage={battleMode === 'PVE' && activePveEnemy ? activePveEnemy.image : enemyData.image}
                            enemyIcon={enemyData.icon}
                            enemyStats={{
                                hp: battleMode === 'PVE' && activePveEnemy ? activePveEnemy.hp : enemyData.baseStats.hp,
                                attack:
                                    battleMode === 'PVE' && activePveEnemy
                                        ? activePveEnemy.attack
                                        : enemyData.baseStats.attack,
                                defense:
                                    battleMode === 'PVE' && activePveEnemy
                                        ? activePveEnemy.defense
                                        : enemyData.baseStats.defense,
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
                                duration: 1.0,
                                ease: 'easeOut',
                                opacity: {
                                    times: [0, 0.15, 0.75, 1],
                                    duration: 1.0,
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

            <BattleHUD
                playerHero={playerHero}
                enemyData={enemyData}
                battleMode={battleMode}
                activePveEnemy={activePveEnemy}
                battleState={battleState}
                playerPulse={playerPulse}
                enemyPulse={enemyPulse}
                currentAttacker={currentAttacker}
                liveLog={liveLog}
            />

            {/* BATTLE ACCELERATION & SKIP CONTROLS */}
            {!isBattleOver && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '30px',
                        right: '30px',
                        zIndex: 200,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '15px',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* X2 SPEED BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                            audioService.playSFX(AssetsMap.AUDIO.SFX_CLICK);
                            setTimeScale(timeScale >= 1.2 ? 0.7 : 1.5);
                        }}
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: timeScale >= 1.2 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(0, 0, 0, 0.7)',
                            border: timeScale >= 1.2 ? '2px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: timeScale >= 1.2 ? '0 0 20px rgba(251, 191, 36, 0.5)' : 'none',
                            color: timeScale >= 1.2 ? '#fbbf24' : '#ffffff',
                            fontSize: '16px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Cinzel', serif",
                            textShadow: timeScale >= 1.2 ? '0 0 10px rgba(251, 191, 36, 0.6)' : 'none',
                            transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                        }}
                        title="Ускорение боя"
                    >
                        {timeScale >= 1.2 ? '1.5X' : '0.7X'}
                    </motion.button>

                    {/* SKIP BUTTON */}
                    <AnimatePresence>
                        {canSkip && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
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
                            onContinue={
                                battleMode === 'PVE'
                                    ? async () => {
                                          await showInterstitialAd();
                                          useGameStore.setState({
                                              activeScreen: 'SANCTUARY',
                                              activePveEnemy: null,
                                          });
                                      }
                                    : async () => {
                                          await showInterstitialAd();
                                          goToMainMenu();
                                      }
                            }
                        />
                    </>
                )}
            </AnimatePresence>



            {/* ACTIVE ABILITY FLOATING BUTTON REMOVED (CASTS AUTOMATICALLY) */}
        </div>
    );
};
