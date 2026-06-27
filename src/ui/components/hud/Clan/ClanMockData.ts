import { ClanData } from './ClanShared';

export const MOCK_CLANS: ClanData[] = [];

export const DEFAULT_MOCK_MEMBERS = [
    {
        name: 'Алексей',
        role: 'OFFICER' as const,
        trophies: 4200,
        lastSeen: 'В сети',
        isOnline: true,
        avatar: 'lion',
        contribution: 250,
        level: 28,
    },
    {
        name: 'Дмитрий',
        role: 'MEMBER' as const,
        trophies: 2100,
        lastSeen: '1д назад',
        isOnline: false,
        avatar: 'panther',
        contribution: 120,
        level: 15,
    },
    {
        name: 'София',
        role: 'OFFICER' as const,
        trophies: 5400,
        lastSeen: 'В сети',
        isOnline: true,
        avatar: 'bear',
        contribution: 410,
        level: 32,
    },
    {
        name: 'Артур',
        role: 'MEMBER' as const,
        trophies: 950,
        lastSeen: '5ч назад',
        isOnline: false,
        avatar: 'cat',
        contribution: 50,
        level: 8,
    },
    {
        name: 'Елена',
        role: 'MEMBER' as const,
        trophies: 1600,
        lastSeen: 'В сети',
        isOnline: true,
        avatar: 'monkey',
        contribution: 180,
        level: 12,
    },
];
