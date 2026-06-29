import React from 'react';
import { motion } from 'framer-motion';
import { AssetsMap } from '../../../../configs/AssetsMap';
import { getRankInfo } from '../../../../configs/RankSystem';
import { resolveAssetPath } from '../../../../utils/assetPath';
import { resolveAvatarPath } from '../../../../configs/ProfileCustomization';

export interface LeaderboardEntry {
    id: string;
    rank: number;
    name: string;
    level: number;
    trophies: number;
    avatar: string;
    change: 'up' | 'down' | 'stable';
    isMe?: boolean;
    vipLevel?: number;
    isVipActive?: boolean;
}

interface LeaderItemProps {
    player: LeaderboardEntry;
    onClick: () => void;
}

export const LeaderItem: React.FC<LeaderItemProps> = ({ player, onClick }) => {
    const isTop3 = player.rank <= 3;
    const rankColor =
        player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#dfc08a';

    return (
        <motion.div
            whileHover={{ x: 5, backgroundColor: 'rgba(240,192,64,0.22)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                background:
                    player.rank === 1
                        ? 'linear-gradient(90deg, rgba(240,192,64,0.2) 0%, rgba(240,192,64,0.08) 100%)'
                        : player.isMe
                          ? 'rgba(240,192,64,0.18)'
                          : 'rgba(20, 12, 6, 0.75)',
                borderRadius: '10px',
                border: player.isMe ? '1.5px solid #f0c040' : '1px solid rgba(240,192,64,0.22)',
                transition: 'all 0.2s ease',
                position: 'relative',
                cursor: 'pointer',
            }}
        >
            {/* СПЕЦ-ЭФФЕКТ ДЛЯ ТОП-1 */}
            {player.rank === 1 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '10px',
                        boxShadow: 'inset 0 0 20px rgba(240,192,64,0.2)',
                        pointerEvents: 'none',
                    }}
                />
            )}
            {/* МЕСТО И ДИНАМИКА */}
            <div
                style={{
                    width: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {isTop3 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: -12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        {player.rank === 1 ? (
                            <img
                                src={AssetsMap.UI.ICON_CROWN}
                                alt="crown"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 5px rgba(240,192,64,0.8))',
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '16px' }}>{player.rank === 2 ? '🥈' : '🥉'}</span>
                        )}
                    </div>
                )}
                <div
                    style={{
                        fontSize: isTop3 ? '24px' : '18px',
                        fontWeight: 900,
                        color: rankColor,
                        textShadow: isTop3 ? `0 0 10px ${rankColor}aa` : 'none',
                    }}
                >
                    #{player.rank}
                </div>
                {player.change !== 'stable' && (
                    <span
                        style={{
                            fontSize: '10px',
                            color: player.change === 'up' ? '#4ade80' : '#f87171',
                            fontWeight: 800,
                        }}
                    >
                        {player.change === 'up' ? '▲' : '▼'}
                    </span>
                )}
            </div>

            {/* АВАТАР */}
            <div
                style={{
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
                    boxShadow: isTop3 ? `0 0 15px ${rankColor}33` : 'none',
                    overflow: 'hidden',
                }}
            >
                <img
                    src={resolveAvatarPath(player.avatar)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="avatar"
                />
            </div>

            {/* ИМЯ И УРОВЕНЬ */}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        color: player.isMe ? '#f0c040' : '#fff',
                        fontWeight: 700,
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <span>{player.name}</span>
                    {player.vipLevel !== undefined && player.vipLevel > 0 && (
                        <div
                            style={{
                                backgroundImage: `url(${resolveAssetPath(AssetsMap.UI.VIP_PLAQUE)})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                width: '45px',
                                height: '18px',
                                color: '#fff',
                                fontWeight: 900,
                                fontFamily: "'Cinzel', 'Philosopher', serif",
                                fontSize: '9px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                flexShrink: 0,
                            }}
                        >
                            VIP
                        </div>
                    )}
                    {player.isMe && <span style={{ fontSize: '12px', opacity: 0.7 }}>(ВЫ)</span>}
                </div>
                <div style={{ color: '#dfc08a', fontSize: '12px', fontWeight: 600 }}>Уровень {player.level}</div>
            </div>

            {/* ЛИГА */}
            <div
                style={{
                    padding: '6px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '18px',
                    fontSize: '13px',
                    fontWeight: 900,
                    color: getRankInfo(player.trophies).color,
                    border: `1.5px solid ${getRankInfo(player.trophies).color}66`,
                    marginRight: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: `inset 0 0 12px ${getRankInfo(player.trophies).glow}, 0 2px 6px rgba(0,0,0,0.3)`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                <img
                    src={getRankInfo(player.trophies).icon}
                    alt="rank"
                    style={{
                        width: '22px',
                        height: '22px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
                    }}
                />
                {getRankInfo(player.trophies).name}
            </div>

            {/* КУБКИ */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '130px',
                    justifyContent: 'flex-end',
                }}
            >
                <span
                    style={{
                        color: '#fff',
                        fontSize: '22px',
                        fontWeight: 900,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                >
                    {player.trophies.toLocaleString().replace(',', ' ')}
                </span>
                <img
                    src={AssetsMap.UI.TROPHY_PREMIUM}
                    alt="trophy"
                    style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6)) drop-shadow(0 0 4px rgba(240,192,64,0.15))',
                    }}
                />
            </div>
        </motion.div>
    );
};
export default LeaderItem;
