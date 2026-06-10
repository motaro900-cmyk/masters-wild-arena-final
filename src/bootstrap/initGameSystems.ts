import { useGameStore } from '../store/useGameStore';

export const initGameSystems = (timeOffset: number): void => {
    const updatedState = useGameStore.getState();

    // Welcome messages logic
    const welcomeKey = `seen_welcome_msgs_${updatedState.playerId}`;
    const hasSeenWelcome = localStorage.getItem(welcomeKey);
    const hasWelcome = hasSeenWelcome ? true : updatedState.messages.some((m: any) => m.id === 'welcome-1');
    const hasCodex = hasSeenWelcome ? true : updatedState.messages.some((m: any) => m.id === 'codex-1');

    if (!hasSeenWelcome && (!hasWelcome || !hasCodex)) {
        localStorage.setItem(welcomeKey, 'true');
        const welcomeMsgs = [];
        if (!hasWelcome)
            welcomeMsgs.push({
                id: 'welcome-1',
                author: 'СИСТЕМА',
                avatar: '/assets/images/ui/ICON_CROWN.webp',
                text: 'Приветствуем в Masters of the Wild! Твой путь к величию начинается здесь. 🐉⚔️',
                type: 'system',
                timestamp: Date.now() - 2000,
                level: 1,
                rankIcon: '',
            });
        if (!hasCodex)
            welcomeMsgs.push({
                id: 'codex-1',
                author: 'КОДЕКС ЧЕСТИ',
                avatar: '/assets/images/ui/ICON_CROWN.webp',
                text: 'Истинная сила — в уважении. Будьте вежливы, не используйте оскорбления и мат. Пусть в чате царит дух честной игры! 🛡️🤝',
                type: 'system',
                timestamp: Date.now() - 1000,
                level: 1,
                rankIcon: '',
            });

        const merged = [...welcomeMsgs, ...updatedState.messages];
        const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
        useGameStore.setState({
            messages: unique.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-100),
        });
    }

    const MSK_OFFSET = 3 * 60 * 60 * 1000;
    const DAY_MS = 24 * 60 * 60 * 1000;
    const isNewDayMSK = (last: number) => {
        const nowMSK = Date.now() + timeOffset + MSK_OFFSET;
        const lastMSK = last + MSK_OFFSET;
        return Math.floor(nowMSK / DAY_MS) > Math.floor(lastMSK / DAY_MS);
    };

    if (!updatedState.onboardingCompleted) {
        console.log('👶 New player or Onboarding not completed, forcing tutorial...');
        if (!updatedState.name || updatedState.name === 'Мастер') {
            useGameStore.setState({ activeScreen: 'INTRO' });
        }
    }

    const finalState = useGameStore.getState();
    if (finalState.checkPetDailyReward) {
        finalState.checkPetDailyReward();
    }

    if (
        !finalState.dailyQuests ||
        finalState.dailyQuests.length === 0 ||
        isNewDayMSK(finalState.lastDailyRefresh)
    ) {
        finalState.refreshDailyQuests();
    }
    if (!finalState.weeklyQuests || finalState.weeklyQuests.length === 0) {
        finalState.refreshWeeklyQuests();
    } else {
        const lastReset = finalState.lastWeeklyQuestReset || 0;
        const now = Date.now() + timeOffset;
        const msInWeek = 7 * 24 * 60 * 60 * 1000;
        if (now - lastReset >= msInWeek) {
            finalState.refreshWeeklyQuests();
        }
    }

    finalState.updateQuestProgress('LOGIN', 1);

    if (updatedState.messages.some((m: any) => m.author === 'Мастер' && m.text === 'Привет')) {
        useGameStore.setState({
            messages: updatedState.messages.filter((m: any) => !(m.author === 'Мастер' && m.text === 'Привет')),
        });
    }

    // Process referral code
    const searchParams = new URLSearchParams(window.location.search);
    const startParam = searchParams.get('vk_start_params') || searchParams.get('start_parameter');
    if (startParam) {
        console.log('📌 Found referral start parameter:', startParam);
        useGameStore.getState().processReferralCode(startParam);
    }
};

export const setupReferralAndGifts = (timeOffset: number): void => {
    const { syncService } = useGameStore.getState() as any; // Loaded on demand
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('request_id');
    if (requestId) {
        console.log('🎁 Game launched via Request Link:', requestId);
        const currentStore = useGameStore.getState();
        const claimedGifts = currentStore.claimedGifts || [];
        if (claimedGifts.includes(requestId)) {
            console.log('⚠️ Request Link already claimed:', requestId);
        } else {
            setTimeout(async () => {
                const store = useGameStore.getState();
                const updatedGifts = [...(store.claimedGifts || []), requestId];
                useGameStore.setState({
                    claimedGifts: updatedGifts,
                });
                store.addGold(5000);
                const { syncService: liveSyncService } = await import('../services/SyncService');
                liveSyncService.debouncedSync();
                useGameStore.getState().showAlert('Вы получили подарок от друга: 5,000 золота! 💰');
            }, 3000);
        }
    }
};
