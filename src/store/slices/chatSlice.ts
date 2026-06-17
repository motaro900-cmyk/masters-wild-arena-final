import { getRankInfo } from '../../configs/RankSystem';
import { syncService, SyncService } from '../../services/SyncService';

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
    privateMessages: [] as any[],
    clanMessages: [
        { id: 'mock-clan-1', author: 'Алексей', role: 'OFFICER', text: 'Всем привет! Готовимся к осаде в 20:00.', timestamp: Date.now() - 3 * 60 * 1000 },
        { id: 'mock-clan-2', author: 'Дмитрий', role: 'MEMBER', text: 'Да, я уже собрал нужные зелья и экипировку.', timestamp: Date.now() - 2 * 60 * 1000 },
        { id: 'mock-clan-3', author: 'София', role: 'OFFICER', text: 'Отлично! Не забудьте сделать ежедневные взносы золота.', timestamp: Date.now() - 1 * 60 * 1000 },
    ] as any[],
    lastMessageTime: 0,
    chatActiveTab: 'all' as 'all' | 'system' | 'clan' | 'private',
    chatPrivateRecipient: null as string | null,

    // --- Actions ---

    setChatActiveTab: (tab: 'all' | 'system' | 'clan' | 'private') => set({ chatActiveTab: tab }),
    setChatPrivateRecipient: (recipient: string | null) => set({ chatPrivateRecipient: recipient }),
    setLeaderboard: (leaders: any[]) => set({ leaderboard: leaders }),

    setMessages: (newMessages: any[]) => {
        set((state: any) => {
            const allMessages = [...state.messages, ...newMessages];
            const uniqueMessages = Array.from(new Map(allMessages.map((m) => [m.id, m])).values());
            return {
                messages: uniqueMessages.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
            };
        });
    },

    setPrivateMessages: (newMessages: any[]) => {
        set((state: any) => {
            const allMessages = [...state.privateMessages, ...newMessages];
            const uniqueMessages = Array.from(new Map(allMessages.map((m) => [m.id, m])).values());
            return {
                privateMessages: uniqueMessages.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
            };
        });
    },

    setClanMessages: (newMessages: any[]) => {
        set((state: any) => {
            const allMessages = [...state.clanMessages, ...newMessages];
            const uniqueMessages = Array.from(new Map(allMessages.map((m) => [m.id, m])).values());
            return {
                clanMessages: uniqueMessages.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
            };
        });
    },

    addMessage: async (text: string, author = 'Motar', type = 'common') => {
        const state = get();
        const now = Date.now();
        let finalType = type;
        const trimmed = text.trim();

        if (trimmed.toLowerCase().startsWith('/w')) {
            finalType = 'private';
        }

        // Spam protection (cooldown 1.5 seconds)
        if (finalType !== 'system' && now - (state.lastMessageTime || 0) < 1500) {
            const cooldownMsg = {
                id: `sys_cooldown_${Date.now()}`,
                author: 'СИСТЕМА',
                avatar: '/assets/images/ui/system_icon.png',
                text: 'Пожалуйста, не отправляйте сообщения так часто (кулдаун 1.5 сек).',
                type: 'personal',
                timestamp: Date.now(),
                level: 1,
                rankIcon: '',
                vipLevel: 0,
                isTop1: false,
            };
            if (finalType === 'private') {
                set((s: any) => ({
                    privateMessages: [...s.privateMessages, cooldownMsg],
                }));
            } else {
                set((s: any) => ({
                    messages: [...s.messages, cooldownMsg],
                }));
            }
            return;
        }

        // Character limit check (max 150)
        if (finalType !== 'system' && text.length > 150) {
            const limitMsg = {
                id: `sys_limit_${Date.now()}`,
                author: 'СИСТЕМА',
                avatar: '/assets/images/ui/system_icon.png',
                text: 'Сообщение слишком длинное (максимум 150 символов).',
                type: 'personal',
                timestamp: Date.now(),
                level: 1,
                rankIcon: '',
                vipLevel: 0,
                isTop1: false,
            };
            if (finalType === 'private') {
                set((s: any) => ({
                    privateMessages: [...s.privateMessages, limitMsg],
                }));
            } else {
                set((s: any) => ({
                    messages: [...s.messages, limitMsg],
                }));
            }
            return;
        }

        set({ lastMessageTime: now });

        const currentRating = state.rating || 0;
        const rankInfo = getRankInfo(currentRating);

        const finalAuthor =
            author === 'Игрок' || author === 'Мастер' || author === 'Motar' || !author ? state.name : author;

        const finalAvatar =
            state.avatar || state.vkUser?.photo_200 || state.vkUser?.photo || '/assets/images/avatars/panda.webp';

        const leaderboard = get().leaderboard || [];
        const top1 = leaderboard[0];
        const isTop1 =
            top1 !== undefined &&
            (top1.id === state.playerId ||
                top1.playerId === state.playerId ||
                (state.vkUser && String(top1.vkId) === String(state.vkUser.id)) ||
                top1.id === `GUEST-${state.playerId}` ||
                (state.vkUser && top1.id === `VK-${state.vkUser.id}`));

        const activeHeroId = state.selectedHeroId || 'panda';
        const activeHeroLevel = state.heroes?.[activeHeroId]?.level || 1;

        const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newMessage: any = {
            id: msgId,
            senderId: SyncService.getPrefixedUserId(state.vkUser, state.playerId),
            author: finalAuthor,
            avatar: finalAvatar,
            text,
            type: finalType,
            timestamp: Date.now(),
            level: activeHeroLevel,
            rankIcon: rankInfo.icon,
            vipLevel: state.vipLevel || 0,
            isTop1,
        };

        if (finalType === 'clan') {
            newMessage.clanId = state.clanId;
        }

        if (finalType === 'system' && author === 'СИСТЕМА') {
            set({
                messages: [...state.messages, { ...newMessage, id: Math.random().toString(36).substring(2, 11) }],
            });
        } else if (finalType === 'clan') {
            set((s: any) => {
                const allClanMsgs = [...s.clanMessages, newMessage];
                const uniqueClanMsgs = Array.from(new Map(allClanMsgs.map((m) => [m.id, m])).values());
                return {
                    clanMessages: uniqueClanMsgs.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
                };
            });
            await syncService.sendChatMessage(newMessage);
        } else if (finalType === 'private') {
            const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
            if (userId) {
                // Support colon format whisper `/w Ivan Ivanov: message`, fallbacks to space-separated format
                let recipientName = '';
                const colonMatch = text.match(/^\/w\s+([^:]+?)\s*:\s*(.*)/i);
                if (colonMatch) {
                    recipientName = colonMatch[1].trim();
                } else {
                    const fallbackMatch = text.match(/^\/w\s+(\S+)\s+(.*)/i);
                    if (fallbackMatch) {
                        recipientName = fallbackMatch[1].trim();
                    }
                }

                if (recipientName) {
                    const recipientId = await syncService.getPlayerIdByName(recipientName);
                    if (recipientId) {
                        newMessage.recipientId = recipientId;
                        newMessage.recipientName = recipientName;
                        await syncService.sendPrivateMessage(userId, recipientId, newMessage);
                    } else {
                        const errorMsg = {
                            id: `sys_error_${Date.now()}`,
                            author: 'СИСТЕМА',
                            avatar: '/assets/images/ui/system_icon.png',
                            text: `Игрок "${recipientName}" не найден в игре.`,
                            type: 'personal',
                            timestamp: Date.now(),
                            level: 1,
                            rankIcon: '',
                            vipLevel: 0,
                            isTop1: false,
                        };
                        set((s: any) => ({
                            privateMessages: [...s.privateMessages, errorMsg],
                        }));
                    }
                } else {
                    const errorMsg = {
                        id: `sys_error_${Date.now()}`,
                        author: 'СИСТЕМА',
                        avatar: '/assets/images/ui/system_icon.png',
                        text: 'Неверный формат шепота. Используйте: /w Имя: сообщение или /w Имя сообщение',
                        type: 'personal',
                        timestamp: Date.now(),
                        level: 1,
                        rankIcon: '',
                        vipLevel: 0,
                        isTop1: false,
                    };
                    set((s: any) => ({
                        privateMessages: [...s.privateMessages, errorMsg],
                    }));
                }
            }
        } else {
            set((s: any) => {
                const allMsgs = [...s.messages, newMessage];
                const uniqueMsgs = Array.from(new Map(allMsgs.map((m) => [m.id, m])).values());
                return {
                    messages: uniqueMsgs.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
                };
            });
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
            combatLogs: [...state.combatLogs.slice(-49), `${new Date().toLocaleTimeString()} - ${msg}`],
        })),

    clearCombatLogs: () => set({ combatLogs: [] }),

    sendFeedback: (category: string, text: string) => {
        const state = get();
        const feedbackData = {
            category,
            text,
            userId: state.playerId,
            userName: state.vkUser ? `${state.vkUser.first_name} ${state.vkUser.last_name}` : 'Мастер',
            level: state.heroes?.[state.selectedHeroId || 'panda']?.level || 1,
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            version: 'v1.1.0',
            timestamp: Date.now(),
        };
        syncService.sendFeedback(feedbackData);
    },
});
