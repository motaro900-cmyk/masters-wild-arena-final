import { initVK, getVkUserInfo, isVkMiniApp } from '../utils/VKBridge';
import { initTelemetry } from '../services/TelemetryService';
import { TimeService } from '../utils/TimeService';
import { safeGetItem } from '../utils/SafeStorage';

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

// Helper for fetching with retries (used by resolveVK and calibrateTime)
const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries: number = 3,
    delay: number = 1500,
): Promise<Response> => {
    let lastErr: any = null;
    for (let i = 0; i < retries; i++) {
        const start = Date.now();
        try {
            console.log(`[BootController] Fetching ${url} (Attempt ${i + 1}/${retries})...`);
            const response = await fetch(url, options);
            const duration = Date.now() - start;
            console.log(`[BootController] Fetch ${url} (Attempt ${i + 1}/${retries}) resolved in ${duration}ms. Status: ${response.status} (${response.statusText})`);
            if (response.ok) return response;
            throw new Error(`Server returned status ${response.status}`);
        } catch (err: any) {
            const duration = Date.now() - start;
            lastErr = err;
            console.warn(
                `[BootController] Fetch attempt ${i + 1}/${retries} failed for ${url} in ${duration}ms. Error: ${err.message || err}`,
            );
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastErr || new Error(`Failed to fetch ${url} after ${retries} attempts`);
};

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
    private bootStartTime: number = 0;
    private assetPreloadPromise: Promise<void> | null = null;

    // ── Diagnostic system ──────────────────────────────────────────────────
    public bootMode: BootMode = 'STRICT';
    private bootIssues: BootIssue[] = [];
    private diagnostics: Record<string, { start: number; end?: number; duration?: number; status?: string; error?: string }> = {};

    public startDiagnostic(step: string): void {
        this.diagnostics[step] = { start: Date.now() };
        if (window.location.search.includes('debugStartup=true')) {
            console.log(`[Diagnostics] 🚀 Starting step: ${step} at ${new Date().toISOString()}`);
        }
    }

    public endDiagnostic(step: string, status: 'SUCCESS' | 'ERROR', errorMsg?: string): void {
        const diag = this.diagnostics[step];
        if (!diag) return;
        diag.end = Date.now();
        diag.duration = diag.end - diag.start;
        diag.status = status;
        if (errorMsg) diag.error = errorMsg;
        if (window.location.search.includes('debugStartup=true')) {
            console.log(`[Diagnostics] 🏁 Step ${step} completed in ${diag.duration}ms. Status: ${status}${errorMsg ? ` (Error: ${errorMsg})` : ''}`);
        }
    }

    public printDiagnosticReport(): void {
        console.log('[Diagnostics] 📊 STARTUP PERFORMANCE REPORT:');
        Object.entries(this.diagnostics).forEach(([step, data]) => {
            console.log(` - ${step.padEnd(25)}: ${String(data.duration ?? 'Pending/Timeout').padStart(6)}ms | Status: ${data.status || 'UNKNOWN'} | Error: ${data.error || '-'}`);
        });
    }

    public getDiagnosticSummary(): string {
        const totalDuration = Date.now() - this.bootStartTime;
        const stepsReport = Object.entries(this.diagnostics).map(([step, data]) => {
            const dur = data.duration !== undefined ? `${(data.duration / 1000).toFixed(2)}s` : 'Timeout/Pending';
            return `${step.padEnd(22)}: ${data.status === 'SUCCESS' ? 'OK' : 'FAILED'} (${dur})${data.error ? ` - Error: ${data.error}` : ''}`;
        }).join('\n');

        const searchParams = new URLSearchParams(window.location.search);
        const vkParams = Array.from(searchParams.keys())
            .filter((key) => key.startsWith('vk_') || key === 'sign')
            .join(', ');

        const connection = (navigator as any).connection;
        const connectionInfo = connection
            ? `effectiveType: ${connection.effectiveType}, downlink: ${connection.downlink}Mb/s, rtt: ${connection.rtt}ms`
            : 'Not available';

        const env = [
            `User Agent: ${navigator.userAgent}`,
            `Platform  : ${navigator.platform}`,
            `Is VK App : ${isVkMiniApp()}`,
            `Online    : ${navigator.onLine}`,
            `Connection: ${connectionInfo}`,
            `Current URL: ${window.location.origin}${window.location.pathname}`,
            `VK Params : ${vkParams || 'None'}`,
        ].join('\n- ');

        const failedStep = Object.entries(this.diagnostics).find(([_, d]) => d.status === 'ERROR');
        const finalStatus = failedStep ? 'FAILED' : 'SUCCESS';

        return [
            `================ STARTUP REPORT ================`,
            `Total duration : ${(totalDuration / 1000).toFixed(2)}s`,
            `------------------------------------------------`,
            stepsReport,
            `------------------------------------------------`,
            `Environment Info:`,
            `- ${env}`,
            `================================================`,
            `Result: ${finalStatus}`,
            failedStep ? `Failed step: ${failedStep[0]}\nError: ${failedStep[1].error || 'timeout'}` : '',
        ].filter(Boolean).join('\n');
    }

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
            import('@sentry/react')
                .then((Sentry) => {
                    Sentry.captureMessage(`Boot Fatal: ${entry.phase} - ${entry.message}`, 'error');
                })
                .catch(() => {});
        } else {
            console.warn(`[BootController][WARN]  ${entry.phase}: ${entry.message}`);
            import('@sentry/react')
                .then((Sentry) => {
                    Sentry.withScope((scope) => {
                        scope.setLevel('warning');
                        scope.setExtra('boot_phase', entry.phase);
                        scope.setExtra('boot_message', entry.message);
                        if (entry.error) scope.setExtra('boot_error', entry.error);
                        Sentry.captureMessage(`Boot Warning: ${entry.phase} - ${entry.message}`);
                    });
                })
                .catch(() => {});
        }
    }

    public getBootIssues(): Readonly<BootIssue[]> {
        return this.bootIssues;
    }

    public hasFatalIssues(): boolean {
        return this.bootIssues.some((i) => i.severity === 'fatal');
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

    public reset(): void {
        if (this.state === 'INIT' || this.state === 'LOAD') {
            console.warn('[BootController] reset() ignored: pipeline is actively booting.');
            return;
        }
        this.initPromise = null;
        this.errorText = null;
        this.bootIssues = [];
        this.remoteProfileData = null;
        this.vkUser = null;
        this.transition('INIT');
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
        this.subscribers.forEach((cb) => cb(this.state));
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
                    // Deferred execution: start loading but resolve immediately
                    this.loadOpponent().catch((e) => {
                        console.warn('[BootController] Background opponent loading failed:', e);
                    });
                    return;
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
        setNotInVk: (val: boolean) => void,
    ): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                this.bootStartTime = Date.now();
                this.startDiagnostic('BootController_Total_Init');
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

                // Start parallel asset preload in the background
                this.assetPreloadPromise = (async () => {
                    try {
                        const { AssetLoader } = await import('../engine/systems/AssetLoader');
                        const manifest = AssetLoader.createGameManifest();
                        await AssetLoader.getInstance().loadAssets(manifest);
                        console.log('[BootController] Parallel assets preloading completed successfully.');
                    } catch (e) {
                        console.warn('[BootController] Parallel assets preloading error:', e);
                    }
                })();

                // ── LOAD_PROFILE ───────────────────────────────────────────
                setLoadingText('Загрузка игрового профиля...');
                await this.execute({ type: 'LOAD_PROFILE', payload: { setInitError } });
                const { useGameStore } = await import('../store/useGameStore');
                const profileState = useGameStore.getState();

                // FATAL: no player identity — game cannot run without this
                if (!profileState.playerId) {
                    this.recordBootIssue({
                        phase: 'LOAD_PROFILE',
                        severity: 'fatal',
                        message: 'playerId is missing — player identity undefined',
                    });
                }
                // WARNING: cosmetic / non-critical fields
                if (!profileState.name) {
                    this.recordBootIssue({
                        phase: 'LOAD_PROFILE',
                        severity: 'warning',
                        message: 'name is missing — will use fallback',
                    });
                }
                if (!profileState.avatar) {
                    this.recordBootIssue({
                        phase: 'LOAD_PROFILE',
                        severity: 'warning',
                        message: 'avatar is missing — will use fallback',
                    });
                }
                if (!profileState.level) {
                    this.recordBootIssue({
                        phase: 'LOAD_PROFILE',
                        severity: 'warning',
                        message: 'level is 0/missing — defaulting to 1',
                    });
                }

                // ── LOAD_TELEMETRY ─────────────────────────────────────────
                setLoadingText('Анализ производительности устройства...');
                const { getDeviceProfile } = await import('../services/TelemetryService');
                try {
                    const profile = await getDeviceProfile();
                    console.log(
                        `[BootController] Device Profile loaded. OS: ${profile.os}, Refresh Rate: ${profile.refreshRate}Hz`,
                    );
                    if (!profileState.hasCustomSettings) {
                        const isMobileOrTablet =
                            profile.touchDevice || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
                        const recommendedFpsCap = isMobileOrTablet ? 60 : profile.refreshRate || 60;
                        useGameStore.setState({
                            fpsCap: recommendedFpsCap,
                            isSystemUpdate: true,
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
                    this.recordBootIssue({
                        phase: 'LOAD_QUESTS',
                        severity: 'warning',
                        message: 'dailyQuests is empty after LOAD_QUESTS',
                    });
                }

                // ── LOAD_OPPONENT (Deferred) ──────────────────────────────
                setLoadingText('Инициализация подбора игроков...');
                await this.execute({ type: 'LOAD_OPPONENT' });

                // ── LOAD_CONFIG ────────────────────────────────────────────
                setLoadingText('Синхронизация игрового конфига...');
                await this.execute({ type: 'LOAD_CONFIG' });

                // ── LOAD_WEATHER ───────────────────────────────────────────
                setLoadingText('Определение погодных условий...');
                await this.execute({ type: 'LOAD_WEATHER' });
                const weatherState = useGameStore.getState();
                const weatherMap: Record<string, string> = {
                    forest: 'rain',
                    desert: 'sandstorm',
                    lava: 'ashfall',
                    snow: 'blizzard',
                    meadow: 'clear',
                };
                if (
                    !(
                        weatherState.activeMapId &&
                        weatherState.battleWeatherState &&
                        weatherMap[weatherState.activeMapId] === weatherState.battleWeatherState
                    )
                ) {
                    // WARNING only — weather is non-critical cosmetic state
                    this.recordBootIssue({
                        phase: 'LOAD_WEATHER',
                        severity: 'warning',
                        message: `Weather mismatch: map=${weatherState.activeMapId}, got=${weatherState.battleWeatherState}`,
                    });
                }

                // ── PRECOMPUTE_HUD ─────────────────────────────────────────
                setLoadingText('Подготовка интерфейса...');
                await this.execute({ type: 'PRECOMPUTE_HUD' });
                const hudState = useGameStore.getState();
                const { getRankInfo } = await import('../configs/RankSystem');
                const rankInfo = getRankInfo(hudState.rating || hudState.trophies || 0);
                const avatarMatches =
                    hudState.hudPlayerAvatar === hudState.avatar ||
                    (hudState.avatar &&
                        hudState.avatar.startsWith('sprite:') &&
                        hudState.hudPlayerAvatar ===
                            (hudState.vkUser?.photo200 ||
                                hudState.vkUser?.photo_200 ||
                                hudState.vkUser?.photo ||
                                '/assets/images/avatars/panda.webp'));
                const rankMatches = hudState.hudPlayerRank && hudState.hudPlayerRank.name === rankInfo.name;
                const opponentResolved =
                    !hudState.activeRankedOpponent ||
                    (hudState.hudEnemyLevel === hudState.activeRankedOpponent.level &&
                        hudState.hudEnemyRating === hudState.activeRankedOpponent.rating);
                if (!(avatarMatches && rankMatches && opponentResolved)) {
                    // WARNING only — HUD values are cosmetic, game can recover them
                    this.recordBootIssue({
                        phase: 'PRECOMPUTE_HUD',
                        severity: 'warning',
                        message: 'HUD derived values have inconsistencies',
                    });
                }

                // ── SESSION CHECK ──────────────────────────────────────────
                const finalState = useGameStore.getState();
                if (!finalState.sessionToken) {
                    // FATAL — session is required for sync and security
                    this.recordBootIssue({
                        phase: 'CREATE_SESSION',
                        severity: 'fatal',
                        message: 'sessionToken is missing — session was not created',
                    });
                }

                // ── READY GATE ─────────────────────────────────────────────
                // READY is only allowed if no fatal issues were recorded
                if (this.hasFatalIssues()) {
                    const fatalIssues = this.bootIssues.filter((i) => i.severity === 'fatal');
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
                    throw new Error(
                        `[BootController] Boot blocked by ${fatalIssues.length} fatal issue(s): ${fatalIssues.map((i) => i.message).join(' | ')}`,
                    );
                }

                // All non-fatal — proceed to READY
                setLoadingText('Инициализация игровых систем...');
                await this.execute({ type: 'INITIALIZE_SYSTEMS', payload: { container } });
                this.endDiagnostic('BootController_Total_Init', 'SUCCESS');

                if (window.location.search.includes('debugStartup=true')) {
                    console.log(this.getDiagnosticSummary());
                } else {
                    this.printDiagnosticReport();
                }
            } catch (err: any) {
                console.error('[BootController] Fatal boot error:', err);
                this.endDiagnostic('BootController_Total_Init', 'ERROR', err.message || String(err));

                const report = this.getDiagnosticSummary();
                if (window.location.search.includes('debugStartup=true')) {
                    console.error(report);
                    this.errorText = `${err.message || 'Ошибка запуска игры'}\n\n${report}`;
                } else {
                    this.printDiagnosticReport();
                    this.errorText = err.message || 'Ошибка запуска игры';
                }

                this.initPromise = null;
                this.remoteProfileData = null;
                // Capture full root cause report
                let snap: any = {};
                try {
                    const { useGameStore } = await import('../store/useGameStore');
                    const s = useGameStore.getState();
                    snap = {
                        playerId: s.playerId,
                        name: s.name,
                        level: s.level,
                        sessionToken: s.sessionToken,
                        dailyQuestsCount: s.dailyQuests?.length ?? 0,
                    };
                } catch (_) {}
                const rootCause = {
                    phase: this.state,
                    error: err instanceof Error ? err.stack : JSON.stringify(err),
                    bootIssues: this.bootIssues,
                    stateSnapshot: snap,
                };
                console.error('BOOT FAILURE ROOT CAUSE:', rootCause);
                this.transition('FAILED');
                setInitError(this.errorText ?? 'Ошибка запуска игры');
                return;
            }
        })();

        return this.initPromise;
    }

    public async resolveVK(setNotInVk: (val: boolean) => void, _setInitError: (err: string) => void): Promise<void> {
        // fetchWithRetry is now defined globally in this file

        // Helper for getting VK user info with retries
        const getVkUserInfoWithRetry = async (retries: number = 5, delay: number = 2000): Promise<any> => {
            let lastErr: any = null;
            for (let i = 0; i < retries; i++) {
                try {
                    const user = await getVkUserInfo();
                    if (user) return user;
                    throw new Error('VK getVkUserInfo returned null/empty user info');
                } catch (err) {
                    lastErr = err;
                    console.warn(`[BootController] VK user info attempt ${i + 1}/${retries} failed:`, err);
                    if (i < retries - 1) {
                        const backoff = delay * Math.pow(1.5, i);
                        await new Promise((resolve) => setTimeout(resolve, backoff));
                    }
                }
            }
            throw lastErr || new Error('Failed to get VK user info after retries');
        };

        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.protocol === 'file:';

        // 1. Calibrate time in parallel
        const timePromise = (async () => {
            this.startDiagnostic('/api/time');
            try {
                const start = Date.now();
                const response = await fetchWithRetry(
                    '/api/time',
                    {
                        method: 'GET',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(10000),
                    },
                    2,
                    1500,
                );
                const data = await response.json();
                if (data.serverTime) {
                    const latency = (Date.now() - start) / 2;
                    this.timeOffset = data.serverTime + latency - Date.now();
                    console.log('[BootController] Calibrated server time offset:', this.timeOffset);
                    TimeService.setOffset(this.timeOffset);
                }
                this.endDiagnostic('/api/time', 'SUCCESS');
            } catch (e: any) {
                console.warn('[BootController] Calibrate time failed, falling back to local clock');
                this.endDiagnostic('/api/time', 'ERROR', e.message || String(e));
            }
        })();

        // 2. Verify signature in parallel (skipped on localhost)
        const verifyPromise = (async () => {
            if (isLocalhost) {
                console.log('[BootController] Localhost detected, skipping signature verify');
                return;
            }
            this.startDiagnostic('/api/verify-sign');
            try {
                const searchParams = window.location.search;
                const url = `/api/verify-sign${searchParams}`;

                // Perform first fetch attempt manually to inspect the status code
                let response: Response;
                try {
                    response = await fetch(url, {
                        signal: AbortSignal.timeout(15000),
                    });
                } catch (fetchErr) {
                    // If network error, we can retry using fetchWithRetry
                    response = await fetchWithRetry(
                        url,
                        {
                            signal: AbortSignal.timeout(15000),
                        },
                        2, // 2 retries left
                        2000,
                    );
                }

                // If missing VK params (status 400) -> always show NotInVkScreen
                if (response.status === 400) {
                    setNotInVk(true);
                    throw new Error('Standalone launch restricted');
                }

                // If not 400 but still not ok (e.g. 500, etc.), we retry
                if (!response.ok) {
                    response = await fetchWithRetry(
                        url,
                        {
                            signal: AbortSignal.timeout(15000),
                        },
                        2,
                        2000,
                    );
                }

                const data = await response.json();
                if (data && data.valid === false) {
                    throw new Error('Invalid signature');
                }
                this.endDiagnostic('/api/verify-sign', 'SUCCESS');
            } catch (err: any) {
                this.endDiagnostic('/api/verify-sign', 'ERROR', err.message || String(err));
                if (
                    err.message === 'Standalone launch restricted' ||
                    err.message?.includes('status 400')
                ) {
                    setNotInVk(true);
                    throw new Error('Standalone launch restricted');
                }
                throw new Error(
                    'Ошибка безопасности: параметры запуска не прошли верификацию. Пожалуйста, перезапустите игру из официального приложения ВКонтакте.',
                );
            }
        })();

        // 3. VK initialization and profile fetch
        const vkPromise = (async () => {
            this.startDiagnostic('VKWebAppInit');
            try {
                await initVK();
                this.endDiagnostic('VKWebAppInit', 'SUCCESS');
            } catch (e: any) {
                this.endDiagnostic('VKWebAppInit', 'ERROR', e.message || String(e));
            }

            try {
                initTelemetry();
            } catch (e) {
                console.error('Failed to init telemetry:', e);
            }

            if (isLocalhost) {
                return;
            }

            this.startDiagnostic('VKWebAppGetUserInfo');
            try {
                this.vkUser = await getVkUserInfoWithRetry(3, 1500);
                if (!this.vkUser) {
                    throw new Error('VK getVkUserInfo returned empty object');
                }
                this.endDiagnostic('VKWebAppGetUserInfo', 'SUCCESS');
            } catch (vkErr: any) {
                this.endDiagnostic('VKWebAppGetUserInfo', 'ERROR', vkErr.message || String(vkErr));
                console.warn('[BootController] getVkUserInfo failed, falling back to URL parameters:', vkErr);
                const searchParams = new URLSearchParams(window.location.search);
                const urlVkUserId = searchParams.get('vk_user_id');
                if (urlVkUserId) {
                    this.vkUser = {
                        id: urlVkUserId,
                        firstName: 'Игрок',
                        lastName: '',
                        photo: '/assets/images/avatars/panda.webp',
                        photo200: '/assets/images/avatars/panda.webp',
                    };
                } else {
                    const { isVkMiniApp } = await import('../utils/VKBridge');
                    if (isVkMiniApp()) {
                        throw new Error(
                            'Не удалось получить ваш профиль ВКонтакте и отсутствуют параметры запуска. Проверьте интернет-подключение и попробуйте снова.',
                        );
                    } else {
                        setNotInVk(true);
                        throw new Error('Standalone launch restricted');
                    }
                }
            }

            if (this.vkUser) {
                const { useGameStore } = await import('../store/useGameStore');
                useGameStore.setState({ vkUser: this.vkUser, isSystemUpdate: true });
                if (this.vkUser.photo200 || this.vkUser.photo) {
                    useGameStore.setState({ avatar: this.vkUser.photo200 || this.vkUser.photo, isSystemUpdate: true });
                }
            }
        })();

        // Timeout fallback for VK Bridge request
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            'Время ожидания ответа от VK Bridge истекло. Пожалуйста, проверьте соединение с интернетом.',
                        ),
                    ),
                25000,
            ),
        );

        // Await all parallel promises with fallback recovery
        try {
            await Promise.all([timePromise, verifyPromise, Promise.race([vkPromise, timeoutPromise])]);
        } catch (err: any) {
            console.warn('[BootController] resolveVK encountered an error/timeout, attempting URL fallback:', err);
            const searchParams = new URLSearchParams(window.location.search);
            const urlVkUserId = searchParams.get('vk_user_id');
            if (urlVkUserId) {
                console.log('[BootController] Recovering session using URL parameter vk_user_id:', urlVkUserId);
                this.vkUser = {
                    id: urlVkUserId,
                    firstName: 'Игрок',
                    lastName: '',
                    photo: '/assets/images/avatars/panda.webp',
                    photo200: '/assets/images/avatars/panda.webp',
                };
                const { useGameStore } = await import('../store/useGameStore');
                useGameStore.setState({ vkUser: this.vkUser, isSystemUpdate: true });
                if (this.vkUser.photo200 || this.vkUser.photo) {
                    useGameStore.setState({ avatar: this.vkUser.photo200 || this.vkUser.photo, isSystemUpdate: true });
                }
                // Ensure other critical tasks (like verifyPromise) are resolved
                await Promise.all([timePromise, verifyPromise]);
            } else {
                throw err;
            }
        }

        // Set explicit authState for debug/telemetry/security observability
        const { useGameStore } = await import('../store/useGameStore');
        useGameStore.setState({
            authState: {
                vkVerified: !isLocalhost,
                verifiedAt: Date.now(),
                source: isLocalhost ? 'localhost' : 'signature',
            },
            isSystemUpdate: true,
        });
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

        const maxAttempts = 2; // Always attempt twice to prevent transient glitches from dropping into offline mode

        this.startDiagnostic('Firestore_LoadProfile');
        let remoteResult = null;
        let loadError = null;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                remoteResult = await syncService.loadPlayerData(this.userId);
                this.endDiagnostic('Firestore_LoadProfile', 'SUCCESS');
                break;
            } catch (err: any) {
                loadError = err;
                console.warn(`[BootController] Failed to load remote profile, attempt ${i + 1}/${maxAttempts}...`, err);
                if (i < maxAttempts - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
            }
        }

        try {
            if (!remoteResult && loadError) {
                this.endDiagnostic('Firestore_LoadProfile', 'ERROR', loadError.message || String(loadError));
                throw loadError;
            }

            // Read raw local storage cache
            const cacheRaw = safeGetItem('game-storage');
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
                stateToRestore.isOfflineSession = false;

                // Reset and apply remote profile
                useGameStore.getState().resetStore();
                stateToRestore.isSystemUpdate = true;
                useGameStore.setState(stateToRestore);
            } else if (cacheState && cacheState.lastSavedTimestamp) {
                console.log('[BootController] No Firebase snapshot found, falling back to local cache.');
                useGameStore.getState().resetStore();
                cacheState.vkUser = this.vkUser;
                cacheState.isOfflineSession = true;
                cacheState.isSystemUpdate = true;
                useGameStore.setState(cacheState);
            } else {
                console.log('[BootController] New player profile creation.');
                useGameStore.getState().resetStore();
                const fallbackName =
                    this.vkUser?.firstName || this.vkUser?.first_name || `Игрок_${this.userId.slice(-4)}`;
                useGameStore.setState({
                    name: fallbackName,
                    onboardingCompleted: false,
                    tutorialStep: 0,
                    activeScreen: 'INTRO',
                    vkUser: this.vkUser,
                    isOfflineSession: false,
                    isSystemUpdate: true,
                });
            }
        } catch (error) {
            console.error('[BootController] Firebase snapshot load failed. Resolving to cache fallback.', error);
            const cacheRaw = safeGetItem('game-storage');
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
                cacheState.isOfflineSession = true;
                cacheState.isSystemUpdate = true;
                useGameStore.setState(cacheState);
            } else {
                throw new Error(
                    'Критическая ошибка: не удалось получить данные профиля из сети и отсутствует локальное сохранение.',
                );
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
            isSystemUpdate: true,
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
            console.debug('[BootController] Admin status GRANTED via hardcoded Player ID bypass');
            return true;
        }

        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();

        // 2. Hardcoded VK ID bypass
        const userVkId = this.vkUser?.id || this.vkUser?.uid || state.vkUser?.id || state.vkUser?.uid;
        if (userVkId && Number(userVkId) === 212359386) {
            console.debug('[BootController] Admin status GRANTED via hardcoded VK ID bypass');
            return true;
        }

        // 3. Localhost bypass
        if (isLocalhost) {
            console.debug('[BootController] Admin status GRANTED via localhost bypass');
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
                    console.debug('[BootController] Admin status GRANTED via Firestore whitelist');
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
            playerId = vkUser?.id
                ? `VK-${vkUser.id}`
                : `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
            isSystemUpdate: true,
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
                isSystemUpdate: true,
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
                isSystemUpdate: true,
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
            state.lossStreak || 0,
            true, // forceBot = true during startup to load immediately without network delay
        );

        useGameStore.setState({
            activeRankedOpponent: opponent,
            isSystemUpdate: true,
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
            meadow: 'clear',
        };

        let weather = weatherMap[activeMapId];
        let weatherSource = 'map';
        if (!weather) {
            console.warn(`[BootController] Weather mapping missing for map: ${activeMapId}, fallback to clear`);
            this.recordBootIssue({
                phase: 'LOAD_WEATHER',
                severity: 'warning',
                message: `Weather mapping missing for map: ${activeMapId}, fallback to clear`,
            });
            weather = 'clear';
            weatherSource = 'fallback_unknown_map';
        }

        useGameStore.setState({
            activeMapId,
            battleWeatherState: weather,
            weatherSource,
            isSystemUpdate: true,
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

        const playerAvatar =
            rawAvatar && !rawAvatar.startsWith('sprite:')
                ? rawAvatar
                : vkUser?.photo200 || vkUser?.photo_200 || vkUser?.photo || '/assets/images/avatars/panda.webp';

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
        let enemyAvatar = '/assets/images/avatars/panda.webp';
        if (state.battleMode === 'PVE' && state.activePveEnemy) {
            enemyAvatar = state.activePveEnemy.image || '/assets/images/avatars/panda.webp';
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
            isSystemUpdate: true,
        });
    }

    public async calibrateTime(): Promise<void> {
        try {
            const start = Date.now();
            const response = await fetchWithRetry(
                '/api/time',
                {
                    method: 'GET',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(5000),
                },
                2,
                1000,
            );
            const data = await response.json();
            if (data.serverTime) {
                const latency = (Date.now() - start) / 2;
                this.timeOffset = data.serverTime + latency - Date.now();
                console.log('[BootController] Re-calibrated server time offset:', this.timeOffset);
                TimeService.setOffset(this.timeOffset);
            }
        } catch (e) {
            console.warn('[BootController] Re-calibrate time failed:', e);
        }
    }

    public async ready(container: HTMLElement): Promise<void> {
        // Wait for parallel asset preloading to complete if it was started
        if (this.assetPreloadPromise) {
            await this.assetPreloadPromise;
        }

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
        syncService.syncPlayerData().catch((err) => {
            console.warn('[BootController] Initial sync failed (continuing in background):', err);
        });
        this.needPostBootSync = false;

        // syncService.startAutoSync(60000); // Disabled periodic auto-sync in favor of event-based sync and beaconFlush

        const duration = Date.now() - this.bootStartTime;
        console.log(`[Performance] 🚀 Game successfully booted. Total loading time: ${duration}ms`);

        // Рекалибровка времени при возвращении во вкладку (защита от накрутки временем в фоне)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    console.log('[BootController] Tab active, re-calibrating offset...');
                    this.calibrateTime().then(() => {
                        try {
                            useGameStore.getState().regenerateEnergy?.();
                        } catch (err) {
                            console.warn('[BootController] Auto-regen failed:', err);
                        }
                    });
                }
            });
        }
    }
}

export const bootController = BootController.getInstance();
if (typeof window !== 'undefined') {
    (window as any).bootController = bootController;
}
