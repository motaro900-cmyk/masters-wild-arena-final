import React from 'react';
import { motion } from 'framer-motion';
import { getRankInfo } from '../../../../configs/RankSystem';
import { useGameStore } from '../../../../store/useGameStore';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { ITEMS_DATABASE, calculateItemPower } from '../../../../game/configs/ItemsConfig';
import { calculateBattleRewards } from '../../../../game/configs/GameConstants';

import { LocalStatRow } from './components/LocalStatRow';
import { CircularGearLayout } from './components/CircularGearLayout';

const LaurelLeft: React.FC = () => (
    <svg
        width="32"
        height="48"
        viewBox="0 0 32 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.85 }}
    >
        <path d="M25 40 C18 36, 8 26, 8 16 C8 10, 14 4, 20 2" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 20 Q5 16, 8 12 Q11 14, 10 20" fill="#fbbf24" />
        <path d="M12 28 Q6 26, 9 21 Q14 22, 12 28" fill="#fbbf24" />
        <path d="M17 35 Q11 33, 13 28 Q18 29, 17 35" fill="#fbbf24" />
        <path d="M9 13 Q4 10, 8 7 Q11 8, 9 13" fill="#fbbf24" />
        <path d="M12 6 Q8 3, 12 1 Q14 3, 12 6" fill="#fbbf24" />
    </svg>
);

const LaurelRight: React.FC = () => (
    <svg
        width="32"
        height="48"
        viewBox="0 0 32 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.85 }}
    >
        <path
            d="M7 40 C14 36, 24 26, 24 16 C24 10, 18 4, 12 2"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path d="M22 20 Q27 16, 24 12 Q21 14, 22 20" fill="#fbbf24" />
        <path d="M20 28 Q26 26, 23 21 Q18 22, 20 28" fill="#fbbf24" />
        <path d="M15 35 Q21 33, 19 28 Q14 29, 15 35" fill="#fbbf24" />
        <path d="M23 13 Q28 10, 24 7 Q21 8, 23 13" fill="#fbbf24" />
        <path d="M20 6 Q24 3, 20 1 Q18 3, 20 6" fill="#fbbf24" />
    </svg>
);


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
    forecast: number;
    shouldFlipEnemy: (src: string) => boolean;
    renderStatRow: (label: string, pVal: number, eVal: number, maxVal: number) => React.ReactNode;
    onCancel: () => void;
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
    forecast,
    shouldFlipEnemy,
    onCancel,
    onStartFight,
}) => {
    const { heroEquipment, selectedHeroId, title, name, wins, totalBattles, isPremium } = useGameStore();

    const winRewards = React.useMemo(() => {
        const pLevel = level || 1;
        let goldMin = 70;
        let goldMax = 120;
        if (pLevel <= 10) {
            goldMin = 70;
            goldMax = 120;
        } else if (pLevel <= 20) {
            goldMin = 150;
            goldMax = 250;
        } else if (pLevel <= 40) {
            goldMin = 300;
            goldMax = 450;
        } else if (pLevel <= 60) {
            goldMin = 400;
            goldMax = 500;
        } else {
            goldMin = 450;
            goldMax = 500;
        }

        const getXPReward = (lvl: number, won: boolean): number => {
            if (won) {
                if (lvl <= 10) return 100 + lvl * 20;
                if (lvl <= 30) return 300 + (lvl - 10) * 10;
                return Math.min(500 + (lvl - 30) * 5, 600);
            } else {
                if (lvl <= 10) return 20 + lvl * 4;
                if (lvl <= 30) return 60 + (lvl - 10) * 2;
                return Math.min(100 + (lvl - 30) * 1, 120);
            }
        };

        const xpBase = getXPReward(pLevel, true);
        const xpAmount = Math.round(xpBase * (isPremium ? 1.25 : 1.0));

        const diff = (opponent.rating || 0) - (rating || 0);
        let trophies = 20;
        if (diff >= 100) {
            trophies = 30;
        } else if (diff >= 0) {
            trophies = 20;
        } else {
            trophies = 10;
        }

        return {
            goldRange: `${goldMin}-${goldMax}`,
            xp: xpAmount,
            trophies
        };
    }, [level, isPremium, rating, opponent.rating]);

    const pRank = getRankInfo(rating);
    const eRank = getRankInfo(opponent.rating);

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

    const playerPower = React.useMemo(() => {
        let total = 0;
        Object.values(playerEq).forEach((itemId: any) => {
            if (!itemId) return;
            const item = (ITEMS_DATABASE as any)[itemId];
            if (item) total += calculateItemPower(item);
        });
        return total;
    }, [playerEq]);

    const opponentPower = React.useMemo(() => {
        let total = 0;
        Object.values(enemyEq).forEach((itemId: any) => {
            if (!itemId) return;
            const item = (ITEMS_DATABASE as any)[itemId];
            if (item) total += calculateItemPower(item);
        });
        return total;
    }, [enemyEq]);

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
            {/* TOP-LEFT NAMEPLATE (PLAYER) — Mockup style */}
            <div
                style={{
                    position: 'absolute',
                    top: '127px',
                    left: 'calc(7% + 225px)',
                    width: '390px',
                    height: '136px',
                    background: 'linear-gradient(135deg, rgba(12, 22, 42, 0.96) 0%, rgba(6, 10, 20, 0.98) 100%)',
                    border: '2px solid rgba(240, 192, 64, 0.55)',
                    borderRadius: '10px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85), inset 0 0 15px rgba(240,192,64,0.05)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'visible',
                }}
            >
                {/* Header Tab */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(180deg, #1e40af 0%, #1d4ed8 100%)',
                        border: '1.5px solid rgba(240, 192, 64, 0.5)',
                        borderRadius: '4px',
                        padding: '1px 20px',
                        color: '#fff',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '1.5px',
                        zIndex: 10,
                    }}
                >
                    ВЫ
                </div>

                {/* Nickname and Info Area */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        paddingTop: '16px',
                        gap: '4px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                fontFamily: "'Georgia', serif",
                                fontSize: '21px',
                                fontWeight: 'bold',
                                color: '#fff',
                                textShadow: '0 2px 4px rgba(0,0,0,0.85)',
                                lineHeight: 1.1,
                            }}
                        >
                            {name || playerName || 'Мастер'}
                        </span>
                        {vipLevel > 0 && (
                            <div
                                style={{
                                    backgroundImage: 'url(/assets/images/ui/vip.webp)',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    width: '45px',
                                    height: '18px',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    fontSize: '9px',
                                    letterSpacing: '0.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                    flexShrink: 0,
                                }}
                            >
                                VIP
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            width: '100%',
                            padding: '0 12px',
                            marginTop: '4px',
                            gap: '6px',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#a3a3a3',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Кубки
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                <img
                                    src={AssetsMap.UI.TROPHY_PREMIUM}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="cups"
                                />
                                <span
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        color: '#fbbf24',
                                    }}
                                >
                                    {rating}
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderLeft: '1px solid rgba(255,255,255,0.08)',
                                borderRight: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#a3a3a3',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Ранг
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <img
                                    src={pRank.icon}
                                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                                    alt="rank"
                                />
                                <span
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: pRank.color,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.2px',
                                    }}
                                >
                                    {pRank.name}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#a3a3a3',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Винрейт
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <span
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        color: '#10b981',
                                    }}
                                >
                                    {playerWinRateStr}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div
                    style={{
                        background: 'rgba(8, 12, 22, 0.95)',
                        borderTop: '1.5px solid rgba(240, 192, 64, 0.35)',
                        borderBottomLeftRadius: '9px',
                        borderBottomRightRadius: '9px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    {/* Blue Level Shield */}
                    <div
                        style={{
                            position: 'relative',
                            width: '16px',
                            height: '19px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="19" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M9 1L1 4V10C1 15.5 4.5 19.5 9 21C13.5 19.5 17 15.5 17 10V4L9 1Z"
                                fill="#1d4ed8"
                                stroke="#fbbf24"
                                strokeWidth="1.2"
                            />
                        </svg>
                        <span
                            style={{
                                position: 'absolute',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '9px',
                                fontWeight: 900,
                                color: '#fff',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                textShadow: '0 1px 2px #000',
                            }}
                        >
                            {level}
                        </span>
                    </div>

                    <span
                        style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '11px',
                            fontWeight: '900',
                            color: '#fbbf24',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Уровень {level} • {title || playerRank.name}
                    </span>
                </div>
            </div>

            {/* TOP-RIGHT NAMEPLATE (OPPONENT) — Mockup style */}
            <div
                style={{
                    position: 'absolute',
                    top: '127px',
                    right: 'calc(7% + 225px)',
                    width: '390px',
                    height: '136px',
                    background: 'linear-gradient(135deg, rgba(42, 12, 12, 0.96) 0%, rgba(20, 6, 6, 0.98) 100%)',
                    border: '2px solid rgba(239, 68, 68, 0.55)',
                    borderRadius: '10px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85), inset 0 0 15px rgba(239,68,68,0.05)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'visible',
                }}
            >
                {/* Header Tab */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(180deg, #991b1b 0%, #b91c1c 100%)',
                        border: '1.5px solid rgba(220, 38, 38, 0.5)',
                        borderRadius: '4px',
                        padding: '1px 20px',
                        color: '#fff',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '1.5px',
                        zIndex: 10,
                    }}
                >
                    ВРАГ
                </div>

                {/* Nickname and Info Area */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        paddingTop: '16px',
                        gap: '4px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                fontFamily: "'Georgia', serif",
                                fontSize: '21px',
                                fontWeight: 'bold',
                                color: '#fff',
                                textShadow: '0 2px 4px rgba(0,0,0,0.85)',
                                lineHeight: 1.1,
                            }}
                        >
                            {opponent.name}
                        </span>
                        {opponent.vipLevel !== undefined && opponent.vipLevel > 0 && (
                            <div
                                style={{
                                    backgroundImage: 'url(/assets/images/ui/vip.webp)',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    width: '45px',
                                    height: '18px',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', 'Philosopher', serif",
                                    fontSize: '9px',
                                    letterSpacing: '0.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                    flexShrink: 0,
                                }}
                            >
                                VIP
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            width: '100%',
                            padding: '0 12px',
                            marginTop: '4px',
                            gap: '6px',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#a3a3a3',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Кубки
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                <img
                                    src={AssetsMap.UI.TROPHY_PREMIUM}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="cups"
                                />
                                <span
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        color: '#fbbf24',
                                    }}
                                >
                                    {opponent.rating}
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderLeft: '1px solid rgba(255,255,255,0.08)',
                                borderRight: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#a3a3a3',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Ранг
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <img
                                    src={eRank.icon}
                                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                                    alt="rank"
                                />
                                <span
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: eRank.color,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.2px',
                                    }}
                                >
                                    {eRank.name}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#a3a3a3',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Винрейт
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <span
                                    style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        color: '#10b981',
                                    }}
                                >
                                    {opponentWinRateStr}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div
                    style={{
                        background: 'rgba(20, 6, 6, 0.95)',
                        borderTop: '1.5px solid rgba(239, 68, 68, 0.35)',
                        borderBottomLeftRadius: '9px',
                        borderBottomRightRadius: '9px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    {/* Red Level Shield */}
                    <div
                        style={{
                            position: 'relative',
                            width: '16px',
                            height: '19px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="16" height="19" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M9 1L1 4V10C1 15.5 4.5 19.5 9 21C13.5 19.5 17 15.5 17 10V4L9 1Z"
                                fill="#b91c1c"
                                stroke="#fbbf24"
                                strokeWidth="1.2"
                            />
                        </svg>
                        <span
                            style={{
                                position: 'absolute',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '9px',
                                fontWeight: 900,
                                color: '#fff',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                textShadow: '0 1px 2px #000',
                            }}
                        >
                            {opponent.level || 2}
                        </span>
                    </div>

                    <span
                        style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '11px',
                            fontWeight: '900',
                            color: '#fbbf24',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Уровень {opponent.level || 2} • {getRankInfo(opponent.rating).name}
                    </span>
                </div>
            </div>

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
                            icon={<span style={{ fontSize: '18px' }}>❤️</span>}
                        />
                        <LocalStatRow
                            label="АТАКА"
                            pVal={playerStats.attack}
                            eVal={opponent.stats.attack}
                            icon={<span style={{ fontSize: '18px' }}>⚔️</span>}
                        />
                        <LocalStatRow
                            label="ЗАЩИТА"
                            pVal={playerStats.defense}
                            eVal={opponent.stats.defense}
                            icon={<span style={{ fontSize: '18px' }}>🛡️</span>}
                        />
                        <LocalStatRow
                            label="ЛОВКОСТЬ"
                            pVal={playerStats.evasion ?? 0}
                            eVal={opponent.stats.evasion ?? 0}
                            icon={<span style={{ fontSize: '18px' }}>🌪️</span>}
                        />
                        <LocalStatRow
                            label="КРИТ. ШАНС"
                            pVal={playerStats.critChance ?? 5}
                            eVal={opponent.stats.critChance ?? 5}
                            icon={<span style={{ fontSize: '18px' }}>💥</span>}
                        />
                    </div>

                    {/* Win Prediction Box */}
                    <div
                        style={{
                            width: '100%',
                            background: 'rgba(10, 8, 5, 0.9)',
                            border: '1px solid rgba(240, 192, 64, 0.25)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                            marginBottom: '16px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 900,
                                color: '#b5a695',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            ШАНС ПОБЕДЫ
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '2px 0' }}>
                            <LaurelLeft />
                            <span
                                style={{
                                    fontSize: '36px',
                                    fontWeight: 900,
                                    color: '#fbbf24',
                                    fontFamily: "'Russo One', sans-serif",
                                }}
                            >
                                {forecast}%
                            </span>
                            <LaurelRight />
                        </div>

                        <span
                            style={{
                                fontSize: '11px',
                                fontWeight: 900,
                                color: '#fbbf24',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {forecast >= 60 ? 'ПОБЕДА ВЕРОЯТНА' : forecast <= 40 ? 'ТЯЖЕЛЫЙ БОЙ' : 'РАВНЫЙ БОЙ'}
                        </span>
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
                                fontSize: '10px',
                                fontWeight: 900,
                                color: '#b5a695',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '8px',
                            }}
                        >
                            НАГРАДА ЗА ПОБЕДУ
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                    src={AssetsMap.UI.ICON_GOLD_FULL}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="gold"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', lineHeight: '1' }}>
                                        {winRewards.goldRange}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            color: '#fbbf24',
                                            textTransform: 'uppercase',
                                            marginTop: '1px',
                                        }}
                                    >
                                        золото
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                    src={AssetsMap.UI.ICON_XP}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="xp"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', lineHeight: '1' }}>
                                        {winRewards.xp}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            color: '#fbbf24',
                                            textTransform: 'uppercase',
                                            marginTop: '1px',
                                        }}
                                    >
                                        опыт
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                    src={AssetsMap.UI.TROPHY_PREMIUM}
                                    style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                    alt="trophy"
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', lineHeight: '1' }}>
                                        +{winRewards.trophies}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            color: '#fbbf24',
                                            textTransform: 'uppercase',
                                            marginTop: '1px',
                                        }}
                                    >
                                        кубки
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <button
                        onClick={onStartFight}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.03)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.4)';
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                            border: '2.5px solid #fcd34d',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.4)',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1.5px',
                            marginBottom: '8px',
                        }}
                    >
                        НАЧАТЬ БОЙ
                    </button>

                    <button
                        onClick={onCancel}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        }}
                        style={{
                            width: '40%',
                            padding: '6px 0',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#b5a695',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: '1px',
                        }}
                    >
                        НАЗАД
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
