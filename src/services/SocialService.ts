/**
 * SocialService — запросы в друзья, профили друзей, ник-проверка
 */
import { db, USERS_COLLECTION } from '../utils/firebase';
import { doc, setDoc, deleteDoc, getDocs, collection, query, where, onSnapshot } from 'firebase/firestore';

type TrackFn = (unsub: () => void) => () => void;

export async function sendFriendRequest(targetId: string, senderData: any): Promise<boolean> {
    try {
        const requestsRef = collection(db, USERS_COLLECTION, targetId, 'запросы');
        const requestDoc = doc(requestsRef, senderData.id);
        await setDoc(requestDoc, { ...senderData, timestamp: Date.now() });
        return true;
    } catch (error) {
        console.error('[SocialService] Failed to send friend request:', error);
        return false;
    }
}

export function subscribeToFriendRequests(
    track: TrackFn,
    userId: string,
    callback: (requests: any[]) => void,
): () => void {
    const requestsRef = collection(db, USERS_COLLECTION, userId, 'запросы');
    return track(
        onSnapshot(
            requestsRef,
            (snapshot: any) => {
                callback(snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id })));
            },
            (error: any) => console.error('[SocialService] Friend requests subscription error:', error),
        ),
    );
}

export async function deleteFriendRequest(userId: string, requestId: string): Promise<void> {
    try {
        const requestRef = doc(db, USERS_COLLECTION, userId, 'запросы', requestId);
        await deleteDoc(requestRef);
    } catch (error) {
        console.error('[SocialService] Failed to delete friend request:', error);
    }
}

export function subscribeToOwnProfile(track: TrackFn, userId: string, callback: (data: any) => void): () => void {
    const playerRef = doc(db, USERS_COLLECTION, userId);
    return track(
        onSnapshot(
            playerRef,
            (snapshot: any) => {
                if (snapshot.exists()) callback(snapshot.data());
            },
            (error: any) => console.error('[SocialService] Own profile subscription error:', error),
        ),
    );
}

export async function isNicknameUnique(name: string, currentUserId?: string, guestUserId?: string): Promise<boolean> {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const qName = query(playersRef, where('name', '==', name));
        const snapName = await getDocs(qName);

        let docs = [...snapName.docs];
        if (snapName.empty) {
            const qLegacy = query(playersRef, where('имя', '==', name));
            const snapLegacy = await getDocs(qLegacy);
            docs = [...snapLegacy.docs];
        }

        if (docs.length === 0) return true;

        if (currentUserId || guestUserId) {
            const matchesCurrentUser = docs.some(
                (d) => d.id === currentUserId || (guestUserId && d.id === guestUserId),
            );
            if (matchesCurrentUser) return true;
        }
        return false;
    } catch (error) {
        console.error('[SocialService] Nickname uniqueness check failed:', error);
        return true;
    }
}

export async function getPlayerIdByName(name: string): Promise<string | null> {
    try {
        const playersRef = collection(db, USERS_COLLECTION);
        const snap = await getDocs(query(playersRef, where('name', '==', name)));
        if (!snap.empty) return snap.docs[0].id;
        const snapLegacy = await getDocs(query(playersRef, where('имя', '==', name)));
        if (!snapLegacy.empty) return snapLegacy.docs[0].id;
        return null;
    } catch (error) {
        console.error('[SocialService] Failed to find player by name:', error);
        return null;
    }
}

export async function resolveFriendProfiles(friendIds: string[]): Promise<any[]> {
    if (!friendIds || friendIds.length === 0) return [];
    try {
        const sanitizedIds = friendIds.map((id: any) => (typeof id === 'object' ? id.id : id)).filter(Boolean);

        const chunks: string[][] = [];
        for (let i = 0; i < sanitizedIds.length; i += 10) {
            chunks.push(sanitizedIds.slice(i, i + 10));
        }

        const querySnapshots = await Promise.all(
            chunks.map((chunk) => getDocs(query(collection(db, USERS_COLLECTION), where('__name__', 'in', chunk)))),
        );

        const profiles: any[] = [];
        for (const snap of querySnapshots) {
            snap.forEach((docSnap) => {
                const data = docSnap.data();
                const wasOnlineVal = data.wasOnline || data.былВСети;
                const lastSeenTime = wasOnlineVal?.toMillis ? wasOnlineVal.toMillis() : wasOnlineVal || 0;

                profiles.push({
                    id: docSnap.id,
                    name: data.name || data.имя || `Игрок_${docSnap.id.slice(-4)}`,
                    avatar: data.avatar || data.фото || 'avatar_1.png',
                    level: data.level || data.уровень || 1,
                    online: Date.now() - lastSeenTime < 5 * 60 * 1000,
                    lastSeen: lastSeenTime,
                    rating: data.rating ?? data.рейтинг ?? 0,
                    trophies: data.rating ?? data.рейтинг ?? 0,
                    vipLevel: data.vipLevel ?? 0,
                });
            });
        }
        return profiles;
    } catch (error) {
        console.error('[SocialService] Failed to resolve friend profiles:', error);
        return [];
    }
}
