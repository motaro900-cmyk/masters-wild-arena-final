import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface BattleResultData {
    isVictory: boolean;
    goldEarned: number;
    xpEarned: number;
    trophiesChange: number;
    damageDealt: number;
    turnsPlayed: number;
    enemyName: string;
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

    const isVictory = data.isVictory;
    const accentColor = isVictory ? '#fbbf24' : '#ef4444';
    const bgGradient = isVictory
        ? 'radial-gradient(ellipse at center, rgba(120,80,20,0.95) 0%, rgba(20,12,4,0.98) 100%)'
        : 'radial-gradient(ellipse at center, rgba(80,20,20,0.95) 0%, rgba(10,4,4,0.98) 100%)';

    const stats = [
        { icon: '⚔️', label: 'Нанесено урона', value: data.damageDealt },
        { icon: '🔄', label: 'Ходов сыграно', value: data.turnsPlayed },
        { icon: '💰', label: 'Золото получено', value: `+${data.goldEarned}` },
        { icon: '⭐', label: 'Опыт получен', value: `+${data.xpEarned} XP` },
        { icon: '🏆', label: 'Кубки', value: `${data.trophiesChange > 0 ? '+' : ''}${data.trophiesChange}` },
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
                        color: accentColor,
                        letterSpacing: '0.15em',
                        textShadow: `0 0 20px ${accentColor}, 2px 4px 0 rgba(0,0,0,0.8)`,
                        lineHeight: 1,
                        fontFamily: 'Russo One, sans-serif',
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
                    {isVictory ? `Ты победил ${data.enemyName}!` : `${data.enemyName} оказался сильнее`}
                </div>
            </div>

            {/* ПАНЕЛЬ СО СТАТИСТИКОЙ */}
            <div
                ref={panelRef}
                style={{
                    width: '700px',
                    background: 'rgba(0,0,0,0.6)',
                    border: `2px solid ${accentColor}44`,
                    borderRadius: '20px',
                    padding: '35px 50px',
                    marginBottom: '40px',
                    boxShadow: `0 0 60px ${accentColor}22, inset 0 0 30px rgba(0,0,0,0.3)`,
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
                                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                                <span style={{ color: '#9ca3af', fontSize: '18px', letterSpacing: '0.05em' }}>
                                    {stat.label}
                                </span>
                            </div>
                            <span
                                style={{
                                    color: stat.label === 'Кубки' && data.trophiesChange < 0 ? '#ef4444' : '#fbbf24',
                                    fontWeight: 900,
                                    fontSize: '22px',
                                    fontFamily: 'Russo One, sans-serif',
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
                        <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 800 }}>ПРОГРЕСС УРОВНЯ</span>
                        <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 900 }}>+{data.xpEarned} XP</span>
                    </div>
                    <div
                        style={{
                            height: '12px',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
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
                                width: '45%', // Это должно быть динамическим, но для красоты сделаем анимацию
                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                boxShadow: '0 0 15px rgba(59,130,246,0.5)',
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

            {/* КНОПКИ */}
            <div ref={buttonsRef} style={{ display: 'flex', gap: '20px' }}>
                {/* РЕВАНШ */}
                <button
                    onClick={onRematch}
                    style={{
                        padding: '20px 50px',
                        background: 'rgba(196,139,59,0.15)',
                        border: `2px solid #c48b3b`,
                        borderRadius: '14px',
                        color: '#fbbf24',
                        fontSize: '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.1em',
                        transition: 'all 0.2s',
                        fontFamily: 'Russo One, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, { scale: 1.05, duration: 0.15 });
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, { scale: 1, duration: 0.15 });
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
                            ? 'linear-gradient(180deg, #c48b3b 0%, #784a1a 100%)'
                            : 'linear-gradient(180deg, #6b7280 0%, #374151 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        color: '#fff',
                        fontSize: '22px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        letterSpacing: '0.1em',
                        boxShadow: isVictory ? '0 8px 30px rgba(196,139,59,0.4)' : '0 8px 30px rgba(0,0,0,0.3)',
                        fontFamily: 'Russo One, sans-serif',
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
