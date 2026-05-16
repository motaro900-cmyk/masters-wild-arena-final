import { db } from '../utils/firebase';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    onSnapshot,
    deleteDoc,
    where,
} from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';
import { getVkUserInfo } from '../utils/VKBridge';

export class SyncService {
    private static instance: SyncService;
    private syncInterval: any = null;

    private constructor() {}

    public static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    /**
     * Синхронизирует текущее состояние игрока с Firebase
     */
    public async syncPlayerData(): Promise<void> {
        const state = useGameStore.getState();

        // Если пользователя нет в сторе, пробуем получить его из VK
        let vkUser = state.vkUser;
        if (!vkUser) {
            vkUser = await getVkUserInfo();
            if (vkUser) {
                state.setVkUser(vkUser);
            }
        }

        // Используем VK ID как основной ключ, если он есть, иначе - playerId
        const userId = vkUser ? String(vkUser.id) : state.playerId;

        if (!userId) {
            console.warn('[SyncService] No UserID found, skipping sync');
            return;
        }

        try {
            const playerRef = doc(db, 'пользователи', userId);

            const syncData = {
                id: userId,
                vkId: vkUser ? Number(vkUser.id) : 0,
                name: state.name || 'Мастер',
                photo: state.avatar || (vkUser ? vkUser.photo : ''),
                avatar: state.avatar, // Added explicit avatar field just in case
                лев: state.level || 1,
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                rating: state.rating || 0,
                lastSeen: serverTimestamp(),
                activeScreen: state.activeScreen || 'MAIN_MENU',
                // Можно добавить инвентарь и прочее, если нужно для админки
                геройСнаряжение: {
                    weapon: state.heroEquipment?.panda?.WEAPONS || '',
                    helm: state.heroEquipment?.panda?.HELMETS || '',
                    armor: state.heroEquipment?.panda?.ARMOR || '',
                    shield: state.heroEquipment?.panda?.SHIELDS || '',
                },
                инвентарь: state.inventory || [],
            };

            await setDoc(playerRef, syncData, { merge: true });
            console.log(`[SyncService] Data synced for player: ${syncData.name}`);
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
        }
    }

    /**
     * Запускает автоматическую периодическую синхронизацию
     */
    public startAutoSync(intervalMs: number = 60000): void {
        if (this.syncInterval) return;

        // Первая синхронизация сразу
        this.syncPlayerData();

        this.syncInterval = setInterval(() => {
            this.syncPlayerData();
        }, intervalMs);

        console.log(`[SyncService] Auto-sync started (every ${intervalMs / 1000}s)`);
    }

    public stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Получает список всех игроков из Firebase (для админ-панели)
     */
    public async getAllPlayers(): Promise<any[]> {
        try {
            const playersRef = collection(db, 'пользователи');
            const q = query(playersRef, orderBy('lastSeen', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
        } catch (error) {
            console.error('[SyncService] Failed to fetch players:', error);
            return [];
        }
    }

    /**
     * Удаленно обновляет данные игрока в Firebase (для админки)
     */
    public async updateRemotePlayerData(userId: string, data: any): Promise<void> {
        try {
            const playerRef = doc(db, 'пользователи', userId);
            await setDoc(playerRef, data, { merge: true });
            console.log(`[SyncService] Remote data updated for player: ${userId}`);
        } catch (error) {
            console.error('[SyncService] Remote update failed:', error);
            throw error;
        }
    }

    /**
     * Отправляет отзыв/баг-репорт в Firebase
     */
    public async sendFeedback(data: any): Promise<void> {
        try {
            const feedbackRef = doc(collection(db, 'отзывы'));
            await setDoc(feedbackRef, {
                ...data,
                serverTimestamp: serverTimestamp(),
            });
            console.log('[SyncService] Feedback sent successfully');
        } catch (error) {
            console.error('[SyncService] Failed to send feedback:', error);
            throw error;
        }
    }

    /**
     * Получает все отзывы для админ-панели
     */
    public async getAllFeedback(): Promise<any[]> {
        try {
            const feedbackRef = collection(db, 'отзывы');
            const q = query(feedbackRef, orderBy('timestamp', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
        } catch (error) {
            console.error('[SyncService] Failed to fetch feedback:', error);
            return [];
        }
    }

    /**
     * Ищет игрока по его ID в Firebase
     */
    public async searchPlayerById(playerId: string): Promise<any | null> {
        try {
            // Убираем префикс MW-, если он есть
            const id = playerId.toUpperCase().startsWith('MW-') ? playerId.substring(3) : playerId;
            const playerRef = doc(db, 'пользователи', id);
            const playerSnap = await getDoc(playerRef);

            if (playerSnap.exists()) {
                return {
                    id: playerSnap.id,
                    ...playerSnap.data(),
                };
            }
            return null;
        } catch (error) {
            console.error('[SyncService] Player search failed:', error);
            return null;
        }
    }

    /**
     * Возвращает список последних активных игроков (Глобальный чат/Мир)
     */
    public async getGlobalPlayers(limitCount: number = 20): Promise<any[]> {
        try {
            const playersRef = collection(db, 'пользователи');
            const q = query(playersRef, orderBy('lastSeen', 'desc'), limit(limitCount));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('[SyncService] Failed to get global players:', error);
            return [];
        }
    }

    /**
     * Отправляет запрос в друзья другому игроку
     */
    public async sendFriendRequest(targetId: string, senderData: any): Promise<boolean> {
        try {
            const requestsRef = collection(db, 'пользователи', targetId, 'запросы');
            const requestDoc = doc(requestsRef, senderData.id);
            await setDoc(requestDoc, {
                ...senderData,
                timestamp: Date.now(),
            });
            return true;
        } catch (error) {
            console.error('[SyncService] Failed to send friend request:', error);
            return false;
        }
    }

    /**
     * Подписывается на входящие запросы в друзья
     */
    public subscribeToFriendRequests(userId: string, callback: (requests: any[]) => void): () => void {
        const requestsRef = collection(db, 'пользователи', userId, 'запросы');

        return onSnapshot(
            requestsRef,
            (snapshot: any) => {
                const requests = snapshot.docs.map((doc: any) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                callback(requests);
            },
            (error: any) => {
                console.error('[SyncService] Requests subscription error:', error);
            },
        );
    }

    /**
     * Удаляет запрос в друзья
     */
    public async deleteFriendRequest(userId: string, requestId: string): Promise<void> {
        try {
            const requestRef = doc(db, 'пользователи', userId, 'запросы', requestId);
            await deleteDoc(requestRef);
        } catch (error) {
            console.error('[SyncService] Failed to delete friend request:', error);
        }
    }

    /**
     * Отправляет сообщение в глобальный чат Firebase
     */
    public async sendChatMessage(message: any): Promise<void> {
        try {
            const chatRef = doc(collection(db, 'чат'));
            await setDoc(chatRef, {
                ...message,
                serverTimestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('[SyncService] Failed to send chat message:', error);
        }
    }

    /**
     * Подписывается на обновления чата
     */
    public subscribeToChat(callback: (messages: any[]) => void): () => void {
        const chatRef = collection(db, 'чат');
        const q = query(chatRef, orderBy('serverTimestamp', 'desc'), limit(50));

        return onSnapshot(
            q,
            (snapshot: any) => {
                const messages = snapshot.docs
                    .map((doc: any) => ({
                        ...doc.data(),
                        id: doc.id,
                    }))
                    .reverse();
                callback(messages);
            },
            (error: any) => {
                console.error('[SyncService] Chat subscription error:', error);
            },
        );
    }

    /**
     * Отправляет письмо конкретному игроку
     */
    public async sendMail(userId: string, mailData: any): Promise<void> {
        try {
            const mailRef = doc(collection(db, 'пользователи', userId, 'почта'));
            await setDoc(mailRef, {
                ...mailData,
                timestamp: serverTimestamp(),
                isRead: false,
            });
            console.log(`[SyncService] Mail sent to ${userId}`);
        } catch (error) {
            console.error('[SyncService] Failed to send mail:', error);
            throw error;
        }
    }

    /**
     * Отправляет письмо всем игрокам (Broadcast)
     */
    public async sendBroadcastMail(mailData: any): Promise<void> {
        try {
            const players = await this.getAllPlayers();
            const promises = players.map((p) => this.sendMail(p.id, mailData));
            await Promise.all(promises);
            console.log(`[SyncService] Broadcast mail sent to ${players.length} players`);
        } catch (error) {
            console.error('[SyncService] Broadcast mail failed:', error);
            throw error;
        }
    }

    /**
     * Подписывается на входящую почту игрока
     */
    public subscribeToMail(userId: string, callback: (mails: any[]) => void): () => void {
        const mailRef = collection(db, 'пользователи', userId, 'почта');
        const q = query(mailRef, orderBy('timestamp', 'desc'), limit(50));

        return onSnapshot(
            q,
            (snapshot: any) => {
                const mails = snapshot.docs.map((doc: any) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                callback(mails);
            },
            (error: any) => {
                console.error('[SyncService] Mail subscription error:', error);
            },
        );
    }

    /**
     * Проверяет, свободно ли имя (никнейм) в базе данных
     */
    public async isNicknameUnique(name: string): Promise<boolean> {
        try {
            const playersRef = collection(db, 'пользователи');
            // Ищем точное совпадение имени
            const q = query(playersRef, where('name', '==', name));
            const snapshot = await getDocs(q);
            return snapshot.empty;
        } catch (error) {
            console.error('[SyncService] Nickname uniqueness check failed:', error);
            return true; // В случае ошибки разрешаем, чтобы не блокировать вход
        }
    }
}

export const syncService = SyncService.getInstance();
