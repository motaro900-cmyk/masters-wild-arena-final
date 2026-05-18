import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { getRankInfo } from '../../../configs/RankSystem';
import { getHeroConfig } from '../../../configs/HeroesConfig';
import { MOBS_DB } from '../../../configs/MobsConfig';
import { audioService } from '../../../services/AudioService';

interface MatchmakingOverlayProps {
    onFound: (enemyId?: string) => void;
    onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({ onFound, onCancel }) => {
    const { name, rating, vipLevel, selectedHeroId, level, getCalculatedStats } = useGameStore();

    const [state, setState] = useState<'SEARCHING' | 'FOUND'>('SEARCHING');
    const [seconds, setSeconds] = useState(0);
    const [searchRange, setSearchRange] = useState(50);
    // Removed unused countdown state

    // Данные оппонента
    const [opponent, setOpponent] = useState<{
        id: string;
        name: string;
        rating: number;
        heroImage: string;
        rankIcon: string;
        stats: { hp: number; attack: number; defense: number; speed: number; crit: number };
    } | null>(null);

    const playerHero = getHeroConfig(selectedHeroId);
    const playerRank = getRankInfo(rating);

    // Эффект поиска
    useEffect(() => {
        if (state !== 'SEARCHING') return;

        const interval = setInterval(() => {
            setSeconds((s) => {
                const nextSec = s + 1;
                // Расширяем диапазон каждые 2 секунды
                if (nextSec % 2 === 0) {
                    setSearchRange((r) => r + 100);
                }
                return nextSec;
            });
        }, 1000);

        // Поиск длится от 4 до 6 секунд
        const searchTime = 4500 + Math.random() * 1500;
        const timeout = setTimeout(() => {
            // Генерируем оппонента
            // Generate opponent data
            const oppRating = Math.max(0, rating + Math.floor(Math.random() * 110) - 50);
            const oppRankInfo = getRankInfo(oppRating);

            // Выбираем случайного моба для рейтингового боя
            const possibleMobs = ['wolf_scout', 'iron_boar', 'shadow_panther'];
            const randomMobId = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
            const oppHero = MOBS_DB.find((m) => m.id === randomMobId) || MOBS_DB[0];

            setOpponent({
                id: oppHero.id,
                name: oppHero.name,
                rating: oppRating,
                heroImage: oppHero.image,
                rankIcon: oppRankInfo.icon,
                stats: oppHero.baseStats,
            });

            audioService.playSFX(AssetsMap.AUDIO.SFX_BUY); // Звук нахождения матча
            audioService.playSFX(AssetsMap.AUDIO.SFX_HIT); // Громкий удар
            setState('FOUND');
        }, searchTime);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [state, rating, selectedHeroId]);

    // Обратный отсчет перед началом боя
    const onFoundRef = React.useRef(onFound);
    useEffect(() => {
        onFoundRef.current = onFound;
    }, [onFound]);

    useEffect(() => {
        // Countdown removed. The player will click "Начать бой" manually.
    }, [state]);

    const playerStats = getCalculatedStats(selectedHeroId)?.total || {
        hp: 100,
        attack: 10,
        defense: 5,
        speed: 1.0,
        crit: 0.1,
    };

    let forecast = 50;
    if (opponent) {
        const pScore = playerStats.hp + playerStats.attack * 10 + playerStats.defense * 10;
        const eScore = opponent.stats.hp + opponent.stats.attack * 10 + opponent.stats.defense * 10;
        forecast = Math.max(5, Math.min(95, Math.round((pScore / (pScore + eScore)) * 100)));
    }

    const renderStatRow = (label: string, pVal: number, eVal: number, maxVal: number) => {
        const pPct = Math.min(100, Math.max(0, (pVal / maxVal) * 100));
        const ePct = Math.min(100, Math.max(0, (eVal / maxVal) * 100));
        const pColor = pVal >= eVal ? '#22c55e' : '#a8a29e';
        const eColor = eVal >= pVal ? '#ef4444' : '#a8a29e';

        return (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '15px' }} key={label}>
                <div style={{ width: '40px', textAlign: 'right', color: pColor, fontWeight: 'bold' }}>
                    {Math.round(pVal)}
                </div>
                <div
                    style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ width: `${pPct}%`, height: '100%', background: pColor, borderRadius: '4px' }} />
                </div>
                <div
                    style={{
                        width: '120px',
                        textAlign: 'center',
                        color: '#fef3c7',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: "'Montserrat', sans-serif",
                        letterSpacing: '1px',
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ width: `${ePct}%`, height: '100%', background: eColor, borderRadius: '4px' }} />
                </div>
                <div style={{ width: '40px', textAlign: 'left', color: eColor, fontWeight: 'bold' }}>
                    {Math.round(eVal)}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${AssetsMap.BACKGROUNDS.RANKED_LOBBY})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                pointerEvents: 'auto',
                overflow: 'hidden',
            }}
        >
            {/* Тонкий оверлей размытия и затемнения для читаемости в поиске, который плавно ослабевает во время версуса */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: state === 'SEARCHING' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.05)',
                    backdropFilter: state === 'SEARCHING' ? 'blur(4px)' : 'none',
                    transition: 'all 0.8s ease-in-out',
                    zIndex: 0,
                }}
            />
            <AnimatePresence mode="wait">
                {state === 'SEARCHING' ? (
                    <motion.div
                        key="searching-lobby"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '580px',
                            height: '580px',
                            position: 'relative',
                            zIndex: 1,
                            background: 'linear-gradient(135deg, rgba(26, 17, 8, 0.75) 0%, rgba(10, 5, 2, 0.9) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '3px solid rgba(240, 192, 64, 0.45)',
                            borderRadius: '32px',
                            boxShadow:
                                '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(240, 192, 64, 0.15), inset 0 0 25px rgba(255, 255, 255, 0.04)',
                            padding: '40px',
                        }}
                    >
                        {/* Контент поверх */}
                        <div
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginTop: '0px',
                            }}
                        >
                            {/* Анимированный Круг Поиска / Радар */}
                            <div
                                style={{
                                    position: 'relative',
                                    width: '140px',
                                    height: '140px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                }}
                            >
                                <motion.div
                                    animate={{
                                        scale: [1, 2.2],
                                        opacity: [0.7, 0],
                                    }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute',
                                        width: '100px',
                                        height: '100px',
                                        border: '3px solid #d97706',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 20px rgba(217, 119, 6, 0.4)',
                                    }}
                                />
                                <motion.div
                                    animate={{
                                        rotate: 360,
                                    }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                    style={{
                                        position: 'absolute',
                                        width: '120px',
                                        height: '120px',
                                        border: '2px dashed rgba(217, 119, 6, 0.3)',
                                        borderRadius: '50%',
                                    }}
                                />
                                <img
                                    src={playerHero.image}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                                    }}
                                    alt="Hero"
                                />
                                <img
                                    src={playerRank.icon}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-5px',
                                        right: '-5px',
                                        width: '45px',
                                        height: '45px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
                                    }}
                                    alt="Rank"
                                />
                            </div>

                            {/* Информация о текущей лиге игрока */}
                            <div
                                style={{
                                    color: '#fbbf24',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '28px',
                                    fontWeight: 900,
                                    letterSpacing: '3px',
                                    marginBottom: '4px',
                                    textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)',
                                }}
                            >
                                {name}
                            </div>
                            <div
                                style={{
                                    color: '#fef3c7',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    marginBottom: '8px',
                                    opacity: 0.9,
                                }}
                            >
                                {playerHero.name} • Уровень {level}
                            </div>
                            <div
                                style={{
                                    color: '#e2e8f0',
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    marginBottom: '24px',
                                    opacity: 0.9,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                }}
                            >
                                <span style={{ color: '#fbbf24' }}>{rating} 🏆</span> • {playerRank.name}
                            </div>

                            {/* Статус поиска */}
                            <div
                                style={{
                                    color: '#fbbf24',
                                    fontSize: '24px',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif",
                                    letterSpacing: '2px',
                                    marginBottom: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textShadow: '0 0 12px rgba(251, 191, 36, 0.4)',
                                }}
                            >
                                ПОИСК СОПЕРНИКА
                                <span className="flex gap-1" style={{ position: 'relative', top: '-2px' }}>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                                    >
                                        .
                                    </motion.span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                                    >
                                        .
                                    </motion.span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                                    >
                                        .
                                    </motion.span>
                                </span>
                            </div>

                            {/* Подробности алгоритма (Времени прошло / Диапазон) */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(0, 0, 0, 0.45)',
                                    padding: '14px 28px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(251, 191, 36, 0.25)',
                                    marginBottom: '30px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#e2e8f0',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        fontFamily: "'Montserrat', sans-serif",
                                    }}
                                >
                                    ВРЕМЯ В ОЧЕРЕДИ:{' '}
                                    <span style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 900 }}>
                                        {Math.floor(seconds / 60)
                                            .toString()
                                            .padStart(2, '0')}
                                        :{(seconds % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        color: '#fef3c7',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        fontFamily: "'Montserrat', sans-serif",
                                    }}
                                >
                                    ДИАПАЗОН КУБКОВ:{' '}
                                    <span style={{ color: '#fbbf24', fontWeight: 900 }}>
                                        {Math.max(0, rating - searchRange)} - {rating + searchRange} 🏆
                                    </span>
                                </div>
                            </div>

                            {/* Кнопка отмены */}
                            <motion.button
                                whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.2)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                style={{
                                    padding: '14px 44px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: '#94a3b8',
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                ОТМЕНИТЬ ПОИСК
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    opponent && (
                        <motion.div
                            key="versus-cinematic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {/* СЕТКА VS: ЛЕВАЯ ПОЛОВИНА (ИГРОК) */}
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 100 }}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '50.5%',
                                    height: '100%',
                                    background:
                                        'linear-gradient(135deg, rgba(20, 14, 5, 0.1) 0%, rgba(8, 5, 2, 0.3) 100%)',
                                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
                                    borderRight: '4px solid #f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingRight: '10%',
                                    boxShadow: '10px 0 50px rgba(245,158,11,0.2)',
                                }}
                            >
                                <div
                                    style={{
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                                        {/* Свечение */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: '-10px',
                                                background:
                                                    'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
                                                borderRadius: '50%',
                                                filter: 'blur(8px)',
                                            }}
                                        />
                                        <img
                                            src={playerHero.image}
                                            style={{
                                                width: '280px',
                                                height: '280px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))',
                                            }}
                                            alt=""
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: '#fff',
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: '32px',
                                                fontWeight: 900,
                                                letterSpacing: '1px',
                                                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                            }}
                                        >
                                            {name}
                                        </span>
                                        {vipLevel > 0 && (
                                            <span
                                                style={{
                                                    background: 'linear-gradient(135deg, #00f2ff 0%, #0066ff 100%)',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    letterSpacing: '1.5px',
                                                    boxShadow: '0 0 10px rgba(0,242,255,0.6)',
                                                    border: '1px solid rgba(255,255,255,0.3)',
                                                }}
                                            >
                                                VIP
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={playerRank.icon} style={{ width: '40px', height: '40px' }} alt="" />
                                        <span
                                            style={{
                                                color: '#fef3c7',
                                                fontSize: '18px',
                                                fontWeight: 900,
                                                fontFamily: "'Montserrat', sans-serif",
                                            }}
                                        >
                                            {playerRank.name} <span style={{ color: '#d97706' }}>• {rating} 🏆</span>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* СЕТКА VS: ПРАВАЯ ПОЛОВИНА (СОПЕРНИК) */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 100 }}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    width: '50.5%',
                                    height: '100%',
                                    background:
                                        'linear-gradient(135deg, rgba(14, 6, 22, 0.1) 0%, rgba(5, 2, 8, 0.3) 100%)',
                                    clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)',
                                    borderLeft: '4px solid #dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingLeft: '10%',
                                    boxShadow: '-10px 0 50px rgba(220,38,38,0.2)',
                                }}
                            >
                                <div
                                    style={{
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                                        {/* Свечение */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: '-10px',
                                                background:
                                                    'radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)',
                                                borderRadius: '50%',
                                                filter: 'blur(8px)',
                                            }}
                                        />
                                        <img
                                            src={opponent.heroImage}
                                            style={{
                                                width: '280px',
                                                height: '280px',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))',
                                            }}
                                            alt=""
                                        />
                                    </div>
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontFamily: "'Cinzel', serif",
                                            fontSize: '32px',
                                            fontWeight: 900,
                                            letterSpacing: '1px',
                                            marginBottom: '8px',
                                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        {opponent.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={opponent.rankIcon} style={{ width: '40px', height: '40px' }} alt="" />
                                        <span
                                            style={{
                                                color: '#fef3c7',
                                                fontSize: '18px',
                                                fontWeight: 900,
                                                fontFamily: "'Montserrat', sans-serif",
                                            }}
                                        >
                                            Противник <span style={{ color: '#ef4444' }}>• {opponent.rating} 🏆</span>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ОВЕРЛЕЙ И ПАНЕЛЬ СРАВНЕНИЯ */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring', damping: 25 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'none',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(26, 17, 8, 0.85) 0%, rgba(10, 5, 2, 0.95) 100%)',
                                        backdropFilter: 'blur(20px)',
                                        border: '2px solid rgba(240, 192, 64, 0.4)',
                                        borderRadius: '24px',
                                        padding: '40px',
                                        width: '800px',
                                        boxShadow:
                                            '0 30px 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(240, 192, 64, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '28px',
                                            color: '#fbbf24',
                                            fontFamily: "'Cinzel', serif",
                                            fontWeight: 900,
                                            marginBottom: '30px',
                                            letterSpacing: '2px',
                                            textShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
                                        }}
                                    >
                                        СРАВНЕНИЕ БОЙЦОВ
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            marginBottom: '40px',
                                        }}
                                    >
                                        {/* Player */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: '30%',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: '#fef3c7',
                                                    fontSize: '20px',
                                                    fontWeight: 900,
                                                    fontFamily: "'Cinzel', serif",
                                                    marginBottom: '10px',
                                                }}
                                            >
                                                ВЫ
                                            </div>
                                            <img
                                                src={playerHero.image}
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'contain',
                                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                                                }}
                                                alt=""
                                            />
                                            <div
                                                style={{
                                                    color: '#10b981',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    marginTop: '10px',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                }}
                                            >
                                                {name}
                                            </div>
                                            <div style={{ color: '#fef3c7', fontSize: '14px', fontWeight: 'bold' }}>
                                                Уровень {level} • {playerRank.name}
                                            </div>
                                        </div>

                                        {/* VS */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '20%',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: '48px',
                                                    color: '#f59e0b',
                                                    fontFamily: "'Russo One', sans-serif",
                                                    fontStyle: 'italic',
                                                    textShadow:
                                                        '0 4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.5)',
                                                }}
                                            >
                                                VS
                                            </div>
                                        </div>

                                        {/* Enemy */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: '30%',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: '#fef3c7',
                                                    fontSize: '20px',
                                                    fontWeight: 900,
                                                    fontFamily: "'Cinzel', serif",
                                                    marginBottom: '10px',
                                                }}
                                            >
                                                ВРАГ
                                            </div>
                                            <img
                                                src={opponent.heroImage}
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'contain',
                                                    transform: 'scaleX(-1)',
                                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                                                }}
                                                alt=""
                                            />
                                            <div
                                                style={{
                                                    color: '#ef4444',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    marginTop: '10px',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                }}
                                            >
                                                {opponent.name}
                                            </div>
                                            <div style={{ color: '#fef3c7', fontSize: '14px', fontWeight: 'bold' }}>
                                                Монстр
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '20px',
                                            marginBottom: '40px',
                                        }}
                                    >
                                        {renderStatRow(
                                            'ЗДОРОВЬЕ',
                                            playerStats.hp,
                                            opponent.stats.hp,
                                            Math.max(playerStats.hp, opponent.stats.hp) * 1.2,
                                        )}
                                        {renderStatRow(
                                            'АТАКА',
                                            playerStats.attack,
                                            opponent.stats.attack,
                                            Math.max(playerStats.attack, opponent.stats.attack) * 1.2,
                                        )}
                                        {renderStatRow(
                                            'ЗАЩИТА',
                                            playerStats.defense,
                                            opponent.stats.defense,
                                            Math.max(playerStats.defense, opponent.stats.defense) * 1.2,
                                        )}
                                        {renderStatRow(
                                            'СКОРОСТЬ',
                                            playerStats.speed,
                                            opponent.stats.speed,
                                            Math.max(playerStats.speed, opponent.stats.speed) * 1.2,
                                        )}
                                    </div>

                                    {/* Forecast */}
                                    <div
                                        style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '15px 40px',
                                            borderRadius: '16px',
                                            marginBottom: '30px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(240, 192, 64, 0.2)',
                                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#fef3c7',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                marginBottom: '8px',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            ПРОГНОЗ
                                        </div>
                                        <div
                                            style={{
                                                color: '#fbbf24',
                                                fontSize: '24px',
                                                fontWeight: 900,
                                                fontFamily: "'Montserrat', sans-serif",
                                            }}
                                        >
                                            {forecast >= 60
                                                ? 'Победа вероятна'
                                                : forecast <= 40
                                                  ? 'Тяжелый бой'
                                                  : 'Равный бой'}{' '}
                                            ~{forecast}%
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '20px',
                                            width: '100%',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <button
                                            onClick={onCancel}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                            style={{
                                                padding: '16px 40px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                color: '#fef3c7',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontFamily: "'Cinzel', serif",
                                            }}
                                        >
                                            НАЗАД
                                        </button>
                                        <button
                                            onClick={() => onFoundRef.current(opponent.id)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.6)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(245, 158, 11, 0.4)';
                                            }}
                                            style={{
                                                padding: '16px 40px',
                                                background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                                                border: '2px solid #fcd34d',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 10px 20px rgba(245, 158, 11, 0.4)',
                                                fontFamily: "'Cinzel', serif",
                                            }}
                                        >
                                            НАЧАТЬ БОЙ
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </div>
    );
};
