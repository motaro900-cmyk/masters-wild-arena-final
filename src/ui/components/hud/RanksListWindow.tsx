import React from 'react';
import { motion } from 'framer-motion';
import { RANK_SYSTEM, getRankInfo } from '../../../configs/RankSystem';
import { useGameStore } from '../../../store/useGameStore';
import { AssetsMap } from '../../../configs/AssetsMap';
import { resolveAssetPath } from '../../../utils/assetPath';

export const RanksListWindow: React.FC = () => {
    const playerTrophies = useGameStore((state) => state.rating);
    const currentRank = getRankInfo(playerTrophies);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                padding: '24px',
                boxSizing: 'border-box',
            }}
        >
            <p style={{ color: '#dfc08a', textAlign: 'center', fontStyle: 'italic', margin: '0 0 10px 0' }}>
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
                                    background: isCurrent ? 'rgba(240,192,64,0.22)' : 'rgba(20, 12, 6, 0.75)',
                                    borderRadius: '12px',
                                    border: isCurrent
                                        ? '2px solid #f0c040'
                                        : isReached
                                          ? '1px solid rgba(240,192,64,0.35)'
                                          : '1px solid rgba(240,192,64,0.18)',
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
                                        src={resolveAssetPath(rank.icon)}
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
                                            color: '#dfc08a',
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
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                                                НАГРАДА:
                                            </span>
                                            {(() => {
                                                const rankRewards: Record<
                                                    string,
                                                    { crystals: number; gold: number; chest?: string }
                                                > = {
                                                    ВОИН: { crystals: 75, gold: 1000, chest: 'Случайный предмет' },
                                                    ВЕТЕРАН: { crystals: 150, gold: 2500, chest: 'Случайный предмет' },
                                                    МАСТЕР: { crystals: 300, gold: 5000, chest: 'Случайный предмет' },
                                                    ГЕРОЙ: { crystals: 500, gold: 7500, chest: 'Случайный предмет' },
                                                    ЭЛИТА: { crystals: 750, gold: 10000, chest: 'Случайный предмет' },
                                                    ЧЕМПИОН: {
                                                        crystals: 1000,
                                                        gold: 12500,
                                                        chest: 'Случайный предмет',
                                                    },
                                                    МАГИСТР: {
                                                        crystals: 1500,
                                                        gold: 20000,
                                                        chest: 'Случайный предмет',
                                                    },
                                                    ВЛАСТЕЛИН: {
                                                        crystals: 2000,
                                                        gold: 25000,
                                                        chest: 'Случайный предмет',
                                                    },
                                                    ЛЕГЕНДА: {
                                                        crystals: 3000,
                                                        gold: 50000,
                                                        chest: 'Случайный предмет',
                                                    },
                                                };
                                                const reward = rankRewards[rank.name];
                                                if (!reward) return null;
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                fontWeight: 900,
                                                                color: '#f0c040',
                                                            }}
                                                        >
                                                            <img
                                                                src={resolveAssetPath(AssetsMap.UI.ICON_ALMAZ_FULL)}
                                                                style={{ width: 18, height: 18, objectFit: 'contain' }}
                                                                alt="crystals"
                                                            />
                                                            {reward.crystals}
                                                        </span>
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                fontWeight: 900,
                                                                color: '#e5e7eb',
                                                            }}
                                                        >
                                                            <img
                                                                src={resolveAssetPath(AssetsMap.UI.ICON_GOLD_FULL)}
                                                                style={{ width: 18, height: 18, objectFit: 'contain' }}
                                                                alt="gold"
                                                            />
                                                            {reward.gold.toLocaleString()}
                                                        </span>
                                                        {reward.chest && (
                                                            <span
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    fontWeight: 900,
                                                                    color: '#4ade80',
                                                                }}
                                                            >
                                                                <img
                                                                    src={resolveAssetPath(
                                                                        AssetsMap.UI.ICON_DAILY_CHEST,
                                                                    )}
                                                                    style={{
                                                                        width: 18,
                                                                        height: 18,
                                                                        objectFit: 'contain',
                                                                    }}
                                                                    alt="item"
                                                                />
                                                                {reward.chest}
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

export default RanksListWindow;
