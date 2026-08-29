/**
 * @owner: @Motaro900 / Frontend & Backend Team
 * @purpose: AdminService with zero Firebase dependencies.
 */

type TrackFn = (unsub: () => void) => () => void;

export async function getAllPlayers(): Promise<any[]> {
    try {
        const res = await fetch('/api/leaderboard/top?limit=50&isDev=true');
        if (res.ok) {
            const data = await res.json();
            return data.leaderboard || [];
        }
    } catch {}
    return [];
}

export function subscribeToAllPlayers(track: TrackFn, callback: (players: any[]) => void): () => void {
    getAllPlayers().then(callback);
    return track(() => {});
}

export async function sendFeedback(_data: any): Promise<void> {
    // Feedback handling
}

export async function deletePlayerDocument(_playerId: string): Promise<void> {
    // Admin command
}

export async function banPlayer(_playerId: string, _reason: string): Promise<void> {
    // Admin command
}

export async function unbanPlayer(_playerId: string): Promise<void> {
    // Admin command
}

export async function updatePlayerData(_playerId: string, _data: any): Promise<void> {
    // Admin command
}

export async function getAllFeedback(): Promise<any[]> {
    return [];
}

export async function deleteFeedback(_id: string): Promise<void> {}

export async function searchPlayerById(_id: string): Promise<any | null> {
    return null;
}

export async function searchPlayersGlobal(_query: string): Promise<any[]> {
    return [];
}

export async function getGlobalPlayers(_limitCount = 20): Promise<any[]> {
    return getAllPlayers();
}

export function subscribeToGlobalLeaders(track: TrackFn, _limitCount: number, callback: (leaders: any[]) => void): () => void {
    return subscribeToAllPlayers(track, callback);
}

export async function updateRemotePlayerData(playerId: string, data: any): Promise<void> {
    return updatePlayerData(playerId, data);
}

export async function sendBroadcastMail(_mailData: any): Promise<void> {}

export async function distributeSeasonRewards(): Promise<number> {
    return 0;
}
