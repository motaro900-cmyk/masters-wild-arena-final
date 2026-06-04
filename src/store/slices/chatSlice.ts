import { getRankInfo } from '../../configs/RankSystem';
import { syncService } from '../../services/SyncService';

/**
 * chatSlice — глобальный игровой чат и обратная связь.
 *
 * Выделен из battleSlice чтобы изменения в чате не вызывали пересчёт
 * компонентов, подписанных на почту или боевые настройки.
 */
export const createChatSlice = (set: any, get: any) => ({
    messages: [
        {
            id: 'welcome-1',
            author: 'СИСТЕМА',
            avatar: '/assets/images/ui/system_icon.png',
            text: 'Приветствуем в Masters of the Wild! Твой путь к величию начинается здесь. 🐉⚔️',
            type: 'system',
            timestamp: Date.now() - 1000,
            level: 1,
            rankIcon: '',
        },
        {
            id: 'codex-1',
            author: 'КОДЕКС ЧЕСТИ',
            avatar: '/assets/images/ui/system_icon.png',
            text: 'Истинная сила — в уважении. Будьте вежливы, не используйте оскорбления и мат. Пусть в чате царит дух честной игры! 🛡️🤝',
            type: 'system',
            timestamp: Date.now(),
            level: 1,
            rankIcon: '',
        },
    ] as any[],

    chatMessages: [
        { id: 1, text: 'Добро пожаловать в общий чат!', sender: 'Система' },
        { id: 2, text: 'Всем привет, кто в пати?', sender: 'xXx_Panda_xXx' },
        { id: 3, text: 'Куплю Меч Рассвета, дорого!', sender: 'TraderBob' },
        { id: 4, text: 'Когда обнова?', sender: 'NoobMaster99' },
    ] as any[],

    combatLogs: [] as string[],
    leaderboard: [] as any[],

    // --- Actions ---

    setLeaderboard: (leaders: any[]) => set({ leaderboard: leaders }),

    setMessages: (newMessages: any[]) => {
        set((state: any) => {
            const allMessages = [...state.messages, ...newMessages];
            const uniqueMessages = Array.from(
                new Map(allMessages.map((m) => [m.id, m])).values(),
            );
            return {
                messages: uniqueMessages
                    .sort((a: any, b: any) => a.timestamp - b.timestamp)
                    .slice(-100),
            };
        });
    },

    addMessage: async (text: string, author = 'Motar', type = 'common') => {
        const state = get();
        const currentRating = state.rating || 0;
        const rankInfo = getRankInfo(currentRating);

        const finalAuthor =
            author === 'Игрок' ||
            author === 'Мастер' ||
            author === 'Motar' ||
            !author
                ? state.name
                : author;

        const finalAvatar =
            state.avatar ||
            state.vkUser?.photo_200 ||
            state.vkUser?.photo ||
            '/assets/images/avatars/panda.webp';

        const leaderboard = get().leaderboard || [];
        const top1 = leaderboard[0];
        const isTop1 = top1 !== undefined && (
            top1.id === state.playerId ||
            top1.playerId === state.playerId ||
            (state.vkUser && String(top1.vkId) === String(state.vkUser.id)) ||
            top1.id === `GUEST-${state.playerId}` ||
            (state.vkUser && top1.id === `VK-${state.vkUser.id}`)
        );

        const newMessage = {
            author: finalAuthor,
            avatar: finalAvatar,
            text,
            type,
            timestamp: Date.now(),
            level: state.level || 1,
            rankIcon: rankInfo.icon,
            vipLevel: state.vipLevel || 0,
            isTop1,
        };

        if (type === 'system' && author === 'СИСТЕМА') {
            set({
                messages: [
                    ...state.messages,
                    { ...newMessage, id: Math.random().toString(36).substr(2, 9) },
                ],
            });
        } else {
            await syncService.sendChatMessage(newMessage);
        }
    },

    removeMessage: (id: string) =>
        set((state: any) => ({
            messages: state.messages.filter((m: any) => m.id !== id),
        })),

    resetChat: () => {
        set({
            messages: [
                {
                    id: 'welcome-1',
                    author: 'СИСТЕМА',
                    avatar: '/assets/images/ui/system_icon.png',
                    text: 'Чат очищен. Приятного общения! ✨',
                    type: 'system',
                    timestamp: Date.now(),
                    level: 1,
                    rankIcon: '',
                },
            ],
        });
    },

    addChatMessage: (msg: any) =>
        set((state: any) => ({
            chatMessages: [...state.chatMessages, { id: Date.now(), ...msg }].slice(-50),
        })),

    addCombatLog: (msg: string) =>
        set((state: any) => ({
            combatLogs: [
                ...state.combatLogs.slice(-49),
                `${new Date().toLocaleTimeString()} - ${msg}`,
            ],
        })),

    clearCombatLogs: () => set({ combatLogs: [] }),

    sendFeedback: (category: string, text: string) => {
        const state = get();
        const feedbackData = {
            category,
            text,
            userId: state.playerId,
            userName: state.vkUser
                ? `${state.vkUser.first_name} ${state.vkUser.last_name}`
                : 'Мастер',
            level: state.level,
            platform:
                typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            version: 'v1.1.0',
            timestamp: Date.now(),
        };
        syncService.sendFeedback(feedbackData);
    },
});
