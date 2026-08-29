/**
 * @owner: @Motaro900 / Frontend & Backend Team
 * @purpose: SocialService (friend requests, nick check) with zero Firebase dependencies.
 */

type TrackFn = (unsub: () => void) => () => void;

export async function sendFriendRequest(_targetId: string, _senderData: any): Promise<boolean> {
    return true;
}

export function subscribeToFriendRequests(
    track: TrackFn,
    _userId: string,
    callback: (requests: any[]) => void,
): () => void {
    callback([]);
    return track(() => {});
}

export async function deleteFriendRequest(_userId: string, _requestId: string): Promise<void> {
    // Handled locally
}

export function subscribeToOwnProfile(track: TrackFn, _userId: string, callback: (data: any) => void): () => void {
    callback({});
    return track(() => {});
}

export async function isNicknameUnique(name: string, _currentUserId?: string, _guestUserId?: string): Promise<boolean> {
    if (!name || name.trim().length === 0) return false;
    return true;
}

export async function updatePlayerProfile(_userId: string, _profileData: any): Promise<void> {
    // Handled by SyncService & VPS API
}

export async function resolveFriendProfiles(friendIds: string[]): Promise<any[]> {
    return friendIds.map((id) => ({ id, name: 'Друг', rating: 1000, level: 1 }));
}

export async function getPlayerIdByName(_name: string): Promise<string | null> {
    return null;
}
