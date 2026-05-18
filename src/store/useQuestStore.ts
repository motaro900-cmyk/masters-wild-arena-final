import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorage } from '../utils/SafeStorage';
import { QUESTS_POOL } from '../configs/QuestsConfig';
import { useGameStore } from './useGameStore';

interface IQuestState {
    dailyQuests: { questId: string; progress: number; isClaimed: boolean }[];
    lastDailyRefresh: number;
    refreshDailyQuests: () => void;
    updateQuestProgress: (type: string, amount: number) => void;
    claimQuestReward: (questId: string) => void;
}

export const useQuestStore = create<IQuestState>()(
    persist(
        (set, get) => ({
            dailyQuests: [],
            lastDailyRefresh: 0,

            refreshDailyQuests: () => {
                const shuffled = [...QUESTS_POOL].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4).map((q) => ({
                    questId: q.id,
                    progress: 0,
                    isClaimed: false,
                }));
                set({ dailyQuests: selected, lastDailyRefresh: Date.now() });
            },

            updateQuestProgress: (type, amount) =>
                set((state) => {
                    const newQuests = state.dailyQuests.map((dq) => {
                        const questData = QUESTS_POOL.find((q) => q.id === dq.questId);
                        if (questData && questData.type === type && !dq.isClaimed) {
                            return { ...dq, progress: Math.min(questData.target, dq.progress + amount) };
                        }
                        return dq;
                    });
                    return { dailyQuests: newQuests };
                }),

            claimQuestReward: (questId) => {
                const state = get();
                const dq = state.dailyQuests.find((q) => q.questId === questId);
                const qData = QUESTS_POOL.find((q) => q.id === questId);

                if (dq && qData && dq.progress >= qData.target && !dq.isClaimed) {
                    useGameStore.getState().addGold(qData.rewardGold);
                    useGameStore.getState().addCrystals(qData.rewardGems);
                    const newQuests = state.dailyQuests.map((q) =>
                        q.questId === questId ? { ...q, isClaimed: true } : q,
                    );
                    set({ dailyQuests: newQuests });
                }
            },
        }),
        {
            name: 'quest-storage',
            storage: createJSONStorage(() => getStorage()),
        },
    ),
);
