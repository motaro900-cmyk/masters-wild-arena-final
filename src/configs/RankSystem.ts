export interface RankTier {
    name: string;
    minTrophies: number;
    maxTrophies: number; // Верхний порог для отображения прогресса
    color: string;
    glow: string;
    icon: string;
}

export const RANK_SYSTEM: RankTier[] = [
    { name: 'ЛЕГЕНДА', minTrophies: 10500, maxTrophies: 999999, color: '#ff00ff', glow: 'rgba(255, 0, 255, 0.6)', icon: '👑' },
    { name: 'ВЛАСТЕЛИН', minTrophies: 9000, maxTrophies: 10500, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', icon: '🔥' },
    { name: 'МАГИСТР', minTrophies: 7500, maxTrophies: 9000, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', icon: '🌌' },
    { name: 'ЧЕМПИОН', minTrophies: 6000, maxTrophies: 7500, color: '#facc15', glow: 'rgba(250, 204, 21, 0.4)', icon: '🏆' },
    { name: 'ЭЛИТА', minTrophies: 4500, maxTrophies: 6000, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', icon: '💎' },
    { name: 'ГЕРОЙ', minTrophies: 3000, maxTrophies: 4500, color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', icon: '⚔️' },
    { name: 'МАСТЕР', minTrophies: 2000, maxTrophies: 3000, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)', icon: '🔮' },
    { name: 'ВЕТЕРАН', minTrophies: 1000, maxTrophies: 2000, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', icon: '🥇' },
    { name: 'ВОИН', minTrophies: 400, maxTrophies: 1000, color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.2)', icon: '🥈' },
    { name: 'НОВИЧОК', minTrophies: 0, maxTrophies: 400, color: '#92400e', glow: 'transparent', icon: '🥉' },
];

export const getRankInfo = (trophies: number): RankTier => {
    return RANK_SYSTEM.find(rank => trophies >= rank.minTrophies) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
};
