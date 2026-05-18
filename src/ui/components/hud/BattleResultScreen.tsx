import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGameStore } from '../../../store/useGameStore';

export interface BattleResultData {
    isVictory: boolean;
    goldEarned: number;
    xpEarned: number;
    trophiesChange: number;
    damageDealt: number;
    turnsPlayed: number;
    enemyName: string;
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
}

interface BattleResultScreenProps {
    data: BattleResultData;
    onContinue: () => void;
    onRematch: () => void;
}

export const BattleResultScreen: React.FC<BattleResultScreenProps> = ({ data, onContinue, onRematch }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

    const goToForge = useGameStore((state) => state.goToForge);
    const goToHeroes = useGameStore((state) => state.goToHeroes);
    const trophies = useGameStore((state) => state.trophies);

    const { level, exp, gold } = useGameStore();

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
                text: 'Враг пробивает броню. Улучши нагрудник.',
                buttonText: 'В КУЗНИЦУ',
                action: goToForge,
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

        // Пульсация заголовка
        if (data.isVictory) {
            gsap.to(titleRef.current, {
                textShadow: '0 0 40px rgba(251,191,36,0.9)',
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                delay: 1,
            });
        }
    }, [data.isVictory]);

    const accentColor = isVictory ? '#fbbf24' : '#ef4444';
    const bgGradient = isVictory
        ? 'radial-gradient(ellipse at center, rgba(100,70,20,0.95) 0%, rgba(15,10,5,0.98) 100%)'
        : 'radial-gradient(ellipse at center, rgba(60,10,10,0.95) 0%, rgba(10,5,5,0.98) 100%)';

    const stats = [
        { icon: '⚔️', label: 'Нанесено урона', value: Math.round(data.damageDealt) },
        { icon: '🔄', label: 'Ходов сыграно', value: data.turnsPlayed },
        { icon: '💰', label: 'Золото получено', value: `+${data.goldEarned} (Всего: ${gold})` },
        { icon: '⭐', label: 'Опыт получен', value: `+${data.xpEarned} XP` },
        {
            icon: '🏆',
            label: 'Кубки',
            value: `${data.trophiesChange > 0 ? '+' : ''}${data.trophiesChange} (Всего: ${trophies})`,
        },
    ];

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1920px',
                height: '1080px',
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
            <div ref={titleRef} style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div
                    style={{
                        fontSize: '120px',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '0.15em',
                        textShadow: `0 0 25px ${accentColor}, 0 0 50px ${accentColor}, 4px 6px 0 rgba(0,0,0,0.9)`,
                        lineHeight: 1,
                        fontFamily: 'Russo One, sans-serif',
                        textTransform: 'uppercase',
                    }}
                >
                    {isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
                </div>
                <div
                    style={{
                        color: '#d1d5db',
                        fontSize: '28px',
                        marginTop: '10px',
                        letterSpacing: '0.2em',
                    }}
                >
                    {isVictory ? `Победа над: ${data.enemyName}!` : `${data.enemyName} оказался сильнее`}
                </div>
            </div>

            {/* ПАНЕЛЬ СО СТАТИСТИКОЙ */}
            <div
                ref={panelRef}
                style={{
                    width: '700px',
                    background: isVictory ? 'rgba(30,20,5,0.85)' : 'rgba(30,5,5,0.85)',
                    border: `2px solid ${accentColor}66`,
                    borderRadius: '20px',
                    padding: '35px 50px',
                    marginBottom: '40px',
                    boxShadow: `0 0 60px ${accentColor}33, inset 0 0 30px rgba(0,0,0,0.5)`,
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
                            className="result-stat-item"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 15px',
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px', filter: `drop-shadow(0 0 5px ${accentColor})` }}>
                                    {stat.icon}
                                </span>
                                <span
                                    style={{
                                        color: '#ffffff',
                                        fontSize: '18px',
                                        letterSpacing: '0.05em',
                                        fontWeight: 700,
                                    }}
                                >
                                    {stat.label}
                                </span>
                            </div>
                            <span
                                style={{
                                    color: stat.label === 'Кубки' && data.trophiesChange < 0 ? '#ef4444' : '#ffffff',
                                    fontWeight: 900,
                                    fontSize: '22px',
                                    fontFamily: 'Russo One, sans-serif',
                                    textShadow: `0 0 10px ${accentColor}`,
                                }}
                            >
                                {stat.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ПОЛОСКА ПРОГРЕССА ОПЫТА */}
                <div style={{ marginTop: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 800 }}>
                            ПРОГРЕСС УРОВНЯ: {level} УРОВЕНЬ
                        </span>
                        <span
                            style={{
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 900,
                                textShadow: `0 0 8px ${accentColor}`,
                            }}
                        >
                            +{data.xpEarned} XP (Текущий: {exp}/{level * 600} XP)
                        </span>
                    </div>
                    <div
                        style={{
                            height: '12px',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${Math.min(100, (exp / (level * 600)) * 100)}%`,
                                background: isVictory
                                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                    : 'linear-gradient(90deg, #ef4444, #f87171)',
                                boxShadow: isVictory ? '0 0 15px rgba(59,130,246,0.5)' : '0 0 15px rgba(239,68,68,0.5)',
                            }}
                        />
                    </div>
                </div>

                {/* РАЗДЕЛИТЕЛЬ ВНИЗУ */}
                <div
                    style={{
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
                        marginTop: '25px',
                    }}
                />
            </div>

            {/* SMART DEFEAT RECOMMENDATION BLOCK */}
            {!isVictory && recommendation && (
                <div
                    style={{
                        width: '700px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        marginBottom: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' }}>
                            {recommendation.icon}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                            <span
                                style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    letterSpacing: '0.1em',
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
                            onContinue();
                            recommendation.action();
                        }}
                        style={{
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                            boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
                            fontFamily: 'Russo One, sans-serif',
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
                {/* РЕВАНШ */}
                <button
                    onClick={onRematch}
                    style={{
                        padding: '20px 50px',
                        background: isVictory ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `2px solid ${accentColor}`,
                        borderRadius: '14px',
                        color: isVictory ? '#fbbf24' : '#ffffff',
                        fontSize: '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.1em',
                        transition: 'all 0.2s',
                        fontFamily: 'Russo One, sans-serif',
                        textShadow: `0 0 8px ${isVictory ? 'rgba(251,191,36,0.8)' : 'rgba(239,68,68,0.8)'}`,
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                            scale: 1.05,
                            background: isVictory ? 'rgba(251, 191, 36, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                            duration: 0.15,
                        });
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                            scale: 1,
                            background: isVictory ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            duration: 0.15,
                        });
                    }}
                >
                    ⚔️ РЕВАНШ
                </button>

                {/* В ЛОББИ */}
                <button
                    onClick={onContinue}
                    style={{
                        padding: '20px 60px',
                        background: isVictory
                            ? 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)'
                            : 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)',
                        border: `2px solid ${isVictory ? '#fde68a' : '#f87171'}`,
                        borderRadius: '14px',
                        color: '#ffffff',
                        fontSize: '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.1em',
                        boxShadow: `0 8px 30px ${isVictory ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        fontFamily: 'Russo One, sans-serif',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, { scale: 1.05, duration: 0.15 });
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, { scale: 1, duration: 0.15 });
                    }}
                >
                    🏠 В ЛОББИ
                </button>
            </div>
        </div>
    );
};
