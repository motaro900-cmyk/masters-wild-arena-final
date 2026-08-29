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

import { useGameStore } from '../store/useGameStore';
import { getVkUserInfo } from '../utils/VKBridge';
import { TimeService } from '../utils/TimeService';
import { bootController } from '../bootstrap/BootController';

export class SyncService {
    // Anchor to window so HMR module reloads reuse the same instance
    private static get instance(): SyncService {
        return (window as any).__SYNC_SERVICE__;
    }
    private static set instance(v: SyncService) {
        (window as any).__SYNC_SERVICE__ = v;
    }
    private syncInterval: any = null;
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private writeChain: Promise<any> = Promise.resolve();
    private pendingActions: string[] = [];
    private logFlushTimeout: ReturnType<typeof setTimeout> | null = null;
    private lastActionsCache: string[] = [];
    private static eventListenersAdded = false;
    private activeUnsubscribes: (() => void)[] = [];
    private syncDisabled: boolean = false;
    private warnedNonVK: boolean = false;
    private isDirty: boolean = true;
    private lastWriteTime: number = 0;

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private trackUnsubscribe(unsub: () => void): () => void {
        this.activeUnsubscribes.push(unsub);
        return () => {
            unsub();
            this.activeUnsubscribes = this.activeUnsubscribes.filter((u) => u !== unsub);
        };
    }

    private async performSyncWithRetry(retries = 3, delay = 1000): Promise<void> {
        // Do not retry if boot is not complete — silently skip
        if (bootController.getState() !== 'READY') {
            console.warn('[SyncService] performSyncWithRetry: skipped (not READY).');
            return;
        }
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
        // Subscribe to Zustand store updates after module initialization completes
        setTimeout(() => {
            if (typeof useGameStore !== 'undefined' && useGameStore.subscribe) {
                useGameStore.subscribe(() => {
                    this.isDirty = true;
                });
            }
        }, 0);

        if (typeof window !== 'undefined' && !SyncService.eventListenersAdded) {
            SyncService.eventListenersAdded = true;

            window.addEventListener('pagehide', () => {
                bootController.execute({ type: 'BEACON_SYNC' }).catch(() => {});
            });
            window.addEventListener('beforeunload', () => {
                bootController.execute({ type: 'BEACON_SYNC' }).catch(() => {});
            });
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    bootController.execute({ type: 'BEACON_SYNC' }).catch(() => {});
                    if (!this.syncDisabled) {
                        bootController.execute({ type: 'SYNC_DATA' }).catch(() => {});
                    }
                }
            });
        }
    }

    public beaconFlush(): void {
        if (this.syncDisabled) return;
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        try {
            const state = useGameStore.getState();
            if (state.isOfflineSession) {
                console.warn('[SyncService] Blocked beacon sync: offline session active.');
                return;
            }
            const isReady = bootController.isReady();
            if (!isReady) {
                console.warn('[SyncService] Blocked beacon sync: Profile is not ready.');
                return;
            }
            const userId = this.getCurrentUserId();
            if (!userId.startsWith('VK-')) return;

            const isLocalhost =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:');

            const criticalPayload = {
                userId,
                energy: state.energy,
                gold: state.gold,
                crystals: state.crystals,
                rating: state.rating,
                wins: state.wins,
                totalBattles: state.totalBattles,
                trophies: state.trophies,
                fullStateJSON: this.buildFullStateJSON(state, TimeService.now()),
                wasOnline: new Date().toISOString(),
                isDev: isLocalhost,
                // Required for server-side VK signature verification.
                // sendBeacon cannot set custom headers, so launchParams travel in the body.
                launchParams: typeof window !== 'undefined' ? window.location.search : '',
            };


            const blob = new Blob([JSON.stringify(criticalPayload)], { type: 'application/json' });
            const beaconSent = navigator.sendBeacon?.('/api/beacon-sync', blob);
            if (!beaconSent) {
                fetch('/api/beacon-sync', {
                    method: 'POST',
                    body: JSON.stringify(criticalPayload),
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                }).catch(() => {});
            }
        } catch (e) {
            // ignore
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

    public async syncPlayerData(force = false): Promise<void> {
        const state = useGameStore.getState();
        if (state.isOfflineSession) {
            console.warn('[SyncService] syncPlayerData: Blocked write since this is an offline session fallback.');
            return Promise.resolve();
        }
        const userId = this.getCurrentUserId();
        if (!userId.startsWith('VK-')) {
            if (!this.warnedNonVK) {
                console.warn('[SyncService] Blocked write for non-VK user:', userId);
                this.warnedNonVK = true;
            }
            return Promise.resolve();
        }
        if (this.syncDisabled) return Promise.resolve();

        if (bootController.getState() !== 'READY') {
            console.warn('[SyncService] syncPlayerData: skipped, BootController not READY.');
            return Promise.resolve();
        }

        // Throttle Firestore writes: min 15 seconds between non-forced writes to prevent network storms
        const now = Date.now();
        const minWriteInterval = 15000;
        if (!force && now - this.lastWriteTime < minWriteInterval) {
            const remaining = minWriteInterval - (now - this.lastWriteTime);
            this.debouncedSync(remaining);
            return Promise.resolve();
        }
        this.lastWriteTime = now;

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
        if (!this.isDirty) {
            return;
        }

        const userId = this.getCurrentUserId();
        if (!userId.startsWith('VK-')) {
            if (!this.warnedNonVK) {
                console.warn('[SyncService] Blocked write for non-VK user:', userId);
                this.warnedNonVK = true;
            }
            return;
        }
        if (this.syncDisabled) return;

        if (bootController.getState() !== 'READY') {
            console.warn('[SyncService] performSync: skipped, BootController not READY.');
            return;
        }

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
            const selectedHeroId = state.selectedHeroId || 'panda';
            const activeAccountLevel = state.level || 1;

            const syncTimestamp = TimeService.now();
            // Also update the store's lastSavedTimestamp so local cache matches
            useGameStore.setState({ lastSavedTimestamp: syncTimestamp, isSystemUpdate: true });

            const fullStateJsonStr = this.buildFullStateJSON(state, syncTimestamp);

            const isLocalhost =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:');

            const vipEndTime = state.vipEndTime || 0;
            const isVipActive = state.vipLevel > 0 && vipEndTime > Date.now();
            const vipDaysRemaining = isVipActive ? Math.ceil((vipEndTime - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

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
                level: activeAccountLevel,
                gold: state.gold || 0,
                crystals: state.crystals || 0,
                rating: state.rating || 0,
                wasOnline: '__serverTimestamp__',
                activeScreen: state.activeScreen || 'MAIN_MENU',
                hero: selectedHeroId,
                avatar: state.avatar || (vkUser ? vkUser.photo200 || vkUser.photo || '' : ''),
                frame: state.frame || 'none',
                equipment: equipmentSlice,
                inventory: state.inventory || [],
                friends: (state.friends || []).map((f: any) => (typeof f === 'object' ? f.id : f)).filter(Boolean),
                fullStateJSON: fullStateJsonStr,
                isTestPlayer: isLocalhost || !!state.isDeveloper || !!state.isAdmin,
                isDeveloper: isLocalhost || !!state.isDeveloper || !!state.isAdmin,
                vipLevel: state.vipLevel || 0,
                isVipActive,
                vipDaysRemaining,
                isNewPlayer: !state.onboardingCompleted,
                energy: state.energy || 0,
                maxEnergy: state.maxEnergy || 0,
                winRate: state.wins && state.totalBattles ? Math.round((state.wins / state.totalBattles) * 100) : 50,
                // Russian legacy keys
                золото: state.gold || 0,
                кристаллы: state.crystals || 0,
                уровень: activeAccountLevel,
                рейтинг: state.rating || 0,
                былВСети: '__serverTimestamp__',
                имя: state.name || 'Мастер',
                фото: state.avatar || (vkUser ? vkUser.photo200 || vkUser.photo || '' : ''),
                инвентарь: state.inventory || [],
                друзья: (state.friends || []).map((f: any) => (typeof f === 'object' ? f.id : f)).filter(Boolean),
                снаряжение: equipmentSlice,
            };

            const response = await fetch('/api/profile-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    isDev: isLocalhost,
                    syncData,
                    launchParams: typeof window !== 'undefined' ? ((window as any).__INITIAL_SEARCH__ || window.location.search) : '',
                }),
            });

            if (!response.ok) {
                throw new Error(`Profile save failed: ${response.statusText}`);
            }

            this.isDirty = false;
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            throw error;
        }
    }

    public debouncedSync(delay = 3000): void {
        if (bootController.getState() !== 'READY') {
            console.warn('[SyncService] debouncedSync: skipped, BootController not READY.');
            return;
        }
        const actualDelay = Math.max(3000, delay);
        if (this.syncDisabled) return;
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.syncPlayerData();
            this.syncTimeout = null;
        }, actualDelay);
    }

    /** Immediate (non-debounced) sync — use after critical events like battle end */
    public immediateSync(): void {
        if (bootController.getState() !== 'READY') {
            console.warn('[SyncService] immediateSync: skipped, BootController not READY.');
            return;
        }
        if (this.syncDisabled) return;
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        this.syncPlayerData(true).catch(() => {});
    }

    public disableSync(): void {
        this.syncDisabled = true;
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
    }

    public startAutoSync(intervalMs = 60000): void {
        if (bootController.getState() !== 'READY') {
            console.warn('[SyncService] startAutoSync: skipped, BootController not READY.');
            return;
        }
        if (this.syncInterval) return;
        const actualInterval = Math.max(10000, intervalMs);
        this.syncPlayerData();
        this.syncInterval = setInterval(() => this.syncPlayerData(), actualInterval);
    }

    public stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        if (this.logFlushTimeout) {
            clearTimeout(this.logFlushTimeout);
            this.logFlushTimeout = null;
        }
        this.activeUnsubscribes.forEach((unsub) => {
            try {
                unsub();
            } catch (e) {
                console.error('[SyncService] Unsubscribe error:', e);
            }
        });
        this.activeUnsubscribes = [];
    }

    // ─── Load player data on login ─────────────────────────────────────────────

    public async loadPlayerData(userId: string): Promise<{ data: any; isNew: boolean; isAdmin?: boolean } | null> {
        try {
            const isLocalhost =
                typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:');

            console.log(`[SyncService] Loading profile via proxy for ${userId}`);
            const launchParamsStr =
                (typeof window !== 'undefined' && ((window as any).__INITIAL_SEARCH__ || window.location.search)) || '';
            const response = await fetch(
                `/api/profile-load?userId=${encodeURIComponent(userId)}&isDev=${isLocalhost}&launchParams=${encodeURIComponent(launchParamsStr)}`,
                {
                    signal: AbortSignal.timeout(3500),
                },
            );

            if (!response.ok) {
                throw new Error(`Profile load HTTP error: ${response.status} ${response.statusText}`);
            }

            const resData = await response.json();

            if (resData.exists) {
                const data = resData.data;
                const wasOnlineMs =
                    data.wasOnline && typeof data.wasOnline.toMillis === 'function'
                        ? data.wasOnline.toMillis()
                        : data.wasOnline?.seconds
                          ? data.wasOnline.seconds * 1000
                          : typeof data.wasOnline === 'string'
                            ? new Date(data.wasOnline).getTime()
                            : data.былВСети && typeof data.былВСети.toMillis === 'function'
                              ? data.былВСети.toMillis()
                              : data.былВСети?.seconds
                                ? data.былВСети.seconds * 1000
                                : typeof data.былВСети === 'string'
                                  ? new Date(data.былВСети).getTime()
                                  : 0;

                const dbFriendIds = (data.friends || [])
                    .map((f: any) => (typeof f === 'object' ? f.id : f))
                    .filter(Boolean);

                // BOOT-CRITICAL FIX: Do NOT resolve friend profiles during startup.
                // resolveFriendProfiles() makes N+1 Firestore requests and can add 1-5s to boot time.
                // We keep raw friend IDs from the player document and resolve them in the background AFTER READY.
                // The FriendsWindow will trigger a refresh when it opens, so this is safe.
                const resolvedFriends: any[] = (data.friends || []).map((f: any) =>
                    typeof f === 'object' ? f : { id: f },
                );

                // Schedule background friend profile resolution after boot completes
                if (dbFriendIds.length > 0) {
                    setTimeout(async () => {
                        try {
                            const { resolveFriendProfiles } = await import('./SocialService');
                            const freshFriends = await resolveFriendProfiles(dbFriendIds);
                            const { useGameStore } = await import('../store/useGameStore');
                            useGameStore.setState({ friends: freshFriends, isSystemUpdate: true });
                            console.log('[SyncService] Background friend profiles resolved:', freshFriends.length);
                        } catch (err) {
                            console.warn('[SyncService] Background friend resolution failed (non-critical):', err);
                        }
                    }, 3000); // 3s after boot starts — by then READY will have occurred
                }

                const mergeFriends = (parsed: any) => {
                    const oldFriends = parsed.friends || [];
                    parsed.friends = resolvedFriends.map((rf) => {
                        const oldFriend = oldFriends.find((of: any) => of.id === rf.id);
                        return {
                            ...oldFriend,
                            ...rf,
                            giftSent: oldFriend ? !!oldFriend.giftSent : false,
                            hasGift: oldFriend ? !!oldFriend.hasGift : false,
                        };
                    });
                };

                let processedData: any = null;

                if (data.полноеСостояниеJSON) {
                    try {
                        const parsed = await new Promise<any>((resolve, reject) => {
                            setTimeout(() => {
                                try {
                                    resolve(JSON.parse(data.полноеСостояниеJSON));
                                } catch (e) {
                                    reject(e);
                                }
                            }, 0);
                        });
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
                        if (parsed.loginStreak === undefined && data.loginStreak !== undefined) {
                            processedData.loginStreak = data.loginStreak;
                        }
                        if (parsed.lastDailyGiftClaimedTime === undefined && data.lastDailyGiftClaimed) {
                            processedData.lastDailyGiftClaimedTime =
                                typeof data.lastDailyGiftClaimed.toMillis === 'function'
                                    ? data.lastDailyGiftClaimed.toMillis()
                                    : data.lastDailyGiftClaimed.seconds
                                      ? data.lastDailyGiftClaimed.seconds * 1000
                                      : typeof data.lastDailyGiftClaimed === 'string'
                                        ? new Date(data.lastDailyGiftClaimed).getTime()
                                        : 0;
                        }
                        if (parsed.lastWheelSpinTime === undefined && data.lastWheelSpinTimeServer) {
                            processedData.lastWheelSpinTime =
                                typeof data.lastWheelSpinTimeServer.toMillis === 'function'
                                    ? data.lastWheelSpinTimeServer.toMillis()
                                    : data.lastWheelSpinTimeServer.seconds
                                      ? data.lastWheelSpinTimeServer.seconds * 1000
                                      : typeof data.lastWheelSpinTimeServer === 'string'
                                        ? new Date(data.lastWheelSpinTimeServer).getTime()
                                        : 0;
                        }
                    } catch (e) {
                        console.error('[SyncService] Failed to parse полноеСостояниеJSON:', e);
                    }
                }

                if (!processedData && data.fullStateJSON) {
                    try {
                        const parsed = await new Promise<any>((resolve, reject) => {
                            setTimeout(() => {
                                try {
                                    resolve(JSON.parse(data.fullStateJSON));
                                } catch (e) {
                                    reject(e);
                                }
                            }, 0);
                        });
                        mergeFriends(parsed);
                        processedData = {
                            ...parsed,
                            wasOnlineMs,
                            isNewPlayer: data.isNewPlayer !== undefined ? data.isNewPlayer : parsed.isNewPlayer,
                        };
                        if (parsed.loginStreak === undefined && data.loginStreak !== undefined) {
                            processedData.loginStreak = data.loginStreak;
                        }
                        if (parsed.lastDailyGiftClaimedTime === undefined && data.lastDailyGiftClaimed) {
                            processedData.lastDailyGiftClaimedTime =
                                typeof data.lastDailyGiftClaimed.toMillis === 'function'
                                    ? data.lastDailyGiftClaimed.toMillis()
                                    : data.lastDailyGiftClaimed.seconds
                                      ? data.lastDailyGiftClaimed.seconds * 1000
                                      : typeof data.lastDailyGiftClaimed === 'string'
                                        ? new Date(data.lastDailyGiftClaimed).getTime()
                                        : 0;
                        }
                        if (parsed.lastWheelSpinTime === undefined && data.lastWheelSpinTimeServer) {
                            processedData.lastWheelSpinTime =
                                typeof data.lastWheelSpinTimeServer.toMillis === 'function'
                                    ? data.lastWheelSpinTimeServer.toMillis()
                                    : data.lastWheelSpinTimeServer.seconds
                                      ? data.lastWheelSpinTimeServer.seconds * 1000
                                      : typeof data.lastWheelSpinTimeServer === 'string'
                                        ? new Date(data.lastWheelSpinTimeServer).getTime()
                                        : 0;
                        }
                        if (
                            (!processedData.dailyQuests || processedData.dailyQuests.length === 0) &&
                            data.dailyQuests?.length > 0
                        ) {
                            processedData.dailyQuests = data.dailyQuests;
                        }
                        if (
                            (!processedData.bpDailyQuests || processedData.bpDailyQuests.length === 0) &&
                            data.bpDailyQuests?.length > 0
                        ) {
                            processedData.bpDailyQuests = data.bpDailyQuests;
                        }
                        if (
                            (!processedData.weeklyQuests || processedData.weeklyQuests.length === 0) &&
                            data.weeklyQuests?.length > 0
                        ) {
                            processedData.weeklyQuests = data.weeklyQuests;
                        }
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

                const isAdmin = resData?.isAdmin || false;
                return { data: processedData, isNew: false, isAdmin };
            }

            const isAdmin = resData?.isAdmin || false;
            const localTimestamp = useGameStore.getState().lastSavedTimestamp || 0;
            if (localTimestamp > TimeService.now() - 60 * 60 * 1000) {
                console.warn('[SyncService] Blocking reset — local save exists from last hour');
                return { data: null, isNew: false, isAdmin };
            }
            return { data: null, isNew: true, isAdmin };
        } catch (error) {
            console.error('[SyncService] Load player data failed:', error);
            throw error;
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
            if (state.isOfflineSession) return;
            const userId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
            if (!userId) return;
            this.writeChain = this.writeChain
                .then(async () => {
                    try {
                        const isLocalhost =
                            typeof window !== 'undefined' &&
                            (window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1' ||
                                window.location.protocol === 'file:');

                        const merged = [...this.lastActionsCache, ...actionsToFlush].slice(-15);
                        this.lastActionsCache = merged;

                        const launchParamsStr = typeof window !== 'undefined' ? ((window as any).__INITIAL_SEARCH__ || window.location.search) : '';
                        const response = await fetch('/api/profile-save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId,
                                isDev: isLocalhost,
                                launchParams: launchParamsStr,
                                syncData: {
                                    lastActions: merged,
                                    wasOnline: '__serverTimestamp__',
                                },
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Logs save failed: ${response.statusText}`);
                        }
                    } catch (error) {
                        console.error('[SyncService] Failed to flush action logs:', error);
                    }
                })
                .catch(() => {});
        }, 5000);
    }

    // ─── Façade: Chat ──────────────────────────────────────────────────────────

    public async sendChatMessage(message: any): Promise<void> {
        const Chat = await import('./ChatService');
        return Chat.sendChatMessage(message);
    }
    public async deletePlayerMessages(playerName: string): Promise<void> {
        const Chat = await import('./ChatService');
        return Chat.deletePlayerMessages(playerName);
    }
    public async wipeGlobalChat(): Promise<void> {
        const Chat = await import('./ChatService');
        return Chat.wipeGlobalChat();
    }
    public subscribeToChat(callback: (messages: any[]) => void): () => void {
        let unsub = () => {};
        import('./ChatService').then((Chat) => {
            unsub = Chat.subscribeToChat(this.trackUnsubscribe.bind(this), callback);
        });
        return () => unsub();
    }
    public async sendPrivateMessage(senderId: string, recipientId: string, message: any): Promise<void> {
        const Chat = await import('./ChatService');
        return Chat.sendPrivateMessage(senderId, recipientId, message);
    }
    public subscribeToPrivateMessages(userId: string, callback: (messages: any[]) => void): () => void {
        let unsub = () => {};
        import('./ChatService').then((Chat) => {
            unsub = Chat.subscribeToPrivateMessages(this.trackUnsubscribe.bind(this), userId, callback);
        });
        return () => unsub();
    }
    public subscribeToClanChat(clanId: string, callback: (messages: any[]) => void): () => void {
        let unsub = () => {};
        import('./ChatService').then((Chat) => {
            unsub = Chat.subscribeToClanChat(this.trackUnsubscribe.bind(this), clanId, callback);
        });
        return () => unsub();
    }

    // ─── Façade: Mail ──────────────────────────────────────────────────────────

    public async sendMail(userId: string, mailData: any): Promise<void> {
        const Mail = await import('./MailService');
        return Mail.sendMail(userId, mailData);
    }
    public async updateMail(userId: string, mailId: string, updates: Partial<any>): Promise<void> {
        const Mail = await import('./MailService');
        return Mail.updateMail(userId, mailId, updates);
    }
    public async deleteMail(userId: string, mailId: string): Promise<void> {
        const Mail = await import('./MailService');
        return Mail.deleteMail(userId, mailId);
    }
    public async updateMultipleMails(userId: string, mailIds: string[], updates: Partial<any>): Promise<void> {
        const Mail = await import('./MailService');
        return Mail.updateMultipleMails(userId, mailIds, updates);
    }
    public subscribeToMail(userId: string, callback: (mails: any[]) => void): () => void {
        let unsub = () => {};
        import('./MailService').then((Mail) => {
            unsub = Mail.subscribeToMail(this.trackUnsubscribe.bind(this), userId, callback);
        });
        return () => unsub();
    }

    // ─── Façade: Social ────────────────────────────────────────────────────────

    public async sendFriendRequest(targetId: string, senderData: any): Promise<boolean> {
        const Social = await import('./SocialService');
        return Social.sendFriendRequest(targetId, senderData);
    }
    public subscribeToFriendRequests(userId: string, callback: (requests: any[]) => void): () => void {
        let unsub = () => {};
        import('./SocialService').then((Social) => {
            unsub = Social.subscribeToFriendRequests(this.trackUnsubscribe.bind(this), userId, callback);
        });
        return () => unsub();
    }
    public async deleteFriendRequest(userId: string, requestId: string): Promise<void> {
        const Social = await import('./SocialService');
        return Social.deleteFriendRequest(userId, requestId);
    }
    public subscribeToOwnProfile(userId: string, callback: (data: any) => void): () => void {
        let unsub = () => {};
        import('./SocialService').then((Social) => {
            unsub = Social.subscribeToOwnProfile(this.trackUnsubscribe.bind(this), userId, callback);
        });
        return () => unsub();
    }
    public async isNicknameUnique(name: string, currentUserId?: string, guestUserId?: string): Promise<boolean> {
        const Social = await import('./SocialService');
        return Social.isNicknameUnique(name, currentUserId, guestUserId);
    }
    public async getPlayerIdByName(name: string): Promise<string | null> {
        const Social = await import('./SocialService');
        return Social.getPlayerIdByName(name);
    }
    public async resolveFriendProfiles(friendIds: string[]): Promise<any[]> {
        const Social = await import('./SocialService');
        return Social.resolveFriendProfiles(friendIds);
    }

    // ─── Façade: Admin ─────────────────────────────────────────────────────────

    public async getAllPlayers(): Promise<any[]> {
        const Admin = await import('./AdminService');
        return Admin.getAllPlayers();
    }
    public subscribeToAllPlayers(callback: (players: any[]) => void): () => void {
        let unsub = () => {};
        import('./AdminService').then((Admin) => {
            unsub = Admin.subscribeToAllPlayers(this.trackUnsubscribe.bind(this), callback);
        });
        return () => unsub();
    }
    public async sendFeedback(data: any): Promise<void> {
        const Admin = await import('./AdminService');
        return Admin.sendFeedback(data);
    }
    public async getAllFeedback(): Promise<any[]> {
        const Admin = await import('./AdminService');
        return Admin.getAllFeedback();
    }
    public async deleteFeedback(id: string): Promise<void> {
        const Admin = await import('./AdminService');
        return Admin.deleteFeedback(id);
    }
    public async searchPlayerById(playerId: string): Promise<any | null> {
        const Admin = await import('./AdminService');
        return Admin.searchPlayerById(playerId);
    }
    public async searchPlayersGlobal(searchTerm: string): Promise<any[]> {
        const Admin = await import('./AdminService');
        return Admin.searchPlayersGlobal(searchTerm);
    }
    public async getGlobalPlayers(limitCount = 20): Promise<any[]> {
        const Admin = await import('./AdminService');
        return Admin.getGlobalPlayers(limitCount);
    }
    public subscribeToGlobalLeaders(limitCount = 50, callback: (leaders: any[]) => void): () => void {
        let unsub = () => {};
        import('./AdminService').then((Admin) => {
            unsub = Admin.subscribeToGlobalLeaders(this.trackUnsubscribe.bind(this), limitCount, callback);
        });
        return () => unsub();
    }
    public async updateRemotePlayerData(userId: string, data: any): Promise<void> {
        const Admin = await import('./AdminService');
        return Admin.updateRemotePlayerData(userId, data);
    }
    public async sendBroadcastMail(mailData: any): Promise<void> {
        const Admin = await import('./AdminService');
        return Admin.sendBroadcastMail(mailData);
    }
    public async distributeSeasonRewards(): Promise<number> {
        const Admin = await import('./AdminService');
        return Admin.distributeSeasonRewards();
    }

    private buildFullStateJSON(state: any, syncTimestamp: number): string {
        const fullState: Record<string, any> = {
            lastSavedTimestamp: syncTimestamp,
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
            lastVipMailClaimDate: state.lastVipMailClaimDate || '',
            lastVipQuestPassDate: state.lastVipQuestPassDate || '',
            dailyAdWatchesCount: state.dailyAdWatchesCount,
            name: state.name,
            lastNameChange: state.lastNameChange,
            avatar: state.avatar,
            frame: state.frame,
            title: state.title,
            bpLevel: state.bpLevel,
            bpExp: state.bpExp,
            friendNotes: state.friendNotes || {},
            trophies: state.trophies,
            wins: state.wins,
            totalBattles: state.totalBattles,
            claimedSocialRewards: state.claimedSocialRewards,
            claimedRankRewards: state.claimedRankRewards || [],
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
            clanData: state.clanData,
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
            loginStreak: state.loginStreak || 0,
            activeBuffs: state.activeBuffs || {},
            dailyQuests: state.dailyQuests,
            bpDailyQuests: state.bpDailyQuests,
            weeklyQuests: state.weeklyQuests,
            lastDailyRefresh: state.lastDailyRefresh,
            lastWeeklyRefresh: state.lastWeeklyRefresh,
            lastWeeklyQuestReset: state.lastWeeklyQuestReset,
            pvpCooldowns: state.pvpCooldowns || {},
            referralProcessed: state.referralProcessed || false,
            referredBy: state.referredBy || null,
            // Options
            musicVolume: state.musicVolume,
            soundVolume: state.soundVolume,
            graphicsQuality: state.graphicsQuality,
            showFps: state.showFps,
            notificationsEnabled: state.notificationsEnabled,
            uiAnimations: state.uiAnimations,
            particlesQuality: state.particlesQuality,
            glowEnabled: state.glowEnabled,
            arenaBgQuality: state.arenaBgQuality,
            showPing: state.showPing,
            isPowerSaving: state.isPowerSaving,
            hasCustomSettings: state.hasCustomSettings,
            rendererPreference: state.rendererPreference,
            fpsCap: state.fpsCap,
            isMuted: state.isMuted,
        };

        const pruned = { ...fullState } as any;

        // Trim logs
        for (const logKey of ['battleLog', 'battleLogs', 'combatLogs']) {
            const rawLog = state[logKey];
            if (rawLog && Array.isArray(rawLog)) {
                pruned[logKey] = rawLog.slice(-10);
            }
        }

        // Remove UI temp states
        delete pruned.activeScreen;
        delete pruned.isLoading;
        delete pruned.alerts;
        delete pruned.alert;
        delete pruned.activeAlert;
        delete pruned.activeConfirm;

        // Trim friends
        if (pruned.friends && Array.isArray(pruned.friends)) {
            if (pruned.friends.length > 50) {
                pruned.friends = pruned.friends.slice(0, 50);
            }
        }
        if (pruned.friendProfiles && Array.isArray(pruned.friendProfiles)) {
            if (pruned.friendProfiles.length > 50) {
                pruned.friendProfiles = pruned.friendProfiles.slice(0, 50);
            }
        }

        return JSON.stringify(pruned);
    }
}

export const syncService = SyncService.getInstance();
