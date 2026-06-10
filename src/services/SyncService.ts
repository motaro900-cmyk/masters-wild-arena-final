/**
 * SyncService — CORE + Facade
 *
 * Ответственность этого файла:
 *  - Singleton + write-queue (writeChain)
 *  - syncPlayerData / performSync / debouncedSync / startAutoSync / stopAutoSync
 *  - loadPlayerData (data hydration on login)
 *  - logPlayerAction (action log buffer + flush)
 *  - trackUnsubscribe helper (передаётся в суб-сервисы)
 *  - Публичные методы-фасады, делегирующие в суб-сервисы
 *
 * Суб-сервисы:
 *  - ChatService   — глобальный чат, личные сообщения, клановый чат
 *  - MailService   — почта игроков
 *  - SocialService — друзья, профили, ник-проверка
 *  - AdminService  — список игроков, лидерборд, обратная связь, удалённое обновление
 */

import { db, USERS_COLLECTION } from '../utils/firebase';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { useGameStore } from '../store/useGameStore';
import { getVkUserInfo } from '../utils/VKBridge';

// --- Sub-service imports ---
import * as Chat from './ChatService';
import * as Mail from './MailService';
import * as Social from './SocialService';
import * as Admin from './AdminService';
import { resolveFriendProfiles } from './SocialService';

export class SyncService {
    private static instance: SyncService;
    private syncInterval: any = null;
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private writeChain: Promise<any> = Promise.resolve();
    private pendingActions: string[] = [];
    private logFlushTimeout: ReturnType<typeof setTimeout> | null = null;
    private lastActionsCache: string[] = [];
    private static eventListenersAdded = false;
    private activeUnsubscribes: (() => void)[] = [];
    private syncDisabled: boolean = false;

    // ─── Helpers ───────────────────────────────────────────────────────────────

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
                console.warn(`[SyncService] Sync failed, retrying in ${delay}ms...`, error);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.performSyncWithRetry(retries - 1, delay * 2);
            } else {
                console.error('[SyncService] Sync failed permanently after all retries:', error);
                throw error;
            }
        }
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

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
                if (document.visibilityState === 'hidden') flushSync();
            });
        }
    }

    public static getInstance(): SyncService {
        if (!SyncService.instance) SyncService.instance = new SyncService();
        return SyncService.instance;
    }

    // ─── User ID helpers ───────────────────────────────────────────────────────

    public getCurrentUserId(): string {
        const state = useGameStore.getState();
        return SyncService.getPrefixedUserId(state.vkUser, state.playerId);
    }

    public static getPrefixedUserId(vkUser: any, playerId: string): string {
        if (vkUser) return `VK-${vkUser.id}`;
        if (playerId === 'DEVELOPER') return 'DEVELOPER';
        if (playerId && playerId.startsWith('GUEST-')) return playerId;
        const cleanGuest = playerId
            ? playerId.replace(/^MW-/, '')
            : Math.random().toString(36).substring(2, 11).toUpperCase();
        return `GUEST-${cleanGuest}`;
    }

    // ─── Core sync ─────────────────────────────────────────────────────────────

    public async syncPlayerData(): Promise<void> {
        const userId = this.getCurrentUserId();
        if (!userId.startsWith('VK-')) {
            console.warn('[SyncService] Blocked write for non-VK user:', userId);
            return Promise.resolve();
        }
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
                .catch(() => {});
        });
    }

    private async performSync(): Promise<void> {
        const userId = this.getCurrentUserId();
        if (!userId.startsWith('VK-')) {
            console.warn('[SyncService] Blocked write for non-VK user:', userId);
            return;
        }
        if (this.syncDisabled) return;

        const state = useGameStore.getState();
        let vkUser = state.vkUser;
        if (!vkUser) {
            vkUser = await getVkUserInfo();
            if (vkUser) {
                state.setVkUser(vkUser);
                if (vkUser.photo && (state.avatar === 'sprite:sprite-avatar avatar-pos-1' || !state.avatar)) {
                    state.updateProfile?.({ avatar: vkUser.photo });
                }
            }
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
                newbieWins: state.newbieWins || 0,
                hasBoughtStarterPack: state.hasBoughtStarterPack || false,
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
            const vipDaysRemaining = isVipActive
                ? Math.ceil((vipEndTime - Date.now()) / (24 * 60 * 60 * 1000))
                : 0;

            const equipmentSlice = {
                WEAPONS: state.heroEquipment?.[selectedHeroId]?.WEAPONS || null,
                HELMETS: state.heroEquipment?.[selectedHeroId]?.HELMETS || null,
                ARMOR: state.heroEquipment?.[selectedHeroId]?.ARMOR || null,
                SHIELDS: state.heroEquipment?.[selectedHeroId]?.SHIELDS || null,
                SHOULDERS: state.heroEquipment?.[selectedHeroId]?.SHOULDERS || null,
                PANTS: state.heroEquipment?.[selectedHeroId]?.PANTS || null,
                BOOTS: state.heroEquipment?.[selectedHeroId]?.BOOTS || null,
            };

            const syncData = {
                id: userId,
                vkId: vkUser ? Number(vkUser.id) : 0,
                activeSessionToken: state.sessionToken || '',
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
                equipment: equipmentSlice,
                inventory: state.inventory || [],
                friends: (state.friends || []).map((f: any) => (typeof f === 'object' ? f.id : f)).filter(Boolean),
                fullStateJSON: JSON.stringify(fullState),
                isTestPlayer: isLocalhost || state.name === 'Разработчик' || state.name?.toLowerCase().includes('test'),
                isDeveloper: isLocalhost || state.name === 'Разработчик',
                vipLevel: state.vipLevel || 0,
                isVipActive,
                vipDaysRemaining,
                isNewPlayer: !state.onboardingCompleted,
                energy: state.energy || 0,
                maxEnergy: state.maxEnergy || 0,
                winRate: state.wins && state.totalBattles
                    ? Math.round((state.wins / state.totalBattles) * 100)
                    : 50,
                // Russian legacy keys
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                уровень: state.level || 1,
                рейтинг: state.rating || 0,
                былВСети: serverTimestamp(),
                имя: state.name || 'Мастер',
                фото: state.avatar || (vkUser ? vkUser.photo200 || vkUser.photo || '' : ''),
                инвентарь: state.inventory || [],
                друзья: (state.friends || []).map((f: any) => (typeof f === 'object' ? f.id : f)).filter(Boolean),
                снаряжение: equipmentSlice,
            };

            await setDoc(playerRef, syncData, { merge: true });
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            throw error;
        }
    }

    public debouncedSync(delay = 2000): void {
        if (this.syncDisabled) return;
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
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

    public startAutoSync(intervalMs = 60000): void {
        if (this.syncInterval) return;
        this.syncPlayerData();
        this.syncInterval = setInterval(() => this.syncPlayerData(), intervalMs);
    }

    public stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.activeUnsubscribes.forEach((unsub) => {
            try { unsub(); } catch (e) { console.error('[SyncService] Unsubscribe error:', e); }
        });
        this.activeUnsubscribes = [];
    }

    // ─── Load player data on login ─────────────────────────────────────────────

    public async loadPlayerData(userId: string): Promise<{ data: any; isNew: boolean } | null> {
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
                const resolvedFriends =
                    dbFriendIds.length > 0 ? await resolveFriendProfiles(dbFriendIds) : [];

                const mergeFriends = (parsed: any) => {
                    const oldFriends = parsed.friends || [];
                    parsed.friends = resolvedFriends.map((rf) => {
                        const oldFriend = oldFriends.find((of: any) => of.id === rf.id);
                        return {
                            ...rf,
                            giftSent: oldFriend ? !!oldFriend.giftSent : false,
                            hasGift: oldFriend ? !!oldFriend.hasGift : false,
                        };
                    });
                };

                let processedData: any = null;

                if (data.полноеСостояниеJSON) {
                    try {
                        const parsed = JSON.parse(data.полноеСостояниеJSON);
                        mergeFriends(parsed);
                        processedData = {
                            ...parsed,
                            wasOnlineMs,
                            isNewPlayer: data.isNewPlayer !== undefined ? data.isNewPlayer : parsed.isNewPlayer,
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

                if (!processedData && data.fullStateJSON) {
                    try {
                        const parsed = JSON.parse(data.fullStateJSON);
                        mergeFriends(parsed);
                        processedData = {
                            ...parsed,
                            wasOnlineMs,
                            isNewPlayer: data.isNewPlayer !== undefined ? data.isNewPlayer : parsed.isNewPlayer,
                        };
                    } catch (e) {
                        console.error('[SyncService] Failed to parse fullStateJSON:', e);
                    }
                }

                if (!processedData) {
                    // Legacy field mapping for very old accounts
                    const legacyData: any = {
                        onboardingCompleted: true,
                        isNewPlayer: data.isNewPlayer !== undefined ? data.isNewPlayer : false,
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
                    processedData = legacyData;
                }

                return { data: processedData, isNew: false };
            }

            const localTimestamp = useGameStore.getState().lastSavedTimestamp || 0;
            if (localTimestamp > Date.now() - 60 * 60 * 1000) {
                console.warn('[SyncService] Blocking reset — local save exists from last hour');
                return { data: null, isNew: false };
            }
            return { data: null, isNew: true };
        } catch (error) {
            console.error('[SyncService] Load player data failed:', error);
            return null;
        }
    }

    // ─── Action log ────────────────────────────────────────────────────────────

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
                        const merged = [...this.lastActionsCache, ...actionsToFlush].slice(-15);
                        this.lastActionsCache = merged;
                        await setDoc(playerRef, { lastActions: merged, wasOnline: serverTimestamp() }, { merge: true });
                    } catch (error) {
                        console.error('[SyncService] Failed to flush action logs:', error);
                    }
                })
                .catch(() => {});
        }, 5000);
    }

    // ─── Façade: Chat ──────────────────────────────────────────────────────────

    public async sendChatMessage(message: any): Promise<void> {
        return Chat.sendChatMessage(message);
    }
    public async deletePlayerMessages(playerName: string): Promise<void> {
        return Chat.deletePlayerMessages(playerName);
    }
    public async wipeGlobalChat(): Promise<void> {
        return Chat.wipeGlobalChat();
    }
    public subscribeToChat(callback: (messages: any[]) => void): () => void {
        return Chat.subscribeToChat(this.trackUnsubscribe.bind(this), callback);
    }
    public async sendPrivateMessage(senderId: string, recipientId: string, message: any): Promise<void> {
        return Chat.sendPrivateMessage(senderId, recipientId, message);
    }
    public subscribeToPrivateMessages(userId: string, callback: (messages: any[]) => void): () => void {
        return Chat.subscribeToPrivateMessages(this.trackUnsubscribe.bind(this), userId, callback);
    }
    public subscribeToClanChat(clanId: string, callback: (messages: any[]) => void): () => void {
        return Chat.subscribeToClanChat(this.trackUnsubscribe.bind(this), clanId, callback);
    }

    // ─── Façade: Mail ──────────────────────────────────────────────────────────

    public async sendMail(userId: string, mailData: any): Promise<void> {
        return Mail.sendMail(userId, mailData);
    }
    public async updateMail(userId: string, mailId: string, updates: Partial<any>): Promise<void> {
        return Mail.updateMail(userId, mailId, updates);
    }
    public async deleteMail(userId: string, mailId: string): Promise<void> {
        return Mail.deleteMail(userId, mailId);
    }
    public async updateMultipleMails(userId: string, mailIds: string[], updates: Partial<any>): Promise<void> {
        return Mail.updateMultipleMails(userId, mailIds, updates);
    }
    public subscribeToMail(userId: string, callback: (mails: any[]) => void): () => void {
        return Mail.subscribeToMail(this.trackUnsubscribe.bind(this), userId, callback);
    }

    // ─── Façade: Social ────────────────────────────────────────────────────────

    public async sendFriendRequest(targetId: string, senderData: any): Promise<boolean> {
        return Social.sendFriendRequest(targetId, senderData);
    }
    public subscribeToFriendRequests(userId: string, callback: (requests: any[]) => void): () => void {
        return Social.subscribeToFriendRequests(this.trackUnsubscribe.bind(this), userId, callback);
    }
    public async deleteFriendRequest(userId: string, requestId: string): Promise<void> {
        return Social.deleteFriendRequest(userId, requestId);
    }
    public subscribeToOwnProfile(userId: string, callback: (data: any) => void): () => void {
        return Social.subscribeToOwnProfile(this.trackUnsubscribe.bind(this), userId, callback);
    }
    public async isNicknameUnique(name: string, currentUserId?: string, guestUserId?: string): Promise<boolean> {
        return Social.isNicknameUnique(name, currentUserId, guestUserId);
    }
    public async getPlayerIdByName(name: string): Promise<string | null> {
        return Social.getPlayerIdByName(name);
    }
    public async resolveFriendProfiles(friendIds: string[]): Promise<any[]> {
        return Social.resolveFriendProfiles(friendIds);
    }

    // ─── Façade: Admin ─────────────────────────────────────────────────────────

    public async getAllPlayers(): Promise<any[]> {
        return Admin.getAllPlayers();
    }
    public subscribeToAllPlayers(callback: (players: any[]) => void): () => void {
        return Admin.subscribeToAllPlayers(this.trackUnsubscribe.bind(this), callback);
    }
    public async sendFeedback(data: any): Promise<void> {
        return Admin.sendFeedback(data);
    }
    public async getAllFeedback(): Promise<any[]> {
        return Admin.getAllFeedback();
    }
    public async searchPlayerById(playerId: string): Promise<any | null> {
        return Admin.searchPlayerById(playerId);
    }
    public async getGlobalPlayers(limitCount = 20): Promise<any[]> {
        return Admin.getGlobalPlayers(limitCount);
    }
    public subscribeToGlobalLeaders(limitCount = 50, callback: (leaders: any[]) => void): () => void {
        return Admin.subscribeToGlobalLeaders(this.trackUnsubscribe.bind(this), limitCount, callback);
    }
    public async updateRemotePlayerData(userId: string, data: any): Promise<void> {
        return Admin.updateRemotePlayerData(userId, data);
    }
    public async sendBroadcastMail(mailData: any): Promise<void> {
        return Admin.sendBroadcastMail(mailData);
    }
}

export const syncService = SyncService.getInstance();
