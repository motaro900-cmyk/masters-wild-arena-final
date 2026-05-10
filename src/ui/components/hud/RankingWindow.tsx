import React from 'react';
import { motion } from 'framer-motion';
import { getRankInfo } from '../../../configs/RankSystem';

interface LeaderboardEntry {
    rank: number;
    name: string;
    level: number;
    trophies: number;
    avatar: string;
    change: 'up' | 'down' | 'stable';
    isMe?: boolean;
}

const MOCK_LEADERS: LeaderboardEntry[] = [
    { rank: 1, name: 'StormBringer', level: 85, trophies: 15420, avatar: '🦁', change: 'stable' },
    { rank: 2, name: 'ShadowHunter', level: 82, trophies: 11150, avatar: '🦅', change: 'up' },
    { rank: 3, name: 'FireWitch', level: 78, trophies: 8890, avatar: 'FOX', change: 'down' },
    { rank: 4, name: 'IronClad', level: 75, trophies: 4500, avatar: '🐻', change: 'up' },
    { rank: 5, name: 'Motar', level: 42, trophies: 2850, avatar: '🐺', change: 'up', isMe: true },
    { rank: 6, name: 'WildSpirit', level: 70, trophies: 4200, avatar: '🐯', change: 'stable' },
    { rank: 7, name: 'ZenMaster', level: 68, trophies: 4100, avatar: '🐍', change: 'down' },
    { rank: 8, name: 'FrostBite', level: 65, trophies: 3800, avatar: '🦉', change: 'up' },
];

export const RankingWindow: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<'GLOBAL' | 'CLAN' | 'FRIENDS'>('GLOBAL');

    return (
        <div style={{
            width: '100%',
            height: '620px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            padding: '10px'
        }}>
            {/* ТАБЫ */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '5px'
            }}>
                {['GLOBAL', 'CLAN', 'FRIENDS'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            padding: '10px 25px',
                            background: activeTab === tab ? 'linear-gradient(180deg, #f0c040 0%, #a88020 100%)' : 'rgba(255,255,255,0.05)',
                            border: activeTab === tab ? 'none' : '1px solid rgba(240,192,64,0.3)',
                            borderRadius: '8px',
                            color: activeTab === tab ? '#000' : '#c8a870',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase'
                        }}
                    >
                        {tab === 'GLOBAL' ? 'Глобальный' : tab === 'CLAN' ? 'Клан' : 'Друзья'}
                    </button>
                ))}
            </div>
            {/* SEASON INFO */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 20px',
                background: 'rgba(240,192,64,0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(240,192,64,0.1)'
            }}>
                <div style={{ color: '#c8a870', fontSize: '14px', fontWeight: 600 }}>СЕЗОН 4: ЯРОСТЬ ДЖУНГЛЕЙ</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fff', fontSize: '14px' }}>Завершится через:</span>
                    <span style={{ color: '#f0c040', fontWeight: 800 }}>04д : 12ч : 45м</span>
                </div>
            </div>

            {/* ТАБЛИЦА ЛИДЕРОВ */}
            <style>
                {`
                .leaderboard-scroll::-webkit-scrollbar { width: 6px; }
                .leaderboard-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
                .leaderboard-scroll::-webkit-scrollbar-thumb { background: #f0c04044; border-radius: 10px; }
                .leaderboard-scroll::-webkit-scrollbar-thumb:hover { background: #f0c04088; }
                `}
            </style>
            <div 
                className="leaderboard-scroll"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '10px'
                }}
            >
                {MOCK_LEADERS.map((player) => (
                    <LeaderItem key={player.rank} player={player} />
                ))}
            </div>

            {/* ВАША ПОЗИЦИЯ (FOOTER) */}
            <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(180deg, rgba(240,192,64,0.2) 0%, rgba(15,10,5,0.9) 100%)',
                borderRadius: '12px',
                border: '1px solid #f0c040',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#f0c040', fontSize: '20px', fontWeight: 800 }}>#5</span>
                    <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', border: '2px solid #f0c040' }} />
                    <span style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>ВЫ (Motar)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#c8a870', fontSize: '12px' }}>РАНГ</div>
                        <div style={{ color: getRankInfo(2850).color, fontWeight: 800 }}>{getRankInfo(2850).name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#fff', fontSize: '22px', fontWeight: 800 }}>2,850</span>
                        <span style={{ fontSize: '20px' }}>🏆</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeaderItem: React.FC<{ player: LeaderboardEntry }> = ({ player }) => {
    const isTop3 = player.rank <= 3;
    const rankColor = player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#c8a870';

    return (
        <motion.div 
            whileHover={{ x: 5, backgroundColor: 'rgba(240,192,64,0.15)' }}
            whileTap={{ scale: 0.98 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                background: player.rank === 1 
                    ? 'linear-gradient(90deg, rgba(240,192,64,0.15) 0%, rgba(240,192,64,0.05) 100%)' 
                    : player.isMe ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: player.isMe ? '1px solid #f0c040' : '1px solid rgba(240,192,64,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                cursor: 'pointer'
            }}
        >
            {/* СПЕЦ-ЭФФЕКТ ДЛЯ ТОП-1 */}
            {player.rank === 1 && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '10px',
                    boxShadow: 'inset 0 0 20px rgba(240,192,64,0.2)',
                    pointerEvents: 'none'
                }} />
            )}
            {/* МЕСТО И ДИНАМИКА */}
            <div style={{ 
                width: '70px', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ 
                    fontSize: isTop3 ? '24px' : '18px', 
                    fontWeight: 900, 
                    color: rankColor,
                    textShadow: isTop3 ? `0 0 10px ${rankColor}aa` : 'none'
                }}>
                    #{player.rank}
                </div>
                {player.change !== 'stable' && (
                    <span style={{ 
                        fontSize: '10px', 
                        color: player.change === 'up' ? '#4ade80' : '#f87171',
                        fontWeight: 800
                    }}>
                        {player.change === 'up' ? '▲' : '▼'}
                    </span>
                )}
            </div>

            {/* АВАТАР */}
            <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: 'rgba(0,0,0,0.5)', 
                border: `2px solid ${player.isMe ? '#f0c040' : '#444'}`,
                marginRight: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: isTop3 ? `0 0 15px ${rankColor}33` : 'none'
            }}>
                {player.avatar}
            </div>

            {/* ИМЯ И УРОВЕНЬ */}
            <div style={{ flex: 1 }}>
                <div style={{ color: player.isMe ? '#f0c040' : '#fff', fontWeight: 700, fontSize: '18px' }}>
                    {player.name}
                    {player.isMe && <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(ВЫ)</span>}
                </div>
                <div style={{ color: '#c8a870', fontSize: '12px' }}>Уровень {player.level}</div>
            </div>

            {/* ЛИГА */}
            <div style={{ 
                padding: '4px 12px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '15px', 
                fontSize: '11px', 
                fontWeight: 800, 
                color: getRankInfo(player.trophies).color,
                border: `1px solid ${getRankInfo(player.trophies).color}44`,
                marginRight: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: `inset 0 0 10px ${getRankInfo(player.trophies).glow}`
            }}>
                <span>{getRankInfo(player.trophies).icon}</span>
                {getRankInfo(player.trophies).name}
            </div>

            {/* КУБКИ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px', justifyContent: 'flex-end' }}>
                <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>{player.trophies.toLocaleString()}</span>
                <span style={{ fontSize: '16px' }}>🏆</span>
            </div>
        </motion.div>
    );
};
