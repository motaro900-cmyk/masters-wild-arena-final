/**
 * ChatService — обработка всех чатов (глобальный, личные, клановый)
 * Не содержит бизнес-логики синхронизации профиля.
 */
import { db, CHAT_COLLECTION, USERS_COLLECTION } from '../utils/firebase';
import {
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';

type TrackFn = (unsub: () => void) => () => void;

export async function sendChatMessage(message: any): Promise<void> {
    try {
        const chatRef = doc(collection(db, CHAT_COLLECTION));
        await setDoc(chatRef, { ...message, serverTimestamp: serverTimestamp() });
    } catch (error) {
        console.error('[ChatService] Failed to send chat message:', error);
    }
}

export async function deletePlayerMessages(playerName: string): Promise<void> {
    try {
        const chatRef = collection(db, CHAT_COLLECTION);
        const q = query(chatRef, where('author', '==', playerName));
        const snapshot = await getDocs(q);
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
        console.log(`[ChatService] Deleted ${snapshot.docs.length} messages for ${playerName}`);
    } catch (error) {
        console.error('[ChatService] Failed to delete player messages:', error);
    }
}

export async function wipeGlobalChat(): Promise<void> {
    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:');
    if (!isLocalhost) {
        console.error('[ChatService] Unauthorized attempt to wipe global chat. Wiping chat is only allowed on localhost.');
        return;
    }
    try {
        const chatRef = collection(db, CHAT_COLLECTION);
        const snapshot = await getDocs(chatRef);
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
        console.log(`[ChatService] Wiped ${snapshot.docs.length} messages.`);
    } catch (error) {
        console.error('[ChatService] Failed to wipe global chat:', error);
    }
}

export function subscribeToChat(track: TrackFn, callback: (messages: any[]) => void): () => void {
    const chatRef = collection(db, CHAT_COLLECTION);
    const q = query(chatRef, orderBy('serverTimestamp', 'desc'), limit(50));
    return track(
        onSnapshot(
            q,
            (snapshot: any) => {
                const messages = snapshot.docs
                    .map((d: any) => ({ ...d.data(), id: d.id }))
                    .reverse();
                callback(messages);
            },
            (error: any) => console.error('[ChatService] Chat subscription error:', error),
        ),
    );
}

export async function sendPrivateMessage(
    senderId: string,
    recipientId: string,
    message: any,
): Promise<void> {
    try {
        const senderRef = doc(collection(db, USERS_COLLECTION, senderId, 'личные_сообщения'));
        const msgId = senderRef.id;
        const payload = { ...message, id: msgId, serverTimestamp: serverTimestamp() };
        await setDoc(senderRef, payload);
        if (senderId !== recipientId) {
            const recipientRef = doc(
                db,
                USERS_COLLECTION,
                recipientId,
                'личные_сообщения',
                msgId,
            );
            await setDoc(recipientRef, payload);
        }
    } catch (error) {
        console.error('[ChatService] Failed to send private message:', error);
        throw error;
    }
}

export function subscribeToPrivateMessages(
    track: TrackFn,
    userId: string,
    callback: (messages: any[]) => void,
): () => void {
    const ref = collection(db, USERS_COLLECTION, userId, 'личные_сообщения');
    const q = query(ref, orderBy('serverTimestamp', 'desc'), limit(50));
    return track(
        onSnapshot(
            q,
            (snapshot: any) => {
                callback(snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id })).reverse());
            },
            (error: any) => console.error('[ChatService] Private chat subscription error:', error),
        ),
    );
}

export function subscribeToClanChat(
    track: TrackFn,
    clanId: string,
    callback: (messages: any[]) => void,
): () => void {
    const ref = collection(db, CHAT_COLLECTION);
    const q = query(ref, where('clanId', '==', clanId));
    return track(
        onSnapshot(
            q,
            (snapshot: any) => {
                callback(
                    snapshot.docs
                        .map((d: any) => ({ ...d.data(), id: d.id }))
                        .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)),
                );
            },
            (error: any) => console.error('[ChatService] Clan chat subscription error:', error),
        ),
    );
}
