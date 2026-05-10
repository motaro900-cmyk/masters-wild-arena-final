export interface RankTier {
    name: string;
    minTrophies: number;
    maxTrophies: number; // Верхний порог для отображения прогресса
    color: string;
    glow: string;
    icon: string;
}

export const RANK_SYSTEM: RankTier[] = [
    { name: 'ЛЕГЕНДА', minTrophies: 15000, maxTrophies: 999999, color: '#ff00ff', glow: 'rgba(255, 0, 255, 0.5)', icon: '👑' },
    { name: 'ЧЕМПИОН', minTrophies: 10000, maxTrophies: 15000, color: '#00f2ff', glow: 'rgba(0, 242, 255, 0.4)', icon: '⚔️' },
    { name: 'МАСТЕР', minTrophies: 7000, maxTrophies: 10000, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', icon: '🔮' },
    { name: 'АЛМАЗ III', minTrophies: 6200, maxTrophies: 7000, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', icon: '💎' },
    { name: 'АЛМАЗ II', minTrophies: 5400, maxTrophies: 6200, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)', icon: '💎' },
    { name: 'АЛМАЗ I', minTrophies: 4500, maxTrophies: 5400, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.1)', icon: '💎' },
    { name: 'ЗОЛОТО III', minTrophies: 3800, maxTrophies: 4500, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', icon: '🥇' },
    { name: 'ЗОЛОТО II', minTrophies: 3100, maxTrophies: 3800, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.2)', icon: '🥇' },
    { name: 'ЗОЛОТО I', minTrophies: 2500, maxTrophies: 3100, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.1)', icon: '🥇' },
    { name: 'СЕРЕБРО III', minTrophies: 2000, maxTrophies: 2500, color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.2)', icon: '🥈' },
    { name: 'СЕРЕБРО II', minTrophies: 1500, maxTrophies: 2000, color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.1)', icon: '🥈' },
    { name: 'СЕРЕБРО I', minTrophies: 1000, maxTrophies: 1500, color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.05)', icon: '🥈' },
    { name: 'БРОНЗА III', minTrophies: 600, maxTrophies: 1000, color: '#92400e', glow: 'transparent', icon: '🥉' },
    { name: 'БРОНЗА II', minTrophies: 300, maxTrophies: 600, color: '#92400e', glow: 'transparent', icon: '🥉' },
    { name: 'БРОНЗА I', minTrophies: 0, maxTrophies: 300, color: '#92400e', glow: 'transparent', icon: '🥉' },
];

export const getRankInfo = (trophies: number): RankTier => {
    return RANK_SYSTEM.find(rank => trophies >= rank.minTrophies) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
};
