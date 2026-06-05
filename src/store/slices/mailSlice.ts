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

    markMailAsRead: (id: string) =>
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, isRead: true } : m)),
        })),

    deleteMail: (id: string) =>
        set((state: any) => {
            const mailItem = state.mail.find((m: any) => m.id === id);
            // System letters (welcome-mail, NEWS tab) cannot be deleted
            if (mailItem?.id === 'welcome-mail' || mailItem?.tab === 'NEWS') return state;
            return {
                mail: state.mail.filter((m: any) => m.id !== id),
            };
        }),

    archiveMail: (id: string) =>
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, tab: 'ARCHIVE' } : m)),
        })),

    toggleMailStar: (id: string) =>
        set((state: any) => ({
            mail: state.mail.map((m: any) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m)),
        })),

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
    },
});
