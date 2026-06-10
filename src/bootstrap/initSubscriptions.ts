import { useGameStore } from '../store/useGameStore';

interface SubscriptionsResult {
    unsubChat: () => void;
    unsubLeaderboard: () => void;
    unsubFriends: () => void;
    unsubMail: () => void;
    unsubPrivateChat: () => void;
    unsubProfile: () => void;
}

export const initSubscriptions = async (
    userId: string,
    prefixedId: string
): Promise<SubscriptionsResult> => {
    const { syncService } = await import('../services/SyncService');

    let unsubClanChat: (() => void) | null = null;

    const unsubChat = syncService.subscribeToChat((messages) => {
        useGameStore.getState().setMessages(messages);
    });

    const unsubLeaderboard = syncService.subscribeToGlobalLeaders(10, (leaders) => {
        useGameStore.getState().setLeaderboard(leaders);
    });

    const unsubFriends = syncService.subscribeToFriendRequests(prefixedId, (requests) => {
        useGameStore.getState().setFriendRequests(requests);
    });

    const unsubMail = syncService.subscribeToMail(prefixedId, (mails) => {
        useGameStore.getState().setMail(mails);
    });

    const unsubPrivateChat = syncService.subscribeToPrivateMessages(prefixedId, (messages) => {
        useGameStore.getState().setPrivateMessages(messages);
    });

    let lastAppliedAdminVersion: number | null = null;
    let lastClanId: string | null = null;

    const unsubProfile = syncService.subscribeToOwnProfile(userId, async (dbData) => {
        if (!dbData) return;

        // Friends list dynamic sync check
        const dbFriendIds = dbData.friends || [];
        const localFriends = useGameStore.getState().friends || [];
        const localFriendIds = localFriends.map((f: any) => f.id);
        const hasDiff =
            dbFriendIds.length !== localFriendIds.length ||
            dbFriendIds.some((id: string) => !localFriendIds.includes(id));
        if (hasDiff) {
            console.log('[SyncService] Friends list changed in DB, resolving profiles...');
            const resolved = await syncService.resolveFriendProfiles(dbFriendIds);
            const merged = resolved.map((rf: any) => {
                const oldFriend = localFriends.find((lf: any) => lf.id === rf.id);
                return {
                    ...rf,
                    giftSent: oldFriend ? !!oldFriend.giftSent : false,
                    hasGift: oldFriend ? !!oldFriend.hasGift : false,
                };
            });
            useGameStore.setState({ friends: merged });
            syncService.debouncedSync();
        }

        const dbClanId = dbData.clanId || null;
        if (dbClanId !== lastClanId) {
            lastClanId = dbClanId;
            if (unsubClanChat) {
                unsubClanChat();
                unsubClanChat = null;
            }
            if (dbClanId) {
                unsubClanChat = syncService.subscribeToClanChat(dbClanId, (messages) => {
                    useGameStore.getState().setClanMessages(messages);
                });
            } else {
                useGameStore.getState().setClanMessages([]);
            }
        }

        if (dbData.status === 'BANNED') {
            useGameStore.setState({
                isBanned: true,
                banReason: dbData.banReason || 'Нарушение правил игры',
                banUntil: dbData.banUntil || '',
            });
            return;
        } else {
            useGameStore.setState({ isBanned: false });
        }

        if (dbData.status === 'KICKED') {
            syncService.updateRemotePlayerData(userId, { status: 'OFFLINE' }).catch(() => {});
            useGameStore
                .getState()
                .showAlert('Соединение разорвано: Вы были отключены администратором (KICKED).', () => {
                    window.location.reload();
                });
            return;
        }

        const fullStateStr = dbData.fullStateJSON || dbData.полноеСостояниеJSON;
        if (fullStateStr) {
            try {
                const dbAdminVersion = Number(dbData.adminVersion || 0);
                if (lastAppliedAdminVersion === null) {
                    lastAppliedAdminVersion = dbAdminVersion;
                } else if (dbAdminVersion <= lastAppliedAdminVersion) {
                    return;
                } else {
                    lastAppliedAdminVersion = dbAdminVersion;
                }

                const parsed = JSON.parse(fullStateStr);
                const currentState = useGameStore.getState();
                let hasChanges = false;
                const updatePayload: any = {};

                const adminChangedFields = dbData.adminChangedFields || [];
                const mappedAdminFields = adminChangedFields.map((f: string) => {
                    const map: Record<string, string> = {
                        золото: 'gold',
                        gold: 'gold',
                        кристаллы: 'crystals',
                        crystals: 'crystals',
                        уровень: 'level',
                        level: 'level',
                        рейтинг: 'rating',
                        rating: 'rating',
                        инвентарь: 'inventory',
                        inventory: 'inventory',
                        снаряжение: 'heroEquipment',
                        heroEquipment: 'heroEquipment',
                        фото: 'avatar',
                        avatar: 'avatar',
                    };
                    return map[f] || f;
                });

                const trackedFields = [
                    'gold',
                    'crystals',
                    'level',
                    'rating',
                    'trophies',
                    'inventory',
                    'heroEquipment',
                    'ownedSkins',
                    'shards',
                    'ownedHeroes',
                    'energy',
                    'maxEnergy',
                ];

                for (const field of trackedFields) {
                    if (parsed[field] !== undefined) {
                        if (adminChangedFields.length > 0 && !mappedAdminFields.includes(field)) {
                            continue;
                        }
                        const localVal = currentState[field];
                        const remoteVal = parsed[field];
                        if (typeof remoteVal === 'object') {
                            if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
                                updatePayload[field] = remoteVal;
                                hasChanges = true;
                            }
                        } else {
                            if (localVal !== remoteVal) {
                                updatePayload[field] = remoteVal;
                                hasChanges = true;
                            }
                        }
                    }
                }

                if (hasChanges) {
                    console.log(
                        '[SyncService] Admin updated player state, applying changes:',
                        updatePayload,
                    );
                    useGameStore.setState(updatePayload);
                }
            } catch (e) {
                console.error('[SyncService] Error parsing own profile JSON update:', e);
            }
        }
    });

    return {
        unsubChat,
        unsubLeaderboard,
        unsubFriends,
        unsubMail,
        unsubPrivateChat,
        unsubProfile: () => {
            unsubProfile();
            if (unsubClanChat) {
                unsubClanChat();
            }
        }
    };
};
