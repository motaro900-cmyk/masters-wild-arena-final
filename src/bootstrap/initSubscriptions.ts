import { useGameStore } from '../store/useGameStore';
import { bootController } from './BootController';

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
        bootController.execute({
            type: 'MUTATE_STATE',
            payload: {
                patch: () => {
                    useGameStore.getState().setMessages(messages);
                }
            }
        }).catch(() => {});
    });

    const unsubLeaderboard = syncService.subscribeToGlobalLeaders(10, (leaders) => {
        bootController.execute({
            type: 'MUTATE_STATE',
            payload: {
                patch: () => {
                    useGameStore.getState().setLeaderboard(leaders);
                }
            }
        }).catch(() => {});
    });

    const unsubFriends = syncService.subscribeToFriendRequests(prefixedId, (requests) => {
        bootController.execute({
            type: 'MUTATE_STATE',
            payload: {
                patch: () => {
                    useGameStore.getState().setFriendRequests(requests);
                }
            }
        }).catch(() => {});
    });

    const unsubMail = syncService.subscribeToMail(prefixedId, (mails) => {
        bootController.execute({
            type: 'MUTATE_STATE',
            payload: {
                patch: () => {
                    useGameStore.getState().setMail(mails);
                }
            }
        }).catch(() => {});
    });

    const unsubPrivateChat = syncService.subscribeToPrivateMessages(prefixedId, (messages) => {
        bootController.execute({
            type: 'MUTATE_STATE',
            payload: {
                patch: () => {
                    useGameStore.getState().setPrivateMessages(messages);
                }
            }
        }).catch(() => {});
    });

    let lastAppliedAdminVersion: number | null = null;
    let lastClanId: string | null = null;

    const unsubProfile = syncService.subscribeToOwnProfile(userId, async (dbData) => {
        if (!dbData) return;

        // Session conflict check (multi-device concurrent session kick)
        const storeState = useGameStore.getState();
        const localSessionToken = storeState?.sessionToken;
        if (dbData.activeSessionToken && localSessionToken && dbData.activeSessionToken !== localSessionToken) {
            console.warn('[SyncService] Session conflict detected: activeSessionToken in DB is different!');
            bootController.execute({
                type: 'MUTATE_STATE',
                payload: {
                    patch: { sessionConflict: true }
                }
            }).catch(() => {});
            syncService.disableSync();
            return;
        }

        // Friends list dynamic sync check
        const dbFriendIds = dbData.friends || [];
        const localFriends = useGameStore.getState()?.friends || [];
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
            bootController.execute({
                type: 'MUTATE_STATE',
                payload: {
                    patch: { friends: merged }
                }
            }).catch(() => {});
            // Note: sync will be triggered by startAutoSync() after BootController reaches READY
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
                    bootController.execute({
                        type: 'MUTATE_STATE',
                        payload: {
                            patch: () => {
                                useGameStore.getState().setClanMessages(messages);
                            }
                        }
                    }).catch(() => {});
                });
            } else {
                bootController.execute({
                    type: 'MUTATE_STATE',
                    payload: {
                        patch: () => {
                            useGameStore.getState().setClanMessages([]);
                        }
                    }
                }).catch(() => {});
            }
        }

        if (dbData.status === 'BANNED') {
            bootController.execute({
                type: 'MUTATE_STATE',
                payload: {
                    patch: {
                        isBanned: true,
                        banReason: dbData.banReason || 'Нарушение правил игры',
                        banUntil: dbData.banUntil || '',
                    }
                }
            }).catch(() => {});
            return;
        } else {
            bootController.execute({
                type: 'MUTATE_STATE',
                payload: {
                    patch: { isBanned: false }
                }
            }).catch(() => {});
        }

        if (dbData.status === 'KICKED') {
            syncService.updateRemotePlayerData(userId, { status: 'OFFLINE' }).catch(() => {});
            bootController.execute({
                type: 'MUTATE_STATE',
                payload: {
                    patch: () => {
                        useGameStore
                            .getState()
                            .showAlert('Соединение разорвано: Вы были отключены администратором (KICKED).', () => {
                                window.location.reload();
                            });
                    }
                }
            }).catch(() => {});
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

                const parsed = await new Promise<any>((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            resolve(JSON.parse(fullStateStr));
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                });
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
                    bootController.execute({
                        type: 'MUTATE_STATE',
                        payload: {
                            patch: updatePayload
                        }
                    }).catch(() => {});
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
