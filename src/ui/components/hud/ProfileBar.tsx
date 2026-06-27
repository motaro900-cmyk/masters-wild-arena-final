import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/useGameStore';
import { AvatarFrame } from './SharedUI';
import { getRankInfo, RANK_SYSTEM } from '../../../configs/RankSystem';

interface ProfileBarProps {
    onOpenProfile?: () => void;
}

export const ProfileBar: React.FC<ProfileBarProps> = ({ onOpenProfile }) => {
    const avatar = useGameStore((s) => s.avatar) || 'панда.png';
    const frame = useGameStore((s) => s.frame) || 'harvest_wheat_frame.webp';
    const trophies = useGameStore((s) => s.trophies) ?? 0;
    const exp = useGameStore((s) => s.exp) ?? 0;
    const level = useGameStore((s) => s.level) ?? 1;
    const vkUser = useGameStore((s) => s.vkUser);
    const name = useGameStore((s) => s.name);

    const xpToNextLevel = level * 600;
    const isLevelUpReady = exp >= xpToNextLevel;
    const xpPercent = xpToNextLevel > 0 ? Math.min(100, Math.max(0, (exp / xpToNextLevel) * 100)) : 0;
    const playerName = (name && name !== 'Мастер' ? name : vkUser?.firstName || 'DRAGONSLAYER').toUpperCase();

    const rank = getRankInfo(trophies);
    const rankIndex = RANK_SYSTEM.findIndex((r) => r.name === rank.name);
    const nextRank = rankIndex > 0 ? RANK_SYSTEM[rankIndex - 1] : null;
    const nextRankTrophies = nextRank ? nextRank.minTrophies : rank.minTrophies + 1500;
    const prevRankTrophies = rank.minTrophies;
    
    const tier = {
        name: rank.name,
        color: rank.color,
        icon: trophies >= 10500 ? '👑' : trophies >= 7500 ? '💎' : trophies >= 4500 ? '🥇' : trophies >= 2000 ? '🥈' : '🥉'
    };

    const divisor = nextRankTrophies - prevRankTrophies;
    const trophyProgress =
        divisor > 0 ? Math.min(100, Math.max(0, ((trophies - prevRankTrophies) / divisor) * 100)) : 100;

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onOpenProfile}
            className="relative flex items-center h-[120px] w-[500px] pointer-events-auto cursor-pointer select-none overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #1a0a05 0%, #0a0502 50%, #1a0a05 100%)',
                borderRadius: '20px',
                border: '4px solid #c8952a',
                boxShadow: '0 15px 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(200,149,42,0.4)',
            }}
        >
            {/* ZONE 1 — AVATAR */}
            <div className="w-[86px] h-[86px] ml-4 flex-shrink-0 relative z-20">
                <AvatarFrame
                    avatarFilename={avatar.replace('.png', '')}
                    frameFilename={frame.replace('.png', '')}
                    size={86}
                />
                <div className="absolute top-1 right-1 w-4 h-4 bg-[#4caf50] rounded-full border-2 border-[#0a0502] shadow-[0_0_12px_#4caf50] animate-pulse" />
            </div>

            {/* ZONE 2 — CENTER BLOCK */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-20">
                <h2
                    className="text-[24px] font-bold leading-none mb-1.5"
                    style={{
                        fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                        color: '#ffffff',
                        textShadow: '0 2px 0 rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.6)',
                    }}
                >
                    {playerName}
                </h2>

                <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#c8952a]/50 to-transparent mb-2" />

                <div className="flex items-center gap-2 mb-2.5">
                    <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill={rank.color}
                        className="drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: rank.color }}>
                        {rank.name}
                    </span>
                </div>

                {/* PREMIUM XP BAR */}
                <div className="flex items-center w-full gap-3">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] text-white/50 tracking-[0.2em] mb-[-2px]">LVL</span>
                        <span
                            className="text-[22px] font-bold leading-none"
                            style={{
                                fontFamily: "'Cinzel', serif",
                                color: '#fdf5e6',
                                textShadow: '0 0 10px rgba(255,255,255,0.3)',
                            }}
                        >
                            {level}
                        </span>
                    </div>

                    <div className="flex flex-col flex-1">
                        <div className="relative h-[13px] w-full bg-black/80 rounded-[6px] border border-white/10 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                            <motion.div
                                animate={
                                    isLevelUpReady
                                        ? { boxShadow: ['0 0 0px #00d2ff', '0 0 20px #00d2ff', '0 0 0px #00d2ff'] }
                                        : {}
                                }
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="h-full relative"
                                style={{
                                    width: `${xpPercent}%`,
                                    background: 'linear-gradient(180deg, #50c9c3 0%, #3a7bd5 100%)',
                                }}
                            >
                                {/* Glass Highlight */}
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 z-10" />
                                <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="absolute top-0 bottom-0 w-[50px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                />
                            </motion.div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] font-black text-[#a0d8ff] tracking-tighter">
                                {exp} <span className="opacity-30">/</span> {xpToNextLevel}{' '}
                                <span className="text-[8px] opacity-50">EXP</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONE 3 — RIGHT BLOCK (Hard-fixed) */}
            <div className="absolute right-10 top-0 bottom-0 flex flex-col items-end justify-center gap-5 z-20">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] bg-black/60 border border-[#c8952a]/60 shadow-2xl">
                    <svg width="18" height="18" viewBox="0 0 24 24" className="drop-shadow-[0_0_5px_#ffd700]">
                        <path
                            d="M18 2H6a1 1 0 00-1 1v3a4 4 0 004 4h1v3H8a1 1 0 00-1 1v3h10v-3a1 1 0 00-1-1h-2v-3h1a4 4 0 004-4V3a1 1 0 00-1-1zm-2 4V4h2v2a2 2 0 01-2 2h-1V6h1zM8 8a2 2 0 01-2-2V4h2v2h1v2H8z"
                            fill="#ffd700"
                        />
                    </svg>
                    <span className="text-[18px] font-black text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                        {trophies}
                    </span>
                </div>

                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-[0.3em] text-white shadow-xl"
                    style={{ backgroundColor: `${tier.color}33`, borderColor: `${tier.color}77` }}
                >
                    <span>{tier.icon}</span>
                    <span>{tier.name}</span>
                </div>
            </div>

            {/* BOTTOM PROGRESS */}
            <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-black/40 z-30">
                <motion.div
                    animate={{ width: `${trophyProgress}%` }}
                    className="h-full"
                    style={{
                        backgroundColor: rank.color,
                        boxShadow: `0 0 12px ${rank.color}`,
                    }}
                />
            </div>
        </motion.div>
    );
};
