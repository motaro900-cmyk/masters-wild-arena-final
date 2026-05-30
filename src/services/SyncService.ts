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

    public static getPrefixedUserId(vkUser: any, playerId: string): string {
        if (vkUser) {
            return `VK-${vkUser.id}`;
        }
        if (playerId && playerId.startsWith('GUEST-')) {
            return playerId;
        }
        const cleanGuest = playerId ? playerId.replace(/^MW-/, '') : Math.random().toString(36).substring(2, 11).toUpperCase();
        return `GUEST-${cleanGuest}`;
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
            };

            const isLocalhost = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' || 
                 window.location.protocol === 'file:');

            const syncData = {
                id: userId,
                vkId: vkUser ? Number(vkUser.id) : 0,
                имя: state.name || 'Мастер',
                имяВК: vkUser ? (vkUser.first_name || vkUser.firstName || '') : '',
                фамилияВК: vkUser ? (vkUser.last_name || vkUser.lastName || '') : '',
                ссылкаВК: vkUser ? `https://vk.com/id${vkUser.id}` : '',
                уровень: state.level || 1,
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                рейтинг: state.rating || 0,
                былВСети: serverTimestamp(),
                активныйЭкран: state.activeScreen || 'MAIN_MENU',
                герой: selectedHeroId,
                фото: state.avatar || (vkUser ? (vkUser.photo200 || vkUser.photo || '') : ''),
                снаряжение: {
                    WEAPONS: state.heroEquipment?.[selectedHeroId]?.WEAPONS || null,
                    HELMETS: state.heroEquipment?.[selectedHeroId]?.HELMETS || null,
                    ARMOR: state.heroEquipment?.[selectedHeroId]?.ARMOR || null,
                    SHIELDS: state.heroEquipment?.[selectedHeroId]?.SHIELDS || null,
                    SHOULDERS: state.heroEquipment?.[selectedHeroId]?.SHOULDERS || null,
                    PANTS: state.heroEquipment?.[selectedHeroId]?.PANTS || null,
                    BOOTS: state.heroEquipment?.[selectedHeroId]?.BOOTS || null,
                },
                инвентарь: state.inventory || [],
                полноеСостояниеJSON: JSON.stringify(fullState),
                тестовый: isLocalhost || state.name === 'Разработчик' || state.name?.toLowerCase().includes('test'),
                разработчик: isLocalhost || state.name === 'Разработчик',
            };

            await setDoc(playerRef, syncData, { merge: true });
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
     * Удаленно обновляет данные игрока в Firebase (для админки)
     */
    public async updateRemotePlayerData(userId: string, data: any): Promise<void> {
        try {
            const playerRef = doc(db, 'пользователи', userId);
            const playerSnap = await getDoc(playerRef);
            
            let updatedData = { ...data };
            
            if (playerSnap.exists()) {
                const docData = playerSnap.data();
                if (docData.полноеСостояниеJSON) {
                    try {
                        const parsed = JSON.parse(docData.полноеСостояниеJSON);
                        
                        // Map Firestore fields to Zustand state keys
                        if (data.золото !== undefined) parsed.gold = Number(data.золото);
                        if (data.кристаллы !== undefined) parsed.crystals = Number(data.кристаллы);
                        if (data.уровень !== undefined) parsed.level = Number(data.уровень);
                        if (data.рейтинг !== undefined) {
                            parsed.rating = Number(data.рейтинг);
                            parsed.trophies = Number(data.рейтинг);
                        }
                        if (data.инвентарь !== undefined) parsed.inventory = data.инвентарь;
                        if (data.снаряжение !== undefined) parsed.heroEquipment = data.снаряжение;
                        if (data.ownedSkins !== undefined) parsed.ownedSkins = data.ownedSkins;
                        
                        // Also support clean English keys if they are passed
                        if (data.gold !== undefined) parsed.gold = Number(data.gold);
                        if (data.crystals !== undefined) parsed.crystals = Number(data.crystals);
                        if (data.level !== undefined) parsed.level = Number(data.level);
                        if (data.rating !== undefined) {
                            parsed.rating = Number(data.rating);
                            parsed.trophies = Number(data.rating);
                        }
                        if (data.inventory !== undefined) parsed.inventory = data.inventory;
                        if (data.heroEquipment !== undefined) parsed.heroEquipment = data.heroEquipment;
                        
                        updatedData.полноеСостояниеJSON = JSON.stringify(parsed);
                    } catch (e) {
                        console.error('[SyncService] Failed to parse полноеСостояниеJSON during remote update:', e);
                    }
                }
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

    /**
     * Проверяет, свободно ли имя (никнейм) в базе данных
     */
    public async isNicknameUnique(name: string, currentUserId?: string): Promise<boolean> {
        try {
            const playersRef = collection(db, 'пользователи');
            // Ищем точное совпадение имени
            const q = query(playersRef, where('имя', '==', name));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return true;

            // Если есть документ с таким именем, но его ID совпадает с ID текущего игрока, то ник принадлежит ему же
            if (currentUserId) {
                const matchesCurrentUser = snapshot.docs.some((doc) => doc.id === currentUserId);
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
                        }
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
}

export const syncService = SyncService.getInstance();
