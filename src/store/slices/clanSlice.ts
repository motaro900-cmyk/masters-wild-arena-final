import { db, USERS_COLLECTION } from '../../utils/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { syncService, SyncService } from '../../services/SyncService';

export const createClanSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ КЛАНОВ И ДРУЗЕЙ ---
    friends: [] as any[],
    friendRequests: [] as any[],
    friendNotes: {} as Record<string, string>,
    clanId: null as string | null,
    clanData: null as any,
    clanCoins: 0,

    // --- ЭКШЕНЫ КЛАНОВ И ДРУЗЕЙ ---
    setFriendRequests: (requests: any[]) => set({ friendRequests: requests }),
    setFriendNote: (friendId: string, note: string) => {
        set((state: any) => {
            const newNotes = { ...(state.friendNotes || {}), [friendId]: note };
            return { friendNotes: newNotes };
        });
        syncService.debouncedSync();
    },

    removeFriend: async (id: string) => {
        const state = get();
        const currentUserId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
        let targetId = id;
        if (!targetId.startsWith('VK-') && !targetId.startsWith('GUEST-') && targetId !== 'DEVELOPER') {
            targetId = SyncService.getPrefixedUserId(null, targetId);
        }

        try {
            // 1. Удаляем из списка друзей текущего игрока в Firestore
            const currentUserDoc = doc(db, USERS_COLLECTION, currentUserId);
            await updateDoc(currentUserDoc, {
                friends: arrayRemove(targetId),
            });

            // 2. Удаляем из списка друзей удаляемого игрока в Firestore
            const targetDocRef = doc(db, USERS_COLLECTION, targetId);
            await updateDoc(targetDocRef, {
                friends: arrayRemove(currentUserId),
            });
        } catch (error) {
            console.error('[clanSlice] Failed to remove friend in Firestore:', error);
        }

        set((state: any) => ({
            friends: state.friends.filter((f: any) => f.id !== id && f.id !== targetId),
        }));
    },

    acceptFriendRequest: async (id: string) => {
        const state = get();
        const request = state.friendRequests.find((r: any) => r.id === id);
        if (!request) return;

        const currentUserId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
        let senderId = id;
        if (!senderId.startsWith('VK-') && !senderId.startsWith('GUEST-') && senderId !== 'DEVELOPER') {
            senderId = SyncService.getPrefixedUserId(null, senderId);
        }

        try {
            // 1. Добавляем senderId в список друзей текущего игрока в Firestore
            const currentUserDoc = doc(db, USERS_COLLECTION, currentUserId);
            await updateDoc(currentUserDoc, {
                friends: arrayUnion(senderId),
            });

            // 2. Добавляем текущего игрока в список друзей отправителя
            const senderDocRef = doc(db, USERS_COLLECTION, senderId);
            await updateDoc(senderDocRef, {
                friends: arrayUnion(currentUserId),
            });

            // 3. Удаляем запрос после обоих обновлений
            await syncService.deleteFriendRequest(currentUserId, id);
        } catch (error) {
            console.error('[clanSlice] Failed to accept friend request in Firestore:', error);
        }

        const updatedRequest = { ...request, id: senderId };
        set((state: any) => ({
            friends: [...state.friends, updatedRequest],
            friendRequests: state.friendRequests.filter((r: any) => r.id !== id),
        }));
    },

    declineFriendRequest: (id: string) => {
        const state = get();
        const currentUserId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
        syncService.deleteFriendRequest(currentUserId, id);
        set((state: any) => ({
            friendRequests: state.friendRequests.filter((r: any) => r.id !== id),
        }));
    },

    sendGift: (friendId: string) =>
        set((state: any) => {
            if (get().updateQuestProgress) {
                get().updateQuestProgress('SEND_GIFT', 1);
            }
            return {
                friends: state.friends.map((f: any) => (f.id === friendId ? { ...f, giftSent: true } : f)),
            };
        }),

    collectAllGifts: () =>
        set((state: any) => {
            const hasGifts = state.friends.some((f: any) => f.hasGift);
            if (!hasGifts) return state;
            return {
                friends: state.friends.map((f: any) => ({ ...f, hasGift: false, giftSent: true })),
                gold: state.gold + state.friends.filter((f: any) => f.hasGift).length * 100,
            };
        }),

    addFriend: (friend: any) =>
        set((state: any) => ({
            friends: [...state.friends, friend],
            friendRequests: state.friendRequests.filter((r: any) => r.id !== friend.id),
        })),

    addClanCoins: (amount: number) => set((state: any) => ({ clanCoins: state.clanCoins + amount })),
    joinClan: (id: string, data: any) => {
        set({ clanId: id, clanData: data });
        syncService.debouncedSync();
    },
    leaveClan: () => {
        set({ clanId: null, clanData: null });
        syncService.debouncedSync();
    },
});
