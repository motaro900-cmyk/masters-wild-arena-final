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
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private writeChain: Promise<any> = Promise.resolve();

    private constructor() {}

    public static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    public static getPrefixedUserId(vkUser: any, playerId: string): string {
        if (vkUser) {
            return `VK-${vkUser.id}`;
        }
        if (playerId === 'DEVELOPER') {
            return 'DEVELOPER';
        }
        if (playerId && playerId.startsWith('GUEST-')) {
            return playerId;
        }
        const cleanGuest = playerId
            ? playerId.replace(/^MW-/, '')
            : Math.random().toString(36).substring(2, 11).toUpperCase();
        return `GUEST-${cleanGuest}`;
    }

    /**
     * Синхронизирует текущее состояние игрока с Firebase (в порядке очереди)
     */
    public async syncPlayerData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.writeChain = this.writeChain
                .then(async () => {
                    try {
                        await this.performSync();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .catch(() => {
                    // Предотвращаем прерывание очереди
                });
        });
    }

    private async performSync(): Promise<void> {
        const state = useGameStore.getState();

        // Если пользователя нет в сторе, пробуем получить его из VK
        let vkUser = state.vkUser;
        if (!vkUser) {
            vkUser = await getVkUserInfo();
            if (vkUser) {
                state.setVkUser(vkUser);
                // Если аватар дефолтный (спрайт), ставим фото из ВК
                if (vkUser.photo && (state.avatar === 'sprite:sprite-avatar avatar-pos-1' || !state.avatar)) {
                    if (state.updateProfile) {
                        state.updateProfile({ avatar: vkUser.photo });
                    }
                }
            }
        }

        // Используем VK-ID или GUEST-ID как основной ключ
        const userId = SyncService.getPrefixedUserId(vkUser, state.playerId);

        if (!userId) {
            console.warn('[SyncService] No UserID found, skipping sync');
            return;
        }

        try {
            const playerRef = doc(db, 'пользователи', userId);

            const selectedHeroId = state.selectedHeroId || 'panda';
            const fullState = {
                level: state.level,
                vipLevel: state.vipLevel,
                vipExp: state.vipExp,
                exp: state.exp,
                gold: state.gold,
                crystals: state.crystals,
                shards: state.shards,
                rating: state.rating,
                energy: state.energy,
                maxEnergy: state.maxEnergy,
                lastEnergyUpdate: state.lastEnergyUpdate,
                vipEndTime: state.vipEndTime,
                dailyAdWatchesCount: state.dailyAdWatchesCount,
                name: state.name,
                lastNameChange: state.lastNameChange,
                avatar: state.avatar,
                frame: state.frame,
                title: state.title,
                bpLevel: state.bpLevel,
                bpExp: state.bpExp,
                trophies: state.trophies,
                wins: state.wins,
                totalBattles: state.totalBattles,
                claimedSocialRewards: state.claimedSocialRewards,
                ownedSkins: state.ownedSkins,
                equippedSkins: state.equippedSkins,
                usedPromoCodes: state.usedPromoCodes,
                pveStage: state.pveStage,
                maxPveStage: state.maxPveStage,
                winStreak: state.winStreak,
                onboardingCompleted: state.onboardingCompleted,
                friends: state.friends,
                clanId: state.clanId,
                clanCoins: state.clanCoins,
                heroes: state.heroes,
                heroTalents: state.heroTalents,
                pet: state.pet,
                petCharges: state.petCharges,
                lastPetTime: state.lastPetTime,
                inventory: state.inventory,
                heroEquipment: state.heroEquipment,
                selectedHeroId: state.selectedHeroId,
                ownedHeroes: state.ownedHeroes,
                claimedRewards: state.claimedRewards,
                coal: state.coal,
                steel_bars: state.steel_bars,
                runic_shards: state.runic_shards,
                ancient_compass: state.ancient_compass,
                astral_crystal: state.astral_crystal,
                void_sphere: state.void_sphere,
                golden_sprout: state.golden_sprout,
                dragon_scale: state.dragon_scale,
                lava_heart: state.lava_heart,
                protection_stones: state.protection_stones,
                shopRotation: state.shopRotation,
                shopDiscounts: state.shopDiscounts,
                shopLastRefreshTime: state.shopLastRefreshTime,
                lastWheelSpinTime: state.lastWheelSpinTime,
                activeBuffs: state.activeBuffs || {},
                dailyQuests: state.dailyQuests,
                weeklyQuests: state.weeklyQuests,
                lastDailyRefresh: state.lastDailyRefresh,
                lastWeeklyRefresh: state.lastWeeklyRefresh,
            };

            const isLocalhost =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:');

            const vipEndTime = state.vipEndTime || 0;
            const isVipActive = state.vipLevel > 0 && vipEndTime > Date.now();
            const vipDaysRemaining = isVipActive ? Math.ceil((vipEndTime - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

            const syncData = {
                id: userId,
                vkId: vkUser ? Number(vkUser.id) : 0,
                name: state.name || 'Мастер',
                vkFirstName: vkUser ? vkUser.first_name || vkUser.firstName || '' : '',
                vkLastName: vkUser ? vkUser.last_name || vkUser.lastName || '' : '',
                vkLink: vkUser ? `https://vk.com/id${vkUser.id}` : '',
                level: state.level || 1,
                gold: state.gold || 0,
                crystals: state.crystals || 0,
                rating: state.rating || 0,
                wasOnline: serverTimestamp(),
                activeScreen: state.activeScreen || 'MAIN_MENU',
                hero: selectedHeroId,
                avatar: state.avatar || (vkUser ? vkUser.photo200 || vkUser.photo || '' : ''),
                equipment: {
                    WEAPONS: state.heroEquipment?.[selectedHeroId]?.WEAPONS || null,
                    HELMETS: state.heroEquipment?.[selectedHeroId]?.HELMETS || null,
                    ARMOR: state.heroEquipment?.[selectedHeroId]?.ARMOR || null,
                    SHIELDS: state.heroEquipment?.[selectedHeroId]?.SHIELDS || null,
                    SHOULDERS: state.heroEquipment?.[selectedHeroId]?.SHOULDERS || null,
                    PANTS: state.heroEquipment?.[selectedHeroId]?.PANTS || null,
                    BOOTS: state.heroEquipment?.[selectedHeroId]?.BOOTS || null,
                },
                inventory: state.inventory || [],
                fullStateJSON: JSON.stringify(fullState),
                isTestPlayer: isLocalhost || state.name === 'Разработчик' || state.name?.toLowerCase().includes('test'),
                isDeveloper: isLocalhost || state.name === 'Разработчик',
                vipLevel: state.vipLevel || 0,
                isVipActive,
                vipDaysRemaining,
                energy: state.energy || 0,
                maxEnergy: state.maxEnergy || 0,
            };

            await setDoc(playerRef, syncData, { merge: true });
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            throw error;
        }
    }

    public debouncedSync(delay = 2000): void {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        this.syncTimeout = setTimeout(() => {
            this.syncPlayerData();
            this.syncTimeout = null;
        }, delay);
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
            const q = query(playersRef, orderBy('былВСети', 'desc'), limit(100));
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
     * Подписывается на список всех игроков в реальном времени (для админ-панели)
     */
    public subscribeToAllPlayers(callback: (players: any[]) => void): () => void {
        try {
            const playersRef = collection(db, 'пользователи');
            const q = query(playersRef, orderBy('былВСети', 'desc'), limit(100));

            return onSnapshot(
                q,
                (snapshot: any) => {
                    const players = snapshot.docs.map((doc: any) => ({
                        ...doc.data(),
                        id: doc.id,
                    }));
                    callback(players);
                },
                (error: any) => {
                    console.error('[SyncService] All players subscription error:', error);
                },
            );
        } catch (error) {
            console.error('[SyncService] Failed to set up all players subscription:', error);
            return () => {};
        }
    }

    /**
     * Удаленно обновляет данные игрока в Firebase (для админки)
     */
    public async updateRemotePlayerData(userId: string, data: any): Promise<void> {
        try {
            const playerRef = doc(db, 'пользователи', userId);
            const playerSnap = await getDoc(playerRef);

            const mapping: Record<string, string> = {
                gold: 'золото',
                crystals: 'кристаллы',
                level: 'уровень',
                rating: 'рейтинг',
                avatar: 'фото',
                inventory: 'инвентарь',
                heroEquipment: 'снаряжение',
            };

            const updatedData: any = {};
            for (const key in data) {
                const mappedKey = mapping[key] || key;
                updatedData[mappedKey] = data[key];
            }

            if (playerSnap.exists()) {
                const docData = playerSnap.data();
                const currentAdminVersion = Number(docData.adminVersion || 0);
                updatedData.adminVersion = currentAdminVersion + 1;

                const fullStateStr = docData.fullStateJSON || docData.полноеСостояниеJSON;
                if (fullStateStr) {
                    try {
                        const parsed = JSON.parse(fullStateStr);

                        // Map fields to Zustand state keys in parsed JSON
                        if (data.золото !== undefined || data.gold !== undefined) {
                            parsed.gold = Number(data.золото !== undefined ? data.золото : data.gold);
                        }
                        if (data.кристаллы !== undefined || data.crystals !== undefined) {
                            parsed.crystals = Number(data.кристаллы !== undefined ? data.кристаллы : data.crystals);
                        }
                        if (data.уровень !== undefined || data.level !== undefined) {
                            parsed.level = Number(data.уровень !== undefined ? data.уровень : data.level);
                        }
                        if (data.рейтинг !== undefined || data.rating !== undefined) {
                            const val = Number(data.рейтинг !== undefined ? data.рейтинг : data.rating);
                            parsed.rating = val;
                            parsed.trophies = val;
                        }
                        if (data.инвентарь !== undefined || data.inventory !== undefined) {
                            parsed.inventory = data.инвентарь !== undefined ? data.инвентарь : data.inventory;
                        }
                        if (data.снаряжение !== undefined || data.heroEquipment !== undefined) {
                            parsed.heroEquipment = data.снаряжение !== undefined ? data.снаряжение : data.heroEquipment;
                        }
                        if (data.ownedSkins !== undefined) {
                            parsed.ownedSkins = data.ownedSkins;
                        }
                        if (data.ownedHeroes !== undefined) {
                            parsed.ownedHeroes = data.ownedHeroes;
                        }

                        updatedData.fullStateJSON = JSON.stringify(parsed);
                    } catch (e) {
                        console.error('[SyncService] Failed to parse fullStateJSON during remote update:', e);
                    }
                }
            } else {
                updatedData.adminVersion = 1;
            }

            await setDoc(playerRef, updatedData, { merge: true });
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
            let id = playerId.trim();
            if (id.toUpperCase().startsWith('MW-')) {
                id = id.substring(3);
            }

            // Пробуем найти напрямую (например, VK-12345 или GUEST-XYZ)
            let playerRef = doc(db, 'пользователи', id);
            let playerSnap = await getDoc(playerRef);

            // Если не нашли и ID не содержит префиксов, пробуем добавить GUEST- или ГОСТЬ-
            if (!playerSnap.exists() && !id.startsWith('VK-') && !id.startsWith('GUEST-') && !id.startsWith('ГОСТЬ-')) {
                playerRef = doc(db, 'пользователи', `GUEST-${id}`);
                playerSnap = await getDoc(playerRef);

                if (!playerSnap.exists()) {
                    playerRef = doc(db, 'пользователи', `ГОСТЬ-${id}`);
                    playerSnap = await getDoc(playerRef);
                }
            }

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
            // Запрашиваем чуть больше игроков с запасом, чтобы отфильтровать тестовые аккаунты
            const q = query(playersRef, orderBy('былВСети', 'desc'), limit(limitCount + 15));
            const snapshot = await getDocs(q);
            const rawPlayers = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return rawPlayers
                .filter((p: any) => {
                    const name = p.имя || p.name || '';
                    const lowerName = name.toLowerCase();
                    if (['мастер', 'разработчик', 'test'].some((w) => lowerName.includes(w))) {
                        return false;
                    }
                    if (p.тестовый || p.разработчик) {
                        return false;
                    }
                    return true;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error('[SyncService] Failed to get global players:', error);
            return [];
        }
    }

    /**
     * Подписывается на топ игроков по рейтингу (кубкам) в реальном времени
     */
    public subscribeToGlobalLeaders(limitCount: number = 50, callback: (leaders: any[]) => void): () => void {
        try {
            const playersRef = collection(db, 'пользователи');
            const q = query(playersRef, orderBy('рейтинг', 'desc'), limit(limitCount + 15));

            return onSnapshot(
                q,
                (snapshot: any) => {
                    const rawPlayers = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    const filtered = rawPlayers
                        .filter((p: any) => {
                            const name = p.имя || p.name || '';
                            const lowerName = name.toLowerCase();
                            if (['мастер', 'разработчик', 'test'].some((w) => lowerName.includes(w))) {
                                return false;
                            }
                            if (p.тестовый || p.разработчик) {
                                return false;
                            }
                            return true;
                        })
                        .slice(0, limitCount);

                    callback(filtered);
                },
                (error: any) => {
                    console.error('[SyncService] Global leaders subscription error:', error);
                },
            );
        } catch (error) {
            console.error('[SyncService] Failed to set up global leaders subscription:', error);
            return () => {};
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
     * Удаляет сообщения конкретного игрока из чата (для сброса прогресса)
     */
    public async deletePlayerMessages(playerName: string): Promise<void> {
        try {
            const chatRef = collection(db, 'чат');
            const q = query(chatRef, where('author', '==', playerName));
            const snapshot = await getDocs(q);
            const promises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
            await Promise.all(promises);
            console.log(`[SyncService] Deleted ${snapshot.docs.length} messages for player ${playerName}`);
        } catch (error) {
            console.error('[SyncService] Failed to delete player messages:', error);
        }
    }

    /**
     * ПОЛНОСТЬЮ ОЧИЩАЕТ ГЛОБАЛЬНЫЙ ЧАТ (Админская функция)
     */
    public async wipeGlobalChat(): Promise<void> {
        try {
            const chatRef = collection(db, 'чат');
            const snapshot = await getDocs(chatRef);
            const promises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
            await Promise.all(promises);
            console.log(`[SyncService] Wiped ${snapshot.docs.length} messages from global chat.`);
        } catch (error) {
            console.error('[SyncService] Failed to wipe global chat:', error);
        }
    }

    /**
     * ПОЛНОСТЬЮ ОЧИЩАЕТ КОЛЛЕКЦИИ пользователей, чата и отзывов в Firestore (БЕТА-ВАЙП)
     */
    public async wipeAllFirestoreCollections(): Promise<void> {
        try {
            console.log('[SyncService] Starting full database wipe (Beta Wipe)...');

            // 1. Wipe chat
            await this.wipeGlobalChat();

            // 2. Wipe отзывы
            const feedbackRef = collection(db, 'отзывы');
            const feedbackSnap = await getDocs(feedbackRef);
            const feedbackPromises = feedbackSnap.docs.map((doc) => deleteDoc(doc.ref));
            await Promise.all(feedbackPromises);
            console.log(`[SyncService] Wiped ${feedbackSnap.docs.length} feedback documents.`);

            // 3. Wipe пользователи
            const playersRef = collection(db, 'пользователи');
            const playersSnap = await getDocs(playersRef);

            for (const playerDoc of playersSnap.docs) {
                const userId = playerDoc.id;

                // Delete "запросы" subcollection
                const requestsRef = collection(db, 'пользователи', userId, 'запросы');
                const requestsSnap = await getDocs(requestsRef);
                const requestsPromises = requestsSnap.docs.map((d) => deleteDoc(d.ref));
                await Promise.all(requestsPromises);

                // Delete "почта" subcollection
                const mailRef = collection(db, 'пользователи', userId, 'почта');
                const mailSnap = await getDocs(mailRef);
                const mailPromises = mailSnap.docs.map((d) => deleteDoc(d.ref));
                await Promise.all(mailPromises);

                // Delete the parent user doc
                await deleteDoc(playerDoc.ref);
            }
            console.log(`[SyncService] Wiped ${playersSnap.docs.length} player accounts and their subcollections.`);
            console.log('[SyncService] Full database wipe completed successfully.');
        } catch (error) {
            console.error('[SyncService] Failed to wipe database:', error);
            throw error;
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
     * Подписывается на обновления собственного документа игрока для обработки команд администратора в реальном времени
     */
    public subscribeToOwnProfile(userId: string, callback: (data: any) => void): () => void {
        const playerRef = doc(db, 'пользователи', userId);

        return onSnapshot(
            playerRef,
            (snapshot: any) => {
                if (snapshot.exists()) {
                    callback(snapshot.data());
                }
            },
            (error: any) => {
                console.error('[SyncService] Own profile subscription error:', error);
            },
        );
    }

    public async isNicknameUnique(name: string, currentUserId?: string, guestUserId?: string): Promise<boolean> {
        try {
            const playersRef = collection(db, 'пользователи');
            // Ищем точное совпадение имени (поддерживаем новый и старый ключи)
            const qName = query(playersRef, where('name', '==', name));
            const snapName = await getDocs(qName);
            
            let docs = [...snapName.docs];
            if (snapName.empty) {
                const qLegacy = query(playersRef, where('имя', '==', name));
                const snapLegacy = await getDocs(qLegacy);
                docs = [...snapLegacy.docs];
            }
            
            if (docs.length === 0) return true;

            // Если есть документ с таким именем, но его ID совпадает с ID текущего или гостевого игрока, то ник принадлежит ему же
            if (currentUserId || guestUserId) {
                const matchesCurrentUser = docs.some(
                    (doc) => doc.id === currentUserId || (guestUserId && doc.id === guestUserId),
                );
                if (matchesCurrentUser) return true;
            }
            return false;
        } catch (error) {
            console.error('[SyncService] Nickname uniqueness check failed:', error);
            return true; // В случае ошибки разрешаем, чтобы не блокировать вход
        }
    }

    /**
     * Загружает данные игрока из Firebase (восстановление при перезагрузке)
     */
    public async loadPlayerData(userId: string): Promise<any | null> {
        try {
            const playerRef = doc(db, 'пользователи', userId);
            const playerSnap = await getDoc(playerRef);

            if (playerSnap.exists()) {
                const data = playerSnap.data();
                if (data.полноеСостояниеJSON) {
                    try {
                        const parsed = JSON.parse(data.полноеСостояниеJSON);
                        return {
                            ...parsed,
                            status: data.status || 'ONLINE',
                            banReason: data.banReason || '',
                            banUntil: data.banUntil || '',
                            isMuted: data.isMuted || false,
                            muteReason: data.muteReason || '',
                            muteUntil: data.muteUntil || '',
                        };
                    } catch (e) {
                        console.error('[SyncService] Failed to parse полноеСостояниеJSON:', e);
                    }
                }

                // Fallback для старых данных / fullStateJSON
                if (data.fullStateJSON) {
                    try {
                        const parsed = JSON.parse(data.fullStateJSON);
                        return {
                            ...parsed,
                            // onboardingCompleted берём из сохранённого состояния
                        };
                    } catch (e) {
                        console.error('[SyncService] Failed to parse legacy fullStateJSON:', e);
                    }
                }

                // Вспомогательный маппинг для легаси/старых данных
                // У старых игроков обучение уже пройдено
                const legacyData: any = {
                    onboardingCompleted: true,
                };

                const nameVal = data.имя || data.name;
                if (nameVal) legacyData.name = nameVal;

                const avatarVal = data.avatar || data.photo;
                if (avatarVal) legacyData.avatar = avatarVal;

                const levelVal = data.уровень || data.лев || data.level;
                if (levelVal) legacyData.level = levelVal;

                const goldVal = data.золото !== undefined ? data.золото : data.gold;
                if (goldVal !== undefined) legacyData.gold = goldVal;

                const crystalsVal = data.кристаллы !== undefined ? data.кристаллы : data.crystals;
                if (crystalsVal !== undefined) legacyData.crystals = crystalsVal;

                const ratingVal = data.рейтинг !== undefined ? data.рейтинг : data.rating;
                if (ratingVal !== undefined) legacyData.rating = ratingVal;

                const invVal = data.инвентарь || data.inventory;
                if (invVal) legacyData.inventory = invVal;

                const gearVal = data.снаряжение || data.геройСнаряжение;
                if (gearVal) {
                    const heroClass = data.герой || data.heroId || 'panda';
                    legacyData.heroEquipment = {
                        [heroClass]: {
                            WEAPONS: gearVal.WEAPONS || gearVal.weapon || null,
                            HELMETS: gearVal.HELMETS || gearVal.helm || null,
                            ARMOR: gearVal.ARMOR || gearVal.armor || null,
                            SHIELDS: gearVal.SHIELDS || gearVal.shield || null,
                            SHOULDERS: gearVal.SHOULDERS || null,
                            PANTS: gearVal.PANTS || null,
                            BOOTS: gearVal.BOOTS || null,
                        },
                    };
                }

                return legacyData;
            }
            return null;
        } catch (error) {
            console.error('[SyncService] Load player data failed:', error);
            return null;
        }
    }

    /**
     * Записывает действие игрока в Firestore для живого наблюдения (Spectator Mode)
     */
    public async logPlayerAction(actionText: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.writeChain = this.writeChain
                .then(async () => {
                    try {
                        await this.performLogPlayerAction(actionText);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .catch(() => {
                    // Предотвращаем прерывание очереди
                });
        });
    }

    private async performLogPlayerAction(actionText: string): Promise<void> {
        const state = useGameStore.getState();
        const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
        if (!userId) return;

        try {
            const playerRef = doc(db, 'пользователи', userId);
            const playerSnap = await getDoc(playerRef);
            if (playerSnap.exists()) {
                const data = playerSnap.data();
                const actions = data.lastActions || data.последниеДействия || [];
                const timestamp = new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
                const newActions = [...actions, `[${timestamp}] ${actionText}`].slice(-15);

                await setDoc(
                    playerRef,
                    {
                        lastActions: newActions,
                        wasOnline: serverTimestamp(),
                    },
                    { merge: true },
                );
            }
        } catch (error) {
            console.error('[SyncService] Failed to log player action:', error);
            throw error;
        }
    }
}

export const syncService = SyncService.getInstance();
