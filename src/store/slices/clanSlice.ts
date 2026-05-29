import { syncService } from '../../services/SyncService';

export const createClanSlice = (set: any, get: any) => ({
    // --- СОСТОЯНИЕ КЛАНОВ И ДРУЗЕЙ ---
    friends: [] as any[],
    friendRequests: [] as any[],
    clanId: null as string | null,
    clanData: null as any,
    clanCoins: 0,

    // --- ЭКШЕНЫ КЛАНОВ И ДРУЗЕЙ ---
    setFriendRequests: (requests: any[]) => set({ friendRequests: requests }),

    removeFriend: (id: string) =>
        set((state: any) => ({
            friends: state.friends.filter((f: any) => f.id !== id),
        })),

    acceptFriendRequest: (id: string) => {
        const state = get();
        const request = state.friendRequests.find((r: any) => r.id === id);
        if (!request) return;

        syncService.deleteFriendRequest(state.playerId, id);

        set((state: any) => ({
            friends: [...state.friends, request],
            friendRequests: state.friendRequests.filter((r: any) => r.id !== id),
        }));
    },

    declineFriendRequest: (id: string) => {
        syncService.deleteFriendRequest(get().playerId, id);
        set((state: any) => ({
            friendRequests: state.friendRequests.filter((r: any) => r.id !== id),
        }));
    },

    sendGift: (friendId: string) =>
        set((state: any) => ({
            friends: state.friends.map((f: any) => (f.id === friendId ? { ...f, giftSent: true } : f)),
        })),

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
    joinClan: (id: string, data: any) => set({ clanId: id, clanData: data }),
    leaveClan: () => set({ clanId: null, clanData: null }),
});
