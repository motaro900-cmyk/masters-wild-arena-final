import React from 'react';

// --- КОНСТАНТЫ ИКОНОК (SVG) ---
export const SVG_ICONS: Record<string, string> = {
    Crown: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z',
    Trophy: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1',
    Play: 'M8 5v14l11-7z',
    PawPrint: 'M12 5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1s-1 .45-1 1v1c0 .55.45 1 1 1z',
    Package: 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l8 4v7.64l-8 4-8-4V8.18l8-4z',
    ShoppingCart:
        'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
    Users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3z M16 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z M8 13c-.25 0-.5.02-.75.06C5.55 13.62 4 15.02 4 16.5V19h2v-2.5c0-.98.66-1.89 1.77-2.31C7.91 13.9 8 13.46 8 13z',
    Gift: 'M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z',
    Mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.89 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    Settings:
        'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
    MessageCircle:
        'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
    Calendar:
        'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z',
    Target: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
};

export const Icon: React.FC<{ name: string; size?: number; className?: string }> = ({
    name,
    size = 24,
    className = '',
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d={SVG_ICONS[name] || ''} />
    </svg>
);

export const Juicy3DIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 36 }) => {
    if (type === 'Coins')
        return (
            <svg width={size} height={size} viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF8B0" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#D2691E" />
                    </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="14" fill="url(#goldG)" stroke="#B8860B" strokeWidth="1" />
            </svg>
        );
    if (type === 'Zap')
        return (
            <svg width={size} height={size} viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="zapG" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF8B0" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF8C00" />
                    </linearGradient>
                </defs>
                <path d="M18 2 L6 18 h8 L10 30 L26 14 h-8 Z" fill="url(#zapG)" stroke="#B8860B" strokeWidth="1" />
            </svg>
        );
    if (type === 'Gem')
        return (
            <svg width={size} height={size} viewBox="0 0 32 32">
                <defs>
                    <linearGradient id="gemG" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E0B0FF" />
                        <stop offset="50%" stopColor="#8A2BE2" />
                        <stop offset="100%" stopColor="#4B0082" />
                    </linearGradient>
                </defs>
                <path d="M16 2 L30 10 L16 30 L2 10 Z" fill="url(#gemG)" stroke="#4B0082" strokeWidth="1" />
            </svg>
        );
    return null;
};

// --- ДАННЫЕ ИГРОКА ---
export const PLAYER_DATA = {
    name: 'Игрок ВК',
    league: 'Золото III',
    rank: 1450,
    level: 15,
    exp: 340,
    maxExp: 500,
    portrait: 'Cat',
    leaderboardPos: 1240,
};
