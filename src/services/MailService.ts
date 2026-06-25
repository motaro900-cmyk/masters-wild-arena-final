/**
 * MailService — работа с почтой игроков (отправка, обновление, подписки)
 */
import { db, USERS_COLLECTION } from '../utils/firebase';
import { doc, setDoc, deleteDoc, collection, query, orderBy, limit, onSnapshot, writeBatch } from 'firebase/firestore';

type TrackFn = (unsub: () => void) => () => void;

export async function sendMail(userId: string, mailData: any): Promise<void> {
    try {
        const mailCollection = collection(db, USERS_COLLECTION, userId, 'почта');
        const mailRef = mailData.id ? doc(mailCollection, mailData.id) : doc(mailCollection);
        await setDoc(mailRef, {
            ...mailData,
            id: mailRef.id,
            timestamp: mailData.timestamp || Date.now(),
        });
    } catch (error) {
        console.error('[MailService] Failed to send mail:', error);
        throw error;
    }
}

export async function updateMail(userId: string, mailId: string, updates: Partial<any>): Promise<void> {
    try {
        const mailRef = doc(db, USERS_COLLECTION, userId, 'почта', mailId);
        await setDoc(mailRef, updates, { merge: true });
    } catch (error) {
        console.error('[MailService] Failed to update mail:', error);
        throw error;
    }
}

export async function deleteMail(userId: string, mailId: string): Promise<void> {
    try {
        const mailRef = doc(db, USERS_COLLECTION, userId, 'почта', mailId);
        await deleteDoc(mailRef);
    } catch (error) {
        console.error('[MailService] Failed to delete mail:', error);
        throw error;
    }
}

export async function updateMultipleMails(userId: string, mailIds: string[], updates: Partial<any>): Promise<void> {
    try {
        const batch = writeBatch(db);
        mailIds.forEach((mailId) => {
            const mailRef = doc(db, USERS_COLLECTION, userId, 'почта', mailId);
            batch.set(mailRef, updates, { merge: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('[MailService] Failed to update multiple mails:', error);
        throw error;
    }
}

export function subscribeToMail(track: TrackFn, userId: string, callback: (mails: any[]) => void): () => void {
    const mailRef = collection(db, USERS_COLLECTION, userId, 'почта');
    const q = query(mailRef, orderBy('timestamp', 'desc'), limit(50));
    return track(
        onSnapshot(
            q,
            (snapshot: any) => {
                callback(snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id })));
            },
            (error: any) => console.error('[MailService] Mail subscription error:', error),
        ),
    );
}
