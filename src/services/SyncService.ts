import { db, USERS_COLLECTION, CHAT_COLLECTION, FEEDBACK_COLLECTION } from '../utils/firebase';
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
    writeBatch,
} from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';
import { getVkUserInfo } from '../utils/VKBridge';

export class SyncService {
    private static instance: SyncService;
    private syncInterval: any = null;
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private writeChain: Promise<any> = Promise.resolve();
    private pendingActions: string[] = [];
    private logFlushTimeout: ReturnType<typeof setTimeout> | null = null;
    // In-memory cache of lastActions — avoids a getDoc READ on every flush
    private lastActionsCache: string[] = [];
    private static eventListenersAdded = false;
    private activeUnsubscribes: (() => void)[] = [];
    private syncDisabled: boolean = false;

    private trackUnsubscribe(unsub: () => void): () => void {
        this.activeUnsubscribes.push(unsub);
        return () => {
            unsub();
            this.activeUnsubscribes = this.activeUnsubscribes.filter((u) => u !== unsub);
        };
    }

    private async performSyncWithRetry(retries = 3, delay = 1000): Promise<void> {
        try {
            await this.performSync();
        } catch (error) {
            if (retries > 0) {
                console.warn(
                    `[SyncService] Sync failed, retrying in ${delay}ms... Remaining retries: ${retries}`,
                    error,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.performSyncWithRetry(retries - 1, delay * 2);
            } else {
                console.error('[SyncService] Sync failed permanently after all retries:', error);
                throw error;
            }
        }
    }

    private constructor() {
        if (typeof window !== 'undefined' && !SyncService.eventListenersAdded) {
            SyncService.eventListenersAdded = true;
            const flushSync = () => {
                if (this.syncDisabled) return;
                if (this.syncTimeout) {
                    clearTimeout(this.syncTimeout);
                    this.syncTimeout = null;
                    this.syncPlayerData().catch(() => {});
                }
            };
            window.addEventListener('beforeunload', flushSync);
            window.addEventListener('pagehide', flushSync);
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    flushSync();
                }
            });
        }
    }

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
        if (this.syncDisabled) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
            this.writeChain = this.writeChain
                .then(async () => {
                    try {
                        await this.performSyncWithRetry();
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
        if (this.syncDisabled) {
            console.log('[SyncService] Sync is disabled, skipping performSync');
            return;
        }
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
            const playerRef = doc(db, USERS_COLLECTION, userId);

            const selectedHeroId = state.selectedHeroId || 'panda';
            const fullState = {
                lastSavedTimestamp: state.lastSavedTimestamp || 0,
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
                claimedGifts: state.claimedGifts || [],
                pveStage: state.pveStage,
                maxPveStage: state.maxPveStage,
                winStreak: state.winStreak,
                lossStreak: state.lossStreak,
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
                lastDailyGiftClaimedTime: state.lastDailyGiftClaimedTime,
                activeBuffs: state.activeBuffs || {},
                dailyQuests: state.dailyQuests,
                weeklyQuests: state.weeklyQuests,
                lastDailyRefresh: state.lastDailyRefresh,
                lastWeeklyRefresh: state.lastWeeklyRefresh,
                lastWeeklyQuestReset: state.lastWeeklyQuestReset,
                pvpCooldowns: state.pvpCooldowns || {},
                referralProcessed: state.referralProcessed || false,
                referredBy: state.referredBy || null,
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
                friends: (state.friends || []).map((f: any) => (typeof f === 'object' ? f.id : f)).filter(Boolean),
                fullStateJSON: JSON.stringify(fullState),
                isTestPlayer: isLocalhost || state.name === 'Разработчик' || state.name?.toLowerCase().includes('test'),
                isDeveloper: isLocalhost || state.name === 'Разработчик',
                vipLevel: state.vipLevel || 0,
                isVipActive,
                vipDaysRemaining,
                energy: state.energy || 0,
                maxEnergy: state.maxEnergy || 0,
                winRate: state.wins && state.totalBattles ? Math.round((state.wins / state.totalBattles) * 100) : 50,

                // Russian legacy keys compatibility:
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                уровень: state.level || 1,
                рейтинг: state.rating || 0,
                былВСети: serverTimestamp(),
                имя: state.name || 'Мастер',
                фото: state.avatar || (vkUser ? vkUser.photo200 || vkUser.photo || '' : ''),
                инвентарь: state.inventory || [],
                друзья: (state.friends || []).map((f: any) => (typeof f === 'object' ? f.id : f)).filter(Boolean),
                снаряжение: {
                    WEAPONS: state.heroEquipment?.[selectedHeroId]?.WEAPONS || null,
                    HELMETS: state.heroEquipment?.[selectedHeroId]?.HELMETS || null,
                    ARMOR: state.heroEquipment?.[selectedHeroId]?.ARMOR || null,
                    SHIELDS: state.heroEquipment?.[selectedHeroId]?.SHIELDS || null,
                    SHOULDERS: state.heroEquipment?.[selectedHeroId]?.SHOULDERS || null,
                    PANTS: state.heroEquipment?.[selectedHeroId]?.PANTS || null,
                    BOOTS: state.heroEquipment?.[selectedHeroId]?.BOOTS || null,
                },
            };

            await setDoc(playerRef, syncData, { merge: true });
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            throw error;
        }
    }

    public debouncedSync(delay = 2000): void {
        if (this.syncDisabled) return;
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        this.syncTimeout = setTimeout(() => {
            this.syncPlayerData();
            this.syncTimeout = null;
        }, delay);
    }

    public disableSync(): void {
        this.syncDisabled = true;
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
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
    }

    public stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.activeUnsubscribes.forEach((unsub) => {
            try {
                unsub();
            } catch (e) {
                console.error('[SyncService] Error during unsubscribe cleanup:', e);
            }
        });
        this.activeUnsubscribes = [];
    }

    /**
     * Получает список всех игроков из Firebase (для админ-панели)
     */
    public async getAllPlayers(): Promise<any[]> {
        try {
            const playersRef = collection(db, USERS_COLLECTION);
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
            const playersRef = collection(db, USERS_COLLECTION);
            const q = query(playersRef, orderBy('былВСети', 'desc'), limit(100));

            return this.trackUnsubscribe(
                onSnapshot(
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
                ),
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
            const playerRef = doc(db, USERS_COLLECTION, userId);
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

            // Записываем список измененных полей для дельта-синхронизации клиентом
            updatedData.adminChangedFields = Object.keys(data);

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
            const feedbackRef = doc(collection(db, FEEDBACK_COLLECTION));
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
            const feedbackRef = collection(db, FEEDBACK_COLLECTION);
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
            let playerRef = doc(db, USERS_COLLECTION, id);
            let playerSnap = await getDoc(playerRef);

            // Если не нашли и ID не содержит префиксов, пробуем добавить GUEST- или ГОСТЬ-
            if (!playerSnap.exists() && !id.startsWith('VK-') && !id.startsWith('GUEST-') && !id.startsWith('ГОСТЬ-')) {
                playerRef = doc(db, USERS_COLLECTION, `GUEST-${id}`);
                playerSnap = await getDoc(playerRef);

                if (!playerSnap.exists()) {
                    playerRef = doc(db, USERS_COLLECTION, `ГОСТЬ-${id}`);
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
            const playersRef = collection(db, USERS_COLLECTION);
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
                    const myId = useGameStore.getState().playerId;
                    const isMe =
                        p.id === myId || (p.vkId && String(p.vkId) === String(useGameStore.getState().vkUser?.id));
                    if (isMe) return true;
                    if (['разработчик', 'test'].some((w) => lowerName.includes(w))) {
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
            const playersRef = collection(db, USERS_COLLECTION);
            const q = query(playersRef, orderBy('рейтинг', 'desc'), limit(limitCount + 15));

            return this.trackUnsubscribe(
                onSnapshot(
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
                                const myId = useGameStore.getState().playerId;
                                const isMe =
                                    p.id === myId ||
                                    (p.vkId && String(p.vkId) === String(useGameStore.getState().vkUser?.id));
                                if (isMe) return true;
                                if (['разработчик', 'test'].some((w) => lowerName.includes(w))) {
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
                ),
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
            const requestsRef = collection(db, USERS_COLLECTION, targetId, 'запросы');
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
        const requestsRef = collection(db, USERS_COLLECTION, userId, 'запросы');

        return this.trackUnsubscribe(
            onSnapshot(
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
            ),
        );
    }

    /**
     * Удаляет запрос в друзья
     */
    public async deleteFriendRequest(userId: string, requestId: string): Promise<void> {
        try {
            const requestRef = doc(db, USERS_COLLECTION, userId, 'запросы', requestId);
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
            const chatRef = doc(collection(db, CHAT_COLLECTION));
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
            const chatRef = collection(db, CHAT_COLLECTION);
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
        const state = useGameStore.getState();
        const isLocalhost =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.protocol === 'file:');
        const isDeveloper = isLocalhost || state.name === 'Разработчик';

        if (!isDeveloper) {
            console.error('[SyncService] Unauthorized attempt to wipe global chat.');
            return;
        }

        try {
            const chatRef = collection(db, CHAT_COLLECTION);
            const snapshot = await getDocs(chatRef);
            const promises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
            await Promise.all(promises);
            console.log(`[SyncService] Wiped ${snapshot.docs.length} messages from global chat.`);
        } catch (error) {
            console.error('[SyncService] Failed to wipe global chat:', error);
        }
    }

    /**
     * Подписывается на обновления чата
     */
    public subscribeToChat(callback: (messages: any[]) => void): () => void {
        const chatRef = collection(db, CHAT_COLLECTION);
        const q = query(chatRef, orderBy('serverTimestamp', 'desc'), limit(50));

        return this.trackUnsubscribe(
            onSnapshot(
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
            ),
        );
    }

    /**
     * Отправляет письмо конкретному игроку
     */
    public async sendMail(userId: string, mailData: any): Promise<void> {
        try {
            const mailCollection = collection(db, USERS_COLLECTION, userId, 'почта');
            const mailRef = mailData.id ? doc(mailCollection, mailData.id) : doc(mailCollection);
            await setDoc(mailRef, {
                ...mailData,
                id: mailRef.id,
                timestamp: mailData.timestamp || Date.now(),
            });
        } catch (error) {
            console.error('[SyncService] Failed to send mail:', error);
            throw error;
        }
    }

    /**
     * Обновляет конкретное письмо (прочитано, забрано, архив)
     */
    public async updateMail(userId: string, mailId: string, updates: Partial<any>): Promise<void> {
        try {
            const mailRef = doc(db, USERS_COLLECTION, userId, 'почта', mailId);
            await setDoc(mailRef, updates, { merge: true });
        } catch (error) {
            console.error('[SyncService] Failed to update mail:', error);
            throw error;
        }
    }

    /**
     * Удаляет конкретное письмо
     */
    public async deleteMail(userId: string, mailId: string): Promise<void> {
        try {
            const mailRef = doc(db, USERS_COLLECTION, userId, 'почта', mailId);
            await deleteDoc(mailRef);
        } catch (error) {
            console.error('[SyncService] Failed to delete mail:', error);
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
        const mailRef = collection(db, USERS_COLLECTION, userId, 'почта');
        const q = query(mailRef, orderBy('timestamp', 'desc'), limit(50));

        return this.trackUnsubscribe(
            onSnapshot(
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
            ),
        );
    }

    /**
     * Подписывается на обновления собственного документа игрока для обработки команд администратора в реальном времени
     */
    public subscribeToOwnProfile(userId: string, callback: (data: any) => void): () => void {
        const playerRef = doc(db, USERS_COLLECTION, userId);

        return this.trackUnsubscribe(
            onSnapshot(
                playerRef,
                (snapshot: any) => {
                    if (snapshot.exists()) {
                        callback(snapshot.data());
                    }
                },
                (error: any) => {
                    console.error('[SyncService] Own profile subscription error:', error);
                },
            ),
        );
    }

    public async isNicknameUnique(name: string, currentUserId?: string, guestUserId?: string): Promise<boolean> {
        try {
            const playersRef = collection(db, USERS_COLLECTION);
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
     * Обновляет несколько писем с использованием Batch (атомарно)
     */
    public async updateMultipleMails(userId: string, mailIds: string[], updates: Partial<any>): Promise<void> {
        try {
            const batch = writeBatch(db);
            mailIds.forEach((mailId) => {
                const mailRef = doc(db, USERS_COLLECTION, userId, 'почта', mailId);
                batch.set(mailRef, updates, { merge: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('[SyncService] Failed to update multiple mails:', error);
            throw error;
        }
    }

    /**
     * Находит prefixed ID игрока по его нику
     */
    public async getPlayerIdByName(name: string): Promise<string | null> {
        try {
            const playersRef = collection(db, USERS_COLLECTION);
            const qName = query(playersRef, where('name', '==', name));
            const snap = await getDocs(qName);
            if (!snap.empty) {
                return snap.docs[0].id;
            }
            const qLegacy = query(playersRef, where('имя', '==', name));
            const snapLegacy = await getDocs(qLegacy);
            if (!snapLegacy.empty) {
                return snapLegacy.docs[0].id;
            }
            return null;
        } catch (error) {
            console.error('[SyncService] Failed to find player by name:', error);
            return null;
        }
    }

    /**
     * Отправляет личное сообщение (дублируя в ветку отправителя и получателя)
     */
    public async sendPrivateMessage(senderId: string, recipientId: string, message: any): Promise<void> {
        try {
            const senderPrivateRef = doc(collection(db, USERS_COLLECTION, senderId, 'личные_сообщения'));
            const msgId = senderPrivateRef.id;
            const payload = {
                ...message,
                id: msgId,
                serverTimestamp: serverTimestamp(),
            };
            await setDoc(senderPrivateRef, payload);

            if (senderId !== recipientId) {
                const recipientPrivateRef = doc(db, USERS_COLLECTION, recipientId, 'личные_сообщения', msgId);
                await setDoc(recipientPrivateRef, payload);
            }
        } catch (error) {
            console.error('[SyncService] Failed to send private message:', error);
            throw error;
        }
    }

    /**
     * Подписывается на личные сообщения игрока
     */
    public subscribeToPrivateMessages(userId: string, callback: (messages: any[]) => void): () => void {
        const privateChatRef = collection(db, USERS_COLLECTION, userId, 'личные_сообщения');
        const q = query(privateChatRef, orderBy('serverTimestamp', 'desc'), limit(50));

        return this.trackUnsubscribe(
            onSnapshot(
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
                    console.error('[SyncService] Private chat subscription error:', error);
                },
            ),
        );
    }

    /**
     * Подписывается на клановый чат
     */
    public subscribeToClanChat(clanId: string, callback: (messages: any[]) => void): () => void {
        const chatRef = collection(db, CHAT_COLLECTION);
        const q = query(chatRef, where('clanId', '==', clanId));

        return this.trackUnsubscribe(
            onSnapshot(
                q,
                (snapshot: any) => {
                    const messages = snapshot.docs
                        .map((doc: any) => ({
                            ...doc.data(),
                            id: doc.id,
                        }))
                        .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
                    callback(messages);
                },
                (error: any) => {
                    console.error('[SyncService] Clan chat subscription error:', error);
                },
            ),
        );
    }

    /**
     * Загружает данные игрока из Firebase (восстановление при перезагрузке)
     */
    public async resolveFriendProfiles(friendIds: string[]): Promise<any[]> {
        if (!friendIds || friendIds.length === 0) return [];
        try {
            const sanitizedIds = friendIds.map((id: any) => (typeof id === 'object' ? id.id : id)).filter(Boolean);
            const promises = sanitizedIds.map(async (id) => {
                const docRef = doc(db, USERS_COLLECTION, id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const wasOnlineVal = data.wasOnline || data.былВСети;
                    const lastSeenTime = wasOnlineVal?.toMillis ? wasOnlineVal.toMillis() : wasOnlineVal || 0;
                    const now = Date.now();
                    const fiveMinutes = 5 * 60 * 1000;
                    return {
                        id: docSnap.id,
                        name: data.name || data.имя || 'Мастер',
                        avatar: data.avatar || data.фото || 'avatar_1.png',
                        level: data.level || data.уровень || 1,
                        online: now - lastSeenTime < fiveMinutes,
                        lastSeen: lastSeenTime,
                    };
                }
                return null;
            });
            const results = await Promise.all(promises);
            return results.filter((f) => f !== null) as any[];
        } catch (error) {
            console.error('[SyncService] Failed to resolve friend profiles:', error);
            return [];
        }
    }

    public async loadPlayerData(userId: string): Promise<any | null> {
        try {
            const playerRef = doc(db, USERS_COLLECTION, userId);
            const playerSnap = await getDoc(playerRef);

            if (playerSnap.exists()) {
                const data = playerSnap.data();
                const wasOnlineMs =
                    data.wasOnline && typeof data.wasOnline.toMillis === 'function'
                        ? data.wasOnline.toMillis()
                        : data.wasOnline?.seconds
                          ? data.wasOnline.seconds * 1000
                          : data.былВСети && typeof data.былВСети.toMillis === 'function'
                            ? data.былВСети.toMillis()
                            : data.былВСети?.seconds
                              ? data.былВСети.seconds * 1000
                              : 0;

                const dbFriendIds = (data.friends || [])
                    .map((f: any) => (typeof f === 'object' ? f.id : f))
                    .filter(Boolean);
                let resolvedFriends: any[] = [];
                if (dbFriendIds.length > 0) {
                    resolvedFriends = await this.resolveFriendProfiles(dbFriendIds);
                }

                if (data.полноеСостояниеJSON) {
                    try {
                        const parsed = JSON.parse(data.полноеСостояниеJSON);
                        const oldFriends = parsed.friends || [];
                        const mergedFriends = resolvedFriends.map((rf) => {
                            const oldFriend = oldFriends.find((of: any) => of.id === rf.id);
                            return {
                                ...rf,
                                giftSent: oldFriend ? !!oldFriend.giftSent : false,
                                hasGift: oldFriend ? !!oldFriend.hasGift : false,
                            };
                        });
                        parsed.friends = mergedFriends;
                        return {
                            ...parsed,
                            wasOnlineMs,
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
                        const oldFriends = parsed.friends || [];
                        const mergedFriends = resolvedFriends.map((rf) => {
                            const oldFriend = oldFriends.find((of: any) => of.id === rf.id);
                            return {
                                ...rf,
                                giftSent: oldFriend ? !!oldFriend.giftSent : false,
                                hasGift: oldFriend ? !!oldFriend.hasGift : false,
                            };
                        });
                        parsed.friends = mergedFriends;
                        return {
                            ...parsed,
                            wasOnlineMs,
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
     * Записывает действие игрока в Firestore для живого наблюдения (Spectator Mode) с буферизацией
     */
    public async logPlayerAction(actionText: string): Promise<void> {
        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        this.pendingActions.push(`[${timestamp}] ${actionText}`);
        this.scheduleLogFlush();
    }

    private scheduleLogFlush(): void {
        if (this.logFlushTimeout) return;
        this.logFlushTimeout = setTimeout(async () => {
            this.logFlushTimeout = null;
            if (this.pendingActions.length === 0) return;

            const actionsToFlush = [...this.pendingActions];
            this.pendingActions = [];

            const state = useGameStore.getState();
            const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
            if (!userId) return;

            this.writeChain = this.writeChain
                .then(async () => {
                    try {
                        const playerRef = doc(db, USERS_COLLECTION, userId);
                        // Объединяем кешированные действия с новыми и обрезаем до 15 — без лишнего getDoc
                        const merged = [...this.lastActionsCache, ...actionsToFlush].slice(-15);
                        this.lastActionsCache = merged;

                        await setDoc(
                            playerRef,
                            {
                                lastActions: merged,
                                wasOnline: serverTimestamp(),
                            },
                            { merge: true },
                        );
                    } catch (error) {
                        console.error('[SyncService] Failed to flush action logs:', error);
                    }
                })
                .catch(() => {
                    // Предотвращаем прерывание очереди
                });
        }, 5000);
    }
}

export const syncService = SyncService.getInstance();
