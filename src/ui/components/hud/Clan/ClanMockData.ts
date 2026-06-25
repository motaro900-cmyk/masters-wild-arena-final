import { ClanData } from './ClanShared';

export const MOCK_CLANS: ClanData[] = [];

export const DEFAULT_MOCK_MEMBERS = [
    {
        name: 'Алексей',
        role: 'OFFICER' as const,
        trophies: 4200,
        lastSeen: 'В сети',
        isOnline: true,
        avatar: 'sprite:sprite-avatar avatar-pos-3',
        contribution: 250,
        level: 28,
    },
    {
        name: 'Дмитрий',
        role: 'MEMBER' as const,
        trophies: 2100,
        lastSeen: '1д назад',
        isOnline: false,
        avatar: 'sprite:sprite-avatar avatar-pos-4',
        contribution: 120,
        level: 15,
    },
    {
        name: 'София',
        role: 'OFFICER' as const,
        trophies: 5400,
        lastSeen: 'В сети',
        isOnline: true,
        avatar: 'sprite:sprite-avatar avatar-pos-7',
        contribution: 410,
        level: 32,
    },
    {
        name: 'Артур',
        role: 'MEMBER' as const,
        trophies: 950,
        lastSeen: '5ч назад',
        isOnline: false,
        avatar: 'sprite:sprite-avatar avatar-pos-6',
        contribution: 50,
        level: 8,
    },
    {
        name: 'Елена',
        role: 'MEMBER' as const,
        trophies: 1600,
        lastSeen: 'В сети',
        isOnline: true,
        avatar: 'sprite:sprite-avatar avatar-pos-9',
        contribution: 180,
        level: 12,
    },
];
