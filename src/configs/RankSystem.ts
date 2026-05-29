export interface RankTier {
    name: string;
    minTrophies: number;
    maxTrophies: number; // Верхний порог для отображения прогресса
    color: string;
    glow: string;
    icon: string;
}

export const RANK_SYSTEM: RankTier[] = [
    {
        name: 'ЛЕГЕНДА',
        minTrophies: 10500,
        maxTrophies: 999999,
        color: '#00f2ff',
        glow: 'rgba(0, 242, 255, 0.6)',
        icon: '/assets/images/ui/rank_11.webp',
    },
    {
        name: 'ВЛАСТЕЛИН',
        minTrophies: 9000,
        maxTrophies: 10500,
        color: '#3182ce',
        glow: 'rgba(49, 130, 206, 0.5)',
        icon: '/assets/images/ui/rank_10.webp',
    },
    {
        name: 'МАГИСТР',
        minTrophies: 7500,
        maxTrophies: 9000,
        color: '#4fd1c5',
        glow: 'rgba(79, 209, 197, 0.5)',
        icon: '/assets/images/ui/rank_09.webp',
    },
    {
        name: 'ЧЕМПИОН',
        minTrophies: 6000,
        maxTrophies: 7500,
        color: '#f6ad55',
        glow: 'rgba(246, 173, 85, 0.4)',
        icon: '/assets/images/ui/rank_07.webp',
    },
    {
        name: 'ЭЛИТА',
        minTrophies: 4500,
        maxTrophies: 6000,
        color: '#ed8936',
        glow: 'rgba(237, 137, 54, 0.4)',
        icon: '/assets/images/ui/rank_06.webp',
    },
    {
        name: 'ГЕРОЙ',
        minTrophies: 3000,
        maxTrophies: 4500,
        color: '#d69e2e',
        glow: 'rgba(214, 158, 46, 0.4)',
        icon: '/assets/images/ui/rank_05.webp',
    },
    {
        name: 'МАСТЕР',
        minTrophies: 2000,
        maxTrophies: 3000,
        color: '#a0aec0',
        glow: 'rgba(160, 174, 192, 0.3)',
        icon: '/assets/images/ui/rank_04.webp',
    },
    {
        name: 'ВЕТЕРАН',
        minTrophies: 1000,
        maxTrophies: 2000,
        color: '#718096',
        glow: 'rgba(113, 128, 150, 0.3)',
        icon: '/assets/images/ui/rank_03.webp',
    },
    {
        name: 'ВОИН',
        minTrophies: 400,
        maxTrophies: 1000,
        color: '#b7791f',
        glow: 'rgba(183, 121, 31, 0.2)',
        icon: '/assets/images/ui/rank_02.webp',
    },
    {
        name: 'НОВИЧОК',
        minTrophies: 0,
        maxTrophies: 400,
        color: '#8d5d1a',
        glow: 'transparent',
        icon: '/assets/images/ui/rank_01.webp',
    },
];

export const getRankInfo = (trophies: number): RankTier => {
    return RANK_SYSTEM.find((rank) => trophies >= rank.minTrophies) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
};
