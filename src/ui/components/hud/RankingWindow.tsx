import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { resolveAssetPath } from '../../../utils/assetPath';
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

// Список лидеров формируется динамически в компоненте

export const RankingWindow: React.FC = () => {
    const { rating, vkUser, avatar: playerAvatar } = useGameStore();
    const [activeTab, setActiveTab] = React.useState<'GLOBAL' | 'CLAN' | 'FRIENDS'>('GLOBAL');
    const [showFooter, setShowFooter] = React.useState(false);
    const [selectedPlayer, setSelectedPlayer] = React.useState<LeaderboardEntry | null>(null);
    const [showRewards, setShowRewards] = React.useState(false);

    // Формируем список лидеров: только текущий игрок (так как игра еще не вышла)
    const leaders: LeaderboardEntry[] = React.useMemo(() => [
        { 
            rank: 1, 
            name: vkUser?.first_name || 'Motar', 
            level: 1, 
            trophies: rating, 
            avatar: playerAvatar || '🐺', 
            change: 'stable', 
            isMe: true 
        }
    ], [rating, vkUser, playerAvatar]);
    
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                // Если прокрутили больше чем на 100px - показываем футер (как пример логики)
                // В идеале тут проверка видимости строки игрока через IntersectionObserver
                setShowFooter(scrollRef.current.scrollTop > 100);
            }
        };
        const el = scrollRef.current;
        el?.addEventListener('scroll', handleScroll);
        return () => el?.removeEventListener('scroll', handleScroll);
    }, []);

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
            {/* SEASON INFO & REWARDS */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                background: 'linear-gradient(90deg, rgba(240,192,64,0.1), rgba(0,0,0,0))',
                borderRadius: '12px',
                border: '1px solid rgba(240,192,64,0.2)',
                position: 'relative'
            }}>
                <div>
                    <div style={{ color: '#c8a870', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Текущий Сезон</div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800, fontFamily: "'Cinzel', serif" }}>ЯРОСТЬ ДЖУНГЛЕЙ</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#f0c040', fontWeight: 800, fontSize: '14px' }}>04д : 12ч : 45м</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>ДО КОНЦА СЕЗОНА</div>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        onClick={() => setShowRewards(true)}
                        style={{ background: 'rgba(240,192,64,0.2)', border: '1px solid #f0c040', borderRadius: '10px', width: '45px', height: '45px', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(240,192,64,0.2)' }}
                    >
                        🎁
                    </motion.button>
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
                ref={scrollRef}
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
                {leaders.map((player) => (
                    <LeaderItem key={player.rank} player={player} onClick={() => setSelectedPlayer(player)} />
                ))}
            </div>

            {/* ВАША ПОЗИЦИЯ (SMART FOOTER) */}
            <AnimatePresence>
                {showFooter && (
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: 20,
                            left: 20,
                            right: 30,
                            padding: '12px 25px',
                            background: 'linear-gradient(180deg, rgba(30,20,10,0.95) 0%, rgba(15,10,5,0.98) 100%)',
                            borderRadius: '16px',
                            border: '1px solid #f0c040',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            zIndex: 10
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{ color: '#f0c040', fontSize: '20px', fontWeight: 900 }}>#1</span>
                                <div style={{ position: 'absolute', top: -10, left: -10, fontSize: '20px' }}>👑</div>
                            </div>
                            <div style={{ width: '45px', height: '45px', background: '#333', borderRadius: '12px', border: '2px solid #f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{playerAvatar || '🐺'}</div>
                            <div>
                                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>{vkUser?.first_name || 'Motar'} <span style={{ fontSize: '10px', opacity: 0.5 }}>(ВЫ)</span></div>
                                <div style={{ color: getRankInfo(rating).color, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {getRankInfo(rating).icon} {getRankInfo(rating).name}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#fff', fontSize: '24px', fontWeight: 900 }}>{rating.toLocaleString().replace(',', ' ')}</span>
                                <span style={{ fontSize: '20px' }}>🏆</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PLAYER INSPECT MODAL */}
            <AnimatePresence>
                {selectedPlayer && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '400px', background: '#1a1510', border: '2px solid #f0c040', borderRadius: '24px', padding: '30px', textAlign: 'center' }}>
                            <div style={{ fontSize: '60px', marginBottom: '10px' }}>{selectedPlayer.avatar}</div>
                            <h3 style={{ color: '#fff', fontSize: '24px', margin: 0, fontFamily: "'Cinzel', serif" }}>{selectedPlayer.name}</h3>
                            <div style={{ color: '#f0c040', fontWeight: 800, marginBottom: '20px' }}>Уровень {selectedPlayer.level}</div>
                            
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '15px', marginBottom: '20px' }}>
                                <div style={{ color: '#c8a870', fontSize: '12px', marginBottom: '10px' }}>БОЕВАЯ КОМАНДА</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    {['🦁', '🦅', '🐻', '🐺', '🦊'].map((hero, i) => (
                                        <div key={i} style={{ width: '45px', height: '45px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid rgba(240,192,64,0.2)' }}>{hero}</div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button style={{ flex: 1, padding: '12px', background: '#f0c040', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 900, cursor: 'pointer' }}>ВЫЗВАТЬ</button>
                                <button onClick={() => setSelectedPlayer(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>ЗАКРЫТЬ</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* REWARDS MODAL */}
            <AnimatePresence>
                {showRewards && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: '450px', background: '#1a1510', border: '2px solid #f0c040', borderRadius: '24px', padding: '30px' }}>
                            <h3 style={{ color: '#f0c040', fontSize: '24px', textAlign: 'center', fontFamily: "'Cinzel', serif" }}>НАГРАДЫ СЕЗОНА</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                {[
                                    { rank: 'Топ 1-3', reward: 500 },
                                    { rank: 'Топ 4-10', reward: 250 },
                                    { rank: 'Топ 11-100', reward: 100 }
                                ].map((r, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(240,192,64,0.1)' }}>
                                        <span style={{ fontWeight: 800, color: '#fff' }}>{r.rank}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 800 }}>
                                            {r.reward}
                                            <img 
                                                src={resolveAssetPath('/assets/images/ui/icons/almaz.png')} 
                                                style={{ width: '18px', height: '18px', objectFit: 'contain' }} 
                                                alt="алмазы"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowRewards(false)} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#f0c040', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 900, cursor: 'pointer' }}>ПОНЯТНО</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LeaderItem: React.FC<{ player: LeaderboardEntry, onClick: () => void }> = ({ player, onClick }) => {
    const isTop3 = player.rank <= 3;
    const rankColor = player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#c8a870';

    return (
        <motion.div 
            whileHover={{ x: 5, backgroundColor: 'rgba(240,192,64,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
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
                justifyContent: 'center',
                position: 'relative'
            }}>
                {isTop3 && <div style={{ position: 'absolute', top: -12, fontSize: '16px' }}>{player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}</div>}
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
                <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>{player.trophies.toLocaleString().replace(',', ' ')}</span>
                <span style={{ fontSize: '16px' }}>🏆</span>
            </div>
        </motion.div>
    );
};
