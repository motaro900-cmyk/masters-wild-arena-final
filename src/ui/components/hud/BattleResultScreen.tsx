import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { shareBattleResult } from '../../../utils/VKBridge';
import { audioService } from '../../../services/AudioService';

const RESOURCE_METADATA: Record<string, { name: string; image: string; rarity: string }> = {
    coal: { name: 'Уголь', image: '/assets/images/resources/coal.png', rarity: 'COMMON' },
    steel_bars: { name: 'Стальной слиток', image: '/assets/images/resources/steel_bar.png', rarity: 'RARE' },
    runic_shards: { name: 'Рунический осколок', image: '/assets/images/resources/runic_shard.png', rarity: 'EPIC' },
    ancient_compass: { name: 'Древний компас', image: '/assets/images/resources/gemini-0-5-25-00-Photoroom (1)-export.png', rarity: 'RARE' },
    astral_crystal: { name: 'Астральный кристалл', image: '/assets/images/resources/gemini-02-5-25-00-Photoroom (1)-export.png', rarity: 'RARE' },
    void_sphere: { name: 'Сфера бездны', image: '/assets/images/resources/gemini-202-05-25-00-Photoroom (1)-export.png', rarity: 'EPIC' },
    golden_sprout: { name: 'Золотой росток', image: '/assets/images/resources/gemini-2026-05-25-00-Photoroom (1)-export.png', rarity: 'EPIC' },
    dragon_scale: { name: 'Чешуя дракона', image: '/assets/images/resources/gemini-2026-05-25-002-Photoroom (1)-export.png', rarity: 'LEGENDARY' },
    lava_heart: { name: 'Сердце лавы', image: '/assets/images/resources/gemini-2026-05-25-0012-Photoroom (1)-export.png', rarity: 'LEGENDARY' },
};

const getLootRarityColor = (rarity: string) => {
    switch (rarity) {
        case 'COMMON': return '#b0c4de';
        case 'UNCOMMON': return '#4ade80';
        case 'RARE': return '#3b82f6';
        case 'EPIC': return '#a855f7';
        case 'LEGENDARY': return '#f97316';
        case 'MYTHIC': return '#ef4444';
        default: return '#ffffff';
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
}

interface BattleResultScreenProps {
    data: BattleResultData;
    onContinue: () => void;
}

export const BattleResultScreen: React.FC<BattleResultScreenProps> = ({ data, onContinue }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

    const goToForge = useGameStore((state) => state.goToForge);
    const goToHeroes = useGameStore((state) => state.goToHeroes);
    const trophies = useGameStore((state) => state.trophies);
    const crystals = useGameStore((state) => state.crystals);
    const battleMode = useGameStore((state) => state.battleMode);
    const pveLoot = useGameStore((state) => state.pveLoot);

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
        if (data.isVictory) {
            gsap.to(titleRef.current, {
                scale: 1.02,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                delay: 1,
            });
        }
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
                                className="result-stat-item"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 16px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '24px' }}>
                                        {stat.icon}
                                    </span>
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

                    {/* ПОЛОСКА ПРОГРЕССА ОПЫТА */}
                    <div style={{ marginTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span
                                style={{
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                ПРОГРЕСС УРОВНЯ: {level} УРОВЕНЬ
                            </span>
                            <span
                                style={{
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
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
                                        : 'linear-gradient(90deg, #8b1c1c, #b91c1c)',
                                }}
                            />
                        </div>
                    </div>

                    {/* НАГРАДЫ ОБИТЕЛИ (ТОЛЬКО PVE ПОБЕДА) */}
                    {battleMode === 'PVE' && isVictory && pveLoot && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
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
                                    ([key, val]) => typeof val === 'number' && val > 0 && key !== 'gold' && key !== 'xp' && key !== 'crystals'
                                );

                                if (activeDrops.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                            Ресурсы не выпали
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                            onContinue();
                            recommendation.action();
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
                    onClick={async () => {
                        const playerName = useGameStore.getState().name || 'Игрок';
                        const status = await shareBattleResult({
                            playerName,
                            enemyName: data.enemyName,
                            damageDealt: data.damageDealt,
                            trophiesChange: data.trophiesChange || 0,
                            isVictory: data.isVictory,
                        });
                        if (status === 'copied') {
                            alert('Результат боя скопирован в буфер обмена!');
                        } else if (status === 'shared') {
                            alert('Запись опубликована на стене!');
                        }
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
                    onClick={onContinue}
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
        </div>
    );
};
