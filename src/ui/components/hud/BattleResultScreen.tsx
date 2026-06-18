import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { shareBattleResult, openStoryBox, openShareLink, copyToClipboard } from '../../../utils/VKBridge';
import { audioService } from '../../../services/AudioService';
import { getHeroExpNeeded } from '../../../features/heroes/leveling/HeroLevelConfig';
import { HEROES_DB } from '../../../configs/HeroesConfig';
import { getExpNeeded } from '../../../store/slices/playerSlice';

const RESOURCE_METADATA: Record<string, { name: string; image: string; rarity: string }> = {
    coal: { name: 'Уголь', image: '/assets/images/resources/coal.webp', rarity: 'COMMON' },
    steel_bars: { name: 'Стальной слиток', image: '/assets/images/resources/steel_bar.webp', rarity: 'RARE' },
    runic_shards: { name: 'Рунический осколок', image: '/assets/images/resources/runic_shard.webp', rarity: 'EPIC' },
    ancient_compass: {
        name: 'Древний компас',
        image: '/assets/images/resources/ancient_compass.webp',
        rarity: 'RARE',
    },
    astral_crystal: {
        name: 'Астральный кристалл',
        image: '/assets/images/resources/astral_crystal.webp',
        rarity: 'RARE',
    },
    void_sphere: {
        name: 'Сфера бездны',
        image: '/assets/images/resources/void_sphere.webp',
        rarity: 'EPIC',
    },
    golden_sprout: {
        name: 'Золотой росток',
        image: '/assets/images/resources/golden_sprout.webp',
        rarity: 'EPIC',
    },
    dragon_scale: {
        name: 'Чешуя дракона',
        image: '/assets/images/resources/dragon_scale.webp',
        rarity: 'LEGENDARY',
    },
    lava_heart: {
        name: 'Сердце лавы',
        image: '/assets/images/resources/lava_heart.webp',
        rarity: 'LEGENDARY',
    },
};

const getLootRarityColor = (rarity: string) => {
    switch (rarity) {
        case 'COMMON':
            return '#b0c4de';
        case 'UNCOMMON':
            return '#4ade80';
        case 'RARE':
            return '#3b82f6';
        case 'EPIC':
            return '#a855f7';
        case 'LEGENDARY':
            return '#f97316';
        case 'MYTHIC':
            return '#ef4444';
        default:
            return '#ffffff';
    }
};

export interface BattleResultData {
    isVictory: boolean;
    goldEarned: number;
    xpEarned: number;
    trophiesChange: number;
    damageDealt: number;
    damageTaken: number;
    turnsPlayed: number;
    enemyName: string;
    crystalsEarned?: number;
    playerStats?: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    enemyStats?: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    battleDurationSeconds?: number;
    maxSingleHitDamage?: number;
}

interface BattleResultScreenProps {
    data: BattleResultData;
    onContinue: (target?: string | (() => void)) => void;
}

interface AnimatingXPBarProps {
    label: string;
    startLevel: number;
    endLevel: number;
    startExp: number;
    endExp: number;
    xpEarned: number;
    getExpNeededFunc: (lvl: number) => number;
    icon: React.ReactNode;
    barColor: string;
    glowColor: string;
    textColor: string;
}

const AnimatingXPBar: React.FC<AnimatingXPBarProps> = ({
    label,
    startLevel,
    endLevel,
    startExp,
    endExp,
    xpEarned,
    getExpNeededFunc,
    icon,
    barColor,
    glowColor,
    textColor,
}) => {
    const startTotal = React.useMemo(() => {
        let total = startExp;
        for (let l = 1; l < startLevel; l++) {
            total += getExpNeededFunc(l);
        }
        return total;
    }, [startLevel, startExp, getExpNeededFunc]);

    const endTotal = React.useMemo(() => {
        let total = endExp;
        for (let l = 1; l < endLevel; l++) {
            total += getExpNeededFunc(l);
        }
        return total;
    }, [endLevel, endExp, getExpNeededFunc]);

    const getLevelAndExpFromTotal = React.useCallback(
        (totalXP: number) => {
            let l = 1;
            let remaining = totalXP;
            let needed = getExpNeededFunc(l);
            while (remaining >= needed) {
                remaining -= needed;
                l++;
                needed = getExpNeededFunc(l);
            }
            return { level: l, exp: remaining, maxExp: needed };
        },
        [getExpNeededFunc]
    );

    const [displayLevel, setDisplayLevel] = React.useState(startLevel);
    const [displayExp, setDisplayExp] = React.useState(startExp);
    const [displayMaxExp, setDisplayMaxExp] = React.useState(getExpNeededFunc(startLevel));
    
    const [isLevelUp, setIsLevelUp] = React.useState(false);
    const levelRef = React.useRef(startLevel);

    React.useEffect(() => {
        const obj = { value: startTotal };
        const duration = Math.min(2.2, Math.max(1.2, (endTotal - startTotal) / 180));
        const tween = gsap.to(obj, {
            value: endTotal,
            duration: duration,
            ease: 'power2.out',
            delay: 1.2,
            onUpdate: () => {
                const { level: currentLvl, exp: currentXp, maxExp: currentMax } = getLevelAndExpFromTotal(obj.value);
                setDisplayLevel(currentLvl);
                setDisplayExp(Math.round(currentXp));
                setDisplayMaxExp(currentMax);
                
                if (currentLvl > levelRef.current) {
                    levelRef.current = currentLvl;
                    setIsLevelUp(true);
                    audioService.playSFX(AssetsMap.AUDIO.SFX_LEVEL_UP);
                    setTimeout(() => setIsLevelUp(false), 800);
                }
            },
        });

        return () => {
            tween.kill();
        };
    }, [startTotal, endTotal, getLevelAndExpFromTotal]);

    const progressPercent = Math.min(100, (displayExp / displayMaxExp) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon}
                    <span
                        style={{
                            color: textColor,
                            fontSize: '14px',
                            fontWeight: 800,
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            transition: 'transform 0.2s',
                            transform: isLevelUp ? 'scale(1.2)' : 'scale(1)',
                            display: 'inline-block',
                        }}
                    >
                        {label}: {displayLevel}
                    </span>
                    {isLevelUp && (
                        <span
                            style={{
                                color: '#10b981',
                                fontSize: '12px',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', serif",
                                letterSpacing: '1px',
                                marginLeft: '8px',
                                textShadow: '0 0 8px rgba(16,185,129,0.6)',
                            }}
                        >
                            УРОВЕНЬ ПОВЫШЕН!
                        </span>
                    )}
                </div>
                <span
                    style={{
                        color: '#d1d5db',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: '0.5px',
                    }}
                >
                    +{xpEarned} XP ({displayExp}/{displayMaxExp} XP)
                </span>
            </div>

            <div
                style={{
                    height: '14px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '7px',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: barColor,
                        borderRadius: '7px',
                        boxShadow: `0 0 12px ${glowColor}`,
                        transition: 'width 0.05s linear',
                    }}
                />
                
                {progressPercent > 0 && progressPercent < 100 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `calc(${progressPercent}% - 6px)`,
                            top: 0,
                            width: '12px',
                            height: '100%',
                            background: '#ffffff',
                            opacity: 0.8,
                            filter: `blur(2px) drop-shadow(0 0 6px ${glowColor})`,
                            borderRadius: '50%',
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export const BattleResultScreen: React.FC<BattleResultScreenProps> = ({ data, onContinue }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

    const [showShareModal, setShowShareModal] = useState(false);
    const [shareText, setShareText] = useState('');
    const [shareNotice, setShareNotice] = useState<'idle' | 'copied' | 'story_ok' | 'story_fail'>('idle');
    const [storyLoading, setStoryLoading] = useState(false);
    const [friendLoading, setFriendLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const goToHeroes = useGameStore((state) => state.goToHeroes);
    const trophies = useGameStore((state) => state.trophies);
    const crystals = useGameStore((state) => state.crystals);
    const battleMode = useGameStore((state) => state.battleMode);
    const pveLoot = useGameStore((state) => state.pveLoot);

    const { selectedHeroId, heroes, gold, level: accountLevelVal, exp: accountExpVal } = useGameStore();
    const activeHero = heroes[selectedHeroId] || { level: 1, exp: 0 };
    const level = activeHero.level || 1;
    const exp = activeHero.exp || 0;

    const accountLevel = accountLevelVal || 1;
    const accountExp = accountExpVal || 0;

    const startAccount = React.useMemo(() => {
        let startLvl = accountLevel;
        let startXp = accountExp - data.xpEarned;
        while (startXp < 0) {
            startLvl--;
            if (startLvl < 1) {
                startLvl = 1;
                startXp = 0;
                break;
            }
            startXp += getExpNeeded(startLvl);
        }
        return { level: startLvl, exp: startXp };
    }, [accountLevel, accountExp, data.xpEarned]);

    const startHero = React.useMemo(() => {
        let startLvl = level;
        let startXp = exp - data.xpEarned;
        while (startXp < 0) {
            startLvl--;
            if (startLvl < 1) {
                startLvl = 1;
                startXp = 0;
                break;
            }
            startXp += getHeroExpNeeded(startLvl);
        }
        return { level: startLvl, exp: startXp };
    }, [level, exp, data.xpEarned]);

    const heroConfig = HEROES_DB.find(h => h.id === selectedHeroId) || HEROES_DB[0];

    const isVictory = data.isVictory;

    const getRecommendation = () => {
        if (isVictory) return null;

        const playerStats = data.playerStats;
        const enemyStats = data.enemyStats;
        const duration = data.battleDurationSeconds || 0;

        if (!playerStats || !enemyStats) return null;

        // 1. enemyAttack > playerDefense * 2 -> "Враг пробивает броню. Улучши нагрудник." -> button "В КУЗНИЦУ"
        if (enemyStats.attack > playerStats.defense * 2) {
            return {
                icon: '🛡️',
                text: 'Враг пробивает броню. Надень лучшее снаряжение.',
                buttonText: 'В АРСЕНАЛ',
                action: () => goToHeroes('HERO'),
            };
        }

        // 2. playerHp < enemyHp * 0.5 -> "Мало здоровья. Прокачай таланты выносливости." -> button "К ТАЛАНТАМ"
        if (playerStats.hp < enemyStats.hp * 0.5) {
            return {
                icon: '✨',
                text: 'Мало здоровья. Прокачай таланты выносливости.',
                buttonText: 'К ТАЛАНТАМ',
                action: () => goToHeroes('TALENTS'),
            };
        }

        // 3. бой < 5 секунд -> "Враг слишком силён. Надень лучшее оружие." -> button "В АРСЕНАЛ"
        if (duration < 5) {
            return {
                icon: '⚔️',
                text: 'Враг слишком силён. Надень лучшее оружие.',
                buttonText: 'В АРСЕНАЛ',
                action: () => goToHeroes('HERO'),
            };
        }

        // 4. playerSpeed < enemySpeed * 0.7 -> "Враг бьёт первым. Найди сапоги или кинжалы." -> button "В АРСЕНАЛ"
        if (playerStats.speed < enemyStats.speed * 0.7) {
            return {
                icon: '⚡',
                text: 'Враг бьёт первым. Найди сапоги или кинжалы.',
                buttonText: 'В АРСЕНАЛ',
                action: () => goToHeroes('HERO'),
            };
        }

        // Дефолтный совет на случай, если ни одно из условий выше не сработало
        return {
            icon: '⚔️',
            text: 'Враг слишком силён. Надень лучшее оружие.',
            buttonText: 'В АРСЕНАЛ',
            action: () => goToHeroes('HERO'),
        };
    };

    const recommendation = getRecommendation();

    useEffect(() => {
        // Stop all active hit and swing sound effects from playing
        audioService.stopAllSFX();

        const tl = gsap.timeline();

        // Затемнение фона
        tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
            // Заголовок влетает сверху
            .fromTo(
                titleRef.current,
                { y: -150, opacity: 0, scale: 0.5 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
                '-=0.1',
            )
            // Панель со статистикой появляется
            .fromTo(
                panelRef.current,
                { y: 80, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
                '-=0.2',
            )
            // Статы появляются по одному
            .fromTo(
                '.result-stat-item',
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.3, stagger: 0.1 },
                '-=0.1',
            )
            // Кнопки появляются последними
            .fromTo(
                buttonsRef.current,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
                '-=0.1',
            );

        // Simple scale fade for title instead of neon pulse
        let titleTween: gsap.core.Tween | null = null;
        if (data.isVictory) {
            titleTween = gsap.to(titleRef.current, {
                scale: 1.02,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                delay: 1,
            });
        }

        return () => {
            tl.kill();
            if (titleTween) {
                titleTween.kill();
            }
        };
    }, [data.isVictory]);

    const accentColor = isVictory ? '#fbbf24' : '#ef4444';
    const bgGradient = isVictory
        ? 'radial-gradient(ellipse at center, rgba(30,22,12,0.98) 0%, rgba(10,7,4,0.99) 100%)'
        : 'radial-gradient(ellipse at center, rgba(25,8,8,0.98) 0%, rgba(8,4,4,0.99) 100%)';

    const damageTaken = data.damageTaken || 0;

    const stats = [
        {
            icon: <span style={{ fontSize: '24px' }}>⚔️</span>,
            label: 'Нанесено урона',
            value: Math.round(data.damageDealt),
        },
        {
            icon: <span style={{ fontSize: '24px' }}>💥</span>,
            label: 'Лучший удар',
            value: `${Math.round(data.maxSingleHitDamage || 0)} ед.`,
        },
        {
            icon: <span style={{ fontSize: '24px' }}>❤️</span>,
            label: 'Получено урона',
            value: Math.round(damageTaken),
        },
        {
            icon: <span style={{ fontSize: '24px' }}>🔄</span>,
            label: 'Ходов сыграно',
            value: data.turnsPlayed,
        },
        {
            icon: (
                <img
                    src={AssetsMap.UI.ICON_GOLD_FULL}
                    style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    alt="Gold"
                />
            ),
            label: 'Золото получено',
            value: `+${data.goldEarned} (Всего: ${gold})`,
        },
        {
            icon: (
                <img
                    src={AssetsMap.UI.ICON_XP}
                    style={{
                        width: '32px',
                        height: '32px',
                        transform: 'scale(2.2)',
                        transformOrigin: 'center',
                        objectFit: 'contain',
                        display: 'block',
                    }}
                    alt="XP"
                />
            ),
            label: 'Опыт получен',
            value: `+${data.xpEarned} XP`,
        },
    ];

    if (battleMode === 'PVE') {
        if (data.crystalsEarned && data.crystalsEarned > 0) {
            stats.push({
                icon: (
                    <img
                        src={AssetsMap.UI.ICON_ALMAZ_FULL}
                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                        alt="Diamonds"
                    />
                ),
                label: 'Кристаллы',
                value: `+${data.crystalsEarned} (Всего: ${crystals})`,
            });
        }
    } else {
        stats.push({
            icon: (
                <img
                    src={AssetsMap.UI.TROPHY_PREMIUM}
                    style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    alt="Trophies"
                />
            ),
            label: 'Кубки',
            value: `${data.trophiesChange > 0 ? '+' : ''}${data.trophiesChange} (Всего: ${trophies})`,
        });
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: bgGradient,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5000,
                opacity: 0,
                pointerEvents: 'auto',
            }}
        >
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 25px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }
                .result-stat-item-animated {
                    animation: fadeInUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    opacity: 0;
                }
            `}</style>
            {/* ДЕКОРАТИВНЫЕ ЛИНИИ */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                }}
            />

            {/* ЗАГОЛОВОК РЕЗУЛЬТАТА */}
            <div ref={titleRef} style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                    style={{
                        fontSize: '85px',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '0.15em',
                        textShadow: '0 4px 15px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: 1,
                        fontFamily: "'Cinzel', serif",
                        textTransform: 'uppercase',
                    }}
                >
                    {isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
                </div>
                <div
                    style={{
                        color: '#d1d5db',
                        fontSize: '24px',
                        marginTop: '15px',
                        letterSpacing: '0.2em',
                        fontFamily: "'Cinzel', serif",
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    {isVictory ? `Победа над: ${data.enemyName}!` : `${data.enemyName} оказался сильнее`}
                </div>
            </div>

            {/* Single Centered Panel for Results */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    pointerEvents: 'auto',
                }}
            >
                {/* ПАНЕЛЬ СО СТАТИСТИКОЙ */}
                <div
                    ref={panelRef}
                    style={{
                        width: '740px',
                        background: 'linear-gradient(135deg, rgba(24, 16, 8, 0.95) 0%, rgba(12, 7, 3, 0.98) 100%)',
                        border: '2.5px solid rgba(196, 139, 59, 0.55)',
                        borderRadius: '24px',
                        padding: '24px 36px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
                    }}
                >
                    {/* РАЗДЕЛИТЕЛЬ ВВЕРХУ */}
                    <div
                        style={{
                            height: '1px',
                            background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
                            marginBottom: '25px',
                        }}
                    />

                    <div ref={statsRef} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="result-stat-item result-stat-item-animated"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 16px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    animationDelay: `${i * 150}ms`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                                    <span
                                        style={{
                                            color: '#ffffff',
                                            fontSize: '18px',
                                            letterSpacing: '0.05em',
                                            fontWeight: 700,
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        {stat.label}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        color:
                                            stat.label === 'Кубки' && data.trophiesChange < 0 ? '#f43f5e' : '#ffffff',
                                        fontWeight: 900,
                                        fontSize: '22px',
                                        fontFamily: "'Cinzel', serif",
                                    }}
                                >
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* ПРОГРЕСС ОПЫТА */}
                    <div
                        style={{
                            marginTop: '20px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}
                    >
                        {/* 1. УРОВЕНЬ АККАУНТА */}
                        <AnimatingXPBar
                            label="УРОВЕНЬ АККАУНТА"
                            startLevel={startAccount.level}
                            endLevel={accountLevel}
                            startExp={startAccount.exp}
                            endExp={accountExp}
                            xpEarned={data.xpEarned}
                            getExpNeededFunc={getExpNeeded}
                            icon={<span style={{ fontSize: '16px' }}>👑</span>}
                            barColor="linear-gradient(90deg, #d97706, #fbbf24)"
                            glowColor="rgba(251, 191, 36, 0.5)"
                            textColor="#fbbf24"
                        />

                        {/* 2. УРОВЕНЬ ГЕРОЯ */}
                        <AnimatingXPBar
                            label={`ГЕРОЙ ${heroConfig.name.toUpperCase()}`}
                            startLevel={startHero.level}
                            endLevel={level}
                            startExp={startHero.exp}
                            endExp={exp}
                            xpEarned={data.xpEarned}
                            getExpNeededFunc={getHeroExpNeeded}
                            icon={
                                <img
                                    src={heroConfig.image}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: '1.5px solid #38bdf8',
                                        objectFit: 'cover',
                                        backgroundColor: '#1c1917',
                                    }}
                                    alt={heroConfig.name}
                                />
                            }
                            barColor="linear-gradient(90deg, #0284c7, #38bdf8)"
                            glowColor="rgba(56, 189, 248, 0.5)"
                            textColor="#38bdf8"
                        />
                    </div>

                    {/* НАГРАДЫ ОБИТЕЛИ (ТОЛЬКО PVE ПОБЕДА) */}
                    {battleMode === 'PVE' && isVictory && pveLoot && (
                        <div
                            style={{
                                marginTop: '20px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                paddingTop: '15px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: '#fbbf24',
                                    letterSpacing: '2px',
                                    fontFamily: "'Cinzel', serif",
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    marginBottom: '12px',
                                }}
                            >
                                ДОБЫЧА ИЗ ОБИТЕЛИ
                            </div>
                            {(() => {
                                const activeDrops = Object.entries(pveLoot).filter(
                                    ([key, val]) =>
                                        typeof val === 'number' &&
                                        val > 0 &&
                                        key !== 'gold' &&
                                        key !== 'xp' &&
                                        key !== 'crystals',
                                );

                                if (activeDrops.length === 0) {
                                    return (
                                        <div
                                            style={{
                                                textAlign: 'center',
                                                fontSize: '12px',
                                                color: 'rgba(255,255,255,0.4)',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            Ресурсы не выпали
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            justifyContent: 'center',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {activeDrops.map(([key, count]) => {
                                            const meta = RESOURCE_METADATA[key];
                                            if (!meta) return null;
                                            const rarityColor = getLootRarityColor(meta.rarity);
                                            return (
                                                <div
                                                    key={key}
                                                    style={{
                                                        width: '74px',
                                                        height: '74px',
                                                        background: 'rgba(0,0,0,0.4)',
                                                        border: `1.5px solid ${rarityColor}aa`,
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative',
                                                        boxShadow: `0 4px 8px rgba(0,0,0,0.5), inset 0 0 10px ${rarityColor}22`,
                                                    }}
                                                >
                                                    <img
                                                        src={meta.image}
                                                        style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                                                        alt={meta.name}
                                                    />
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '2px',
                                                            right: '5px',
                                                            fontSize: '11px',
                                                            fontWeight: 900,
                                                            color: '#fff',
                                                            textShadow: '0 2px 4px #000, 0 0 4px #000',
                                                        }}
                                                    >
                                                        x{count as number}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* РАЗДЕЛИТЕЛЬ ВНИЗУ */}
                    <div
                        style={{
                            height: '1px',
                            background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
                            marginTop: '15px',
                        }}
                    />
                </div>
            </div>

            {/* SMART DEFEAT RECOMMENDATION BLOCK */}
            {!isVictory && recommendation && (
                <div
                    style={{
                        width: '700px',
                        background: 'rgba(139, 28, 28, 0.1)',
                        border: '2px solid rgba(139, 28, 28, 0.4)',
                        borderRadius: '16px',
                        padding: '12px 20px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 32px rgba(139, 28, 28, 0.15)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 10px rgba(139,28,28,0.5))' }}>
                            {recommendation.icon}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                            <span
                                style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    letterSpacing: '0.1em',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                СОВЕТ МУДРЕЦА
                            </span>
                            <span
                                style={{
                                    color: '#fff',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                {recommendation.text}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            let target: string | (() => void) = recommendation.action;
                            if (recommendation.buttonText === 'В КУЗНИЦУ') target = 'Forge';
                            else if (recommendation.buttonText === 'К ТАЛАНТАМ') target = 'Talents';
                            else if (recommendation.buttonText === 'В АРСЕНАЛ') target = 'Arsenal';
                            onContinue(target);
                        }}
                        style={{
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, #8b1c1c 0%, #581010 100%)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                            boxShadow: '0 4px 15px rgba(139,28,28,0.3)',
                            fontFamily: "'Cinzel', serif",
                            transition: 'transform 0.2s, filter 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.filter = 'brightness(1)';
                        }}
                    >
                        {recommendation.buttonText}
                    </button>
                </div>
            )}

            {/* КНОПКИ */}
            <div ref={buttonsRef} style={{ display: 'flex', gap: '20px' }}>
                {/* ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ */}
                <button
                    onClick={() => {
                        const playerName = useGameStore.getState().name || 'Игрок';
                        const durationText = data.battleDurationSeconds ? ` за ${data.battleDurationSeconds.toFixed(1)} сек.` : '';
                        const crystalsLine = data.crystalsEarned && data.crystalsEarned > 0 ? `+${data.crystalsEarned} Кристалла 💎\n` : '';
                        const trophiesLine = (data.trophiesChange || 0) > 0
                            ? `+${data.trophiesChange} Кубков 🏆\n`
                            : (data.trophiesChange || 0) < 0
                            ? `${data.trophiesChange} Кубков 📉\n`
                            : '';
                        const appId = import.meta.env.VITE_VK_APP_ID || '54585995';
                        const generatedText = data.isVictory
                            ? `⚔️ Я победил в Masters of the Wild!\n\n🏆 Результат боя:\n${playerName} vs ${(data.enemyName || 'Враг')}\nПобеда${durationText}\n\n+${(data.xpEarned ?? 0)} XP 🛡️\n+${(data.goldEarned ?? 0)} Золота 💰\n${crystalsLine}${trophiesLine}\nСыграть: https://vk.com/app${appId}`
                            : `⚔️ Masters of the Wild\nБой с ${(data.enemyName || 'Враг')} оказался тяжелым испытанием...\n\n🛡️ Результат боя:\n${playerName} vs ${(data.enemyName || 'Враг')}\nНанесено урона: ${(data.damageDealt ?? 0).toLocaleString()} ед. 💥\n${trophiesLine}\n🎮 Бросить вызов: https://vk.com/app${appId}`;
                        
                        copyToClipboard(generatedText);
                        setShareText(generatedText);
                        setShareNotice('copied');
                        setShowShareModal(true);
                    }}
                    style={{
                        padding: '12px 32px',
                        background: 'linear-gradient(180deg, #3a2212 0%, #1c0f08 100%)',
                        border: '2px solid #b45309',
                        borderRadius: '14px',
                        color: '#fbbf24',
                        fontSize: '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.15em',
                        transition: 'all 0.2s',
                        fontFamily: "'Cinzel', serif",
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                            scale: 1.05,
                            background: 'linear-gradient(180deg, #4d2f1a 0%, #29160d 100%)',
                            duration: 0.15,
                        });
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                            scale: 1,
                            background: 'linear-gradient(180deg, #3a2212 0%, #1c0f08 100%)',
                            duration: 0.15,
                        });
                    }}
                >
                    ПОДЕЛИТЬСЯ В ВК
                </button>

                {/* В ЛОББИ */}
                <button
                    onClick={() => onContinue()}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        onContinue();
                    }}
                    style={{
                        padding: '12px 48px',
                        background: isVictory
                            ? 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)'
                            : 'linear-gradient(180deg, #8b1c1c 0%, #581010 100%)',
                        border: `2px solid ${isVictory ? '#fde68a' : '#b8860b'}`,
                        borderRadius: '14px',
                        color: '#ffffff',
                        fontSize: '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.1em',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                        fontFamily: "'Cinzel', serif",
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, { scale: 1.05, duration: 0.15 });
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, { scale: 1, duration: 0.15 });
                    }}
                >
                    {battleMode === 'PVE' ? 'В ОБИТЕЛЬ' : 'ДОМОЙ'}
                </button>
            </div>

            {/* SHARE PREVIEW MODAL */}
            {showShareModal && (
                <div
                    onClick={(e) => { if (e.target === e.currentTarget) { setShowShareModal(false); setShareNotice('idle'); } }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.80)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: '16px',
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(160deg, rgba(20,12,5,0.98) 0%, rgba(8,5,2,0.99) 100%)',
                            border: '1.5px solid rgba(251,191,36,0.35)',
                            boxShadow: '0 0 60px rgba(251,191,36,0.10), 0 20px 60px rgba(0,0,0,0.9)',
                            borderRadius: '20px',
                            padding: '28px 24px 24px',
                            width: 'min(460px, 96vw)',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px',
                            fontFamily: "'Outfit', 'Nunito', sans-serif",
                        }}
                    >
                        {/* Заголовок */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(251,191,36,0.15)', paddingBottom: '14px' }}>
                            <span style={{ fontSize: '26px' }}>⚔️</span>
                            <div>
                                <div style={{ color: '#fbbf24', fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: 900, letterSpacing: '0.05em' }}>ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ</div>
                                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>Расскажи друзьям о своём бое</div>
                            </div>
                        </div>

                        {/* Превью текста поста */}
                        <div
                            style={{
                                background: 'rgba(251,191,36,0.05)',
                                border: '1px solid rgba(251,191,36,0.18)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                color: '#eedfa0',
                                fontSize: '13px',
                                lineHeight: '1.7',
                                whiteSpace: 'pre-line',
                                userSelect: 'text',
                            }}
                        >
                            {shareText}
                        </div>

                        {/* Уведомление о копировании */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: shareNotice === 'copied' ? 'rgba(34,197,94,0.12)' : shareNotice === 'story_ok' ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.10)',
                                border: `1px solid ${shareNotice === 'copied' ? 'rgba(34,197,94,0.30)' : shareNotice === 'story_ok' ? 'rgba(59,130,246,0.30)' : 'rgba(239,68,68,0.20)'}`,
                                borderRadius: '10px',
                                padding: '10px 14px',
                                color: shareNotice === 'copied' ? '#86efac' : shareNotice === 'story_ok' ? '#93c5fd' : '#fca5a5',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'all 0.3s',
                                opacity: shareNotice === 'idle' ? 0 : 1,
                            }}
                        >
                            {shareNotice === 'copied' && <><span>📋</span> Текст скопирован в буфер обмена!</>}
                            {shareNotice === 'story_ok' && <><span>✅</span> Редактор Историй ВК открыт!</>}
                            {shareNotice === 'story_fail' && <><span>⚠️</span> Истории недоступны — только копирование</>}
                        </div>

                        {/* Кнопки действий */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Опубликовать Историю */}
                            <button
                                disabled={storyLoading}
                                onClick={async () => {
                                    setStoryLoading(true);
                                    try {
                                        const res = await openStoryBox();
                                        if (res === 'shared') {
                                            setShareNotice('story_ok');
                                        } else if (res === 'failed') {
                                            setShareNotice('story_fail');
                                        }
                                    } catch (err) {
                                        console.error('Story share error:', err);
                                        setShareNotice('story_fail');
                                    } finally {
                                        setStoryLoading(false);
                                    }
                                    // Если 'cancelled' — просто ничего не показываем
                                }}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: storyLoading ? 'rgba(59,130,246,0.15)' : 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
                                    border: '1.5px solid rgba(59,130,246,0.5)',
                                    borderRadius: '12px',
                                    color: '#bfdbfe',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    cursor: storyLoading ? 'wait' : 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '0.04em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    opacity: storyLoading ? 0.7 : 1,
                                }}
                                onMouseEnter={(e) => { if (!storyLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <span style={{ fontSize: '18px' }}>📸</span>
                                {storyLoading ? 'Открываем...' : 'ОПУБЛИКОВАТЬ ИСТОРИЮ'}
                            </button>

                            {/* Отправить друзьям */}
                            <button
                                disabled={friendLoading}
                                onClick={async () => {
                                    setFriendLoading(true);
                                    try {
                                        await openShareLink();
                                    } catch (err) {
                                        console.error('Share link error:', err);
                                    } finally {
                                        setFriendLoading(false);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: friendLoading ? 'rgba(251,191,36,0.08)' : 'linear-gradient(135deg, rgba(40,24,8,0.95) 0%, rgba(28,15,5,0.98) 100%)',
                                    border: '1.5px solid rgba(251,191,36,0.35)',
                                    borderRadius: '12px',
                                    color: '#fbbf24',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    cursor: friendLoading ? 'wait' : 'pointer',
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '0.04em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    opacity: friendLoading ? 0.7 : 1,
                                }}
                                onMouseEnter={(e) => { if (!friendLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <span style={{ fontSize: '18px' }}>💬</span>
                                {friendLoading ? 'Открываем...' : 'ОТПРАВИТЬ ДРУЗЬЯМ'}
                            </button>

                            {/* Скопировать повторно */}
                            <button
                                onClick={() => {
                                    copyToClipboard(shareText);
                                    setShareNotice('copied');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    color: 'rgba(255,255,255,0.55)',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                            >
                                <span>📋</span> Скопировать текст ещё раз
                            </button>

                            {/* Закрыть */}
                            <button
                                onClick={() => { setShowShareModal(false); setShareNotice('idle'); }}
                                style={{
                                    width: '100%',
                                    padding: '9px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'rgba(255,255,255,0.30)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif",
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
                            >
                                ✕ Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
