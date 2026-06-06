import { syncService, SyncService } from '../../services/SyncService';

/**
 * mailSlice — почтовый ящик игрока (входящие, архив, новостные письма).
 *
 * Выделен из battleSlice чтобы обновления почты (пришёл VIP-подарок, новость)
 * не вызывали пересчёт подписчиков чата или боевых настроек.
 */
export const createMailSlice = (set: any, get: any) => ({
    mail: [] as any[],

    // --- Actions ---

    setMail: (newMail: any[]) => {
        set({ mail: newMail });
    },

    addMail: (newMail: any) => {
        set((state: any) => {
            if (state.mail.some((m: any) => m.id === newMail.id)) return state;
            return { mail: [newMail, ...state.mail] };
        });

        const store = get();
        const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        if (userId) {
            syncService.sendMail(userId, newMail).catch((e: any) => {
                console.error('[MailSlice] sendMail failed:', e);
            });
        }
    },

    markMailAsRead: (id: string) => {
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, isRead: true } : m)),
        }));
        const store = get();
        const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        if (userId) {
            syncService.updateMail(userId, id, { isRead: true }).catch((e: any) => {
                console.error('[MailSlice] markMailAsRead update failed:', e);
            });
        }
    },

    deleteMail: (id: string) => {
        set((state: any) => {
            const mailItem = state.mail.find((m: any) => m.id === id);
            // System letters (welcome-mail, NEWS tab) cannot be deleted
            if (mailItem?.id === 'welcome-mail' || mailItem?.tab === 'NEWS') return state;
            return {
                mail: state.mail.filter((m: any) => m.id !== id),
            };
        });
        const store = get();
        const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        if (userId) {
            syncService.deleteMail(userId, id).catch((e: any) => {
                console.error('[MailSlice] deleteMail failed:', e);
            });
        }
    },

    archiveMail: (id: string) => {
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, tab: 'ARCHIVE' } : m)),
        }));
        const store = get();
        const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        if (userId) {
            syncService.updateMail(userId, id, { tab: 'ARCHIVE' }).catch((e: any) => {
                console.error('[MailSlice] archiveMail failed:', e);
            });
        }
    },

    toggleMailStar: (id: string) => {
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m)),
        }));
        setTimeout(() => {
            const store = get();
            const mailItem = store.mail.find((m: any) => m.id === id);
            if (mailItem) {
                const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
                if (userId) {
                    syncService.updateMail(userId, id, { isStarred: mailItem.isStarred }).catch((e: any) => {
                        console.error('[MailSlice] toggleMailStar failed:', e);
                    });
                }
            }
        }, 0);
    },

    claimMailReward: (id: string) => {
        const mail = get().mail.find((m: any) => m.id === id);
        if (mail && mail.rewards) {
            mail.rewards.forEach((r: any) => {
                if (r.type === 'GOLD') get().addGold(r.amount);
                if (r.type === 'CRYSTALS') get().addCrystals(r.amount);
                if (r.type === 'ENERGY') get().addEnergy(r.amount);
                if (r.type === 'ITEM' && r.itemId) {
                    get().addItemToInventory({ id: r.itemId, level: 1 });
                }
            });
            set((state: any) => ({
                mail: state.mail.map((m: any) => (m.id === id ? { ...m, rewards: null, isRead: true } : m)),
            }));
            const store = get();
            const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
            if (userId) {
                syncService.updateMail(userId, id, { rewards: null, isRead: true }).catch((e: any) => {
                    console.error('[MailSlice] claimMailReward failed:', e);
                });
            }
        }
    },

    collectAllMailRewards: () => {
        const mails = get().mail;
        let totalGold = 0;
        let totalCrystals = 0;
        let totalEnergy = 0;

        mails.forEach((m: any) => {
            if (m.tab === 'INBOX' && m.rewards) {
                m.rewards.forEach((r: any) => {
                    if (r.type === 'GOLD') totalGold += r.amount;
                    if (r.type === 'CRYSTALS') totalCrystals += r.amount;
                    if (r.type === 'ENERGY') totalEnergy += r.amount;
                    if (r.type === 'ITEM' && r.itemId) {
                        get().addItemToInventory({ id: r.itemId, level: 1, amount: r.amount || 1 });
                    }
                });
            }
        });

        if (totalGold > 0) get().addGold(totalGold);
        if (totalCrystals > 0) get().addCrystals(totalCrystals);
        if (totalEnergy > 0) get().addEnergy(totalEnergy);

        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.tab === 'INBOX' ? { ...m, rewards: null, isRead: true } : m)),
        }));

        const store = get();
        const userId = SyncService.getPrefixedUserId(store.vkUser, store.playerId);
        if (userId) {
            mails.forEach((m: any) => {
                if (m.tab === 'INBOX' && m.rewards) {
                    syncService.updateMail(userId, m.id, { rewards: null, isRead: true }).catch((e: any) => {
                        console.error('[MailSlice] collectAllMailRewards item failed:', e);
                    });
                }
            });
        }
    },
});
