import { useGameStore, WEEKLY_QUESTS_POOL } from '../../../../store/useGameStore';
import { QUESTS_POOL } from '../../../../configs/QuestsConfig';

/**
 * Кастомный хук: маппинг dailyQuests / weeklyQuests из Zustand-стора
 * в UI-формат для компонента QuestSection.
 */
export function useBattlePassQuests() {
    const { dailyQuests, weeklyQuests } = useGameStore();

    const currentDailyQuests = (dailyQuests || []).map((dq: any) => {
        const meta = QUESTS_POOL.find((q) => q.id === dq.questId) || {
            title: 'Неизвестное задание',
            description: '',
            target: 1,
            rewardExp: 100,
            icon: '📜',
            type: 'LOGIN',
        };
        const xp = meta.rewardExp || 100;
        let icon = '📜';
        if (meta.type === 'LOGIN') icon = '🚪';
        else if (meta.type === 'PLAY') icon = '🎮';
        else if (meta.type === 'WIN') icon = '🏆';
        else if (meta.type === 'DAMAGE') icon = '💥';
        else if (meta.type === 'SPEND_GOLD') icon = '💰';
        else if (meta.type === 'OPEN_CHEST') icon = '📦';
        else if (meta.type === 'UPGRADE') icon = '⚒️';
        else if (meta.type === 'WIN_STREAK') icon = '🔥';

        return {
            id: dq.questId,
            title: meta.title,
            description: meta.description,
            progress: dq.progress,
            target: meta.target,
            rewardXp: xp,
            icon: icon,
            isClaimed: dq.isClaimed,
            canClaim: dq.progress >= meta.target && !dq.isClaimed,
        };
    });

    const currentWeeklyQuests = (weeklyQuests || []).map((wq: any) => {
        const meta = WEEKLY_QUESTS_POOL.find((q) => q.id === wq.questId) || {
            title: 'Неизвестное задание',
            description: '',
            target: 1,
            rewardExp: 500,
            icon: '📜',
        };
        return {
            id: wq.questId,
            title: meta.title,
            description: meta.description,
            progress: wq.progress,
            target: meta.target,
            rewardXp: meta.rewardExp || 500,
            icon: meta.icon || '📜',
            isClaimed: wq.isClaimed,
            canClaim: wq.progress >= meta.target && !wq.isClaimed,
        };
    });

    return { currentDailyQuests, currentWeeklyQuests };
}
