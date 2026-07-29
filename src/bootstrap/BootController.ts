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
    | { type: 'LOAD_PROFILE'; payload: { setInitError: (err: string) => void; resolveVkPromise?: Promise<void> } }
    | { type: 'LOAD_DERIVED_DATA' }
    | { type: 'LOAD_OPPONENT' }
    | { type: 'LOAD_CONFIG' }
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
            console.log(
                `[BootController] Fetch ${url} (Attempt ${i + 1}/${retries}) resolved in ${duration}ms. Status: ${response.status} (${response.statusText})`,
            );
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

    // ── Diagnostic system ──────────────────────────────────────────────────
    public bootMode: BootMode = 'STRICT';
    private bootIssues: BootIssue[] = [];
    private diagnostics: Record<
        string,
        { start: number; end?: number; duration?: number; status?: string; error?: string }
    > = {};

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
            console.log(
                `[Diagnostics] 🏁 Step ${step} completed in ${diag.duration}ms. Status: ${status}${errorMsg ? ` (Error: ${errorMsg})` : ''}`,
            );
        }
    }

    public printDiagnosticReport(): void {
        console.log('[Diagnostics] 📊 STARTUP PERFORMANCE REPORT:');
        Object.entries(this.diagnostics).forEach(([step, data]) => {
            console.log(
                ` - ${step.padEnd(25)}: ${String(data.duration ?? 'Pending/Timeout').padStart(6)}ms | Status: ${data.status || 'UNKNOWN'} | Error: ${data.error || '-'}`,
            );
        });
    }

    public getDiagnosticSummary(): string {
        const totalDuration = Date.now() - this.bootStartTime;
        const stepsReport = Object.entries(this.diagnostics)
            .map(([step, data]) => {
                const dur = data.duration !== undefined ? `${(data.duration / 1000).toFixed(2)}s` : 'Timeout/Pending';
                return `${step.padEnd(22)}: ${data.status === 'SUCCESS' ? 'OK' : 'FAILED'} (${dur})${data.error ? ` - Error: ${data.error}` : ''}`;
            })
            .join('\n');

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
        ]
            .filter(Boolean)
            .join('\n');
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
                    if (this.state !== 'INIT' && this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for RESOLVE_VK: ${this.state}`);
                    }
                    return await this.resolveVK(action.payload.setNotInVk, action.payload.setInitError);
                }
                case 'CREATE_SESSION': {
                    if (this.state !== 'INIT' && this.state !== 'LOAD') {
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
                    return await this.loadProfile(action.payload.setInitError, action.payload.resolveVkPromise);
                }
                case 'LOAD_DERIVED_DATA': {
                    if (this.state !== 'LOAD') {
                        throw new Error(`[BootController] Invalid boot phase for LOAD_DERIVED_DATA: ${this.state}`);
                    }
                    return await this.loadDerivedData();
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
                await this.runAction({ type: 'HYDRATE' });

                // Resolve player ID and prefixed userId immediately so we can fire Firestore load in parallel
                const { useGameStore } = await import('../store/useGameStore');
                const storeState = useGameStore.getState();
                let initialPlayerId = storeState.playerId;
                if (!initialPlayerId || initialPlayerId === 'undefined' || initialPlayerId === 'null') {
                    initialPlayerId = `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    useGameStore.setState({ playerId: initialPlayerId, isSystemUpdate: true });
                }
                const searchParams = new URLSearchParams(window.location.search);
                const urlVkUserId = searchParams.get('vk_user_id');
                if (urlVkUserId) {
                    this.userId = `VK-${urlVkUserId}`;
                } else {
                    this.userId = initialPlayerId;
                }

                // ── PHASE 2: LOAD (Parallelized Boot) ───────────────────────
                this.transition('LOAD');
                const t0 = performance.now();

                // 1. VK resolution & Session Creation
                const resolveVkPromise = (async () => {
                    setLoadingText('Авторизация и подключение к VK Bridge...');
                    const vkStart = performance.now();
                    await this.runAction({ type: 'RESOLVE_VK', payload: { setNotInVk, setInitError } });
                    console.log(`[BOOT] VK init & auth: ${(performance.now() - vkStart).toFixed(1)}ms`);
                    setLoadingText('Создание сессионного контекста...');
                    const sessStart = performance.now();
                    await this.runAction({ type: 'CREATE_SESSION' });
                    console.log(`[BOOT] Session creation: ${(performance.now() - sessStart).toFixed(1)}ms`);
                })();

                // 2. Firestore Load Profile (Network-bound) - starts immediately in parallel, awaits VK resolution to finalize
                const profilePromise = (async () => {
                    setLoadingText('Загрузка игрового профиля...');
                    const profStart = performance.now();
                    await this.runAction({
                        type: 'LOAD_PROFILE',
                        payload: { setInitError, resolveVkPromise },
                    });
                    console.log(`[BOOT] Profile Load: ${(performance.now() - profStart).toFixed(1)}ms`);
                })();

                // 3. Pixi Engine Warmup (GPU-bound)
                const enginePromise = (async () => {
                    setLoadingText('Запуск игрового движка...');
                    const engStart = performance.now();
                    await this.initializeEngine(container);
                    console.log(`[BOOT] Engine & Assets: ${(performance.now() - engStart).toFixed(1)}ms`);
                })();

                await Promise.all([resolveVkPromise, profilePromise, enginePromise]);
                console.log(`[BOOT] Total parallel load phase: ${(performance.now() - t0).toFixed(1)}ms`);

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

                // ── LOAD_TELEMETRY (Deferred — не блокирует READY) ────────
                // Запускаем фоново: не нужен до появления главного меню
                Promise.resolve().then(async () => {
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
                }).catch(() => {});

                // ── LOAD_OPPONENT (Deferred — фоново) ────────────────────
                // Матчмейкинг не нужен для первого рендера главного меню
                Promise.resolve().then(async () => {
                    await this.execute({ type: 'LOAD_OPPONENT' });
                }).catch((e) => {
                    console.warn('[BootController] Background opponent loading failed:', e);
                });

                // ── LOAD_CONFIG (Deferred — фоново) ──────────────────────
                // Конфиг синхронизируется после появления UI — не критично для загрузки
                Promise.resolve().then(async () => {
                    await this.execute({ type: 'LOAD_CONFIG' });
                }).catch((e) => {
                    console.warn('[BootController] Background config sync failed:', e);
                });

                // ── LOAD_DERIVED_DATA ──────────────────────────────────────
                // Остаётся в критическом пути — нужен для HUD (квесты, ранг, аватар)
                setLoadingText('Подготовка интерфейса и квестов...');
                await this.execute({ type: 'LOAD_DERIVED_DATA' });


                // Validate derived state
                const finalState = useGameStore.getState();
                if (!(finalState.dailyQuests && finalState.dailyQuests.length > 0)) {
                    this.recordBootIssue({
                        phase: 'LOAD_QUESTS',
                        severity: 'warning',
                        message: 'dailyQuests is empty after LOAD_DERIVED_DATA',
                    });
                }
                const weatherMap: Record<string, string> = {
                    forest: 'rain',
                    desert: 'sandstorm',
                    lava: 'ashfall',
                    snow: 'blizzard',
                    meadow: 'clear',
                };
                if (
                    !(
                        finalState.activeMapId &&
                        finalState.battleWeatherState &&
                        weatherMap[finalState.activeMapId] === finalState.battleWeatherState
                    )
                ) {
                    this.recordBootIssue({
                        phase: 'LOAD_WEATHER',
                        severity: 'warning',
                        message: `Weather mismatch: map=${finalState.activeMapId}, got=${finalState.battleWeatherState}`,
                    });
                }
                const { getRankInfo } = await import('../configs/RankSystem');
                const rankInfo = getRankInfo(finalState.rating || finalState.trophies || 0);
                const avatarMatches =
                    finalState.hudPlayerAvatar === finalState.avatar ||
                    (finalState.avatar &&
                        finalState.avatar.startsWith('sprite:') &&
                        finalState.hudPlayerAvatar ===
                            (finalState.vkUser?.photo200 ||
                                finalState.vkUser?.photo_200 ||
                                finalState.vkUser?.photo ||
                                '/assets/images/avatars/panda.webp'));
                const rankMatches = finalState.hudPlayerRank && finalState.hudPlayerRank.name === rankInfo.name;
                const opponentResolved =
                    !finalState.activeRankedOpponent ||
                    (finalState.hudEnemyLevel === finalState.activeRankedOpponent.level &&
                        finalState.hudEnemyRating === finalState.activeRankedOpponent.rating);
                if (!(avatarMatches && rankMatches && opponentResolved)) {
                    this.recordBootIssue({
                        phase: 'PRECOMPUTE_HUD',
                        severity: 'warning',
                        message: 'HUD derived values have inconsistencies after LOAD_DERIVED_DATA',
                    });
                }

                // ── SESSION CHECK ──────────────────────────────────────────
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

                // All non-fatal — proceed to finalize startup and transition to READY
                setLoadingText('Инициализация игровых систем...');
                await this.finalizeStartup();
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
        // Each individual bridge.send() is capped at 3 seconds to prevent silent hangs
        const getVkUserInfoWithRetry = async (retries: number = 5, delay: number = 2000): Promise<any> => {
            let lastErr: any = null;
            for (let i = 0; i < retries; i++) {
                try {
                    // Wrap each VKWebAppGetUserInfo call with a 3-second timeout.
                    // Without this, a stalled Bridge hangs the entire boot silently.
                    let timeoutId: ReturnType<typeof setTimeout>;
                    const user = await Promise.race([
                        getVkUserInfo(),
                        new Promise<null>((_, reject) => {
                            timeoutId = setTimeout(() => reject(new Error('VKWebAppGetUserInfo timed out (3s)')), 3000);
                        }),
                    ]);
                    clearTimeout(timeoutId!);
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

        // 2. Verify signature in parallel (skipped on localhost, but auth token is fetched)
        const verifyPromise = (async () => {
            if (!isLocalhost) {
                console.log('[DEBUG VK PARAMS]', {
                    launchParams: window.location.search,
                    location: window.location.href,
                    search: window.location.search,
                    hash: window.location.hash,
                });
                this.startDiagnostic('/api/verify-sign');
                try {
                    const searchParams = window.location.search;
                    const url = `/api/verify-sign${searchParams}`;

                    // Perform first fetch attempt manually to inspect the status code
                    let response: Response;
                    try {
                        response = await fetch(url, {
                            signal: AbortSignal.timeout(3500),
                        });
                    } catch (fetchErr) {
                        // If network error, retry once with short timeout
                        response = await fetchWithRetry(
                            url,
                            {
                                signal: AbortSignal.timeout(3500),
                            },
                            1,
                            1000,
                        );
                    }

                    // Only 403 (Forbidden) indicates an explicit security signature rejection
                    if (response.status === 403) {
                        throw new Error('SECURITY_ERROR: status 403 Forbidden');
                    }

                    // For other non-OK statuses (e.g., 400 missing sign, 500 server issue), retry once
                    if (!response.ok) {
                        response = await fetchWithRetry(
                            url,
                            {
                                signal: AbortSignal.timeout(3500),
                            },
                            1,
                            1000,
                        );
                    }

                    if (response.status === 403) {
                        throw new Error('SECURITY_ERROR: status 403 Forbidden');
                    }

                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.valid === false) {
                            throw new Error('SECURITY_ERROR: Invalid signature');
                        }
                        this.endDiagnostic('/api/verify-sign', 'SUCCESS');
                    } else {
                        console.warn(`[BootController] verify-sign returned status ${response.status}, falling back to URL launch params.`);
                    }
                } catch (err: any) {
                    this.endDiagnostic('/api/verify-sign', 'ERROR', err.message || String(err));
                    
                    const errMsg = err.message || '';
                    if (
                        errMsg.includes('SECURITY_ERROR') ||
                        errMsg.includes('status 403') ||
                        errMsg === 'Invalid signature'
                    ) {
                        setNotInVk(true);
                        throw new Error('Standalone launch restricted');
                    }
                    
                    console.warn('[BootController] Non-fatal signature verify issue, continuing via URL fallback:', errMsg);
                }
            } else {
                console.log('[BootController] Localhost detected, skipping signature verify. Moving directly to auth-token fetch.');
            }

        })();

        // 3. Obtain Firebase Custom Auth Token and authenticate the client in parallel
        const authTokenPromise = (async () => {
            try {
                console.log('[BootController] Requesting Custom Auth Token...');
                const queryParams = isLocalhost 
                    ? `?vk_user_id=${this.userId.replace('VK-', '')}` 
                    : window.location.search;
                const tokenRes = await fetchWithRetry(
                    `/api/auth-token${queryParams}`,
                    {
                        method: 'GET',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(3500),
                    },
                    1,
                    1000,
                );
                const tokenData = await tokenRes.json();
                if (tokenData && tokenData.token) {
                    let firebaseAuthSuccess = false;
                    try {
                        const { auth } = await import('../utils/firebase');
                        const { signInWithCustomToken } = await import('firebase/auth');
                        let timeoutId: ReturnType<typeof setTimeout>;
                        await Promise.race([
                            signInWithCustomToken(auth, tokenData.token),
                            new Promise((_, reject) => {
                                timeoutId = setTimeout(() => reject(new Error('Firebase signInWithCustomToken timed out (2.5s)')), 2500);
                            }),
                        ]);
                        clearTimeout(timeoutId!);
                        firebaseAuthSuccess = true;
                        console.log(`[BootController] Firebase client authenticated successfully: ${firebaseAuthSuccess}`);
                    } catch (clientAuthErr: any) {
                        firebaseAuthSuccess = false;
                        console.warn('[BootController] Firebase client SDK auth timed out/failed (TSPU/Direct Google API restriction). Continuing via Vercel Serverless API proxy:', clientAuthErr.message || clientAuthErr);
                    }
                } else {
                    console.warn('[BootController] Custom Auth Token not provided. Continuing via Vercel Serverless API proxy.');
                }
            } catch (err: any) {
                console.warn('[BootController] Auth Token fetch failed. Continuing via Vercel Serverless API proxy:', err.message || err);
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

            const searchParams = new URLSearchParams(window.location.search);
            const urlVkUserId = searchParams.get('vk_user_id');
            try {
                // If urlVkUserId is present, 1 attempt (2s) is enough to fetch name/photo before using URL fallback
                this.vkUser = await getVkUserInfoWithRetry(urlVkUserId ? 1 : 2, 1000);
                if (!this.vkUser) {
                    throw new Error('VK getVkUserInfo returned empty object');
                }
                this.endDiagnostic('VKWebAppGetUserInfo', 'SUCCESS');
            } catch (vkErr: any) {
                this.endDiagnostic('VKWebAppGetUserInfo', 'ERROR', vkErr.message || String(vkErr));
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
                } else if (isVkMiniApp()) {
                    throw new Error(
                        'Не удалось получить параметры запуска ВКонтакте. Пожалуйста, проверьте соединение и попробуйте снова.',
                    );
                } else {
                    setNotInVk(true);
                    throw new Error('Standalone launch restricted');
                }
            }

            // Note: vkUser and avatar are assigned to class properties and will be batched into the final setState at the end of resolveVK
        })();

        let mainTimeoutId: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
            mainTimeoutId = setTimeout(
                () =>
                    reject(
                        new Error(
                            'Время ожидания ответа от VK Bridge истекло. Пожалуйста, проверьте соединение с интернетом.',
                        ),
                    ),
                25000,
            );
        });

        // Await all parallel promises with fallback recovery
        try {
            await Promise.all([timePromise, verifyPromise, authTokenPromise, Promise.race([vkPromise, timeoutPromise])]);
            clearTimeout(mainTimeoutId!);
        } catch (err: any) {
            clearTimeout(mainTimeoutId!);
            // Distinguish between two classes of errors:
            //   1. Security error — server explicitly rejected the VK signature → block boot
            //   2. Network error  — signature endpoint unreachable / timeout → URL fallback is safe
            //
            // VK moderation requirement: an app must NOT continue with an unverified identity
            // when the backend deliberately signals that the signature is invalid.
            const isSecurityError = ((): boolean => {
                const msg = (err?.message || '').toLowerCase();
                return (
                    msg.includes('ошибка безопасности') ||
                    msg.includes('security_error') ||
                    msg.includes('invalid signature') ||
                    msg.includes('forbidden') ||
                    msg.includes('status 403') ||
                    msg.includes('status 401') ||
                    msg.includes('status 400') ||
                    msg.includes('restricted')
                );
            })();

            if (isSecurityError) {
                console.error('[BootController] Security error from verify-sign — blocking boot with unverified identity:', err.message);
                setNotInVk(true);
                throw new Error('Standalone launch restricted');
            }

            // Network error path — safe to fall back to URL parameters
            console.warn('[BootController] resolveVK network error/timeout, attempting URL fallback:', err.message);
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
            } else {
                throw err;
            }
        }


        // Set explicit authState, vkUser, and avatar in a single batched state update
        const { useGameStore } = await import('../store/useGameStore');
        const finalPatch: any = {
            authState: {
                vkVerified: !isLocalhost,
                verifiedAt: Date.now(),
                source: isLocalhost ? 'localhost' : 'signature',
            },
            isSystemUpdate: true,
        };
        if (this.vkUser) {
            finalPatch.vkUser = this.vkUser;
            if (this.vkUser.photo200 || this.vkUser.photo) {
                finalPatch.avatar = this.vkUser.photo200 || this.vkUser.photo;
            }
        }

        // If the profile was created offline (new user, Firestore unreachable at boot time)
        // and VK has now resolved successfully, lift the offline flag and persist the profile.
        // This ensures a first-launch user's progress is not silently discarded.
        const wasOffline = useGameStore.getState().isOfflineSession;
        if (wasOffline && this.vkUser && !isLocalhost) {
            finalPatch.isOfflineSession = false;
            console.log('[BootController] VK resolved after offline profile creation — lifting offline flag and scheduling initial sync.');
        }

        useGameStore.setState(finalPatch);

        // Fire initial sync after lifting the offline flag so the new profile reaches Firestore.
        // Runs in background — does not block resolveVK or the boot pipeline.
        if (wasOffline && this.vkUser && !isLocalhost) {
            import('../services/SyncService').then(({ syncService }) => {
                syncService.syncPlayerData().catch((err) => {
                    console.warn('[BootController] Initial offline→online sync failed (will retry on next boot):', err);
                });
            }).catch(() => {});
        }
    }

    public async loadProfile(_setInitError: (err: string) => void, _resolveVkPromise?: Promise<void>): Promise<void> {
        const { syncService } = await import('../services/SyncService');
        const { useGameStore } = await import('../store/useGameStore');

        // FIX: Do NOT await resolveVkPromise before starting the Firestore load.
        // this.userId is already set from the URL vk_user_id param before the parallel phase
        // (see start() lines 405-411). Awaiting VK Bridge resolution here added up to 25 seconds
        // of unnecessary latency on slow networks / stalled Bridge.
        // The vkUser photo/name will be merged into the store by resolveVkPromise independently.
        // If VK resolves after us, fallbackProfileGenerator() will reconcile the name/avatar.
        console.log('[BootController] Starting profile load with pre-resolved userId:', this.userId);

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
                // Existing player: restore from local cache in offline mode
                useGameStore.getState().resetStore();
                cacheState.vkUser = this.vkUser;
                cacheState.isOfflineSession = true;
                cacheState.isSystemUpdate = true;
                useGameStore.setState(cacheState);
            } else {
                // FIX: New player without local cache — Firestore being unreachable is NOT fatal.
                // A first-time user (e.g. VK moderator) has no localStorage and no remote profile yet.
                // Throwing here caused a FAILED transition ~46s into boot, showing an error screen
                // instead of the game. We now create a default profile in memory so the game starts.
                console.warn(
                    '[BootController] No remote profile and no local cache. ' +
                    'Creating default new-player profile (Firestore unavailable or first launch).',
                );
                useGameStore.getState().resetStore();
                const fallbackName =
                    this.vkUser?.firstName || this.vkUser?.first_name || `Игрок_${this.userId.slice(-4)}`;
                useGameStore.setState({
                    name: fallbackName,
                    onboardingCompleted: false,
                    tutorialStep: 0,
                    activeScreen: 'INTRO',
                    vkUser: this.vkUser,
                    isOfflineSession: true,
                    isSystemUpdate: true,
                });
            }
        }

        // Apply profile fallback generator inside LOAD phase
        await this.fallbackProfileGenerator();

        // Calculate and apply admin status in the background to prevent network query from blocking startup
        const finalState = useGameStore.getState();
        this.resolveAdminStatus(finalState.playerId)
            .then((isAdmin) => {
                useGameStore.setState({
                    isAdmin,
                    isDeveloper: isAdmin,
                    isSystemUpdate: true,
                });
                console.log('[BootController] Background admin status resolved:', isAdmin);
            })
            .catch((err) => {
                console.warn('[BootController] Background admin status resolution failed:', err);
            });

        useGameStore.setState({
            profileStatus: 'loaded',
            isSystemUpdate: true,
        });
    }

    private async resolveAdminStatus(playerId: string): Promise<boolean> {
        const { useGameStore } = await import('../store/useGameStore');
        const state = useGameStore.getState();
        if (state.isAdmin) {
            return true;
        }

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

    private async loadDerivedData(): Promise<void> {
        const { useGameStore } = await import('../store/useGameStore');
        const { getRankInfo } = await import('../configs/RankSystem');
        const state = useGameStore.getState();

        const patch: any = { isSystemUpdate: true };

        // 1. Quests Setup
        const fbQuests = this.remoteProfileData?.dailyQuests;
        const fbBpQuests = this.remoteProfileData?.bpDailyQuests;
        const fbWeekly = this.remoteProfileData?.weeklyQuests;

        if (fbQuests && fbQuests.length > 0) {
            console.log('[BootController] Restoring quests from Firestore (Daily Quests Rule enforced).');
            patch.dailyQuests = fbQuests;
            patch.bpDailyQuests = fbBpQuests || [];
            patch.weeklyQuests = fbWeekly || [];
            patch.lastDailyRefresh = this.remoteProfileData.lastDailyRefresh || Date.now();
            patch.lastWeeklyQuestReset = this.remoteProfileData.lastWeeklyQuestReset || Date.now();
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

            patch.dailyQuests = selected;
            patch.bpDailyQuests = selectedBp;
            patch.weeklyQuests = weekly;
            patch.lastDailyRefresh = Date.now();
            patch.lastWeeklyQuestReset = Date.now();
        }

        // 2. Weather Setup
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
        patch.activeMapId = activeMapId;
        patch.battleWeatherState = weather;
        patch.weatherSource = weatherSource;

        // 3. HUD Setup
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

        patch.hudPlayerRank = playerRank;
        patch.hudPlayerAvatar = playerAvatar;
        patch.hudEnemyLevel = enemyLevel;
        patch.hudEnemyRating = enemyRating;
        patch.hudEnemyRank = enemyRank;
        patch.hudEnemyAvatar = enemyAvatar;
        patch.hudPrecomputed = true;

        useGameStore.setState(patch);
        console.log('[BootController] Quests, weather, and HUD updates batched and applied successfully.');
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

    private async initializeEngine(container: HTMLElement): Promise<void> {
        // Parallelize JS chunks downloads to completely eliminate the sequential round-trip waterfall (saves ~1000ms - 1500ms)
        const [
            { initGameSystems },
            { GameApp: GameAppClass },
            { AssetLoader },
            _initSubscriptions,
            _syncService,
            _useGameStore,
            _playerSnapshotService,
            _sceneManager,
            _mainScreen,
        ] = await Promise.all([
            import('./initGameSystems'),
            import('../GameApp'),
            import('../engine/systems/AssetLoader'),
            import('./initSubscriptions'),
            import('../services/SyncService'),
            import('../store/useGameStore'),
            import('../services/PlayerSnapshotService'),
            import('../engine/core/SceneManager'),
            import('../ui/screens/MainScreen'),
        ]);

        // Initialize Game Systems
        initGameSystems(this.timeOffset);

        // Initialize Pixi Engine — WebGL context must exist before PIXI.Assets can load anything
        const game = new GameAppClass();
        await game.init(container);

        // Preload core manifest assets and items atlas now that Pixi WebGL context is ready
        try {
            const manifest = AssetLoader.createGameManifest();
            await AssetLoader.getInstance().loadAssets(manifest);
            console.log('[BootController] Critical assets and item atlas preloading completed successfully.');
        } catch (e) {
            console.warn('[BootController] Critical assets preloading error:', e);
        }
    }

    private async finalizeStartup(): Promise<void> {
        const { initSubscriptions } = await import('./initSubscriptions');
        const { SyncService } = await import('../services/SyncService');
        const { useGameStore } = await import('../store/useGameStore');
        const { setupReferralAndGifts } = await import('./initGameSystems');

        const state = useGameStore.getState();
        const prefixedId = SyncService.getPrefixedUserId(state.vkUser, state.playerId);

        // Setup referral system and transition to READY status immediately
        setupReferralAndGifts();

        // Transition to READY status — game UI shows main menu instantly!
        this.transition('READY');

        // Setup real-time subscriptions asynchronously in background so boot is never blocked
        initSubscriptions(this.userId, prefixedId).catch((err) => {
            console.warn('[BootController] Non-critical background subscriptions init warning:', err);
        });

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

        const duration = Date.now() - this.bootStartTime;
        console.log(`[Performance] 🚀 Game successfully booted. Total loading time: ${duration}ms`);
        if (typeof window !== 'undefined' && (window as any).__bootStart) {
            const absoluteBoot = performance.now() - (window as any).__bootStart;
            console.log(`[METRIC] TOTAL_BOOT = ${absoluteBoot.toFixed(1)}ms`);
        }

        // ── BACKGROUND ASSET PRELOAD ─────────────────────────────────────
        // Запускаем после READY — загружаем фоны экранов и персонажей в фоне,
        // чтобы City/Forge/Arena открывались мгновенно из кеша браузера.
        try {
            const { AssetLoader } = await import('../engine/systems/AssetLoader');
            AssetLoader.getInstance().startBackgroundPreload();
            console.log('[BootController] Background asset preload initiated.');
        } catch (preloadErr) {
            console.warn('[BootController] Background asset preload failed to start:', preloadErr);
        }


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
