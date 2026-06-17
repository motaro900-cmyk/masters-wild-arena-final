import { initVK, getVkUserInfo } from '../utils/VKBridge';
import { initTelemetry } from '../services/TelemetryService';
import { TimeService } from '../utils/TimeService';

export type BootState = 'INIT' | 'LOAD' | 'READY' | 'FAILED';
export type BootMode = 'STRICT' | 'LENIENT';

export interface BootIssue {
    phase: string;
    severity: 'fatal' | 'warning';
    message: string;
    error?: string;
}

export type BootAction =
    | { type: 'HYDRATE' }
    | { type: 'RESOLVE_VK'; payload: { setNotInVk: (val: boolean) => void; setInitError: (err: string) => void } }
    | { type: 'CREATE_SESSION' }
    | { type: 'LOAD_PROFILE'; payload: { setInitError: (err: string) => void } }
    | { type: 'LOAD_QUESTS' }
    | { type: 'LOAD_OPPONENT' }
    | { type: 'LOAD_CONFIG' }
    | { type: 'LOAD_WEATHER' }
    | { type: 'PRECOMPUTE_HUD' }
    | { type: 'INITIALIZE_SYSTEMS'; payload: { container: HTMLElement } }
    | { type: 'MUTATE_STATE'; payload: { patch: any | ((state: any) => any) } }
    | { type: 'SYNC_DATA' }
    | { type: 'BEACON_SYNC' }
    | { type: 'FLUSH_LOGS'; payload: { text: string } };

class BootController {
    private static instance: BootController;
    private state: BootState = 'INIT';
    private subscribers: Set<(state: BootState) => void> = new Set();
    private initPromise: Promise<void> | null = null;
    private vkUser: any = null;
    private userId: string = '';
    private timeOffset: number = 0;
    private errorText: string | null = null;
    private internalMutationAllowed = false;
    private executionQueue: Promise<any> = Promise.resolve();

    // Invariant state caches
    private remoteProfileData: any = null;
    private needPostBootSync = false;

    // ── Diagnostic system ──────────────────────────────────────────────────
    public bootMode: BootMode = 'STRICT';
    private bootIssues: BootIssue[] = [];

    public recordBootIssue(issue: Omit<BootIssue, 'phase'> & { phase?: string }): void {
        const entry: BootIssue = {
            phase: issue.phase ?? this.state,
            severity: issue.severity,
            message: issue.message,
            error: issue.error,
        };
        this.bootIssues.push(entry);
        if (entry.severity === 'fatal') {
            console.error(`[BootController][FATAL] ${entry.phase}: ${entry.message}`, entry.error ?? '');
        } else {
            console.warn(`[BootController][WARN]  ${entry.phase}: ${entry.message}`);
        }
    }

    public getBootIssues(): Readonly<BootIssue[]> {
        return this.bootIssues;
    }

    public hasFatalIssues(): boolean {
        return this.bootIssues.some(i => i.severity === 'fatal');
    }

    private constructor() {}

    public static getInstance(): BootController {
        if (!BootController.instance) {
            BootController.instance = new BootController();
        }
        return BootController.instance;
    }

    public getState(): BootState {
        return this.state;
    }

    public getErrorText(): string | null {
        return this.errorText;
    }

    public isReady(): boolean {
        return this.state === 'READY';
    }

    public isMutationAllowed(): boolean {
        return this.state === 'READY' || this.internalMutationAllowed;
    }

    public isKernelExecuting(): boolean {
        return this.internalMutationAllowed;
    }

    public setNeedPostBootSync(val: boolean): void {
        this.needPostBootSync = val;
    }

    public getNeedPostBootSync(): boolean {
        return this.needPostBootSync;
    }

    public subscribe(cb: (state: BootState) => void): () => void {
        this.subscribers.add(cb);
        return () => {
            this.subscribers.delete(cb);
        };
    }

    private transition(newState: BootState) {
        console.log(`[BootController] Transition: ${this.state} ➔ ${newState}`);
        this.state = newState;
        this.subscribers.forEach(cb => cb(this.state));
    }

    public execute(action: BootAction): Promise<any> {
        return new Promise((resolve, reject) => {
            this.executionQueue = this.executionQueue
                .then(async () => {
                    try {
                        const result = await this.runAction(action);
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                })
                .catch(() => {});
        });
    }

    private async runAction(action: BootAction): Promise<any> {
        console.log(`[BootController] Kernel Executing Action: ${action.type}`);
        
        const runWithKernelLock = async (fn: () => Promise<any> | any) => {
            const previousLock = this.internalMutationAllowed;
            this.internalMutationAllowed = true;
            try {
                return await fn();
            } finally {
                this.internalMutationAllowed = previousLock;
            }
        };

        return runWithKernelLock(async () => {
            switch (action.type) {
                case 'HYDRATE': {
                    if (this.state !== 'INIT') {
                        throw new Error(`[BootController] Invalid boot phase for HYDRATE: ${this.state}`);
                    }
                    const { useGameStore } = await import('../store/useGameStore');
                    return await useGameStore.persist.rehydrate();
                }
                case 'RESOLVE_VK': {
                    if (this.state !== 'INIT') {
                        throw new Error(`[BootController] Invalid boot phase for RESOLVE_VK: ${this.state}`);
                    }
                    return await this.resolveVK(action.payload.setNotInVk, action.payload.setInitError);
                }
                case 'CREATE_SESSION': {
                    if (this.state !== 'INIT') {
                        throw new Error(`[BootController] Invalid boot phase for CREATE_SESSION: ${this.state}`);
                    }
                    const { useGameStore } = await import('../store/useGameStore');
                    const sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
                    useGameStore.setState({ sessionToken, sessionConflict: false, isSystemUpdate: true });
                    return;
                }
                case 'LOAD_PROFILE': {
                    if (this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for LOAD_PROFILE: ${this.state}`);
                    }
                    return await this.loadProfile(action.payload.setInitError);
                }
                case 'LOAD_QUESTS': {
                    if (this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for LOAD_QUESTS: ${this.state}`);
                    }
                    return await this.loadQuests();
                }
                case 'LOAD_OPPONENT': {
                    if (this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for LOAD_OPPONENT: ${this.state}`);
                    }
                    return await this.loadOpponent();
                }
                case 'LOAD_CONFIG': {
                    if (this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for LOAD_CONFIG: ${this.state}`);
                    }
                    return await this.loadConfig();
                }
                case 'LOAD_WEATHER': {
                    if (this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for LOAD_WEATHER: ${this.state}`);
                    }
                    return await this.loadWeather();
                }
                case 'PRECOMPUTE_HUD': {
                    return await this.precomputeHUD();
                }
                case 'INITIALIZE_SYSTEMS': {
                    return await this.ready(action.payload.container);
                }
                case 'MUTATE_STATE': {
                    const { useGameStore } = await import('../store/useGameStore');
                    const patch = action.payload.patch;
                    if (typeof patch === 'function') {
                        return useGameStore.setState(patch);
                    } else {
                        return useGameStore.setState({ ...patch, isSystemUpdate: true });
                    }
                }
                case 'SYNC_DATA': {
                    const { syncService } = await import('../services/SyncService');
                    return await syncService.syncPlayerData();
                }
                case 'BEACON_SYNC': {
                    const { syncService } = await import('../services/SyncService');
                    return syncService.beaconFlush();
                }
                case 'FLUSH_LOGS': {
                    const { syncService } = await import('../services/SyncService');
                    return await syncService.logPlayerAction(action.payload.text);
                }
                default:
                    throw new Error(`[BootController] Unknown action type: ${(action as any).type}`);
            }
        });
    }

    public async start(
        container: HTMLElement,
        setLoadingText: (t: string) => void,
        setInitError: (err: string) => void,
        setNotInVk: (val: boolean) => void
    ): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                console.log('[BootController] Starting boot pipeline...');
                this.errorText = null;
                this.bootIssues = [];

                // ── PHASE 1: INIT ──────────────────────────────────────────
                this.transition('INIT');
                setLoadingText('Загрузка локального кэша...');
                await this.execute({ type: 'HYDRATE' });

                setLoadingText('Авторизация и подключение к VK Bridge...');
                await this.execute({ type: 'RESOLVE_VK', payload: { setNotInVk, setInitError } });

                setLoadingText('Создание сессионного контекста...');
                await this.execute({ type: 'CREATE_SESSION' });

                // ── PHASE 2: LOAD ──────────────────────────────────────────
                this.transition('LOAD');

                // ── LOAD_PROFILE ───────────────────────────────────────────
                setLoadingText('Загрузка игрового профиля...');
                await this.execute({ type: 'LOAD_PROFILE', payload: { setInitError } });
                const { useGameStore } = await import('../store/useGameStore');
                const profileState = useGameStore.getState();

                // FATAL: no player identity — game cannot run without this
                if (!profileState.playerId) {
                    this.recordBootIssue({ phase: 'LOAD_PROFILE', severity: 'fatal', message: 'playerId is missing — player identity undefined' });
                }
                // WARNING: cosmetic / non-critical fields
                if (!profileState.name) {
                    this.recordBootIssue({ phase: 'LOAD_PROFILE', severity: 'warning', message: 'name is missing — will use fallback' });
                }
                if (!profileState.avatar) {
                    this.recordBootIssue({ phase: 'LOAD_PROFILE', severity: 'warning', message: 'avatar is missing — will use fallback' });
                }
                if (!profileState.level) {
                    this.recordBootIssue({ phase: 'LOAD_PROFILE', severity: 'warning', message: 'level is 0/missing — defaulting to 1' });
                }

                // ── LOAD_TELEMETRY ─────────────────────────────────────────
                setLoadingText('Анализ производительности устройства...');
                const { getDeviceProfile } = await import('../services/TelemetryService');
                try {
                    const profile = await getDeviceProfile();
                    console.log(`[BootController] Device Profile loaded. OS: ${profile.os}, Refresh Rate: ${profile.refreshRate}Hz`);
                    if (!profileState.hasCustomSettings) {
                        const isMobileOrTablet = profile.touchDevice || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
                        const recommendedFpsCap = isMobileOrTablet ? 60 : (profile.refreshRate || 60);
                        useGameStore.setState({
                            fpsCap: recommendedFpsCap,
                            isSystemUpdate: true
                        });
                        console.log(`[BootController] Auto-configured recommended FPS: ${recommendedFpsCap}`);
                    }
                } catch (telemetryErr) {
                    console.warn('[BootController] Telemetry failed to load:', telemetryErr);
                }

                // ── LOAD_QUESTS ────────────────────────────────────────────
                setLoadingText('Загрузка ежедневных заданий...');
                await this.execute({ type: 'LOAD_QUESTS' });
                const questState = useGameStore.getState();
                if (!(questState.dailyQuests && questState.dailyQuests.length > 0)) {
                    // FATAL in STRICT — no quests means broken progression
                    // LENIENT — warn and continue (dev mode)
                    this.recordBootIssue({
                        phase: 'LOAD_QUESTS',
                        severity: this.bootMode === 'STRICT' ? 'fatal' : 'warning',
                        message: 'dailyQuests is empty after LOAD_QUESTS',
                    });
                }

                // ── LOAD_OPPONENT ──────────────────────────────────────────
                setLoadingText('Загрузка данных оппонента...');
                await this.execute({ type: 'LOAD_OPPONENT' });

                // ── LOAD_CONFIG ────────────────────────────────────────────
                setLoadingText('Синхронизация игрового конфига...');
                await this.execute({ type: 'LOAD_CONFIG' });

                // ── LOAD_WEATHER ───────────────────────────────────────────
                setLoadingText('Определение погодных условий...');
                await this.execute({ type: 'LOAD_WEATHER' });
                const weatherState = useGameStore.getState();
                const weatherMap: Record<string, string> = {
                    forest: 'rain', desert: 'sandstorm',
                    lava: 'ashfall', snow: 'blizzard', meadow: 'clear',
                };
                if (!(weatherState.activeMapId && weatherState.battleWeatherState && weatherMap[weatherState.activeMapId] === weatherState.battleWeatherState)) {
                    // WARNING only — weather is non-critical cosmetic state
                    this.recordBootIssue({ phase: 'LOAD_WEATHER', severity: 'warning', message: `Weather mismatch: map=${weatherState.activeMapId}, got=${weatherState.battleWeatherState}` });
                }

                // ── PRECOMPUTE_HUD ─────────────────────────────────────────
                setLoadingText('Подготовка интерфейса...');
                await this.execute({ type: 'PRECOMPUTE_HUD' });
                const hudState = useGameStore.getState();
                const { getRankInfo } = await import('../configs/RankSystem');
                const rankInfo = getRankInfo(hudState.rating || hudState.trophies || 0);
                const avatarMatches = hudState.hudPlayerAvatar === hudState.avatar || (hudState.avatar && hudState.avatar.startsWith('sprite:') && hudState.hudPlayerAvatar === (hudState.vkUser?.photo200 || hudState.vkUser?.photo_200 || hudState.vkUser?.photo || '/assets/images/avatars/panda.webp'));
                const rankMatches = hudState.hudPlayerRank && hudState.hudPlayerRank.name === rankInfo.name;
                const opponentResolved = !hudState.activeRankedOpponent || (hudState.hudEnemyLevel === hudState.activeRankedOpponent.level && hudState.hudEnemyRating === hudState.activeRankedOpponent.rating);
                if (!(avatarMatches && rankMatches && opponentResolved)) {
                    // WARNING only — HUD values are cosmetic, game can recover them
                    this.recordBootIssue({ phase: 'PRECOMPUTE_HUD', severity: 'warning', message: 'HUD derived values have inconsistencies' });
                }

                // ── SESSION CHECK ──────────────────────────────────────────
                const finalState = useGameStore.getState();
                if (!finalState.sessionToken) {
                    // FATAL — session is required for sync and security
                    this.recordBootIssue({ phase: 'CREATE_SESSION', severity: 'fatal', message: 'sessionToken is missing — session was not created' });
                }

                // ── READY GATE ─────────────────────────────────────────────
                // READY is only allowed if no fatal issues were recorded
                if (this.hasFatalIssues()) {
                    const fatalIssues = this.bootIssues.filter(i => i.severity === 'fatal');
                    const rootCause = {
                        phase: fatalIssues[0].phase,
                        error: fatalIssues[0].message,
                        allIssues: this.bootIssues,
                        stateSnapshot: {
                            playerId: finalState.playerId,
                            name: finalState.name,
                            level: finalState.level,
                            sessionToken: finalState.sessionToken,
                            dailyQuestsCount: finalState.dailyQuests?.length ?? 0,
                        },
                    };
                    console.error('BOOT FAILURE ROOT CAUSE:', rootCause);
                    throw new Error(`[BootController] Boot blocked by ${fatalIssues.length} fatal issue(s): ${fatalIssues.map(i => i.message).join(' | ')}`);
                }

                // All non-fatal — proceed to READY
                setLoadingText('Инициализация игровых систем...');
                await this.execute({ type: 'INITIALIZE_SYSTEMS', payload: { container } });

            } catch (err: any) {
                console.error('[BootController] Fatal boot error:', err);
                this.initPromise = null;
                this.remoteProfileData = null;
                // Capture full root cause report
                let snap: any = {};
                try {
                    const { useGameStore } = await import('../store/useGameStore');
                    const s = useGameStore.getState();
                    snap = { playerId: s.playerId, name: s.name, level: s.level, sessionToken: s.sessionToken, dailyQuestsCount: s.dailyQuests?.length ?? 0 };
                } catch (_) {}
                const rootCause = {
                    phase: this.state,
                    error: err instanceof Error ? err.stack : JSON.stringify(err),
                    bootIssues: this.bootIssues,
                    stateSnapshot: snap,
                };
                console.error('BOOT FAILURE ROOT CAUSE:', rootCause);
                this.transition('FAILED');
                this.errorText = err.message || 'Ошибка запуска игры';
                setInitError(this.errorText ?? 'Ошибка запуска игры');
                return;
            }
        })();

        return this.initPromise;
    }

    public async resolveVK(setNotInVk: (val: boolean) => void, _setInitError: (err: string) => void): Promise<void> {
        await initVK();
        
        try {
            initTelemetry();
        } catch (e) {
            console.error('Failed to init telemetry:', e);
        }

        // Calibrate server time
        try {
            const start = Date.now();
            const response = await fetch('/api/time', {
                method: 'GET',
                cache: 'no-cache',
                signal: AbortSignal.timeout(3000),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.serverTime) {
                    const latency = (Date.now() - start) / 2;
                    this.timeOffset = data.serverTime + latency - Date.now();
                    console.log('[BootController] Calibrated server time offset:', this.timeOffset);
                    TimeService.setOffset(this.timeOffset);
                }
            }
        } catch (e) {
            console.warn('[BootController] Calibrate time failed, falling back to local clock');
        }

        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.protocol === 'file:';

        if (isLocalhost) {
            console.log('[BootController] Localhost detected, skipping signature verify');
            return;
        }

        // Verify VK Signature
        try {
            const searchParams = window.location.search;
            if (searchParams) {
                const response = await fetch(`/api/verify-sign${searchParams}`);
                if (!response.ok) {
                    throw new Error(`Signature check endpoint returned ${response.status}`);
                }
                const data = await response.json();
                if (data && data.valid === false) {
                    throw new Error('Invalid signature');
                }
            }
        } catch (err: any) {
            throw new Error('Ошибка безопасности: параметры запуска не прошли верификацию. Пожалуйста, перезапустите игру из официального приложения ВКонтакте.');
        }

        // Fetch VK User Profile Info
        try {
            this.vkUser = await getVkUserInfo();
            if (this.vkUser) {
                const { useGameStore } = await import('../store/useGameStore');
                useGameStore.setState({ vkUser: this.vkUser, isSystemUpdate: true });
                if (this.vkUser.photo200 || this.vkUser.photo) {
                    useGameStore.setState({ avatar: this.vkUser.photo200 || this.vkUser.photo, isSystemUpdate: true });
                }
            } else {
                throw new Error('VK getVkUserInfo returned empty object');
            }
        } catch (vkErr) {
            const { isVkMiniApp } = await import('../utils/VKBridge');
            if (isVkMiniApp()) {
                throw new Error('Не удалось получить ваш профиль ВКонтакте. Проверьте интернет-подключение и попробуйте снова.');
            } else {
                setNotInVk(true);
                throw new Error('Standalone launch restricted');
            }
        }
    }

    public async loadProfile(_setInitError: (err: string) => void): Promise<void> {
        const { syncService, SyncService } = await import('../services/SyncService');
        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();
        
        let playerId = state.playerId;
        if (!playerId || playerId === 'undefined' || playerId === 'null' || playerId.includes('undefined')) {
            playerId = `GUEST-${TimeService.now()}-${Math.random().toString(36).substr(2, 9)}`;
            useGameStore.setState({ playerId, isSystemUpdate: true });
        }
        
        this.userId = SyncService.getPrefixedUserId(this.vkUser, playerId);

        try {
            const remoteResult = await syncService.loadPlayerData(this.userId);
            
            // Read raw local storage cache
            const cacheRaw = localStorage.getItem('game-storage');
            let cacheState: any = null;
            if (cacheRaw) {
                try {
                    const parsed = JSON.parse(cacheRaw);
                    cacheState = parsed?.state;
                } catch (e) {
                    console.error('[BootController] Failed to parse raw cache');
                }
            }

            // Invariant profile resolution rule
            if (remoteResult && !remoteResult.isNew && remoteResult.data) {
                console.log('[BootController] Firebase profile exists. Hydrating state from Firebase snapshot.');
                const fbProfile = remoteResult.data;
                this.remoteProfileData = fbProfile;
                const stateToRestore = { ...fbProfile };
                stateToRestore.lastSavedTimestamp = fbProfile.lastSavedTimestamp || fbProfile.wasOnlineMs || 0;
                
                if (stateToRestore.status === 'BANNED') {
                    stateToRestore.isBanned = true;
                }

                if ((!stateToRestore.name || stateToRestore.name === 'Мастер') && this.vkUser) {
                    stateToRestore.name = this.vkUser.firstName || this.vkUser.first_name;
                }
                if ((!stateToRestore.avatar || stateToRestore.avatar.startsWith('sprite:')) && this.vkUser) {
                    stateToRestore.avatar = this.vkUser.photo200 || this.vkUser.photo;
                }

                stateToRestore.vkUser = this.vkUser;
                stateToRestore.activeScreen = fbProfile.isNewPlayer === true ? 'INTRO' : 'MAIN_MENU';
                stateToRestore.onboardingCompleted = fbProfile.isNewPlayer !== true;

                // Reset and apply remote profile
                useGameStore.getState().resetStore();
                stateToRestore.isSystemUpdate = true;
                useGameStore.setState(stateToRestore);
            } else if (cacheState && cacheState.lastSavedTimestamp) {
                console.log('[BootController] No Firebase snapshot found, falling back to local cache.');
                useGameStore.getState().resetStore();
                cacheState.vkUser = this.vkUser;
                cacheState.isSystemUpdate = true;
                useGameStore.setState(cacheState);
            } else {
                console.log('[BootController] New player profile creation.');
                useGameStore.getState().resetStore();
                const fallbackName = this.vkUser?.firstName || this.vkUser?.first_name || `Игрок_${this.userId.slice(-4)}`;
                useGameStore.setState({
                    name: fallbackName,
                    onboardingCompleted: false,
                    tutorialStep: 0,
                    activeScreen: 'INTRO',
                    vkUser: this.vkUser,
                    isSystemUpdate: true
                });
            }
        } catch (error) {
            console.error('[BootController] Firebase snapshot load failed. Resolving to cache fallback.', error);
            const cacheRaw = localStorage.getItem('game-storage');
            let cacheState: any = null;
            if (cacheRaw) {
                try {
                    const parsed = JSON.parse(cacheRaw);
                    cacheState = parsed?.state;
                } catch (e) {}
            }

            if (cacheState && cacheState.lastSavedTimestamp) {
                useGameStore.getState().resetStore();
                cacheState.vkUser = this.vkUser;
                cacheState.isSystemUpdate = true;
                useGameStore.setState(cacheState);
            } else {
                throw new Error('Критическая ошибка: не удалось получить данные профиля из сети и отсутствует локальное сохранение.');
            }
        }

        // Apply profile fallback generator inside LOAD phase
        await this.fallbackProfileGenerator();

        // Calculate and apply admin status
        const finalState = useGameStore.getState();
        const isAdmin = await this.resolveAdminStatus(finalState.playerId);
        useGameStore.setState({
            isAdmin,
            isDeveloper: isAdmin,
            isSystemUpdate: true
        });

        useGameStore.setState({ profileStatus: 'loaded', isSystemUpdate: true });
    }

    private async resolveAdminStatus(playerId: string): Promise<boolean> {
        const isLocalhost =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.startsWith('192.168.') ||
                window.location.hostname.startsWith('10.') ||
                window.location.hostname.endsWith('.local') ||
                window.location.protocol === 'file:');

        // 1. Hardcoded Player ID bypass
        if (playerId === 'MW-UMW2N0RWZ') {
            console.log('[BootController] Admin status GRANTED via hardcoded Player ID bypass');
            return true;
        }

        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();
        
        // 2. Hardcoded VK ID bypass
        const userVkId = this.vkUser?.id || this.vkUser?.uid || state.vkUser?.id || state.vkUser?.uid;
        if (userVkId && Number(userVkId) === 212359386) {
            console.log('[BootController] Admin status GRANTED via hardcoded VK ID bypass');
            return true;
        }

        // 3. Localhost bypass
        if (isLocalhost) {
            console.log('[BootController] Admin status GRANTED via localhost bypass');
            return true;
        }

        // 4. Firestore whitelist query
        try {
            const { db } = await import('../utils/firebase');
            const { doc, getDoc } = await import('firebase/firestore');
            const adminDocRef = doc(db, 'system', 'admins');
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists()) {
                const adminData = adminDocSnap.data();
                const vkIds = adminData?.vkIds || [];
                if (userVkId && vkIds.map(Number).includes(Number(userVkId))) {
                    console.log('[BootController] Admin status GRANTED via Firestore whitelist');
                    return true;
                }
            }
        } catch (err) {
            console.warn('[BootController] Failed to query Firestore admin whitelist:', err);
        }

        return false;
    }

    private async fallbackProfileGenerator(): Promise<void> {
        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();
        const vkUser = state.vkUser;

        let playerId = state.playerId;
        if (!playerId || playerId === 'undefined' || playerId === 'null' || playerId.includes('undefined')) {
            playerId = vkUser?.id ? `VK-${vkUser.id}` : `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        let name = state.name;
        if (!name || name === 'Мастер' || name === '') {
            name = vkUser?.firstName || vkUser?.first_name || `Игрок_${playerId.slice(-4)}`;
        }

        let avatar = state.avatar;
        if (!avatar || avatar === 'none' || avatar === '' || avatar.startsWith('sprite:')) {
            avatar = vkUser?.photo200 || vkUser?.photo_200 || vkUser?.photo || 'sprite:sprite-avatar avatar-pos-1';
        }

        let level = state.level || 1;
        if (level <= 0) {
            level = 1;
        }

        useGameStore.setState({
            playerId,
            name,
            avatar,
            level,
            isSystemUpdate: true
        });
        console.log('[BootController] Profile fallbacks applied:', { playerId, name, avatar, level });
    }

    private async loadQuests(): Promise<void> {
        const { useGameStore } = await import('../store/useGameStore');

        // Get quests from remote profile data
        const fbQuests = this.remoteProfileData?.dailyQuests;
        const fbBpQuests = this.remoteProfileData?.bpDailyQuests;
        const fbWeekly = this.remoteProfileData?.weeklyQuests;

        if (fbQuests && fbQuests.length > 0) {
            console.log('[BootController] Restoring quests from Firestore snapshot (Daily Quests Rule enforced).');
            useGameStore.setState({
                dailyQuests: fbQuests,
                bpDailyQuests: fbBpQuests || [],
                weeklyQuests: fbWeekly || [],
                lastDailyRefresh: this.remoteProfileData.lastDailyRefresh || Date.now(),
                lastWeeklyQuestReset: this.remoteProfileData.lastWeeklyQuestReset || Date.now(),
                isSystemUpdate: true
            });

            // Verify local state consistency
            const state = useGameStore.getState();
            if (!state.dailyQuests || state.dailyQuests.length === 0) {
                console.warn('[BootController] Quest mismatch: state empty but backend had data. Continuing boot.');
            }
        } else {
            console.log('[BootController] Generating quests in memory (Guest/New/Offline).');
            const { QUESTS_POOL, BP_DAILY_QUESTS_POOL } = await import('../configs/QuestsConfig');
            const { WEEKLY_QUESTS_POOL } = await import('../store/slices/questSlice');
            
            const shuffled = [...QUESTS_POOL].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 4).map((q) => ({
                questId: q.id,
                progress: 0,
                isClaimed: false,
            }));

            const shuffledBp = [...BP_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
            const selectedBp = shuffledBp.slice(0, 4).map((q) => ({
                questId: q.id,
                progress: 0,
                isClaimed: false,
            }));

            const weekly = WEEKLY_QUESTS_POOL.map((q) => ({
                questId: q.id,
                progress: 0,
                isClaimed: false,
            }));

            useGameStore.setState({
                dailyQuests: selected,
                bpDailyQuests: selectedBp,
                weeklyQuests: weekly,
                lastDailyRefresh: Date.now(),
                lastWeeklyQuestReset: Date.now(),
                isSystemUpdate: true
            });
        }
    }

    private async loadOpponent(): Promise<void> {
        const { useGameStore } = await import('../store/useGameStore');
        const { matchmakingService } = await import('../services/MatchmakingService');
        const state = useGameStore.getState();

        console.log('[BootController] Fetching matchmaking opponent data...');
        const opponent = await matchmakingService.findOpponent(
            this.userId,
            state.rating || 0,
            state.level || 1,
            50,
            null,
            state.winStreak || 0,
            state.lossStreak || 0
        );

        useGameStore.setState({
            activeRankedOpponent: opponent,
            isSystemUpdate: true
        });
        console.log('[BootController] Loaded opponent data:', opponent.name);
    }

    private async loadConfig(): Promise<void> {
        console.log('[BootController] Fetching/verifying game configurations...');
        const { HEROES_DB } = await import('../configs/HeroesConfig');
        const { MOBS_DB } = await import('../configs/MobsConfig');
        const { ITEMS_DATABASE } = await import('../game/configs/ItemsConfig');
        const { RANK_SYSTEM } = await import('../configs/RankSystem');
        
        if (!HEROES_DB || !MOBS_DB || !ITEMS_DATABASE || !RANK_SYSTEM) {
            throw new Error('[Security Invariant Violation] Game configuration database failed to load.');
        }
        console.log('[BootController] Game configurations verified.');
    }

    private async loadWeather(): Promise<void> {
        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();

        const activeMapId = state.activeMapId || 'forest';
        
        const weatherMap: Record<string, string> = {
            forest: 'rain',
            desert: 'sandstorm',
            lava: 'ashfall',
            snow: 'blizzard',
            meadow: 'clear'
        };

        const weather = weatherMap[activeMapId];
        if (!weather) {
            throw new Error(`[Security Invariant Violation] Weather state is undefined for map: ${activeMapId}`);
        }

        useGameStore.setState({
            activeMapId,
            battleWeatherState: weather,
            isSystemUpdate: true
        });
        console.log('[BootController] Weather derived successfully:', { activeMapId, battleWeatherState: weather });
    }

    private async precomputeHUD(): Promise<void> {
        const { useGameStore } = await import('../store/useGameStore');
        const { getRankInfo } = await import('../configs/RankSystem');
        const state = useGameStore.getState();

        console.log('[BootController] Precomputing HUD derived values...');
        const selectedHeroId = state.selectedHeroId || 'panda';
        const heroLevel = state.heroes?.[selectedHeroId]?.level || 1;
        const playerRating = state.rating || state.trophies || 0;
        const playerRank = getRankInfo(playerRating);
        const rawAvatar = state.avatar;
        const vkUser = state.vkUser;

        const playerAvatar = (rawAvatar && !rawAvatar.startsWith('sprite:')) 
            ? rawAvatar 
            : (vkUser?.photo200 || vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp');

        const activeRankedOpponent = state.activeRankedOpponent;

        let enemyLevel = 1;
        let enemyRating = 0;
        if (state.battleMode === 'PVE' && state.activePveEnemy) {
            enemyLevel = state.activePveEnemy.level || 1;
            enemyRating = Math.max(0, enemyLevel * 180);
        } else if ((state.battleMode === 'RANKED' || state.battleMode === 'WARMUP') && activeRankedOpponent) {
            enemyLevel = activeRankedOpponent.level || 1;
            enemyRating = activeRankedOpponent.rating || 0;
        } else {
            enemyLevel = Math.max(1, heroLevel);
            enemyRating = Math.max(0, playerRating);
        }

        const enemyRank = getRankInfo(enemyRating);
        let enemyAvatar = '/assets/images/avatars/wolf.webp';
        if (state.battleMode === 'PVE' && state.activePveEnemy) {
            enemyAvatar = state.activePveEnemy.image || '/assets/images/avatars/wolf.webp';
        } else if (activeRankedOpponent?.avatar) {
            enemyAvatar = activeRankedOpponent.avatar;
        }

        useGameStore.setState({
            hudPlayerRank: playerRank,
            hudPlayerAvatar: playerAvatar,
            hudEnemyLevel: enemyLevel,
            hudEnemyRating: enemyRating,
            hudEnemyRank: enemyRank,
            hudEnemyAvatar: enemyAvatar,
            hudPrecomputed: true,
            isSystemUpdate: true
        });
        console.log('[BootController] HUD derived values precomputed successfully.');
    }

    public async ready(container: HTMLElement): Promise<void> {
        // Initialize Game Systems
        const { initGameSystems, setupReferralAndGifts } = await import('./initGameSystems');
        initGameSystems(this.timeOffset);

        // Initialize Pixi Engine
        const GameAppClass = (await import('../GameApp')).GameApp;
        const game = new GameAppClass();
        await game.init(container);

        // Setup real-time subscriptions
        const { initSubscriptions } = await import('./initSubscriptions');
        const { SyncService } = await import('../services/SyncService');
        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();
        const prefixedId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);
        await initSubscriptions(this.userId, prefixedId);
        setupReferralAndGifts();

        // Transition to READY status
        this.transition('READY');
        
        // NOW, since we are READY, direct writes are allowed.
        // Save seen welcome messages flag
        const welcomeKey = `seen_welcome_msgs_${state.playerId}`;
        window.localStorage.setItem(welcomeKey, 'true');

        // Start auto-synchronization
        const { syncService } = await import('../services/SyncService');
        
        // Always perform an initial sync on startup to register the active session token and set online status
        console.log('[BootController] Performing initial startup session sync...');
        await syncService.syncPlayerData();
        this.needPostBootSync = false;

        syncService.startAutoSync(60000);
    }
}

export const bootController = BootController.getInstance();
