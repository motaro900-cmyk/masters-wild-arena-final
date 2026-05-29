import React from 'react';
import { motion } from 'framer-motion';
import { getRankInfo } from '../../../../configs/RankSystem';

interface MatchmakingFoundProps {
    opponent: {
        id: string;
        name: string;
        rating: number;
        heroImage: string;
        rankIcon: string;
        stats: { hp: number; attack: number; defense: number; speed: number; crit: number };
        level?: number;
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
    renderStatRow,
    onCancel,
    onStartFight,
}) => {
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
                    background: 'linear-gradient(135deg, rgba(20, 14, 5, 0.1) 0%, rgba(8, 5, 2, 0.3) 100%)',
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
                        <div
                            style={{
                                position: 'absolute',
                                inset: '-10px',
                                background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
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
                    {/* Dark text background panel to ensure player name, rank, level, and titles are clearly readable */}
                    <div style={{
                        background: 'rgba(15, 10, 5, 0.45)',
                        backdropFilter: 'blur(10px)',
                        border: '1.5px solid rgba(245, 158, 11, 0.6)',
                        borderRadius: '12px',
                        padding: '14px 28px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 15px rgba(245,158,11,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        marginTop: '10px',
                    }}>
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
                                    fontSize: '28px', // Slightly adjusted down from 32px to look cleaner in panel
                                    fontWeight: 900,
                                    letterSpacing: '1px',
                                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                }}
                            >
                                {playerName}
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
                            <img
                                src={playerRank.icon}
                                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                alt=""
                            />
                            <span
                                style={{
                                    color: '#fef3c7',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    fontFamily: "'Montserrat', sans-serif",
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                {playerRank.name} • {rating} <img src="/assets/images/ui/trophy_premium.webp" style={{ width: '18px', height: '18px', objectFit: 'contain' }} alt="" />
                            </span>
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
                    background: 'linear-gradient(135deg, rgba(14, 6, 22, 0.1) 0%, rgba(5, 2, 8, 0.3) 100%)',
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
                        <div
                            style={{
                                position: 'absolute',
                                inset: '-10px',
                                background: 'radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)',
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
                                transform: shouldFlipEnemy(opponent.heroImage) ? 'scaleX(-1)' : 'none',
                            }}
                            alt=""
                        />
                    </div>
                    {/* Dark text background panel to ensure enemy name and rank details are clearly readable */}
                    <div style={{
                        background: 'rgba(15, 10, 5, 0.45)',
                        backdropFilter: 'blur(10px)',
                        border: '1.5px solid rgba(239, 68, 68, 0.6)',
                        borderRadius: '12px',
                        padding: '14px 28px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 15px rgba(239,68,68,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        marginTop: '10px',
                    }}>
                        <div
                            style={{
                                color: '#fff',
                                fontFamily: "'Cinzel', serif",
                                fontSize: '28px',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                marginBottom: '8px',
                                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            }}
                        >
                            {opponent.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                                src={opponent.rankIcon}
                                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                alt=""
                            />
                            <span
                                style={{
                                    color: '#fef3c7',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    fontFamily: "'Montserrat', sans-serif",
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                Противник • {opponent.rating} <img src="/assets/images/ui/trophy_premium.webp" style={{ width: '18px', height: '18px', objectFit: 'contain' }} alt="" />
                            </span>
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
                }}
            >
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(26, 17, 8, 0.85) 0%, rgba(10, 5, 2, 0.95) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '2px solid rgba(240, 192, 64, 0.4)',
                        borderRadius: '24px',
                        padding: '40px',
                        width: '800px',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(240, 192, 64, 0.1)',
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
                                {playerName}
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
                                    textShadow: '0 4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.5)',
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
                                    transform: shouldFlipEnemy(opponent.heroImage) ? 'scaleX(-1)' : 'none',
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
                                Уровень {opponent.level || 2} • {getRankInfo(opponent.rating).name}
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
                            onClick={onStartFight}
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
    );
};
