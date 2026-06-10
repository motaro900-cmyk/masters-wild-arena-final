import React from 'react';
import { motion } from 'framer-motion';
import { RANK_SYSTEM, getRankInfo } from '../../../configs/RankSystem';
import { useGameStore } from '../../../store/useGameStore';

export const RanksListWindow: React.FC = () => {
    const { rating: playerTrophies } = useGameStore();
    const currentRank = getRankInfo(playerTrophies);

    return (
        <div
            style={{
                width: '100%',
                height: '650px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                padding: '10px',
            }}
        >
            <p style={{ color: '#c8a870', textAlign: 'center', fontStyle: 'italic', margin: '0 0 10px 0' }}>
                Побеждайте в боях, чтобы зарабатывать кубки и открывать новые ранги!
            </p>

            <div
                className="leaderboard-scroll"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    paddingRight: '10px',
                }}
            >
                {RANK_SYSTEM.slice()
                    .reverse()
                    .map((rank) => {
                        const isReached = playerTrophies >= rank.minTrophies;
                        const isCurrent = currentRank.name === rank.name;

                        return (
                            <motion.div
                                key={rank.name}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px 25px',
                                    background: isCurrent ? 'rgba(240,192,64,0.15)' : 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    border: isCurrent
                                        ? '2px solid #f0c040'
                                        : isReached
                                          ? '1px solid rgba(240,192,64,0.3)'
                                          : '1px solid rgba(255,255,255,0.05)',
                                    opacity: isReached ? 1 : 0.6,
                                    filter: isReached ? 'none' : 'grayscale(0.5)',
                                    position: 'relative',
                                }}
                            >
                                {/* ИКОНКА */}
                                <div
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '25px',
                                        filter: isReached ? `drop-shadow(0 0 15px ${rank.glow})` : 'none',
                                    }}
                                >
                                    <img
                                        src={rank.icon}
                                        alt={rank.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </div>

                                {/* ИНФОРМАЦИЯ */}
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            color: isReached ? rank.color : '#888',
                                            fontSize: '22px',
                                            fontWeight: 900,
                                            fontFamily: "'Cinzel', serif",
                                        }}
                                    >
                                        {rank.name}
                                        {isCurrent && (
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    marginLeft: '10px',
                                                    color: '#fff',
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                (ТЕКУЩИЙ)
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            color: '#c8a870',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            marginTop: '2px',
                                        }}
                                    >
                                        {rank.minTrophies} — {rank.maxTrophies === 999999 ? '∞' : rank.maxTrophies}{' '}
                                        Кубков
                                    </div>

                                    {/* НАГРАДА */}
                                    {rank.name !== 'НОВИЧОК' && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginTop: '8px',
                                                fontSize: '13px',
                                                color: '#d1d5db',
                                            }}
                                        >
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>НАГРАДА:</span>
                                            {(() => {
                                                const rankRewards: Record<string, { crystals: number; gold: number; chest?: string }> = {
                                                    'ВОИН': { crystals: 150, gold: 2000 },
                                                    'ВЕТЕРАН': { crystals: 300, gold: 5000, chest: 'Эпический сундук' },
                                                    'МАСТЕР': { crystals: 600, gold: 10000, chest: 'Эпический сундук' },
                                                    'ГЕРОЙ': { crystals: 1000, gold: 15000, chest: 'Легендарный сундук' },
                                                    'ЭЛИТА': { crystals: 1500, gold: 20000, chest: 'Легендарный сундук' },
                                                    'ЧЕМПИОН': { crystals: 2000, gold: 25000, chest: 'Легендарный сундук' },
                                                    'МАГИСТР': { crystals: 3000, gold: 40000, chest: 'Легендарный сундук' },
                                                    'ВЛАСТЕЛИН': { crystals: 4000, gold: 50000, chest: 'Легендарный сундук' },
                                                    'ЛЕГЕНДА': { crystals: 6000, gold: 100000, chest: 'Легендарный сундук' },
                                                };
                                                const reward = rankRewards[rank.name];
                                                if (!reward) return null;
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 900, color: '#f0c040' }}>
                                                            💎 {reward.crystals}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 900, color: '#e5e7eb' }}>
                                                            💰 {reward.gold.toLocaleString()}
                                                        </span>
                                                        {reward.chest && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 900, color: '#4ade80' }}>
                                                                🎁 {reward.chest}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* СТАТУС */}
                                <div
                                    style={{
                                        color: isCurrent ? '#f0c040' : isReached ? '#4ade80' : '#444',
                                        fontWeight: 800,
                                        fontSize: '14px',
                                    }}
                                >
                                    {isCurrent ? 'АКТИВЕН' : isReached ? 'ДОСТИГНУТ' : 'ЗАБЛОКИРОВАН'}
                                </div>
                            </motion.div>
                        );
                    })}
            </div>
        </div>
    );
};
