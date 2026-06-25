import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { LocalStatRow } from './components/LocalStatRow';
import { CircularGearLayout } from './components/CircularGearLayout';
import { MatchmakingNameplates } from './components/MatchmakingNameplate';
import { calculateTotalPower, calculateWinRewards } from './utils/matchmakingUtils';
import { getHeroConfig } from '../../../../configs/HeroesConfig';

interface MatchmakingFoundProps {
    opponent: {
        id: string;
        name: string;
        rating: number;
        heroImage: string;
        rankIcon: string;
        level?: number;
        equipment?: Record<string, string | null>;
        winRate?: number;
        vipLevel?: number;
        heroId?: string;
        title?: string;
        stats: {
            hp: number;
            attack: number;
            defense: number;
            speed: number;
            crit: number;
            evasion?: number;
            critChance?: number;
        };
    };
    playerHero: any;
    playerName: string;
    vipLevel: number;
    playerRank: any;
    rating: number;
    level: number;
    playerStats: any;
    shouldFlipEnemy: (src: string) => boolean;
    renderStatRow: (label: string, pVal: number, eVal: number, maxVal: number) => React.ReactNode;
    onStartFight: () => void;
}

export const MatchmakingFound: React.FC<MatchmakingFoundProps> = ({
    opponent,
    playerHero,
    playerName,
    vipLevel,
    playerRank,
    rating,
    level,
    playerStats,
    shouldFlipEnemy,
    onStartFight,
}) => {
    const { accountLevel, heroEquipment, selectedHeroId, title, name, wins, totalBattles, isPremium, winStreak } =
        useGameStore(
            useShallow((state) => ({
                accountLevel: state.level,
                heroEquipment: state.heroEquipment,
                selectedHeroId: state.selectedHeroId,
                title: state.title,
                name: state.name,
                wins: state.wins,
                totalBattles: state.totalBattles,
                isPremium: state.isPremium,
                winStreak: state.winStreak,
            })),
        );
    const [isStarting, setIsStarting] = React.useState(false);

    // --- Мемоизированные вычисления ---
    const playerEq = React.useMemo(() => {
        return heroEquipment[selectedHeroId] || {};
    }, [heroEquipment, selectedHeroId]);

    const enemyEq: Record<string, string | null> = React.useMemo(() => {
        if (opponent.equipment) return opponent.equipment;
        return {
            HELMETS: 'h1',
            SHOULDERS: 'sh_nature_spirit',
            ARMOR: 'starter_armor',
            WEAPONS: 'sword_katana_mythic',
            PANTS: 'pants_mercenary',
            SHIELDS: 'starter_shield',
            BOOTS: 'boots_wanderer',
        };
    }, [opponent.equipment]);

    const playerPower = React.useMemo(() => calculateTotalPower(playerEq), [playerEq]);
    const opponentPower = React.useMemo(() => calculateTotalPower(enemyEq), [enemyEq]);

    const winRewards = React.useMemo(
        () => calculateWinRewards(accountLevel, isPremium, rating, opponent.rating, winStreak),
        [accountLevel, isPremium, rating, opponent.rating, winStreak],
    );

    const playerWinRateStr = React.useMemo(() => {
        if (!totalBattles || totalBattles <= 0) return '—';
        return `${Math.round((wins / totalBattles) * 100)}%`;
    }, [wins, totalBattles]);

    const opponentWinRateStr = React.useMemo(() => {
        if (opponent.winRate !== undefined) return `${opponent.winRate}%`;
        return `${50 + (opponent.rating % 18)}%`;
    }, [opponent.winRate, opponent.rating]);

    return (
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
                overflow: 'hidden',
            }}
        >
            {/* Плашки имён (игрок + противник) */}
            <MatchmakingNameplates
                playerName={playerName}
                displayName={name}
                vipLevel={vipLevel}
                rating={rating}
                level={level}
                title={title}
                playerRankName={playerRank.name}
                playerWinRateStr={playerWinRateStr}
                playerHeroName={playerHero?.name || 'Панда'}
                opponentName={opponent.name}
                opponentRating={opponent.rating}
                opponentLevel={opponent.level ?? 2}
                opponentVipLevel={opponent.vipLevel}
                opponentWinRateStr={opponentWinRateStr}
                opponentHeroName={getHeroConfig(opponent.heroId || opponent.id || 'panther')?.name || 'Пантера'}
                opponentTitle={opponent.title}
            />

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
                    background: 'linear-gradient(135deg, rgba(20, 14, 5, 0.05) 0%, rgba(8, 5, 2, 0.15) 100%)',
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
                    borderRight: '4px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingRight: '6%',
                    boxShadow: '10px 0 50px rgba(245,158,11,0.2)',
                }}
            >
                <div
                    style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transform: 'translateX(120px)',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: '400px',
                            height: '420px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '135px',
                        }}
                    >
                        {/* Pedestal platform */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '300px',
                                height: '34px',
                                background:
                                    'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(10,5,2,0.95) 60%, transparent 100%)',
                                border: '1.5px solid rgba(240, 192, 64, 0.3)',
                                borderRadius: '50%',
                                boxShadow:
                                    '0 8px 24px rgba(0,0,0,0.9), inset 0 0 12px rgba(240,192,64,0.15), 0 0 16px rgba(240,192,64,0.2)',
                                zIndex: 0,
                            }}
                        />

                        <div style={{ position: 'relative', width: '400px', height: '400px', zIndex: 1 }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '-10px',
                                    background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                    filter: 'blur(8px)',
                                }}
                            />
                            <img
                                src={playerHero.image}
                                style={{
                                    width: '400px',
                                    height: '400px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.8))',
                                    position: 'relative',
                                    left: '18px',
                                }}
                                alt=""
                            />
                        </div>

                        {/* Circular equipment layout overlaid on top of the player */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 110,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            <CircularGearLayout
                                equipment={playerEq}
                                style={{ transform: 'translate(0px, 10px) scale(1.1)' }}
                            />
                        </div>
                    </div>

                    {/* ОБЩАЯ МОЩЬ (PLAYER) */}
                    <div
                        style={{
                            marginTop: '60px',
                            background: 'rgba(10, 8, 5, 0.85)',
                            border: '1.5px solid rgba(240, 192, 64, 0.35)',
                            borderRadius: '16px',
                            padding: '8px 28px 10px 28px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '230px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(240,192,64,0.05)',
                            zIndex: 15,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 900,
                                color: '#b5a695',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                fontFamily: "'Montserrat', sans-serif",
                                marginBottom: '2px',
                            }}
                        >
                            ОБЩАЯ МОЩЬ
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                                style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    color: '#fcd34d',
                                    fontFamily: "'Russo One', sans-serif",
                                    textShadow: '0 0 10px rgba(251,191,36,0.3)',
                                }}
                            >
                                {playerPower}
                            </span>
                            {playerPower === 0 && (
                                <span
                                    style={{
                                        fontSize: '10px',
                                        color: '#f97316',
                                        fontWeight: 'bold',
                                        fontFamily: "'Montserrat', sans-serif",
                                        marginLeft: '4px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Надень снаряжение!
                                </span>
                            )}
                            <img
                                src={AssetsMap.UI.ICON_POWER}
                                style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                                alt="power"
                            />
                        </div>
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
                    background: 'linear-gradient(135deg, rgba(14, 6, 22, 0.05) 0%, rgba(5, 2, 8, 0.15) 100%)',
                    clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)',
                    borderLeft: '4px solid #dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: '6%',
                    boxShadow: '-10px 0 50px rgba(220,38,38,0.2)',
                }}
            >
                <div
                    style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transform: 'translateX(-80px)',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: '400px',
                            height: '420px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '135px',
                        }}
                    >
                        {/* Pedestal platform */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '300px',
                                height: '34px',
                                background:
                                    'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(10,5,2,0.95) 60%, transparent 100%)',
                                border: '1.5px solid rgba(220, 38, 38, 0.3)',
                                borderRadius: '50%',
                                boxShadow:
                                    '0 8px 24px rgba(0,0,0,0.9), inset 0 0 12px rgba(220,38,38,0.15), 0 0 16px rgba(220,38,38,0.2)',
                                zIndex: 0,
                            }}
                        />

                        <div style={{ position: 'relative', width: '400px', height: '400px', zIndex: 1 }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '-10px',
                                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.25) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                    filter: 'blur(8px)',
                                }}
                            />
                            <img
                                src={opponent.heroImage}
                                style={{
                                    width: '400px',
                                    height: '400px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.8))',
                                    transform: shouldFlipEnemy(opponent.heroImage) ? 'scaleX(-1)' : 'none',
                                    position: 'relative',
                                    right: '18px',
                                }}
                                alt=""
                            />
                        </div>

                        {/* Circular equipment layout overlaid on top of the opponent */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 110,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            <CircularGearLayout
                                equipment={enemyEq}
                                isMirrored={true}
                                style={{ transform: 'scaleX(-1) translate(0px, 10px) scale(1.1)' }}
                            />
                        </div>
                    </div>

                    {/* ОБЩАЯ МОЩЬ (OPPONENT) */}
                    <div
                        style={{
                            marginTop: '60px',
                            background: 'rgba(10, 8, 5, 0.85)',
                            border: '1.5px solid rgba(240, 192, 64, 0.35)',
                            borderRadius: '16px',
                            padding: '8px 28px 10px 28px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '230px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(240,192,64,0.05)',
                            zIndex: 15,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 900,
                                color: '#b5a695',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                fontFamily: "'Montserrat', sans-serif",
                                marginBottom: '2px',
                            }}
                        >
                            ОБЩАЯ МОЩЬ
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                                style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    color: '#fcd34d',
                                    fontFamily: "'Russo One', sans-serif",
                                    textShadow: '0 0 10px rgba(251,191,36,0.3)',
                                }}
                            >
                                {opponentPower}
                            </span>
                            <img
                                src={AssetsMap.UI.ICON_POWER}
                                style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                                alt="power"
                            />
                        </div>
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
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(20, 14, 8, 0.95) 0%, rgba(10, 5, 2, 0.98) 100%)',
                        border: '1.5px solid rgba(240, 192, 64, 0.35)',
                        borderRadius: '16px',
                        padding: '38px 20px 24px 20px',
                        width: '370px',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(240, 192, 64, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transform: 'translateY(-20px)',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* СРАВНЕНИЕ БОЙЦОВ */}
                    <div
                        style={{
                            fontSize: '24px',
                            color: '#fbbf24',
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 900,
                            letterSpacing: '2px',
                            textShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
                            textAlign: 'center',
                            marginBottom: '4px',
                        }}
                    >
                        СРАВНЕНИЕ БОЙЦОВ
                    </div>

                    {/* VS */}
                    <div
                        style={{
                            fontSize: '36px',
                            color: '#fbbf24',
                            fontFamily: "'Russo One', sans-serif",
                            fontStyle: 'italic',
                            textShadow: '0 0 15px rgba(251, 191, 36, 0.6), 0 2px 4px #000',
                            lineHeight: '1',
                            marginBottom: '22px',
                        }}
                    >
                        VS
                    </div>

                    {/* Stats Box */}
                    <div
                        style={{
                            width: '100%',
                            background: 'rgba(10, 8, 5, 0.9)',
                            border: '1px solid rgba(240, 192, 64, 0.25)',
                            borderRadius: '12px',
                            padding: '16px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxSizing: 'border-box',
                            marginBottom: '16px',
                        }}
                    >
                        <LocalStatRow
                            label="ЗДОРОВЬЕ"
                            pVal={playerStats.hp}
                            eVal={opponent.stats.hp}
                            icon={
                                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                    ❤️
                                </span>
                            }
                        />
                        <LocalStatRow
                            label="АТАКА"
                            pVal={playerStats.attack}
                            eVal={opponent.stats.attack}
                            icon={
                                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                    ⚔️
                                </span>
                            }
                        />
                        <LocalStatRow
                            label="ЗАЩИТА"
                            pVal={playerStats.defense}
                            eVal={opponent.stats.defense}
                            icon={
                                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                    🛡️
                                </span>
                            }
                        />
                        <LocalStatRow
                            label="СКОРОСТЬ"
                            pVal={playerStats.speed ?? 1}
                            eVal={opponent.stats.speed ?? 1}
                            icon={
                                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                    💨
                                </span>
                            }
                        />
                        <LocalStatRow
                            label="КРИТ. ШАНС"
                            pVal={playerStats.critChance ?? 5}
                            eVal={opponent.stats.critChance ?? 5}
                            icon={
                                <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                    💥
                                </span>
                            }
                        />
                    </div>


                    {/* Reward Box */}
                    <div
                        style={{
                            width: '100%',
                            background: 'rgba(10, 8, 5, 0.9)',
                            border: '1px solid rgba(240, 192, 64, 0.25)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                            marginBottom: '20px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: 900,
                                color: '#b5a695',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '12px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                        >
                            НАГРАДА ЗА ПОБЕДУ
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                    }}
                                    alt="gold"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span
                                        style={{
                                            fontSize: '17px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: '1.1',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        {winRewards.goldRange}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: '#fbbf24',
                                            textTransform: 'uppercase',
                                            marginTop: '2px',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        золото
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                    src={AssetsMap.UI.ICON_XP}
                                    style={{
                                        width: '58px',
                                        height: '58px',
                                        margin: '0 -15px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                    }}
                                    alt="xp"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span
                                        style={{
                                            fontSize: '17px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: '1.1',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        {winRewards.xp}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: '#fbbf24',
                                            textTransform: 'uppercase',
                                            marginTop: '2px',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        опыт
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                    src={AssetsMap.UI.TROPHY_PREMIUM}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        objectFit: 'contain',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                    }}
                                    alt="trophy"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span
                                        style={{
                                            fontSize: '17px',
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: '1.1',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        {winRewards.trophies}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: '#fbbf24',
                                            textTransform: 'uppercase',
                                            marginTop: '2px',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        кубки
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Кнопка НАЧАТЬ БОЙ */}
                    <button
                        onClick={() => {
                            if (isStarting) return;
                            setIsStarting(true);
                            onStartFight();
                        }}
                        disabled={isStarting}
                        onMouseEnter={(e) => {
                            if (isStarting) return;
                            e.currentTarget.style.transform = 'scale(1.03)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                            if (isStarting) return;
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.4)';
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            background: isStarting
                                ? 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)'
                                : 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                            border: isStarting ? '2.5px solid #4b5563' : '2.5px solid #fcd34d',
                            borderRadius: '8px',
                            color: isStarting ? '#9ca3af' : '#fff',
                            fontSize: '15px',
                            fontWeight: 900,
                            cursor: isStarting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isStarting ? 'none' : '0 8px 16px rgba(245, 158, 11, 0.4)',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            marginBottom: '0px',
                            opacity: isStarting ? 0.7 : 1,
                        }}
                    >
                        {isStarting ? 'ЗАГРУЗКА...' : 'НАЧАТЬ БОЙ'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
