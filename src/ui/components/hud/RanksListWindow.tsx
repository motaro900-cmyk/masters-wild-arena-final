import React from 'react';
import { motion } from 'framer-motion';
import { RANK_SYSTEM, getRankInfo } from '../../../configs/RankSystem';
import { useGameStore } from '../../../store/useGameStore';

export const RanksListWindow: React.FC = () => {
    const { rating: playerTrophies } = useGameStore();
    const currentRank = getRankInfo(playerTrophies);

    return (
        <div style={{
            width: '100%',
            height: '650px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            padding: '10px'
        }}>
            <p style={{ color: '#c8a870', textAlign: 'center', fontStyle: 'italic', margin: '0 0 10px 0' }}>
                Побеждайте в боях, чтобы зарабатывать кубки и открывать новые ранги!
            </p>

            <div className="leaderboard-scroll" style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingRight: '10px'
            }}>
                {RANK_SYSTEM.slice().reverse().map((rank) => {
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
                                border: isCurrent ? '2px solid #f0c040' : isReached ? '1px solid rgba(240,192,64,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                opacity: isReached ? 1 : 0.6,
                                filter: isReached ? 'none' : 'grayscale(0.5)',
                                position: 'relative'
                            }}
                        >
                            {/* ИКОНКА */}
                            <div style={{
                                width: '80px',
                                height: '80px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '25px',
                                filter: isReached ? `drop-shadow(0 0 15px ${rank.glow})` : 'none'
                            }}>
                                <img 
                                    src={rank.icon} 
                                    alt={rank.name} 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'contain' 
                                    }} 
                                />
                            </div>

                            {/* ИНФОРМАЦИЯ */}
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    color: isReached ? rank.color : '#888', 
                                    fontSize: '22px', 
                                    fontWeight: 900,
                                    fontFamily: "'Cinzel', serif"
                                }}>
                                    {rank.name}
                                    {isCurrent && <span style={{ fontSize: '12px', marginLeft: '10px', color: '#fff', verticalAlign: 'middle' }}>(ТЕКУЩИЙ)</span>}
                                </div>
                                <div style={{ color: '#c8a870', fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                                    {rank.minTrophies} — {rank.maxTrophies === 999999 ? '∞' : rank.maxTrophies} Кубков
                                </div>
                            </div>

                            {/* СТАТУС */}
                            <div style={{
                                color: isCurrent ? '#f0c040' : isReached ? '#4ade80' : '#444',
                                fontWeight: 800,
                                fontSize: '14px'
                            }}>
                                {isCurrent ? 'АКТИВЕН' : isReached ? 'ДОСТИГНУТ' : 'ЗАБЛОКИРОВАН'}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
