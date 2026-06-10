import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGameStore } from '../../../store/useGameStore';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { SKINS_DB } from '../../../configs/SkinsConfig';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { BattleEngine, BattleState } from '../../../engine/core/BattleEngine';
import { EffectsManager } from '../../../engine/systems/EffectsManager';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleResultScreen, BattleResultData } from './BattleResultScreen';
import { PreBattleScreen } from './PreBattleScreen';
import { audioService } from '../../../services/AudioService';
import { AssetsMap } from '../../../configs/AssetsMap';
import { showInterstitialAd } from '../../../utils/VKBridge';
import { BattleHUD } from './Battle/BattleHUD';
import { BATTLE_CONFIG } from '../../../game/configs/constants';

export const BattleScene: React.FC = () => {
    const selectedHeroId = useGameStore((state) => state.selectedHeroId);
    const selectedEnemyId = useGameStore((state) => state.selectedEnemyId);
    const goToMainMenu = useGameStore((state) => state.goToMainMenu);
    const getCalculatedStats = useGameStore((state) => state.getCalculatedStats);
    const timeScale = useGameStore((state) => state.timeScale);
    const setTimeScale = useGameStore((state) => state.setTimeScale);
    const activePveEnemy = useGameStore((state) => state.activePveEnemy);
    const activeRankedOpponent = useGameStore((state) => state.activeRankedOpponent);
    const battleMode = useGameStore((state) => state.battleMode);
    const equippedSkins = useGameStore((state) => state.equippedSkins);
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
        playerStatuses: [],
        enemyStatuses: [],
        playerShield: 0,
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
    const equippedSkinId = equippedSkins?.[selectedHeroId] || 'default';
    const activeSkin = SKINS_DB.find((s) => s.id === equippedSkinId && s.heroId === selectedHeroId);
    const isDefaultSkin = !activeSkin || activeSkin.id === 'default' || activeSkin.id.endsWith('_default');
    const displayPlayerName = !isDefaultSkin ? activeSkin.name : playerHero.name;
    const displayPlayerImage = activeSkin ? activeSkin.image : playerHero.image;
    const rawEnemy =
        battleMode === 'PVE'
            ? MOBS_DB.find((m) => m.id === selectedEnemyId) || MOBS_DB[0]
            : HEROES_DB.find((h) => h.id === selectedEnemyId) || HEROES_DB[0];

    const enemyData = React.useMemo(() => {
        if ('baseStats' in rawEnemy) {
            return rawEnemy;
        }

        if (battleMode === 'RANKED' && activeRankedOpponent) {
            return {
                id: activeRankedOpponent.id,
                name: activeRankedOpponent.name,
                rarity: 'COMMON',
                image: activeRankedOpponent.heroImage,
                baseStats: {
                    hp: activeRankedOpponent.stats.hp,
                    attack: activeRankedOpponent.stats.attack,
                    defense: activeRankedOpponent.stats.defense,
                    speed: activeRankedOpponent.stats.speed || 1.0,
                    crit: activeRankedOpponent.stats.crit || activeRankedOpponent.stats.critChance || 0.05,
                    avgItemLevel: (activeRankedOpponent.stats as any).avgItemLevel || 1,
                },
                anchors: rawEnemy.anchors,
                icon: '👤',
            };
        }

        const calculated = getCalculatedStats(rawEnemy.id)?.total || {
            hp: rawEnemy.stats.stamina * 20,
            attack: rawEnemy.stats.strength * 2,
            defense: rawEnemy.stats.agility * 1,
            speed: 1.0,
            crit: 0.05,
            avgItemLevel: 1,
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
                avgItemLevel: calculated.avgItemLevel || 1,
            },
            anchors: rawEnemy.anchors,
            icon: '👤',
        };
    }, [rawEnemy, getCalculatedStats, battleMode, activeRankedOpponent]);

    // [Sound] Switch to battle music on mount
    useEffect(() => {
        const battleTracks = AssetsMap.AUDIO.MUSIC_LIST.filter((track) => track !== AssetsMap.AUDIO.MUSIC_MAIN);
        const randomTrack =
            battleTracks[Math.floor(Math.random() * battleTracks.length)] || AssetsMap.AUDIO.MUSIC_LIST[0];
        audioService.playMusic(randomTrack);

        // Списываем энергию при входе в рейтинговый бой, если он начинается сразу
        const store = useGameStore.getState() as any;
        if (store.battleMode === 'RANKED' && store.consumeEnergy) {
            store.consumeEnergy(BATTLE_CONFIG.ENERGY_COST);
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
            avgItemLevel: isPve ? 1 : (enemyData.baseStats as any).avgItemLevel || 1,
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

                (async () => {
                    let gold = 0;
                    let xp = 0;
                    let trophies = 0;
                    let crystals = 0;

                    if (isPve) {
                        if (isVictory) {
                            gold = Math.min(100 + store.pveStage * 30, 5000);
                            xp = Math.min(50 + store.pveStage * 5, 500);
                            const isBoss = store.pveStage % 5 === 0;
                            crystals = isBoss ? 20 : 0;
                        }
                        store.completePveBattle(isVictory);
                    } else {
                        if (isWarmup) {
                            gold = 0;
                            xp = isVictory ? 200 : 50;
                            trophies = 0;
                        } else {
                            // Record result in matchmaking service to update honeymoon counter
                            const { matchmakingService } = await import('../../../services/MatchmakingService');
                            matchmakingService.recordBattleResult(isVictory);

                            const opponent = store.activeRankedOpponent;
                            const myUserId = store.vkUser ? String(store.vkUser.id) : store.playerId;
                            const myName = store.name || 'Мастер';
                            const myRating = store.rating || 0;
                            const myLevel = store.level || 1;

                            const { battleResultService } = await import('../../../services/BattleResultService');
                            const { myCupsChange, myGoldChange, myExpChange } = await battleResultService.recordResult({
                                myUserId,
                                myName,
                                myRating,
                                myLevel,
                                opponentUserId: opponent?.realUserId,
                                opponentName: opponent?.name || 'Противник',
                                opponentRating: opponent?.rating || 0,
                                opponentLevel: opponent?.level || 1,
                                isOpponentBot: opponent?.isBot ?? true,
                                attackerWon: isVictory,
                                winStreak: store.winStreak || 0,
                            });

                            const { syncService } = await import('../../../services/SyncService');
                            syncService.logPlayerAction(
                                `Завершил рейтинговый бой против ${opponent?.name || 'Противник'}: ${isVictory ? 'Победа' : 'Поражение'}`,
                            );

                            gold = myGoldChange;
                            xp = myExpChange;
                            trophies = myCupsChange;
                        }
                    }

                    if (!isPve) {
                        store.addGold(gold);
                        const activeHeroId = store.selectedHeroId || 'panda';
                        store.addHeroExp(activeHeroId, xp);
                        store.addExp(xp); // Опыт аккаунта для прокачки уровня игрока
                        if (!isWarmup) {
                            store.addBpExp(isVictory ? 100 : 20); // Battle Pass опыт
                        }
                        store.addCombatLog(
                            `Бой завершен: ${isVictory ? 'Победа' : 'Поражение'}. Получено +${gold} золота, +${xp} опыта героя.`,
                        );

                        const { RANK_SYSTEM } = await import('../../../configs/RankSystem');
                        const currentRank = RANK_SYSTEM.find((rank) => (store.trophies || 0) >= rank.minTrophies - 50) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
                        const minAllowed = Math.max(0, currentRank.minTrophies - 50);
                        const newTrophies = Math.max(minAllowed, store.trophies + trophies);
                        const newStreak = isVictory ? store.winStreak + 1 : 0;
                        const newLossStreak = isVictory ? 0 : (store.lossStreak || 0) + 1;
                        const patch: any = {
                            trophies: newTrophies,
                            rating: newTrophies,
                            totalBattles: store.totalBattles + 1,
                            winStreak: newStreak,
                            lossStreak: newLossStreak,
                        };
                        if (isVictory) {
                            patch.wins = store.wins + 1;
                        }
                        store.updateProfile(patch);

                        if (isVictory) {
                            store.updateQuestProgress('WIN', 1);
                        }
                        store.updateQuestProgress('PLAY', 1);
                        store.updateQuestProgress('WIN_STREAK', newStreak);

                        const { syncService } = await import('../../../services/SyncService');
                        syncService.syncPlayerData();
                    }

                    setResultData({
                        isVictory,
                        goldEarned: gold,
                        xpEarned: xp,
                        trophiesChange: trophies,
                        crystalsEarned: crystals,
                        damageDealt: engineRef.current?.totalDamageDealt ?? (playerStats?.attack || 50) * 10,
                        damageTaken: engineRef.current?.totalDamageTaken ?? 0,
                        turnsPlayed: engineRef.current?.totalTurnsPlayed ?? turnCountRef.current,
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

                    setTimeout(() => setShowResult(true), 1500);
                })();
            }
        };

        engine.onCombatEvent = (event) => {
            // 1. Hit-Stop Effect
            if (event.type === 'HIT' || event.type === 'CRIT' || event.type === 'BLOCK') {
                const damage = event.damage || 0;
                if (damage > 0) {
                    gsap.globalTimeline.timeScale(0);
                    let duration = 40;
                    if (damage > 50) {
                        duration = 120;
                    } else if (damage > 20) {
                        duration = 80;
                    }
                    setTimeout(() => {
                        gsap.globalTimeline.timeScale(1);
                    }, duration);
                }
            }

            const isPlayerTarget = event.target === 'player';
            // В ХИБРИДНОЙ АРХИТЕКТУРЕ: Игрок стоит на X = W * 0.25 (480px), Враг на X = W * 0.75 (1440px)
            const x = isPlayerTarget ? 480 : 1440;
            const y = 400; // Y-координата над головами бойцов

            // Извлекаем роли участников для кастомного оформления
            const attackerSide = isPlayerTarget ? 'enemy' : 'player';
            const attackerHero = attackerSide === 'player' ? playerHero : rawEnemy;
            const defenderHero = isPlayerTarget ? playerHero : rawEnemy;
            const attackerRole = (attackerHero as any).role || 'WARRIOR';
            const defenderRole = (defenderHero as any).role || 'WARRIOR';

            // Находим целевой юнит в PIXI-рендерере
            const targetUnit = isPlayerTarget ? engine.getPlayerUnit() : engine.getEnemyUnit();
            const attackerUnit = isPlayerTarget ? engine.getEnemyUnit() : engine.getPlayerUnit();
            if (targetUnit) {
                EffectsManager.getInstance().applyHitResolution(
                    attackerRole,
                    defenderRole,
                    event.type,
                    targetUnit,
                    isPlayerTarget,
                    attackerUnit,
                    event.damage,
                );
            }

            let text = '';
            let color = '#FFFFFF';
            let fontSize = '54px';
            let initialScale = 0.5;
            let animateScale = 1.0;
            let fontStyle = 'normal';
            let textShadow = '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000';

            // Направление полета текста урона в зависимости от класса
            let animateX = 0;
            let animateY = -150;

            switch (event.type) {
                case 'HIT':
                    text = `-${Math.round(event.damage)}`;
                    if (attackerRole === 'TANK') {
                        color = '#FFA500'; // Оранжевый для тяжелого танка
                        fontSize = '62px';
                        textShadow = '0 0 10px rgba(255, 165, 0, 0.7), 2px 2px 0px #000';
                    } else if (attackerRole === 'ASSASSIN') {
                        color = '#D8B4FE'; // Нежно-фиолетовый для ассасина
                        fontStyle = 'italic';
                        fontSize = '56px';
                        textShadow = '0 0 8px rgba(216, 180, 254, 0.7), 2px 2px 0px #000';
                        animateX = (Math.random() - 0.5) * 60; // Ассасины летят в стороны
                        animateY = -180;
                    } else {
                        color = '#E0F2FE'; // Светло-голубой для воина/бойца
                        fontSize = '54px';
                        textShadow = '0 0 8px rgba(224, 242, 254, 0.7), 2px 2px 0px #000';
                    }
                    break;
                case 'CRIT':
                    text = `-${Math.round(event.damage)}!`;
                    if (attackerRole === 'TANK') {
                        color = '#FF8C00'; // Огненно-рыжий крит танка
                        fontSize = '96px';
                        animateScale = 2.0;
                        textShadow = '0 0 18px rgba(255, 140, 0, 0.9), 3px 3px 0px #000';
                        animateY = -100; // Тяжелый крит висит ниже
                    } else if (attackerRole === 'ASSASSIN') {
                        color = '#A78BFA'; // Насыщенный фиолетовый крит ассасина
                        fontStyle = 'italic';
                        fontSize = '86px';
                        animateScale = 1.8;
                        textShadow = '0 0 15px rgba(167, 139, 250, 0.9), 3px 3px 0px #000';
                        animateX = (Math.random() - 0.5) * 80;
                        animateY = -200; // Быстрый вылет вверх
                    } else {
                        color = '#00E5FF'; // Кислотно-бирюзовый крит бойца
                        fontSize = '80px';
                        animateScale = 1.8;
                        textShadow = '0 0 15px rgba(0, 229, 255, 0.9), 3px 3px 0px #000';
                        animateY = -160;
                    }

                    // Дополнительная React-тряска интерфейса при критах
                    setShake({ x: 4, y: 0 });
                    setTimeout(() => setShake({ x: -4, y: 0 }), 50);
                    setTimeout(() => setShake({ x: 4, y: 0 }), 100);
                    setTimeout(() => setShake({ x: -4, y: 0 }), 150);
                    setTimeout(() => setShake({ x: 0, y: 0 }), 200);
                    break;
                case 'DODGE':
                    text = 'УВОРОТ!';
                    color = '#FFB74D'; // Оранжевый
                    animateX = isPlayerTarget ? -80 : 80; // Отлетает в сторону уворота
                    break;
                case 'BLOCK':
                    text = event.label || `🛡️ БЛОК! (-${Math.round(event.damage)})`;
                    if (text.includes('💚') || text.includes('🌿')) {
                        color = '#10B981'; // Зеленый для исцеления
                    } else {
                        color = '#4FC3F7'; // Синий
                    }
                    animateX = isPlayerTarget ? 40 : -40; // Слегка отскакивает в сторону щита
                    break;
                case 'INSTINCT':
                    text = event.label || 'ИНСТИНКТ!';
                    color = '#A78BFA'; // Фиолетовый
                    fontSize = '58px';
                    initialScale = 0.5;
                    animateScale = 1.3;
                    break;
                case 'BURN':
                    text = `🔥 -${Math.round(event.damage)}`;
                    color = '#FF4500'; // Orangered
                    fontSize = '52px';
                    textShadow = '0 0 10px rgba(255, 69, 0, 0.8), 2px 2px 0px #000';
                    animateY = -120;
                    break;
                case 'POISON':
                    text = `🤢 -${Math.round(event.damage)}`;
                    color = '#32CD32'; // Limegreen
                    fontSize = '52px';
                    textShadow = '0 0 10px rgba(50, 205, 50, 0.8), 2px 2px 0px #000';
                    animateY = -120;
                    break;
                case 'FREEZE':
                    text = event.label || '❄️ ЗАМОРОЗКА!';
                    color = '#00BFFF'; // Deep sky blue
                    fontSize = '52px';
                    textShadow = '0 0 10px rgba(0, 191, 255, 0.8), 2px 2px 0px #000';
                    animateY = -140;
                    break;
                case 'STUN':
                    text = event.label || '💫 ОГЛУШЕНИЕ!';
                    color = '#FFD700'; // Gold
                    fontSize = '52px';
                    textShadow = '0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 0px #000';
                    animateY = -140;
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

            // Добавляем случайное смещение, чтобы тексты не слипались
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
                fontStyle,
                textShadow,
                animateX,
                animateY,
            };

            // Ограничение: не больше 5 одновременных тегов на экране
            setDamageTexts((prev) => {
                const maxAllowed = 4;
                const sliced = prev.length >= 5 ? prev.slice(prev.length - maxAllowed) : prev;
                return [...sliced, newDmg];
            });

            // Автоматическое удаление через 1000мс / timeScale
            setTimeout(() => {
                setDamageTexts((prev) => prev.filter((d) => d.id !== newDmg.id));
            }, 1000 / useGameStore.getState().timeScale);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battleStarted]);

    const isMobile = useGameStore((state) => state.isMobile);
    const isBattleOver = battleState.playerHP <= 0 || battleState.enemyHP <= 0;

    // Стабильный коллбэк для PreBattleScreen (избегаем пересоздания)
    const handleBattleStart = useCallback(() => {
        const store = useGameStore.getState() as any;
        if (store.battleMode !== 'WARMUP' && store.consumeEnergy) {
            store.consumeEnergy(BATTLE_CONFIG.ENERGY_COST);
        }
        setShowPreBattle(false);
        setBattleStarted(true);
    }, []);
    const handlePreBattleCancel = useCallback(() => {
        goToMainMenu();
    }, [goToMainMenu]);

    // Вычисляем статы врага для PreBattleScreen (только до начала боя)
    const playerStats4Pre = React.useMemo(() => {
        if (battleStarted) return null;
        return getCalculatedStats(selectedHeroId)?.total;
    }, [battleStarted, selectedHeroId, getCalculatedStats]);

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
                            playerName={displayPlayerName}
                            playerImage={displayPlayerImage}
                            playerLevel={useGameStore.getState().level}
                            heroLevel={useGameStore.getState().heroes[selectedHeroId]?.level || 1}
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
                            enemyLevel={
                                battleMode === 'PVE' && activePveEnemy
                                    ? activePveEnemy.level
                                    : battleMode === 'RANKED' && activeRankedOpponent
                                      ? activeRankedOpponent.level
                                      : 1
                            }
                            onStart={handleBattleStart}
                            onCancel={handlePreBattleCancel}
                            battleMode={battleMode}
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
                    const animateX = dmg.animateX !== undefined ? dmg.animateX : isDodge ? 120 : 0;
                    const animateY = dmg.animateY !== undefined ? dmg.animateY : -150;

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
                                duration: 1.0 / timeScale,
                                ease: 'easeOut',
                                opacity: {
                                    times: [0, 0.15, 0.75, 1],
                                    duration: 1.0 / timeScale,
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
                                    dmg.textShadow ||
                                    '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                                fontStyle: dmg.fontStyle || 'normal',
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
                                    ? async (target?: string | (() => void)) => {
                                          await showInterstitialAd();
                                          if (typeof target === 'function') {
                                              target();
                                          } else if (target === 'Forge') {
                                              useGameStore.getState().goToForge();
                                          } else if (target === 'Talents') {
                                              useGameStore.getState().goToHeroes('TALENTS');
                                          } else if (target === 'Arsenal') {
                                              useGameStore.getState().goToHeroes('HERO');
                                          } else {
                                              useGameStore.setState({
                                                  activeScreen: 'SANCTUARY',
                                                  activePveEnemy: null,
                                              });
                                          }
                                      }
                                    : async (target?: string | (() => void)) => {
                                          await showInterstitialAd();
                                          if (typeof target === 'function') {
                                              target();
                                          } else if (target === 'Forge') {
                                              useGameStore.getState().goToForge();
                                          } else if (target === 'Talents') {
                                              useGameStore.getState().goToHeroes('TALENTS');
                                          } else if (target === 'Arsenal') {
                                              useGameStore.getState().goToHeroes('HERO');
                                          } else {
                                              goToMainMenu();
                                          }
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
